import "server-only";

import * as XLSX from "xlsx";
import { z } from "zod";
import {
  type AccessActor,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { prisma } from "@/lib/db";

/**
 * Rekap Transaksi as exported by the provider (OBSERVED sample 2026-11-19,
 * "Multiple Sheet"): one sheet per day named YYYY-MM-DD, title "Rekap
 * Transaksi", "Cabang : <origin>", rows per destination branch and a TOTAL
 * row. Columns: No., Cabang Tujuan, Total AWB, Total Koli, Total Berat,
 * Total Volume, CASH, KREDIT, COD, Total Penagihan.
 *
 * Interpretation pending confirmation (the sample had zero amounts):
 * CASH / KREDIT / COD = Grand Total (biaya) of AWBs with that payment type;
 * Total Penagihan = CASH + KREDIT + COD. A day gets a sheet when the branch
 * input any AWB that day (voided ones too, which explains the sample's
 * zero-total sheets); totals count active AWBs only. "One Sheet" stacks the
 * same day blocks in one sheet (layout not observed).
 */
export const recapInput = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  branchId: z.coerce.number().int().positive(),
  sheet: z.enum(["multiple", "one"]).default("multiple"),
});
export type RecapInput = z.infer<typeof recapInput>;

export type RecapRow = {
  destination: string;
  awb: number;
  koli: number;
  kilo: number;
  volume: number;
  cash: number;
  kredit: number;
  cod: number;
};
export type RecapDay = { day: string; rows: RecapRow[]; total: RecapRow };

const HEADERS = [
  "No.",
  "Cabang Tujuan",
  "Total AWB",
  "Total Koli",
  "Total Berat",
  "Total Volume",
  "CASH",
  "KREDIT",
  "COD",
  "Total Penagihan",
];

const sumRows = (rows: RecapRow[]): RecapRow =>
  rows.reduce(
    (t, r) => ({
      destination: "TOTAL",
      awb: t.awb + r.awb,
      koli: t.koli + r.koli,
      kilo: t.kilo + r.kilo,
      volume: t.volume + r.volume,
      cash: t.cash + r.cash,
      kredit: t.kredit + r.kredit,
      cod: t.cod + r.cod,
    }),
    {
      destination: "TOTAL",
      awb: 0,
      koli: 0,
      kilo: 0,
      volume: 0,
      cash: 0,
      kredit: 0,
      cod: 0,
    },
  );

export async function recapTransactions(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "export", "transaction_report");
  const parsed = recapInput.safeParse(raw);
  if (!parsed.success) throw new IdentityError("VALIDATION", 400);
  const input = parsed.data;
  if (!permitsBranch(actor, input.branchId))
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  const branch = await prisma.branch.findFirst({
    where: { id: input.branchId },
    select: { name: true },
  });
  if (!branch) throw new IdentityError("VALIDATION", 400);
  const from = new Date(Date.UTC(input.year, input.month - 1, 1));
  const to = new Date(Date.UTC(input.year, input.month, 1));

  const days = await prisma.$queryRaw<{ day: string }[]>`
    SELECT DISTINCT to_char(t.transaction_date, 'YYYY-MM-DD') AS day
    FROM transactions t
    WHERE t.origin_branch_id = ${input.branchId}
      AND t.transaction_date >= ${from} AND t.transaction_date < ${to}
    ORDER BY 1`;
  const rows = await prisma.$queryRaw<
    {
      day: string;
      destination: string | null;
      awb: number;
      koli: number;
      kilo: string;
      volume: string;
      cash: string;
      kredit: string;
      cod: string;
    }[]
  >`
    SELECT to_char(t.transaction_date, 'YYYY-MM-DD') AS day,
           d.name AS destination,
           count(*)::int AS awb,
           COALESCE(sum(t.koli), 0)::int AS koli,
           COALESCE(sum(t.kilo), 0)::text AS kilo,
           COALESCE(sum(t.volume), 0)::text AS volume,
           COALESCE(sum(t.biaya) FILTER (WHERE upper(trim(c.name)) = 'CASH'), 0)::text AS cash,
           COALESCE(sum(t.biaya) FILTER (WHERE upper(trim(c.name)) = 'KREDIT'), 0)::text AS kredit,
           COALESCE(sum(t.biaya) FILTER (WHERE upper(trim(c.name)) = 'COD'), 0)::text AS cod
    FROM transactions t
    LEFT JOIN branches d ON d.id = t.destination_branch_id
    LEFT JOIN cost_types c ON c.id = t.cost_type_id
    WHERE t.origin_branch_id = ${input.branchId}
      AND t.deleted_at IS NULL
      AND t.transaction_date >= ${from} AND t.transaction_date < ${to}
    GROUP BY 1, 2
    ORDER BY 1, 2`;
  const result: RecapDay[] = days.map(({ day }) => {
    const dayRows = rows
      .filter((r) => r.day === day)
      .map((r) => ({
        destination: r.destination ?? "-",
        awb: r.awb,
        koli: r.koli,
        kilo: Number(r.kilo),
        volume: Number(r.volume),
        cash: Number(r.cash),
        kredit: Number(r.kredit),
        cod: Number(r.cod),
      }));
    return { day, rows: dayRows, total: sumRows(dayRows) };
  });
  return { branch: branch.name, input, days: result };
}

type Cell = string | number;
/** One day block starting at column B, as in the provider sample. */
function dayBlock(branch: string, day: RecapDay, withDate: boolean): Cell[][] {
  const line = (no: Cell, r: RecapRow): Cell[] => [
    "",
    no,
    r.destination,
    r.awb,
    r.koli,
    r.kilo,
    r.volume,
    r.cash,
    r.kredit,
    r.cod,
    r.cash + r.kredit + r.cod,
  ];
  return [
    [],
    ["", "Rekap Transaksi"],
    ["", `Cabang : ${branch}${withDate ? ` · Tanggal : ${day.day}` : ""}`],
    [],
    ["", ...HEADERS],
    ...day.rows.map((r, i) => line(i + 1, r)),
    line("", day.total),
  ];
}

const COLS = [8.43, 3.86, 15.71, 11, 12.14, 13.29, 14.57, 8, 8, 8, 18].map(
  (wch) => ({ wch }),
);

/** Workbook bytes (.xlsx) for the recap. */
export function recapWorkbook(
  recap: Awaited<ReturnType<typeof recapTransactions>>,
) {
  const book = XLSX.utils.book_new();
  const merges = (top: number) => [
    { s: { r: top + 1, c: 1 }, e: { r: top + 1, c: 10 } },
    { s: { r: top + 2, c: 1 }, e: { r: top + 2, c: 10 } },
  ];
  if (recap.input.sheet === "multiple") {
    for (const day of recap.days) {
      const sheet = XLSX.utils.aoa_to_sheet(dayBlock(recap.branch, day, false));
      sheet["!merges"] = merges(0);
      sheet["!cols"] = COLS;
      XLSX.utils.book_append_sheet(book, sheet, day.day);
    }
    if (!recap.days.length)
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet([
          [],
          ["", "Rekap Transaksi"],
          ["", "Tidak ada transaksi pada periode ini."],
        ]),
        "Kosong",
      );
  } else {
    const data: Cell[][] = [];
    const allMerges: XLSX.Range[] = [];
    for (const day of recap.days) {
      allMerges.push(...merges(data.length));
      data.push(...dayBlock(recap.branch, day, true));
    }
    const month = sumRows(recap.days.map((d) => d.total));
    data.push(
      [],
      [
        "",
        "",
        "TOTAL BULAN",
        month.awb,
        month.koli,
        month.kilo,
        month.volume,
        month.cash,
        month.kredit,
        month.cod,
        month.cash + month.kredit + month.cod,
      ],
    );
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet["!merges"] = allMerges;
    sheet["!cols"] = COLS;
    XLSX.utils.book_append_sheet(book, sheet, "Rekap Transaksi");
  }
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
