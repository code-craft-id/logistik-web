import "server-only";

import * as XLSX from "xlsx";
import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import {
  businessDateString,
  jakartaMonthStartUtc,
} from "@/lib/date/business-date";
import { prisma } from "@/lib/db";

/**
 * Laporan Keuntungan / Daftar Rekap Laporan Laba (sandbox profit-report,
 * OBSERVED 2026-11-24): Bulan, Tahun, Penjual (vendor); one row per vendor
 * bill (Pembayaran Hutang) with Penjual, No. Faktur, Tanggal, Status,
 * Biaya, Biaya Vendor, Laba. Owner decision 2026-11-24 (D-42): Biaya = sum
 * of the AWB Grand Totals on the bill, Biaya Vendor = bill amount, Laba =
 * Biaya - Biaya Vendor. Not a ledger P&L.
 */
const input = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  vendorId: z
    .union([
      z.literal(""),
      z.literal("semua"),
      z.coerce.number().int().positive(),
    ])
    .optional()
    .transform((v) => (typeof v === "number" ? v : null)),
});

export type ProfitRow = {
  id: number;
  vendor: string;
  invoiceNo: string;
  billDate: Date;
  status: string;
  revenue: number;
  vendorCost: number;
  profit: number;
};

export async function profitReport(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "view", "debt_payment");
  const parsed = input.safeParse(raw);
  if (!parsed.success) throw new IdentityError("VALIDATION", 400);
  const { month, year, vendorId } = parsed.data;
  const bills = await prisma.vendorBill.findMany({
    where: {
      deletedAt: null,
      billDate: {
        gte: jakartaMonthStartUtc(year, month),
        lt: jakartaMonthStartUtc(year, month + 1),
      },
      ...(vendorId ? { vendorId } : {}),
      ...(isAdministrator(actor) ? {} : { branchId: { in: actor.branchIds } }),
    },
    select: {
      id: true,
      invoiceNo: true,
      billDate: true,
      status: true,
      amount: true,
      vendor: { select: { name: true } },
      items: {
        where: { deletedAt: null },
        select: { transaction: { select: { biaya: true } } },
      },
    },
    orderBy: [{ billDate: "asc" }, { id: "asc" }],
    take: 5000,
  });
  const rows: ProfitRow[] = bills.map((b) => {
    const revenue = b.items.reduce(
      (t, i) => t + Number(i.transaction.biaya ?? 0),
      0,
    );
    const vendorCost = Number(b.amount);
    return {
      id: b.id,
      vendor: b.vendor.name,
      invoiceNo: b.invoiceNo,
      billDate: b.billDate,
      status: b.status,
      revenue,
      vendorCost,
      profit: revenue - vendorCost,
    };
  });
  const total = rows.reduce(
    (t, r) => ({
      revenue: t.revenue + r.revenue,
      vendorCost: t.vendorCost + r.vendorCost,
      profit: t.profit + r.profit,
    }),
    { revenue: 0, vendorCost: 0, profit: 0 },
  );
  return { month, year, vendorId, rows, total };
}

export function profitWorkbook(
  report: Awaited<ReturnType<typeof profitReport>>,
) {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Daftar Rekap Laporan Laba"],
    [`Bulan : ${report.month}/${report.year}`],
    [],
    [
      "Penjual",
      "No. Faktur",
      "Tanggal",
      "Status",
      "Biaya",
      "Biaya Vendor",
      "Laba",
    ],
    ...report.rows.map((r) => [
      r.vendor,
      r.invoiceNo,
      businessDateString(r.billDate),
      r.status,
      r.revenue,
      r.vendorCost,
      r.profit,
    ]),
    [
      "TOTAL",
      "",
      "",
      "",
      report.total.revenue,
      report.total.vendorCost,
      report.total.profit,
    ],
  ]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Laporan Laba");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
