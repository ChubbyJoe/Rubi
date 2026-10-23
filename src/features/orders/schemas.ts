import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { z } from "zod";
import { NIGERIAN_STATES } from "@/lib/db/schema";
import { storeSlugSchema } from "@/features/stores/schemas";

export { NIGERIAN_STATES };

// The same caps are CHECK constraints and are checked again in place_order.
export const MAX_ORDER_LINES = 50;
export const MAX_LINE_QUANTITY = 999;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `At most ${max} characters`)
    .optional()
    .transform((value) => value || undefined);

/** Normalises a Nigerian (or international) number to E.164. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const phone = parsePhoneNumberFromString(value, "NG");
    if (!phone?.isValid()) {
      ctx.addIssue({ code: "custom", message: "Enter a valid phone number" });
      return z.NEVER;
    }
    return phone.number;
  });

export const placeOrderSchema = z.object({
  storeSlug: storeSlugSchema,
  // Created once by the checkout form when it mounts, so a retry is safe.
  idempotencyKey: z.uuid(),
  customer: z.object({
    name: z.string().trim().min(1, "Enter your name").max(100, "At most 100 characters"),
    phone: phoneSchema,
    email: z
      .union([z.literal(""), z.email("Enter a valid email").max(254)])
      .optional()
      .transform((value) => value || undefined),
  }),
  delivery: z.object({
    state: z.enum(NIGERIAN_STATES, "Choose a state"),
    city: z.string().trim().min(1, "Enter your city").max(80, "At most 80 characters"),
    address: z.string().trim().min(1, "Enter your address").max(300, "At most 300 characters"),
    landmark: optionalText(150),
    note: optionalText(500),
  }),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.int().min(1).max(MAX_LINE_QUANTITY),
        expectedUnitPriceKobo: z.int().min(0),
      }),
    )
    .min(1)
    .max(MAX_ORDER_LINES)
    .refine(
      (items) => new Set(items.map((item) => item.variantId)).size === items.length,
      "Each product appears once",
    ),
});

export type PlaceOrderInput = z.input<typeof placeOrderSchema>;
