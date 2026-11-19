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
import { prisma } from "@/lib/db";

/**
 * Rekap Aging Pemasok (Laporan AP; layout from the earlier prototype of
 * the provider's hidden menu): unpaid vendor bills (Proses Vendor /
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
  const from = new Date(Date.UTC(input.year, input.month - 1, 1));
  const to = new Date(Date.UTC(input.year, input.month, 1));
  const rows = await prisma.vendorBill.findMany({
    where: {
      deletedAt: null,
      status: "OPEN",
      billDate: { gte: from, lt: to },
      ...(input.vendorId ? { vendorId: input.vendorId } : {}),
      // Same visibility as Pembayaran Hutang.
      ...(isAdministrator(actor)
        ? {}
        : {
            OR: [
              { createdById: actor.id },
              {
                items: {
                  some: {
                    transaction: { originBranchId: { in: actor.branchIds } },
                  },
                },
              },
            ],
          }),
    },
    orderBy: [{ billDate: "asc" }, { id: "asc" }],
    take: 5000,
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
  const today = startOfDay(new Date());
  const items = rows.map((r) => {
    const amount = Number(r.amount);
    const age = Math.max(
      0,
      Math.round((today - startOfDay(r.billDate)) / 86_400_000),
    );
    const due = new Date(r.receivedDate ?? r.billDate);
    due.setUTCDate(due.getUTCDate() + r.termDays);
    return {
      company: r.vendor.name,
      number: r.invoiceNo,
      billDate: dmy(r.billDate),
      category: r.category,
      dueDate: dmy(due),
      total: amount,
      ageDays: age,
      b0_30: age <= 30 ? amount : 0,
      b31_60: age > 30 && age <= 60 ? amount : 0,
      b61_90: age > 60 && age <= 90 ? amount : 0,
      b90plus: age > 90 ? amount : 0,
      note: today > startOfDay(due) ? "Lewat batas waktu" : "",
    };
  });
  const sum = (k: "total" | "b0_30" | "b31_60" | "b61_90" | "b90plus") =>
    items.reduce((t, r) => t + r[k], 0);
  const totals = {
    total: sum("total"),
    b0_30: sum("b0_30"),
    b31_60: sum("b31_60"),
    b61_90: sum("b61_90"),
    b90plus: sum("b90plus"),
  };
  const pct = (v: number) =>
    totals.total ? Math.round((v / totals.total) * 10000) / 100 : null;
  const vendor = input.vendorId
    ? await prisma.vendor.findFirst({
        where: { id: input.vendorId },
        select: { name: true },
      })
    : null;
  return {
    input,
    vendor: vendor?.name ?? "Semua Pemasok",
    start: dmy(from),
    end: dmy(new Date(to.getTime() - 86_400_000)),
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
