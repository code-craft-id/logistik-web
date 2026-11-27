import "server-only";

import * as XLSX from "xlsx";
import type { AccessActor } from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { ModulError, transactionScope } from "@/features/modul/server/common";
import { writeProof } from "@/features/modul/server/proof";
import { businessDateString } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

/**
 * Import status from Excel, provider template (OBSERVED 2026-11-19):
 * AWB No. | Date | Received | Status | Remarks, Status being the provider
 * M.Shipment Status code. Supported codes: 2 = ACCEPTED / DITERIMA and
 * 1 = BACK TO OFFICE / RETUR, applied like Scan & Konfirmasi. Other active
 * M.Shipment Status codes (003-012 in the provider) are journey notes: they
 * add a tracking entry and never change the AWB status (owner 2026-11-27).
 * Valid rows are applied; invalid rows are skipped and reported.
 */
export const IMPORT_HEADERS = [
  "AWB No.",
  "Date",
  "Received",
  "Status",
  "Remarks",
];
export const STATUS_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 1000;
const CODES: Record<
  string,
  { outcome: "DELIVERED" | "RETURNED"; label: string }
> = {
  "2": { outcome: "DELIVERED", label: "ACCEPTED / DITERIMA" },
  "1": { outcome: "RETURNED", label: "BACK TO OFFICE / RETUR" },
};

export type ImportRow = {
  line: number;
  awbNo: string;
  date: string | null;
  received: string;
  status: string;
  remarks: string;
  transactionId: number | null;
  /** Why the row cannot be applied, or null when it can. */
  error: string | null;
};

function cellDate(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime()))
    return businessDateString(v);
  const s = String(v ?? "").trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  const [y, m, d] = iso
    ? [iso[1], iso[2], iso[3]]
    : dmy
      ? [dmy[3], dmy[2], dmy[1]]
      : [];
  if (!y) return null;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return date.getUTCDate() === Number(d)
    ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    : null;
}

/** Spreadsheet bytes → template rows (no database access). */
export function parseStatusFile(bytes: Uint8Array, name: string) {
  if (bytes.length === 0) throw new ModulError("File kosong.");
  if (bytes.length > STATUS_IMPORT_MAX_BYTES)
    throw new ModulError("File maksimal 2 MB.");
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const ole = bytes[0] === 0xd0 && bytes[1] === 0xcf;
  const csv = /\.csv$/i.test(name);
  if (!zip && !ole && !csv)
    throw new ModulError(
      "Gunakan file Excel (.xlsx / .xls) atau .csv dari template.",
    );
  let book: XLSX.WorkBook;
  try {
    book = XLSX.read(bytes, { type: "array", cellDates: true, dense: true });
  } catch {
    throw new ModulError("File tidak bisa dibaca sebagai spreadsheet.");
  }
  // Smart read: any sheet, header within the first 20 rows, so the
  // Petunjuk sheet and note lines above the header can stay in the file.
  const want = IMPORT_HEADERS.map((h) => h.toLowerCase());
  let rows: unknown[][] = [];
  let at = -1;
  for (const name of book.SheetNames) {
    const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[name], {
      header: 1,
      defval: "",
      raw: true,
    });
    at = sheetRows.slice(0, 20).findIndex((r) =>
      want.every(
        (h, i) =>
          String(r[i] ?? "")
            .trim()
            .toLowerCase() === h,
      ),
    );
    if (at >= 0) {
      rows = sheetRows;
      break;
    }
  }
  if (at < 0)
    throw new ModulError(
      `Kolom harus persis: ${IMPORT_HEADERS.join(" | ")} (unduh Template Import).`,
    );
  const body = rows
    .map((r, i) => ({ r, line: i + 1 }))
    .slice(at + 1)
    .filter(({ r }) => r.some((v) => String(v).trim() !== ""));
  if (body.length > MAX_ROWS)
    throw new ModulError(`Maksimal ${MAX_ROWS} baris per file.`);
  return body.map(({ r, line }) => ({
    line,
    awbNo: String(r[0] ?? "")
      .trim()
      .slice(0, 60),
    date: cellDate(r[1]),
    rawDate: String(r[1] ?? "").trim(),
    received: String(r[2] ?? "")
      .trim()
      .slice(0, 150),
    status: String(r[3] ?? "")
      .trim()
      .replace(/^0+(?=\d)/, ""),
    remarks: String(r[4] ?? "")
      .trim()
      .slice(0, 500),
  }));
}

// Excel turns "003" into 3: compare codes without leading zeros.
const codeKey = (code: string) => code.trim().replace(/^0+(?=\d)/, "");

async function journeyStatuses() {
  const rows = await prisma.shipmentStatus.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { code: true, name: true },
  });
  return new Map(
    rows
      .filter((r) => !CODES[codeKey(r.code)])
      .map((r) => [codeKey(r.code), r]),
  );
}

/** Tracking entry for a journey code; the AWB status stays as it is. */
async function addJourneyNote(actor: AccessActor, row: ImportRow) {
  await prisma.$transaction(async (tx) => {
    const awb = await tx.transaction.findFirst({
      where: {
        id: row.transactionId as number,
        deletedAt: null,
        AND: [transactionScope(actor)],
      },
      select: { status: true },
    });
    if (!awb || awb.status === "Cancelled")
      throw new ModulError("AWB tidak tersedia atau sudah dibatalkan.");
    await tx.transactionStatusHistory.create({
      data: {
        transactionId: row.transactionId as number,
        priorStatus: awb.status,
        newStatus: awb.status,
        reason: row.remarks ? `${row.status}: ${row.remarks}` : row.status,
        actorId: actor.id,
        // Noon Asia/Jakarta on the given day.
        changedAt: new Date(`${row.date}T05:00:00Z`),
      },
    });
  });
}

/** Validate parsed rows against the actor's AWBs (read-only). */
export async function checkStatusRows(
  actor: AccessActor,
  parsed: ReturnType<typeof parseStatusFile>,
): Promise<ImportRow[]> {
  assertPermission(actor, "update", "transaction");
  const numbers = [...new Set(parsed.map((p) => p.awbNo).filter(Boolean))];
  const found = numbers.length
    ? await prisma.transaction.findMany({
        where: {
          deletedAt: null,
          AND: [
            transactionScope(actor),
            {
              OR: numbers.map((n) => ({
                awbNo: { equals: n, mode: "insensitive" as const },
              })),
            },
          ],
        },
        select: { id: true, awbNo: true, status: true },
      })
    : [];
  const byNo = new Map<string, typeof found>();
  for (const t of found) {
    const key = (t.awbNo ?? "").toUpperCase();
    byNo.set(key, [...(byNo.get(key) ?? []), t]);
  }
  const journey = await journeyStatuses();
  const today = businessDateString();
  const seen = new Set<string>();
  return parsed.map((p) => {
    const matches = byNo.get(p.awbNo.toUpperCase()) ?? [];
    const code = CODES[p.status];
    const note = code ? undefined : journey.get(codeKey(p.status));
    const key = p.awbNo.toUpperCase();
    const error = !p.awbNo
      ? "AWB No. kosong."
      : seen.has(key)
        ? "AWB ini sudah ada di baris sebelumnya."
        : !matches.length
          ? "AWB tidak ditemukan atau bukan dari/ke cabang Anda."
          : matches.length > 1
            ? "Nomor AWB dipakai lebih dari satu cabang; ubah lewat detail AWB."
            : !p.date
              ? `Date tidak valid (${p.rawDate || "kosong"}); pakai YYYY-MM-DD.`
              : p.date > today
                ? "Date tidak boleh di masa depan."
                : !code && !note
                  ? `Status ${p.status || "(kosong)"} belum didukung; pakai kode di M.Shipment Status.`
                  : code?.outcome === "DELIVERED" && !p.received
                    ? "Received (nama penerima) wajib untuk status 2."
                    : code && matches[0].status === "Delivered"
                      ? "AWB sudah DITERIMA."
                      : matches[0].status === "Returned" &&
                          code?.outcome === "RETURNED"
                        ? "AWB sudah RETUR."
                        : matches[0].status === "Cancelled"
                          ? "AWB sudah dibatalkan."
                          : null;
    seen.add(key);
    return {
      line: p.line,
      awbNo: p.awbNo,
      date: p.date,
      received: p.received,
      status: code
        ? `${p.status} · ${code.label}`
        : note
          ? `${note.code} · ${note.name}`
          : p.status,
      remarks: p.remarks,
      transactionId: matches.length === 1 ? matches[0].id : null,
      error,
    };
  });
}

/** Apply the valid rows one by one; each row is its own transaction. */
export async function applyStatusRows(
  actor: AccessActor,
  parsed: ReturnType<typeof parseStatusFile>,
) {
  const rows = await checkStatusRows(actor, parsed);
  const results: (ImportRow & { applied: boolean })[] = [];
  for (const row of rows) {
    if (row.error || !row.transactionId || !row.date) {
      results.push({ ...row, applied: false });
      continue;
    }
    const code = CODES[row.status.split(" ")[0]];
    try {
      if (!code) {
        await addJourneyNote(actor, row);
        results.push({ ...row, applied: true });
        continue;
      }
      await prisma.$transaction((tx) =>
        writeProof(
          tx,
          actor,
          {
            transactionId: row.transactionId as number,
            outcome: code.outcome,
            receiverName: row.received || undefined,
            notes: row.remarks || undefined,
          },
          { photos: [] },
          {
            reason: "Import Status Excel",
            // Noon Asia/Jakarta on the given day.
            receivedAt: new Date(`${row.date}T05:00:00Z`),
          },
        ),
      );
      results.push({ ...row, applied: true });
    } catch (error) {
      results.push({
        ...row,
        applied: false,
        error:
          error instanceof ModulError
            ? error.message
            : "Gagal disimpan; coba lagi.",
      });
    }
  }
  return results;
}

/** Template workbook with the provider's columns and one sample row. */
export function statusTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([
    IMPORT_HEADERS,
    [
      "JKT261100001",
      "2026-11-19",
      "Nama Penerima",
      2,
      "Sudah diterima dengan baik",
    ],
  ]);
  sheet["!cols"] = [18, 12, 22, 8, 32].map((wch) => ({ wch }));
  const guide = XLSX.utils.aoa_to_sheet([
    ["Kolom", "Cara mengisi"],
    ["AWB No.", "Nomor AWB yang sudah ada di sistem (cabang Anda)."],
    [
      "Date",
      "Tanggal diterima, format YYYY-MM-DD (contoh 2026-11-19); tidak boleh tanggal masa depan.",
    ],
    ["Received", "Nama penerima. Wajib bila Status = 2."],
    [
      "Status",
      "Isi angka: 2 = ACCEPTED / DITERIMA (AWB menjadi Delivered), 1 = BACK TO OFFICE / RETUR (AWB menjadi Returned). Kode lain di M.Shipment Status (mis. 003-012) hanya menambah catatan tracking.",
    ],
    ["Remarks", "Catatan, boleh kosong."],
    [],
    [
      "Baris contoh di sheet Import Status boleh diganti. Sheet Petunjuk ini tidak perlu dihapus.",
    ],
  ]);
  guide["!cols"] = [{ wch: 12 }, { wch: 70 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Import Status");
  XLSX.utils.book_append_sheet(book, guide, "Petunjuk");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
