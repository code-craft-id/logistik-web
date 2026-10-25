import "server-only";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import { activeActor, isAdministrator } from "../permissions";
import {
  profilePasswordSchema,
  profileSessionIdSchema,
  profileUpdateSchema,
  sessionListSchema,
  sessionRevokeSchema,
} from "../profile-validation";
import { IdentityError, loadAccessActor } from "./access";

/** Server-only identity from Better Auth, never accepted as mutation input. */
export type ProfileIdentity = {
  userId: number;
  sessionId: number;
  sessionToken: string;
};

export function createProfileService(
  db: PrismaClient,
  resolveIdentity: () => Promise<ProfileIdentity | null>,
) {
  const unauthenticated = () =>
    new IdentityError("UNAUTHENTICATED", 401, "Silakan masuk kembali.");

  async function live(tx: Prisma.TransactionClient, identity: ProfileIdentity) {
    const session = await tx.session.findFirst({
      where: {
        id: identity.sessionId,
        userId: identity.userId,
        token: identity.sessionToken,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!session) throw unauthenticated();
    const actor = await loadAccessActor(tx, identity.userId);
    if (!activeActor(actor)) throw unauthenticated();
    return actor;
  }
  async function current() {
    const identity = await resolveIdentity();
    if (!identity) throw unauthenticated();
    const actor = await live(db, identity);
    return { identity, actor };
  }
  async function mutate<T>(
    identity: ProfileIdentity,
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    return db.$transaction(
      async (tx) => {
        // Same lock as administrator policy/credential changes. Revalidate after waiting.
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
        await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(71642, 1)`;
        await live(tx, identity);
        return work(tx);
      },
      { timeout: 15000 },
    );
  }
  async function audit(
    tx: Prisma.TransactionClient,
    userId: number,
    action: string,
    details: Prisma.InputJsonObject,
  ) {
    await tx.identityAuditEvent.create({
      data: {
        actorId: userId,
        action,
        subjectType: "user",
        subjectId: userId,
        details,
      },
    });
  }

  return {
    async getProfile() {
      const { identity, actor } = await current();
      const user = await db.user.findUniqueOrThrow({
        where: { id: identity.userId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          createdAt: true,
          allowedBranches: {
            where: { branchId: { in: actor.branchIds } },
            select: {
              branch: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });
      return {
        ...user,
        fullAccess: isAdministrator(actor),
        group: { id: actor.group.id, name: actor.group.name },
        allowedBranches: user.allowedBranches.map((item) => item.branch),
      };
    },
    async updateProfile(input: unknown) {
      const { name } = profileUpdateSchema.parse(input);
      const { identity } = await current();
      return mutate(identity, async (tx) => {
        await tx.user.update({
          where: { id: identity.userId },
          data: { name },
        });
        await audit(tx, identity.userId, "PROFILE_UPDATED", {
          nameChanged: true,
        });
        return { success: true };
      });
    },
    async changePassword(input: unknown) {
      const data = profilePasswordSchema.parse(input);
      const { identity } = await current();
      const accounts = await db.authAccount.findMany({
        where: { userId: identity.userId, providerId: "credential" },
        select: { id: true, password: true },
        take: 2,
      });
      const [account] = accounts;
      if (accounts.length !== 1 || !account?.password)
        throw new IdentityError(
          "CREDENTIAL_CONFLICT",
          409,
          "Akun login perlu diperiksa.",
        );
      const oldHash = account.password;
      if (
        !(await verifyPassword({
          hash: oldHash,
          password: data.currentPassword,
        }))
      )
        throw new IdentityError(
          "INVALID_PASSWORD",
          400,
          "Password saat ini tidak sesuai.",
        );
      // Provider-compatible crypto; hash outside the policy lock.
      const password = await hashPassword(data.newPassword);
      return mutate(identity, async (tx) => {
        const updated = await tx.authAccount.updateMany({
          where: { id: account.id, userId: identity.userId, password: oldHash },
          data: { password },
        });
        if (updated.count !== 1)
          throw new IdentityError(
            "CREDENTIAL_CONFLICT",
            409,
            "Password telah berubah. Silakan masuk kembali.",
          );
        const revoked = await tx.session.deleteMany({
          where: { userId: identity.userId },
        });
        await audit(tx, identity.userId, "PASSWORD_CHANGED", {
          passwordChanged: true,
          revokedCount: revoked.count,
        });
        return { success: true, reauthenticate: true };
      });
    },
    async getSessions(input: unknown = {}) {
      const { page, pageSize } = sessionListSchema.parse(input);
      const { identity } = await current();
      const where = { userId: identity.userId, expiresAt: { gt: new Date() } };
      const [rows, total] = await Promise.all([
        db.session.findMany({
          where,
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            expiresAt: true,
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
        db.session.count({ where }),
      ]);
      return {
        items: rows.map((row) => ({
          ...row,
          isCurrent: row.id === identity.sessionId,
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    },
    async revokeSession(inputId: unknown) {
      const id = profileSessionIdSchema.parse(inputId);
      const { identity } = await current();
      return mutate(identity, async (tx) => {
        const revoked = await tx.session.deleteMany({
          where: { id, userId: identity.userId },
        });
        if (!revoked.count)
          throw new IdentityError(
            "SESSION_NOT_FOUND",
            404,
            "Sesi tidak ditemukan.",
          );
        await audit(tx, identity.userId, "SESSION_REVOKED", { sessionId: id });
        return { success: true, reauthenticate: id === identity.sessionId };
      });
    },
    async revokeSessions(input: unknown) {
      const { scope } = sessionRevokeSchema.parse(input);
      const { identity } = await current();
      return mutate(identity, async (tx) => {
        const revoked = await tx.session.deleteMany({
          where: {
            userId: identity.userId,
            ...(scope === "others" ? { id: { not: identity.sessionId } } : {}),
          },
        });
        await audit(tx, identity.userId, "SESSIONS_REVOKED", {
          scope,
          revokedCount: revoked.count,
        });
        return { success: true, reauthenticate: scope === "all" };
      });
    },
  };
}
