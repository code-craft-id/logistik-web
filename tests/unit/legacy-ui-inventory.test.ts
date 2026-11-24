import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import inventory from "../../docs/experiments/legacy-ui-inventory.json";
import screenMap from "../../docs/experiments/legacy-ui-screen-map.json";
import { implementedPreviewRoutes } from "../../src/components/shell/implemented-preview-routes";
import { legacyMenu } from "../../src/components/shell/legacy-menu";
import {
  liveRoutes,
  navigation,
  navigationDestinations,
  providerNavigation,
} from "../../src/components/shell/navigation";

describe("legacy inventory coverage and presentation routing", () => {
  it("maps all 34 declared routes and all nine dormant page components without exclusions", () => {
    expect(inventory.routes).toHaveLength(34);
    expect(inventory.components).toHaveLength(133);
    expect(screenMap).toHaveLength(43);
    for (const route of inventory.routes)
      expect(
        screenMap.some(
          (screen) =>
            screen.path === route.path && screen.source === route.source,
        ),
      ).toBe(true);
    expect(new Set(screenMap.map((screen) => screen.path)).size).toBe(43);
    expect(screenMap.every((screen) => screen.routeImplemented)).toBe(true);
    expect(implementedPreviewRoutes).toHaveLength(43);
  });
  it("preserves source menu ordering and only links concrete implemented pages", () => {
    // Source ordering, except Akunting after Modul as in the sandbox menu
    // (user rule 2026-11-24: real web first, sandbox for the rest).
    const source = inventory.navigation
      .map((group) => group.label)
      .filter((label) => label !== "Akunting");
    source.splice(source.indexOf("Modul") + 1, 0, "Akunting");
    // Share Truck (sandbox-only top menu, D-43) sits before Ticketing.
    source.splice(source.indexOf("Ticketing"), 0, "Share Truck");
    expect(
      navigation
        .slice(0, legacyMenu.length)
        .map((group) => group.providerLabel),
    ).toEqual(source);
    const available = new Set<string>([
      "/ui-examples",
      ...implementedPreviewRoutes.map((item) => item.href),
    ]);
    // FIN is an adopted live workflow, outside the frozen 43-screen preview inventory.
    const finance = navigationDestinations().filter(({ item }) =>
      item.href?.startsWith("/finance/"),
    );
    // Akunting: Data Akun, Biaya Aktual, Cover, Arus Kas & GP; Master Data >
    // Perkiraan; Modul > Keuangan: Invoice (New), Invoice, Pembayaran Hutang.
    expect(finance).toHaveLength(8);
    for (const { item } of finance) {
      expect(
        existsSync(`src/app/(dashboard)${item.href?.split("?")[0]}/page.tsx`),
      ).toBe(true);
      if (item.href) available.add(item.href);
    }
    // Live report workflows added after the preview inventory must exist on disk.
    for (const href of liveRoutes) {
      expect(
        existsSync(`src/app/(dashboard)${href.split("?")[0]}/page.tsx`),
      ).toBe(true);
      available.add(href);
    }
    for (const { item } of navigationDestinations())
      if (item.href) expect(available.has(item.href)).toBe(true);
    for (const { href } of implementedPreviewRoutes)
      expect(
        existsSync(
          `src/app/${href === "/login" ? "(auth)" : "(dashboard)"}${href}/page.tsx`,
        ),
      ).toBe(true);
    expect(
      providerNavigation.flatMap(
        (group) => group.sections?.flatMap((section) => section.items) ?? [],
      ),
    ).toHaveLength(68);
  });
});
