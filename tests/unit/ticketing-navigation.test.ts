import { describe, expect, it } from "vitest";
import { accessibleNavigation } from "../../src/components/shell/accessible-navigation";
import type { AccessActor } from "../../src/features/identity/permissions";

describe("implemented ticket navigation", () => {
  it("links the ticket list for a view grant and omits it without the grant", () => {
    const actor: AccessActor = {
      id: 1,
      status: "ACTIVE",
      branchIds: [10],
      group: {
        id: 1,
        name: "FAKE",
        status: "ACTIVE",
        deletedAt: null,
        permissions: [{ resource: "ticket", action: "view" }],
      },
    };
    expect(JSON.stringify(accessibleNavigation(actor))).toContain(
      '"href":"/ticketting"',
    );
    if (!actor.group) throw new Error("Missing fixture group");
    actor.group.permissions = [];
    expect(JSON.stringify(accessibleNavigation(actor))).not.toContain(
      '"href":"/ticketting"',
    );
  });
});
