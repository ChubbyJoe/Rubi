import type { ReactNode } from "react";
import { CheckIcon, ClockIcon, MinusIcon, TriangleAlertIcon, type LucideIcon } from "lucide-react";
import type { StatusTone } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

// Status tokens only, never primary or the shop accent (DESIGN.md, Status).
// Mapping an order or payment state to a tone belongs to the feature that
// owns the state.
const TONES: Record<StatusTone, { readonly icon: LucideIcon; readonly className: string }> = {
  success: { icon: CheckIcon, className: "bg-status-success text-status-success-foreground" },
  info: { icon: ClockIcon, className: "bg-status-info text-status-info-foreground" },
  attention: {
    icon: TriangleAlertIcon,
    className: "bg-status-attention text-status-attention-foreground",
  },
  neutral: { icon: MinusIcon, className: "bg-status-neutral text-status-neutral-foreground" },
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClass } = TONES[tone];
  return (
    <span
      data-slot="status-badge"
      data-tone={tone}
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-full px-2.5 text-badge whitespace-nowrap",
        toneClass,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.5} />
      {children}
    </span>
  );
}
