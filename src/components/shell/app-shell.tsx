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
  const groupPanel = (group: NavigationGroup) => (
    <NavigationMenuContent aria-label={`${group.providerLabel} destinations`}>
      <p className="mb-3 border-b px-3 pb-3 text-xs text-muted-foreground">
        Navigate LMS pages
      </p>
      <ul className="grid grid-cols-2 items-start gap-4">
        {navigationEntries(group).map((entry) => (
          <li key={entry.label}>
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
  return (
    <NavigationMenu
      aria-label="Main navigation"
      value={value}
      onValueChange={onValueChange}
    >
      <NavigationMenuList>
        {primary.map((group) => (
          <NavigationMenuItem key={group.label} value={group.label}>
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
          <NavigationMenuItem value="supplementary">
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
  groups,
}: {
  accountContent?: ReactNode;
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
  groups = navigation,
}: {
  children?: ReactNode;
  accountContent?: ReactNode;
  groups?: readonly NavigationGroup[];
}) {
  const pathname = usePathname();
  const breadcrumbs = navigationPath(pathname, groups)?.labels ??
    navigationPath(pathname)?.labels ?? ["Page"];
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
        {[
          "/group-user",
          "/user-management",
          "/hak-akses-menu",
          "/profile",
          "/office",
          "/logistics/areas",
          "/logistics/services",
          "/logistics/vehicles",
          "/logistics/division",
          "/vendor",
          "/shipment-status",
        ].some(
          (route) => pathname === route || pathname.startsWith(`${route}/`),
        )
          ? "LMS · Administrasi · Perubahan data dicatat"
          : "LMS · Presentation preview · No operational records loaded or saved"}
      </footer>
    </div>
  );
}
