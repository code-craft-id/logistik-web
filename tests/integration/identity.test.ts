import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { verifyPassword } from "better-auth/crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { fullAccessPermission } from "../../src/features/identity/permissions";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { createIdentityService } from "../../src/features/identity/server/service";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const connectionString = testDatabaseUrl(
  process.env.TEST_DATABASE_URL,
  process.env.DATABASE_URL,
);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const users: number[] = [];
const groups: number[] = [];
const branches: number[] = [];
let companyId: number;
let officeId: number;
let adminId: number;
let readerId: number;
let memberId: number;
let outsideId: number;
let adminGroupId: number;
let readerGroupId: number;
let emptyGroupId: number;
const service = (userId: number) =>
  createIdentityService(db, () => loadAccessActor(db, userId));
async function user(groupId: number, branchId?: number) {
  const suffix = randomUUID().slice(0, 8);
  const record = await db.user.create({
    data: {
      name: "FAKE Identity test",
      username: `fake_${suffix}`,
      email: `${suffix}@example.invalid`,
      groupId,
      allowedBranches: branchId ? { create: { branchId } } : undefined,
    },
  });
  users.push(record.id);
  return record.id;
}
beforeEach(async () => {
  const suffix = randomUUID().slice(0, 8);
  const company = await db.company.create({
    data: {
      name: `FAKE PLT ${suffix}`,
      isDepositAgent: false,
      showPriceOnPrint: false,
    },
  });
  companyId = company.id;
  const office = await db.office.create({
    data: {
      name: "FAKE PLT Office",
      code: suffix,
      companyId,
      status: "ACTIVE",
    },
  });
  officeId = office.id;
  for (const code of ["A", "B"]) {
    branches.push(
      (
        await db.branch.create({
          data: {
            officeId,
            name: `FAKE PLT ${code}`,
            code: `${suffix}${code}`,
            status: "ACTIVE",
          },
        })
      ).id,
    );
  }
  const administrator = await db.userGroup.create({
    data: {
      name: `FAKE Administrator ${suffix}`,
      permissions: { create: fullAccessPermission },
    },
  });
  const reader = await db.userGroup.create({
    data: {
      name: `FAKE Reader ${suffix}`,
      permissions: { create: { resource: "user", action: "view" } },
    },
  });
  const empty = await db.userGroup.create({
    data: { name: `FAKE Empty ${suffix}` },
  });
  groups.push(administrator.id, reader.id, empty.id);
  adminGroupId = administrator.id;
  readerGroupId = reader.id;
  emptyGroupId = empty.id;
  adminId = await user(adminGroupId);
  readerId = await user(readerGroupId, branches[0]);
  memberId = await user(readerGroupId, branches[0]);
  outsideId = await user(readerGroupId, branches[1]);
});
afterEach(async () => {
  // Exact fixture IDs only; no reset, truncate or production/development connection.
  await db.identityAuditEvent.deleteMany({ where: { actorId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  await db.branch.deleteMany({ where: { id: { in: branches } } });
  await db.office.delete({ where: { id: officeId } });
  await db.company.delete({ where: { id: companyId } });
  users.length = 0;
  groups.length = 0;
  branches.length = 0;
});
afterAll(() => db.$disconnect());

describe("PLT-01 persistent groups and permission inheritance", () => {
  it("preserves inactive existing assignments during maintenance but rejects new assignments and reactivation", async () => {
    await db.branch.update({
      where: { id: branches[0] },
      data: { status: "INACTIVE" },
    });
    await db.userGroup.update({
      where: { id: readerGroupId },
      data: { status: "INACTIVE" },
    });
    await expect(
      service(adminId).updateUser(memberId, {
        name: "FAKE Maintenance",
        groupId: readerGroupId,
        branchIds: [branches[0]],
      }),
    ).resolves.toEqual({ success: true });
    expect(
      await db.userAllowedBranch.count({
        where: { userId: memberId, branchId: branches[0] },
      }),
    ).toBe(1);
    await expect(
      service(adminId).updateUser(outsideId, { branchIds: [branches[0]] }),
    ).rejects.toThrow();
    await service(adminId).updateUser(memberId, { status: "INACTIVE" });
    await expect(
      service(adminId).updateUser(memberId, { status: "ACTIVE" }),
    ).rejects.toThrow();
  });
  it("searches and pages assignment choices beyond 100 rows without widening branch or grant access", async () => {
    const tag = randomUUID().slice(0, 8);
    const branchRows = await db.branch.createManyAndReturn({
      data: Array.from({ length: 105 }, (_, index) => ({
        officeId,
        name: `FAKE OPTIONS ${tag} ${String(index).padStart(3, "0")}`,
        code: `${tag}-${String(index).padStart(3, "0")}`,
        status: "ACTIVE" as const,
      })),
    });
    branches.push(...branchRows.map((row) => row.id));
    const groupRows = await db.userGroup.createManyAndReturn({
      data: Array.from({ length: 105 }, (_, index) => ({
        name: `FAKE OPTIONS ${tag} ${String(index).padStart(3, "0")}`,
        status: "ACTIVE" as const,
      })),
    });
    groups.push(...groupRows.map((row) => row.id));
    const search = `FAKE OPTIONS ${tag}`;
    expect(
      await service(adminId).getBranchesForAssignment({
        search,
        page: 3,
        pageSize: 50,
      }),
    ).toHaveLength(5);
    expect(
      await service(adminId).getGroupsForAssignment({
        search,
        page: 3,
        pageSize: 50,
      }),
    ).toHaveLength(5);
    expect(
      (
        await service(adminId).getPermissionMatrix({
          search,
          page: 3,
          pageSize: 50,
        })
      ).groups,
    ).toHaveLength(5);
    const target = groupRows.find((row) => row.name.endsWith("104"));
    expect(
      (await service(adminId).getPermissionMatrix({ groupId: target?.id }))
        .groups[0].group.id,
    ).toBe(target?.id);
    expect(
      await service(readerId).getBranchesForAssignment({ search }),
    ).toEqual([]);
    const privileged = groupRows[0];
    await db.permission.create({
      data: {
        groupId: privileged.id,
        resource: "system_admin",
        action: "manage",
      },
    });
    expect(
      await service(readerId).getGroupsForAssignment({
        search: privileged.name,
      }),
    ).toEqual([]);
    await expect(
      service(adminId).getBranchesForAssignment({ pageSize: 1000 }),
    ).rejects.toThrow();
  });
  it("rejects a mutation when the initiating session is revoked before acquiring the policy lock", async () => {
    let checks = 0;
    const scoped = createIdentityService(db, async () => {
      checks += 1;
      return checks === 1 ? loadAccessActor(db, adminId) : null;
    });
    const name = `FAKE Revoked ${randomUUID()}`;
    await expect(scoped.createUserGroup({ name })).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      status: 401,
    });
    expect(checks).toBe(2);
    expect(await db.userGroup.count({ where: { name } })).toBe(0);
    expect(
      await db.identityAuditEvent.count({ where: { actorId: adminId } }),
    ).toBe(0);
  });
  it("filters records and totals in SQL and denies direct cross-branch record access", async () => {
    const page = await service(readerId).getUsers({});
    expect(page.items.map((entry) => entry.id).sort()).toEqual(
      [readerId, memberId].sort(),
    );
    expect(page.pagination.total).toBe(2);
    await expect(
      service(readerId).getUserById(outsideId),
    ).rejects.toMatchObject({ status: 404 });
    await db.userAllowedBranch.deleteMany({ where: { userId: readerId } });
    expect((await service(readerId).getUsers({})).pagination.total).toBe(0);
  });
  it("changes a user's group atomically and rechecks the new permissions immediately", async () => {
    await db.session.create({
      data: {
        userId: readerId,
        token: `FAKE-${randomUUID()}`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await service(adminId).updateUser(readerId, { groupId: emptyGroupId });
    await expect(service(readerId).getUsers({})).rejects.toMatchObject({
      status: 403,
    });
    expect(await db.session.count({ where: { userId: readerId } })).toBe(1);
    await service(adminId).updateUser(readerId, { groupId: readerGroupId });
    expect((await service(readerId).getUsers({})).pagination.total).toBe(2);
    expect(
      await db.identityAuditEvent.count({
        where: { subjectId: readerId, action: "USER_UPDATED" },
      }),
    ).toBe(2);
    const firstChange = await db.identityAuditEvent.findFirstOrThrow({
      where: { subjectId: readerId, action: "USER_UPDATED" },
      orderBy: { id: "asc" },
    });
    expect(firstChange.details).toMatchObject({
      priorGroupId: readerGroupId,
      groupId: emptyGroupId,
      priorBranchIds: [branches[0]],
      branchIds: [branches[0]],
    });
  });
  it("revokes an entire group's permission live and does not infer privileges from its name", async () => {
    await service(adminId).updateUserGroup(readerGroupId, {
      name: `Administrator-${randomUUID().slice(0, 8)}`,
    });
    await expect(service(readerId).getUserGroups({})).rejects.toMatchObject({
      status: 403,
    });
    await service(adminId).updatePermissionMatrix({
      groupId: readerGroupId,
      permissions: [{ resource: "user", action: "view", granted: false }],
    });
    await expect(service(readerId).getUsers({})).rejects.toMatchObject({
      status: 403,
    });
    const change = await db.identityAuditEvent.findFirstOrThrow({
      where: {
        subjectType: "group",
        subjectId: readerGroupId,
        action: "PERMISSIONS_UPDATED",
      },
    });
    expect(change.details).toMatchObject({
      grants: [
        {
          resource: "user",
          action: "view",
          granted: false,
          previouslyGranted: true,
        },
      ],
    });
  });
  it("rejects privilege and branch escalation without creating a partial user", async () => {
    await db.permission.createMany({
      data: [
        { groupId: readerGroupId, resource: "user", action: "create" },
        { groupId: readerGroupId, resource: "permission", action: "update" },
      ],
    });
    const count = await db.user.count();
    const input = {
      name: "FAKE Escalation",
      username: "fake_escalation",
      email: "escalation@example.invalid",
      password: "FAKE-password",
      groupId: adminGroupId,
      branchIds: [branches[0]],
    };
    await expect(service(readerId).createUser(input)).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      service(readerId).createUser({
        ...input,
        groupId: emptyGroupId,
        branchIds: [branches[1]],
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service(readerId).updatePermissionMatrix({
        groupId: emptyGroupId,
        permissions: [{ ...fullAccessPermission, granted: true }],
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(await db.user.count()).toBe(count);
  });
  it("rolls back branch replacements on a late username uniqueness failure", async () => {
    const existing = await db.user.findUniqueOrThrow({
      where: { id: readerId },
    });
    const audits = await db.identityAuditEvent.count();
    if (!existing.username) throw new Error("Missing test username");
    await expect(
      service(adminId).updateUser(memberId, {
        branchIds: [branches[1]],
        username: existing.username,
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    expect(
      (
        await db.userAllowedBranch.findMany({ where: { userId: memberId } })
      ).map((entry) => entry.branchId),
    ).toEqual([branches[0]]);
    expect(await db.identityAuditEvent.count()).toBe(audits);
  });
  it("creates username credentials and group assignment in one transaction without returning secrets", async () => {
    const suffix = randomUUID().slice(0, 8);
    const created = await service(adminId).createUser({
      name: "FAKE Created",
      username: `fake_${suffix}`,
      email: `${suffix}@example.invalid`,
      password: "FAKE-password",
      groupId: readerGroupId,
      branchIds: [branches[0]],
    });
    users.push(created.id);
    const credential = await db.authAccount.findFirstOrThrow({
      where: { userId: created.id, providerId: "credential" },
    });
    if (!credential.password) throw new Error("Missing test credential");
    expect(
      await verifyPassword({
        hash: credential.password,
        password: "FAKE-password",
      }),
    ).toBe(true);
    expect(credential.accountId).toBe(String(created.id));
    const dto = await service(adminId).getUserById(created.id);
    expect(dto.group?.id).toBe(readerGroupId);
    expect(JSON.stringify(dto)).not.toMatch(/password|authAccounts|token/);
  });
  it("retains a user's identity but blocks it and revokes sessions when disabled", async () => {
    await db.session.create({
      data: {
        userId: memberId,
        token: `FAKE-${randomUUID()}`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await service(adminId).deleteUser(memberId);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: memberId } })).status,
    ).toBe("INACTIVE");
    expect(await db.session.count({ where: { userId: memberId } })).toBe(0);
    await expect(service(memberId).getUsers({})).rejects.toMatchObject({
      status: 401,
    });
  });
  it("soft deletes groups without losing historical user references", async () => {
    await service(adminId).deleteUserGroup(readerGroupId);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: memberId } })).groupId,
    ).toBe(readerGroupId);
    expect(
      (await db.userGroup.findUniqueOrThrow({ where: { id: readerGroupId } }))
        .deletedAt,
    ).not.toBeNull();
    await expect(service(readerId).getUsers({})).rejects.toMatchObject({
      status: 401,
    });
    expect(
      (await service(adminId).getUserGroups({})).items.some(
        (entry) => entry.id === readerGroupId,
      ),
    ).toBe(false);
  });
  it("protects the final administrator and rolls back its session deletion", async () => {
    await db.session.create({
      data: {
        userId: adminId,
        token: `FAKE-${randomUUID()}`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await expect(service(adminId).deleteUser(adminId)).rejects.toMatchObject({
      code: "LAST_ADMIN",
      status: 409,
    });
    await expect(
      service(adminId).updatePermissionMatrix({
        groupId: adminGroupId,
        permissions: [{ ...fullAccessPermission, granted: false }],
      }),
    ).rejects.toMatchObject({ code: "LAST_ADMIN" });
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: adminId } })).status,
    ).toBe("ACTIVE");
    expect(await db.session.count({ where: { userId: adminId } })).toBe(1);
  });
  it("serializes concurrent administrator demotions so they cannot remove every administrator", async () => {
    const secondGroup = await db.userGroup.create({
      data: {
        name: `FAKE Second Admin ${randomUUID().slice(0, 8)}`,
        permissions: { create: fullAccessPermission },
      },
    });
    groups.push(secondGroup.id);
    const second = await user(secondGroup.id);
    const results = await Promise.allSettled([
      service(adminId).updateUser(second, { groupId: readerGroupId }),
      service(second).updateUser(adminId, { groupId: readerGroupId }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      await db.user.count({
        where: {
          status: "ACTIVE",
          group: {
            is: {
              status: "ACTIVE",
              deletedAt: null,
              permissions: { some: fullAccessPermission },
            },
          },
        },
      }),
    ).toBe(1);
  });
});
