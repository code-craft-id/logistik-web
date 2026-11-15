import { expect, it } from "vitest";
import type { TransactionReportRow } from "../../src/features/reports/transaction-details/contracts";
import { transactionReportCsv } from "../../src/features/reports/transaction-details/csv";

const row: TransactionReportRow = {
  id: 918273,
  awbNo: "AWB",
  transactionDate: "2026-11-01T00:00:00.000Z",
  originBranch: "Asal",
  destinationBranch: null,
  senderName: 'Nama, "雪"\nBaris',
  receiverName: "Penerima",
  koli: 0,
  kilo: "123456789012345.1234",
  status: "Cancelled",
};
const header =
  '"AWB No.","tanggal (UTC)","Asal","Tujuan","Pengirim","Penerima Barang","Koli","Kilo","Status Pengiriman"\r\n';
it("maps exactly nine public fields with Unicode/quotes/newlines/nulls and exact numeric strings", () => {
  expect(transactionReportCsv([row])).toBe(
    header +
      '"AWB","2026-11-01T00:00:00.000Z","Asal","","Nama, ""雪""\nBaris","Penerima","0","123456789012345.1234","Cancelled"\r\n',
  );
  expect(transactionReportCsv([])).toBe(header);
  expect(transactionReportCsv([{ ...row, koli: null, kilo: null }])).toContain(
    ',"","","Cancelled"\r\n',
  );
  expect(transactionReportCsv([{ ...row, kilo: "-12.34" }])).toContain(
    '"-12.34"',
  );
  expect(transactionReportCsv([row])).not.toContain("918273");
});
it.each([
  "=1+1",
  "+SUM(A1)",
  "-1+2",
  "@SUM(A1)",
  " =1",
  "\t=1",
  "\r\n+1",
  "\u0000@1",
  "\u200b=1",
  "\u00a0-1",
  "＝1",
  "＋1",
  "－1",
  "＠1",
  "\ttext",
  " \rtext",
  "\ntext",
])("neutralizes risky cell prefix %j on every untrusted text field", (value) => {
  for (const field of [
    "awbNo",
    "originBranch",
    "destinationBranch",
    "senderName",
    "receiverName",
    "status",
  ] as const) {
    expect(transactionReportCsv([{ ...row, [field]: value }])).toContain(
      `"'${value.replaceAll('"', '""')}"`,
    );
  }
});
it("keeps delimiters and embedded formulas inside a single quoted cell", () => {
  expect(
    transactionReportCsv([{ ...row, senderName: 'safe",=1+1;@2' }]),
  ).toContain('"safe"",=1+1;@2"');
});
