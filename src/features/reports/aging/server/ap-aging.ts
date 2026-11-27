import "server-only";

import * as XLSX from "xlsx";
import { z } from "zod";
import type { AccessActor } from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { vendorBillScope } from "@/features/modul/server/vendor-bills";
import { jakartaMonthStartUtc } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";

/**
 * Rekap Aging Pemasok (Laporan AP; layout from the earlier prototype of
 * the provider's hidden menu): bills still open at month end (Proses Vendor /
 * Pembayaran Hutang) dated in the chosen month, with NAMA PERUSAHAAN, NO
 * KWT/INV, TANGGAL FAKTUR, ATAS (bill category Vendor/Agen/Lainnya), BATAS WAKTU (received or
 * bill date + term), JUMLAH TAGIHAN, buckets 0-30 / 31-60 / 61-90 / > 90
 * days by bill age (as Report AR) and KETERANGAN.
 */
export const apAgingInput = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  vendorId: z.preprocess(
    (v) => (v === "" || v === "0" ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
});

export const AP_HEADERS = [
  "NO.",
  "NAMA PERUSAHAAN",
  "NO KWT/INV",
  "TANGGAL FAKTUR",
  "ATAS",
  "BATAS WAKTU",
  "JUMLAH TAGIHAN",
  "0-30",
  "31-60",
  "61-90",
  "> 90",
  "KETERANGAN",
];

const dmy = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
const startOfDay = (d: Date) =>
  Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

export async function apAgingReport(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "view", "debt_payment");
  const parsed = apAgingInput.safeParse(raw);
  if (!parsed.success) throw new IdentityError("VALIDATION", 400);
  const input = parsed.data;
  const billDateBefore = new Date(Date.UTC(input.year, input.month, 1));
  const cutoff = jakartaMonthStartUtc(input.year, input.month + 1);
  const monthEnd = new Date(billDateBefore.getTime() - 86_400_000);
  const rows = await prisma.vendorBill.findMany({
    where: {
      deletedAt: null,
      createdAt: { lt: cutoff },
      billDate: { lt: billDateBefore },
      OR: [{ status: "OPEN" }, { status: "PAID", closedAt: { gt: cutoff } }],
      ...(input.vendorId ? { vendorId: input.vendorId } : {}),
      ...vendorBillScope(actor),
    },
    orderBy: [{ billDate: "asc" }, { id: "asc" }],
    take: 5001,
    select: {
      invoiceNo: true,
      category: true,
      billDate: true,
      receivedDate: true,
      termDays: true,
      amount: true,
      vendor: { select: { name: true } },
    },
  });
  if (rows.length > 5000)
    throw new IdentityError(
      "EXPORT_LIMIT",
      422,
      "Hasil melebihi 5000 baris. Persempit filter laporan.",
    );
  const reportDay = startOfDay(monthEnd);
  const items = rows.map((r) => {
    const amount = new Prisma.Decimal(r.amount.toString());
    const age = Math.max(
      0,
      Math.round((reportDay - startOfDay(r.billDate)) / 86_400_000),
    );
    const due = new Date(r.receivedDate ?? r.billDate);
    due.setUTCDate(due.getUTCDate() + r.termDays);
    return {
      company: r.vendor.name,
      number: r.invoiceNo,
      billDate: dmy(r.billDate),
      category: r.category,
      dueDate: dmy(due),
      total: amount.toFixed(2),
      ageDays: age,
      b0_30: age <= 30 ? amount.toFixed(2) : "0.00",
      b31_60: age > 30 && age <= 60 ? amount.toFixed(2) : "0.00",
      b61_90: age > 60 && age <= 90 ? amount.toFixed(2) : "0.00",
      b90plus: age > 90 ? amount.toFixed(2) : "0.00",
      note: reportDay > startOfDay(due) ? "Lewat batas waktu" : "",
    };
  });
  const sum = (k: "total" | "b0_30" | "b31_60" | "b61_90" | "b90plus") =>
    items
      .reduce((total, row) => total.plus(row[k]), new Prisma.Decimal(0))
      .toFixed(2);
  const totals = {
    total: sum("total"),
    b0_30: sum("b0_30"),
    b31_60: sum("b31_60"),
    b61_90: sum("b61_90"),
    b90plus: sum("b90plus"),
  };
  const pct = (v: string) => {
    const total = new Prisma.Decimal(totals.total);
    return total.isZero()
      ? null
      : new Prisma.Decimal(v)
          .div(total)
          .times(100)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
          .toNumber();
  };
  const vendor = input.vendorId
    ? await prisma.vendor.findFirst({
        where: { id: input.vendorId },
        select: { name: true },
      })
    : null;
  return {
    input,
    vendor: vendor?.name ?? "Semua Pemasok",
    start: dmy(new Date(Date.UTC(input.year, input.month - 1, 1))),
    end: dmy(monthEnd),
    items,
    totals,
    percent: {
      b0_30: pct(totals.b0_30),
      b31_60: pct(totals.b31_60),
      b61_90: pct(totals.b61_90),
      b90plus: pct(totals.b90plus),
    },
  };
}

export function apAgingWorkbook(
  report: Awaited<ReturnType<typeof apAgingReport>>,
) {
  const pct = (v: number | null) => (v === null ? "NAN%" : `${v}%`);
  const data: (string | number)[][] = [
    ["REKAP AGING PEMASOK, BELUM LUNAS"],
    ["( IDR )"],
    [`Pemasok : ${report.vendor}`],
    [`Tanggal Mulai : ${report.start}`],
    [`Tanggal Akhir : ${report.end}`],
    AP_HEADERS,
    ...report.items.map((r, i) => [
      i + 1,
      r.company,
      r.number,
      r.billDate,
      r.category,
      r.dueDate,
      r.total,
      r.b0_30,
      r.b31_60,
      r.b61_90,
      r.b90plus,
      r.note,
    ]),
    [],
    [
      "",
      "",
      "",
      "",
      "",
      "HASIL AKHIR",
      report.totals.total,
      report.totals.b0_30,
      report.totals.b31_60,
      report.totals.b61_90,
      report.totals.b90plus,
      "",
    ],
    [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      pct(report.percent.b0_30),
      pct(report.percent.b31_60),
      pct(report.percent.b61_90),
      pct(report.percent.b90plus),
      "",
    ],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet["!merges"] = [0, 1, 2, 3, 4].map((r) => ({
    s: { r, c: 0 },
    e: { r, c: 11 },
  }));
  sheet["!cols"] = [5, 28, 18, 14, 16, 14, 16, 14, 14, 14, 14, 20].map(
    (wch) => ({ wch }),
  );
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Aging Pemasok");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
