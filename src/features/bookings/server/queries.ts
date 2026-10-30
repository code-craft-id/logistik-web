import "server-only";

import { prisma } from "@/lib/db";
import { getUserBranchScope } from "@/lib/auth/session";
import { IdentityError } from "@/features/identity/server/access";

function requireNonEmptyBranchScope(branchIds: number[]) {
  if (!branchIds || branchIds.length === 0) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
}

export async function listBookings(params: { limit?: number } = {}) {
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds);
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
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds);
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
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds);
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
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds);
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
  const branchIds = await getUserBranchScope();
  requireNonEmptyBranchScope(branchIds);
  return prisma.transaction.findFirst({
    where: {
      awbNo,
      deletedAt: null,
      ...(originBranchId ? { originBranchId } : {}),
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
      statusHistory: {
        orderBy: { changedAt: "desc" },
      },
    },
  });
}
