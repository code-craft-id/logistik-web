import {
  parseTransactionReportFilters,
  type TransactionReportFilterResult,
} from "../transaction-details/filters";
import type { AwbStatusKind } from "./contracts";

export type AwbStatusQuery = {
  parsed: TransactionReportFilterResult;
  /** Stored shipment status filter (LP-R21 "Status Kiriman"); exact match. */
  status: string | null;
  /** LP-R10 legacy has no period: no dates means every pending AWB. */
  allDates: boolean;
};
const PLACEHOLDER = { startDate: "2000-01-01", endDate: "2000-01-01" };
const invalid = (message: string): AwbStatusQuery => ({
  parsed: { status: "invalid", issues: [{ field: "query", message }] },
  status: null,
  allDates: false,
});

/** Reuses the RPT-01 period/branch/search/paging rules; ordering is fixed per report. */
export function parseAwbStatusFilters(
  kind: AwbStatusKind,
  input: unknown,
): AwbStatusQuery {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(input))
  )
    return {
      parsed: parseTransactionReportFilters(input),
      status: null,
      allDates: false,
    };
  const query = { ...input } as Record<string, unknown>;
  if (["sortBy", "sortDirection"].some((field) => Object.hasOwn(query, field)))
    return invalid("Parameter tidak didukung.");
  let status: string | null = null;
  if (Object.hasOwn(query, "status")) {
    if (kind !== "all-status") return invalid("Parameter tidak didukung.");
    if (typeof query.status !== "string" || query.status.length > 30)
      return invalid("Status kiriman tidak valid.");
    status = query.status.trim() || null;
    delete query.status;
  }
  const blank = (value: unknown) => value === undefined || value === "";
  const allDates =
    kind === "pending" && blank(query.startDate) && blank(query.endDate);
  if (allDates) Object.assign(query, PLACEHOLDER);
  return { parsed: parseTransactionReportFilters(query), status, allDates };
}

/** AWB page hosts LP-R10 and LP-R11 as distinct views; unknown values are rejected. */
export function awbView(value: unknown): AwbStatusKind | null {
  if (value === undefined || value === "pending") return "pending";
  if (value === "manifested") return "manifested";
  return null;
}

/** Legacy opening state: current month for LP-R11, today for LP-R21 (UTC). */
export function defaultPeriod(
  kind: AwbStatusKind,
  now = new Date(),
): { startDate: string; endDate: string } | null {
  const day = (date: Date) => date.toISOString().slice(0, 10);
  if (kind === "all-status") return { startDate: day(now), endDate: day(now) };
  if (kind === "manifested")
    return {
      startDate: day(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      ),
      endDate: day(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)),
      ),
    };
  return null;
}
