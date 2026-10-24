import type { Route } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { DotMark, Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { getSellerContext } from "@/lib/auth/session";
import { AccountMenu } from "./account-menu";
import { MoreSheet } from "./more-sheet";
import { ADMIN_NAV } from "./nav";
import { NavLink } from "./nav-link";

const shopHref = (slug: string) => `/s/${slug}` as Route;

/**
 * The Admin frame (spec 0003, AC-8): sidebar from 1128px, icon rail from
 * 744px, bottom tab bar below. Navigation renders statically; only the
 * seller's identity (store name, View shop, account menu) waits on the
 * session, under Suspense with same size fallbacks. Owns the one <main>.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const tabs = ADMIN_NAV.filter((item) => item.tab).slice(0, 4);
  return (
    <div className="flex flex-1">
      <a
        href="#main"
        className="sr-only z-50 rounded-sm bg-background px-4 py-3 text-button-md focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col items-center gap-6 border-r border-sidebar-border bg-sidebar py-4 md:flex lg:w-[248px] lg:items-stretch lg:px-4">
        <Link
          href="/app"
          className="relative flex h-12 items-center justify-center lg:justify-start lg:px-3"
        >
          <DotMark className="lg:hidden" />
          <Wordmark className="hidden text-[1.75rem] lg:inline-flex" />
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1 lg:hidden">
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} layout="rail" />
          ))}
        </nav>
        <nav aria-label="Main" className="hidden flex-col gap-1 lg:flex">
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} layout="sidebar" />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-8">
          <Suspense fallback={<TopbarFallback />}>
            <TopbarIdentity />
          </Suspense>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-admin flex-1 flex-col gap-6 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none md:px-8 md:pb-10"
        >
          {children}
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-background px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] md:hidden"
      >
        {tabs.map((item) => (
          <NavLink key={item.href} item={item} layout="tab" />
        ))}
        <Suspense fallback={<MoreFallback />}>
          <BottomMore />
        </Suspense>
      </nav>
    </div>
  );
}

async function TopbarIdentity() {
  const seller = await getSellerContext();
  return (
    <>
      <DotMark className="size-5 md:hidden" />
      <p className="min-w-0 flex-1 truncate text-title-md">{seller.storeName}</p>
      {seller.storePublished && (
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href={shopHref(seller.storeSlug)} target="_blank" rel="noopener">
            <ExternalLinkIcon aria-hidden="true" />
            View shop
          </Link>
        </Button>
      )}
      <AccountMenu name={seller.name} email={seller.email} />
    </>
  );
}

function TopbarFallback() {
  return (
    <>
      <DotMark className="size-5 md:hidden" />
      <span className="h-5 w-40 flex-1 rounded-xs bg-secondary" aria-hidden="true" />
      <span className="size-12 rounded-full bg-secondary" aria-hidden="true" />
    </>
  );
}

async function BottomMore() {
  const seller = await getSellerContext();
  return (
    <MoreSheet
      storeName={seller.storeName}
      shopHref={seller.storePublished ? shopHref(seller.storeSlug) : null}
    />
  );
}

function MoreFallback() {
  return (
    <span className="flex h-14 min-w-16 flex-1 flex-col items-center justify-center gap-0.5 text-caption-sm text-muted-foreground">
      <span aria-hidden="true" className="size-5" />
      More
    </span>
  );
}
