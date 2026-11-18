import "server-only";

import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import { Prisma } from "@/lib/db/generated/client";

/** Simple report: one aggregated or bounded SQL query, scoped by branch. */
export type Cell = string | number | null;
export type Column = { key: string; label: string; numeric?: boolean };
export type Filters = {
  start: string;
  end: string;
  from: Date;
  toExclusive: Date;
  branchId: number | null;
};
export type ReportResult = {
  columns: Column[];
  rows: Record<string, Cell>[];
  /** Totals row keyed like columns; omitted keys render empty. */
  totals?: Record<string, Cell>;
  truncated?: boolean;
};
export type ReportDef = {
  title: string;
  /** Permission resource checked with the "view" action. */
  resource: string;
  /** Plain-language definition shown on the page (what is counted). */
  definition: string;
  /** False for as-of-today reports that ignore the date range. */
  usesPeriod?: boolean;
  run: (
    actor: AccessActor,
    filters: Filters,
    tx: Prisma.TransactionClient,
  ) => Promise<ReportResult>;
};

export const ROW_LIMIT = 2000;
const MAX_DAYS = 92;
const DAY = 86_400_000;

export type ParsedFilters =
  | { ok: true; filters: Filters }
  | {
      ok: false;
      message: string;
      start: string;
      end: string;
      branchId: string;
    };

/** Defaults to the current UTC month to date, like the legacy reports. */
export function parseFilters(
  query: Record<string, string | string[] | undefined>,
  allowedBranches: number[],
  admin: boolean,
): ParsedFilters {
  const one = (v: string | string[] | undefined) =>
    typeof v === "string" ? v.trim() : "";
  const today = new Date().toISOString().slice(0, 10);
  const start = one(query.startDate) || `${today.slice(0, 8)}01`;
  const end = one(query.endDate) || today;
  const branch = one(query.branchId);
  const bad = (message: string): ParsedFilters => ({
    ok: false,
    message,
    start,
    end,
    branchId: branch,
  });
  const date = /^\d{4}-\d{2}-\d{2}$/;
  if (!date.test(start) || !date.test(end)) return bad("Tanggal tidak valid.");
  const from = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(last.getTime()))
    return bad("Tanggal tidak valid.");
  if (last < from) return bad("Tanggal akhir sebelum tanggal mulai.");
  if ((last.getTime() - from.getTime()) / DAY + 1 > MAX_DAYS)
    return bad(`Periode maksimal ${MAX_DAYS} hari.`);
  let branchId: number | null = null;
  if (branch) {
    branchId = Number(branch);
    if (!Number.isSafeInteger(branchId) || branchId <= 0)
      return bad("Cabang tidak valid.");
    if (!admin && !allowedBranches.includes(branchId))
      return bad("Cabang di luar akses Anda.");
  }
  return {
    ok: true,
    filters: {
      start,
      end,
      from,
      toExclusive: new Date(last.getTime() + DAY),
      branchId,
    },
  };
}

/**
 * Transaction scope for alias t: actor branches on origin or destination
 * (or destination only for inbound), narrowed to the selected branch.
 */
export function transactionScope(
  actor: AccessActor,
  f: Filters,
  side: "any" | "destination" = "any",
): Prisma.Sql {
  const on = (ids: Prisma.Sql) =>
    side === "destination"
      ? Prisma.sql`t.destination_branch_id IN (${ids})`
      : Prisma.sql`(t.origin_branch_id IN (${ids}) OR t.destination_branch_id IN (${ids}))`;
  const parts: Prisma.Sql[] = [Prisma.sql`t.deleted_at IS NULL`];
  if (!isAdministrator(actor))
    parts.push(
      actor.branchIds.length
        ? on(Prisma.join(actor.branchIds))
        : Prisma.sql`FALSE`,
    );
  if (f.branchId !== null) parts.push(on(Prisma.sql`${f.branchId}`));
  return Prisma.join(parts, " AND ");
}

/** Owning-branch scope for a table alias with a branch column. */
export function branchScope(
  actor: AccessActor,
  f: Filters,
  column: Prisma.Sql,
): Prisma.Sql {
  const parts: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (!isAdministrator(actor))
    parts.push(
      actor.branchIds.length
        ? Prisma.sql`${column} IN (${Prisma.join(actor.branchIds)})`
        : Prisma.sql`FALSE`,
    );
  if (f.branchId !== null) parts.push(Prisma.sql`${column} = ${f.branchId}`);
  return Prisma.join(parts, " AND ");
}

/** Sum numeric columns of the rows into a totals record. */
export function sumColumns(
  rows: Record<string, Cell>[],
  keys: string[],
  label: Record<string, Cell>,
): Record<string, Cell> {
  const totals: Record<string, Cell> = { ...label };
  for (const key of keys) {
    let sum = new Prisma.Decimal(0);
    let known = true;
    let places = 0;
    for (const row of rows) {
      const value = row[key];
      if (value === null || value === undefined) {
        known = false;
        continue;
      }
      sum = sum.plus(value);
      // Keep the source scale (e.g. money with 2 decimals) in the total.
      places = Math.max(places, String(value).split(".")[1]?.length ?? 0);
    }
    totals[key] = known
      ? places
        ? sum.toFixed(places)
        : sum.toNumber()
      : null;
  }
  return totals;
}
