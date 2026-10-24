import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NavLink } from "@/components/admin-shell/nav-link";
import { ADMIN_NAV } from "@/components/admin-shell/nav";
import { AdminOverlays } from "@/features/design-preview/admin-overlays";
import { PrimitivesPreview, Section } from "@/features/design-preview/primitives";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Design system" };

export default function AdminPreviewPage() {
  if (env.VERCEL_ENV === "production") notFound();
  return (
    <main id="main" className="mx-auto flex w-full max-w-admin flex-col gap-12 px-4 py-10 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display-xl">Design system: Admin</h1>
        <p className="text-body-md text-body">
          Every primitive on the Admin surface. Switch your system to dark mode to see Admin dark.{" "}
          <Link href="/dev/ui/shop" className="text-foreground underline underline-offset-4">
            Shop preview
          </Link>
        </p>
      </header>
      <Section title="Overlays">
        <AdminOverlays />
      </Section>
      <Section title="Navigation">
        <div className="flex flex-wrap gap-8">
          <nav
            aria-label="Sidebar sample"
            className="flex w-62 flex-col gap-1 rounded-md bg-sidebar p-4"
          >
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} layout="sidebar" />
            ))}
          </nav>
          <nav aria-label="Rail sample" className="flex flex-col gap-1 rounded-md bg-sidebar p-3">
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} layout="rail" />
            ))}
          </nav>
        </div>
      </Section>
      <PrimitivesPreview surface="admin" />
    </main>
  );
}
