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
    // Only legacy items without any live page remain unlinked.
    expect(
      destinations
        .filter(({ item }) => !item.href)
        .map(({ item }) => item.providerLabel),
    ).toEqual([]);
    for (const path of [
      "/transactions/approvals",
      "/customer-service/cek-ongkir",
      "/bookings?tab=inbound",
      "/manifest?view=agent",
      "/pod-returns?tab=approval",
      "/finance/debt-payments",
    ])
      expect(paths).toContain(path);
    expect(paths).toContain("/office/company");
    expect(paths).toContain("/logistics/services");
    for (const path of [
      "/dashboard",
      "/branch-reports/manifest-outbound",
      "/branch-reports/delivery",
      "/transactions",
      "/bookings",
      "/manifest",
      "/marketing?tab=customer",
      "/marketing/revenue",
      "/branch-reports/manifest-vendor",
      "/courier-reports",
      "/financial-reports",
      "/branch-reports/gross-profit",
      "/customer-reports/pod",
      "/branch-reports/awb?view=pending",
      "/branch-reports/awb?view=manifested",
      "/branch-reports/rekap-transaksi-harian",
      "/customer-reports/all-status",
    ])
      expect(paths).toContain(path);
    for (const path of [
      "/perkiraan",
      "/akunting",
      "/manifest/new",
      "/ui-examples",
    ])
      expect(paths).not.toContain(path);
  });
  it("links Dev 2 modules and Dev 3 AWB reports only with their own grants", () => {
    const hrefs = (resources: string[]) =>
      navigationDestinations(accessibleNavigation(actor(resources))).map(
        ({ item }) => item.href,
      );
    expect(hrefs(["transaction"])).toEqual([
      "/transactions",
      "/transactions?tab=inbound",
      "/transactions?print=1",
      "/transactions/void",
      // Status Pengantaran = Kelola Status Pengiriman (provider /shipment-status).
      "/customer-service/status-pengantaran",
      "/transactions/lookup",
      "/transactions/history",
      "/transactions/void?view=deleted",
      "/agent-awb",
      "/agent-awb?view=print",
      "/agent-reports",
      "/agent-reports?tab=komisi",
    ]);
    expect(hrefs(["booking"])).toEqual(["/bookings", "/bookings?tab=inbound"]);
    expect(hrefs(["awb_change"])).toEqual(["/transactions/approvals"]);
    expect(hrefs(["pod_return"])).toEqual([
      "/pod-returns",
      "/pod-returns?tab=approval",
    ]);
    expect(hrefs(["transaction_report"])).toEqual([
      "/branch-reports/transaction-details",
      "/branch-reports/rekap-transaksi",
      "/branch-reports/rekap-transaksi-harian",
      "/branch-reports/awb?view=pending",
      "/branch-reports/awb?view=manifested",
      "/branch-reports/customer-monthly-summary",
      "/branch-reports/daily-turnover-summary",
      "/branch-reports/inbound-transaction-details",
      "/customer-reports/shipments",
      "/customer-reports/pod",
      "/customer-reports/all-status",
      "/report-customer",
    ]);
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
