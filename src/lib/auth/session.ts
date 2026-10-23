import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { withUser } from "@/lib/db";
import { stores } from "@/lib/db/schema";

export type SignedInUser = {
  userId: string;
  email: string;
  name: string;
};

export type SellerContext = SignedInUser & {
  /** Pass to `withStore(storeId, ...)` for every store scoped read and write. */
  storeId: string;
};

/**
 * The signed in user, store or not (store setup uses this). Call it under
 * Suspense: it reads headers.
 */
export const getSignedInUser = cache(async (): Promise<SignedInUser> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return { userId: session.user.id, email: session.user.email, name: session.user.name };
});

/**
 * The real auth check for every dashboard read and action. The proxy only
 * makes an optimistic redirect. One store lookup per request (React cache).
 */
export const getSellerContext = cache(async (): Promise<SellerContext> => {
  const user = await getSignedInUser();
  const [store] = await withUser(user.userId, (tx) =>
    tx.select({ id: stores.id }).from(stores).where(eq(stores.ownerUserId, user.userId)),
  );
  if (!store) redirect("/app/setup");
  return { ...user, storeId: store.id };
});
