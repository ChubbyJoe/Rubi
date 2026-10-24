"use client";

import type { Route } from "next";
import Link from "next/link";
import { EllipsisIcon, ExternalLinkIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ADMIN_NAV } from "./nav";
import { NavLink } from "./nav-link";
import { useSignOut } from "./use-sign-out";

/** Bottom bar overflow: nav items without a tab, View shop and Sign out. */
export function MoreSheet({
  storeName,
  shopHref,
}: {
  storeName: string;
  /** Only when the shop is published. */
  shopHref: Route | null;
}) {
  const signOut = useSignOut();
  const extra = ADMIN_NAV.filter((item) => !item.tab);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-14 min-w-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-sm text-caption-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <EllipsisIcon aria-hidden="true" className="size-5" />
          More
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="gap-2 px-4 pb-6">
        <SheetHeader className="px-0">
          <SheetTitle>{storeName}</SheetTitle>
          <SheetDescription>More of your Admin</SheetDescription>
        </SheetHeader>
        <nav aria-label="More" className="flex flex-col gap-1">
          {extra.map((item) => (
            <NavLink key={item.href} item={item} layout="sidebar" />
          ))}
        </nav>
        {shopHref && (
          <Button asChild variant="outline" className="w-full">
            <Link href={shopHref} target="_blank" rel="noopener">
              <ExternalLinkIcon aria-hidden="true" />
              View shop
            </Link>
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={signOut}>
          <LogOutIcon aria-hidden="true" />
          Sign out
        </Button>
      </SheetContent>
    </Sheet>
  );
}
