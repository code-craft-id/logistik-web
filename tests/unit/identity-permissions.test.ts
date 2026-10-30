import { describe, expect, it } from "vitest";
import {
  type AccessActor,
  fullAccessPermission,
  isAdministrator,
  permissionGrantCount,
  permissionResources,
  permits,
  permitsBranch,
  validPermission,
} from "../../src/features/identity/permissions";
import { IdentityError } from "../../src/features/identity/server/access";
import { identityAction } from "../../src/features/identity/server/action";
import {
  assertSameOrigin,
  identityResponse,
} from "../../src/features/identity/server/http";
import {
  permissionMatrixSchema,
  userCreateSchema,
  userUpdateSchema,
} from "../../src/features/identity/validation";

const actor = (
  grants = [{ resource: "user", action: "view" }],
): AccessActor & { group: NonNullable<AccessActor["group"]> } => ({
  id: 1,
  status: "ACTIVE",
  branchIds: [10],
  group: {
    id: 2,
    name: "FAKE Group",
    status: "ACTIVE",
    deletedAt: null,
    permissions: grants,
  },
});
describe("group-owned roles and deny-by-default access", () => {
  it("registers operational resources without granting them to existing groups", () => {
    const operationalResources = [
      "booking",
      "transaction",
      "manifest",
      "delivery",
    ];
    for (const resource of operationalResources) {
      expect(
        permissionResources.find((entry) => entry.resource === resource)
          ?.actions,
      ).toEqual(["view", "create", "update"]);
      expect(validPermission({ resource, action: "delete" })).toBe(false);
      expect(permits(actor(), "view", resource)).toBe(false);
      expect(
        permits(actor([{ resource, action: "view" }]), "view", resource),
      ).toBe(true);
      expect(permits(actor([fullAccessPermission]), "update", resource)).toBe(
        true,
      );
      expect(permits(actor([fullAccessPermission]), "delete", resource)).toBe(
        false,
      );
    }
  });
  it("accepts a complete permission matrix after the inventory grows", () => {
    const permissions = permissionResources.flatMap(({ resource, actions }) =>
      actions.map((action) => ({ resource, action, granted: false })),
    );
    expect(permissions).toHaveLength(permissionGrantCount);
    expect(
      permissionMatrixSchema.safeParse({ groupId: 2, permissions }).success,
    ).toBe(true);
  });
  it("inherits grants only from an active group", () => {
    expect(permits(actor(), "view", "user")).toBe(true);
    expect(permits(actor(), "update", "user")).toBe(false);
    expect(permits({ ...actor(), group: null }, "view", "user")).toBe(false);
    expect(permits({ ...actor(), status: "INACTIVE" }, "view", "user")).toBe(
      false,
    );
    expect(
      permits(
        { ...actor(), group: { ...actor().group, deletedAt: new Date() } },
        "view",
        "user",
      ),
    ).toBe(false);
  });
  it("does not grant a role by username, group ID or an empty branch set", () => {
    expect(isAdministrator(actor())).toBe(false);
    expect(permitsBranch({ ...actor(), branchIds: [] }, 99)).toBe(false);
    expect(permitsBranch(null, 10)).toBe(false);
    expect(permitsBranch(actor(), 10)).toBe(true);
    expect(permitsBranch(actor(), 99)).toBe(false);
  });
  it("supports explicit configurable full access, never arbitrary permission names", () => {
    const admin = actor([fullAccessPermission]);
    expect(isAdministrator(admin)).toBe(true);
    expect(permits(admin, "delete", "user_group")).toBe(true);
    expect(permitsBranch(admin, 99)).toBe(true);
    expect(permits(admin, "execute_sql", "anything")).toBe(false);
    expect(permitsBranch(admin, -1)).toBe(false);
    admin.group.permissions = [];
    expect(permits(admin, "delete", "user_group")).toBe(false);
  });
});

describe("identity server input contracts", () => {
  it("redacts database details even when an exported Server Action is called directly", async () => {
    const error = Object.assign(new Error("FAKE-SECRET email password SQL"), {
      code: "P2002",
    });
    await expect(
      identityAction(async () => {
        throw error;
      }),
    ).rejects.toMatchObject({
      code: "DUPLICATE",
      status: 409,
      message: "Username, email, atau nama grup sudah digunakan.",
    });
    await expect(
      identityAction(async () => {
        throw new Error("FAKE-SECRET");
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      status: 500,
      message: "Permintaan tidak dapat diproses.",
    });
  });
  const input = {
    name: "FAKE User",
    username: "FAKE_User",
    email: "fake@example.invalid",
    password: "FAKE-password",
    groupId: 2,
  };
  it("requires a real group and normalizes username without inventing a per-user role", () => {
    expect(userCreateSchema.parse(input).username).toBe("fake_user");
    expect(
      userCreateSchema.parse({ ...input, email: "FAKE@example.invalid" }).email,
    ).toBe("fake@example.invalid");
    expect(
      userCreateSchema.safeParse({ ...input, groupId: undefined }).success,
    ).toBe(false);
    expect(
      userCreateSchema.safeParse({ ...input, role: "admin" }).success,
    ).toBe(false);
    expect(userUpdateSchema.parse({ groupId: 3 })).toEqual({ groupId: 3 });
    expect(userUpdateSchema.safeParse({ password: "" }).success).toBe(false);
  });
  it("rejects duplicated branches, unknown grants and duplicate permission patches", () => {
    expect(
      userCreateSchema.safeParse({ ...input, branchIds: [1, 1] }).success,
    ).toBe(false);
    expect(
      permissionMatrixSchema.safeParse({
        groupId: 2,
        permissions: [{ action: "arbitrary", resource: "user", granted: true }],
      }).success,
    ).toBe(false);
    const grant = { resource: "user", action: "view", granted: true };
    expect(
      permissionMatrixSchema.safeParse({
        groupId: 2,
        permissions: [grant, grant],
      }).success,
    ).toBe(false);
  });
  it("requires a same-origin mutation and redacts internal database errors", async () => {
    expect(() =>
      assertSameOrigin(
        new Request("http://localhost:3000/user-management/api", {
          headers: { Origin: "https://external.invalid" },
        }),
      ),
    ).toThrow(IdentityError);
    expect(() =>
      assertSameOrigin(
        new Request("http://localhost:3000/user-management/api", {
          headers: { Origin: "http://localhost:3000" },
        }),
      ),
    ).not.toThrow();
    const error = await identityResponse(async () => {
      throw new Error("FAKE-SECRET database SQL password");
    });
    expect(error.status).toBe(500);
    expect(await error.text()).not.toContain("FAKE-SECRET");
    const denied = await identityResponse(async () => {
      throw new IdentityError("FORBIDDEN", 403);
    });
    expect(denied.status).toBe(403);
  });
});
