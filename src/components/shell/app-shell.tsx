"use client";

import { ChevronRight, Menu, Search, Truck, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DASHBOARD_PATH } from "@/lib/routes";
import { Navigation } from "./compact-navigation";
import {
  isNavigationSection,
  type NavigationGroup,
  type NavigationLeaf,
  navigation,
  navigationEntries,
  navigationPath,
  supplementaryNavigation,
} from "./navigation";

export { Navigation } from "./compact-navigation";

// Exact routes still rendered by PreviewScreenPage (no live data).
const PREVIEW_ONLY_ROUTES = new Set([
  "/akunting",
  "/branch-reports",
  "/customer-reports",
  "/customer-service",
  "/operations",
  "/master-data/categories",
  "/master-data/logistics",
  "/master-data/units",
]);

function DesktopNavigation({
  value,
  onValueChange,
  groups,
}: {
  groups: readonly NavigationGroup[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const pathname = usePathname();
  const current = navigationPath(pathname, groups);
  const additional = groups.filter((group) =>
    supplementaryNavigation.some((item) => item.label === group.label),
  );
  const primary = groups.filter((group) => !additional.includes(group));
  const routeLink = (item: NavigationLeaf) =>
    item.href ? (
      <NavigationMenuLink
        asChild
        active={pathname === item.href}
        onSelect={() => onValueChange("")}
      >
        <Link
          href={item.href}
          className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:font-semibold aria-[current=page]:text-accent-foreground"
        >
          {item.label}
        </Link>
      </NavigationMenuLink>
    ) : (
      <p className="px-3 py-2 text-sm text-muted-foreground">
        {item.providerLabel} <span className="text-xs">— unavailable</span>
      </p>
    );
  // Panel width follows its content: one column for short groups, two for long ones.
  const groupPanel = (group: NavigationGroup) => {
    const entries = navigationEntries(group);
    const links = entries.reduce(
      (n, entry) => n + (isNavigationSection(entry) ? entry.items.length : 1),
      0,
    );
    const wide = entries.length > 1 && links > 6;
    return (
      <NavigationMenuContent
        aria-label={`${group.providerLabel} destinations`}
        className={`left-1/2 -translate-x-1/2 p-2 ${wide ? "w-xl" : "w-64"}`}
      >
        <ul className={wide ? "columns-2 gap-2" : undefined}>
          {entries.map((entry) => (
            <li key={entry.label} className="mb-3 break-inside-avoid last:mb-0">
              {isNavigationSection(entry) ? (
                <section aria-label={entry.providerPath.join(" / ")}>
                  <h2 className="mb-1 px-3 text-sm font-semibold">
                    {entry.providerPath.join(" / ")}
                  </h2>
                  <ul>
                    {entry.items.map((item) => (
                      <li key={item.label}>{routeLink(item)}</li>
                    ))}
                  </ul>
                </section>
              ) : (
                routeLink(entry)
              )}
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    );
  };
  return (
    <NavigationMenu
      aria-label="Main navigation"
      value={value}
      onValueChange={onValueChange}
    >
      <NavigationMenuList>
        {primary.map((group) => (
          <NavigationMenuItem
            key={group.label}
            value={group.label}
            className="relative"
          >
            {group.href ? (
              <NavigationMenuLink
                asChild
                active={pathname === group.href}
                onSelect={() => onValueChange("")}
              >
                <Link className={navigationMenuTriggerStyle} href={group.href}>
                  {group.label}
                </Link>
              </NavigationMenuLink>
            ) : (
              <>
                <NavigationMenuTrigger data-active={current?.group === group}>
                  {group.providerLabel}
                </NavigationMenuTrigger>
                {groupPanel(group)}
              </>
            )}
          </NavigationMenuItem>
        ))}
        {additional.length > 0 && (
          <NavigationMenuItem value="supplementary" className="relative">
            <NavigationMenuTrigger
              data-active={current && additional.includes(current.group)}
            >
              More
            </NavigationMenuTrigger>
            <NavigationMenuContent aria-label="Supplementary navigation">
              <h2 className="px-3 pt-1 text-sm font-semibold">
                Supplementary navigation
              </h2>
              <Navigation
                key={pathname}
                groups={additional}
                finder={false}
                menuLinks
                label="Additional navigation"
                onNavigate={() => onValueChange("")}
              />
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

// Remount only the interactive header on pathname changes, including history
// navigation. Pages and the dashboard layout retain their server boundaries.
function ShellHeader({
  accountContent,
  headerActions,
  groups,
}: {
  accountContent?: ReactNode;
  /** Optional controls shown before the account menu (e.g. notifications). */
  headerActions?: ReactNode;
  groups: readonly NavigationGroup[];
}) {
  const [openMenu, setOpenMenu] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [finder, setFinder] = useState(false);
  const [account, setAccount] = useState(false);
  const brand = useRef<HTMLAnchorElement>(null);
  const desktop = useRef<HTMLDivElement>(null);
  const hamburger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 80rem)");
    const resize = () => {
      if (
        desktop.current?.contains(document.activeElement) ||
        document.activeElement === hamburger.current
      )
        brand.current?.focus();
      setOpenMenu("");
      setDrawer(false);
      setFinder(false);
      setAccount(false);
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  const closeSurface = () => {
    setDrawer(false);
    setFinder(false);
    setOpenMenu("");
  };
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div
        data-shell-row
        className="flex min-h-15 items-center gap-3 px-4 py-2 sm:px-6 xl:gap-4 xl:px-8"
      >
        <Link
          ref={brand}
          href={
            groups[0]?.href ??
            groups
              .flatMap((group) =>
                navigationEntries(group).flatMap((entry) =>
                  isNavigationSection(entry) ? entry.items : [entry],
                ),
              )
              .find((item) => item.href)?.href ??
            "/profile"
          }
          aria-label={
            groups === navigation ? "LMS — Dashboard" : "LMS — Beranda"
          }
          onClick={closeSurface}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md text-primary"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-accent">
            <Truck className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">LMS</span>
        </Link>
        <div ref={desktop} className="hidden min-w-0 xl:block">
          <DesktopNavigation
            groups={groups}
            value={openMenu}
            onValueChange={(value) => {
              setOpenMenu(value);
              setFinder(false);
            }}
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Sheet
            open={finder}
            onOpenChange={(value) => {
              setFinder(value);
              setOpenMenu("");
            }}
          >
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label="Find menu item"
              >
                <Search aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full gap-0 overflow-y-auto overscroll-contain sm:max-w-md"
            >
              <SheetHeader>
                <SheetTitle>Menu finder</SheetTitle>
                <SheetDescription>
                  Cari halaman yang tersedia sesuai hak akses Anda.
                </SheetDescription>
              </SheetHeader>
              <Navigation
                mobile
                groups={groups}
                label="Menu finder results"
                onNavigate={closeSurface}
              />
            </SheetContent>
          </Sheet>
          {headerActions}
          <DropdownMenu
            open={account}
            onOpenChange={(value) => {
              setAccount(value);
              setOpenMenu("");
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                aria-label="Menu akun"
              >
                <UserRound aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {accountContent ?? (
                <output className="px-3 py-2 text-sm text-muted-foreground">
                  Memuat akun...
                </output>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="xl:hidden">
            <Sheet open={drawer} onOpenChange={setDrawer}>
              <SheetTrigger asChild>
                <Button
                  ref={hamburger}
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label="Open navigation"
                >
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-full gap-0 overflow-y-auto overscroll-contain sm:max-w-md"
                onCloseAutoFocus={(event) => {
                  if (window.matchMedia("(min-width: 80rem)").matches) {
                    event.preventDefault();
                    brand.current?.focus();
                  }
                }}
              >
                <SheetHeader>
                  <SheetTitle>LMS navigation</SheetTitle>
                  <SheetDescription>Navigate LMS pages.</SheetDescription>
                </SheetHeader>
                <Navigation mobile groups={groups} onNavigate={closeSurface} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  accountContent,
  headerActions,
  groups = navigation,
}: {
  children?: ReactNode;
  accountContent?: ReactNode;
  headerActions?: ReactNode;
  groups?: readonly NavigationGroup[];
}) {
  const pathname = usePathname();
  const breadcrumbs = breadcrumbLabels(pathname, groups);
  return (
    <div className="min-h-dvh min-w-0 bg-workspace">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-background p-3 text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <ShellHeader
        key={pathname}
        accountContent={accountContent}
        headerActions={headerActions}
        groups={groups}
      />
      <nav
        aria-label="Breadcrumb"
        className="border-b bg-background px-4 py-2 text-xs sm:px-6 xl:px-8"
      >
        <ol className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 break-words">
          {pathname === DASHBOARD_PATH ? (
            <li>
              <span aria-current="page">Dashboard</span>
            </li>
          ) : (
            <>
              <li>
                <Link
                  href={
                    groups[0]?.href ??
                    groups
                      .flatMap((group) =>
                        navigationEntries(group).flatMap((entry) =>
                          isNavigationSection(entry) ? entry.items : [entry],
                        ),
                      )
                      .find((item) => item.href)?.href ??
                    "/profile"
                  }
                  className="text-muted-foreground hover:text-primary"
                >
                  {groups === navigation ? "Dashboard" : "Beranda"}
                </Link>
              </li>
              {breadcrumbs.map((label, index) => (
                <Fragment key={`${index}-${label}`}>
                  <li aria-hidden="true">
                    <ChevronRight className="size-3" />
                  </li>
                  <li className="min-w-0">
                    <span
                      aria-current={
                        index === breadcrumbs.length - 1 ? "page" : undefined
                      }
                    >
                      {label}
                    </span>
                  </li>
                </Fragment>
              ))}
            </>
          )}
        </ol>
      </nav>
      <main
        id="main-content"
        tabIndex={-1}
        className="w-full min-w-0 scroll-mt-20 space-y-6 px-4 py-6 focus:outline-none sm:px-6 lg:p-8"
      >
        {children}
      </main>
      <footer className="border-t bg-background px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
        {/* Only synthetic examples and the remaining preview screens promise
            no saves; every other route is a live, audited workflow. */}
        {pathname === "/ui-examples" ||
        pathname.startsWith("/ui-examples/") ||
        PREVIEW_ONLY_ROUTES.has(pathname)
          ? "LMS · Presentation preview · No operational records loaded or saved"
          : "LMS · Administrasi · Perubahan data dicatat"}
      </footer>
    </div>
  );
}

const segmentLabels: Record<string, string> = {
  new: "Tambah",
  edit: "Edit",
  scan: "Scan AWB",
  approvals: "Persetujuan",
  history: "Riwayat",
  lookup: "Cari AWB",
  // Master Data group pages; each item menu adds ?kind= to these paths.
  logistics: "Master Data",
  areas: "Area Logistik",
  division: "Divisi Logistik",
  services: "Layanan Logistik",
  vehicles: "Kendaraan Logistik",
};

/**
 * Menu path of the page; a sub-page without its own menu entry (for example
 * /bookings/new or /manifest/7) gets its parent's path plus a short label,
 * never the bare "Page".
 */
function breadcrumbLabels(
  pathname: string,
  groups: readonly NavigationGroup[],
): string[] {
  const find = (path: string) =>
    navigationPath(path, groups)?.labels ?? navigationPath(path)?.labels;
  const extra: string[] = [];
  let path = pathname;
  for (let depth = 0; depth < 4 && path.length > 1; depth++) {
    const found = find(path);
    if (found) return [...found, ...extra];
    const segment = path.slice(path.lastIndexOf("/") + 1);
    extra.unshift(
      segmentLabels[segment] ??
        (/^\d+$/.test(segment)
          ? "Detail"
          : segment.charAt(0).toUpperCase() +
            segment.slice(1).replaceAll("-", " ")),
    );
    path = path.slice(0, path.lastIndexOf("/")) || "/";
  }
  return extra;
}
