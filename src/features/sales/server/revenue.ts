import "server-only";

import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { jakartaMonthStartUtc } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";

export type RevenueRow = {
  id: number;
  name: string;
  revenue: string;
  previous: string;
  /** "Baru" when there was no revenue last month, null when both are zero. */
  growth: string | null;
};

/**
 * Legacy "Pendapatan Pelanggan": every visible customer with the sum of AWB
 * biaya in the selected month (Asia/Jakarta), compared with the previous month.
 */
export async function customerRevenue(
  actor: AccessActor,
  month: string,
  search = "",
): Promise<RevenueRow[]> {
  assertPermission(actor, "view", "customer");
  const [year, monthNumber] = month.split("-").map(Number);
  const start = jakartaMonthStartUtc(year, monthNumber);
  const next = jakartaMonthStartUtc(year, monthNumber + 1);
  const previous = jakartaMonthStartUtc(year, monthNumber - 1);
  const admin = isAdministrator(actor);
  const scope = admin
    ? Prisma.sql`TRUE`
    : actor.branchIds.length
      ? Prisma.sql`(c.branch_id IS NULL OR c.branch_id IN (${Prisma.join(actor.branchIds)}))`
      : Prisma.sql`FALSE`;
  const txScope = admin
    ? Prisma.sql`TRUE`
    : actor.branchIds.length
      ? Prisma.sql`(t.origin_branch_id IN (${Prisma.join(actor.branchIds)}) OR t.destination_branch_id IN (${Prisma.join(actor.branchIds)}))`
      : Prisma.sql`FALSE`;
  const q = search.trim().slice(0, 100);
  const rows = await prisma.$queryRaw<
    { id: number; name: string; revenue: string; previous: string }[]
  >`
    SELECT c.id, c.name,
           COALESCE(sum(t.biaya) FILTER (WHERE t.transaction_date >= ${start} AND t.transaction_date < ${next}), 0)::text AS revenue,
           COALESCE(sum(t.biaya) FILTER (WHERE t.transaction_date >= ${previous} AND t.transaction_date < ${start}), 0)::text AS previous
    FROM customers c
    LEFT JOIN transactions t ON t.customer_id = c.id AND t.deleted_at IS NULL
      AND t.transaction_date >= ${previous} AND t.transaction_date < ${next}
      AND ${txScope}
    WHERE c.deleted_at IS NULL AND ${scope}
      ${q ? Prisma.sql`AND c.name ILIKE ${`%${q.replace(/[\\%_]/g, "\\$&")}%`}` : Prisma.empty}
    GROUP BY c.id, c.name
    ORDER BY sum(t.biaya) FILTER (WHERE t.transaction_date >= ${start}) DESC NULLS LAST, c.name
    LIMIT 2000`;
  return rows.map((row) => {
    const now = new Prisma.Decimal(row.revenue);
    const before = new Prisma.Decimal(row.previous);
    const growth = before.isZero()
      ? now.isZero()
        ? null
        : "Baru"
      : `${now.minus(before).div(before).times(100).toFixed(1)}%`;
    return { ...row, growth };
  });
}
