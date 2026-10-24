import type { Metadata } from "next";
import { AdminSurface } from "@/components/admin-surface";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

// The Admin surface only, no data reads: /app/setup sits outside the (shell)
// group, so a seller without a store never meets getSellerContext() here.
export default function DashboardLayout({ children }: LayoutProps<"/app">) {
  return <AdminSurface>{children}</AdminSurface>;
}
