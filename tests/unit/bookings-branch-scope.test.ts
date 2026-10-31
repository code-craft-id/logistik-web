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
        permissions: [{ resource: "transaction", action: "view" }],
      },
});

describe("bookings branch scope (fail-closed)", () => {
  it("allows access only within allowed branches", () => {
    expect(permitsBranch(actor([10, 20]), 10)).toBe(true);
    expect(permitsBranch(actor([10]), 20)).toBe(false);
  });

  it("denies cross-branch access", () => {
    expect(permitsBranch(actor([10]), 99)).toBe(false);
  });

  it("requires non-empty branch scope for non-admin", () => {
    expect(permitsBranch(actor([]), 10)).toBe(false);
  });

  it("administrator follows permitsBranch policy", () => {
    expect(permitsBranch(actor([], true), 99)).toBe(true);
    expect(permitsBranch(actor([10], true), 10)).toBe(true);
  });

  it("denies access to invalid branch ids", () => {
    expect(permitsBranch(actor([10]), 0)).toBe(false);
    expect(permitsBranch(actor([10]), -1)).toBe(false);
  });
});
