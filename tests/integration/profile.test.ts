import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createProfileService,
  type ProfileIdentity,
} from "../../src/features/identity/server/profile-service";
import { managedIdentityPaths } from "../../src/lib/auth/managed-paths";
import { authSchemaOptions } from "../../src/lib/auth/schema-options";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: testDatabaseUrl(
      process.env.TEST_DATABASE_URL,
      process.env.DATABASE_URL,
    ),
  }),
});
const password = "FAKE-original-password";
const nextPassword = "FAKE-next-password";
let ownerId: number;
let outsideId: number;
let groupId: number;
let accountId: number;
let username: string;
let current: ProfileIdentity;
let otherId: number;
let outsideSessionId: number;
const service = () => createProfileService(db, async () => current);
async function session(userId: number, expired = false) {
  return db.session.create({
    data: {
      userId,
      token: `FAKE-${randomUUID()}`,
      expiresAt: new Date(Date.now() + (expired ? -60_000 : 3_600_000)),
      userAgent: "FAKE Linux test",
      ipAddress: "127.0.0.1",
    },
  });
}

beforeEach(async () => {
  const suffix = randomUUID().slice(0, 8);
  username = `fake_${suffix}`;
  groupId = (
    await db.userGroup.create({ data: { name: `FAKE Profile ${suffix}` } })
  ).id;
  ownerId = (
    await db.user.create({
      data: {
        name: "FAKE Profile",
        username,
        email: `${suffix}@example.invalid`,
        groupId,
      },
    })
  ).id;
  outsideId = (
    await db.user.create({
      data: {
        name: "FAKE Other",
        email: `${suffix}-other@example.invalid`,
        groupId,
      },
    })
  ).id;
  accountId = (
    await db.authAccount.create({
      data: {
        userId: ownerId,
        accountId: String(ownerId),
        providerId: "credential",
        password: await hashPassword(password),
      },
    })
  ).id;
  const active = await session(ownerId);
  current = {
    userId: ownerId,
    sessionId: active.id,
    sessionToken: active.token,
  };
  otherId = (await session(ownerId)).id;
  outsideSessionId = (await session(outsideId)).id;
});
afterEach(async () => {
  await db.identityAuditEvent.deleteMany({
    where: { actorId: { in: [ownerId, outsideId] } },
  });
  await db.user.deleteMany({ where: { id: { in: [ownerId, outsideId] } } });
  await db.userGroup.delete({ where: { id: groupId } });
});
afterAll(() => db.$disconnect());

describe("PLT-01 self-service profile and session security", () => {
  it("allows own profile without user-management grants and returns no credential or session secrets", async () => {
    const profile = await service().getProfile();
    expect(profile).toMatchObject({
      id: ownerId,
      username,
      fullAccess: false,
      allowedBranches: [],
    });
    expect(profile).not.toHaveProperty("authAccounts");
    expect(profile).not.toHaveProperty("sessions");
    await service().updateProfile({ name: "  FAKE Updated  " });
    expect((await service().getProfile()).name).toBe("FAKE Updated");
    const event = await db.identityAuditEvent.findFirstOrThrow({
      where: { actorId: ownerId },
    });
    expect(event.details).toEqual({ nameChanged: true });
    expect(JSON.stringify(event)).not.toContain("FAKE Updated");
  });

  it("rejects role, branch, image, email and target-user injection as well as empty or oversized names", async () => {
    for (const input of [
      { name: "" },
      { name: " " },
      { name: "x".repeat(101) },
      { name: "FAKE", groupId },
      { name: "FAKE", userId: outsideId },
      { name: "FAKE", image: "https://external.invalid/x" },
      { name: "FAKE", email: "fake@example.invalid" },
    ]) {
      await expect(service().updateProfile(input)).rejects.toThrow();
    }
    expect((await service().getProfile()).name).toBe("FAKE Profile");
    expect(
      await db.identityAuditEvent.count({ where: { actorId: ownerId } }),
    ).toBe(0);
  });

  it("paginates only active own sessions, identifies current on the server, and never exposes tokens", async () => {
    await session(ownerId, true);
    await db.session.createMany({
      data: Array.from({ length: 28 }, () => ({
        userId: ownerId,
        token: `FAKE-${randomUUID()}`,
        expiresAt: new Date(Date.now() + 3_600_000),
      })),
    });
    const first = await service().getSessions({});
    const second = await service().getSessions({ page: 2 });
    expect(first.pagination).toMatchObject({ total: 30, totalPages: 2 });
    expect(first.items).toHaveLength(20);
    expect(second.items).toHaveLength(10);
    const items = [...first.items, ...second.items];
    expect(items.filter((row) => row.isCurrent).map((row) => row.id)).toEqual([
      current.sessionId,
    ]);
    expect(items.some((row) => row.id === outsideSessionId)).toBe(false);
    expect(items.every((row) => !("token" in row) && !("userId" in row))).toBe(
      true,
    );
    await expect(service().getSessions({ pageSize: 51 })).rejects.toThrow();
    await expect(service().getSessions({ page: "1x" })).rejects.toThrow();
  });

  it("denies session lookup/deletion for another user, including a full administrator", async () => {
    await db.permission.create({
      data: { groupId, resource: "system_admin", action: "manage" },
    });
    await expect(
      service().revokeSession(outsideSessionId),
    ).rejects.toMatchObject({ status: 404 });
    await expect(service().revokeSession(`${otherId}x`)).rejects.toThrow();
    await expect(service().revokeSession([otherId])).rejects.toThrow();
    expect(
      await db.session.findUnique({ where: { id: outsideSessionId } }),
    ).not.toBeNull();
    expect(
      await db.identityAuditEvent.count({ where: { actorId: ownerId } }),
    ).toBe(0);
  });

  it("revokes one owned session and audits only its identifier", async () => {
    expect(await service().revokeSession(otherId)).toEqual({
      success: true,
      reauthenticate: false,
    });
    expect(await db.session.findUnique({ where: { id: otherId } })).toBeNull();
    expect(
      await db.session.findUnique({ where: { id: current.sessionId } }),
    ).not.toBeNull();
    const event = await db.identityAuditEvent.findFirstOrThrow({
      where: { actorId: ownerId },
    });
    expect(event.details).toEqual({ sessionId: otherId });
  });

  it("derives the preserved session from auth and rejects a supplied current-session override", async () => {
    await expect(
      service().revokeSessions({ scope: "others", currentSessionId: otherId }),
    ).rejects.toThrow();
    expect(await service().revokeSessions({ scope: "others" })).toMatchObject({
      reauthenticate: false,
    });
    expect(await db.session.count({ where: { userId: ownerId } })).toBe(1);
    expect(
      await db.session.findUnique({ where: { id: current.sessionId } }),
    ).not.toBeNull();
    expect(
      await db.session.findUnique({ where: { id: outsideSessionId } }),
    ).not.toBeNull();
  });

  it.each([
    "one",
    "all",
  ])("requires reauthentication after revoking the current session via %s", async (scope) => {
    const result =
      scope === "all"
        ? await service().revokeSessions({ scope })
        : await service().revokeSession(current.sessionId);
    expect(result.reauthenticate).toBe(true);
    await expect(service().getSessions()).rejects.toMatchObject({
      status: 401,
    });
    expect(
      await db.session.findUnique({ where: { id: outsideSessionId } }),
    ).not.toBeNull();
  });

  it("rejects wrong current password and invalid confirmation without any write", async () => {
    const input = {
      currentPassword: "wrong-password",
      newPassword: nextPassword,
      confirmPassword: nextPassword,
    };
    await expect(service().changePassword(input)).rejects.toMatchObject({
      status: 400,
      code: "INVALID_PASSWORD",
    });
    await expect(
      service().changePassword({
        ...input,
        currentPassword: password,
        confirmPassword: "different",
      }),
    ).rejects.toThrow();
    expect(await db.session.count({ where: { userId: ownerId } })).toBe(2);
    expect(
      await db.identityAuditEvent.count({ where: { actorId: ownerId } }),
    ).toBe(0);
  });

  it("changes provider-compatible credentials, revokes every own session and keeps secrets out of audit/DTOs", async () => {
    expect(
      await service().changePassword({
        currentPassword: password,
        newPassword: nextPassword,
        confirmPassword: nextPassword,
      }),
    ).toEqual({ success: true, reauthenticate: true });
    const account = await db.authAccount.findUniqueOrThrow({
      where: { id: accountId },
    });
    expect(
      await verifyPassword({
        hash: account.password as string,
        password: nextPassword,
      }),
    ).toBe(true);
    expect(
      await verifyPassword({ hash: account.password as string, password }),
    ).toBe(false);
    expect(await db.session.count({ where: { userId: ownerId } })).toBe(0);
    const event = await db.identityAuditEvent.findFirstOrThrow({
      where: { actorId: ownerId },
    });
    expect(event.details).toEqual({ passwordChanged: true, revokedCount: 2 });
    expect(JSON.stringify(event)).not.toContain(password);
    expect(JSON.stringify(event)).not.toContain(nextPassword);
    expect(JSON.stringify(event)).not.toContain(account.password);
    const auth = betterAuth({
      ...authSchemaOptions(db),
      disabledPaths: managedIdentityPaths,
      baseURL: "http://localhost:3000",
      secret: "FAKE-PROFILE-ONLY-SECRET-AT-LEAST-32-CHARACTERS",
      emailAndPassword: { enabled: true, disableSignUp: true },
      logger: { disabled: true },
      rateLimit: { enabled: false },
    });
    const response = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ username, password: nextPassword }),
      }),
    );
    expect(response.status).toBe(200);
  });

  it("rolls back the profile, password and session changes if the immutable audit write fails", async () => {
    const failing = db.$extends({
      query: {
        identityAuditEvent: {
          create: async () => {
            throw new Error("FAKE audit unavailable");
          },
        },
      },
    });
    const guarded = createProfileService(
      failing as unknown as PrismaClient,
      async () => current,
    );
    await expect(
      guarded.updateProfile({ name: "FAKE Failed" }),
    ).rejects.toThrow("FAKE audit unavailable");
    expect((await service().getProfile()).name).toBe("FAKE Profile");
    await expect(
      guarded.changePassword({
        currentPassword: password,
        newPassword: nextPassword,
        confirmPassword: nextPassword,
      }),
    ).rejects.toThrow("FAKE audit unavailable");
    const account = await db.authAccount.findUniqueOrThrow({
      where: { id: accountId },
    });
    expect(
      await verifyPassword({ hash: account.password as string, password }),
    ).toBe(true);
    expect(await db.session.count({ where: { userId: ownerId } })).toBe(2);
    await expect(guarded.revokeSession(otherId)).rejects.toThrow(
      "FAKE audit unavailable",
    );
    expect(
      await db.session.findUnique({ where: { id: otherId } }),
    ).not.toBeNull();
  });

  it("denies expired/revoked sessions, forged session ownership and inactive users/groups", async () => {
    const forged = createProfileService(db, async () => ({
      ...current,
      sessionId: outsideSessionId,
    }));
    await expect(forged.getProfile()).rejects.toMatchObject({ status: 401 });
    await db.user.update({
      where: { id: ownerId },
      data: { status: "INACTIVE" },
    });
    await expect(
      service().updateProfile({ name: "FAKE Denied" }),
    ).rejects.toMatchObject({ status: 401 });
    await db.user.update({
      where: { id: ownerId },
      data: { status: "ACTIVE" },
    });
    await db.userGroup.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    });
    await expect(service().getSessions()).rejects.toMatchObject({
      status: 401,
    });
    await db.userGroup.update({
      where: { id: groupId },
      data: { deletedAt: null },
    });
    await db.session.update({
      where: { id: current.sessionId },
      data: { expiresAt: new Date(0) },
    });
    await expect(service().getProfile()).rejects.toMatchObject({ status: 401 });
  });
});
