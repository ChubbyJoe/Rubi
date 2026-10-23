// Fills a non production branch with two published stores, products and a
// few orders, through the same paths the app uses (Better Auth, RLS scoped
// transactions, place_order). Safe to rerun: existing sellers, stores,
// products and orders (fixed idempotency keys) are reused.
//
// Fails closed: refuses to run when NEON_MAIN_ENDPOINT_ID is unset, when
// PGHOST or DATABASE_URL_UNPOOLED points at that endpoint, or when
// VERCEL_ENV=production.

function guard() {
  const mainEndpoint = process.env.NEON_MAIN_ENDPOINT_ID?.trim();
  const refuse = (reason: string) => {
    console.error(JSON.stringify({ level: "error", message: "seed: refused", reason }));
    process.exit(1);
  };
  if (!mainEndpoint) refuse("NEON_MAIN_ENDPOINT_ID is not set");
  if (process.env.VERCEL_ENV === "production") refuse("VERCEL_ENV is production");
  const targets = [process.env.PGHOST, process.env.DATABASE_URL_UNPOOLED];
  if (targets.some((value) => value?.includes(mainEndpoint!)))
    refuse("the database is the production main branch");
}

const SEED_PASSWORD = "rubi-seed-password";

type SeedProduct = {
  readonly name: string;
  readonly slug: string;
  readonly priceKobo: number;
  readonly stock: number | null;
};

type SeedSeller = {
  readonly name: string;
  readonly email: string;
  readonly store: { readonly name: string; readonly slug: string };
  readonly products: readonly SeedProduct[];
  // Fixed keys, so a rerun finds the same orders.
  readonly orderKeys: readonly string[];
};

const sellers: readonly SeedSeller[] = [
  {
    name: "Ada Okafor",
    email: "ada@seed.rubi.test",
    store: { name: "Ada's Fabrics", slug: "ada-fabrics" },
    products: [
      { name: "Ankara wrap, 6 yards", slug: "ankara-wrap", priceKobo: 1_500_000, stock: null },
      { name: "Aso oke headtie", slug: "aso-oke-headtie", priceKobo: 850_000, stock: 12 },
      { name: "Lace bundle", slug: "lace-bundle", priceKobo: 4_200_000, stock: 3 },
    ],
    orderKeys: ["0199a000-0000-7000-8000-00000000a001", "0199a000-0000-7000-8000-00000000a002"],
  },
  {
    name: "Bola Adeyemi",
    email: "bola@seed.rubi.test",
    store: { name: "Bola Gadgets", slug: "bola-gadgets" },
    products: [
      { name: "Power bank 20000mAh", slug: "power-bank", priceKobo: 2_350_000, stock: 20 },
      { name: "USB C cable", slug: "usb-c-cable", priceKobo: 300_000, stock: null },
    ],
    orderKeys: ["0199a000-0000-7000-8000-00000000b001"],
  },
];

const customers = [
  { name: "Chiamaka Eze", phone: "+2348031234567" },
  { name: "Tunde Bakare", phone: "+2347059876543", email: "tunde@example.com" },
];

async function main() {
  guard();

  // Imported after the guard so nothing connects before it passes.
  const { and, eq, sql } = await import("drizzle-orm");
  const { auth } = await import("@/lib/auth");
  const { db, withCheckout, withStore } = await import("@/lib/db");
  const { productImages, products, productVariants, stores, user } =
    await import("@/lib/db/schema");
  const { createStore } = await import("@/features/stores/create-store");

  async function ensureUser(seller: SeedSeller) {
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, seller.email));
    if (existing) return existing.id;
    const created = await auth.api.signUpEmail({
      body: { name: seller.name, email: seller.email, password: SEED_PASSWORD },
    });
    return created.user.id;
  }

  try {
    for (const seller of sellers) {
      const userId = await ensureUser(seller);
      const store = await createStore(userId, seller.store);
      if (!store.ok) throw new Error(`createStore ${seller.store.slug}: ${store.error}`);
      const { storeId, slug } = store.data;

      const variantIds = await withStore(storeId, async (tx) => {
        await tx
          .update(stores)
          .set({ publishedAt: new Date() })
          .where(and(eq(stores.id, storeId), sql`${stores.publishedAt} is null`));

        const ids: { variantId: string; priceKobo: number }[] = [];
        for (const item of seller.products) {
          const [found] = await tx
            .select({ variantId: productVariants.id, priceKobo: productVariants.priceKobo })
            .from(productVariants)
            .innerJoin(products, eq(products.id, productVariants.productId))
            .where(and(eq(products.slug, item.slug), eq(productVariants.isDefault, true)));
          if (found) {
            ids.push(found);
            continue;
          }
          // A product and its default variant are always created together.
          const [product] = await tx
            .insert(products)
            .values({ storeId, name: item.name, slug: item.slug })
            .returning({ id: products.id });
          const [variant] = await tx
            .insert(productVariants)
            .values({
              storeId,
              productId: product.id,
              priceKobo: item.priceKobo,
              stock: item.stock,
              isDefault: true,
            })
            .returning({ variantId: productVariants.id, priceKobo: productVariants.priceKobo });
          await tx.insert(productImages).values({
            storeId,
            productId: product.id,
            r2Key: `seed/${slug}/${item.slug}.webp`,
            width: 1200,
            height: 1200,
          });
          ids.push(variant);
        }
        return ids;
      });

      for (const [index, key] of seller.orderKeys.entries()) {
        const customer = customers[index % customers.length];
        const lines = variantIds.slice(0, index + 1).map((variant) => ({
          variant_id: variant.variantId,
          quantity: 1,
          expected_unit_price_kobo: variant.priceKobo,
        }));
        const result = await withCheckout((tx) =>
          tx.execute<{ result: { number: number; existing: boolean } }>(
            sql`select public.place_order(
              ${slug},
              ${key}::uuid,
              ${JSON.stringify(customer)}::jsonb,
              ${JSON.stringify({ state: "Lagos", city: "Ikeja", address: "12 Allen Avenue" })}::jsonb,
              ${JSON.stringify(lines)}::jsonb
            ) as result`,
          ),
        );
        const placed = result.rows[0].result;
        console.log(
          JSON.stringify({
            level: "info",
            message: "seed: order",
            store: slug,
            number: placed.number,
            existing: placed.existing,
          }),
        );
      }
      console.log(JSON.stringify({ level: "info", message: "seed: store ready", store: slug }));
    }
    console.log(
      JSON.stringify({
        level: "info",
        message: "seed: done",
        signIn: sellers.map((seller) => seller.email),
        password: SEED_PASSWORD,
      }),
    );
  } finally {
    await db.$client.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ level: "error", message: "seed: failed", error: String(error) }));
  process.exit(1);
});
