import "server-only";
import {
  type AccessActor,
  isAdministrator,
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
import { parseTransactionReportFilters } from "../filters";

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

export function createTransactionReportService(
  db: PrismaClient,
  resolve: () => Promise<AccessActor | null>,
) {
  return {
    async read(input: unknown): Promise<TransactionReportResult> {
      const identity = await resolve();
      if (!identity) throw new IdentityError("UNAUTHENTICATED", 401);
      return db.$transaction(
        async (tx) => {
          const actor = await loadAccessActor(tx, identity.id);
          assertPermission(actor, "view", "transaction_report");
          if (!actor) throw new IdentityError("UNAUTHENTICATED", 401);
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
            parsed,
            branches,
            items: [] as TransactionReportRow[],
            total: 0,
          };
          if (parsed.status !== "valid")
            return { ...base, state: parsed.status };
          const f = parsed.filters;
          if (
            f.branchId !== null &&
            !branches.some((branch) => branch.id === f.branchId)
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
            orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
            skip: f.skip,
            take: f.take,
          });
          const total = await tx.transaction.count({ where });
          return { ...base, state: "ready", items: items.map(dto), total };
        },
        { isolationLevel: "RepeatableRead" },
      );
    },
  };
}
