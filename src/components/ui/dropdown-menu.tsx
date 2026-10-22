"use client";

import { DropdownMenu as Menu } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export function DropdownMenuContent({
  className,
  ...props
}: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={4}
        className={cn(
          "z-50 min-w-48 rounded-lg border bg-background p-1 shadow-md",
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
}
export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn(
        "flex min-h-11 cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
