import type { ReactNode } from "react";
import { resolveShopTheme, shopThemeCss, type ShopTheme } from "@/features/stores/shop-theme";
import { ShopFooter } from "./shop-footer";
import { ShopHeader } from "./shop-header";

/**
 * The Shop surface (spec 0003, AC-4, AC-9): always light, the seller's theme,
 * header and footer. Server only, so a storefront ships no shell JavaScript.
 * Owns the one <main>. Render it only for a resolved store.
 */
export function ShopShell({
  name,
  slug,
  theme,
  children,
}: {
  name: string;
  slug: string;
  theme: ShopTheme;
  children: ReactNode;
}) {
  const safe = resolveShopTheme(theme);
  const css = shopThemeCss(safe);
  return (
    <div
      data-surface="shop"
      data-neutrals={safe.neutrals === "stone" ? "stone" : undefined}
      className="flex flex-1 flex-col bg-background text-foreground"
    >
      {/* Built only from validated #rrggbb values (shopThemeCss). */}
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <ShopHeader name={name} slug={slug} />
      <main id="main" className="mx-auto flex w-full max-w-shop flex-1 flex-col px-4 py-8 md:px-8">
        {children}
      </main>
      <ShopFooter />
    </div>
  );
}
