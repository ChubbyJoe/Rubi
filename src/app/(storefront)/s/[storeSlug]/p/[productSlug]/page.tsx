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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-4">
      <Suspense fallback={<p>Loading product…</p>}>
        <Product params={params} />
      </Suspense>
    </main>
  );
}

async function Product({ params }: Pick<PageProps<"/s/[storeSlug]/p/[productSlug]">, "params">) {
  const { storeSlug, productSlug } = await params;
  const store = await resolveStoreSlug(storeSlug);
  if (store.retired) permanentRedirect(`/s/${store.currentSlug}/p/${productSlug}`);
  return (
    <>
      <Link href={`/s/${store.currentSlug}`} className="underline">
        {store.currentSlug}
      </Link>
      <h1 className="text-2xl font-semibold">{productSlug}</h1>
    </>
  );
}
