import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import {
  ASSET_COLUMNS,
  assetTemplate,
  parseAssetRows,
} from "../../src/features/finance/server/asset-import";

// Parsing only: no database.
vi.mock("@/lib/db", () => ({ prisma: {} }));

const file = (rows: unknown[][]) => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Assets");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
};

describe("asset import file", () => {
  it("reads rows under the template header", () => {
    expect(
      parseAssetRows(file([[...ASSET_COLUMNS], ["FAKE Truk", "Kendaraan"]])),
    ).toHaveLength(1);
  });
  it("rejects the empty template and a wrong header", () => {
    expect(() => parseAssetRows(assetTemplate())).toThrow("tidak berisi data");
    expect(() => parseAssetRows(file([["Nama"], ["x"]]))).toThrow(
      "Judul kolom",
    );
  });
});
