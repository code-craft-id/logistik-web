import {
  parseTransactionReportFilters,
  type TransactionReportFilterResult,
} from "../transaction-details/filters";
export type OperationalKind = "manifest" | "delivery" | "dashboard" | "vendor";
export type DeliveryView = "sheets" | "items";
export function parseOperationalFilters(
  kind: OperationalKind,
  input: unknown,
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
