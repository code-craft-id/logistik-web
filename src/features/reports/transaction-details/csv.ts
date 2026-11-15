import type { TransactionReportRow } from "./contracts";

const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
function text(value: string | null) {
  const cell = value ?? "";
  // Protect formula and control prefixes, even after whitespace or invisible characters.
  return quote(
    /^[\s\p{Cc}\p{Cf}]*[=+\-@＝＋－＠\p{Cc}\p{Cf}]/u.test(cell)
      ? `'${cell}`
      : cell,
  );
}
export function transactionReportCsv(rows: TransactionReportRow[]): string {
  const header = [
    "AWB No.",
    "tanggal (UTC)",
    "Asal",
    "Tujuan",
    "Pengirim",
    "Penerima Barang",
    "Koli",
    "Kilo",
    "Status Pengiriman",
  ]
    .map(quote)
    .join(",");
  const lines = rows.map((row) =>
    [
      text(row.awbNo),
      quote(row.transactionDate),
      text(row.originBranch),
      text(row.destinationBranch),
      text(row.senderName),
      text(row.receiverName),
      quote(row.koli === null ? "" : String(row.koli)),
      quote(row.kilo ?? ""),
      text(row.status),
    ].join(","),
  );
  return `${[header, ...lines].join("\r\n")}\r\n`;
}
