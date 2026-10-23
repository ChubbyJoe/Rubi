import { eq } from "drizzle-orm";
import { withNewStore, withUser, type Tx } from "@/lib/db";
import { asPgError, UNIQUE_VIOLATION } from "@/lib/db/errors";
import { stores, storeSlugs } from "@/lib/db/schema";
import { err, ok, type Result } from "@/lib/result";
import { createStoreSchema, type CreateStoreInput } from "./schemas";

export type CreateStoreError = "slug_taken" | "invalid";
export type CreatedStore = { readonly storeId: string; readonly slug: string };

const findOwnStore = (tx: Tx, userId: string) =>
  tx
    .select({ storeId: stores.id, slug: stores.slug })
    .from(stores)
    .where(eq(stores.ownerUserId, userId))
    .then((rows) => rows[0]);

/**
 * Creates the signed in user's store and its current slug row in one
 * transaction. A user who already has a store gets that store back.
 * `userId` must come from `getSignedInUser()`.
 */
export async function createStore(
  userId: string,
  input: CreateStoreInput,
): Promise<Result<CreatedStore, CreateStoreError>> {
  const parsed = createStoreSchema.safeParse(input);
  if (!parsed.success) return err("invalid");
  const { name, slug } = parsed.data;

  const existing = await withUser(userId, (tx) => findOwnStore(tx, userId));
  if (existing) return ok(existing);

  try {
    const created = await withNewStore(userId, async (tx, storeId) => {
      await tx.insert(stores).values({ id: storeId, ownerUserId: userId, name, slug });
      await tx.insert(storeSlugs).values({ slug, storeId });
      return { storeId, slug };
    });
    return ok(created);
  } catch (error) {
    const pgError = asPgError(error);
    if (pgError?.code !== UNIQUE_VIOLATION) throw error;
    // Lost a race: either this user created a store meanwhile, or another
    // store took the slug.
    const raced = await withUser(userId, (tx) => findOwnStore(tx, userId));
    return raced ? ok(raced) : err("slug_taken");
  }
}
