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
import type {
  TransactionReportResult,
  TransactionReportRow,
} from "../contracts";
import { transactionReportCsv } from "../csv";
import {
  parseTransactionReportFilters,
  type TransactionReportFilters,
} from "../filters";

const select = {
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
} satisfies Prisma.TransactionSelect;
type SourceRow = Prisma.TransactionGetPayload<{ select: typeof select }>;
const dto = (row: SourceRow): TransactionReportRow => ({
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
});

function orderBy(
  f: TransactionReportFilters,
): Prisma.TransactionOrderByWithRelationInput[] {
  const direction = f.sortDirection;
  let primary: Prisma.TransactionOrderByWithRelationInput;
  if (f.sortBy === "originBranch" || f.sortBy === "destinationBranch") {
    // Prisma cannot set null placement on relations; use PostgreSQL's native placement.
    primary = { [f.sortBy]: { name: direction } };
  } else if (f.sortBy === "transactionDate" || f.sortBy === "status") {
    primary = { [f.sortBy]: direction };
  } else {
    primary = { [f.sortBy]: { sort: direction, nulls: "last" } };
  }
  return [primary, { id: direction }];
}
export function createTransactionReportService(
  db: PrismaClient,
  resolve: () => Promise<AccessActor | null>,
) {
  async function query(
    input: unknown,
    mode: "page" | "export",
  ): Promise<TransactionReportResult> {
    const identity = await resolve();
    if (!identity) throw new IdentityError("UNAUTHENTICATED", 401);
    return db.$transaction(
      async (tx) => {
        const actor = await loadAccessActor(tx, identity.id);
        assertPermission(actor, "view", "transaction_report");
        if (!actor) throw new IdentityError("UNAUTHENTICATED", 401);
        if (mode === "export")
          assertPermission(actor, "export", "transaction_report");
        const canExport = permits(actor, "export", "transaction_report");
        const admin = isAdministrator(actor);
        const branches = await tx.branch.findMany({
          where: {
            deletedAt: null,
            ...(!admin ? { id: { in: actor.branchIds } } : {}),
          },
          select: { id: true, name: true },
          orderBy: [{ name: "asc" }, { id: "asc" }],
        });
        const parsed = parseTransactionReportFilters(input);
        const base = {
          canExport,
          parsed,
          branches,
          items: [] as TransactionReportRow[],
          total: 0,
        };
        if (parsed.status !== "valid") {
          if (mode === "export")
            throw new IdentityError(
              "INVALID_FILTER",
              400,
              "Pilih filter laporan yang valid sebelum mengunduh.",
            );
          return { ...base, state: parsed.status };
        }
        const f = parsed.filters;
        if (
          [f.branchId, f.originBranchId, f.destinationBranchId].some(
            (id) => id !== null && !branches.some((branch) => branch.id === id),
          )
        ) {
          throw new IdentityError("FORBIDDEN", 403);
        }
        if (!admin && !actor.branchIds.length)
          return { ...base, state: "ready" };
        const and: Prisma.TransactionWhereInput[] = [];
        if (!admin)
          and.push({
            OR: [
              { originBranchId: { in: actor.branchIds } },
              { destinationBranchId: { in: actor.branchIds } },
            ],
          });
        if (f.branchId !== null)
          and.push({
            OR: [
              { originBranchId: f.branchId },
              { destinationBranchId: f.branchId },
            ],
          });
        if (f.originBranchId !== null)
          and.push({ originBranchId: f.originBranchId });
        if (f.destinationBranchId !== null)
          and.push({ destinationBranchId: f.destinationBranchId });
        const where: Prisma.TransactionWhereInput = {
          deletedAt: null,
          transactionDate: { gte: f.from, lt: f.toExclusive },
          AND: and,
          ...(f.search
            ? {
                awbNo: {
                  contains: f.search.replace(/[\\%_]/g, "\\$&"),
                  mode: "insensitive",
                },
              }
            : {}),
        };
        const items = await tx.transaction.findMany({
          where,
          select,
          orderBy: orderBy(f),
          skip: mode === "export" ? 0 : f.skip,
          take: mode === "export" ? 5001 : f.take,
        });
        if (mode === "export" && items.length > 5000)
          throw new IdentityError(
            "EXPORT_LIMIT",
            422,
            "Hasil melebihi 5000 baris. Persempit filter laporan.",
          );
        const total =
          mode === "export"
            ? items.length
            : await tx.transaction.count({ where });
        return { ...base, state: "ready", items: items.map(dto), total };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
  return {
    read(input: unknown) {
      return query(input, "page");
    },
    async export(input: unknown) {
      return transactionReportCsv((await query(input, "export")).items);
    },
  };
}
