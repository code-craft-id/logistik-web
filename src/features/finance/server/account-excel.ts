import "server-only";

import { randomUUID } from "node:crypto";
import * as XLSX from "xlsx";
import type { AccessActor } from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
  loadAccessActor,
} from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { accountingWrite } from "./accounting";

/**
 * Perkiraan Export Excel, Template Import and Import Data (sandbox buttons,
 * OBSERVED 2026-11-26). Columns follow the LMS account form. Import upserts
 * by Kode Akun in one transaction through the same validation as the form
 * (Induk loops, Kategori Rugi Laba only on revenue / expense, Kas only on
 * assets); one bad row saves nothing.
 */
export const ACCOUNT_COLUMNS = [
  "Kode Akun",
  "Nama Akun",
  "Inisial",
  "Jenis",
  "Kode Kategori Akun",
  "Kode Induk",
  "Kode Kategori Rugi Laba",
  "Kode Cabang",
  "Kas/Bank",
  "Tampil",
  "Aktif",
] as const;
export const ACCOUNT_IMPORT_MAX_BYTES = 1024 * 1024;
const MAX_ROWS = 2000;
const yes = (v: boolean) => (v ? "Y" : "N");

function workbook(rows: (string | number)[][]) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([[...ACCOUNT_COLUMNS], ...rows]),
    "Perkiraan",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function accountsWorkbook(actor: AccessActor) {
  assertPermission(actor, "view", "finance_account");
  const accounts = await prisma.finAccount.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: {
      code: true,
      name: true,
      initial: true,
      kind: true,
      isCash: true,
      visible: true,
      active: true,
      category: { select: { code: true } },
      parent: { select: { code: true } },
      plCategory: { select: { code: true } },
      branch: { select: { code: true } },
    },
  });
  return workbook(
    accounts.map((a) => [
      a.code,
      a.name,
      a.initial ?? "",
      a.kind,
      a.category.code,
      a.parent?.code ?? "",
      a.plCategory?.code ?? "",
      a.branch?.code ?? "",
      yes(a.isCash),
      yes(a.visible),
      yes(a.active),
    ]),
  );
}

const GUIDE = [
  ["Kolom", "Wajib", "Cara mengisi"],
  [
    "Kode Akun",
    "Ya",
    "Kode unik, misalnya 1-1100. Kode yang sudah ada akan diperbarui.",
  ],
  ["Nama Akun", "Ya", "Nama perkiraan."],
  ["Inisial", "Tidak", "Singkatan, maksimal 20 karakter."],
  [
    "Jenis",
    "Ya",
    "ASSET (aset), LIABILITY (kewajiban), EQUITY (modal), REVENUE (pendapatan) atau EXPENSE (beban).",
  ],
  ["Kode Kategori Akun", "Ya", "Kode dari Akunting > Master > Kategori Akun."],
  [
    "Kode Induk",
    "Tidak",
    "Kode Akun induk. Induk harus sudah ada atau ditulis di baris sebelumnya.",
  ],
  [
    "Kode Kategori Rugi Laba",
    "Tidak",
    "Hanya untuk REVENUE / EXPENSE. Kode dari Kategori Rugi Laba.",
  ],
  [
    "Kode Cabang",
    "Tidak",
    "Kode cabang bila akun khusus satu cabang; kosong = semua cabang.",
  ],
  [
    "Kas/Bank",
    "Tidak",
    "Y / N (juga boleh 1 / 0, YA / TIDAK). Kosong = N. Hanya untuk ASSET.",
  ],
  ["Tampil", "Tidak", "Y / N (1 / 0). Kosong = Y."],
  ["Aktif", "Tidak", "Y / N (1 / 0). Kosong = Y."],
  [],
  [
    "Isi data di sheet Perkiraan mulai baris di bawah judul kolom. Baris contoh boleh diganti.",
  ],
  [
    "Sheet Petunjuk ini tidak perlu dihapus; import membaca sheet Perkiraan saja.",
  ],
  ["Satu baris salah membatalkan seluruh file; pesan menyebut nomor barisnya."],
];

export function accountTemplate() {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      [...ACCOUNT_COLUMNS],
      [
        "1-1100",
        "Kas Kecil",
        "KK",
        "ASSET",
        "KODE-KATEGORI",
        "1-1000",
        "",
        "",
        "Y",
        "Y",
        "Y",
      ],
    ]),
    "Perkiraan",
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet(GUIDE),
    "Petunjuk",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const text = (v: unknown) =>
  v === undefined || v === null ? "" : String(v).trim();
const flag = (v: unknown, fallback: boolean) => {
  const t = text(v).toUpperCase();
  if (!t) return fallback;
  if (["Y", "YA", "YES", "1", "TRUE"].includes(t)) return true;
  if (["N", "TIDAK", "NO", "0", "FALSE"].includes(t)) return false;
  return null;
};

export async function importAccounts(actor: AccessActor, bytes: Uint8Array) {
  assertPermission(actor, "manage", "finance_account");
  let rows: unknown[][] = [];
  let headerAt = 0;
  try {
    const book = XLSX.read(bytes, { type: "array" });
    // Smart read: any sheet, header row anywhere in the first 20 rows, so a
    // guide sheet or note lines above the header can stay in the file.
    for (const sheetName of book.SheetNames) {
      const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(
        book.Sheets[sheetName],
        { header: 1, blankrows: false },
      );
      const at = sheetRows
        .slice(0, 20)
        .findIndex((r) => ACCOUNT_COLUMNS.every((c, i) => text(r[i]) === c));
      if (at >= 0) {
        rows = sheetRows.slice(at);
        headerAt = at;
        break;
      }
    }
  } catch {
    throw new IdentityError("INVALID_IMPORT", 400, "File Excel tidak terbaca.");
  }
  if (!rows.length)
    throw new IdentityError(
      "INVALID_IMPORT",
      400,
      "Judul kolom tidak ditemukan. Gunakan Template Import.",
    );
  const data = rows.slice(1).filter((r) => r.some((c) => text(c)));
  if (!data.length)
    throw new IdentityError("INVALID_IMPORT", 400, "File tidak berisi data.");
  if (data.length > MAX_ROWS)
    throw new IdentityError(
      "INVALID_IMPORT",
      400,
      `Maksimal ${MAX_ROWS} baris per file.`,
    );

  return prisma.$transaction(
    async (tx) => {
      // Same global finance write locks as the account form (FIN-02).
      await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock_shared(71642, 1)`;
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(71643, 1)`;
      const current = await loadAccessActor(tx, actor.id);
      assertPermission(current, "manage", "finance_account");
      const [categories, plCategories, branches] = await Promise.all([
        tx.finCategory.findMany({
          where: { kind: "ACCOUNT", deletedAt: null },
          select: { id: true, code: true },
        }),
        tx.finPlCategory.findMany({
          where: { deletedAt: null },
          select: { id: true, code: true },
        }),
        tx.branch.findMany({
          where: { deletedAt: null },
          select: { id: true, code: true },
        }),
      ]);
      const byCode = (list: { id: number; code: string }[]) =>
        new Map(list.map((x) => [x.code.toUpperCase(), x.id]));
      const category = byCode(categories);
      const pl = byCode(plCategories);
      const branch = byCode(branches);
      let created = 0;
      let updated = 0;
      for (const [index, r] of data.entries()) {
        const line = headerAt + index + 2;
        const bad = (message: string): never => {
          throw new IdentityError(
            "INVALID_IMPORT",
            400,
            `Baris ${line}: ${message}`,
          );
        };
        const code = text(r[0]);
        if (!code) bad("Kode Akun wajib diisi.");
        const categoryId = category.get(text(r[4]).toUpperCase());
        if (!categoryId)
          bad(`Kode Kategori Akun "${text(r[4])}" tidak ditemukan.`);
        const parentCode = text(r[5]);
        const parentId = parentCode
          ? (
              await tx.finAccount.findFirst({
                where: { code: parentCode, deletedAt: null },
                select: { id: true },
              })
            )?.id
          : undefined;
        if (parentCode && !parentId)
          bad(
            `Kode Induk "${parentCode}" tidak ditemukan (isi induk di baris sebelumnya).`,
          );
        const plCode = text(r[6]).toUpperCase();
        const plCategoryId = plCode ? pl.get(plCode) : undefined;
        if (plCode && !plCategoryId)
          bad(`Kode Kategori Rugi Laba "${text(r[6])}" tidak ditemukan.`);
        const branchCode = text(r[7]).toUpperCase();
        const branchId = branchCode ? branch.get(branchCode) : undefined;
        if (branchCode && !branchId)
          bad(`Kode Cabang "${text(r[7])}" tidak ditemukan.`);
        const isCash = flag(r[8], false);
        const visible = flag(r[9], true);
        const active = flag(r[10], true);
        if (isCash === null || visible === null || active === null)
          bad("Kas/Bank, Tampil dan Aktif diisi Y atau N.");
        const existing = await tx.finAccount.findFirst({
          where: { code },
          select: { id: true, deletedAt: true },
        });
        if (existing?.deletedAt) bad(`Kode Akun "${code}" sudah dihapus.`);
        try {
          await accountingWrite(tx, current, {
            key: randomUUID(),
            action: "finance_account.manage",
            entity: "account",
            id: existing?.id,
            code,
            name: text(r[1]),
            initial: text(r[2]),
            kind: text(r[3]).toUpperCase(),
            categoryId,
            parentId,
            plCategoryId,
            branchId,
            isCash,
            visible,
            active,
          });
        } catch (error) {
          if (error instanceof IdentityError) bad(error.message);
          bad("Isi baris tidak valid (periksa Nama, Jenis dan panjang kolom).");
        }
        if (existing) updated++;
        else created++;
      }
      return { created, updated };
    },
    { timeout: 60_000 },
  );
}
