import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

// DESIGN.md buttons: 48px, 12px radius. Primary hover equals rest; press only.
// Focus is the global 2px ring outline (globals.css). Anything under 44px
// carries a 44px hit area through `after:`.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm border border-transparent bg-clip-padding text-button-md whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:border-transparent disabled:bg-secondary disabled:text-muted-foreground aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground active:bg-primary-active",
        outline:
          "border-input bg-background text-foreground hover:bg-muted active:bg-secondary aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted active:bg-border aria-expanded:bg-muted",
        ghost:
          "text-foreground hover:bg-muted active:bg-secondary aria-expanded:bg-muted disabled:bg-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-active active:bg-destructive-active",
        link: "text-foreground underline underline-offset-4 hover:decoration-2 disabled:bg-transparent",
      },
      size: {
        default:
          "h-12 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        lg: "h-12 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        sm: "h-9 gap-1.5 px-3.5 text-button-sm after:absolute after:inset-x-0 after:-inset-y-1 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-8 gap-1 px-2.5 text-button-sm after:absolute after:inset-x-0 after:-inset-y-1.5 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-12",
        "icon-lg": "size-12",
        "icon-sm": "size-9 after:absolute after:-inset-1 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-8 after:absolute after:-inset-1.5 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
