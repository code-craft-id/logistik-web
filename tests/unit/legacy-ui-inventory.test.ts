import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import inventory from "../../docs/experiments/legacy-ui-inventory.json";
import screenMap from "../../docs/experiments/legacy-ui-screen-map.json";
import { implementedPreviewRoutes } from "../../src/components/shell/implemented-preview-routes";
import { legacyMenu } from "../../src/components/shell/legacy-menu";
import {
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
    expect(
      navigation
        .slice(0, legacyMenu.length)
        .map((group) => group.providerLabel),
    ).toEqual(inventory.navigation.map((group) => group.label));
    const available = new Set<string>([
      "/ui-examples",
      ...implementedPreviewRoutes.map((item) => item.href),
    ]);
    for (const { item } of navigationDestinations())
      if (item.href) expect(available.has(item.href)).toBe(true);
    for (const { href } of implementedPreviewRoutes)
      expect(
        existsSync(
          `src/app/${href === "/login" ? "(auth)" : "(dashboard)"}${href === "/" ? "" : href}/page.tsx`,
        ),
      ).toBe(true);
    expect(
      providerNavigation.flatMap(
        (group) => group.sections?.flatMap((section) => section.items) ?? [],
      ),
    ).toHaveLength(68);
  });
});
