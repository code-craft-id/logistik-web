export type TransactionReportFilters = {
  startDate: string;
  endDate: string;
  from: Date;
  toExclusive: Date;
  branchId: number | null;
  search: string;
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export type TransactionReportFilterResult =
  | { status: "initial" }
  | { status: "invalid"; issues: { field: string; message: string }[] }
  | { status: "valid"; filters: TransactionReportFilters };

const fields = new Set([
  "startDate",
  "endDate",
  "branchId",
  "search",
  "page",
  "pageSize",
]);
const dayMilliseconds = 86_400_000;

function calendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null;
}

function positiveInteger(value: string, maximum: number): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= maximum ? number : null;
}

/** Validates query syntax only; branch membership must be checked by the service. */
export function parseTransactionReportFilters(
  input: unknown,
): TransactionReportFilterResult {
  const issues: { field: string; message: string }[] = [];
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(input))
  ) {
    return {
      status: "invalid",
      issues: [{ field: "query", message: "Parameter laporan tidak valid." }],
    };
  }

  const query: Record<string, string | undefined> = {};
  for (const [field, value] of Object.entries(input)) {
    if (!fields.has(field)) {
      issues.push({ field: "query", message: "Parameter tidak didukung." });
    } else if (value !== undefined && typeof value !== "string") {
      issues.push({
        field,
        message: "Gunakan satu nilai teks untuk parameter.",
      });
    } else {
      query[field] = value;
    }
  }
  if (issues.length) return { status: "invalid", issues };

  const page = positiveInteger(query.page ?? "1", 1000);
  const pageSize = positiveInteger(query.pageSize ?? "20", 100);
  const branchId = query.branchId
    ? positiveInteger(query.branchId, 2_147_483_647)
    : null;
  if (page === null) {
    issues.push({ field: "page", message: "Halaman harus antara 1 dan 1000." });
  }
  if (pageSize === null) {
    issues.push({ field: "pageSize", message: "Ukuran halaman harus 1–100." });
  }
  if (query.branchId && branchId === null) {
    issues.push({ field: "branchId", message: "ID cabang tidak valid." });
  }
  if ((query.search ?? "").length > 100) {
    issues.push({
      field: "search",
      message: "Pencarian AWB maksimal 100 karakter.",
    });
  }
  if (issues.length || page === null || pageSize === null) {
    return { status: "invalid", issues };
  }

  const startDate = query.startDate ?? "";
  const endDate = query.endDate ?? "";
  if (!startDate && !endDate) return { status: "initial" };

  const from = calendarDate(startDate);
  const end = calendarDate(endDate);
  if (!from) {
    issues.push({
      field: "startDate",
      message: "Pilih tanggal mulai YYYY-MM-DD.",
    });
  }
  if (!end) {
    issues.push({
      field: "endDate",
      message: "Pilih tanggal akhir YYYY-MM-DD.",
    });
  }
  if (!from || !end) return { status: "invalid", issues };

  const inclusiveDays = (end.getTime() - from.getTime()) / dayMilliseconds + 1;
  if (inclusiveDays < 1 || inclusiveDays > 31) {
    return {
      status: "invalid",
      issues: [
        {
          field: "endDate",
          message: "Periode UTC harus berurutan dan maksimal 31 hari.",
        },
      ],
    };
  }

  return {
    status: "valid",
    filters: {
      startDate,
      endDate,
      from,
      toExclusive: new Date(end.getTime() + dayMilliseconds),
      branchId,
      search: (query.search ?? "").trim(),
      page,
      pageSize,
      skip: (page - 1) * pageSize,
      take: pageSize,
    },
  };
}
