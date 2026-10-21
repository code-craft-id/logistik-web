"use client";

import { ChevronDown } from "lucide-react";
import { NavigationMenu as Menu } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Source-owned Radix composition. Content shares the root's left edge rather
// than cascading from individual triggers near the edge of the viewport.
export function NavigationMenu({
  className,
  ...props
}: ComponentProps<typeof Menu.Root>) {
  return (
    <Menu.Root
      activationMode="manual"
      className={cn("relative", className)}
      {...props}
    />
  );
}
export function NavigationMenuList({
  className,
  ...props
}: ComponentProps<typeof Menu.List>) {
  return (
    <Menu.List
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}
export const NavigationMenuItem = Menu.Item;
export const NavigationMenuLink = Menu.Link;
export const navigationMenuTriggerStyle =
  "inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground";

export function NavigationMenuTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof Menu.Trigger>) {
  return (
    <Menu.Trigger
      className={cn(navigationMenuTriggerStyle, "group", className)}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden="true"
        className="size-3 shrink-0 group-data-[state=open]:rotate-180"
      />
    </Menu.Trigger>
  );
}
export function NavigationMenuContent({
  className,
  ...props
}: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Content
      className={cn(
        "absolute top-full left-0 z-40 mt-2 max-h-[calc(100dvh-6rem)] w-3xl max-w-[calc(100vw-10rem)] overflow-y-auto overscroll-contain rounded-lg border bg-background p-4",
        className,
      )}
      {...props}
    />
  );
}
