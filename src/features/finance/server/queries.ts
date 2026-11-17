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
import { Prisma, type PrismaClient } from "@/lib/db/generated/client";
import { reportInput } from "../accounting-contracts";
import { asDate, costListInput, day, listInput } from "../contracts";
import { scoped } from "./accounting";

export function createAccountingQueries(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function actor(
    tx: Prisma.TransactionClient,
    resource: string,
    action = "view",
  ) {
    const session = await resolveActor();
    if (!session) throw new IdentityError("UNAUTHENTICATED", 401);
    const current = await loadAccessActor(tx, session.id);
    assertPermission(current, action, resource);
    return current;
  }
  return {
    async accounts() {
      await actor(db, "finance_account");
      const accounts = await db.finAccount.findMany({
        orderBy: { code: "asc" },
        take: 501,
      });
      const categories = await db.finCategory.findMany({
        orderBy: { code: "asc" },
        take: 501,
      });
      if (accounts.length > 500 || categories.length > 500)
        throw new IdentityError(
          "LIMIT",
          400,
          "Daftar lebih dari 500. Persempit katalog sebelum melanjutkan.",
        );
      return {
        accounts: accounts.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          deletedAt: a.deletedAt?.toISOString() ?? null,
        })),
        categories: categories.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          deletedAt: c.deletedAt?.toISOString() ?? null,
        })),
      };
    },
    async paymentChoices() {
      await actor(db, "payment", "create");
      return {
        accounts: await db.finAccount.findMany({
          where: {
            isCash: true,
            active: true,
            deletedAt: null,
            category: { active: true, deletedAt: null },
          },
          select: { id: true, code: true, name: true },
          orderBy: { code: "asc" },
          take: 500,
        }),
        categories: await db.finCategory.findMany({
          where: { kind: "CASHFLOW", active: true, deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 500,
        }),
      };
    },
    async journals(input: unknown) {
      const d = listInput.parse(input);
      return db.$transaction(
        async (tx) => {
          const current = await actor(tx, "journal");
          if (d.branchId) scoped(current, d.branchId);
          const where = {
            ...(!isAdministrator(current)
              ? { branchId: { in: current.branchIds } }
              : {}),
            ...(d.branchId ? { branchId: d.branchId } : {}),
          };
          const rows = await tx.finJournal.findMany({
            where,
            orderBy: { id: "desc" },
            skip: (d.page - 1) * 30,
            take: 30,
            include: { lines: true, reversal: { select: { id: true } } },
          });
          return {
            page: d.page,
            total: await tx.finJournal.count({ where }),
            items: rows.map((r) => ({
              ...r,
              accountingDate: day(r.accountingDate),
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
              lines: r.lines.map((l) => ({
                ...l,
                debit: l.debit.toFixed(2),
                credit: l.credit.toFixed(2),
              })),
            })),
          };
        },
        { isolationLevel: "RepeatableRead" },
      );
    },
    async costs(input: unknown) {
      const d = costListInput.parse(input);
      return db.$transaction(
        async (tx) => {
          const current = await actor(tx, "finance_cost");
          if (d.branchId) scoped(current, d.branchId);
          const where = {
            ...(!isAdministrator(current)
              ? { branchId: { in: current.branchIds } }
              : {}),
            ...(d.branchId ? { branchId: d.branchId } : {}),
          };
          const rows = await tx.finCostState.findMany({
            where,
            orderBy: { transactionId: "desc" },
            skip: (d.page - 1) * 30,
            take: 30,
          });
          const costs = await tx.finCost.findMany({
            where: { source: where },
            orderBy: { id: "desc" },
            skip: (d.eventPage - 1) * 30,
            take: 30,
            include: {
              reversal: { select: { id: true } },
              source: { select: { branchId: true } },
            },
          });
          return {
            page: d.page,
            eventPage: d.eventPage,
            total: await tx.finCostState.count({ where }),
            eventTotal: await tx.finCost.count({ where: { source: where } }),
            items: rows.map((r) => ({
              ...r,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            })),
            events: costs.map((r) => ({
              ...r,
              amount: r.amount.toFixed(2),
              accountingDate: day(r.accountingDate),
              createdAt: r.createdAt.toISOString(),
            })),
          };
        },
        { isolationLevel: "RepeatableRead" },
      );
    },
    async periods(input: unknown) {
      const d = listInput.parse(input);
      const current = await actor(db, "finance_period");
      if (d.branchId) scoped(current, d.branchId);
      const rows = await db.finClosedPeriod.findMany({
        where: {
          ...(!isAdministrator(current)
            ? { branchId: { in: current.branchIds } }
            : {}),
          ...(d.branchId ? { branchId: d.branchId } : {}),
        },
        orderBy: { id: "desc" },
        take: 120,
      });
      return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
    },
    async mappings(input: unknown) {
      const d = listInput.parse(input);
      const current = await actor(db, "finance_account");
      if (d.branchId) scoped(current, d.branchId);
      const rows = await db.finMapping.findMany({
        where: {
          ...(!isAdministrator(current)
            ? { branchId: { in: current.branchIds } }
            : {}),
          ...(d.branchId ? { branchId: d.branchId } : {}),
        },
        orderBy: { id: "desc" },
        take: 120,
      });
      return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
    },
    async report(input: unknown) {
      const d = reportInput.parse(input);
      return db.$transaction(
        async (tx) => {
          const current = await actor(tx, "financial_report");
          scoped(current, d.branchId);
          const rows = await tx.finLine.findMany({
            where: {
              journal: {
                branchId: d.branchId,
                status: "POSTED",
                accountingDate: { gte: asDate(d.start), lte: asDate(d.end) },
              },
            },
            include: {
              journal: {
                select: {
                  id: true,
                  accountingDate: true,
                  sourceType: true,
                  sourceId: true,
                  reference: true,
                  reversalOfId: true,
                },
              },
            },
            take: 10001,
            orderBy: { id: "asc" },
          });
          if (rows.length > 10000)
            throw new IdentityError(
              "LIMIT",
              400,
              "Laporan lebih dari 10000 baris. Persempit periode.",
            );
          const missing = await tx.finInvoiceItem.findMany({
            where: {
              invoice: {
                branchId: d.branchId,
                number: { not: null },
                invoiceDate: { lte: asDate(d.end) },
              },
              OR: [
                { transaction: { finCostState: null } },
                { transaction: { finCostState: { finalized: false } } },
                {
                  transaction: {
                    finCostState: { branchId: { not: d.branchId } },
                  },
                },
              ],
            },
            select: { transactionId: true },
            take: 10001,
          });
          const unfinished = await tx.finCostState.findMany({
            where: {
              branchId: d.branchId,
              finalized: false,
              costs: { some: { accountingDate: { lte: asDate(d.end) } } },
            },
            select: { transactionId: true },
            take: 10001,
          });
          const incomplete = [
            ...new Set([...missing, ...unfinished].map((r) => r.transactionId)),
          ];
          const zero = () => new Prisma.Decimal(0);
          let revenue = zero(),
            expenses = zero(),
            directRevenue = zero(),
            directCost = zero();
          const gp = new Map<
            number,
            { revenue: Prisma.Decimal; cost: Prisma.Decimal }
          >();
          const recap = new Map<
            string,
            { revenue: Prisma.Decimal; cost: Prisma.Decimal }
          >();
          const cashflow = new Map<string, Prisma.Decimal>();
          const ledger = new Map<
            number,
            {
              code: string;
              name: string;
              debit: Prisma.Decimal;
              credit: Prisma.Decimal;
            }
          >();
          for (const l of rows) {
            const s = l.snapshot as {
              code: string;
              name: string;
              kind: string;
              isCash: boolean;
              flowClass: string | null;
            };
            const net = l.credit.minus(l.debit);
            if (s.kind === "REVENUE") revenue = revenue.plus(net);
            if (s.kind === "EXPENSE") expenses = expenses.minus(net);
            const entry = ledger.get(l.accountId) ?? {
              code: s.code,
              name: s.name,
              debit: zero(),
              credit: zero(),
            };
            entry.debit = entry.debit.plus(l.debit);
            entry.credit = entry.credit.plus(l.credit);
            ledger.set(l.accountId, entry);
            if (s.isCash && s.flowClass)
              cashflow.set(
                s.flowClass,
                (cashflow.get(s.flowClass) ?? zero()).minus(net),
              );
            if (l.transactionId !== null) {
              const source = gp.get(l.transactionId) ?? {
                revenue: zero(),
                cost: zero(),
              };
              const month = day(l.journal.accountingDate).slice(0, 7);
              const period = recap.get(month) ?? {
                revenue: zero(),
                cost: zero(),
              };
              if (s.kind === "REVENUE") {
                source.revenue = source.revenue.plus(net);
                period.revenue = period.revenue.plus(net);
                directRevenue = directRevenue.plus(net);
              }
              if (s.kind === "EXPENSE") {
                source.cost = source.cost.minus(net);
                period.cost = period.cost.minus(net);
                directCost = directCost.minus(net);
              }
              gp.set(l.transactionId, source);
              recap.set(month, period);
            }
          }
          const netProfit = revenue.minus(expenses),
            gross = directRevenue.minus(directCost);
          const complete = incomplete.length === 0;
          const margins = <T>(
            key: T,
            r: { revenue: Prisma.Decimal; cost: Prisma.Decimal },
          ) => ({
            key,
            revenue: r.revenue.toFixed(2),
            cost: r.cost.toFixed(2),
            profit: complete ? r.revenue.minus(r.cost).toFixed(2) : null,
          });
          return {
            ...d,
            currency: "IDR",
            complete,
            incomplete: incomplete.slice(0, 100),
            incompleteOverflow: incomplete.length > 100,
            revenue: revenue.toFixed(2),
            expenses: expenses.toFixed(2),
            netProfit: netProfit.toFixed(2),
            grossProfit: complete ? gross.toFixed(2) : null,
            bridge: {
              otherRevenue: revenue.minus(directRevenue).toFixed(2),
              otherExpense: expenses.minus(directCost).toFixed(2),
              difference: netProfit.minus(gross).toFixed(2),
            },
            gp: [...gp].map(([key, r]) => margins(key, r)),
            recap: [...recap].map(([key, r]) => margins(key, r)),
            cashflow: [...cashflow].map(([category, amount]) => ({
              category,
              amount: amount.toFixed(2),
            })),
            ledger: [...ledger].map(([accountId, r]) => ({
              accountId,
              ...r,
              debit: r.debit.toFixed(2),
              credit: r.credit.toFixed(2),
            })),
            lines: rows.map((r) => ({
              id: r.id,
              journalId: r.journalId,
              accountId: r.accountId,
              debit: r.debit.toFixed(2),
              credit: r.credit.toFixed(2),
              transactionId: r.transactionId,
              sourceType: r.journal.sourceType,
              sourceId: r.journal.sourceId,
              reference: r.journal.reference,
              accountingDate: day(r.journal.accountingDate),
            })),
          };
        },
        { isolationLevel: "RepeatableRead" },
      );
    },
  };
}
