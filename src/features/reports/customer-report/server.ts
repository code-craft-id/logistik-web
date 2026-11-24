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
  businessDateStartUtc,
  businessDateTimeString,
} from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";

/**
 * Report Customer (OBSERVED real web LP-R22, 2026-11-24): Periode Date,
 * Origin, Destination, Customer and Billing Type filters, Export Excel of
 * one row per AWB grouped under Detail Resi / Pengirim / Penerima Barang /
 * Jenis Tagihan. The provider sheet has 64 columns; LMS exports the fields
 * it stores (no invented manifest, invoice or closing values). Payment
 * columns follow the provider type names: CASH, TRF, KREDIT, COD.
 */
const id = z
  .union([z.literal(""), z.coerce.number().int().positive()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const customerReportInput = z.object({
  from: date,
  to: date,
  originId: id,
  destinationId: id,
  customerId: id,
  costTypeId: id,
});
const MAX_DAYS = 31;
const MAX_ROWS = 20_000;

type Row = {
  awb_no: string | null;
  transaction_date: Date;
  do_no: string | null;
  origin: string | null;
  destination: string | null;
  customer: string | null;
  service: string | null;
  mode: string | null;
  sender_name: string | null;
  sender_address: string | null;
  sender_phone: string | null;
  receiver_name: string | null;
  receiver_address: string | null;
  receiver_phone: string | null;
  goods: string | null;
  koli: number | null;
  kilo: string | null;
  volume: string | null;
  chargeable: string | null;
  price_per_kg: string | null;
  other_fee: string | null;
  packing_fee: string | null;
  pickup_fee: string | null;
  insurance_fee: string | null;
  discount: string | null;
  ppn: string | null;
  biaya: string | null;
  cost_type: string | null;
  cod_value: string | null;
  cod_fee: string | null;
  status: string;
};

export async function customerReport(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "export", "transaction_report");
  const parsed = customerReportInput.safeParse(raw);
  if (!parsed.success) throw new IdentityError("VALIDATION", 400);
  const f = parsed.data;
  let from: Date;
  let to: Date;
  try {
    from = businessDateStartUtc(f.from);
    to = new Date(businessDateStartUtc(f.to).getTime() + 86_400_000);
  } catch {
    throw new IdentityError("VALIDATION", 400);
  }
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (days < 1 || days > MAX_DAYS) throw new IdentityError("VALIDATION", 400);

  const where: Prisma.Sql[] = [
    Prisma.sql`t.deleted_at IS NULL`,
    Prisma.sql`t.transaction_date >= ${from} AND t.transaction_date < ${to}`,
  ];
  if (!isAdministrator(actor)) {
    const ids = actor.branchIds.length
      ? Prisma.join(actor.branchIds)
      : Prisma.sql`NULL`;
    where.push(
      Prisma.sql`(t.origin_branch_id IN (${ids}) OR t.destination_branch_id IN (${ids}))`,
    );
  }
  if (f.originId !== null)
    where.push(Prisma.sql`t.origin_branch_id = ${f.originId}`);
  if (f.destinationId !== null)
    where.push(Prisma.sql`t.destination_branch_id = ${f.destinationId}`);
  if (f.customerId !== null)
    where.push(Prisma.sql`t.customer_id = ${f.customerId}`);
  if (f.costTypeId !== null)
    where.push(Prisma.sql`t.cost_type_id = ${f.costTypeId}`);

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT t.awb_no, t.transaction_date, t.do_no,
           o.name AS origin, d.name AS destination, cu.name AS customer,
           s.name AS service, m.name AS mode,
           t.sender_name, t.sender_address, t.sender_phone,
           t.receiver_name, t.receiver_address, t.receiver_phone,
           COALESCE(g.name, t.description) AS goods,
           t.koli, t.kilo::text, t.volume::text, t.chargeable_weight::text AS chargeable,
           t.price_per_kg::text, t.other_fee::text, t.packing_fee::text,
           t.pickup_fee::text, t.insurance_fee::text,
           t.discount_percent::text AS discount, t.ppn_percent::text AS ppn,
           t.biaya::text, c.name AS cost_type,
           t.cod_value::text, t.cod_fee::text, t.status
    FROM transactions t
    LEFT JOIN branches o ON o.id = t.origin_branch_id
    LEFT JOIN branches d ON d.id = t.destination_branch_id
    LEFT JOIN customers cu ON cu.id = t.customer_id
    LEFT JOIN delivery_services s ON s.id = t.delivery_service_id
    LEFT JOIN transport_modes m ON m.id = t.transport_mode_id
    LEFT JOIN goods_types g ON g.id = t.goods_type_id
    LEFT JOIN cost_types c ON c.id = t.cost_type_id
    WHERE ${Prisma.join(where, " AND ")}
    ORDER BY t.transaction_date, t.id
    LIMIT ${MAX_ROWS + 1}`;
  if (rows.length > MAX_ROWS) throw new IdentityError("VALIDATION", 400);
  return { input: f, rows };
}

const GROUPS: [string, string[]][] = [
  [
    "Detail Resi",
    [
      "No.",
      "AWB No.",
      "Tanggal",
      "DO / Reff",
      "Asal",
      "Tujuan",
      "Customer",
      "Layanan",
      "Moda",
    ],
  ],
  ["Pengirim", ["Nama", "Alamat", "Telp"]],
  ["Penerima Barang", ["Nama", "Alamat", "Telp"]],
  [
    "Barang & Biaya",
    [
      "Isi Barang",
      "Koli",
      "Berat",
      "Volume",
      "Terberat",
      "Harga/Kg",
      "Biaya Lain",
      "Packing",
      "Pickup",
      "Asuransi",
      "Discount %",
      "PPN %",
      "Grand Total",
    ],
  ],
  ["Jenis Tagihan", ["CASH", "TRF", "KREDIT", "COD"]],
  ["COD", ["Nilai COD", "Biaya COD"]],
  ["Status Terakhir", ["Status"]],
];

const n = (v: string | null) => (v === null ? null : Number(v));
const paid = (r: Row, type: string) =>
  (r.cost_type ?? "").trim().toUpperCase() === type ? n(r.biaya) : 0;

/** Pure row builder, exported for tests. */
export function customerReportLine(r: Row, no: number) {
  return [
    no,
    r.awb_no,
    businessDateTimeString(r.transaction_date),
    r.do_no,
    r.origin,
    r.destination,
    r.customer,
    r.service,
    r.mode,
    r.sender_name,
    r.sender_address,
    r.sender_phone,
    r.receiver_name,
    r.receiver_address,
    r.receiver_phone,
    r.goods,
    r.koli,
    n(r.kilo),
    n(r.volume),
    n(r.chargeable),
    n(r.price_per_kg),
    n(r.other_fee),
    n(r.packing_fee),
    n(r.pickup_fee),
    n(r.insurance_fee),
    n(r.discount),
    n(r.ppn),
    n(r.biaya),
    paid(r, "CASH"),
    paid(r, "TRF"),
    paid(r, "KREDIT"),
    paid(r, "COD"),
    n(r.cod_value),
    n(r.cod_fee),
    r.status,
  ];
}

export function customerReportWorkbook(
  report: Awaited<ReturnType<typeof customerReport>>,
) {
  const { input, rows } = report;
  const groupRow: (string | null)[] = [];
  const merges: XLSX.Range[] = [];
  for (const [label, leaves] of GROUPS) {
    merges.push({
      s: { r: 3, c: groupRow.length },
      e: { r: 3, c: groupRow.length + leaves.length - 1 },
    });
    groupRow.push(label, ...Array(leaves.length - 1).fill(null));
  }
  const lines = rows.map((r, i) => customerReportLine(r, i + 1));
  const sum = (col: number) =>
    lines.reduce((t, l) => t + (Number(l[col]) || 0), 0);
  const total = lines[0]?.map(() => null as number | string | null) ?? [];
  if (total.length) {
    total[1] = "TOTAL";
    for (const col of [16, 17, 18, 19, 27, 28, 29, 30, 31, 32, 33])
      total[col] = sum(col);
  }
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Detail Transaction Customer"],
    [`Periode : ${input.from} s/d ${input.to}`],
    [],
    groupRow,
    GROUPS.flatMap(([, leaves]) => leaves),
    ...lines,
    ...(total.length ? [total] : [["Tidak ada transaksi pada periode ini."]]),
  ]);
  sheet["!merges"] = merges;
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, `${input.from}-${input.to}`);
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
