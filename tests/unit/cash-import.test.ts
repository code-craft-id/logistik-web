import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import {
  CASH_COLUMNS,
  cashTemplate,
  parseCashFile,
} from "../../src/features/finance/server/cash-import";

// Parsing only: no database.
vi.mock("@/lib/db", () => ({ prisma: {} }));

const file = (rows: unknown[][]) => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["Import Kasir Pembayaran"],
      [],
      [...CASH_COLUMNS],
      ...rows,
    ]),
    "Import",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
};
const row = (reference: string, amount: unknown, side: string) => [
  "2026-07-08",
  reference,
  "52100099",
  "FAKE",
  "Import",
  amount,
  side,
];

describe("cash payment import file", () => {
  it("groups rows by No. Bukti and skips the template's #N/A rows", () => {
    const vouchers = parseCashFile(
      file([
        row("BK/1", 1000, "D"),
        row("BK/1", 1000, "K"),
        row("BK/2", "10.50", "D"),
        [undefined, undefined, undefined, "#N/A"],
      ]),
    );
    expect(vouchers.map((v) => [v.reference, v.lines.length])).toEqual([
      ["BK/1", 2],
      ["BK/2", 1],
    ]);
    expect(vouchers[1].lines[0].amount.toFixed(2)).toBe("10.50");
  });
  it("reads its own template and lists the accounts on a second sheet", () => {
    const bytes = cashTemplate([{ code: "1", name: "FAKE Kas" }]);
    expect(parseCashFile(bytes)[0].lines).toHaveLength(2);
    const book = XLSX.read(bytes, { type: "buffer" });
    expect(
      XLSX.utils.sheet_to_json(book.Sheets["Master Akun"], { header: 1 }),
    ).toContainEqual(["1", "FAKE Kas"]);
  });
  it.each([
    [row("BK/1", "1.000,5", "D"), "Nominal"],
    [row("BK/1", 0, "D"), "Nominal"],
    [row("BK/1", 5, "X"), "Posisi"],
    [row("", 5, "D"), "No. Bukti"],
  ])("rejects a bad row", (bad, message) => {
    expect(() => parseCashFile(file([bad]))).toThrow(message);
  });
});
