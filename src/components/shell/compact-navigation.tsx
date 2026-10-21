"use client";

import {
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  Folder,
  Home,
  ListTree,
  PanelsTopLeft,
  Settings,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
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
  mobile = false,
  groups = navigation,
  onNavigate,
  finder = true,
  label,
  menuLinks = false,
}: {
  mobile?: boolean;
  groups?: readonly NavigationGroup[];
  onNavigate?: () => void;
  finder?: boolean;
  label?: string;
  menuLinks?: boolean;
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
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const results = navigationDestinations(groups).filter(
    ({ item, path, searchLabels }) =>
      search
        .split(/\s+/)
        .every((term) =>
          `${path} ${searchLabels.join(" ")} ${item.label} ${item.providerLabel} ${item.href ?? ""}`
            .toLowerCase()
            .includes(term),
        ),
  );
  const routeLink = (item: NavigationLeaf) => {
    if (!item.href) return null;
    const Icon = item.href === "/" ? Home : PanelsTopLeft;
    const link = (
      <Link
        href={item.href}
        aria-current={pathname === item.href ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          pathname === item.href && "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-words">{item.label}</span>
      </Link>
    );
    if (mobile) return <SheetClose asChild>{link}</SheetClose>;
    return menuLinks ? (
      <NavigationMenuLink asChild active={pathname === item.href}>
        {link}
      </NavigationMenuLink>
    ) : (
      link
    );
  };
  return (
    <nav
      aria-label={label ?? (mobile ? "Mobile navigation" : "Main navigation")}
      className="space-y-4 p-3"
    >
      {finder && (
        <div className="space-y-2 px-3 text-xs leading-5 text-muted-foreground">
          <p>
            Current page:{" "}
            <span className="font-medium text-foreground">
              {current?.labels.join(" / ") ?? "Page"}
            </span>
          </p>
          <p>Presentation previews only. Operational services unavailable.</p>
        </div>
      )}
      {finder && (
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
      {finder && search ? (
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
                    <span className="text-xs"> — unavailable</span>
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
              return <div key={group.label}>{routeLink(group)}</div>;
            }
            if (!navigationEntries(group).length)
              return (
                <p
                  key={group.label}
                  className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm text-muted-foreground"
                >
                  <GroupIcon className="size-4 shrink-0" aria-hidden="true" />
                  {group.providerLabel}
                  <span className="text-xs"> — unavailable</span>
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
                              <span className="text-xs"> — unavailable</span>
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
                                  <span className="text-xs">
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
