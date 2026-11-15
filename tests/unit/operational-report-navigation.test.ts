import { expect, it } from "vitest";
import { accessibleNavigation } from "../../src/components/shell/accessible-navigation";
import {
  type AccessActor,
  permissionRestriction,
  validPermission,
} from "../../src/features/identity/permissions";

it("registers read-only rights and exposes exactly their implemented routes", () => {
  for (const resource of [
    "manifest_report",
    "delivery_report",
    "dashboard_report",
  ]) {
    expect(validPermission({ resource, action: "view" })).toBe(true);
    expect(validPermission({ resource, action: "create" })).toBe(false);
    expect(permissionRestriction(resource)).toBeUndefined();
  }
  const actor: AccessActor = {
    id: 1,
    status: "ACTIVE",
    branchIds: [1],
    group: {
      id: 1,
      name: "FAKE",
      status: "ACTIVE",
      deletedAt: null,
      permissions: [{ resource: "manifest_report", action: "view" }],
    },
  };
  const nav = JSON.stringify(accessibleNavigation(actor));
  expect(nav).toContain('"href":"/branch-reports/manifest-outbound"');
  expect(nav).not.toContain('"href":"/branch-reports/manifest-vendor"');
  expect(nav).not.toContain('"href":"/branch-reports/delivery"');
  expect(nav).not.toContain('"href":"/dashboard"');
  if (!actor.group) throw new Error("Missing fixture group");
  actor.group.permissions = [{ resource: "dashboard_report", action: "view" }];
  expect(JSON.stringify(accessibleNavigation(actor))).toContain(
    '"href":"/dashboard"',
  );
  actor.group.permissions = [{ resource: "delivery_report", action: "view" }];
  expect(JSON.stringify(accessibleNavigation(actor))).toContain(
    '"href":"/branch-reports/delivery"',
  );
  actor.group.permissions = [{ resource: "manifest", action: "view" }];
  expect(JSON.stringify(accessibleNavigation(actor))).not.toContain(
    '"href":"/branch-reports/manifest-outbound"',
  );
});
