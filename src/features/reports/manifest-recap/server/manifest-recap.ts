import "server-only";

import * as XLSX from "xlsx";
import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
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
import type { Prisma } from "@/lib/db/generated/client";

/**
 * Rekap Manifest (Laporan Cabang). Provider OBSERVED inputs: Bulan, Tahun,
 * Cabang (Asal, "-- All Branch --") and Jenis Lembar (Multiple / One Sheet),
 * output "Ekspor Excel". The provider workbook layout was not observed, so
 * rows follow the provider manifest list columns (D-35): one row per
 * manifest with its active AWB totals, grouped per manifest date.
 */
export const manifestRecapInput = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  branchId: z.preprocess(
    (v) => (v === "" || v === "all" || v === undefined ? null : v),
    z.coerce.number().int().positive().nullable(),
  ),
  sheet: z.enum(["multiple", "one"]).default("multiple"),
});
export type ManifestRecapInput = z.infer<typeof manifestRecapInput>;

export type ManifestRecapRow = {
  id: number;
  day: string;
  manifestNo: string;
  origin: string;
  transit: string;
  destination: string;
  awb: number;
  koli: number;
  kilo: number;
  volume: number;
  vehicle: string;
  courier: string;
  vendor: string;
  status: string;
};

const HEADERS = [
  "No.",
  "Manifest No.",
  "Tanggal",
  "Asal",
  "Transit",
  "Tujuan",
  "Tot. AWB",
  "Tot. Koli",
  "Tot. Berat",
  "Tot. Volume",
  "Kendaraan",
  "Kurir / Driver",
  "Vendor",
  "Status",
];

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export async function manifestRecap(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "view", "manifest_report");
  const parsed = manifestRecapInput.safeParse(raw);
  if (!parsed.success) throw new IdentityError("BAD_REQUEST", 400);
  const input = parsed.data;
  if (input.branchId !== null && !permitsBranch(actor, input.branchId))
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  const from = jakartaMonthStartUtc(input.year, input.month);
  const to =
    input.month === 12
      ? jakartaMonthStartUtc(input.year + 1, 1)
      : jakartaMonthStartUtc(input.year, input.month + 1);
  const where: Prisma.ManifestWhereInput = {
    deletedAt: null,
    manifestDate: { gte: from, lt: to },
    ...(input.branchId !== null
      ? { branchId: input.branchId }
      : isAdministrator(actor)
        ? {}
        : { branchId: { in: actor.branchIds } }),
  };
  const [rows, branches] = await Promise.all([
    prisma.manifest.findMany({
      where,
      orderBy: [{ manifestDate: "asc" }, { id: "asc" }],
      take: 5000,
      select: {
        id: true,
        manifestNo: true,
        manifestDate: true,
        originBranchId: true,
        destinationBranchId: true,
        transit1: true,
        transit2: true,
        transit3: true,
        transit4: true,
        transit5: true,
        status: true,
        branch: { select: { name: true } },
        vehicle: { select: { licensePlate: true } },
        courier: { select: { name: true } },
        vendor: { select: { name: true } },
        items: {
          where: { deletedAt: null, releasedAt: null },
          select: {
            transaction: { select: { koli: true, kilo: true, volume: true } },
          },
        },
      },
    }),
    prisma.branch.findMany({ select: { id: true, name: true } }),
  ]);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  const name = (id: number | null) =>
    id === null ? "-" : (branchName.get(id) ?? "-");
  const recapRows: ManifestRecapRow[] = rows.map((m) => {
    const sum = (
      pick: (t: (typeof m.items)[number]["transaction"]) => unknown,
    ) =>
      round3(m.items.reduce((n, i) => n + Number(pick(i.transaction) ?? 0), 0));
    return {
      id: m.id,
      day: businessDateString(m.manifestDate),
      manifestNo: m.manifestNo,
      origin:
        m.originBranchId !== null
          ? name(m.originBranchId)
          : (m.branch?.name ?? "-"),
      transit:
        [m.transit1, m.transit2, m.transit3, m.transit4, m.transit5]
          .filter(Boolean)
          .join(", ") || "-",
      destination: name(m.destinationBranchId),
      awb: m.items.length,
      koli: sum((t) => t.koli),
      kilo: sum((t) => t.kilo?.toString()),
      volume: sum((t) => t.volume?.toString()),
      vehicle: m.vehicle?.licensePlate ?? "-",
      courier: m.courier?.name ?? "-",
      vendor: m.vendor?.name ?? "-",
      status: m.status,
    };
  });
  const total = recapRows.reduce(
    (t, r) => ({
      awb: t.awb + r.awb,
      koli: round3(t.koli + r.koli),
      kilo: round3(t.kilo + r.kilo),
      volume: round3(t.volume + r.volume),
    }),
    { awb: 0, koli: 0, kilo: 0, volume: 0 },
  );
  return {
    input,
    branch: input.branchId === null ? "Semua cabang" : name(input.branchId),
    rows: recapRows,
    total,
    truncated: rows.length >= 5000,
  };
}

type Recap = Awaited<ReturnType<typeof manifestRecap>>;

function block(title: string, rows: ManifestRecapRow[]) {
  const totals = rows.reduce(
    (t, r) => [
      t[0] + r.awb,
      round3(t[1] + r.koli),
      round3(t[2] + r.kilo),
      round3(t[3] + r.volume),
    ],
    [0, 0, 0, 0],
  );
  return [
    [title],
    HEADERS,
    ...rows.map((r, i) => [
      i + 1,
      r.manifestNo,
      r.day,
      r.origin,
      r.transit,
      r.destination,
      r.awb,
      r.koli,
      r.kilo,
      r.volume,
      r.vehicle,
      r.courier,
      r.vendor,
      r.status,
    ]),
    ["", "TOTAL", "", "", "", "", ...totals],
  ];
}

/** Multiple Sheet: one sheet per manifest date; One Sheet: all in one. */
export function manifestRecapWorkbook(recap: Recap) {
  const book = XLSX.utils.book_new();
  const head = [
    ["Rekap Manifest"],
    [`Cabang : ${recap.branch}`],
    [
      `Periode : ${recap.input.year}-${String(recap.input.month).padStart(2, "0")}`,
    ],
    [],
  ];
  if (recap.input.sheet === "multiple" && recap.rows.length) {
    const days = [...new Set(recap.rows.map((r) => r.day))];
    for (const day of days)
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet([
          ...head,
          ...block(
            day,
            recap.rows.filter((r) => r.day === day),
          ),
        ]),
        day,
      );
  } else {
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet(
        recap.rows.length
          ? [...head, ...block("Semua tanggal", recap.rows)]
          : [...head, ["Tidak ada manifest pada periode ini."]],
      ),
      "Rekap Manifest",
    );
  }
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
