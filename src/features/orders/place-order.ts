import { sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { withCheckout } from "@/lib/db";
import { asPgError } from "@/lib/db/errors";
import { logger } from "@/lib/logger";
import { err, ok, type Result } from "@/lib/result";
import { productTag } from "@/features/catalog/tags";
import { storeTag } from "@/features/stores/storefront";
import { placeOrderSchema, type PlaceOrderInput } from "./schemas";

export type PlacedOrder = {
  readonly orderId: string;
  readonly number: number;
  readonly totalKobo: number;
};

export type PlaceOrderError =
  | { readonly code: "invalid_input"; readonly fields: readonly string[] }
  | { readonly code: "store_unavailable" }
  | { readonly code: "item_unavailable"; readonly items: readonly { variantId: string }[] }
  | {
      readonly code: "price_changed";
      readonly items: readonly { variantId: string; currentPriceKobo: number }[];
    }
  | {
      readonly code: "out_of_stock";
      readonly items: readonly { variantId: string; available: number }[];
    };

const placedSchema = z.object({
  order_id: z.uuid(),
  number: z.number().int(),
  total_kobo: z.number().int(),
  store_id: z.uuid(),
  store_slug: z.string(),
  product_ids: z.array(z.uuid()),
  existing: z.boolean(),
});

const detailSchemas = {
  RB002: z.array(z.object({ variant_id: z.uuid() })),
  RB003: z.array(z.object({ variant_id: z.uuid(), current_price_kobo: z.number().int() })),
  RB004: z.array(z.object({ variant_id: z.uuid(), available: z.number().int() })),
  RB005: z.array(z.object({ field: z.string() })),
};

const parseDetail = <S extends z.ZodType>(schema: S, detail: string | undefined) =>
  schema.parse(JSON.parse(detail ?? "[]")) as z.output<S>;

/** Maps a place_order SQLSTATE to the typed error, or undefined if it is not one. */
function toPlaceOrderError(error: unknown): PlaceOrderError | undefined {
  const pgError = asPgError(error);
  switch (pgError?.code) {
    case "RB001":
      return { code: "store_unavailable" };
    case "RB002":
      return {
        code: "item_unavailable",
        items: parseDetail(detailSchemas.RB002, pgError.detail).map((d) => ({
          variantId: d.variant_id,
        })),
      };
    case "RB003":
      return {
        code: "price_changed",
        items: parseDetail(detailSchemas.RB003, pgError.detail).map((d) => ({
          variantId: d.variant_id,
          currentPriceKobo: d.current_price_kobo,
        })),
      };
    case "RB004":
      return {
        code: "out_of_stock",
        items: parseDetail(detailSchemas.RB004, pgError.detail).map((d) => ({
          variantId: d.variant_id,
          available: d.available,
        })),
      };
    case "RB005":
      return {
        code: "invalid_input",
        fields: parseDetail(detailSchemas.RB005, pgError.detail).map((d) => d.field),
      };
    default:
      return undefined;
  }
}

/**
 * Guest checkout through the place_order database function, which reads
 * prices and stock itself and writes the order in one transaction. Call it
 * from a server action (it calls updateTag). The IP rate limit comes with
 * Public storefront (feature 7) and must ship before stores are shared.
 */
export async function placeOrder(
  input: PlaceOrderInput,
): Promise<Result<PlacedOrder, PlaceOrderError>> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "invalid_input",
      fields: parsed.error.issues.map((issue) => issue.path.join(".")),
    });
  }
  const { storeSlug, idempotencyKey, customer, delivery, items } = parsed.data;
  const lines = items.map((item) => ({
    variant_id: item.variantId,
    quantity: item.quantity,
    expected_unit_price_kobo: item.expectedUnitPriceKobo,
  }));

  try {
    const result = await withCheckout((tx) =>
      tx.execute<{ result: unknown }>(
        sql`select public.place_order(
          ${storeSlug},
          ${idempotencyKey}::uuid,
          ${JSON.stringify(customer)}::jsonb,
          ${JSON.stringify(delivery)}::jsonb,
          ${JSON.stringify(lines)}::jsonb
        ) as result`,
      ),
    );
    const placed = placedSchema.parse(result.rows[0].result);

    // Only tracked stock changes what the storefront shows.
    if (placed.product_ids.length > 0) {
      updateTag(storeTag(placed.store_id));
      placed.product_ids.forEach((productId) => updateTag(productTag(productId)));
    }
    logger.info("order placed", {
      storeId: placed.store_id,
      orderId: placed.order_id,
      existing: placed.existing,
    });
    return ok({ orderId: placed.order_id, number: placed.number, totalKobo: placed.total_kobo });
  } catch (error) {
    const placeOrderError = toPlaceOrderError(error);
    if (!placeOrderError) throw error;
    logger.info("order rejected", { storeSlug, code: placeOrderError.code });
    return err(placeOrderError);
  }
}
