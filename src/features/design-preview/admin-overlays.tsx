"use client";

import { ChevronDownIcon, LogOutIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Admin only overlays: menu, sheet and toast (portals pick up the surface). */
export function AdminOverlays() {
  return (
    <div className="flex flex-wrap gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Actions
            <ChevronDownIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Order #1042</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <PencilIcon aria-hidden="true" />
              Edit order
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Refund (Later)</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <LogOutIcon aria-hidden="true" />
            Cancel order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Open sheet</Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="px-4 pb-6">
          <SheetHeader className="px-0">
            <SheetTitle>Ada&apos;s Fabrics</SheetTitle>
            <SheetDescription>Sheets slide up from the bottom on phones.</SheetDescription>
          </SheetHeader>
          <Button variant="outline">View shop</Button>
        </SheetContent>
      </Sheet>

      <Button
        variant="secondary"
        onClick={() => toast("Product saved", { action: { label: "Undo", onClick: () => {} } })}
      >
        Show toast
      </Button>
    </div>
  );
}
