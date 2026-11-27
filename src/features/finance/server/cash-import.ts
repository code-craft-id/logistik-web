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
import { Prisma } from "@/lib/db/generated/client";
import { accountingWrite } from "./accounting";

/**
 * Kasir Pembayaran Template Import / Import Data, provider columns (template
 * supplied by the owner 2026-11-27). Rows with the same No. Bukti form one
 * draft voucher; exactly one of its accounts is the Kas/Bank account, on K.
 * All vouchers are saved or none.
 */
export const CASH_COLUMNS = [
  "Tanggal",
  "No. Bukti",
  "No. Akun",
  "Nama Akun",
  "Keterangan",
  "Nominal",
  "Posisi",
] as const;
const MAX_ROWS = 500;

/** Second sheet like the provider's: the account numbers to pick from. */
export async function masterAccounts() {
  return prisma.finAccount.findMany({
    where: { active: true, deletedAt: null },
    orderBy: { code: "asc" },
    select: { code: true, name: true },
  });
}

export function cashTemplate(accounts: { code: string; name: string }[] = []) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Import Kasir Pembayaran"],
    [],
    [...CASH_COLUMNS],
    [
      "2026-11-27",
      "BK/CONTOH/0001",
      "52100099",
      "Biaya",
      "Import 1",
      1000,
      "D",
    ],
    ["2026-11-27", "BK/CONTOH/0001", "11020001", "Bank", "Import 1", 1000, "K"],
  ]);
  sheet["!cols"] = [12, 24, 12, 32, 28, 12, 7].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(book, sheet, "Import");
  const master = XLSX.utils.aoa_to_sheet([
    ["No. Akun", "Nama Akun"],
    ...accounts.map((a) => [a.code, a.name]),
  ]);
  master["!cols"] = [{ wch: 14 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(book, master, "Master Akun");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const text = (v: unknown) =>
  v === undefined || v === null ? "" : String(v).trim();
const invalid = (message: string): never => {
  throw new IdentityError("INVALID_IMPORT", 400, message);
};

function dateText(v: unknown) {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    return d
      ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`
      : "";
  }
  return text(v);
}

export type CashImportLine = {
  code: string;
  memo: string;
  amount: Prisma.Decimal;
  side: "D" | "K";
};
export type CashImportVoucher = {
  reference: string;
  date: string;
  lines: CashImportLine[];
};

export function parseCashFile(bytes: Uint8Array): CashImportVoucher[] {
  let rows: unknown[][] = [];
  try {
    const book = XLSX.read(bytes, { type: "array" });
    rows = XLSX.utils.sheet_to_json<unknown[]>(
      book.Sheets[book.SheetNames[0]],
      { header: 1 },
    );
  } catch {
    invalid("File Excel tidak terbaca.");
  }
  const headerAt = rows
    .slice(0, 20)
    .findIndex((r) => CASH_COLUMNS.every((c, i) => text(r?.[i]) === c));
  if (headerAt < 0)
    invalid("Judul kolom tidak ditemukan. Gunakan Template Import.");
  const vouchers = new Map<string, CashImportVoucher>();
  let count = 0;
  for (let i = headerAt + 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const bad = (message: string) => invalid(`Baris ${i + 1}: ${message}`);
    // The provider template ends with formula rows (#N/A) without a voucher.
    const reference = text(r[1]);
    if (!reference && !text(r[5])) continue;
    if (!reference) bad("No. Bukti wajib diisi.");
    if (++count > MAX_ROWS) invalid(`Maksimal ${MAX_ROWS} baris per file.`);
    const date = dateText(r[0]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) bad("Tanggal pakai YYYY-MM-DD.");
    if (!/^\d+(\.\d{1,2})?$/.test(text(r[5])) || Number(r[5]) <= 0)
      bad("Nominal angka lebih dari 0, tanpa titik ribuan.");
    const side = text(r[6]).toUpperCase();
    if (side !== "D" && side !== "K") bad("Posisi diisi D atau K.");
    const voucher = vouchers.get(reference) ?? { reference, date, lines: [] };
    if (voucher.date !== date) bad("Satu No. Bukti harus satu Tanggal.");
    voucher.lines.push({
      code: text(r[2]),
      memo: text(r[4]),
      amount: new Prisma.Decimal(text(r[5])),
      side: side as "D" | "K",
    });
    vouchers.set(reference, voucher);
  }
  if (!vouchers.size) invalid("File tidak berisi data.");
  return [...vouchers.values()];
}

export async function importCashPayments(
  actor: AccessActor,
  branchId: number,
  bytes: Uint8Array,
) {
  assertPermission(actor, "create", "journal");
  const vouchers = parseCashFile(bytes);
  return prisma.$transaction(
    async (tx) => {
      // Same global finance write locks as the cashier form (FIN-02).
      await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock_shared(71642, 1)`;
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(71643, 1)`;
      const current = await loadAccessActor(tx, actor.id);
      assertPermission(current, "create", "journal");
      const accounts = await tx.finAccount.findMany({
        where: {
          code: {
            in: vouchers.flatMap((v) => v.lines.map((l) => l.code)),
          },
          deletedAt: null,
          active: true,
        },
        select: { id: true, code: true, isCash: true },
      });
      const byCode = new Map(accounts.map((a) => [a.code, a]));
      for (const v of vouchers) {
        const bad = (message: string) =>
          invalid(`No. Bukti ${v.reference}: ${message}`);
        const lines = v.lines.map((l) => {
          const account = byCode.get(l.code);
          if (!account) bad(`No. Akun "${l.code}" tidak ditemukan.`);
          return { ...l, account: account as NonNullable<typeof account> };
        });
        const cash = lines.filter((l) => l.account.isCash);
        if (cash.length !== 1 || cash[0].side !== "K")
          bad("Harus tepat satu baris akun Kas/Bank dengan Posisi K.");
        const others = lines.filter((l) => !l.account.isCash);
        const net = others.reduce(
          (total, l) =>
            l.side === "D" ? total.add(l.amount) : total.sub(l.amount),
          new Prisma.Decimal(0),
        );
        if (!others.length || !net.equals(cash[0].amount))
          bad("Total Debet dan Kredit tidak seimbang.");
        if (
          await tx.finJournal.findFirst({
            where: { sourceType: "CASH_OUT", reference: v.reference },
            select: { id: true },
          })
        )
          bad("Nomor Bukti sudah ada.");
        const command = {
          key: randomUUID(),
          action: "journal.cash",
          voucher: "CASH_OUT",
          branchId,
          accountingDate: v.date,
          reference: v.reference,
          reason: cash[0].memo || others[0].memo || "Import Kasir Pembayaran",
          cashAccountId: cash[0].account.id,
          lines: others.map((l) => ({
            accountId: l.account.id,
            side: l.side === "D" ? "DEBIT" : "CREDIT",
            amount: l.amount.toFixed(2),
            memo: l.memo || undefined,
          })),
        };
        try {
          const result = await accountingWrite(tx, current, command);
          // Same audit trail as a voucher entered on screen.
          await tx.finCommand.create({
            data: {
              actorId: current.id,
              key: command.key,
              action: command.action,
              branchId: result.branchId,
              payload: JSON.parse(JSON.stringify(command)),
              result: { id: result.id },
            },
          });
        } catch (error) {
          if (error instanceof IdentityError) bad(error.message);
          bad("Isi tidak valid (periksa tanggal, keterangan dan nominal).");
        }
      }
      return { created: vouchers.length };
    },
    { timeout: 60_000 },
  );
}
