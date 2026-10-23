import { AdminSurface } from "@/components/admin-surface";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AdminSurface>{children}</AdminSurface>;
}
