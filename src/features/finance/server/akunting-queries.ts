import "server-only";
import { z } from "zod";
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
import type { CASH_VOUCHERS } from "../accounting-contracts";
import { asDate, date, day, id } from "../contracts";

/**
 * Read side of the sandbox Akunting screens (OBSERVED newapps 2026-11-24).
 * Every amount comes from POSTED journal lines in the user's branches.
 */
const optionalId = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  id.optional(),
);
const optionalDate = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  date.optional(),
);
const page = z.coerce.number().int().min(1).max(100000).default(1);
export const PAGE_SIZE = 50;

export const ledgerInput = z.object({
  accountId: optionalId,
  branchId: optionalId,
  costCentreId: optionalId,
  start: optionalDate,
  end: optionalDate,
});
export const periodInput = z.object({
  branchId: optionalId,
  costCentreId: optionalId,
  start: optionalDate,
  end: optionalDate,
  includeZero: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  level: z.enum(["all", "parent", "child"]).catch("all"),
});
export const postingInput = z.object({
  branchId: optionalId,
  sourceType: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().max(30).optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["DRAFT", "POSTED"]).optional(),
  ),
  reference: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().trim().max(160).optional(),
  ),
  start: optionalDate,
  end: optionalDate,
  page,
});
export const voucherListInput = z.object({ branchId: optionalId, page });

/** Business month defaults: first day of this month to today (Asia/Jakarta). */
export function defaultPeriod(start?: string, end?: string) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  return { start: start ?? `${today.slice(0, 8)}01`, end: end ?? today };
}
const dec = (v: Prisma.Decimal | string | number | null | undefined) =>
  new Prisma.Decimal(v ?? 0);

export function depreciation(
  asset: {
    acquiredOn: Date;
    cost: Prisma.Decimal;
    additions: Prisma.Decimal;
    reductions: Prisma.Decimal;
    lifeMonths: number;
  },
  asOf: string,
) {
  const basis = asset.cost.plus(asset.additions).minus(asset.reductions);
  const monthly = basis.div(asset.lifeMonths).toDecimalPlaces(2);
  const from = day(asset.acquiredOn);
  const months = Math.max(
    0,
    (Number(asOf.slice(0, 4)) - Number(from.slice(0, 4))) * 12 +
      Number(asOf.slice(5, 7)) -
      Number(from.slice(5, 7)) +
      (Number(asOf.slice(8, 10)) >= Number(from.slice(8, 10)) ? 0 : -1),
  );
  const elapsed = Math.min(asset.lifeMonths, months);
  const accumulated =
    elapsed >= asset.lifeMonths ? basis : monthly.times(elapsed);
  return {
    basis: basis.toFixed(2),
    monthly: monthly.toFixed(2),
    elapsed,
    accumulated: accumulated.toFixed(2),
    bookValue: basis.minus(accumulated).toFixed(2),
  };
}

export function createAkuntingQueries(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function actor(resource: string, action = "view") {
    const session = await resolveActor();
    if (!session) throw new IdentityError("UNAUTHENTICATED", 401);
    const current = await loadAccessActor(db, session.id);
    assertPermission(current, action, resource);
    return current;
  }
  /** Branch filter: the chosen branch (checked) or all of the user's. */
  function branches(current: AccessActor, branchId?: number) {
    if (branchId) {
      if (!isAdministrator(current) && !current.branchIds.includes(branchId))
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      return Prisma.sql`j."branchId" = ${branchId}`;
    }
    if (isAdministrator(current)) return Prisma.sql`TRUE`;
    return current.branchIds.length
      ? Prisma.sql`j."branchId" IN (${Prisma.join(current.branchIds)})`
      : Prisma.sql`FALSE`;
  }
  const centre = (costCentreId?: number) =>
    costCentreId
      ? Prisma.sql`j."costCentreId" = ${costCentreId}`
      : Prisma.sql`TRUE`;
  async function branchChoices(current: AccessActor) {
    return db.branch.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        ...(isAdministrator(current) ? {} : { id: { in: current.branchIds } }),
      },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  /** Account-by-account movement in [start, end] with the opening balance. */
  async function ledger(
    current: AccessActor,
    accountIds: number[] | null,
    opts: {
      branchId?: number;
      costCentreId?: number;
      start: string;
      end: string;
    },
  ) {
    const where = Prisma.sql`j.status = 'POSTED' AND ${branches(current, opts.branchId)} AND ${centre(opts.costCentreId)}${
      accountIds
        ? Prisma.sql` AND l."accountId" IN (${Prisma.join(accountIds)})`
        : Prisma.empty
    }`;
    const opening = await db.$queryRaw<
      { accountId: number; debit: string; credit: string }[]
    >`SELECT l."accountId", COALESCE(sum(l.debit),0)::text AS debit, COALESCE(sum(l.credit),0)::text AS credit
      FROM fin_lines l JOIN fin_journals j ON j.id = l."journalId"
      WHERE ${where} AND j."accountingDate" < ${asDate(opts.start)}
      GROUP BY l."accountId"`;
    const movement = await db.$queryRaw<
      { accountId: number; debit: string; credit: string }[]
    >`SELECT l."accountId", COALESCE(sum(l.debit),0)::text AS debit, COALESCE(sum(l.credit),0)::text AS credit
      FROM fin_lines l JOIN fin_journals j ON j.id = l."journalId"
      WHERE ${where} AND j."accountingDate" BETWEEN ${asDate(opts.start)} AND ${asDate(opts.end)}
      GROUP BY l."accountId"`;
    return { opening, movement };
  }

  /** Detail rows of one account with the other side of each journal. */
  async function accountRows(
    current: AccessActor,
    accountId: number,
    opts: {
      branchId?: number;
      costCentreId?: number;
      start: string;
      end: string;
    },
  ) {
    const account = await db.finAccount.findUnique({
      where: { id: accountId },
      select: { id: true, code: true, name: true, normalBalance: true },
    });
    if (!account) throw new IdentityError("NOT_FOUND", 404);
    const { opening } = await ledger(current, [accountId], opts);
    const open = opening[0]
      ? dec(opening[0].debit).minus(opening[0].credit)
      : dec(0);
    const rows = await db.$queryRaw<
      {
        lineId: number;
        journalId: number;
        accountingDate: Date;
        reference: string;
        reason: string;
        sourceType: string;
        memo: string | null;
        debit: string;
        credit: string;
        counter: string | null;
      }[]
    >`SELECT l.id AS "lineId", j.id AS "journalId", j."accountingDate", j.reference, j.reason,
             j."sourceType", l.memo, l.debit::text, l.credit::text,
             (SELECT string_agg(DISTINCT a.code || ' ' || a.name, ', ')
                FROM fin_lines o JOIN fin_accounts a ON a.id = o."accountId"
               WHERE o."journalId" = j.id AND o."accountId" <> l."accountId") AS counter
      FROM fin_lines l JOIN fin_journals j ON j.id = l."journalId"
      WHERE j.status = 'POSTED' AND ${branches(current, opts.branchId)} AND ${centre(opts.costCentreId)}
        AND l."accountId" = ${accountId}
        AND j."accountingDate" BETWEEN ${asDate(opts.start)} AND ${asDate(opts.end)}
      ORDER BY j."accountingDate", j.id, l.id
      LIMIT 2001`;
    let balance = open;
    const items = rows.slice(0, 2000).map((r) => {
      balance = balance.plus(r.debit).minus(r.credit);
      return {
        ...r,
        accountingDate: day(r.accountingDate),
        balance: balance.toFixed(2),
      };
    });
    return {
      account,
      opening: open.toFixed(2),
      closing: balance.toFixed(2),
      items,
      truncated: rows.length > 2000,
    };
  }

  return {
    /** Accounts, branches, cost centres, customers and vendors for forms. */
    async choices() {
      const current = await actor("journal");
      const [accounts, costCentres, branchRows, vendors, customers] =
        await Promise.all([
          db.finAccount.findMany({
            where: { active: true, deletedAt: null },
            select: {
              id: true,
              code: true,
              name: true,
              kind: true,
              isCash: true,
            },
            orderBy: { code: "asc" },
            take: 1000,
          }),
          db.finCostCentre.findMany({
            where: {
              active: true,
              deletedAt: null,
              ...(isAdministrator(current)
                ? {}
                : { branchId: { in: current.branchIds } }),
            },
            select: { id: true, code: true, name: true, branchId: true },
            orderBy: { code: "asc" },
          }),
          branchChoices(current),
          db.vendor.findMany({
            where: { deletedAt: null },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
            take: 1000,
          }),
          db.customer.findMany({
            where: {
              deletedAt: null,
              ...(isAdministrator(current)
                ? {}
                : { branchId: { in: current.branchIds } }),
            },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
            take: 1000,
          }),
        ]);
      return {
        accounts,
        cashAccounts: accounts.filter((a) => a.isCash),
        costCentres,
        branches: branchRows,
        vendors,
        customers,
      };
    },

    /** Recent vouchers of one Kasir type, newest first. */
    async vouchers(voucher: keyof typeof CASH_VOUCHERS, raw: unknown) {
      const current = await actor("journal");
      const q = voucherListInput.parse(raw);
      const where: Prisma.FinJournalWhereInput = {
        sourceType: voucher,
        ...(q.branchId
          ? { branchId: q.branchId }
          : isAdministrator(current)
            ? {}
            : { branchId: { in: current.branchIds } }),
      };
      if (q.branchId && !isAdministrator(current))
        if (!current.branchIds.includes(q.branchId))
          throw new IdentityError("FORBIDDEN_BRANCH", 403);
      const [rows, total] = await Promise.all([
        db.finJournal.findMany({
          where,
          orderBy: [{ accountingDate: "desc" }, { id: "desc" }],
          skip: (q.page - 1) * 20,
          take: 20,
          include: {
            branch: { select: { name: true } },
            costCentre: { select: { code: true, name: true } },
            customer: { select: { name: true } },
            vendor: { select: { name: true } },
            lines: {
              orderBy: { id: "asc" },
              include: { account: { select: { code: true, name: true } } },
            },
          },
        }),
        db.finJournal.count({ where }),
      ]);
      return {
        page: q.page,
        total,
        items: rows.map((j) => ({
          ...j,
          accountingDate: day(j.accountingDate),
          lines: j.lines.map((l) => ({
            ...l,
            debit: l.debit.toFixed(2),
            credit: l.credit.toFixed(2),
          })),
        })),
      };
    },

    /** Kasir / Memorial / Penyesuaian Penjualan: flat journal lines. */
    async postings(raw: unknown, sourceTypes?: string[]) {
      const current = await actor("journal");
      const q = postingInput.parse(raw);
      const types = q.sourceType ? [q.sourceType] : sourceTypes;
      const where = Prisma.sql`${branches(current, q.branchId)}
        ${types?.length ? Prisma.sql`AND j."sourceType" IN (${Prisma.join(types)})` : Prisma.empty}
        ${q.status ? Prisma.sql`AND j.status = ${q.status}` : Prisma.empty}
        ${q.reference ? Prisma.sql`AND j.reference ILIKE ${`%${q.reference}%`}` : Prisma.empty}
        ${q.start ? Prisma.sql`AND j."accountingDate" >= ${asDate(q.start)}` : Prisma.empty}
        ${q.end ? Prisma.sql`AND j."accountingDate" <= ${asDate(q.end)}` : Prisma.empty}`;
      const [rows, count] = await Promise.all([
        db.$queryRaw<
          {
            lineId: number;
            journalId: number;
            status: string;
            sourceType: string;
            sourceId: number | null;
            accountingDate: Date;
            reference: string;
            reason: string;
            code: string;
            name: string;
            memo: string | null;
            debit: string;
            credit: string;
            reversed: boolean;
            reversalOfId: number | null;
          }[]
        >`SELECT l.id AS "lineId", j.id AS "journalId", j.status, j."sourceType", j."sourceId",
                 j."accountingDate", j.reference, j.reason, a.code, a.name, l.memo,
                 l.debit::text, l.credit::text, j."reversalOfId",
                 EXISTS (SELECT 1 FROM fin_journals r WHERE r."reversalOfId" = j.id) AS reversed
          FROM fin_lines l JOIN fin_journals j ON j.id = l."journalId"
          JOIN fin_accounts a ON a.id = l."accountId"
          WHERE ${where}
          ORDER BY j."accountingDate" DESC, j.id DESC, l.id
          LIMIT ${PAGE_SIZE} OFFSET ${(q.page - 1) * PAGE_SIZE}`,
        db.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n
          FROM fin_lines l JOIN fin_journals j ON j.id = l."journalId" WHERE ${where}`,
      ]);
      return {
        page: q.page,
        total: Number(count[0]?.n ?? 0),
        items: rows.map((r) => ({
          ...r,
          accountingDate: day(r.accountingDate),
        })),
      };
    },

    /** Buku Bank / Buku Besar: one account's running balance. */
    async accountBook(raw: unknown, cashOnly: boolean) {
      const current = await actor("financial_report");
      const q = ledgerInput.parse(raw);
      const period = defaultPeriod(q.start, q.end);
      if (period.start > period.end)
        throw new IdentityError("INVALID_INPUT", 400, "Periode tidak valid.");
      const accounts = await db.finAccount.findMany({
        where: { deletedAt: null, ...(cashOnly ? { isCash: true } : {}) },
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
        take: 1000,
      });
      const [costCentres, branchRows] = await Promise.all([
        db.finCostCentre.findMany({
          where: { deletedAt: null },
          select: { id: true, code: true, name: true },
          orderBy: { code: "asc" },
        }),
        branchChoices(current),
      ]);
      const chosen = q.accountId ?? accounts[0]?.id;
      const book =
        chosen && accounts.some((a) => a.id === chosen)
          ? await accountRows(current, chosen, { ...q, ...period })
          : null;
      return { ...period, accounts, costCentres, branches: branchRows, book };
    },

    /** Neraca Saldo: opening, movement and closing per account. */
    async trialBalance(raw: unknown) {
      const current = await actor("financial_report");
      const q = periodInput.parse(raw);
      const period = defaultPeriod(q.start, q.end);
      const [accounts, { opening, movement }, costCentres, branchRows] =
        await Promise.all([
          db.finAccount.findMany({
            where: { deletedAt: null },
            select: {
              id: true,
              code: true,
              name: true,
              kind: true,
              parentId: true,
            },
            orderBy: { code: "asc" },
          }),
          ledger(current, null, { ...q, ...period }),
          db.finCostCentre.findMany({
            where: { deletedAt: null },
            select: { id: true, code: true, name: true },
            orderBy: { code: "asc" },
          }),
          branchChoices(current),
        ]);
      const byId = new Map(accounts.map((a) => [a.id, a]));
      const totals = new Map<
        number,
        {
          openDebit: Prisma.Decimal;
          openCredit: Prisma.Decimal;
          debit: Prisma.Decimal;
          credit: Prisma.Decimal;
        }
      >();
      const bucket = (accountId: number) => {
        let t = totals.get(accountId);
        if (!t) {
          t = {
            openDebit: dec(0),
            openCredit: dec(0),
            debit: dec(0),
            credit: dec(0),
          };
          totals.set(accountId, t);
        }
        return t;
      };
      // Child amounts roll up into every parent (Tampil Induk).
      const ancestors = (accountId: number) => {
        const out: number[] = [];
        let cursor = byId.get(accountId)?.parentId ?? null;
        for (let i = 0; cursor && i < 50; i++) {
          out.push(cursor);
          cursor = byId.get(cursor)?.parentId ?? null;
        }
        return out;
      };
      for (const r of opening)
        for (const target of [r.accountId, ...ancestors(r.accountId)]) {
          const net = dec(r.debit).minus(r.credit);
          const t = bucket(target);
          if (net.gte(0)) t.openDebit = t.openDebit.plus(net);
          else t.openCredit = t.openCredit.plus(net.abs());
        }
      for (const r of movement)
        for (const target of [r.accountId, ...ancestors(r.accountId)]) {
          const t = bucket(target);
          t.debit = t.debit.plus(r.debit);
          t.credit = t.credit.plus(r.credit);
        }
      const hasChildren = new Set(
        accounts.map((a) => a.parentId).filter((v): v is number => !!v),
      );
      const rows = accounts
        .filter((a) =>
          q.level === "parent"
            ? hasChildren.has(a.id) || !a.parentId
            : q.level === "child"
              ? !hasChildren.has(a.id)
              : true,
        )
        .map((a) => {
          const t = totals.get(a.id) ?? {
            openDebit: dec(0),
            openCredit: dec(0),
            debit: dec(0),
            credit: dec(0),
          };
          const balance = t.openDebit
            .minus(t.openCredit)
            .plus(t.debit)
            .minus(t.credit);
          return {
            id: a.id,
            code: a.code,
            name: a.name,
            isParent: hasChildren.has(a.id),
            openDebit: t.openDebit.toFixed(2),
            openCredit: t.openCredit.toFixed(2),
            debit: t.debit.toFixed(2),
            credit: t.credit.toFixed(2),
            balance: balance.toFixed(2),
            zero:
              t.openDebit.eq(0) &&
              t.openCredit.eq(0) &&
              t.debit.eq(0) &&
              t.credit.eq(0),
          };
        })
        .filter((r) => q.includeZero || !r.zero);
      // Grand totals count leaf movement only, so parents do not double it.
      const leaf = (r: (typeof rows)[number]) => !r.isParent;
      const total = (key: "openDebit" | "openCredit" | "debit" | "credit") =>
        accounts
          .filter((a) => !hasChildren.has(a.id))
          .reduce((s, a) => s.plus(totals.get(a.id)?.[key] ?? 0), dec(0))
          .toFixed(2);
      return {
        ...period,
        filters: q,
        rows,
        leafCount: rows.filter(leaf).length,
        totals: {
          openDebit: total("openDebit"),
          openCredit: total("openCredit"),
          debit: total("debit"),
          credit: total("credit"),
        },
        costCentres,
        branches: branchRows,
      };
    },

    /** Neraca: AKTIVA vs PASSIVA (with current-year earnings) at end date. */
    async balanceSheet(raw: unknown) {
      const current = await actor("financial_report");
      const q = periodInput.parse(raw);
      const { end } = defaultPeriod(q.start, q.end);
      const [accounts, { opening }, costCentres, branchRows] =
        await Promise.all([
          db.finAccount.findMany({
            where: { deletedAt: null },
            select: {
              id: true,
              code: true,
              name: true,
              kind: true,
              parentId: true,
              parent: { select: { code: true, name: true } },
            },
            orderBy: { code: "asc" },
          }),
          // Everything up to and including the end date.
          ledger(current, null, {
            ...q,
            start: new Date(asDate(end).getTime() + 86_400_000)
              .toISOString()
              .slice(0, 10),
            end,
          }),
          db.finCostCentre.findMany({
            where: { deletedAt: null },
            select: { id: true, code: true, name: true },
            orderBy: { code: "asc" },
          }),
          branchChoices(current),
        ]);
      const net = new Map(
        opening.map((r) => [r.accountId, dec(r.debit).minus(r.credit)]),
      );
      const side = (kinds: string[], sign: 1 | -1) =>
        accounts
          .filter((a) => kinds.includes(a.kind))
          .map((a) => ({
            code: a.code,
            name: a.name,
            parent: a.parent ? `${a.parent.code} ${a.parent.name}` : "",
            amount: (net.get(a.id) ?? dec(0)).times(sign),
          }))
          .filter((r) => q.includeZero || !r.amount.eq(0));
      const assets = side(["ASSET"], 1);
      const liabilities = side(["LIABILITY"], -1);
      const equity = side(["EQUITY"], -1);
      const earnings = accounts
        .filter((a) => a.kind === "REVENUE" || a.kind === "EXPENSE")
        .reduce((s, a) => s.minus(net.get(a.id) ?? 0), dec(0));
      const fmt = (rows: typeof assets) =>
        rows.map((r) => ({ ...r, amount: r.amount.toFixed(2) }));
      const totalOf = (rows: typeof assets) =>
        rows.reduce((s, r) => s.plus(r.amount), dec(0));
      const passiva = totalOf(liabilities).plus(totalOf(equity)).plus(earnings);
      return {
        end,
        filters: q,
        aktiva: fmt(assets),
        kewajiban: fmt(liabilities),
        ekuitas: fmt(equity),
        labaBerjalan: earnings.toFixed(2),
        totalAktiva: totalOf(assets).toFixed(2),
        totalPassiva: passiva.toFixed(2),
        balanced: totalOf(assets).eq(passiva),
        costCentres,
        branches: branchRows,
      };
    },

    /** Kas & Bank: system balance vs the latest bank statement balance. */
    async reconciliation(raw: unknown) {
      const current = await actor("journal");
      const q = ledgerInput.parse(raw);
      const { end } = defaultPeriod(undefined, q.end);
      const branchRows = await branchChoices(current);
      const branchId = q.branchId ?? branchRows[0]?.id;
      if (!branchId)
        return { end, branchId: null, branches: branchRows, rows: [] };
      if (!branchRows.some((b) => b.id === branchId))
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      const cash = await db.finAccount.findMany({
        where: { isCash: true, deletedAt: null },
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
      });
      const sums = cash.length
        ? await db.$queryRaw<{ accountId: number; net: string }[]>`
            SELECT l."accountId", COALESCE(sum(l.debit - l.credit),0)::text AS net
            FROM fin_lines l JOIN fin_journals j ON j.id = l."journalId"
            WHERE j.status = 'POSTED' AND j."branchId" = ${branchId}
              AND j."accountingDate" <= ${asDate(end)}
              AND l."accountId" IN (${Prisma.join(cash.map((c) => c.id))})
            GROUP BY l."accountId"`
        : [];
      const statements = await db.finBankStatement.findMany({
        where: {
          branchId,
          deletedAt: null,
          statementDate: { lte: asDate(end) },
        },
        orderBy: { statementDate: "desc" },
      });
      const system = new Map(sums.map((s) => [s.accountId, dec(s.net)]));
      return {
        end,
        branchId,
        branches: branchRows,
        rows: cash.map((c) => {
          const latest = statements.find((s) => s.accountId === c.id);
          const sys = system.get(c.id) ?? dec(0);
          return {
            ...c,
            system: sys.toFixed(2),
            bank: latest ? latest.bankBalance.toFixed(2) : null,
            statementDate: latest ? day(latest.statementDate) : null,
            difference: latest
              ? sys.minus(latest.bankBalance).toFixed(2)
              : null,
          };
        }),
      };
    },

    /** Masters: cost centres, asset categories and assets (with depreciation). */
    async masters() {
      const current = await actor("finance_account");
      const today = defaultPeriod().end;
      const [costCentres, categories, assets, accounts, branchRows] =
        await Promise.all([
          db.finCostCentre.findMany({
            where: { deletedAt: null },
            include: { branch: { select: { code: true, name: true } } },
            orderBy: { code: "asc" },
          }),
          db.finAssetCategory.findMany({
            where: { deletedAt: null },
            include: {
              account: { select: { code: true, name: true } },
              counterAccount: { select: { code: true, name: true } },
            },
            orderBy: { name: "asc" },
          }),
          db.finAsset.findMany({
            where: {
              deletedAt: null,
              ...(isAdministrator(current)
                ? {}
                : {
                    OR: [
                      { branchId: null },
                      { branchId: { in: current.branchIds } },
                    ],
                  }),
            },
            include: {
              category: { select: { name: true } },
              branch: { select: { name: true } },
            },
            orderBy: [{ acquiredOn: "desc" }, { id: "desc" }],
            take: 500,
          }),
          db.finAccount.findMany({
            where: { active: true, deletedAt: null },
            select: {
              id: true,
              code: true,
              name: true,
              kind: true,
              parentId: true,
              plCategory: { select: { name: true } },
            },
            orderBy: { code: "asc" },
            take: 1000,
          }),
          branchChoices(current),
        ]);
      return {
        today,
        costCentres,
        categories,
        accounts,
        branches: branchRows,
        assets: assets.map((a) => ({
          ...a,
          acquiredOn: day(a.acquiredOn),
          cost: a.cost.toFixed(2),
          additions: a.additions.toFixed(2),
          reductions: a.reductions.toFixed(2),
          ...depreciation(a, today),
        })),
      };
    },
  };
}
