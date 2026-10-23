import { Suspense } from "react";
import { getSellerContext } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";

export default function DashboardHome() {
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Your store</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Seller />
      </Suspense>
    </main>
  );
}

async function Seller() {
  const seller = await getSellerContext();
  return (
    <section className="flex flex-col gap-3">
      <p>
        Signed in as <strong>{seller.name}</strong> ({seller.email}).
      </p>
      <SignOutButton />
    </section>
  );
}
