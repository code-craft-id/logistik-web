import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import {
  AWB_COLUMNS,
  parseAwbFile,
} from "../../src/features/bookings/server/awb-import";

// Parsing only: no database.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("../../src/features/bookings/server/service", () => ({
  createTransaction: vi.fn(),
}));

const row = (values: Record<number, unknown>) =>
  AWB_COLUMNS.map((_, i) => values[i] ?? "");
const file = (rows: unknown[][]) => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([["", "Pickup BY"], [...AWB_COLUMNS], ...rows]),
    "Sheet1",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
};
const awb = {
  0: "FAKE001",
  2: "2026-11-01",
  6: 1,
  8: 2,
  17: 2,
  19: 5,
  29: "Y",
  30: 100000,
  31: 0.5,
  36: 1,
  38: "FAKE001",
  40: 10,
  41: 10,
  42: 10,
  43: 1,
};

describe("AWB import file", () => {
  it("maps provider columns, koli dimensions and insurance percent", () => {
    const [parsed, ...rest] = parseAwbFile(
      file([
        row(awb),
        row({ 38: "FAKE001", 40: 20, 41: 20, 42: 20, 43: 2 }),
        row({ 5: "#N/A", 7: "#N/A" }),
      ]),
    );
    expect(rest).toEqual([]);
    expect(parsed.input).toMatchObject({
      awbNo: "FAKE001",
      originBranchId: "1",
      destinationBranchId: "2",
      koli: "2",
      kilo: "5",
      costTypeId: "1",
      insuranceFee: "500.00",
      pickupCourierId: undefined,
    });
    expect(JSON.parse(String(parsed.input.dimensionRows))).toHaveLength(2);
  });
  it("rejects a duplicate number, a bad date and a wrong header", () => {
    expect(() => parseAwbFile(file([row(awb), row(awb)]))).toThrow("ganda");
    expect(() => parseAwbFile(file([row({ ...awb, 2: "1/2" })]))).toThrow(
      "Tanggal",
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([["x"], ["y"]]),
      "S",
    );
    expect(() =>
      parseAwbFile(XLSX.write(book, { type: "buffer", bookType: "xlsx" })),
    ).toThrow("Judul kolom");
  });
});
