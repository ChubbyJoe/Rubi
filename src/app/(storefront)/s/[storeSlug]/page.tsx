import { permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { PLACEHOLDER_SLUG, resolveStoreSlug } from "@/features/stores/storefront";

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

// Placeholder content. Public storefront (feature 7) lists the products.
async function Storefront({ params }: Pick<PageProps<"/s/[storeSlug]">, "params">) {
  const { storeSlug } = await params;
  const store = await resolveStoreSlug(storeSlug);
  if (store.retired) permanentRedirect(`/s/${store.currentSlug}`);
  return <h1 className="text-2xl font-semibold">{store.currentSlug}</h1>;
}
