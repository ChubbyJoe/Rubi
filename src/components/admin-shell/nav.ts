import type { Route } from "next";

export type AdminNavItem = {
  readonly href: Route;
  readonly label: string;
  readonly icon: "home";
  /** Shown in the bottom tab bar under 744px (at most 4); the rest go in More. */
  readonly tab: boolean;
};

/** Only routes that exist. Features add their item when their page ships. */
export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: "/app", label: "Home", icon: "home", tab: true },
];

/** Exact match for the Admin home, prefix match for every other section. */
export const isActiveNav = (pathname: string, href: string) =>
  href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
