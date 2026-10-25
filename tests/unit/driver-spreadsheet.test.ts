import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  PERSONNEL_IMPORT_MAX_BYTES as DRIVER_IMPORT_MAX_BYTES,
  personnelImportDefinitions,
} from "../../src/features/master-data/personnel-import-contracts";
import {
  buildPersonnelTemplate,
  parsePersonnelSpreadsheet,
  parsePersonnelWorksheet,
} from "../../src/features/master-data/server/personnel-spreadsheet";

const DRIVER_IMPORT_HEADERS = personnelImportDefinitions.driver.headers;
const parseDriverSpreadsheet = (bytes: Uint8Array) =>
  parsePersonnelSpreadsheet("driver", bytes);
const parseDriverWorksheet = (sheet: XLSX.WorkSheet) =>
  parsePersonnelWorksheet("driver", sheet);
const buildDriverTemplate = (branches: { code: string; name: string }[]) =>
  buildPersonnelTemplate("driver", branches);

const data = [
  "",
  "FAKE Driver",
  "FAKE Address",
  "FAKE Address 2",
  "0012345678901234",
  "081234567890",
  "FAKE-01",
  "",
  "00123456",
  "Y",
];
function file(rows: unknown[][], change?: (sheet: XLSX.WorkSheet) => void) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Template Import Driver"],
    [],
    [...DRIVER_IMPORT_HEADERS],
    ...rows,
  ]);
  change?.(sheet);
  XLSX.utils.book_append_sheet(book, sheet, "Worksheet");
  return XLSX.write(book, { type: "buffer", bookType: "biff8" }) as Uint8Array;
}
describe("driver Excel compatibility", () => {
  it("keeps original ten-column layout, preserves leading zeroes and merges both address lines", () => {
    expect(parseDriverSpreadsheet(file([data]))).toEqual([
      {
        row: 4,
        name: "FAKE Driver",
        address: "FAKE Address\nFAKE Address 2",
        nationalIdNumber: "0012345678901234",
        phone: "081234567890",
        branch: "FAKE-01",
        driverLicenseNumber: "00123456",
        status: "ACTIVE",
      },
    ]);
  });
  it("ignores legacy ID / derived branch formulas, but rejects formulas and numeric identity cells in input fields", () => {
    expect(
      parseDriverSpreadsheet(
        file([[9123, ...data.slice(1)]], (sheet) => {
          sheet.H4 = { t: "n", v: 999, f: "VLOOKUP(G4,K14:L50,2,FALSE)" };
        }),
      )[0].branch,
    ).toBe("FAKE-01");
    // BIFF8 export writes cached values; exercise a decoded formula explicitly.
    // Real provider workbook formulas were inspected before implementing this guard.
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Template Import Driver"],
      [],
      [...DRIVER_IMPORT_HEADERS],
      data,
    ]);
    sheet.B4 = { t: "n", v: 3, f: "SUM(1,2)" };
    expect(() => parseDriverWorksheet(sheet)).toThrow(/tanpa rumus/);
    expect(() =>
      parseDriverSpreadsheet(
        file([data], (sheet) => {
          sheet.E4 = { t: "n", v: 1234567890123456 };
        }),
      ),
    ).toThrow(/berformat Teks/);
  });
  it("rejects invalid headers, missing data, unknown status, wrong formats and oversized uploads", () => {
    expect(() =>
      parseDriverSpreadsheet(
        file([data], (sheet) => {
          sheet.B3 = { t: "s", v: "Changed" };
        }),
      ),
    ).toThrow(/Kolom template/);
    expect(() => parseDriverSpreadsheet(file([]))).toThrow(/belum berisi/);
    expect(() =>
      parseDriverSpreadsheet(file([[...data.slice(0, 9), "MAYBE"]])),
    ).toThrow(/STATUS wajib/);
    expect(() =>
      parseDriverSpreadsheet(new Uint8Array([80, 75, 3, 4])),
    ).toThrow(/format|Gunakan/);
    expect(() =>
      parseDriverSpreadsheet(new Uint8Array(DRIVER_IMPORT_MAX_BYTES + 1)),
    ).toThrow(/512 KB/);
  });
  it("rejects more than 500 actual records and never silently truncates sparse late rows", () => {
    expect(() =>
      parseDriverSpreadsheet(file(Array.from({ length: 501 }, () => data))),
    ).toThrow(/500 personel/);
    const sparse = Array.from({ length: 700 }, () => [] as unknown[]);
    sparse[699] = data;
    expect(parseDriverSpreadsheet(file(sparse))[0].row).toBe(703);
  }, 15_000);
  it("generates a clean compatible download with instructions, scoped references and no formulas or example imports", () => {
    const bytes = buildDriverTemplate([
      { code: "FAKE-01", name: "FAKE Branch" },
    ]);
    expect(bytes.byteLength).toBeLessThanOrEqual(DRIVER_IMPORT_MAX_BYTES);
    const book = XLSX.read(bytes, { type: "array", cellFormula: true });
    expect(book.SheetNames).toEqual(["Worksheet", "Keterangan"]);
    expect(
      Object.values(book.Sheets.Worksheet).some(
        (cell) => typeof cell === "object" && cell && "f" in cell,
      ),
    ).toBe(false);
    expect(() => parseDriverSpreadsheet(bytes)).toThrow(/belum berisi/);
    expect(
      XLSX.utils.sheet_to_json(book.Sheets.Keterangan, { header: 1 }).flat(),
    ).toContain("FAKE-01");
  }, 15_000);
  it.each([
    "courier",
    "marketing_person",
  ] as const)("matches the nine-column %s template and never accepts a driver file as that format", (kind) => {
    const workbook = XLSX.utils.book_new();
    const values = [...data.slice(0, 8), "Y"];
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        [`Template Import ${kind}`],
        [],
        personnelImportDefinitions[kind].headers,
        values,
      ]),
      "Worksheet",
    );
    const bytes = XLSX.write(workbook, { type: "buffer", bookType: "biff8" });
    const row = parsePersonnelSpreadsheet(kind, bytes)[0];
    expect(row).toMatchObject({
      name: "FAKE Driver",
      nationalIdNumber: "0012345678901234",
      status: "ACTIVE",
      branch: "FAKE-01",
    });
    expect(row).not.toHaveProperty("driverLicenseNumber");
    expect(() => parsePersonnelSpreadsheet(kind, file([data]))).toThrow(
      /Kolom template/,
    );
    const template = buildPersonnelTemplate(kind, []);
    expect(() => parsePersonnelSpreadsheet(kind, template)).toThrow(
      /belum berisi/,
    );
  }, 15_000);
});
