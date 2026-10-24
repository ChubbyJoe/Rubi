import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("invisible animate-skeleton rounded-xs bg-secondary", className)}
      {...props}
    />
  );
}

export { Skeleton };
