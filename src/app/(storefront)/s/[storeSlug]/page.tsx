import { permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { PLACEHOLDER_SLUG, resolveStoreSlug } from "@/features/stores/storefront";

export function generateStaticParams() {
  return [{ storeSlug: PLACEHOLDER_SLUG }];
}

export default function StorefrontPage({ params }: PageProps<"/s/[storeSlug]">) {
  return (
    <Suspense>
      <Storefront params={params} />
    </Suspense>
  );
}

// Placeholder content. Public storefront (feature 7) lists the products.
async function Storefront({ params }: Pick<PageProps<"/s/[storeSlug]">, "params">) {
  const { storeSlug } = await params;
  const store = await resolveStoreSlug(storeSlug);
  if (store.retired) permanentRedirect(`/s/${store.currentSlug}`);
  return <h1 className="text-display-xl">{store.name}</h1>;
}
