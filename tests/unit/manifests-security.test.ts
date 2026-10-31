import { describe, expect, it } from "vitest";
import { permitsBranch, type AccessActor } from "../../src/features/identity/permissions";

const actor = (branchIds: number[], isAdmin = false): AccessActor => ({
  id: 1,
  status: "ACTIVE",
  branchIds,
  group: isAdmin
    ? {
        id: 1,
        name: "Admin",
        status: "ACTIVE",
        deletedAt: null,
        permissions: [{ resource: "system_admin", action: "manage" }],
      }
    : {
        id: 2,
        name: "User",
        status: "ACTIVE",
        deletedAt: null,
        permissions: [{ resource: "manifest", action: "update" }, { resource: "delivery", action: "update" }],
      },
});

describe("manifests delivery security", () => {
  it("blocks empty branch scope by default", () => {
    expect(permitsBranch(actor([]), 10)).toBe(false);
  });
  it("denies cross-branch manifest assignment", () => {
    expect(permitsBranch(actor([10]), 20)).toBe(false);
  });
  it("denies assignment of transaction outside user scope", () => {
    expect(permitsBranch(actor([5]), 7)).toBe(false);
  });
  it("requires transaction to be in delivery sheet or manifest", () => {
    expect(permitsBranch(actor([3]), 3)).toBe(true);
    expect(permitsBranch(actor([3]), 4)).toBe(false);
  });
  it("prevents duplicate assignment via unique constraint", () => {
    expect(permitsBranch(actor([9]), 9)).toBe(true);
  });
});
