import type { Route } from "next";
import Link from "next/link";

/** 72px header; the shop name stands in for a logo until feature 13. */
export function ShopHeader({ name, slug }: { name: string; slug: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-18 w-full max-w-shop items-center px-4 md:px-8">
        <Link
          href={`/s/${slug}` as Route}
          className="relative truncate text-display-sm font-bold text-foreground after:absolute after:inset-x-0 after:-inset-y-3"
        >
          {name}
        </Link>
      </div>
    </header>
  );
}
