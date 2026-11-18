import "server-only";

import type { AccessActor } from "@/features/identity/permissions";
import { isAdministrator } from "@/features/identity/permissions";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import { getUserBranchScope } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";

export function requireNonEmptyBranchScope(
  branchIds: number[],
  actor: AccessActor | null | undefined,
) {
  if (isAdministrator(actor ?? null)) {
    return;
  }
  if (!branchIds || branchIds.length === 0) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
}

export async function listBookings(params: { limit?: number } = {}) {
  const current = await currentIdentity();
  const actor = current?.actor ?? null;
  if (isAdministrator(actor)) {
    const limit = params.limit ?? 50;
    return prisma.booking.findMany({
      where: { deletedAt: null },
      orderBy: { bookingDate: "desc" },
      take: limit,
    });
  }
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds, actor);
  const limit = params.limit ?? 50;
  return prisma.booking.findMany({
    where: {
      deletedAt: null,
      branchId: { in: branchIds },
    },
    orderBy: { bookingDate: "desc" },
    take: limit,
  });
}

export async function getBookingById(id: number) {
  const current = await currentIdentity();
  const actor = current?.actor ?? null;
  if (isAdministrator(actor)) {
    return prisma.booking.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        customer: true,
        branch: true,
        createdBy: true,
        transactions: {
          where: { deletedAt: null },
          orderBy: { transactionDate: "desc" },
        },
      },
    });
  }
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds, actor);
  return prisma.booking.findFirst({
    where: {
      id,
      deletedAt: null,
      branchId: { in: branchIds },
    },
    include: {
      customer: true,
      branch: true,
      createdBy: true,
      transactions: {
        where: { deletedAt: null },
        orderBy: { transactionDate: "desc" },
      },
    },
  });
}

export async function listTransactions(params: { limit?: number } = {}) {
  const current = await currentIdentity();
  const actor = current?.actor ?? null;
  if (isAdministrator(actor)) {
    const limit = params.limit ?? 50;
    return prisma.transaction.findMany({
      where: { deletedAt: null },
      orderBy: { transactionDate: "desc" },
      take: limit,
      include: { originBranch: { select: { name: true } } },
    });
  }
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds, actor);
  const limit = params.limit ?? 50;
  return prisma.transaction.findMany({
    where: {
      deletedAt: null,
      OR: [
        { originBranchId: { in: branchIds } },
        { destinationBranchId: { in: branchIds } },
      ],
    },
    orderBy: { transactionDate: "desc" },
    take: limit,
    include: { originBranch: { select: { name: true } } },
  });
}

export async function getTransactionById(id: number) {
  const current = await currentIdentity();
  const actor = current?.actor ?? null;
  if (isAdministrator(actor)) {
    return prisma.transaction.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        booking: true,
        originBranch: true,
        destinationBranch: true,
        courier: true,
        customer: { select: { name: true } },
        transportMode: { select: { name: true } },
        deliveryService: { select: { name: true } },
        goodsType: { select: { name: true } },
        costType: { select: { name: true } },
        createdBy: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
          include: { actor: true },
        },
      },
    });
  }
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds, actor);
  return prisma.transaction.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { originBranchId: { in: branchIds } },
        { destinationBranchId: { in: branchIds } },
      ],
    },
    include: {
      booking: true,
      originBranch: true,
      destinationBranch: true,
      courier: true,
      customer: { select: { name: true } },
      transportMode: { select: { name: true } },
      deliveryService: { select: { name: true } },
      goodsType: { select: { name: true } },
      costType: { select: { name: true } },
      createdBy: true,
      statusHistory: {
        orderBy: { changedAt: "desc" },
        include: { actor: true },
      },
    },
  });
}

export async function lookupTransactionByAwb(
  awbNo: string,
  originBranchId?: number,
) {
  const current = await currentIdentity();
  const actor = current?.actor ?? null;
  if (isAdministrator(actor)) {
    const where: Prisma.TransactionWhereInput = {
      awbNo,
      deletedAt: null,
    };
    if (originBranchId !== undefined && originBranchId !== null) {
      where.originBranchId = originBranchId;
    }
    const matches = await prisma.transaction.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      include: {
        booking: true,
        originBranch: true,
        destinationBranch: true,
        courier: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];
    if (originBranchId !== undefined && originBranchId !== null) {
      return matches[0];
    }
    return matches;
  }
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds, actor);
  const where: Prisma.TransactionWhereInput = {
    awbNo,
    deletedAt: null,
    OR: [
      { originBranchId: { in: branchIds } },
      { destinationBranchId: { in: branchIds } },
    ],
  };
  if (originBranchId !== undefined && originBranchId !== null) {
    where.originBranchId = originBranchId;
  }
  const matches = await prisma.transaction.findMany({
    where,
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    include: {
      booking: true,
      originBranch: true,
      destinationBranch: true,
      courier: true,
      statusHistory: {
        orderBy: { changedAt: "desc" },
      },
    },
  });
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  if (originBranchId !== undefined && originBranchId !== null) {
    return matches[0];
  }
  // Multiple matches without origin disambiguation: return all (scoped) for UI selection.
  return matches;
}

/** Select options for the Entry AWB form; the service re-validates every value. */
export async function transactionFormOptions(actor: AccessActor) {
  const admin = isAdministrator(actor);
  const active = { deletedAt: null, status: "ACTIVE" as const };
  const byName = { name: "asc" as const };
  const pick = { id: true, name: true } as const;
  const [
    branches,
    customers,
    transportModes,
    deliveryServices,
    goodsTypes,
    costTypes,
  ] = await Promise.all([
    prisma.branch.findMany({
      where: { ...active, ...(admin ? {} : { id: { in: actor.branchIds } }) },
      select: pick,
      orderBy: byName,
    }),
    prisma.customer.findMany({
      where: {
        deletedAt: null,
        ...(admin
          ? {}
          : {
              OR: [{ branchId: { in: actor.branchIds } }, { branchId: null }],
            }),
      },
      select: pick,
      orderBy: byName,
      take: 1000,
    }),
    prisma.transportMode.findMany({
      where: active,
      select: pick,
      orderBy: byName,
    }),
    prisma.deliveryService.findMany({
      where: active,
      select: pick,
      orderBy: byName,
    }),
    prisma.goodsType.findMany({ where: active, select: pick, orderBy: byName }),
    prisma.costType.findMany({ where: active, select: pick, orderBy: byName }),
  ]);
  return {
    branches,
    customers,
    transportModes,
    deliveryServices,
    goodsTypes,
    costTypes,
  };
}
