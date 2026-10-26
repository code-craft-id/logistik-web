import { describe, expect, it } from "vitest";
import { accessibleNavigation } from "../../src/components/shell/accessible-navigation";
import {
  navigationDestinations,
  primaryNavigation,
} from "../../src/components/shell/navigation";
import type { AccessActor } from "../../src/features/identity/permissions";

function actor(resources: string[]): AccessActor {
  return {
    id: 1,
    status: "ACTIVE",
    branchIds: [],
    group: {
      id: 1,
      name: "FAKE",
      status: "ACTIVE",
      deletedAt: null,
      permissions: resources.map((resource) => ({
        resource,
        action: resource === "system_admin" ? "manage" : "view",
      })),
    },
  };
}
describe("available navigation", () => {
  it("shows the full administrator inventory while linking only authorized live routes", () => {
    const groups = accessibleNavigation(actor(["system_admin"]));
    expect(groups.map((group) => group.label)).toEqual(
      primaryNavigation.map((group) => group.label),
    );
    const destinations = navigationDestinations(groups);
    const paths = destinations.map(({ item }) => item.href);
    expect(destinations.length).toBeGreaterThan(30);
    expect(
      destinations.filter(({ item }) => !item.href).length,
    ).toBeGreaterThan(10);
    expect(paths).toContain("/office/company");
    expect(paths).toContain("/logistics/services");
    for (const path of [
      "/dashboard",
      "/perkiraan",
      "/akunting",
      "/transactions",
      "/ui-examples",
    ])
      expect(paths).not.toContain(path);
  });
  it("prunes empty groups and includes only granted view routes", () => {
    const groups = accessibleNavigation(actor(["driver"]));
    expect(groups.map((group) => group.label)).toEqual(["Master Data"]);
    expect(navigationDestinations(groups).map(({ item }) => item.href)).toEqual(
      ["/logistics/division"],
    );
    expect(accessibleNavigation(null)).toEqual([]);
    expect(
      accessibleNavigation({ ...actor(["system_admin"]), status: "INACTIVE" }),
    ).toEqual([]);
  });
  it("exposes vendor and division pages for their new reference permissions", () => {
    expect(
      navigationDestinations(
        accessibleNavigation(actor(["vendor_service"])),
      ).map(({ item }) => item.href),
    ).toEqual(["/vendor"]);
    expect(
      navigationDestinations(
        accessibleNavigation(actor(["marketing_person"])),
      ).map(({ item }) => item.href),
    ).toEqual(["/logistics/division"]);
  });
  it("honors configuration-only readers without requiring company view", () => {
    expect(
      navigationDestinations(accessibleNavigation(actor(["company_bank"]))).map(
        ({ item }) => item.href,
      ),
    ).toEqual(["/office/company"]);
    expect(accessibleNavigation(actor(["vendor_tax"]))).toEqual([]);
  });
});
