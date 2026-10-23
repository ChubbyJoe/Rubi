import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default";
};

function NativeSelect({ className, size = "default", ...props }: NativeSelectProps) {
  return (
    <div
      className={cn("group/native-select relative w-full", className)}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="h-12 w-full min-w-0 cursor-pointer appearance-none rounded-sm border border-input bg-background py-1 pr-10 pl-3 text-body-md text-foreground transition-colors select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive data-[size=sm]:h-11"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-muted-foreground select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
