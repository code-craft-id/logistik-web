import "server-only";

import * as XLSX from "xlsx";
import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";

/**
 * Hitung Rugi Laba as in the provider's hidden /rugi-laba page (OBSERVED
 * 2026-11-19): Bulan, Tahun, Cost Centre (NASIONAL = every branch the user
 * may see, or one branch); rows KODE AKUN, INDUK, HASIL for the month, %
 * and Current Year, grouped per Kategori Rugi Laba with a TOTAL per group.
 * Posted journals only. Sign follows the account kind (owner decision:
 * no separate "Operator Rugi Laba"): revenue adds, expense subtracts.
 * % = month result / month revenue ("nan %" without revenue, as observed).
 */
export const profitLossInput = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  branchId: z.preprocess(
    (v) => (v === "" || v === "0" ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
});

export type PlRow = {
  code: string;
  name: string;
  parent: string | null;
  month: number;
  percent: number | null;
  year: number;
};
export type PlGroup = {
  code: string | null;
  name: string;
  rows: PlRow[];
  month: number;
  percent: number | null;
  year: number;
};

export async function profitLoss(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "view", "financial_report");
  const parsed = profitLossInput.safeParse(raw);
  if (!parsed.success) throw new IdentityError("VALIDATION", 400);
  const input = parsed.data;
  if (input.branchId && !permitsBranch(actor, input.branchId))
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  const admin = isAdministrator(actor);
  if (!admin && !input.branchId && !actor.branchIds.length)
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  const scope = input.branchId
    ? Prisma.sql`j."branchId" = ${input.branchId}`
    : admin
      ? Prisma.sql`TRUE`
      : Prisma.sql`j."branchId" IN (${Prisma.join(actor.branchIds)})`;
  const monthStart = new Date(Date.UTC(input.year, input.month - 1, 1));
  const monthEnd = new Date(Date.UTC(input.year, input.month, 1));
  const yearStart = new Date(Date.UTC(input.year, 0, 1));
  const rows = await prisma.$queryRaw<
    {
      code: string;
      name: string;
      kind: string;
      parent: string | null;
      categoryCode: string | null;
      categoryName: string | null;
      month: string;
      year: string;
    }[]
  >`
    SELECT a.code, a.name, a.kind,
           p.name AS parent,
           c.code AS "categoryCode", c.name AS "categoryName",
           COALESCE(sum(l.credit - l.debit) FILTER (
             WHERE j."accountingDate" >= ${monthStart}::date
               AND j."accountingDate" < ${monthEnd}::date), 0)::text AS month,
           COALESCE(sum(l.credit - l.debit), 0)::text AS year
    FROM fin_lines l
    JOIN fin_journals j ON j.id = l."journalId"
    JOIN fin_accounts a ON a.id = l."accountId"
    LEFT JOIN fin_accounts p ON p.id = a."parentId"
    LEFT JOIN fin_pl_categories c ON c.id = a."plCategoryId"
    WHERE j.status = 'POSTED' AND ${scope}
      AND a.kind IN ('REVENUE', 'EXPENSE')
      AND j."accountingDate" >= ${yearStart}::date
      AND j."accountingDate" < ${monthEnd}::date
    GROUP BY a.id, a.code, a.name, a.kind, p.name, c.code, c.name
    ORDER BY c.code NULLS LAST, a.code`;
  // credit - debit: revenue positive, expense negative (kind gives the sign).
  const revenueMonth = rows
    .filter((r) => r.kind === "REVENUE")
    .reduce((t, r) => t + Number(r.month), 0);
  const pct = (v: number) =>
    revenueMonth ? Math.round((v / revenueMonth) * 10000) / 100 : null;
  const groups = new Map<string, PlGroup>();
  for (const r of rows) {
    const key = r.categoryCode ?? "";
    const group = groups.get(key) ?? {
      code: r.categoryCode,
      name: r.categoryName ?? "Tanpa Kategori Rugi Laba",
      rows: [],
      month: 0,
      percent: null,
      year: 0,
    };
    const month = Number(r.month);
    const year = Number(r.year);
    group.rows.push({
      code: r.code,
      name: r.name,
      parent: r.parent,
      month,
      percent: pct(month),
      year,
    });
    group.month += month;
    group.year += year;
    groups.set(key, group);
  }
  const list = [...groups.values()].map((g) => ({
    ...g,
    percent: pct(g.month),
  }));
  const totalMonth = list.reduce((t, g) => t + g.month, 0);
  const totalYear = list.reduce((t, g) => t + g.year, 0);
  const branch = input.branchId
    ? await prisma.branch.findFirst({
        where: { id: input.branchId },
        select: { code: true, name: true },
      })
    : null;
  return {
    input,
    costCentre: branch ? `${branch.code} | ${branch.name}` : "NASIONAL",
    groups: list,
    total: { month: totalMonth, percent: pct(totalMonth), year: totalYear },
  };
}

/** Hitung Rugi Laba Export Excel (sandbox button): same layout as the page table. */
export function profitLossWorkbook(
  report: Awaited<ReturnType<typeof profitLoss>>,
  monthLabel: string,
  year: number,
) {
  const n = (v: number) => Number(v.toFixed(2));
  const pct = (v: number | null) => (v === null ? "nan %" : `${v} %`);
  const rows: (string | number)[][] = [
    ["Daftar Rugi Laba"],
    [`Cost Centre: ${report.costCentre}`],
    [],
    ["KODE AKUN", "INDUK", `HASIL ${monthLabel}`, "%", `Current Year ${year}`],
  ];
  for (const g of report.groups) {
    rows.push([g.code ? `${g.code} | ${g.name}` : g.name]);
    for (const r of g.rows)
      rows.push([
        `${r.code} ${r.name}`,
        r.parent ?? "-",
        n(r.month),
        pct(r.percent),
        n(r.year),
      ]);
    rows.push([`TOTAL ${g.name}`, "", n(g.month), pct(g.percent), n(g.year)]);
  }
  rows.push([
    "LABA (RUGI) BERSIH",
    "",
    n(report.total.month),
    pct(report.total.percent),
    n(report.total.year),
  ]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet(rows),
    "Rugi Laba",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
