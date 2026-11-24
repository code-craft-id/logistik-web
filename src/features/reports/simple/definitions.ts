import "server-only";

import { Prisma } from "@/lib/db/generated/client";
import {
  branchScope,
  branchScopeAny,
  type Cell,
  type ReportDef,
  ROW_LIMIT,
  sumColumns,
  transactionScope,
} from "./framework";

type Row = Record<string, Cell>;
const money = (label: string, key: string) => ({ key, label, numeric: true });
const count = (label: string, key: string) => ({ key, label, numeric: true });
const capped = <T>(rows: T[]) => ({
  rows: rows.slice(0, ROW_LIMIT),
  truncated: rows.length > ROW_LIMIT,
});
/** Net actual cost per transaction (costs minus their reversals), FIN-02. */
const netCost = Prisma.sql`(
  SELECT c."transactionId" AS transaction_id,
         sum(CASE WHEN c."reversalOfId" IS NULL THEN c.amount ELSE -c.amount END) AS cost
  FROM fin_costs c GROUP BY c."transactionId")`;

export const simpleReports: Record<string, ReportDef> = {
  "customer-monthly": {
    title: "Rekap Customer Bulanan",
    resource: "transaction_report",
    definition:
      "Satu baris per customer: jumlah AWB, koli, berat dan total biaya input AWB menurut tanggal transaksi dalam periode. AWB tanpa customer dikelompokkan sebagai 'Tanpa customer'. Nilai yang kosong tidak dijumlahkan; jumlah AWB yang datanya belum lengkap ditampilkan.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT COALESCE(c.name, 'Tanpa customer') AS customer,
               count(*)::int AS awb,
               count(*) FILTER (WHERE t.koli IS NULL OR t.kilo IS NULL OR t.biaya IS NULL)::int AS tidak_lengkap,
               COALESCE(sum(t.koli), 0)::int AS koli,
               COALESCE(sum(t.kilo), 0)::text AS kilo,
               COALESCE(sum(t.biaya), 0)::text AS biaya
        FROM transactions t LEFT JOIN customers c ON c.id = t.customer_id
        WHERE ${transactionScope(actor, f)}
          AND t.transaction_date >= ${f.from} AND t.transaction_date < ${f.toExclusive}
        GROUP BY t.customer_id, c.name ORDER BY sum(t.biaya) DESC NULLS LAST, 1`;
      return {
        columns: [
          { key: "customer", label: "Customer" },
          count("Total AWB", "awb"),
          count("AWB data belum lengkap", "tidak_lengkap"),
          count("Koli", "koli"),
          count("Berat (kg)", "kilo"),
          money("Total Biaya (Rp)", "biaya"),
        ],
        rows,
        totals: sumColumns(
          rows,
          ["awb", "tidak_lengkap", "koli", "kilo", "biaya"],
          {
            customer: "Total",
          },
        ),
      };
    },
  },
  "daily-turnover": {
    title: "Rekap Omset Harian",
    resource: "transaction_report",
    definition:
      "Satu baris per tanggal transaksi dan jenis pembayaran: jumlah AWB, koli, berat dan total biaya input AWB. Omset = jumlah biaya yang diisi saat Entry AWB (belum termasuk diskon/pajak). AWB tanpa biaya/koli/berat dihitung di kolom 'AWB data belum lengkap'.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT to_char((t.transaction_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS tanggal,
               COALESCE(ct.name, 'Tidak diisi') AS pembayaran,
               count(*)::int AS awb,
               count(*) FILTER (WHERE t.koli IS NULL OR t.kilo IS NULL OR t.biaya IS NULL)::int AS tidak_lengkap,
               COALESCE(sum(t.koli), 0)::int AS koli,
               COALESCE(sum(t.kilo), 0)::text AS kilo,
               COALESCE(sum(t.biaya), 0)::text AS biaya
        FROM transactions t LEFT JOIN cost_types ct ON ct.id = t.cost_type_id
        WHERE ${transactionScope(actor, f)}
          AND t.transaction_date >= ${f.from} AND t.transaction_date < ${f.toExclusive}
        GROUP BY 1, t.cost_type_id, ct.name ORDER BY 1, 2`;
      return {
        columns: [
          { key: "tanggal", label: "Tanggal (Asia/Jakarta)" },
          { key: "pembayaran", label: "Pembayaran" },
          count("AWB", "awb"),
          count("AWB data belum lengkap", "tidak_lengkap"),
          count("Koli", "koli"),
          count("Berat (kg)", "kilo"),
          money("Omset (Rp)", "biaya"),
        ],
        rows,
        totals: sumColumns(
          rows,
          ["awb", "tidak_lengkap", "koli", "kilo", "biaya"],
          {
            tanggal: "Total",
          },
        ),
      };
    },
  },
  inbound: {
    title: "Detail Transaksi Inbound",
    resource: "transaction_report",
    definition:
      "AWB yang tujuannya cabang Anda (atau cabang terpilih) menurut tanggal transaksi, dengan status tersimpan. Maksimal 2.000 baris.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT t.awb_no AS awb, to_char((t.transaction_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS tanggal,
               ob.name AS asal, db.name AS tujuan, c.name AS customer,
               t.sender_name AS pengirim, t.receiver_name AS penerima,
               t.koli, t.kilo::text AS kilo, t.status
        FROM transactions t
        LEFT JOIN branches ob ON ob.id = t.origin_branch_id
        LEFT JOIN branches db ON db.id = t.destination_branch_id
        LEFT JOIN customers c ON c.id = t.customer_id
        WHERE ${transactionScope(actor, f, "destination")}
          AND t.transaction_date >= ${f.from} AND t.transaction_date < ${f.toExclusive}
        ORDER BY t.transaction_date DESC, t.id DESC LIMIT ${ROW_LIMIT + 1}`;
      return {
        columns: [
          { key: "awb", label: "AWB No." },
          { key: "tanggal", label: "Tanggal (Asia/Jakarta)" },
          { key: "asal", label: "Asal" },
          { key: "tujuan", label: "Tujuan" },
          { key: "customer", label: "Customer" },
          { key: "pengirim", label: "Pengirim" },
          { key: "penerima", label: "Penerima" },
          count("Koli", "koli"),
          count("Berat (kg)", "kilo"),
          { key: "status", label: "Status" },
        ],
        ...capped(rows),
      };
    },
  },
  courier: {
    title: "Harian Kurir",
    resource: "delivery_report",
    definition:
      "Satu baris per kurir aktif cabang (seperti Harian Kurir aplikasi lama): Jumlah Terambil = booking SUCCESS PICKUP dan Jumlah Miss Pickup = booking MISS PICKUP yang hasilnya dicatat kurir dalam periode. Kolom antar menghitung AWB di lembar pengantaran (DRS manifest atau DRS Kurir Kota) dengan tanggal DRS dalam periode: berhasil, gagal, retur dan belum ada hasil.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        WITH p AS (
          SELECT b.courier_id,
                 count(*) FILTER (WHERE b.status = 'SUCCESS PICKUP')::int AS terambil,
                 count(*) FILTER (WHERE b.status = 'MISS PICKUP')::int AS miss
          FROM bookings b
          WHERE b.deleted_at IS NULL AND b.courier_id IS NOT NULL
            AND b.pickup_result_at >= ${f.from} AND b.pickup_result_at < ${f.toExclusive}
          GROUP BY 1),
        d AS (
          SELECT COALESCE(ds.courier_id, m.courier_id) AS courier_id,
                 count(DISTINCT ds.id)::int AS drs,
                 count(*)::int AS awb,
                 count(*) FILTER (WHERE i.outcome = 'DELIVERED')::int AS berhasil,
                 count(*) FILTER (WHERE i.outcome = 'FAILED_DELIVERY')::int AS gagal,
                 count(*) FILTER (WHERE i.outcome = 'RETURNED')::int AS retur,
                 count(*) FILTER (WHERE i.outcome IS NULL)::int AS proses
          FROM delivery_sheet_items i
          JOIN delivery_sheets ds ON ds.id = i.delivery_sheet_id
          LEFT JOIN manifests m ON m.id = ds.manifest_id
          WHERE i.deleted_at IS NULL AND (m.id IS NULL OR m.deleted_at IS NULL)
            AND ds.delivery_date >= ${f.from} AND ds.delivery_date < ${f.toExclusive}
          GROUP BY 1)
        SELECT co.name AS kurir,
               COALESCE(p.terambil, 0) AS terambil, COALESCE(p.miss, 0) AS miss,
               COALESCE(d.drs, 0) AS drs, COALESCE(d.awb, 0) AS awb,
               COALESCE(d.berhasil, 0) AS berhasil, COALESCE(d.gagal, 0) AS gagal,
               COALESCE(d.retur, 0) AS retur, COALESCE(d.proses, 0) AS proses
        FROM couriers co
        LEFT JOIN p ON p.courier_id = co.id
        LEFT JOIN d ON d.courier_id = co.id
        WHERE co.deleted_at IS NULL
          AND ${branchScope(actor, f, Prisma.sql`co.branch_id`)}
          AND (co.status = 'ACTIVE' OR p.courier_id IS NOT NULL OR d.courier_id IS NOT NULL)
        ORDER BY 1`;
      return {
        columns: [
          { key: "kurir", label: "Nama Kurir" },
          count("Jumlah Terambil", "terambil"),
          count("Jumlah Miss Pickup", "miss"),
          count("DRS", "drs"),
          count("AWB diantar", "awb"),
          count("Berhasil", "berhasil"),
          count("Gagal", "gagal"),
          count("Retur", "retur"),
          count("Belum ada hasil", "proses"),
        ],
        rows,
        totals: sumColumns(
          rows,
          [
            "terambil",
            "miss",
            "drs",
            "awb",
            "berhasil",
            "gagal",
            "retur",
            "proses",
          ],
          { kurir: "Total" },
        ),
      };
    },
  },
  receivables: {
    title: "Laporan Keuangan — Umur Piutang (AR)",
    resource: "invoice",
    usesPeriod: false,
    definition:
      "Saldo invoice terbit yang belum lunas per hari ini, per customer, dikelompokkan menurut lewat jatuh tempo (FIN-01: saldo = total invoice − pembayaran bersih). Periode tidak dipakai.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        WITH b AS (
          SELECT i."customerId", i."dueDate",
                 i.total - COALESCE(sum(CASE WHEN r."reversalOfId" IS NULL THEN r.amount ELSE -r.amount END), 0) AS sisa
          FROM fin_invoices i LEFT JOIN fin_receipts r ON r."invoiceId" = i.id
          WHERE i.status = 'ISSUED' AND ${branchScope(actor, f, Prisma.sql`i."branchId"`)}
          GROUP BY i.id)
        SELECT c.name AS customer, count(*)::int AS invoice,
               sum(sisa) FILTER (WHERE current_date <= b."dueDate")::text AS belum,
               sum(sisa) FILTER (WHERE current_date - b."dueDate" BETWEEN 1 AND 30)::text AS d30,
               sum(sisa) FILTER (WHERE current_date - b."dueDate" BETWEEN 31 AND 60)::text AS d60,
               sum(sisa) FILTER (WHERE current_date - b."dueDate" BETWEEN 61 AND 90)::text AS d90,
               sum(sisa) FILTER (WHERE current_date - b."dueDate" > 90)::text AS lebih,
               sum(sisa)::text AS total
        FROM b JOIN customers c ON c.id = b."customerId"
        WHERE b.sisa > 0 GROUP BY c.id, c.name ORDER BY sum(sisa) DESC`;
      const zero = (r: Row) => {
        for (const k of ["belum", "d30", "d60", "d90", "lebih"]) r[k] ??= "0";
        return r;
      };
      const filled = rows.map(zero);
      return {
        columns: [
          { key: "customer", label: "Customer" },
          count("Invoice", "invoice"),
          money("Belum jatuh tempo", "belum"),
          money("1–30 hari", "d30"),
          money("31–60 hari", "d60"),
          money("61–90 hari", "d90"),
          money("> 90 hari", "lebih"),
          money("Total piutang (Rp)", "total"),
        ],
        rows: filled,
        totals: sumColumns(
          filled,
          ["invoice", "belum", "d30", "d60", "d90", "lebih", "total"],
          { customer: "Total" },
        ),
      };
    },
  },
  "gross-profit": {
    title: "Gross Profit / Manifest",
    resource: "financial_report",
    definition:
      "Satu baris per manifest dalam periode tanggal manifest. Pendapatan = total biaya input AWB aktif di manifest; Biaya = biaya aktual bersih yang dicatat di Akunting (FIN-02) untuk AWB tersebut; GP = Pendapatan − Biaya. AWB tanpa biaya input atau tanpa biaya aktual dihitung 0 dan jumlahnya ditampilkan di kolom tersendiri.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT m.manifest_no AS manifest, to_char((m.manifest_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS tanggal,
               v.license_plate AS kendaraan, co.name AS kurir,
               count(mi.id)::int AS awb,
               count(mi.id) FILTER (WHERE t.biaya IS NULL)::int AS tanpa_tarif,
               COALESCE(sum(t.biaya), 0)::text AS pendapatan,
               COALESCE(sum(nc.cost), 0)::text AS biaya,
               (COALESCE(sum(t.biaya), 0) - COALESCE(sum(nc.cost), 0))::text AS gp,
               count(mi.id) FILTER (WHERE nc.cost IS NULL)::int AS tanpa_biaya
        FROM manifests m
        LEFT JOIN manifest_items mi ON mi.manifest_id = m.id AND mi.deleted_at IS NULL AND mi.released_at IS NULL
        LEFT JOIN transactions t ON t.id = mi.transaction_id
        LEFT JOIN ${netCost} nc ON nc.transaction_id = t.id
        LEFT JOIN vehicles v ON v.id = m.vehicle_id
        LEFT JOIN couriers co ON co.id = m.courier_id
        WHERE m.deleted_at IS NULL AND ${branchScope(actor, f, Prisma.sql`m.branch_id`)}
          AND m.manifest_date >= ${f.from} AND m.manifest_date < ${f.toExclusive}
        GROUP BY m.id, v.license_plate, co.name ORDER BY m.manifest_date DESC, m.id DESC
        LIMIT ${ROW_LIMIT + 1}`;
      const { rows: page, truncated } = capped(rows);
      return {
        columns: [
          { key: "manifest", label: "Manifest No." },
          { key: "tanggal", label: "Tanggal (Asia/Jakarta)" },
          { key: "kendaraan", label: "Kendaraan" },
          { key: "kurir", label: "Kurir" },
          count("AWB", "awb"),
          count("AWB tanpa biaya input", "tanpa_tarif"),
          money("Pendapatan (Rp)", "pendapatan"),
          money("Biaya (Rp)", "biaya"),
          money("GP (Rp)", "gp"),
          count("AWB tanpa biaya", "tanpa_biaya"),
        ],
        rows: page,
        truncated,
        totals: sumColumns(
          page,
          ["awb", "tanpa_tarif", "pendapatan", "biaya", "gp", "tanpa_biaya"],
          { manifest: "Total" },
        ),
      };
    },
  },
  "gross-profit-recap": {
    title: "Rekap Gross Profit",
    resource: "financial_report",
    definition:
      "Rekap Gross Profit / Manifest per kendaraan (No. Polisi) dalam periode tanggal manifest, dengan definisi Pendapatan, Biaya dan GP yang sama.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT COALESCE(v.license_plate, 'Tanpa kendaraan') AS kendaraan,
               count(DISTINCT m.id)::int AS manifest,
               count(mi.id)::int AS awb,
               count(mi.id) FILTER (WHERE t.biaya IS NULL)::int AS tanpa_tarif,
               COALESCE(sum(t.biaya), 0)::text AS pendapatan,
               COALESCE(sum(nc.cost), 0)::text AS biaya,
               (COALESCE(sum(t.biaya), 0) - COALESCE(sum(nc.cost), 0))::text AS gp
        FROM manifests m
        LEFT JOIN manifest_items mi ON mi.manifest_id = m.id AND mi.deleted_at IS NULL AND mi.released_at IS NULL
        LEFT JOIN transactions t ON t.id = mi.transaction_id
        LEFT JOIN ${netCost} nc ON nc.transaction_id = t.id
        LEFT JOIN vehicles v ON v.id = m.vehicle_id
        WHERE m.deleted_at IS NULL AND ${branchScope(actor, f, Prisma.sql`m.branch_id`)}
          AND m.manifest_date >= ${f.from} AND m.manifest_date < ${f.toExclusive}
        GROUP BY 1 ORDER BY 1`;
      return {
        columns: [
          { key: "kendaraan", label: "No. Polisi" },
          count("Manifest", "manifest"),
          count("AWB", "awb"),
          count("AWB tanpa biaya input", "tanpa_tarif"),
          money("Pendapatan (Rp)", "pendapatan"),
          money("Biaya (Rp)", "biaya"),
          money("GP (Rp)", "gp"),
        ],
        rows,
        totals: sumColumns(
          rows,
          ["manifest", "awb", "tanpa_tarif", "pendapatan", "biaya", "gp"],
          { kendaraan: "Total" },
        ),
      };
    },
  },
  "manifest-vendor": {
    title: "Manifest Vendor",
    resource: "manifest_report",
    definition:
      "Satu baris per vendor yang dipilih saat membuat manifest, dalam periode tanggal manifest: jumlah manifest, AWB aktif, koli dan berat. Manifest lama tanpa vendor dikelompokkan 'Tanpa vendor'.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT COALESCE(vd.name, 'Tanpa vendor') AS vendor,
               count(DISTINCT m.id)::int AS manifest,
               count(mi.id)::int AS awb,
               count(mi.id) FILTER (WHERE t.koli IS NULL OR t.kilo IS NULL OR t.biaya IS NULL)::int AS tidak_lengkap,
               COALESCE(sum(t.koli), 0)::int AS koli,
               COALESCE(sum(t.kilo), 0)::text AS kilo
        FROM manifests m
        LEFT JOIN vendors vd ON vd.id = m.vendor_id
        LEFT JOIN manifest_items mi ON mi.manifest_id = m.id AND mi.deleted_at IS NULL AND mi.released_at IS NULL
        LEFT JOIN transactions t ON t.id = mi.transaction_id
        WHERE m.deleted_at IS NULL AND ${branchScope(actor, f, Prisma.sql`m.branch_id`)}
          AND m.manifest_date >= ${f.from} AND m.manifest_date < ${f.toExclusive}
        GROUP BY m.vendor_id, vd.name ORDER BY 2 DESC, 1`;
      return {
        columns: [
          { key: "vendor", label: "Vendor" },
          count("Manifest", "manifest"),
          count("AWB", "awb"),
          count("AWB data belum lengkap", "tidak_lengkap"),
          count("Koli", "koli"),
          count("Berat (kg)", "kilo"),
        ],
        rows,
        totals: sumColumns(
          rows,
          ["manifest", "awb", "tidak_lengkap", "koli", "kilo"],
          {
            vendor: "Total",
          },
        ),
      };
    },
  },
  shipments: {
    title: "Pengiriman",
    resource: "transaction_report",
    definition:
      "Daftar AWB per customer menurut tanggal transaksi: layanan, moda, tujuan, koli, berat, status dan penerima. Maksimal 2.000 baris.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT t.awb_no AS awb, to_char((t.transaction_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS tanggal,
               c.name AS customer, ds.name AS layanan, tm.name AS moda,
               db.name AS tujuan, t.receiver_name AS penerima,
               t.koli, t.kilo::text AS kilo, t.status
        FROM transactions t
        LEFT JOIN customers c ON c.id = t.customer_id
        LEFT JOIN delivery_services ds ON ds.id = t.delivery_service_id
        LEFT JOIN transport_modes tm ON tm.id = t.transport_mode_id
        LEFT JOIN branches db ON db.id = t.destination_branch_id
        WHERE ${transactionScope(actor, f)}
          AND t.transaction_date >= ${f.from} AND t.transaction_date < ${f.toExclusive}
        ORDER BY c.name NULLS LAST, t.transaction_date DESC, t.id DESC LIMIT ${ROW_LIMIT + 1}`;
      return {
        columns: [
          { key: "awb", label: "AWB No." },
          { key: "tanggal", label: "Tanggal (Asia/Jakarta)" },
          { key: "customer", label: "Customer" },
          { key: "layanan", label: "Layanan" },
          { key: "moda", label: "Moda" },
          { key: "tujuan", label: "Tujuan" },
          { key: "penerima", label: "Penerima" },
          count("Koli", "koli"),
          count("Berat (kg)", "kilo"),
          { key: "status", label: "Status" },
        ],
        ...capped(rows),
      };
    },
  },
  pod: {
    title: "POD Kembali",
    resource: "transaction_report",
    definition:
      "AWB yang tercatat berhasil diantar (hasil DELIVERED di lembar pengantaran) dalam periode tanggal DRS, dengan nama penerima dan waktu terima sebagai bukti antar (POD). Belum ada pencatatan fisik dokumen POD kembali ke kantor.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT t.awb_no AS awb, c.name AS customer, ds.sheet_no AS drs,
               to_char((ds.delivery_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS tanggal,
               i.received_by AS diterima,
               to_char((i.delivered_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') AS waktu
        FROM delivery_sheet_items i
        JOIN delivery_sheets ds ON ds.id = i.delivery_sheet_id
        JOIN manifests m ON m.id = ds.manifest_id AND m.deleted_at IS NULL
        JOIN transactions t ON t.id = i.transaction_id
        LEFT JOIN customers c ON c.id = t.customer_id
        WHERE i.deleted_at IS NULL AND i.outcome = 'DELIVERED'
          AND ${transactionScope(actor, f)}
          AND ds.delivery_date >= ${f.from} AND ds.delivery_date < ${f.toExclusive}
        ORDER BY ds.delivery_date DESC, i.id DESC LIMIT ${ROW_LIMIT + 1}`;
      return {
        columns: [
          { key: "awb", label: "AWB No." },
          { key: "customer", label: "Customer" },
          { key: "drs", label: "DRS No." },
          { key: "tanggal", label: "Tanggal DRS (Asia/Jakarta)" },
          { key: "diterima", label: "Diterima oleh" },
          { key: "waktu", label: "Waktu terima (Asia/Jakarta)" },
        ],
        ...capped(rows),
      };
    },
  },
  "void-awb": {
    title: "Void AWB",
    resource: "transaction",
    definition:
      "AWB berstatus Cancelled atau sudah dihapus, menurut tanggal transaksi dalam periode. Hapus AWB lewat Persetujuan Edit/delete AWB; pembatalan tercatat di riwayat status.",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT t.awb_no AS awb, to_char((t.transaction_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS tanggal,
               t.do_no AS do_no, db.name AS tujuan, t.sender_name AS pengirim,
               t.receiver_name AS penerima, t.koli, t.kilo::text AS kilo,
               t.biaya::text AS biaya,
               CASE WHEN t.deleted_at IS NOT NULL THEN 'Dihapus' ELSE t.status END AS keterangan,
               to_char((COALESCE(t.deleted_at, h.changed_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') AS waktu,
               COALESCE(CASE WHEN t.deleted_at IS NOT NULL THEN da.name END, u.name) AS oleh,
               d.reason AS alasan
        FROM transactions t
        LEFT JOIN branches db ON db.id = t.destination_branch_id
        LEFT JOIN LATERAL (
          SELECT sh.changed_at, sh.actor_id FROM transaction_status_history sh
          WHERE sh.transaction_id = t.id AND sh.new_status = 'Cancelled'
          ORDER BY sh.changed_at DESC LIMIT 1) h ON TRUE
        LEFT JOIN auth_users u ON u.id = h.actor_id
        LEFT JOIN LATERAL (
          SELECT r.reason, r.decided_by_id FROM awb_change_requests r
          WHERE r.transaction_id = t.id AND r.kind = 'DELETE' AND r.status = 'APPROVED'
          ORDER BY r.decided_at DESC LIMIT 1) d ON TRUE
        LEFT JOIN auth_users da ON da.id = d.decided_by_id
        WHERE (t.deleted_at IS NOT NULL OR t.status = 'Cancelled')
          AND ${branchScopeAny(actor, f)}
          AND t.transaction_date >= ${f.from} AND t.transaction_date < ${f.toExclusive}
        ORDER BY t.transaction_date DESC, t.id DESC LIMIT ${ROW_LIMIT + 1}`;
      return {
        columns: [
          { key: "awb", label: "AWB No." },
          { key: "tanggal", label: "Tanggal (Asia/Jakarta)" },
          { key: "do_no", label: "DO No." },
          { key: "tujuan", label: "Tujuan" },
          { key: "pengirim", label: "Pengirim" },
          { key: "penerima", label: "Penerima" },
          count("Koli", "koli"),
          count("Berat (kg)", "kilo"),
          money("Biaya (Rp)", "biaya"),
          { key: "keterangan", label: "Keterangan" },
          { key: "oleh", label: "Dibatalkan/disetujui oleh" },
          { key: "alasan", label: "Alasan hapus" },
          { key: "waktu", label: "Waktu (Asia/Jakarta)" },
        ],
        ...capped(rows),
      };
    },
  },
  "status-history": {
    title: "Histori Resi",
    resource: "transaction",
    definition:
      "Riwayat perubahan AWB menurut waktu perubahan dalam periode: perubahan status (dari, ke, alasan, oleh) dan edit data yang disetujui lewat Persetujuan Edit/delete AWB (nilai sebelum dan sesudah).",
    async run(actor, f, tx) {
      const rows = await tx.$queryRaw<Row[]>`
        SELECT awb, to_char((at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') AS waktu, jenis, dari, ke, alasan, oleh
        FROM (
          SELECT t.awb_no AS awb, h.changed_at AS at, 'Status' AS jenis,
                 COALESCE(h.prior_status, '-') AS dari, h.new_status AS ke,
                 h.reason AS alasan, u.name AS oleh, h.id AS sort_id
          FROM transaction_status_history h
          JOIN transactions t ON t.id = h.transaction_id
          LEFT JOIN auth_users u ON u.id = h.actor_id
          WHERE ${branchScopeAny(actor, f)}
            AND h.changed_at >= ${f.from} AND h.changed_at < ${f.toExclusive}
          UNION ALL
          SELECT t.awb_no, r.used_at, 'Edit data',
                 (SELECT string_agg(c.key || ': ' || COALESCE(c.value->>0, '-'), '; ' ORDER BY c.key) FROM jsonb_each(r.changes) c),
                 (SELECT string_agg(c.key || ': ' || COALESCE(c.value->>1, '-'), '; ' ORDER BY c.key) FROM jsonb_each(r.changes) c),
                 r.reason, u.name, r.id
          FROM awb_change_requests r
          JOIN transactions t ON t.id = r.transaction_id
          LEFT JOIN auth_users u ON u.id = r.requested_by_id
          WHERE r.status = 'USED' AND r.changes IS NOT NULL
            AND ${branchScopeAny(actor, f)}
            AND r.used_at >= ${f.from} AND r.used_at < ${f.toExclusive}
        ) x
        ORDER BY at DESC, sort_id DESC LIMIT ${ROW_LIMIT + 1}`;
      return {
        columns: [
          { key: "awb", label: "AWB No." },
          { key: "waktu", label: "Waktu (Asia/Jakarta)" },
          { key: "jenis", label: "Jenis" },
          { key: "dari", label: "Sebelum" },
          { key: "ke", label: "Sesudah" },
          { key: "alasan", label: "Alasan" },
          { key: "oleh", label: "Oleh" },
        ],
        ...capped(rows),
      };
    },
  },
};
