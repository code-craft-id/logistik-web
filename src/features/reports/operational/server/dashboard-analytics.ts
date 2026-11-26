import "server-only";
import { Prisma } from "@/lib/db/generated/client";
import type { DashboardAnalytics } from "../contracts";

/**
 * Dashboard money and outstanding figures like the provider dashboard
 * (OBSERVED redlogistik 2026-11-26, not CONFIRMED by finance):
 * - amount = AWB Grand Total (`biaya`) by transaction date;
 * - payment split by Jenis Biaya name (CASH, KREDIT, COD, TRF/TRANSFER),
 *   same mapping as Rekap Transaksi Harian;
 * - trend vs the previous period of the same length;
 * - POD outstanding = Delivered AWB in period without a non-rejected
 *   POD Kembali, per destination branch.
 */
const D = (v: Prisma.Decimal | null | undefined) => v ?? new Prisma.Decimal(0);
const PAYMENT: Record<string, keyof DashboardAnalytics["payments"]> = {
  CASH: "cash",
  KREDIT: "kredit",
  COD: "cod",
  TRF: "transfer",
  TRANSFER: "transfer",
};

export async function dashboardAnalytics(
  tx: Prisma.TransactionClient,
  inPeriod: Prisma.TransactionWhereInput,
  inPrevious: Prisma.TransactionWhereInput,
): Promise<DashboardAnalytics> {
  const byCostType = await tx.transaction.groupBy({
    by: ["costTypeId"],
    where: inPeriod,
    _sum: { biaya: true },
    _count: { _all: true },
  });
  const costTypes = await tx.costType.findMany({
    where: {
      id: {
        in: byCostType.flatMap((r) => (r.costTypeId ? [r.costTypeId] : [])),
      },
    },
    select: { id: true, name: true },
  });
  const costName = new Map(
    costTypes.map((c) => [c.id, c.name.trim().toUpperCase()]),
  );
  const payments = {
    cash: D(null),
    kredit: D(null),
    cod: D(null),
    transfer: D(null),
    other: D(null),
  };
  let amount = D(null);
  let awb = 0;
  for (const row of byCostType) {
    const value = D(row._sum.biaya);
    const key =
      PAYMENT[row.costTypeId ? (costName.get(row.costTypeId) ?? "") : ""] ??
      "other";
    payments[key] = payments[key].add(value);
    amount = amount.add(value);
    awb += row._count._all;
  }

  const previous = await tx.transaction.aggregate({
    where: inPrevious,
    _sum: { biaya: true },
    _count: { _all: true },
  });

  const customers = await tx.transaction.groupBy({
    by: ["customerId"],
    where: { ...inPeriod, customerId: { not: null } },
    _sum: { biaya: true },
  });
  const top = customers
    .filter((c) => c.customerId !== null)
    .sort((a, b) => D(b._sum.biaya).comparedTo(D(a._sum.biaya)))
    .slice(0, 5);
  const topIds = top.map((c) => c.customerId as number);
  const [names, before] = topIds.length
    ? [
        await tx.customer.findMany({
          where: { id: { in: topIds } },
          select: { id: true, name: true },
        }),
        await tx.transaction.groupBy({
          by: ["customerId"],
          where: { ...inPrevious, customerId: { in: topIds } },
          _sum: { biaya: true },
        }),
      ]
    : [[], []];
  const nameOf = new Map(names.map((c) => [c.id, c.name]));
  const beforeOf = new Map(before.map((c) => [c.customerId, c._sum.biaya]));

  const pod = await tx.transaction.groupBy({
    by: ["destinationBranchId"],
    where: {
      ...inPeriod,
      status: "Delivered",
      podReturnItems: {
        none: {
          deletedAt: null,
          podReturn: { deletedAt: null, status: { not: "REJECTED" } },
        },
      },
    },
    _count: { _all: true },
  });
  const podBranches = await tx.branch.findMany({
    where: {
      id: {
        in: pod.flatMap((r) =>
          r.destinationBranchId ? [r.destinationBranchId] : [],
        ),
      },
    },
    select: { id: true, name: true },
  });
  const branchName = new Map(podBranches.map((b) => [b.id, b.name]));
  const podRows = pod
    .map((r) => ({
      destination: r.destinationBranchId
        ? (branchName.get(r.destinationBranchId) ?? "-")
        : "Tanpa cabang tujuan",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    amount: amount.toFixed(2),
    payments: {
      cash: payments.cash.toFixed(2),
      kredit: payments.kredit.toFixed(2),
      cod: payments.cod.toFixed(2),
      transfer: payments.transfer.toFixed(2),
      other: payments.other.toFixed(2),
    },
    awb,
    average: awb
      ? amount
          .div(awb)
          .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
          .toFixed(0)
      : "0",
    activeCustomers: customers.length,
    previous: {
      amount: D(previous._sum.biaya).toFixed(2),
      awb: previous._count._all,
    },
    topCustomers: top.map((c) => ({
      name: nameOf.get(c.customerId as number) ?? "-",
      amount: D(c._sum.biaya).toFixed(2),
      previous: D(beforeOf.get(c.customerId)).toFixed(2),
    })),
    podOutstanding: {
      total: podRows.reduce((sum, r) => sum + r.count, 0),
      rows: podRows.slice(0, 5),
    },
  };
}
