import {
  parseTransactionReportFilters,
  type TransactionReportFilterResult,
} from "../transaction-details/filters";
export type OperationalKind = "manifest" | "delivery" | "dashboard" | "vendor";
export type DeliveryView = "sheets" | "items";
export function parseOperationalFilters(
  kind: OperationalKind,
  input: unknown,
  now?: Date,
): { view: DeliveryView; parsed: TransactionReportFilterResult } {
  let view: DeliveryView = "sheets";
  const invalid = (message: string) => ({
    view,
    parsed: {
      status: "invalid",
      issues: [{ field: "query", message }],
    } as TransactionReportFilterResult,
  });
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(input))
  )
    return { view, parsed: parseTransactionReportFilters(input) };
  const query = { ...input } as Record<string, unknown>;
  if (
    ["originBranchId", "destinationBranchId", "sortBy", "sortDirection"].some(
      (field) => Object.hasOwn(query, field),
    )
  )
    return invalid("Parameter tidak didukung.");
  if (kind === "delivery") {
    if (
      query.view !== undefined &&
      query.view !== "sheets" &&
      query.view !== "items"
    )
      return invalid("Pilih tampilan per DRS atau per transaksi.");
    if (query.view === "items") view = "items";
    delete query.view;
  }
  if (
    kind === "dashboard" &&
    ["search", "page", "pageSize"].some((key) => query[key] !== undefined)
  )
    return invalid("Ringkasan menggunakan filter periode dan cabang saja.");
  // Legacy dashboard opens on the current month to date; UTC per D-19 bounded use.
  if (
    kind === "dashboard" &&
    query.startDate === undefined &&
    query.endDate === undefined
  ) {
    const today = (now ?? new Date()).toISOString().slice(0, 10);
    query.startDate = `${today.slice(0, 8)}01`;
    query.endDate = today;
  }
  const parsed = parseTransactionReportFilters(query);
  if (parsed.status === "invalid")
    return {
      view,
      parsed: {
        ...parsed,
        issues: parsed.issues.map((issue) =>
          issue.field === "search"
            ? { ...issue, message: "Pencarian maksimal 50 karakter." }
            : issue,
        ),
      },
    };
  return { view, parsed };
}
