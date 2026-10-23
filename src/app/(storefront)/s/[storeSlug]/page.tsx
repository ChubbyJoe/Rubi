import { Suspense } from "react";
import { getStorefront, PLACEHOLDER_SLUG } from "@/features/stores/storefront";

export function generateStaticParams() {
  return [{ storeSlug: PLACEHOLDER_SLUG }];
}

export default function StorefrontPage({ params }: PageProps<"/s/[storeSlug]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-4">
      <Suspense fallback={<p>Loading store…</p>}>
        <Storefront params={params} />
      </Suspense>
    </main>
  );
}

async function Storefront({ params }: Pick<PageProps<"/s/[storeSlug]">, "params">) {
  const { storeSlug } = await params;
  const store = await getStorefront(storeSlug);
  return (
    <>
      <h1 className="text-2xl font-semibold">{store.slug}</h1>
      <p className="text-sm opacity-70">
        Scaffold storefront, read as {store.readAs}, cached at {store.renderedAt}.
      </p>
    </>
  );
}
