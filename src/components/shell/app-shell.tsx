"use client";

import {
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  Folder,
  Home,
  ListTree,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Settings,
  Ticket,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  activeFoundationRoute,
  isNavigationSection,
  type NavigationGroup,
  type NavigationLeaf,
  navigation,
  navigationDestinations,
  navigationEntries,
  navigationPath,
} from "./navigation";

const groupIcons = {
  "System Settings": Settings,
  "Sistem Setting": Settings,
  Kantor: Building2,
  Akunting: ChartNoAxesCombined,
  Laporan: ChartNoAxesCombined,
  Modul: Folder,
  Office: Building2,
  "Master Data": ListTree,
  Modules: Folder,
  Accounting: ChartNoAxesCombined,
  Reports: ChartNoAxesCombined,
  Ticketing: Ticket,
  "System Tutorial": BookOpen,
};

export function Navigation({
  collapsed = false,
  mobile = false,
  groups = navigation,
  onExpand,
}: {
  collapsed?: boolean;
  mobile?: boolean;
  groups?: readonly NavigationGroup[];
  onExpand?: () => void;
}) {
  const pathname = usePathname();
  const current = navigationPath(pathname, groups);
  const [openGroup, setOpenGroup] = useState(
    current && navigationEntries(current.group).length
      ? current.group.label
      : null,
  );
  const [openSection, setOpenSection] = useState(
    current?.section?.label ?? null,
  );
  const id = useId();
  const expansionTarget = useRef<string | null>(null);
  useEffect(() => {
    if (!collapsed && expansionTarget.current) {
      const index = groups.findIndex(
        (group) => group.label === expansionTarget.current,
      );
      document.getElementById(`${id}-${index}-trigger`)?.focus();
      expansionTarget.current = null;
    }
  }, [collapsed, groups, id]);
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const results = navigationDestinations(groups).filter(({ item, path }) =>
    `${path} ${item.label} ${item.providerLabel}`
      .toLowerCase()
      .includes(search),
  );
  const routeLink = (item: NavigationLeaf, compact = false) => {
    if (!item.href) return null;
    const Icon = item.href === "/" ? Home : PanelsTopLeft;
    const link = (
      <Link
        href={item.href}
        aria-current={pathname === item.href ? "page" : undefined}
        title={compact ? item.label : undefined}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          compact && "justify-center px-0",
          pathname === item.href && "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className={compact ? "sr-only" : "min-w-0 break-words"}>
          {item.label}
        </span>
      </Link>
    );
    return mobile ? <SheetClose asChild>{link}</SheetClose> : link;
  };
  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
      className="space-y-4 p-3"
    >
      {!collapsed && (
        <div className="space-y-2 px-3 text-xs leading-5 text-muted-foreground">
          <p>
            Current page:{" "}
            <span className="font-medium text-foreground">
              {current?.labels.join(" / ") ?? "Page"}
            </span>
          </p>
          <p>Domain destinations are unavailable.</p>
        </div>
      )}
      {!collapsed && (
        <div className="space-y-2 px-1">
          <label htmlFor={`${id}-search`} className="text-sm font-medium">
            Find menu item
          </label>
          <Input
            id={`${id}-search`}
            type="search"
            value={query}
            onInput={(event) => setQuery(event.currentTarget.value)}
            aria-controls={`${id}-results`}
            className="min-h-11"
            autoComplete="off"
            placeholder="Search navigation…"
          />
        </div>
      )}
      {!collapsed && search ? (
        <div id={`${id}-results`} className="space-y-2">
          <output className="block px-3 text-xs text-muted-foreground">
            {results.length} matching {results.length === 1 ? "item" : "items"}
          </output>
          <ul className="space-y-3">
            {results.map(({ item, path }) => (
              <li
                key={`${path}-${item.providerLabel}`}
                className="break-words px-3 text-sm"
              >
                <p className="mb-1 text-xs leading-5 text-muted-foreground">
                  {path}
                </p>
                {item.href ? (
                  routeLink(item)
                ) : (
                  <p className="border-l pl-3 text-muted-foreground">
                    {item.providerLabel}
                    <span className="sr-only"> — unavailable</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <p className="px-3 text-sm text-muted-foreground">
              No matching items. Try a provider label or clear the search.
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              setQuery("");
              document.getElementById(`${id}-search`)?.focus();
            }}
          >
            Clear menu search
          </Button>
        </div>
      ) : (
        <div id={`${id}-results`} className="space-y-1">
          {groups.map((group, groupIndex) => {
            const GroupIcon =
              groupIcons[group.label as keyof typeof groupIcons] ?? Folder;
            if (group.href) {
              return <div key={group.label}>{routeLink(group, collapsed)}</div>;
            }
            if (collapsed)
              return navigationEntries(group).length ? (
                <Button
                  key={group.label}
                  type="button"
                  variant="ghost"
                  className="min-h-11 w-full"
                  title={group.providerLabel}
                  aria-label={`Expand ${group.providerLabel} navigation`}
                  onClick={() => {
                    expansionTarget.current = group.label;
                    onExpand?.();
                    setOpenGroup(group.label);
                    setOpenSection(null);
                  }}
                >
                  <GroupIcon aria-hidden="true" />
                </Button>
              ) : (
                <p
                  key={group.label}
                  title={`${group.providerLabel} — unavailable`}
                  className="flex min-h-11 items-center justify-center text-muted-foreground"
                >
                  <GroupIcon className="size-4" aria-hidden="true" />
                  <span className="sr-only">
                    {group.providerLabel} — unavailable
                  </span>
                </p>
              );
            if (!navigationEntries(group).length)
              return (
                <p
                  key={group.label}
                  className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm text-muted-foreground"
                >
                  <GroupIcon className="size-4 shrink-0" aria-hidden="true" />
                  {group.providerLabel}
                  <span className="sr-only"> — unavailable</span>
                </p>
              );
            const expanded = openGroup === group.label;
            const groupId = `${id}-${groupIndex}`;
            return (
              <div key={group.label}>
                <button
                  type="button"
                  id={`${groupId}-trigger`}
                  aria-expanded={expanded}
                  aria-controls={groupId}
                  className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-secondary"
                  onClick={() => {
                    setOpenGroup(expanded ? null : group.label);
                    setOpenSection(
                      current?.group === group
                        ? (current.section?.label ?? null)
                        : null,
                    );
                  }}
                >
                  <GroupIcon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 break-words">
                    {group.providerLabel}
                  </span>
                  <ChevronRight
                    className={cn("size-4 shrink-0", expanded && "rotate-90")}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={groupId}
                  hidden={!expanded}
                  className="ml-3 border-l pl-2"
                >
                  {navigationEntries(group).map((entry, sectionIndex) => {
                    if (!isNavigationSection(entry))
                      return (
                        <div key={entry.label} className="py-1">
                          {entry.href ? (
                            routeLink(entry)
                          ) : (
                            <p className="px-3 py-2 text-sm text-muted-foreground">
                              {entry.providerLabel}
                              <span className="sr-only"> — unavailable</span>
                            </p>
                          )}
                        </div>
                      );
                    const section = entry;
                    const sectionOpen = openSection === section.label;
                    const sectionId = `${groupId}-${sectionIndex}`;
                    return (
                      <div key={section.label}>
                        <button
                          type="button"
                          aria-expanded={sectionOpen}
                          aria-controls={sectionId}
                          className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-secondary"
                          onClick={() =>
                            setOpenSection(sectionOpen ? null : section.label)
                          }
                        >
                          <ChevronRight
                            className={cn(
                              "size-3 shrink-0",
                              sectionOpen && "rotate-90",
                            )}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1 break-words">
                            {section.providerPath.join(" / ")}
                          </span>
                          <span
                            className="text-xs text-muted-foreground"
                            aria-hidden="true"
                          >
                            {section.items.length}
                          </span>
                        </button>
                        <ul
                          id={sectionId}
                          hidden={!sectionOpen}
                          className="ml-2 border-l py-1 pl-2"
                        >
                          {section.items.map((item) => (
                            <li
                              key={item.label}
                              className="break-words px-2 py-2 text-sm leading-5 text-muted-foreground"
                            >
                              {item.href ? (
                                routeLink(item)
                              ) : (
                                <>
                                  {item.providerLabel}
                                  <span className="sr-only">
                                    {" "}
                                    — unavailable
                                  </span>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const current = activeFoundationRoute(pathname);
  return (
    <div className="flex min-h-dvh bg-workspace">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-background p-3 text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto border-r bg-sidebar lg:flex",
          collapsed ? "w-20" : "w-sidebar",
        )}
      >
        <div
          className={cn(
            "flex min-h-17 items-center gap-3 border-b px-6",
            collapsed && "justify-center px-0",
          )}
        >
          <Truck className="size-6 shrink-0 text-primary" aria-hidden="true" />
          {!collapsed && (
            <div>
              <p className="font-semibold">LMS</p>
              <p className="text-xs text-muted-foreground">
                Logistics management
              </p>
            </div>
          )}
        </div>
        <div id="desktop-navigation" className="flex-1">
          <Navigation
            key={pathname}
            collapsed={collapsed}
            onExpand={() => setCollapsed(false)}
          />
        </div>
        <div className="sticky bottom-0 border-t bg-sidebar p-3">
          <Button
            variant="ghost"
            className="min-h-11 w-full"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="desktop-navigation"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose aria-hidden="true" />
                <span>Collapse sidebar</span>
              </>
            )}
          </Button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-17 flex-wrap items-center gap-3 border-b bg-background px-4 py-3 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="Open navigation"
                >
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto bg-sidebar">
                <SheetHeader>
                  <SheetTitle>LMS navigation</SheetTitle>
                  <SheetDescription>
                    Navigate the UI preview. Domain destinations are
                    unavailable.
                  </SheetDescription>
                </SheetHeader>
                <Navigation key={pathname} mobile />
              </SheetContent>
            </Sheet>
          </div>
          <nav aria-label="Breadcrumb" className="min-w-0 text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              {pathname === "/" ? (
                <li>
                  <span aria-current="page">Dashboard</span>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      href="/"
                      className="text-muted-foreground hover:text-primary"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li aria-hidden="true">
                    <ChevronRight className="size-3" />
                  </li>
                  <li>
                    <span aria-current="page">{current?.label ?? "Page"}</span>
                  </li>
                </>
              )}
            </ol>
          </nav>
          <div className="ml-auto flex items-center gap-2 rounded-full border px-3 py-2 text-xs text-muted-foreground">
            <UserRound className="size-4 shrink-0" aria-hidden="true" />
            <span>
              Account unavailable
              <span className="hidden sm:inline"> · UI preview</span>
            </span>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full space-y-6 px-4 py-6 focus:outline-none sm:px-6 lg:p-8"
        >
          {children}
        </main>
        <footer className="border-t bg-background px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
          LMS · Presentation preview · No operational records loaded or saved
        </footer>
      </div>
    </div>
  );
}
