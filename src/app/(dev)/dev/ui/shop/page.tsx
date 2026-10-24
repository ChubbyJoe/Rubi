import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopShell } from "@/components/shop-shell/shop-shell";
import { PrimitivesPreview } from "@/features/design-preview/primitives";
import { DEFAULT_SHOP_THEME, type ShopTheme } from "@/features/stores/shop-theme";
import { env } from "@/lib/env";
import { SAMPLE_STONE_THEME } from "@/lib/design/tokens";

export const metadata: Metadata = { title: "Design system: Shop", robots: { index: false } };

const STONE_THEME: ShopTheme = { ...SAMPLE_STONE_THEME, neutrals: "stone" };

export default function ShopPreviewPage({ searchParams }: PageProps<"/dev/ui/shop">) {
  if (env.VERCEL_ENV === "production") notFound();
  return (
    <Suspense>
      <Preview searchParams={searchParams} />
    </Suspense>
  );
}

async function Preview({ searchParams }: Pick<PageProps<"/dev/ui/shop">, "searchParams">) {
  const stone = (await searchParams).neutrals === "stone";
  return (
    <ShopShell
      name={stone ? "Teal & Stone" : "Ada's Fabrics"}
      slug="preview"
      theme={stone ? STONE_THEME : DEFAULT_SHOP_THEME}
    >
      <div className="flex flex-col gap-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-display-xl">Design system: Shop</h1>
          <p className="text-body-md text-body">
            {stone ? "A sample stone theme (teal accent)." : "The default theme (Madder, warm)."}{" "}
            Shops never go dark.{" "}
            <a
              href={stone ? "/dev/ui/shop" : "/dev/ui/shop?neutrals=stone"}
              className="text-foreground underline underline-offset-4"
            >
              {stone ? "Default theme" : "Stone theme"}
            </a>
          </p>
        </header>
        <PrimitivesPreview surface="shop" />
      </div>
    </ShopShell>
  );
}
