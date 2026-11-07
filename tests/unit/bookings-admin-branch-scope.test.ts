import { describe, expect, it } from "vitest";
import { permitsBranch, isAdministrator, type AccessActor } from "../../src/features/identity/permissions";

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
        permissions: [{ resource: "transaction", action: "update" }, { resource: "manifest", action: "update" }, { resource: "delivery", action: "update" }],
      },
});

describe("admin branch scope consistency", () => {
  it("administrator with empty branchIds can access any branch via permitsBranch", () => {
    expect(isAdministrator(actor([], true))).toBe(true);
    expect(permitsBranch(actor([], true), 99)).toBe(true);
  });

  it("administrator with branchIds can access assigned branches", () => {
    expect(permitsBranch(actor([10], true), 10)).toBe(true);
    expect(permitsBranch(actor([10], true), 99)).toBe(true);
  });

  it("user with valid scope only within assigned branches", () => {
    expect(permitsBranch(actor([5]), 5)).toBe(true);
    expect(permitsBranch(actor([5]), 6)).toBe(false);
  });

  it("user with empty scope denied", () => {
    expect(permitsBranch(actor([]), 1)).toBe(false);
  });

  it("cross-branch access denied for non-admin", () => {
    expect(permitsBranch(actor([1, 2]), 3)).toBe(false);
  });
});
