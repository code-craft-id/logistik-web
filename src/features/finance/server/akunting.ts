import "server-only";
import type { z } from "zod";
import type { AccessActor } from "@/features/identity/permissions";
import { IdentityError } from "@/features/identity/server/access";
import { Prisma } from "@/lib/db/generated/client";
import {
  type akuntingCommands,
  CASH_VOUCHERS,
  type CashVoucher,
} from "../accounting-contracts";
import { asDate, sum } from "../contracts";
import { account, activeBranch, journal, scoped } from "./accounting";

/**
 * Akunting screens that follow the sandbox (OBSERVED newapps 2026-11-24):
 * Kasir Penerimaan / Pembayaran Lainnya, Kasir Pembayaran Vendor, Bukti
 * Jurnal Umum (draft vouchers posted from Kasir / List Posting), Rekonsiliasi
 * Bank, Cost Centre, Kategori Assets and Assets.
 */
type Tx = Prisma.TransactionClient;
type AkuntingCommand = z.infer<(typeof akuntingCommands)[number]>;
const fail = (message: string): never => {
  throw new IdentityError("CONFLICT", 409, message);
};
const ACTIONS = new Set<string>([
  "journal.cash",
  "journal.discard",
  "journal.bank_statement",
  "finance_account.cost_centre",
  "finance_account.asset_category",
  "finance_account.asset",
  "finance_account.asset_remove",
]);
export function isAkuntingCommand(d: { action: string }): d is AkuntingCommand {
  return ACTIONS.has(d.action);
}

/** Lines of a voucher may use cash accounts but never control accounts. */
export async function nonControlAccounts(tx: Tx, ids: number[]) {
  const controlled = await tx.finMapping.findFirst({
    where: {
      OR: [
        { receivableId: { in: ids } },
        { revenueId: { in: ids } },
        { costId: { in: ids } },
        { liabilityId: { in: ids } },
      ],
    },
  });
  if (controlled)
    fail(
      "Akun piutang/pendapatan/biaya/hutang kontrol hanya lewat dokumen sumber (invoice, pembayaran, biaya).",
    );
  for (const id of ids) await account(tx, id);
}

/** Nomor Bukti: PREFIX/YYMM/0001, per voucher type and month. */
async function nextReference(tx: Tx, voucher: CashVoucher, date: string) {
  const prefix = `${CASH_VOUCHERS[voucher].prefix}/${date.slice(2, 4)}${date.slice(5, 7)}/`;
  const rows = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT max(CASE WHEN substring(reference FROM ${prefix.length + 1}::int) ~ '^[0-9]{1,9}$'
                    THEN substring(reference FROM ${prefix.length + 1}::int)::int END) AS max
    FROM fin_journals WHERE reference LIKE ${`${prefix}%`}`;
  return `${prefix}${String((rows[0]?.max ?? 0) + 1).padStart(4, "0")}`;
}

async function costCentre(tx: Tx, id: number | undefined, branchId: number) {
  if (!id) return null;
  const row = await tx.finCostCentre.findFirst({
    where: { id, active: true, deletedAt: null },
  });
  if (!row) fail("Cost Centre tidak aktif.");
  if (row?.branchId !== branchId)
    fail("Cost Centre harus milik cabang jurnal.");
  return id;
}

export async function akuntingWrite(
  tx: Tx,
  current: AccessActor,
  d: AkuntingCommand,
): Promise<{ id: number; branchId: number | null }> {
  switch (d.action) {
    case "journal.cash": {
      await activeBranch(tx, current, d.branchId);
      const cash = await account(tx, d.cashAccountId, "ASSET", true);
      await nonControlAccounts(
        tx,
        d.lines.map((l) => l.accountId),
      );
      if (d.lines.some((l) => l.accountId === cash.id))
        fail("Akun baris tidak boleh sama dengan akun Kas/Bank.");
      if (d.voucher === "VENDOR_PAYMENT") {
        if (!d.vendorId) fail("Vendor wajib diisi.");
        if (
          !(await tx.vendor.findFirst({
            where: { id: d.vendorId, deletedAt: null },
            select: { id: true },
          }))
        )
          fail("Vendor tidak tersedia.");
      }
      if (
        d.customerId &&
        !(await tx.customer.findFirst({
          where: { id: d.customerId, deletedAt: null },
          select: { id: true },
        }))
      )
        fail("Customer tidak tersedia.");
      const debit = sum(
        d.lines.filter((l) => l.side === "DEBIT").map((l) => l.amount),
      );
      const credit = sum(
        d.lines.filter((l) => l.side === "CREDIT").map((l) => l.amount),
      );
      // Penerimaan: Kas/Bank is debited with the balance of the lines;
      // pembayaran and Bukti Jurnal Umum credit Kas/Bank (K).
      const receipt = d.voucher === "CASH_IN";
      const net = receipt ? credit.minus(debit) : debit.minus(credit);
      if (!net.gt(0))
        fail(
          receipt
            ? "Total kredit baris harus lebih besar dari debit (uang masuk)."
            : "Total debit baris harus lebih besar dari kredit (uang keluar).",
        );
      const reference =
        d.reference ?? (await nextReference(tx, d.voucher, d.accountingDate));
      const row = await journal(
        tx,
        {
          branchId: d.branchId,
          accountingDate: d.accountingDate,
          reference,
          reason: d.reason,
          sourceType: d.voucher,
          costCentreId: await costCentre(tx, d.costCentreId, d.branchId),
          customerId: d.customerId ?? null,
          vendorId: d.vendorId ?? null,
          lines: [
            {
              accountId: cash.id,
              [receipt ? "debit" : "credit"]: net.toFixed(2),
              memo: d.reason,
            },
            ...d.lines.map((l) => ({
              accountId: l.accountId,
              [l.side === "DEBIT" ? "debit" : "credit"]: l.amount,
              memo: l.memo ?? null,
            })),
          ],
        },
        false,
      );
      return { id: row.id, branchId: row.branchId };
    }
    case "journal.discard": {
      const row = await tx.finJournal.findUnique({ where: { id: d.id } });
      if (!row) throw new IdentityError("NOT_FOUND", 404);
      scoped(current, row.branchId);
      if (
        row.status !== "DRAFT" ||
        !(row.sourceType === "MANUAL" || row.sourceType in CASH_VOUCHERS)
      )
        fail("Hanya draft manual atau kasir yang bisa dihapus.");
      await tx.finLine.deleteMany({ where: { journalId: row.id } });
      await tx.finJournal.delete({ where: { id: row.id } });
      return { id: row.id, branchId: row.branchId };
    }
    case "journal.bank_statement": {
      await activeBranch(tx, current, d.branchId);
      await account(tx, d.accountId, "ASSET", true);
      const row = await tx.finBankStatement.upsert({
        where: {
          accountId_branchId_statementDate: {
            accountId: d.accountId,
            branchId: d.branchId,
            statementDate: asDate(d.statementDate),
          },
        },
        create: {
          accountId: d.accountId,
          branchId: d.branchId,
          statementDate: asDate(d.statementDate),
          bankBalance: d.bankBalance,
          note: d.note ?? null,
        },
        update: {
          bankBalance: d.bankBalance,
          note: d.note ?? null,
          deletedAt: null,
        },
      });
      return { id: row.id, branchId: d.branchId };
    }
    case "finance_account.cost_centre": {
      await activeBranch(tx, current, d.branchId);
      const data = {
        code: d.code,
        name: d.name,
        branchId: d.branchId,
        active: d.active,
      };
      const row = d.id
        ? await tx.finCostCentre.update({ where: { id: d.id }, data })
        : await tx.finCostCentre.create({ data });
      return { id: row.id, branchId: d.branchId };
    }
    case "finance_account.asset_category": {
      if (d.accountId === d.counterAccountId)
        fail("COA dan COA Lawan harus berbeda.");
      await account(tx, d.accountId, "ASSET");
      await account(tx, d.counterAccountId);
      const data = {
        name: d.name,
        accountId: d.accountId,
        counterAccountId: d.counterAccountId,
        active: d.active,
      };
      const row = d.id
        ? await tx.finAssetCategory.update({ where: { id: d.id }, data })
        : await tx.finAssetCategory.create({ data });
      return { id: row.id, branchId: null };
    }
    case "finance_account.asset": {
      if (d.branchId) await activeBranch(tx, current, d.branchId);
      if (
        !(await tx.finAssetCategory.findFirst({
          where: { id: d.categoryId, active: true, deletedAt: null },
        }))
      )
        fail("Kategori aset tidak aktif.");
      if (new Prisma.Decimal(d.cost).plus(d.additions).lt(d.reductions))
        fail("Pengurangan melebihi harga perolehan dan penambahan.");
      const data = {
        name: d.name,
        categoryId: d.categoryId,
        branchId: d.branchId ?? null,
        units: d.units,
        acquiredOn: asDate(d.acquiredOn),
        cost: d.cost,
        groupLabel: d.groupLabel ?? null,
        additions: d.additions,
        reductions: d.reductions,
        lifeMonths: d.lifeMonths,
        note: d.note ?? null,
      };
      if (d.id) {
        const old = await tx.finAsset.findFirst({
          where: { id: d.id, deletedAt: null },
        });
        if (!old) throw new IdentityError("NOT_FOUND", 404);
        if (old.branchId) scoped(current, old.branchId);
      }
      const row = d.id
        ? await tx.finAsset.update({ where: { id: d.id }, data })
        : await tx.finAsset.create({ data });
      return { id: row.id, branchId: row.branchId };
    }
    case "finance_account.asset_remove": {
      const old = await tx.finAsset.findFirst({
        where: { id: d.id, deletedAt: null },
      });
      if (!old) throw new IdentityError("NOT_FOUND", 404);
      if (old.branchId) scoped(current, old.branchId);
      await tx.finAsset.update({
        where: { id: d.id },
        data: { deletedAt: new Date() },
      });
      return { id: d.id, branchId: old.branchId };
    }
  }
}
