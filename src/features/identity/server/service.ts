import "server-only";
import { hashPassword } from "better-auth/crypto";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import {
  type AccessActor,
  fullAccessPermission,
  isAdministrator,
  permissionResources,
  permits,
} from "../permissions";
import {
  identityId,
  listQuerySchema,
  permissionCreateSchema,
  permissionMatrixSchema,
  userCreateSchema,
  userGroupCreateSchema,
  userGroupUpdateSchema,
  userUpdateSchema,
} from "../validation";
import {
  assertPermission,
  IdentityError,
  loadAccessActor,
  visibleUsers,
} from "./access";

const userSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  status: true,
  createdAt: true,
  group: {
    select: {
      id: true,
      name: true,
      status: true,
      deletedAt: true,
      permissions: { where: fullAccessPermission, select: { id: true } },
    },
  },
  allowedBranches: {
    select: { branch: { select: { id: true, name: true, code: true } } },
  },
} satisfies Prisma.UserSelect;
type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;
function userDto(user: UserRow) {
  return {
    ...user,
    group: user.group ? { id: user.group.id, name: user.group.name } : null,
    fullAccess:
      user.status === "ACTIVE" &&
      user.group?.status === "ACTIVE" &&
      user.group.deletedAt === null &&
      user.group.permissions.length > 0,
    canAccess: true,
  };
}
const adminUserWhere = {
  status: "ACTIVE",
  group: {
    is: {
      status: "ACTIVE",
      deletedAt: null,
      permissions: { some: fullAccessPermission },
    },
  },
} satisfies Prisma.UserWhereInput;

/** Bounded PLT-01 slice. No finance/shipment repositories or role-name shortcuts. */
export function createIdentityService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function actor(action: string, resource: string) {
    const current = await resolveActor();
    assertPermission(current, action, resource);
    return current;
  }
  async function audit(
    tx: Prisma.TransactionClient,
    current: AccessActor,
    action: string,
    subjectType: string,
    subjectId: number,
    details?: Prisma.InputJsonObject,
  ) {
    await tx.identityAuditEvent.create({
      data: { actorId: current.id, action, subjectType, subjectId, details },
    });
  }
  async function mutate<T>(
    action: string,
    resource: string,
    work: (tx: Prisma.TransactionClient, current: AccessActor) => Promise<T>,
  ): Promise<T> {
    const initial = await actor(action, resource);
    return db.$transaction(
      async (tx) => {
        // Serialize identity policy changes and last-admin checks, including concurrent demotions.
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
        await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(71642, 1)`;
        // Password hashing and lock contention can outlive the initiating session.
        // Recheck the request's session before accepting any policy write.
        const liveActor = await resolveActor();
        if (!liveActor || liveActor.id !== initial.id)
          throw new IdentityError(
            "UNAUTHENTICATED",
            401,
            "Silakan masuk kembali.",
          );
        const fresh = await loadAccessActor(tx, initial.id);
        assertPermission(fresh, action, resource);
        const result = await work(tx, fresh);
        if ((await tx.user.count({ where: adminUserWhere })) === 0) {
          throw new IdentityError(
            "LAST_ADMIN",
            409,
            "Administrator aktif terakhir tidak boleh dinonaktifkan atau kehilangan akses penuh.",
          );
        }
        return result;
      },
      { timeout: 15000 },
    );
  }
  async function groupFor(
    tx: Prisma.TransactionClient,
    id: number,
    requireActive = false,
  ) {
    const group = await tx.userGroup.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(requireActive ? { status: "ACTIVE" as const } : {}),
      },
      include: { permissions: { select: { action: true, resource: true } } },
    });
    if (!group)
      throw new IdentityError(
        "GROUP_NOT_FOUND",
        404,
        "Grup tidak ditemukan atau tidak aktif.",
      );
    return group;
  }
  async function assertGroupScope(
    tx: Prisma.TransactionClient,
    current: AccessActor,
    groupId: number,
  ) {
    if (
      !isAdministrator(current) &&
      (await tx.user.count({
        where: { groupId, NOT: visibleUsers(current) },
      }))
    )
      throw new IdentityError(
        "FORBIDDEN",
        403,
        "Grup ini mempunyai anggota di luar cakupan Anda.",
      );
  }
  async function assertAssignments(
    tx: Prisma.TransactionClient,
    current: AccessActor,
    groupId: number,
    branchIds?: number[],
    requireActiveGroup = true,
  ) {
    const group = await groupFor(tx, groupId, requireActiveGroup);
    if (
      !isAdministrator(current) &&
      group.permissions.some(
        (grant) => !permits(current, grant.action, grant.resource),
      )
    ) {
      throw new IdentityError(
        "FORBIDDEN",
        403,
        "Tidak boleh memberikan peran yang lebih tinggi dari hak akses Anda.",
      );
    }
    if (branchIds) {
      if (
        !isAdministrator(current) &&
        branchIds.some((id) => !current.branchIds.includes(id))
      ) {
        throw new IdentityError(
          "FORBIDDEN_BRANCH",
          403,
          "Penugasan cabang di luar cakupan Anda.",
        );
      }
      if (
        (await tx.branch.count({
          where: {
            id: { in: branchIds },
            status: "ACTIVE",
            deletedAt: null,
            office: {
              status: "ACTIVE",
              deletedAt: null,
              company: { deletedAt: null },
            },
          },
        })) !== branchIds.length
      ) {
        throw new IdentityError(
          "INVALID_BRANCH",
          400,
          "Cabang tidak ditemukan atau tidak aktif.",
        );
      }
    }
  }
  return {
    async getUserGroups(input: unknown = {}) {
      const current = await actor("view", "user_group");
      const { page, pageSize, search, status } = listQuerySchema.parse(input);
      const where: Prisma.UserGroupWhereInput = {
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(!isAdministrator(current)
          ? { users: { every: visibleUsers(current) } }
          : {}),
      };
      const [items, total] = await Promise.all([
        db.userGroup.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [{ name: "asc" }, { id: "asc" }],
          include: { _count: { select: { users: true, permissions: true } } },
        }),
        db.userGroup.count({ where }),
      ]);
      return {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    },
    async getUserGroupById(input: unknown) {
      const current = await actor("view", "user_group");
      const id = identityId.parse(input);
      await assertGroupScope(db, current, id);
      const group = await groupFor(db, id);
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        status: group.status,
        permissions: group.permissions,
      };
    },
    async createUserGroup(input: unknown) {
      const data = userGroupCreateSchema.parse(input);
      return mutate("create", "user_group", async (tx, current) => {
        const group = await tx.userGroup.create({ data });
        await audit(tx, current, "GROUP_CREATED", "group", group.id);
        return { id: group.id, name: group.name };
      });
    },
    async updateUserGroup(inputId: unknown, input: unknown) {
      const id = identityId.parse(inputId);
      const data = userGroupUpdateSchema.parse(input);
      return mutate("update", "user_group", async (tx, current) => {
        await groupFor(tx, id);
        await assertGroupScope(tx, current, id);
        await tx.userGroup.update({ where: { id }, data });
        if (data.status === "INACTIVE")
          await tx.session.deleteMany({ where: { user: { groupId: id } } });
        await audit(tx, current, "GROUP_UPDATED", "group", id, {
          status: data.status ?? null,
        });
        return { success: true };
      });
    },
    async deleteUserGroup(input: unknown) {
      const id = identityId.parse(input);
      return mutate("delete", "user_group", async (tx, current) => {
        await groupFor(tx, id);
        await assertGroupScope(tx, current, id);
        await tx.userGroup.update({
          where: { id },
          data: { status: "INACTIVE", deletedAt: new Date() },
        });
        await tx.session.deleteMany({ where: { user: { groupId: id } } });
        await audit(tx, current, "GROUP_DELETED", "group", id);
        return { success: true };
      });
    },
    async getUsers(input: unknown = {}) {
      const current = await actor("view", "user");
      const { page, pageSize, search, status, groupId } =
        listQuerySchema.parse(input);
      const where: Prisma.UserWhereInput = {
        AND: [visibleUsers(current)],
        ...(status ? { status } : {}),
        ...(groupId ? { groupId } : {}),
        ...(search
          ? {
              OR: ["name", "email", "username"].map((key) => ({
                [key]: { contains: search, mode: "insensitive" },
              })),
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        db.user.findMany({
          where,
          select: userSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        }),
        db.user.count({ where }),
      ]);
      return {
        items: items.map(userDto),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    },
    async getUserById(input: unknown) {
      const current = await actor("view", "user");
      const id = identityId.parse(input);
      const user = await db.user.findFirst({
        where: { id, AND: [visibleUsers(current)] },
        select: userSelect,
      });
      if (!user)
        throw new IdentityError("USER_NOT_FOUND", 404, "User tidak ditemukan.");
      return userDto(user);
    },
    async createUser(input: unknown) {
      const data = userCreateSchema.parse(input);
      await actor("create", "user");
      const encodedPassword = await hashPassword(data.password);
      return mutate("create", "user", async (tx, current) => {
        await assertAssignments(tx, current, data.groupId, data.branchIds);
        const user = await tx.user.create({
          data: {
            name: data.name,
            username: data.username,
            displayUsername: data.username,
            email: data.email,
            groupId: data.groupId,
            status: data.status,
            allowedBranches: {
              create: data.branchIds.map((branchId) => ({ branchId })),
            },
          },
        });
        await tx.authAccount.create({
          data: {
            userId: user.id,
            accountId: String(user.id),
            providerId: "credential",
            password: encodedPassword,
          },
        });
        await audit(tx, current, "USER_CREATED", "user", user.id, {
          groupId: data.groupId,
          branchIds: data.branchIds,
          status: data.status,
        });
        return { id: user.id, username: user.username };
      });
    },
    async updateUser(inputId: unknown, input: unknown) {
      const id = identityId.parse(inputId);
      const data = userUpdateSchema.parse(input);
      await actor("update", "user");
      const encodedPassword = data.password
        ? await hashPassword(data.password)
        : undefined;
      return mutate("update", "user", async (tx, current) => {
        const previous = await tx.user.findFirst({
          where: { id, AND: [visibleUsers(current)] },
          select: {
            id: true,
            groupId: true,
            status: true,
            email: true,
            username: true,
            allowedBranches: { select: { branchId: true } },
          },
        });
        if (!previous)
          throw new IdentityError(
            "USER_NOT_FOUND",
            404,
            "User tidak ditemukan.",
          );
        const groupId = data.groupId ?? previous.groupId;
        if (groupId) {
          const needsActiveAssignments =
            groupId !== previous.groupId ||
            (data.status === "ACTIVE" && previous.status !== "ACTIVE");
          const previousBranchIds = previous.allowedBranches.map(
            (entry) => entry.branchId,
          );
          await assertAssignments(
            tx,
            current,
            groupId,
            needsActiveAssignments
              ? (data.branchIds ?? previousBranchIds)
              : data.branchIds?.filter(
                  (branchId) => !previousBranchIds.includes(branchId),
                ),
            needsActiveAssignments,
          );
        }
        if (data.branchIds) {
          await tx.userAllowedBranch.deleteMany({ where: { userId: id } });
          await tx.userAllowedBranch.createMany({
            data: data.branchIds.map((branchId) => ({ userId: id, branchId })),
          });
        }
        const { password: _password, branchIds: _branches, ...fields } = data;
        const emailChanged =
          data.email !== undefined && data.email !== previous.email;
        const usernameChanged =
          data.username !== undefined && data.username !== previous.username;
        await tx.user.update({
          where: { id },
          data: {
            ...fields,
            ...(data.username ? { displayUsername: data.username } : {}),
            ...(emailChanged ? { emailVerified: false } : {}),
          },
        });
        if (encodedPassword) {
          const credentials = await tx.authAccount.findMany({
            where: { userId: id, providerId: "credential" },
            select: { id: true },
          });
          if (credentials.length !== 1)
            throw new IdentityError(
              "CREDENTIAL_CONFLICT",
              409,
              "Akun login perlu diperiksa.",
            );
          await tx.authAccount.update({
            where: { id: credentials[0].id },
            data: { password: encodedPassword },
          });
        }
        if (
          encodedPassword ||
          data.status === "INACTIVE" ||
          emailChanged ||
          usernameChanged
        ) {
          await tx.session.deleteMany({ where: { userId: id } });
        }
        await audit(tx, current, "USER_UPDATED", "user", id, {
          priorGroupId: previous.groupId,
          priorBranchIds: previous.allowedBranches.map(
            (entry) => entry.branchId,
          ),
          priorStatus: previous.status,
          groupId,
          branchIds:
            data.branchIds ??
            previous.allowedBranches.map((entry) => entry.branchId),
          status: data.status ?? previous.status,
          passwordChanged: !!encodedPassword,
        });
        return { success: true };
      });
    },
    async deleteUser(input: unknown) {
      const id = identityId.parse(input);
      return mutate("delete", "user", async (tx, current) => {
        const user = await tx.user.findFirst({
          where: { id, AND: [visibleUsers(current)] },
          select: { id: true },
        });
        if (!user)
          throw new IdentityError(
            "USER_NOT_FOUND",
            404,
            "User tidak ditemukan.",
          );
        await tx.user.update({ where: { id }, data: { status: "INACTIVE" } });
        await tx.session.deleteMany({ where: { userId: id } });
        await audit(tx, current, "USER_DISABLED", "user", id);
        return { success: true };
      });
    },
    async getBranchesForAssignment(input: unknown = {}) {
      const current = await actor("view", "user");
      const query = listQuerySchema.parse(input);
      return db.branch.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          ...(query.search
            ? {
                OR: [
                  {
                    name: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    code: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              }
            : {}),
          office: {
            status: "ACTIVE",
            deletedAt: null,
            company: { deletedAt: null },
          },
          ...(!isAdministrator(current)
            ? { id: { in: current.branchIds } }
            : {}),
        },
        select: {
          id: true,
          name: true,
          code: true,
          office: { select: { name: true } },
        },
        orderBy: [{ code: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      });
    },
    async getGroupsForAssignment(input: unknown = {}) {
      const current = await actor("view", "user");
      const query = listQuerySchema.parse(input);
      const groups = await db.userGroup.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          ...(query.search
            ? { name: { contains: query.search, mode: "insensitive" as const } }
            : {}),
          ...(!isAdministrator(current)
            ? {
                permissions: {
                  every: {
                    OR: (current.group?.permissions ?? []).map(
                      ({ resource, action }) => ({ resource, action }),
                    ),
                  },
                },
              }
            : {}),
        },
        include: { permissions: { select: { resource: true, action: true } } },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      });
      return groups
        .filter(
          (group) =>
            isAdministrator(current) ||
            group.permissions.every((grant) =>
              permits(current, grant.action, grant.resource),
            ),
        )
        .map((group) => ({ id: group.id, name: group.name }));
    },
    async getPermissionMatrix(input: unknown = {}) {
      const current = await actor("view", "permission");
      const query = listQuerySchema.parse(input);
      const groups = await db.userGroup.findMany({
        where: {
          deletedAt: null,
          ...(query.groupId ? { id: query.groupId } : {}),
          ...(query.search
            ? { name: { contains: query.search, mode: "insensitive" as const } }
            : {}),
          ...(!isAdministrator(current)
            ? { users: { every: visibleUsers(current) } }
            : {}),
        },
        include: {
          permissions: { select: { resource: true, action: true } },
          _count: { select: { users: true } },
        },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      });
      return {
        resources: permissionResources,
        groups: groups.map((group) => ({
          group: {
            id: group.id,
            name: group.name,
            userCount: group._count.users,
          },
          permissions: Object.fromEntries(
            permissionResources.map(({ resource, actions }) => [
              resource,
              Object.fromEntries(
                actions.map((action) => [
                  action,
                  group.permissions.some(
                    (grant) =>
                      grant.resource === resource && grant.action === action,
                  ),
                ]),
              ),
            ]),
          ),
        })),
      };
    },
    async updatePermissionMatrix(input: unknown) {
      const { groupId, permissions } = permissionMatrixSchema.parse(input);
      return mutate("update", "permission", async (tx, current) => {
        await groupFor(tx, groupId);
        await assertGroupScope(tx, current, groupId);
        const previous = new Set(
          (
            await tx.permission.findMany({
              where: { groupId },
              select: { resource: true, action: true },
            })
          ).map((grant) => `${grant.resource}:${grant.action}`),
        );
        for (const grant of permissions) {
          if (
            grant.granted &&
            !permits(current, grant.action, grant.resource)
          ) {
            throw new IdentityError(
              "FORBIDDEN",
              403,
              "Tidak boleh memberikan hak akses melebihi peran Anda.",
            );
          }
          if (grant.granted) {
            await tx.permission.upsert({
              where: {
                action_resource_groupId: {
                  action: grant.action,
                  resource: grant.resource,
                  groupId,
                },
              },
              update: {},
              create: {
                action: grant.action,
                resource: grant.resource,
                groupId,
              },
            });
          } else {
            await tx.permission.deleteMany({
              where: {
                groupId,
                resource: grant.resource,
                action: grant.action,
              },
            });
          }
        }
        await audit(tx, current, "PERMISSIONS_UPDATED", "group", groupId, {
          grants: permissions.map((grant) => ({
            ...grant,
            previouslyGranted: previous.has(
              `${grant.resource}:${grant.action}`,
            ),
          })),
        });
        return { success: true };
      });
    },
    async assignPermission(groupId: unknown, action: string, resource: string) {
      const grant = permissionCreateSchema.parse({ groupId, action, resource });
      return this.updatePermissionMatrix({
        groupId: grant.groupId,
        permissions: [{ action, resource, granted: true }],
      });
    },
    async removePermission(input: unknown) {
      await actor("update", "permission");
      const id = identityId.parse(input);
      const grant = await db.permission.findUnique({
        where: { id },
        select: { groupId: true, action: true, resource: true },
      });
      if (!grant)
        throw new IdentityError(
          "PERMISSION_NOT_FOUND",
          404,
          "Hak akses tidak ditemukan.",
        );
      return this.updatePermissionMatrix({
        groupId: grant.groupId,
        permissions: [
          { action: grant.action, resource: grant.resource, granted: false },
        ],
      });
    },
  };
}
