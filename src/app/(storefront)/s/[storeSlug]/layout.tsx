import { Suspense } from "react";
import { ShopShell } from "@/components/shop-shell/shop-shell";
import { DEFAULT_SHOP_THEME } from "@/features/stores/shop-theme";
import { resolveStoreSlug } from "@/features/stores/storefront";

// generateStaticParams stays on the pages. The theme is the default until
// Store branding (feature 13) stores one; resolve it here, outside any inner
// Suspense, so the accent never flashes in after first paint.
export default function StoreLayout({ children, params }: LayoutProps<"/s/[storeSlug]">) {
  return (
    <Suspense>
      <Shell params={params}>{children}</Shell>
    </Suspense>
  );
}

async function Shell({
  params,
  children,
}: Pick<LayoutProps<"/s/[storeSlug]">, "params" | "children">) {
  const { storeSlug } = await params;
  const store = await resolveStoreSlug(storeSlug);
  return (
    <ShopShell name={store.name} slug={store.currentSlug} theme={DEFAULT_SHOP_THEME}>
      {children}
    </ShopShell>
  );
}
