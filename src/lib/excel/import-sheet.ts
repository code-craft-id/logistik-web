import "server-only";

import * as XLSX from "xlsx";
import { IdentityError } from "@/features/identity/server/access";

/** Sample data (prisma/seed-data.mjs) uses ids from here up; not "last". */
export const SAMPLE_ID_FLOOR = 9_000_000;
export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 1000;

export const invalid = (message: string): never => {
  throw new IdentityError("INVALID_IMPORT", 400, message);
};
export const cell = (v: unknown) => {
  const t = v === undefined || v === null ? "" : String(v).trim();
  return t.startsWith("#N/A") ? "" : t;
};

/**
 * Data rows of the first sheet below the header row that starts with
 * `columns`. `used` are the columns that make a row a data row, so notes to
 * the side of the table are ignored.
 */
export function readRows(
  bytes: Uint8Array,
  columns: readonly string[],
  used: number[] = [0, 1],
) {
  let rows: unknown[][] = [];
  try {
    const book = XLSX.read(bytes, { type: "array", cellDates: true });
    rows = XLSX.utils.sheet_to_json<unknown[]>(
      book.Sheets[book.SheetNames[0]],
      { header: 1 },
    );
  } catch {
    invalid("File Excel tidak terbaca.");
  }
  const headerAt = rows
    .slice(0, 10)
    .findIndex((r) => columns.every((c, i) => cell(r?.[i]) === c));
  if (headerAt < 0)
    invalid("Judul kolom tidak cocok. Gunakan Template Import.");
  const data = rows.slice(headerAt + 1).flatMap((r, index) => {
    if (!r || !used.some((i) => cell(r[i]))) return [];
    const line = headerAt + index + 2;
    const bad = (message: string) => invalid(`Baris ${line}: ${message}`);
    const text = (i: number, max = 500) => {
      const t = cell(r[i]);
      if (t.length > max) bad(`${columns[i]} maksimal ${max} karakter.`);
      return t;
    };
    const whole = (i: number) => {
      const t = cell(r[i]);
      if (!t) return undefined;
      if (!/^[1-9]\d{0,8}$/.test(t)) bad(`${columns[i]} harus angka bulat.`);
      return Number(t);
    };
    const decimal = (i: number) => {
      const t = cell(r[i]);
      if (!t) return undefined;
      if (!/^\d{1,12}(\.\d{1,2})?$/.test(t)) bad(`${columns[i]} harus angka.`);
      return t;
    };
    const required = <T>(value: T | undefined | "", i: number): T =>
      value === undefined || value === ""
        ? bad(`${columns[i]} wajib diisi.`)
        : value;
    return [{ line, raw: r, bad, text, whole, decimal, required }];
  });
  if (!data.length) invalid("File tidak berisi data.");
  if (data.length > MAX_ROWS) invalid(`Maksimal ${MAX_ROWS} baris per file.`);
  return data;
}

/** Template or export workbook: the data sheet plus a code list sheet. */
export function workbook(
  rows: unknown[][],
  lists: [string, { id: number; name: string }[]][] = [],
) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = Array.from({ length: 24 }, () => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(book, sheet, "Data");
  if (lists.length)
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([
        ["Daftar", "Nama", "Code"],
        ...lists.flatMap(([title, list]) =>
          list.map((x) => [title, x.name, x.id]),
        ),
      ]),
      "Keterangan",
    );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/** Keeps only filled cells, so an update never wipes a stored value. */
export const filled = <T extends Record<string, unknown>>(values: T) =>
  Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== undefined && v !== ""),
  ) as { [K in keyof T]?: Exclude<T[K], "" | undefined> };

/** Every referenced id must be one of the ids found. */
export const idSet = (list: { id: number }[]) => new Set(list.map((x) => x.id));
