import "server-only";

import { prisma } from "@/lib/db";
import { getUserBranchScope } from "@/lib/auth/session";

export async function listBookings(params: { limit?: number } = {}) {
  const branchIds = await getUserBranchScope();
  const limit = params.limit ?? 50;
  return prisma.booking.findMany({
    where: {
      deletedAt: null,
      ...(branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
    },
    orderBy: { bookingDate: "desc" },
    take: limit,
  });
}

export async function getBookingById(id: number) {
  const branchIds = await getUserBranchScope();
  return prisma.booking.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
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
  const limit = params.limit ?? 50;
  return prisma.transaction.findMany({
    where: {
      deletedAt: null,
      ...(branchIds.length > 0
        ? {
            OR: [
              { originBranchId: { in: branchIds } },
              { destinationBranchId: { in: branchIds } },
            ],
          }
        : {}),
    },
    orderBy: { transactionDate: "desc" },
    take: limit,
  });
}

export async function getTransactionById(id: number) {
  const branchIds = await getUserBranchScope();
  return prisma.transaction.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(branchIds.length > 0
        ? {
            OR: [
              { originBranchId: { in: branchIds } },
              { destinationBranchId: { in: branchIds } },
            ],
          }
        : {}),
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
  return prisma.transaction.findFirst({
    where: {
      awbNo,
      deletedAt: null,
      ...(originBranchId ? { originBranchId } : {}),
      ...(branchIds.length > 0
        ? {
            OR: [
              { originBranchId: { in: branchIds } },
              { destinationBranchId: { in: branchIds } },
            ],
          }
        : {}),
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
