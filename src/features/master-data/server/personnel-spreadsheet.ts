import "server-only";
import * as XLSX from "xlsx";
import { IdentityError } from "@/features/identity/server/access";
import { courierInput, driverInput, marketingPersonInput } from "../contracts";
import {
  PERSONNEL_IMPORT_MAX_BYTES,
  PERSONNEL_IMPORT_MAX_ROWS,
  type PersonnelImportKind,
  type PersonnelImportLine,
  personnelImportDefinitions,
} from "../personnel-import-contracts";

const signature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const invalid = (message: string): never => {
  throw new IdentityError("INVALID_IMPORT", 400, message);
};
export function parsePersonnelSpreadsheet(
  kind: PersonnelImportKind,
  bytes: Uint8Array,
): PersonnelImportLine[] {
  if (!bytes.length || bytes.length > PERSONNEL_IMPORT_MAX_BYTES)
    invalid("File .xls maksimal 512 KB.");
  if (!Buffer.from(bytes.subarray(0, 8)).equals(signature))
    invalid(
      "Gunakan file Excel .xls sesuai template, bukan file yang hanya diganti ekstensinya.",
    );
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(bytes, {
      type: "array",
      cellFormula: true,
      cellText: true,
      sheetRows: 5001,
    });
  } catch {
    return invalid("File Excel rusak, terenkripsi, atau tidak dapat dibaca.");
  }
  const sheet = workbook.Sheets.Worksheet;
  if (!sheet)
    invalid(
      'Lembar "Worksheet" tidak ditemukan. Gunakan template sesuai jenis personel.',
    );
  return parsePersonnelWorksheet(kind, sheet);
}

export function parsePersonnelWorksheet(
  kind: PersonnelImportKind,
  sheet: XLSX.WorkSheet,
): PersonnelImportLine[] {
  const headers = personnelImportDefinitions[kind].headers;
  const header = headers.map((_, col) =>
    String(sheet[XLSX.utils.encode_cell({ r: 2, c: col })]?.v ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase(),
  );
  if (
    !header.every(
      (value, index) =>
        value === headers[index].replace(/\s+/g, " ").toUpperCase(),
    )
  )
    invalid(
      "Kolom template berubah. Gunakan judul dan susunan kolom asli pada baris 3.",
    );
  const fullRange = sheet["!fullref"] ?? sheet["!ref"] ?? "A1:J3";
  const end = XLSX.utils.decode_range(fullRange).e.r;
  // Reject input beyond the bounded window. Legacy templates may contain empty
  // formatted rows and H-column lookup formulas; those are not driver records.
  if (end > 5000)
    invalid(
      "Lembar terlalu panjang. Hapus baris kosong berlebih dan gunakan template baru.",
    );
  const lines: PersonnelImportLine[] = [];
  for (let row = 3; row <= end; row++) {
    const cells = Array.from(
      { length: headers.length },
      (_, col) => sheet[XLSX.utils.encode_cell({ r: row, c: col })],
    );
    const values = cells.map((cell) => String(cell?.v ?? "").trim());
    const inputColumns =
      kind === "driver" ? [1, 2, 3, 4, 5, 6, 8, 9] : [1, 2, 3, 4, 5, 6, 8];
    if (!inputColumns.some((index) => values[index] || cells[index]?.f))
      continue;
    if (lines.length >= PERSONNEL_IMPORT_MAX_ROWS)
      invalid(
        "Maksimal 500 personel per impor. Pisahkan file menjadi beberapa bagian.",
      );
    if (
      inputColumns.some((index) => !!cells[index]?.f || cells[index]?.t === "e")
    )
      invalid(`Baris ${row + 1}: isi data sebagai teks, tanpa rumus.`);
    if (
      (kind === "driver" ? [4, 5, 8] : [4, 5]).some(
        (index) => cells[index]?.t === "n",
      )
    )
      invalid(
        `Baris ${row + 1}: ${kind === "driver" ? "KTP, telepon, dan SIM" : "KTP dan telepon"} harus berformat Teks agar digit awal tidak hilang.`,
      );
    if (!values[6] || values[6].length > 100)
      invalid(
        `Baris ${row + 1}: isi CABANG dengan kode atau nama cabang lokal.`,
      );
    const state = values[kind === "driver" ? 9 : 8].toUpperCase();
    if (state !== "Y" && state !== "N")
      invalid(`Baris ${row + 1}: STATUS wajib Y atau N.`);
    const schema =
      kind === "driver"
        ? driverInput
        : kind === "courier"
          ? courierInput
          : marketingPersonInput;
    const parsed = schema.safeParse({
      name: values[1],
      address: [values[2], values[3]].filter(Boolean).join("\n"),
      nationalIdNumber: values[4],
      phone: values[5],
      ...(kind === "driver" ? { driverLicenseNumber: values[8] } : {}),
      branchId: null,
      status: state === "Y" ? "ACTIVE" : "INACTIVE",
    });
    if (!parsed.success)
      return invalid(
        `Baris ${row + 1}: nama wajib diisi (maks. 100 karakter), alamat maks. 4000, KTP/telepon/SIM maks. 20 karakter.`,
      );
    const { branchId: _branchId, ...data } = parsed.data;
    lines.push({ row: row + 1, ...data, branch: values[6] });
  }
  if (!lines.length)
    invalid("File belum berisi data personel pada kolom input mulai baris 4.");
  return lines;
}

export function buildPersonnelTemplate(
  kind: PersonnelImportKind,
  branches: { code: string; name: string }[],
) {
  const definition = personnelImportDefinitions[kind];
  const headers = definition.headers;
  const book = XLSX.utils.book_new();
  const data: (string | number)[][] = [
    [`Template Import ${definition.label}`],
    [],
    [...headers],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  // Text formats protect leading zeroes and long identifiers in Excel.
  for (let row = 3; row < PERSONNEL_IMPORT_MAX_ROWS + 3; row++)
    for (let col = 0; col < headers.length; col++) {
      const key = XLSX.utils.encode_cell({ r: row, c: col });
      sheet[key] = { t: "s", v: "", z: "@" };
    }
  sheet["!ref"] =
    `A1:${kind === "driver" ? "J" : "I"}${PERSONNEL_IMPORT_MAX_ROWS + 3}`;
  sheet["!cols"] = [
    { wch: 8 },
    { wch: 24 },
    { wch: 35 },
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
    { wch: 25 },
    { wch: 26 },
    { wch: 22 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(book, sheet, "Worksheet");
  const guide = XLSX.utils.aoa_to_sheet([
    [`Petunjuk Import ${definition.label}`],
    [
      "Isi Worksheet mulai baris 4, maksimal 500 personel. Jangan mengubah judul kolom.",
    ],
    [
      "Kolom ID boleh kosong; ID database dibuat otomatis. Kolom H tidak dipakai untuk relasi.",
    ],
    [
      "CABANG: isi kode atau nama cabang lokal. Status wajib Y (aktif) atau N (tidak aktif).",
    ],
    [
      `${kind === "driver" ? "KTP, telepon, dan SIM" : "KTP dan telepon"} wajib berformat Teks. Jangan memakai rumus pada kolom input.`,
    ],
    ["Alamat dan Alamat 2 disimpan menjadi satu alamat dengan pemisah baris."],
    [
      "Impor hanya menambah personel baru; baris identik ditolak dan data lama tidak ditimpa.",
    ],
    ["Contoh sintetis — jangan ikut diimpor:"],
    [
      "",
      `${definition.label} Contoh`,
      "Jalan Contoh",
      "",
      "KTP-CONTOH",
      "080000000000",
      branches[0]?.code ?? "KODE-CABANG-LOKAL",
      "",
      ...(kind === "driver" ? ["SIM-CONTOH"] : []),
      "Y",
    ],
    [],
    ["Referensi cabang aktif yang dapat Anda gunakan (maksimal 1000):"],
    ["Kode", "Nama"],
    ...branches.map((branch) => [branch.code, branch.name]),
  ]);
  guide["!cols"] = [{ wch: 105 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(book, guide, "Keterangan");
  book.Props = {
    Title: `Template Import ${definition.label} LMS`,
    Author: "LMS",
  };
  return XLSX.write(book, { type: "buffer", bookType: "biff8" }) as Buffer;
}
