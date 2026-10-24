import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { PLACEHOLDER_SLUG, resolveStoreSlug } from "@/features/stores/storefront";

export function generateStaticParams() {
  return [{ storeSlug: PLACEHOLDER_SLUG, productSlug: PLACEHOLDER_SLUG }];
}

// Scaffold placeholder. Public storefront (feature 7) loads the product.
export default function ProductPage({ params }: PageProps<"/s/[storeSlug]/p/[productSlug]">) {
  return (
    <div className="flex flex-col gap-3">
      <Suspense>
        <Product params={params} />
      </Suspense>
    </div>
  );
}

async function Product({ params }: Pick<PageProps<"/s/[storeSlug]/p/[productSlug]">, "params">) {
  const { storeSlug, productSlug } = await params;
  const store = await resolveStoreSlug(storeSlug);
  if (store.retired) permanentRedirect(`/s/${store.currentSlug}/p/${productSlug}`);
  return (
    <>
      <Link href={`/s/${store.currentSlug}`} className="text-link underline">
        {store.name}
      </Link>
      <h1 className="text-display-lg">{productSlug}</h1>
    </>
  );
}
