import "server-only";

import { prisma } from "@/lib/db";
import { getUserBranchScope } from "@/lib/auth/session";
import { IdentityError } from "@/features/identity/server/access";
import { isAdministrator } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";

function requireNonEmptyBranchScope(branchIds: number[], actor?: any) {
  if (isAdministrator(actor)) {
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
    const where: any = {
      awbNo,
      deletedAt: null,
    };
    if (originBranchId) {
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
    if (originBranchId) return matches[0];
    throw new IdentityError("FORBIDDEN_BRANCH", 409, "AWB ditemukan di beberapa cabang asal. Pilih cabang asal untuk melanjutkan.");
  }
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds, actor);
  if (originBranchId) {
    if (!branchIds.includes(originBranchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
  }
  const where: any = {
    awbNo,
    deletedAt: null,
    OR: [
      { originBranchId: { in: branchIds } },
      { destinationBranchId: { in: branchIds } },
    ],
  };
  if (originBranchId) {
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
  if (originBranchId) return matches[0];
  throw new IdentityError("FORBIDDEN_BRANCH", 409, "AWB ditemukan di beberapa cabang asal. Pilih cabang asal untuk melanjutkan.");
}
