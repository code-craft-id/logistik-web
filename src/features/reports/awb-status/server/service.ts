import "server-only";
import {
  type AccessActor,
  isAdministrator,
  permits,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
  loadAccessActor,
} from "@/features/identity/server/access";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import type { TransactionReportFilters } from "../../transaction-details/filters";
import type {
  AwbStatusKind,
  AwbStatusResult,
  AwbStatusTotals,
} from "../contracts";
import { awbStatusCsv } from "../csv";
import { parseAwbStatusFilters } from "../filters";

const EXPORT_LIMIT = 5000;
type Tx = Prisma.TransactionClient;

/** Active assignment: item and manifest not deleted, item not released (D-22, 2026-11-17). */
const activeAssignment: Prisma.ManifestItemWhereInput = {
  deletedAt: null,
  releasedAt: null,
  manifest: { is: { deletedAt: null } },
};

/** RPT-01 scope and branch/search semantics without the period. */
function scopedTransactions(
  actor: AccessActor,
  f: TransactionReportFilters,
): Prisma.TransactionWhereInput {
  const AND: Prisma.TransactionWhereInput[] = [];
  if (!isAdministrator(actor))
    AND.push({
      OR: [
        { originBranchId: { in: actor.branchIds } },
        { destinationBranchId: { in: actor.branchIds } },
      ],
    });
  if (f.branchId !== null)
    AND.push({
      OR: [{ originBranchId: f.branchId }, { destinationBranchId: f.branchId }],
    });
  if (f.originBranchId !== null) AND.push({ originBranchId: f.originBranchId });
  if (f.destinationBranchId !== null)
    AND.push({ destinationBranchId: f.destinationBranchId });
  return {
    deletedAt: null,
    AND,
    ...(f.search
      ? {
          awbNo: {
            contains: f.search.replace(/[\\%_]/g, "\\$&"),
            mode: "insensitive" as const,
          },
        }
      : {}),
  };
}

/** Unknown source values make a total unavailable instead of silently treated as zero. */
async function totals(
  tx: Tx,
  where: Prisma.TransactionWhereInput,
): Promise<AwbStatusTotals> {
  const agg = await tx.transaction.aggregate({
    where,
    _count: { _all: true, koli: true, kilo: true, volume: true },
    _sum: { koli: true, kilo: true, volume: true },
  });
  const all = agg._count._all;
  return {
    totalAwb: all,
    totalKoli: agg._count.koli === all ? (agg._sum.koli ?? 0) : null,
    totalKilo:
      agg._count.kilo === all ? (agg._sum.kilo?.toString() ?? "0") : null,
    totalVolume:
      agg._count.volume === all ? (agg._sum.volume?.toString() ?? "0") : null,
  };
}

export function createAwbStatusReportService(
  db: PrismaClient,
  resolve: () => Promise<AccessActor | null>,
) {
  async function query(
    kind: AwbStatusKind,
    input: unknown,
    mode: "page" | "export",
  ): Promise<AwbStatusResult> {
    const identity = await resolve();
    if (!identity) throw new IdentityError("UNAUTHENTICATED", 401);
    return db.$transaction(
      async (tx) => {
        const actor = await loadAccessActor(tx, identity.id);
        assertPermission(actor, "view", "transaction_report");
        if (mode === "export")
          assertPermission(actor, "export", "transaction_report");
        const admin = isAdministrator(actor);
        const branches = await tx.branch.findMany({
          where: {
            deletedAt: null,
            ...(!admin ? { id: { in: actor.branchIds } } : {}),
          },
          select: { id: true, name: true },
          orderBy: [{ name: "asc" }, { id: "asc" }],
        });
        const { parsed, status, allDates } = parseAwbStatusFilters(kind, input);
        // DB-side grouping (Prisma distinct runs in memory); page mode only.
        const statuses =
          kind === "all-status" && mode === "page"
            ? (
                await tx.transaction.groupBy({
                  by: ["status"],
                  where: {
                    deletedAt: null,
                    ...(!admin
                      ? {
                          OR: [
                            { originBranchId: { in: actor.branchIds } },
                            { destinationBranchId: { in: actor.branchIds } },
                          ],
                        }
                      : {}),
                  },
                  orderBy: { status: "asc" },
                })
              ).map((row) => row.status)
            : [];
        // An applied filter must stay selectable, or the form would silently drop it.
        if (status && mode === "page" && !statuses.includes(status))
          statuses.push(status);
        const base = {
          parsed,
          branches,
          statuses,
          statusFilter: status,
          allDates,
          canExport: permits(actor, "export", "transaction_report"),
          total: 0,
          totals: null,
        };
        const empty = (state: "initial" | "invalid" | "ready") =>
          ({ ...base, kind, state, items: [] }) as AwbStatusResult;
        if (parsed.status !== "valid") {
          if (mode === "export")
            throw new IdentityError(
              "INVALID_FILTER",
              400,
              "Pilih filter laporan yang valid sebelum mengunduh.",
            );
          return empty(parsed.status);
        }
        const f = parsed.filters;
        if (
          [f.branchId, f.originBranchId, f.destinationBranchId].some(
            (id) => id !== null && !branches.some((branch) => branch.id === id),
          )
        )
          throw new IdentityError("FORBIDDEN", 403);
        if (!admin && !actor.branchIds.length) return empty("ready");
        const range = { gte: f.from, lt: f.toExclusive };
        const scoped: Prisma.TransactionWhereInput = {
          ...scopedTransactions(actor, f),
          ...(status ? { status } : {}),
        };
        const skip = mode === "export" ? 0 : f.skip;
        const take = mode === "export" ? EXPORT_LIMIT + 1 : f.take;
        // CSV output never shows totals; skip the aggregate on export.
        const summary = (where: Prisma.TransactionWhereInput) =>
          mode === "export" ? Promise.resolve(null) : totals(tx, where);
        const limit = (count: number) => {
          if (mode === "export" && count > EXPORT_LIMIT)
            throw new IdentityError(
              "EXPORT_LIMIT",
              422,
              "Hasil melebihi 5000 baris. Persempit filter laporan.",
            );
        };

        if (kind === "manifested") {
          // Rows are manifest items, totals are transactions. They agree because
          // manifest_items_transaction_id_key allows one item per transaction;
          // relaxing that constraint requires transaction-grain rows here.
          const inPeriod: Prisma.ManifestItemWhereInput = {
            ...activeAssignment,
            manifest: { is: { deletedAt: null, manifestDate: range } },
          };
          const rows = await tx.manifestItem.findMany({
            where: { ...inPeriod, transaction: { is: scoped } },
            select: {
              id: true,
              manifest: { select: { manifestNo: true, manifestDate: true } },
              transaction: {
                select: {
                  awbNo: true,
                  doNo: true,
                  destinationBranch: { select: { name: true } },
                  koli: true,
                  kilo: true,
                  volume: true,
                },
              },
            },
            orderBy: [{ manifest: { manifestDate: "desc" } }, { id: "desc" }],
            skip,
            take,
          });
          limit(rows.length);
          const sum = await summary({
            ...scoped,
            manifestItems: { some: inPeriod },
          });
          return {
            ...base,
            kind,
            state: "ready",
            total: sum?.totalAwb ?? rows.length,
            totals: sum,
            items: rows.map((row) => ({
              id: row.id,
              awbNo: row.transaction.awbNo,
              doNo: row.transaction.doNo,
              manifestNo: row.manifest.manifestNo,
              manifestDate: row.manifest.manifestDate.toISOString(),
              destinationBranch:
                row.transaction.destinationBranch?.name ?? null,
              koli: row.transaction.koli,
              kilo: row.transaction.kilo?.toString() ?? null,
              volume: row.transaction.volume?.toString() ?? null,
            })),
          };
        }

        if (kind === "pending") {
          const where: Prisma.TransactionWhereInput = {
            ...scoped,
            ...(allDates ? {} : { transactionDate: range }),
            manifestItems: { none: activeAssignment },
          };
          const rows = await tx.transaction.findMany({
            where,
            select: {
              id: true,
              awbNo: true,
              doNo: true,
              transactionDate: true,
              originBranch: { select: { name: true } },
              destinationBranch: { select: { name: true } },
              koli: true,
              kilo: true,
              volume: true,
            },
            orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
            skip,
            take,
          });
          limit(rows.length);
          const sum = await summary(where);
          return {
            ...base,
            kind,
            state: "ready",
            total: sum?.totalAwb ?? rows.length,
            totals: sum,
            items: rows.map((row) => ({
              id: row.id,
              awbNo: row.awbNo,
              doNo: row.doNo,
              transactionDate: row.transactionDate.toISOString(),
              originBranch: row.originBranch?.name ?? null,
              destinationBranch: row.destinationBranch?.name ?? null,
              koli: row.koli,
              kilo: row.kilo?.toString() ?? null,
              volume: row.volume?.toString() ?? null,
            })),
          };
        }

        const where: Prisma.TransactionWhereInput = {
          ...scoped,
          transactionDate: range,
        };
        const rows = await tx.transaction.findMany({
          where,
          select: {
            id: true,
            awbNo: true,
            transactionDate: true,
            originBranch: { select: { name: true } },
            destinationBranch: { select: { name: true } },
            senderName: true,
            receiverName: true,
            koli: true,
            kilo: true,
            status: true,
            manifestItems: {
              where: activeAssignment,
              select: { manifest: { select: { manifestNo: true } } },
              orderBy: { id: "desc" },
              take: 1,
            },
            // Latest attempt with a recorded recipient: newest DRS date, then delivery time (D-22).
            // A DRS has no own deletedAt; it is deleted with its manifest, as in RPT-02.
            deliverySheetItems: {
              where: {
                deletedAt: null,
                receivedBy: { not: null, notIn: [""] },
                deliverySheet: {
                  is: { manifest: { is: { deletedAt: null } } },
                },
              },
              select: { receivedBy: true, deliveredAt: true },
              orderBy: [
                { deliverySheet: { deliveryDate: "desc" } },
                { deliveredAt: { sort: "desc", nulls: "last" } },
                { id: "desc" },
              ],
              take: 1,
            },
          },
          orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
          skip,
          take,
        });
        limit(rows.length);
        const sum = await summary(where);
        return {
          ...base,
          kind: "all-status",
          state: "ready",
          total: sum?.totalAwb ?? rows.length,
          totals: sum,
          items: rows.map((row) => {
            const receipt = row.deliverySheetItems[0];
            return {
              id: row.id,
              awbNo: row.awbNo,
              transactionDate: row.transactionDate.toISOString(),
              originBranch: row.originBranch?.name ?? null,
              destinationBranch: row.destinationBranch?.name ?? null,
              senderName: row.senderName,
              receiverName: row.receiverName,
              koli: row.koli,
              kilo: row.kilo?.toString() ?? null,
              status: row.status,
              receivedBy: receipt?.receivedBy ?? null,
              deliveredAt: receipt?.deliveredAt?.toISOString() ?? null,
              manifestNo: row.manifestItems[0]?.manifest.manifestNo ?? null,
            };
          }),
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
  return {
    read(kind: AwbStatusKind, input: unknown) {
      return query(kind, input, "page");
    },
    async export(kind: AwbStatusKind, input: unknown) {
      return awbStatusCsv(await query(kind, input, "export"));
    },
  };
}
