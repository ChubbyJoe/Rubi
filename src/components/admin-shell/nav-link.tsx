"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActiveNav, type AdminNavItem } from "./nav";
import { NavIcon } from "./nav-icon";

const LAYOUTS = {
  // 248px sidebar, 1128px and wider.
  sidebar:
    "h-11 w-full gap-3 rounded-sm px-3 text-nav-link before:inset-y-2 data-[active=true]:bg-secondary",
  // 72px icon rail, 744px to 1127px.
  rail: "size-12 justify-center rounded-sm before:inset-y-2.5 data-[active=true]:bg-secondary",
  // Bottom tab bar, under 744px. No side bar; the label and fill carry the state.
  tab: "h-14 min-w-16 flex-1 flex-col justify-center gap-0.5 rounded-sm text-caption-sm data-[active=true]:font-bold data-[active=true]:text-foreground",
} as const;

export function NavLink({ item, layout }: { item: AdminNavItem; layout: keyof typeof LAYOUTS }) {
  const active = isActiveNav(usePathname(), item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={layout === "rail" ? item.label : undefined}
      data-active={active}
      className={cn(
        "relative flex items-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[active=true]:text-foreground",
        layout !== "tab" &&
          "before:absolute before:left-0 before:w-[3px] before:rounded-full before:bg-nav-indicator before:opacity-0 data-[active=true]:before:opacity-100",
        LAYOUTS[layout],
      )}
    >
      <NavIcon name={item.icon} className="size-5 shrink-0" />
      {layout !== "rail" && <span>{item.label}</span>}
    </Link>
  );
}
