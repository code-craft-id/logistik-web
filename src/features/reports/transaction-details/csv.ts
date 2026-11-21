import { businessDateTimeString } from "@/lib/date/business-date";
import type { TransactionReportRow } from "./contracts";

export const csvQuote = (value: string) => `"${value.replaceAll('"', '""')}"`;
export function csvText(value: string | null) {
  const cell = value ?? "";
  // Protect formula and control prefixes, even after whitespace or invisible characters.
  return csvQuote(
    /^[\s\p{Cc}\p{Cf}]*[=+\-@＝＋－＠\p{Cc}\p{Cf}]/u.test(cell)
      ? `'${cell}`
      : cell,
  );
}
export function transactionReportCsv(rows: TransactionReportRow[]): string {
  const header = [
    "AWB No.",
    "tanggal (Asia/Jakarta)",
    "Asal",
    "Tujuan",
    "Pengirim",
    "Penerima Barang",
    "Koli",
    "Kilo",
    "Status Pengiriman",
  ]
    .map(csvQuote)
    .join(",");
  const lines = rows.map((row) =>
    [
      csvText(row.awbNo),
      csvQuote(businessDateTimeString(row.transactionDate)),
      csvText(row.originBranch),
      csvText(row.destinationBranch),
      csvText(row.senderName),
      csvText(row.receiverName),
      csvQuote(row.koli === null ? "" : String(row.koli)),
      csvQuote(row.kilo ?? ""),
      csvText(row.status),
    ].join(","),
  );
  return `${[header, ...lines].join("\r\n")}\r\n`;
}
