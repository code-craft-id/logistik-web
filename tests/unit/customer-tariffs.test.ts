import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import {
  parseTariffFile,
  tariffColumns,
} from "../../src/features/sales/server/customer-tariffs";

// Parsing only: no database.
vi.mock("@/lib/db", () => ({ prisma: {} }));

const file = (pricing: "KG" | "KOLI" | "TRUCKING", rows: unknown[][]) => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["Template Import Tarif Customers"],
      tariffColumns(pricing),
      ...rows,
    ]),
    "S",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
};
const head = [11, 1, "REGULER", 26, "darat", 1, "ASAL", 3, "TUJUAN", 4];

describe("customer tariff file", () => {
  it("reads both layouts and skips formula leftovers", () => {
    expect(
      parseTariffFile(
        file("KG", [
          [...head, 1, 2000, 1000, 3],
          ["", "", "#N/A", "", "#N/A"],
        ]),
        "KG",
      ),
    ).toMatchObject([
      {
        uniqueNo: 11,
        originBranchId: 3,
        destinationBranchId: 4,
        price: "2000",
        nextPrice: "1000",
        leadTimeDays: 3,
      },
    ]);
    expect(
      parseTariffFile(file("KOLI", [[...head, 2000, 3]]), "KOLI"),
    ).toMatchObject([{ price: "2000", minWeight: null, nextPrice: null }]);
  });
  it("reads trucking rows as trucking types", () => {
    expect(
      parseTariffFile(file("TRUCKING", [[...head, 1000, 3]]), "TRUCKING"),
    ).toMatchObject([
      { deliveryServiceId: null, truckingTypeId: 26, price: "1000" },
    ]);
  });
  it("rejects duplicate Unique, bad money and the other layout", () => {
    const row = [...head, 2000, 3];
    expect(() => parseTariffFile(file("KOLI", [row, row]), "KOLI")).toThrow(
      "ganda",
    );
    expect(() =>
      parseTariffFile(file("KOLI", [[...head, "-1", 3]]), "KOLI"),
    ).toThrow("Tarif Koli");
    expect(() => parseTariffFile(file("KOLI", [row]), "KG")).toThrow(
      "Judul kolom",
    );
  });
});
