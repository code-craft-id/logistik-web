import type { PreviewScreen } from "@/components/patterns/preview-contract";

// Source-derived UI metadata only; never consumes a DRAFT model or legacy data.
export const screens = {
  "/branch-reports": {
    path: "/branch-reports",
    title: "Laporan Cabang",
    source: "src/pages/reports/branch/BranchReportsIndex.jsx",
    kind: "index",
    integration: "Awaiting approved report definitions and source queries.",
    views: [],
    links: [
      {
        label: "Detail Transaksi",
        href: "/branch-reports/transaction-details",
      },
      {
        label: "Manifest Outbound",
        href: "/branch-reports/manifest-outbound",
      },
      {
        label: "Pengantaran",
        href: "/branch-reports/delivery",
      },
      {
        label: "Gross Profit",
        href: "/branch-reports/gross-profit",
      },
      {
        label: "Rekap Gross Profit",
        href: "/branch-reports/rekap-gross-profit",
      },
      {
        label: "Penjual Manifes",
        href: "/branch-reports/manifest-vendor",
      },
      {
        label: "AWB",
        href: "/branch-reports/awb",
      },
      {
        label: "Rekap Customer Bulanan",
        href: "/branch-reports/customer-monthly-summary",
      },
      {
        label: "Rekap Omset Harian",
        href: "/branch-reports/daily-turnover-summary",
      },
      {
        label: "Detail Transaksi Inbound",
        href: "/branch-reports/inbound-transaction-details",
      },
    ],
  },
  "/branch-reports/transaction-details": {
    path: "/branch-reports/transaction-details",
    title: "Detail Transaksi",
    source: "src/pages/reports/branch/TransactionDetailsReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "detail-transaksi",
        label: "Detail Transaksi",
        columns: [
          {
            key: "date",
            label: "Tanggal",
            type: "date",
          },
          {
            key: "awbNo",
            label: "No. AWB",
            type: "text",
          },
          {
            key: "doNo",
            label: "No. DO",
            type: "text",
          },
          {
            key: "branch",
            label: "Cabang",
            type: "text",
          },
          {
            key: "sender",
            label: "Pengirim",
            type: "text",
          },
          {
            key: "receiver",
            label: "Penerima",
            type: "text",
          },
          {
            key: "destination",
            label: "Tujuan",
            type: "text",
          },
          {
            key: "koli",
            label: "Koli",
            type: "number",
          },
          {
            key: "kilo",
            label: "Kg",
            type: "number",
          },
          {
            key: "volume",
            label: "Volume",
            type: "number",
          },
          {
            key: "tarif",
            label: "Tarif (Rp.)",
            type: "currency",
          },
          {
            key: "status",
            label: "Status",
            type: "status",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Tanggal Dari",
            type: "date",
          },
          {
            key: "dateTo",
            label: "Tanggal Sampai",
            type: "date",
          },
          {
            key: "branch",
            label: "Cabang",
            type: "select",
            options: ["Preview A", "Preview B"],
          },
        ],
        summaries: ["Total Transaksi", "Total Koli", "Total Kg", "Total Omset"],
        tools: ["Export Excel"],
        actions: [],
      },
    ],
  },
  "/branch-reports/manifest-outbound": {
    path: "/branch-reports/manifest-outbound",
    title: "Manifest Outbound",
    source: "src/pages/reports/branch/ManifestOutboundReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "manifest-outbound",
        label: "Manifest Outbound",
        columns: [
          {
            key: "date",
            label: "Tanggal",
            type: "date",
          },
          {
            key: "manifestNo",
            label: "No. Manifest",
            type: "text",
          },
          {
            key: "branch",
            label: "Cabang",
            type: "text",
          },
          {
            key: "transit1",
            label: "Transit 1",
            type: "text",
          },
          {
            key: "transit2",
            label: "Transit 2",
            type: "text",
          },
          {
            key: "transit3",
            label: "Transit 3",
            type: "text",
          },
          {
            key: "tujuan",
            label: "Tujuan",
            type: "text",
          },
          {
            key: "driver",
            label: "Driver",
            type: "text",
          },
          {
            key: "nopol",
            label: "No. Polisi",
            type: "text",
          },
          {
            key: "totAwb",
            label: "Tot. AWB",
            type: "number",
          },
          {
            key: "totKoli",
            label: "Tot. Koli",
            type: "number",
          },
          {
            key: "totKg",
            label: "Tot. Kg",
            type: "number",
          },
          {
            key: "totBiaya",
            label: "Tot. Biaya (Rp.)",
            type: "currency",
          },
          {
            key: "status",
            label: "Status",
            type: "status",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Tanggal Dari",
            type: "date",
          },
          {
            key: "dateTo",
            label: "Tanggal Sampai",
            type: "date",
          },
          {
            key: "branch",
            label: "Cabang",
            type: "select",
            options: ["Preview A", "Preview B"],
          },
        ],
        summaries: ["Jumlah Manifest", "Total AWB", "Total Kg", "Total Biaya"],
        tools: ["Export Excel"],
        actions: [],
      },
    ],
  },
  "/branch-reports/delivery": {
    path: "/branch-reports/delivery",
    title: "Pengantaran",
    source: "src/pages/reports/branch/DeliveryReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "pengantaran",
        label: "Pengantaran",
        columns: [
          {
            key: "date",
            label: "Tanggal",
            type: "date",
          },
          {
            key: "awbNo",
            label: "No. AWB",
            type: "text",
          },
          {
            key: "receiver",
            label: "Penerima",
            type: "text",
          },
          {
            key: "address",
            label: "Alamat Tujuan",
            type: "text",
          },
          {
            key: "destination",
            label: "Kota Tujuan",
            type: "text",
          },
          {
            key: "courier",
            label: "Kurir",
            type: "text",
          },
          {
            key: "kendaraan",
            label: "Kendaraan",
            type: "text",
          },
          {
            key: "sentAt",
            label: "Waktu Kirim",
            type: "text",
          },
          {
            key: "receivedAt",
            label: "Waktu Terima",
            type: "text",
          },
          {
            key: "status",
            label: "Status",
            type: "status",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Tanggal Dari",
            type: "date",
          },
          {
            key: "dateTo",
            label: "Tanggal Sampai",
            type: "date",
          },
        ],
        summaries: ["Total Pengantaran", "Selesai", "Dalam Proses", "Gagal"],
        tools: ["Export Excel"],
        actions: [],
      },
    ],
  },
  "/branch-reports/gross-profit": {
    path: "/branch-reports/gross-profit",
    title: "Gross Profit",
    source: "src/pages/reports/branch/GrossProfitReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "gross-profit",
        label: "Gross Profit",
        columns: [
          {
            key: "manifestNo",
            label: "Manifest No.",
            type: "text",
          },
          {
            key: "date",
            label: "Tanggal",
            type: "date",
          },
          {
            key: "tujuan",
            label: "Tujuan",
            type: "text",
          },
          {
            key: "totAwb",
            label: "Tot. AWB",
            type: "number",
          },
          {
            key: "totKoli",
            label: "Tot. Koli",
            type: "number",
          },
          {
            key: "totKg",
            label: "Tot. Kg",
            type: "number",
          },
          {
            key: "totVolume",
            label: "Tot. Volume",
            type: "number",
          },
          {
            key: "totBiaya",
            label: "Tot. Biaya (Rp.)",
            type: "currency",
          },
          {
            key: "kendaraan",
            label: "Kendaraan",
            type: "text",
          },
          {
            key: "driver",
            label: "Driver",
            type: "text",
          },
        ],
        fields: [],
        filters: [
          {
            key: "month",
            label: "Bulan",
            type: "month",
          },
          {
            key: "year",
            label: "Tahun",
            type: "number",
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["Destination", "Transit", "Vendor"],
          },
        ],
        tools: ["Export Excel"],
        actions: ["Detail"],
        detailLabels: ["Status", "Rute", "Tujuan"],
      },
    ],
  },
  "/branch-reports/rekap-gross-profit": {
    path: "/branch-reports/rekap-gross-profit",
    title: "Rekap Gross Profit",
    source: "src/pages/reports/branch/RekapGrossProfitReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "rekap-gross-profit",
        label: "Rekap Gross Profit",
        columns: [
          {
            key: "nopol",
            label: "No. Polisi",
            type: "text",
          },
          {
            key: "manifestNo",
            label: "No. Manifests",
            type: "text",
          },
          {
            key: "tujuan",
            label: "Tujuan",
            type: "text",
          },
          {
            key: "driver",
            label: "Driver",
            type: "text",
          },
          {
            key: "date",
            label: "Tgl. Manifests",
            type: "date",
          },
          {
            key: "createdBy",
            label: "Dibuat Oleh",
            type: "text",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Tanggal Dari",
            type: "date",
          },
          {
            key: "dateTo",
            label: "Tanggal Sampai",
            type: "date",
          },
          {
            key: "branch",
            label: "Cabang",
            type: "select",
            options: ["Preview A", "Preview B"],
          },
          {
            key: "origin",
            label: "Origin",
            type: "select",
            required: false,
            table: true,
            options: [],
          },
        ],
        summaries: [],
        tools: ["Export Excel"],
        actions: [],
      },
    ],
  },
  "/branch-reports/manifest-vendor": {
    path: "/branch-reports/manifest-vendor",
    title: "Penjual Manifes",
    source: "src/pages/reports/branch/ManifestVendorReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "penjual-manifes",
        label: "Penjual Manifes",
        columns: [
          {
            key: "manifestNo",
            label: "Manifes No.",
            type: "text",
          },
          {
            key: "date",
            label: "Tanggal",
            type: "date",
          },
          {
            key: "asal",
            label: "Asal",
            type: "text",
          },
          {
            key: "penjual",
            label: "Penjual",
            type: "text",
          },
          {
            key: "totAwb",
            label: "Tot. AWB",
            type: "number",
          },
          {
            key: "totKoli",
            label: "Tot. Koli",
            type: "number",
          },
          {
            key: "totBerat",
            label: "Tot. Berat",
            type: "number",
          },
          {
            key: "totVolume",
            label: "Tot. Volume",
            type: "number",
          },
          {
            key: "totBiaya",
            label: "Tot. Biaya (Rp.)",
            type: "currency",
          },
          {
            key: "kendaraan",
            label: "Kendaraan",
            type: "text",
          },
          {
            key: "sopir",
            label: "Sopir",
            type: "text",
          },
          {
            key: "status",
            label: "Status",
            type: "status",
          },
        ],
        fields: [],
        filters: [
          {
            key: "month",
            label: "Bulan",
            type: "month",
          },
          {
            key: "year",
            label: "Tahun",
            type: "number",
          },
          {
            key: "penjual",
            label: "Penjual",
            type: "select",
          },
          {
            key: "pengguna",
            label: "Pengguna",
            type: "select",
          },
        ],
        tools: ["Export Excel"],
        actions: ["Detail"],
        detailLabels: ["Rute", "Pengguna"],
      },
    ],
  },
  "/branch-reports/awb": {
    path: "/branch-reports/awb",
    title: "AWB",
    source: "src/pages/reports/branch/AwbReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "awb-tertunda",
        label: "AWB Tertunda",
        columns: [
          {
            key: "awbKoliNo",
            label: "AWB Koli No.",
            type: "text",
          },
          {
            key: "awbNo",
            label: "AWB No.",
            type: "text",
          },
          {
            key: "doNo",
            label: "DO No.",
            type: "text",
          },
          {
            key: "date",
            label: "Tanggal",
            type: "date",
          },
          {
            key: "tujuan",
            label: "Tujuan",
            type: "text",
          },
          {
            key: "moda",
            label: "Moda",
            type: "text",
          },
          {
            key: "koli",
            label: "Koli",
            type: "number",
          },
          {
            key: "berat",
            label: "Berat",
            type: "number",
          },
          {
            key: "volume",
            label: "Volume",
            type: "number",
          },
          {
            key: "totalBiaya",
            label: "Total Biaya",
            type: "currency",
          },
        ],
        fields: [],
        filters: [
          {
            key: "tujuan",
            label: "Tujuan",
            type: "select",
          },
        ],
        tools: ["Export Excel"],
        actions: ["Detail"],
        detailLabels: ["AWB No.", "Tujuan"],
      },
      {
        id: "awb-termanifest",
        label: "AWB Termanifest",
        columns: [
          {
            key: "awbNo",
            label: "AWB No.",
            type: "text",
          },
          {
            key: "doNo",
            label: "DO No.",
            type: "text",
          },
          {
            key: "manifestNo",
            label: "Manifes No.",
            type: "text",
          },
          {
            key: "date",
            label: "Tanggal",
            type: "date",
          },
          {
            key: "tujuan",
            label: "Tujuan",
            type: "text",
          },
          {
            key: "moda",
            label: "Moda",
            type: "text",
          },
          {
            key: "koli",
            label: "Koli",
            type: "number",
          },
          {
            key: "berat",
            label: "Berat",
            type: "number",
          },
          {
            key: "volume",
            label: "Volume",
            type: "number",
          },
          {
            key: "totalBiaya",
            label: "Total Biaya",
            type: "currency",
          },
        ],
        fields: [],
        filters: [
          {
            key: "month",
            label: "Bulan",
            type: "month",
          },
          {
            key: "pengguna",
            label: "Pengguna",
            type: "select",
          },
          {
            key: "tujuan",
            label: "Tujuan",
            type: "select",
          },
        ],
        tools: ["Export Excel"],
        actions: ["Detail"],
        detailLabels: ["Manifes No.", "Tujuan"],
      },
    ],
  },
  "/branch-reports/customer-monthly-summary": {
    path: "/branch-reports/customer-monthly-summary",
    title: "Rekap Customer Bulanan",
    source: "src/pages/reports/branch/CustomerMonthlySummaryReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "rekap-customer-bulanan",
        label: "Rekap Customer Bulanan",
        columns: [
          {
            key: "no",
            label: "NO.",
            type: "text",
          },
          {
            key: "namaPelanggan",
            label: "Nama Pelanggan",
            type: "text",
          },
          {
            key: "totalAwb",
            label: "Total AWB",
            type: "text",
          },
          {
            key: "kg",
            label: "Kg",
            type: "text",
          },
          {
            key: "volume",
            label: "Volume",
            type: "text",
          },
          {
            key: "totalTransaksi",
            label: "Total Transaksi",
            type: "text",
          },
        ],
        fields: [],
        filters: [
          {
            key: "month",
            label: "Bulan",
            type: "month",
          },
          {
            key: "year",
            label: "Tahun",
            type: "number",
          },
          {
            key: "branch",
            label: "Cabang",
            type: "select",
            options: ["Preview A", "Preview B"],
          },
        ],
        tools: ["Export Excel"],
        actions: [],
      },
    ],
  },
  "/branch-reports/daily-turnover-summary": {
    path: "/branch-reports/daily-turnover-summary",
    title: "Rekap Omset Harian",
    source: "src/pages/reports/branch/DailyTurnoverSummaryReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "rekap-omset-harian",
        label: "Rekap Omset Harian",
        columns: [
          {
            key: "no",
            label: "NO.",
            type: "text",
          },
          {
            key: "tanggal",
            label: "TANGGAL",
            type: "text",
          },
          {
            key: "tunai",
            label: "TOTAL TUNAI",
            type: "text",
          },
          {
            key: "bb",
            label: "TOTAL BB",
            type: "text",
          },
          {
            key: "bl",
            label: "TOTAL BL",
            type: "text",
          },
          {
            key: "transfer",
            label: "TOTAL TRANSFER",
            type: "text",
          },
          {
            key: "totalOmset",
            label: "TOTAL OMSET",
            type: "text",
          },
          {
            key: "darat",
            label: "DARAT",
            type: "text",
          },
          {
            key: "laut",
            label: "LAUT",
            type: "text",
          },
          {
            key: "udara",
            label: "UDARA",
            type: "text",
          },
        ],
        fields: [],
        filters: [
          {
            key: "month",
            label: "Bulan",
            type: "month",
          },
          {
            key: "year",
            label: "Tahun",
            type: "number",
          },
          {
            key: "branch",
            label: "Cabang",
            type: "select",
            options: ["Preview A", "Preview B"],
          },
        ],
        tools: ["Export Excel"],
        actions: [],
      },
    ],
  },
  "/branch-reports/inbound-transaction-details": {
    path: "/branch-reports/inbound-transaction-details",
    title: "Detail Transaksi Inbound",
    source: "src/pages/reports/branch/InboundTransactionDetailsReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "detail-transaksi-inbound",
        label: "Detail Transaksi Inbound",
        columns: [
          {
            key: "date",
            label: "Tanggal",
            type: "date",
          },
          {
            key: "awbNo",
            label: "No. AWB",
            type: "text",
          },
          {
            key: "manifestNo",
            label: "No. Manifest",
            type: "text",
          },
          {
            key: "sender",
            label: "Pengirim",
            type: "text",
          },
          {
            key: "receiver",
            label: "Penerima",
            type: "text",
          },
          {
            key: "origin",
            label: "Asal",
            type: "text",
          },
          {
            key: "koli",
            label: "Koli",
            type: "number",
          },
          {
            key: "kilo",
            label: "Kg",
            type: "number",
          },
          {
            key: "volume",
            label: "Volume",
            type: "number",
          },
          {
            key: "tarif",
            label: "Tarif (Rp.)",
            type: "currency",
          },
          {
            key: "status",
            label: "Status",
            type: "status",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Tanggal Dari",
            type: "date",
          },
          {
            key: "dateTo",
            label: "Tanggal Sampai",
            type: "date",
          },
        ],
        summaries: ["Total Transaksi", "Total Koli", "Total Kg", "Total Biaya"],
        tools: ["Export Excel"],
        actions: [],
      },
    ],
  },
  "/courier-reports": {
    path: "/courier-reports",
    title: "Laporan Kurir",
    source: "src/pages/reports/CourierReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "laporan-detail-kurir",
        label: "Laporan Detail Kurir",
        columns: [
          {
            key: "drsNo",
            label: "DRS No.",
            type: "text",
          },
          {
            key: "awbNo",
            label: "AWB No",
            type: "text",
          },
          {
            key: "kurir",
            label: "Kurir",
            type: "text",
          },
          {
            key: "date",
            label: "Tanggal",
            type: "date",
          },
          {
            key: "asal",
            label: "Asal",
            type: "text",
          },
          {
            key: "tujuan",
            label: "Tujuan",
            type: "text",
          },
          {
            key: "pengirim",
            label: "Pengirim",
            type: "text",
          },
          {
            key: "layanan",
            label: "Layanan",
            type: "text",
          },
          {
            key: "status",
            label: "Status",
            type: "text",
          },
          {
            key: "penerima",
            label: "Penerima",
            type: "text",
          },
          {
            key: "diterimaOleh",
            label: "Diterima Oleh",
            type: "text",
          },
          {
            key: "tglDiterima",
            label: "Tgl. Diterima",
            type: "date",
          },
          {
            key: "accIn",
            label: "Acc. in",
            type: "text",
          },
          {
            key: "lTime",
            label: "L.Time",
            type: "text",
          },
          {
            key: "sla",
            label: "SLA",
            type: "text",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Periode Dari",
            type: "date",
          },
          {
            key: "dateTo",
            label: "Periode Sampai",
            type: "date",
          },
          {
            key: "branch",
            label: "Branch",
            type: "select",
          },
          {
            key: "kurir",
            label: "Kurir",
            type: "select",
          },
          {
            key: "status",
            label: "Status",
            type: "select",
          },
        ],
        summaries: ["Tot. Sukses", "Tot. Pending", "Tot. Failed"],
        tools: ["Export Excel"],
        actions: [],
      },
      {
        id: "harian-kurir",
        label: "Harian Kurir",
        columns: [
          {
            key: "column-0",
            label: "Nama Kurir",
          },
          {
            key: "column-1",
            label: "Jumlah Terambil",
          },
          {
            key: "column-2",
            label: "Jumlah Miss Pickup",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Tanggal Dari",
            type: "date",
          },
          {
            key: "dateTo",
            label: "Tanggal Sampai",
            type: "date",
          },
        ],
        summaries: [],
        tools: ["Export Excel"],
        actions: [],
      },
    ],
  },
  "/financial-reports": {
    path: "/financial-reports",
    title: "Laporan Keuangan",
    source: "src/pages/reports/FinancialReport.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "laporan-ar",
        label: "Laporan AR",
        columns: [
          {
            key: "tanggalFaktur",
            label: "TANGGAL FAKTUR",
            type: "date",
          },
          {
            key: "noKwt",
            label: "NO KWT/INV",
            type: "text",
          },
          {
            key: "tanggalTerimaFaktur",
            label: "TANGGAL TERIMA FAKTUR",
            type: "date",
          },
          {
            key: "namaPenerimaFaktur",
            label: "NAMA PENERIMA FAKTUR",
            type: "text",
          },
          {
            key: "namaPerusahaan",
            label: "NAMA PERUSAHAAN",
            type: "text",
          },
          {
            key: "jumlahTagihan",
            label: "JUMLAH TAGIHAN",
            type: "currency",
          },
          {
            key: "ketentuan",
            label: "KETENTUAN",
            type: "text",
          },
          {
            key: "usiaFaktur",
            label: "USIA FAKTUR",
            type: "number",
          },
          {
            key: "b0_21",
            label: "0 S/D 21 HARI",
            type: "currency",
          },
          {
            key: "b21_30",
            label: "> 21 HARI = 30 HARI",
            type: "currency",
          },
          {
            key: "b30plus",
            label: "> 30 HARI",
            type: "currency",
          },
        ],
        fields: [],
        tableTitle: "REKAP AGING PELANGGAN",
        hideSearch: true,
        footerLabel: "HASIL AKHIR",
        filters: [
          {
            key: "month",
            label: "Bulan",
            type: "month",
          },
          {
            key: "year",
            label: "Tahun",
            type: "number",
          },
          {
            key: "entity",
            label: "Pelanggan",
            type: "select",
          },
        ],
        tools: ["Export Excel"],
        actions: [],
        supplementalViews: [
          {
            id: "laporan-ar-belum-lunas",
            label: "Belum Lunas",
            columns: [
              {
                key: "penjual",
                label: "PENJUAL",
                type: "text",
              },
              {
                key: "noFaktur",
                label: "NO FAKTUR",
                type: "text",
              },
              {
                key: "tanggal",
                label: "TANGGAL",
                type: "date",
              },
              {
                key: "status",
                label: "STATUS",
                type: "text",
              },
              {
                key: "totalBiaya",
                label: "TOTAL BIAYA",
                type: "currency",
              },
            ],
            fields: [],
            fixtureStatus: "Belum Lunas",
            tools: ["Export Excel"],
            actions: [],
          },
          {
            id: "laporan-ar-lunas",
            label: "Lunas",
            columns: [
              {
                key: "penjual",
                label: "PENJUAL",
                type: "text",
              },
              {
                key: "noFaktur",
                label: "NO FAKTUR",
                type: "text",
              },
              {
                key: "tanggal",
                label: "TANGGAL",
                type: "date",
              },
              {
                key: "status",
                label: "STATUS",
                type: "text",
              },
              {
                key: "totalBiaya",
                label: "TOTAL BIAYA",
                type: "currency",
              },
            ],
            fields: [],
            fixtureStatus: "Lunas",
            tools: ["Export Excel"],
            actions: [],
          },
        ],
      },
      {
        id: "laporan-ap",
        label: "Laporan AP",
        columns: [
          {
            key: "namaPerusahaan",
            label: "NAMA PERUSAHAAN",
            type: "text",
          },
          {
            key: "noKwt",
            label: "NO KWT/INV",
            type: "text",
          },
          {
            key: "tanggalFaktur",
            label: "TANGGAL FAKTUR",
            type: "date",
          },
          {
            key: "atas",
            label: "ATAS",
            type: "text",
          },
          {
            key: "batasWaktu",
            label: "BATAS WAKTU",
            type: "date",
          },
          {
            key: "jumlahTagihan",
            label: "JUMLAH TAGIHAN",
            type: "currency",
          },
          {
            key: "b0_30",
            label: "0-30",
            type: "currency",
          },
          {
            key: "b31_60",
            label: "31-60",
            type: "currency",
          },
          {
            key: "b61_90",
            label: "61-90",
            type: "currency",
          },
          {
            key: "b90plus",
            label: "> 90",
            type: "currency",
          },
          {
            key: "keterangan",
            label: "KETERANGAN",
            type: "text",
          },
        ],
        fields: [],
        tableTitle: "REKAP AGING PEMASOK",
        hideSearch: true,
        footerLabel: "HASIL AKHIR",
        filters: [
          {
            key: "month",
            label: "Bulan",
            type: "month",
          },
          {
            key: "year",
            label: "Tahun",
            type: "number",
          },
          {
            key: "entity",
            label: "Pemasok",
            type: "select",
          },
        ],
        tools: ["Export Excel"],
        actions: [],
        supplementalViews: [
          {
            id: "laporan-ap-belum-lunas",
            label: "Belum Lunas",
            columns: [
              {
                key: "penjual",
                label: "PENJUAL",
                type: "text",
              },
              {
                key: "noFaktur",
                label: "NO FAKTUR",
                type: "text",
              },
              {
                key: "tanggal",
                label: "TANGGAL",
                type: "date",
              },
              {
                key: "status",
                label: "STATUS",
                type: "text",
              },
              {
                key: "totalBiaya",
                label: "TOTAL BIAYA",
                type: "currency",
              },
            ],
            fields: [],
            fixtureStatus: "Belum Lunas",
            tools: ["Export Excel"],
            actions: [],
          },
          {
            id: "laporan-ap-lunas",
            label: "Lunas",
            columns: [
              {
                key: "penjual",
                label: "PENJUAL",
                type: "text",
              },
              {
                key: "noFaktur",
                label: "NO FAKTUR",
                type: "text",
              },
              {
                key: "tanggal",
                label: "TANGGAL",
                type: "date",
              },
              {
                key: "status",
                label: "STATUS",
                type: "text",
              },
              {
                key: "totalBiaya",
                label: "TOTAL BIAYA",
                type: "currency",
              },
            ],
            fields: [],
            fixtureStatus: "Lunas",
            tools: ["Export Excel"],
            actions: [],
          },
        ],
      },
    ],
  },
  "/customer-reports": {
    path: "/customer-reports",
    title: "Customer Reports",
    source: "src/pages/reports/CustomerReports.jsx",
    kind: "workspace",
    integration: "Awaiting approved report definitions and source queries.",
    views: [
      {
        id: "pengiriman",
        label: "Pengiriman",
        columns: [
          {
            key: "no",
            label: "No.",
            type: "text",
          },
          {
            key: "awbNo",
            label: "AWB No.",
            type: "text",
          },
          {
            key: "date",
            label: "AWB Date",
            type: "slash",
          },
          {
            key: "moda",
            label: "Moda",
            type: "text",
          },
          {
            key: "service",
            label: "Service",
            type: "text",
          },
          {
            key: "origin",
            label: "Origin",
            type: "text",
          },
          {
            key: "destination",
            label: "Destination",
            type: "text",
          },
          {
            key: "customer",
            label: "Customer",
            type: "text",
          },
          {
            key: "consignee",
            label: "Consignee",
            type: "text",
          },
          {
            key: "reffNo",
            label: "Reff No",
            type: "text",
          },
          {
            key: "shipperInstruction",
            label: "Shipper Instruction",
            type: "text",
          },
          {
            key: "weight",
            label: "Weight",
            type: "number",
          },
          {
            key: "collie",
            label: "Collie",
            type: "number",
          },
          {
            key: "status",
            label: "Shipment Status",
            type: "status",
          },
          {
            key: "receivedBy",
            label: "Received By",
            type: "text",
          },
          {
            key: "receivedDate",
            label: "Received Date",
            type: "slash",
          },
          {
            key: "leadtime",
            label: "Leadtime",
            type: "number",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Start Date",
            type: "date",
          },
          {
            key: "dateTo",
            label: "End Date",
            type: "date",
          },
          {
            key: "customer",
            label: "Customer",
            type: "select",
          },
          {
            key: "destination",
            label: "Destination",
            type: "select",
          },
        ],
        summaries: [],
        tools: ["Export Excel"],
        actions: [],
      },
      {
        id: "pod-kembali",
        label: "POD Kembali",
        columns: [
          {
            key: "no",
            label: "No.",
            type: "text",
          },
          {
            key: "awbNo",
            label: "AWB",
            type: "text",
          },
          {
            key: "date",
            label: "AWB Date",
            type: "slash",
          },
          {
            key: "destination",
            label: "Destination",
            type: "text",
          },
          {
            key: "consignee",
            label: "Consignee",
            type: "text",
          },
          {
            key: "reffNo",
            label: "Reff No",
            type: "text",
          },
          {
            key: "receivedBy",
            label: "Received By",
            type: "text",
          },
          {
            key: "podReceivedDate",
            label: "Received Date",
            type: "slash",
          },
          {
            key: "statusAWB",
            label: "Status AWB",
            type: "badge",
          },
          {
            key: "remarks",
            label: "Remarks",
            type: "text",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Start Date",
            type: "date",
          },
          {
            key: "dateTo",
            label: "End Date",
            type: "date",
          },
          {
            key: "origin",
            label: "Asal",
            type: "select",
          },
          {
            key: "destination",
            label: "Tujuan",
            type: "select",
          },
          {
            key: "customer",
            label: "Customer",
            type: "select",
          },
        ],
        summaries: [],
        tools: ["Export Excel"],
        actions: [],
      },
      {
        id: "semua-status",
        label: "Semua Status",
        columns: [
          {
            key: "awbNo",
            label: "AWB",
            type: "text",
          },
          {
            key: "date",
            label: "Date",
            type: "dmy",
          },
          {
            key: "moda",
            label: "Moda",
            type: "text",
          },
          {
            key: "service",
            label: "Service",
            type: "text",
          },
          {
            key: "origin",
            label: "Origin",
            type: "text",
          },
          {
            key: "destination",
            label: "Destination",
            type: "text",
          },
          {
            key: "customer",
            label: "Shipper",
            type: "text",
          },
          {
            key: "consignee",
            label: "Consignee",
            type: "text",
          },
          {
            key: "collie",
            label: "Koli",
            type: "number",
          },
          {
            key: "weight",
            label: "Kilo",
            type: "number",
          },
          {
            key: "shipperInstruction",
            label: "Description",
            type: "text",
          },
          {
            key: "statusName",
            label: "Shipment Status",
            type: "badge",
          },
          {
            key: "receivedBy",
            label: "Received by",
            type: "text",
          },
          {
            key: "noManifest",
            label: "No Manifest",
            type: "text",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Periode Dari",
            type: "date",
          },
          {
            key: "dateTo",
            label: "Periode Sampai",
            type: "date",
          },
          {
            key: "asal",
            label: "Asal",
            type: "select",
          },
          {
            key: "tujuan",
            label: "Tujuan",
            type: "select",
          },
          {
            key: "customer",
            label: "Customer",
            type: "select",
          },
          {
            key: "billing",
            label: "Billing",
            type: "select",
          },
          {
            key: "status-kiriman",
            label: "Status Kiriman",
            type: "select",
          },
        ],
        summaries: ["Total POD", "Total Kilo", "Total Koli"],
        tools: ["Export Excel"],
        actions: [],
      },
      {
        id: "report-customer",
        label: "Report Customer",
        columns: [
          {
            key: "no",
            label: "No.",
            type: "text",
          },
          {
            key: "awb",
            label: "AWB",
            type: "text",
          },
          {
            key: "awbDate",
            label: "AWB Date",
            type: "text",
          },
          {
            key: "destination",
            label: "Destination",
            type: "text",
          },
          {
            key: "consignee",
            label: "Consignee",
            type: "text",
          },
          {
            key: "reffNo",
            label: "Reff No",
            type: "text",
          },
          {
            key: "receivedBy",
            label: "Received By",
            type: "text",
          },
          {
            key: "receivedDate",
            label: "Received Date",
            type: "text",
          },
          {
            key: "statusAWB",
            label: "Status AWB",
            type: "text",
          },
          {
            key: "remarks",
            label: "Remarks",
            type: "text",
          },
        ],
        fields: [],
        filters: [
          {
            key: "dateFrom",
            label: "Start Date",
            type: "date",
          },
          {
            key: "dateTo",
            label: "End Date",
            type: "date",
          },
          {
            key: "customer",
            label: "Customer",
            type: "select",
          },
          {
            key: "origin",
            label: "Origin",
            type: "select",
          },
          {
            key: "destination",
            label: "Destination",
            type: "select",
          },
          {
            key: "billing-type",
            label: "Billing Type",
            type: "select",
          },
        ],
        summaries: [],
        tools: ["Export Excel"],
        actions: [],
      },
    ],
  },
} satisfies Record<string, PreviewScreen>;
