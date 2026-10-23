import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default function DashboardLayout({ children }: LayoutProps<"/app">) {
  return <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-4">{children}</div>;
}
