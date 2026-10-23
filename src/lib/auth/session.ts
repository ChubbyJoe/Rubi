import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type SellerContext = {
  userId: string;
  email: string;
  name: string;
  // TODO(feature 3, Data model): load the seller's store through
  // `stores.owner_user_id` and return `storeId` here. Every store scoped
  // read then runs `withStore(ctx.storeId, ...)`.
};

/**
 * The real auth check for every dashboard read and action. The proxy only
 * makes an optimistic redirect. Call it under Suspense: it reads headers.
 */
export async function getSellerContext(): Promise<SellerContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return { userId: session.user.id, email: session.user.email, name: session.user.name };
}
