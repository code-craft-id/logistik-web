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

/**
 * AWB list. `outbound` = AWBs from the actor's branches, `inbound` = AWBs
 * headed to them (legacy On Site Outbound / On Site Inbound); no direction
 * keeps the previous behavior (either side).
 */
export async function listTransactions(
  params: {
    limit?: number;
    direction?: "outbound" | "inbound";
    search?: string;
  } = {},
) {
  const current = await currentIdentity();
  const actor = current?.actor ?? null;
  const limit = params.limit ?? 50;
  const search = params.search?.trim().slice(0, 50);
  const text: Prisma.TransactionWhereInput = search
    ? {
        OR: [
          { awbNo: { contains: search, mode: "insensitive" } },
          { doNo: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
  const include = {
    originBranch: { select: { name: true } },
    destinationBranch: { select: { name: true } },
  };
  let scope: Prisma.TransactionWhereInput;
  if (isAdministrator(actor)) {
    scope =
      params.direction === "inbound"
        ? { destinationBranchId: { not: null } }
        : {};
  } else {
    const branchIds = await getUserBranchScope();
    requireNonEmptyBranchScope(branchIds, actor);
    scope =
      params.direction === "outbound"
        ? { originBranchId: { in: branchIds } }
        : params.direction === "inbound"
          ? { destinationBranchId: { in: branchIds } }
          : {
              OR: [
                { originBranchId: { in: branchIds } },
                { destinationBranchId: { in: branchIds } },
              ],
            };
  }
  return prisma.transaction.findMany({
    where: { deletedAt: null, AND: [scope, text] },
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    take: limit,
    include,
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
        pickupCourier: { select: { name: true } },
        marketingPerson: { select: { name: true } },
        consignee: { select: { name: true } },
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
      pickupCourier: { select: { name: true } },
      marketingPerson: { select: { name: true } },
      consignee: { select: { name: true } },
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
  // Branch-owned masters: the actor's branches plus unassigned rows.
  const owned = admin
    ? { deletedAt: null }
    : {
        deletedAt: null,
        OR: [{ branchId: { in: actor.branchIds } }, { branchId: null }],
      };
  const branchLabel = (b: { code: string; name: string }) =>
    `${b.code} | ${b.name}`;
  const [
    branches,
    destinations,
    customers,
    transportModes,
    deliveryServices,
    goodsTypes,
    costTypes,
    couriers,
    marketing,
    consignees,
    tariffs,
  ] = await Promise.all([
    prisma.branch.findMany({
      where: { ...active, ...(admin ? {} : { id: { in: actor.branchIds } }) },
      select: { id: true, code: true, name: true },
      orderBy: byName,
    }),
    prisma.branch.findMany({
      where: active,
      select: { id: true, code: true, name: true },
      orderBy: byName,
    }),
    prisma.customer.findMany({
      where: owned,
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
    prisma.courier.findMany({
      where: { ...owned, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        branch: { select: { name: true, city: true } },
      },
      orderBy: byName,
      take: 1000,
    }),
    prisma.marketingPerson.findMany({
      where: { ...owned, status: "ACTIVE" },
      select: pick,
      orderBy: byName,
      take: 1000,
    }),
    prisma.consignee.findMany({
      where: { ...owned, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        address1: true,
        phone: true,
        customerId: true,
      },
      orderBy: byName,
      take: 2000,
    }),
    prisma.tariff.findMany({
      where: { deletedAt: null },
      select: {
        originBranchId: true,
        destinationBranchId: true,
        deliveryServiceId: true,
        pricePerKg: true,
        minWeight: true,
      },
      take: 5000,
    }),
  ]);
  // Suggested next AWB number per own branch (display only; the number is
  // assigned under a lock when the form is saved).
  const { nextAwbNo, nextBookingNo } = await import("./service");
  const today = new Date();
  const nextAwb = Object.fromEntries(
    await Promise.all(
      branches
        .slice(0, 50)
        .map(async (b) => [
          b.id,
          await nextAwbNo(prisma as never, b.id, today, { lock: false }),
        ]),
    ),
  ) as Record<number, string>;
  const nextBooking = Object.fromEntries(
    await Promise.all(
      branches
        .slice(0, 50)
        .map(async (b) => [
          b.id,
          await nextBookingNo(prisma as never, b.id, today, { lock: false }),
        ]),
    ),
  ) as Record<number, string>;
  return {
    nextAwb,
    nextBooking,
    branches: branches.map((b) => ({ id: b.id, name: branchLabel(b) })),
    destinations: destinations.map((b) => ({
      id: b.id,
      name: branchLabel(b),
    })),
    customers,
    transportModes,
    deliveryServices,
    goodsTypes,
    costTypes,
    couriers: couriers.map((c) => ({
      id: c.id,
      name: c.branch ? `${c.name} | ${c.branch.city || c.branch.name}` : c.name,
    })),
    marketing,
    consignees: consignees.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address1 ?? "",
      phone: c.phone ?? "",
      customerId: c.customerId,
    })),
    tariffs: tariffs.map((t) => ({
      originBranchId: t.originBranchId,
      destinationBranchId: t.destinationBranchId,
      deliveryServiceId: t.deliveryServiceId,
      pricePerKg: t.pricePerKg.toString(),
      minWeight: t.minWeight.toString(),
    })),
  };
}
