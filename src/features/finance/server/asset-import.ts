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
 * Assets Template Import and Import Data (K3). Adds new assets only, through
 * the same validation as the form; one bad row saves nothing.
 */
export const ASSET_COLUMNS = [
  "Jenis Aktiva",
  "Kategori",
  "Kode Cabang",
  "Unit",
  "Tgl Perolehan",
  "Hrg Perolehan",
  "Kel",
  "Penambahan",
  "Pengurangan",
  "Masa (Bulan)",
  "Keterangan",
] as const;
const MAX_ROWS = 500;

export function assetTemplate() {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([[...ASSET_COLUMNS]]),
    "Assets",
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["Kategori diisi nama Kategori Assets yang aktif."],
      ["Kode Cabang kosong = Nasional."],
      ["Tgl Perolehan format YYYY-MM-DD (ketik sebagai teks)."],
      ["Angka tanpa titik ribuan, contoh 15000000."],
      ["Import hanya menambah aset baru."],
    ]),
    "Petunjuk",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const text = (v: unknown) =>
  v === undefined || v === null ? "" : String(v).trim();
const invalid = (message: string): never => {
  throw new IdentityError("INVALID_IMPORT", 400, message);
};

export function parseAssetRows(bytes: Uint8Array) {
  let rows: unknown[][] = [];
  try {
    const book = XLSX.read(bytes, { type: "array" });
    rows = XLSX.utils.sheet_to_json<unknown[]>(
      book.Sheets[book.SheetNames[0]],
      { header: 1, blankrows: false },
    );
  } catch {
    invalid("File Excel tidak terbaca.");
  }
  if (!ASSET_COLUMNS.every((c, i) => text(rows[0]?.[i]) === c))
    invalid("Judul kolom tidak cocok. Gunakan Template Import.");
  const data = rows.slice(1).filter((r) => r.some((c) => text(c)));
  if (!data.length) invalid("File tidak berisi data.");
  if (data.length > MAX_ROWS) invalid(`Maksimal ${MAX_ROWS} baris per file.`);
  return data;
}

export async function importAssets(actor: AccessActor, bytes: Uint8Array) {
  assertPermission(actor, "manage", "finance_account");
  const data = parseAssetRows(bytes);
  return prisma.$transaction(
    async (tx) => {
      // Same global finance write locks as the asset form (FIN-02).
      await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock_shared(71642, 1)`;
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(71643, 1)`;
      const current = await loadAccessActor(tx, actor.id);
      assertPermission(current, "manage", "finance_account");
      const [categories, branches] = await Promise.all([
        tx.finAssetCategory.findMany({
          where: { active: true, deletedAt: null },
          select: { id: true, name: true },
        }),
        tx.branch.findMany({
          where: { deletedAt: null },
          select: { id: true, code: true },
        }),
      ]);
      const category = new Map(
        categories.map((c) => [c.name.toUpperCase(), c.id]),
      );
      const branch = new Map(branches.map((b) => [b.code.toUpperCase(), b.id]));
      for (const [index, r] of data.entries()) {
        const bad = (message: string) =>
          invalid(`Baris ${index + 2}: ${message}`);
        const categoryId = category.get(text(r[1]).toUpperCase());
        if (!categoryId) bad(`Kategori "${text(r[1])}" tidak ditemukan.`);
        const code = text(r[2]).toUpperCase();
        const branchId = code ? branch.get(code) : undefined;
        if (code && !branchId) bad(`Kode Cabang "${code}" tidak ditemukan.`);
        try {
          await accountingWrite(tx, current, {
            key: randomUUID(),
            action: "finance_account.asset",
            name: text(r[0]),
            categoryId,
            branchId,
            units: text(r[3]) || 1,
            acquiredOn: text(r[4]),
            cost: text(r[5]),
            groupLabel: text(r[6]) || undefined,
            additions: text(r[7]) || "0",
            reductions: text(r[8]) || "0",
            lifeMonths: text(r[9]),
            note: text(r[10]) || undefined,
          });
        } catch (error) {
          if (error instanceof IdentityError) bad(error.message);
          bad("Isi tidak valid (periksa nama, tanggal, angka dan masa bulan).");
        }
      }
      return { created: data.length };
    },
    { timeout: 60_000 },
  );
}
