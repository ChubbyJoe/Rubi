import type { Metadata } from "next";
import { AdminSurface } from "@/components/admin-surface";

export const metadata: Metadata = { robots: { index: false } };

// /dev/ui only. The shop preview (/dev/ui/shop) sits outside this group so it
// never inherits the Admin surface.
export default function DevAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSurface>{children}</AdminSurface>;
}
