import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

/**
 * The Admin surface (spec 0003): Rubi tokens that follow the system dark
 * setting. Tokens hang on `html:has([data-surface="admin"])`, so portals
 * (menus, sheets, toasts) pick them up too. Shared by the (auth), /app and
 * (dev) layouts, so one Toaster survives the move from sign up to /app.
 */
export function AdminSurface({ children }: { children: ReactNode }) {
  return (
    <div data-surface="admin" className="flex flex-1 flex-col bg-background text-foreground">
      {children}
      <Toaster />
    </div>
  );
}
