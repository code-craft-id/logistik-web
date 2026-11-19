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
import { Prisma } from "@/lib/db/generated/client";

/**
 * Rekap Aging Pelanggan, Belum Lunas (provider Report AR, OBSERVED export
 * 2026-11-19): header block (title, company, "( IDR )", Pelanggan, Tanggal
 * Mulai/Akhir), one row per unpaid invoice and a HASIL AKHIR row with the
 * bucket totals and their percentages.
 *
 * Rules pending finance confirmation (the observed sample had no rows):
 * - invoices issued in the chosen month, not fully paid (FIN-01 net
 *   receipts), in the user's branches;
 * - JUMLAH TAGIHAN = invoice total; buckets hold the remaining balance;
 * - percentages = bucket / total JUMLAH TAGIHAN, "NAN%" when there is none
 *   (provider export and prototype);
 * - KETENTUAN = the customer's Termin (master Termin, e.g. "21 Hari" as in
 *   the prototype), else the invoice term (due date - invoice date);
 * - USIA FAKTUR = days from the invoice date to today; buckets 0-21,
 *   >21-30 and >30 days as labelled by the provider;
 * - TANGGAL / NAMA PENERIMA FAKTUR come from Serah Terima Faktur on the
 *   invoice ("-" until recorded).
 */
export const agingInput = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  customerId: z.preprocess(
    (v) => (v === "" || v === "0" ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
});

export type AgingRow = {
  invoiceDate: string;
  number: string;
  handoverDate: string | null;
  handoverTo: string | null;
  company: string;
  total: number;
  termDays: number;
  /** KETENTUAN text. */
  term: string;
  ageDays: number;
  b0_21: number;
  b21_30: number;
  b30plus: number;
};

export async function agingReport(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "view", "invoice");
  const parsed = agingInput.safeParse(raw);
  if (!parsed.success) throw new IdentityError("VALIDATION", 400);
  const input = parsed.data;
  const from = new Date(Date.UTC(input.year, input.month - 1, 1));
  const to = new Date(Date.UTC(input.year, input.month, 1));
  const admin = isAdministrator(actor);
  if (!admin && !actor.branchIds.length)
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  const scope = admin
    ? Prisma.sql`TRUE`
    : Prisma.sql`i."branchId" IN (${Prisma.join(actor.branchIds)})`;
  const rows = await prisma.$queryRaw<
    {
      invoiceDate: string;
      number: string | null;
      id: number;
      handoverDate: string | null;
      handoverTo: string | null;
      company: string;
      total: string;
      termName: string | null;
      termDays: number;
      ageDays: number;
      sisa: string;
    }[]
  >`
    WITH b AS (
      SELECT i.id, i.number, i."invoiceDate", i."dueDate", i.total, i."customerId",
             i."handoverDate", i."handoverTo",
             i.total - COALESCE(sum(CASE WHEN r."reversalOfId" IS NULL
                                         THEN r.amount ELSE -r.amount END), 0) AS sisa
      FROM fin_invoices i
      LEFT JOIN fin_receipts r ON r."invoiceId" = i.id
      WHERE i.status = 'ISSUED' AND ${scope}
        AND i."invoiceDate" >= ${from} AND i."invoiceDate" < ${to}
        ${input.customerId ? Prisma.sql`AND i."customerId" = ${input.customerId}` : Prisma.empty}
      GROUP BY i.id)
    SELECT to_char(b."invoiceDate", 'DD-MM-YYYY') AS "invoiceDate", b.number, b.id,
           to_char(b."handoverDate", 'DD-MM-YYYY') AS "handoverDate", b."handoverTo",
           c.name AS company, b.total::text AS total, tm.name AS "termName",
           (b."dueDate" - b."invoiceDate")::int AS "termDays",
           GREATEST(current_date - b."invoiceDate", 0)::int AS "ageDays",
           b.sisa::text AS sisa
    FROM b JOIN customers c ON c.id = b."customerId"
    LEFT JOIN terms tm ON tm.id = c.term_id AND tm.deleted_at IS NULL
    WHERE b.sisa > 0
    ORDER BY b."invoiceDate", b.id
    LIMIT 5000`;
  const items: AgingRow[] = rows.map((r) => {
    const sisa = Number(r.sisa);
    return {
      invoiceDate: r.invoiceDate,
      number: r.number ?? `Draft #${r.id}`,
      handoverDate: r.handoverDate,
      handoverTo: r.handoverTo,
      company: r.company,
      total: Number(r.total),
      termDays: r.termDays,
      term: r.termName
        ? /^\d+$/.test(r.termName.trim())
          ? `${r.termName.trim()} Hari`
          : r.termName.trim()
        : `${r.termDays} Hari`,
      ageDays: r.ageDays,
      b0_21: r.ageDays <= 21 ? sisa : 0,
      b21_30: r.ageDays > 21 && r.ageDays <= 30 ? sisa : 0,
      b30plus: r.ageDays > 30 ? sisa : 0,
    };
  });
  const sum = (k: "b0_21" | "b21_30" | "b30plus") =>
    items.reduce((t, r) => t + r[k], 0);
  const totals = {
    b0_21: sum("b0_21"),
    b21_30: sum("b21_30"),
    b30plus: sum("b30plus"),
  };
  const billed = items.reduce((t, r) => t + r.total, 0);
  const pct = (v: number) =>
    billed ? Math.round((v / billed) * 10000) / 100 : null;
  const [customer, company] = await Promise.all([
    input.customerId
      ? prisma.customer.findFirst({
          where: { id: input.customerId },
          select: { name: true },
        })
      : null,
    prisma.company.findFirst({
      where: admin
        ? { deletedAt: null }
        : {
            offices: {
              some: { branches: { some: { id: { in: actor.branchIds } } } },
            },
          },
      orderBy: { id: "asc" },
      select: { name: true },
    }),
  ]);
  const last = new Date(to.getTime() - 86_400_000);
  const dmy = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
  return {
    input,
    company: company?.name ?? "",
    customer: customer?.name ?? "Semua Pelanggan",
    start: dmy(from),
    end: dmy(last),
    items,
    totals,
    percent: {
      b0_21: pct(totals.b0_21),
      b21_30: pct(totals.b21_30),
      b30plus: pct(totals.b30plus),
    },
  };
}

export const AGING_HEADERS = [
  "NO.",
  "TANGGAL FAKTUR",
  "NO KWT/INV",
  "TANGGAL TERIMA FAKTUR",
  "NAMA PENERIMA FAKTUR",
  "NAMA PERUSAHAAN",
  "JUMLAH TAGIHAN",
  "KETENTUAN",
  "USIA FAKTUR",
  "0 S/D 21 HARI",
  "> 21 HARI= 30 HARI",
  "> 30 HARI",
];

/** Workbook bytes (.xlsx) in the provider's layout. */
export function agingWorkbook(report: Awaited<ReturnType<typeof agingReport>>) {
  const pct = (v: number | null) => (v === null ? "NAN%" : `${v}%`);
  const data: (string | number)[][] = [
    ["REKAP AGING PELANGGAN, BELUM LUNAS"],
    [report.company],
    ["( IDR )"],
    [`Pelanggan : ${report.customer}`],
    [`Tanggal Mulai : ${report.start}`],
    [`Tanggal Akhir : ${report.end}`],
    AGING_HEADERS,
    ...report.items.map((r, i) => [
      i + 1,
      r.invoiceDate,
      r.number,
      r.handoverDate ?? "-",
      r.handoverTo ?? "-",
      r.company,
      r.total,
      r.term,
      r.ageDays,
      r.b0_21,
      r.b21_30,
      r.b30plus,
    ]),
    [],
    [
      "",
      "",
      "",
      "",
      "",
      "",
      "HASIL AKHIR",
      "",
      "",
      report.totals.b0_21,
      report.totals.b21_30,
      report.totals.b30plus,
    ],
    [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      pct(report.percent.b0_21),
      pct(report.percent.b21_30),
      pct(report.percent.b30plus),
    ],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet["!merges"] = [0, 1, 2, 3, 4, 5].map((r) => ({
    s: { r, c: 0 },
    e: { r, c: 11 },
  }));
  sheet["!cols"] = [5, 14, 22, 20, 22, 28, 16, 12, 11, 16, 18, 14].map(
    (wch) => ({ wch }),
  );
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Aging");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
