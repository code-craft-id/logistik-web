import { describe, expect, it } from "vitest";
import { accessibleNavigation } from "../../src/components/shell/accessible-navigation";
import {
  type AccessActor,
  permissionResources,
  permissionRestriction,
  validPermission,
} from "../../src/features/identity/permissions";

describe("report-specific navigation grant", () => {
  it("registers view and export after delivery without an administrator-only restriction", () => {
    expect(
      validPermission({ resource: "transaction_report", action: "view" }),
    ).toBe(true);
    expect(
      validPermission({ resource: "transaction_report", action: "create" }),
    ).toBe(false);
    expect(
      validPermission({ resource: "transaction_report", action: "export" }),
    ).toBe(true);
    expect(permissionRestriction("transaction_report")).toBeUndefined();
    const resources = permissionResources.map(
      (entry) => entry.resource as string,
    );
    expect(resources.indexOf("transaction_report")).toBe(
      resources.indexOf("delivery") + 1,
    );
  });
  it("shows the report only for its own grant, without granting transaction detail", () => {
    const actor: AccessActor = {
      id: 1,
      status: "ACTIVE",
      branchIds: [1],
      group: {
        id: 1,
        name: "FAKE",
        deletedAt: null,
        status: "ACTIVE",
        permissions: [{ resource: "transaction_report", action: "view" }],
      },
    };
    expect(JSON.stringify(accessibleNavigation(actor))).toContain(
      '"href":"/branch-reports/transaction-details"',
    );
    expect(JSON.stringify(accessibleNavigation(actor))).not.toContain(
      '"href":"/transactions"',
    );
    if (!actor.group) throw new Error("Missing fixture group");
    actor.group.permissions = [{ resource: "transaction", action: "view" }];
    expect(JSON.stringify(accessibleNavigation(actor))).not.toContain(
      '"href":"/branch-reports/transaction-details"',
    );
  });
});
