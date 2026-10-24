import { HouseIcon, type LucideIcon } from "lucide-react";
import type { AdminNavItem } from "./nav";

// Icons are looked up by name so nav items stay plain data that can cross
// from server to client components.
const ICONS: Record<AdminNavItem["icon"], LucideIcon> = { home: HouseIcon };

export function NavIcon({ name, className }: { name: AdminNavItem["icon"]; className?: string }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" className={className} />;
}
