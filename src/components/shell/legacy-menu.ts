// Read-only source inventory of legacy components/header.jsx MENU ordering.
export const legacyMenu = [
  {
    label: "Dashboard",
    href: "/",
  },
  {
    label: "Sistem Setting",
    children: [
      {
        label: "Grup User",
        href: "/group-user",
      },
      {
        label: "Manajemen User",
        href: "/user-management",
      },
      {
        label: "Hak Akses Menu",
        href: "/hak-akses-menu",
      },
    ],
  },
  {
    label: "Kantor",
    href: "/office",
  },
  {
    label: "Master Data",
    children: [
      {
        label: "Logistik",
        children: [
          {
            label: "Area Logistik",
            href: "/logistics/areas",
          },
          {
            label: "Divisi Logistik",
            href: "/logistics/division",
          },
          {
            label: "Layanan Logistik",
            href: "/logistics/services",
          },
          {
            label: "Kendaraan Logistik",
            href: "/logistics/vehicles",
          },
        ],
      },
      {
        label: "Vendor",
        href: "/vendor",
      },
      {
        label: "Shipment Status",
        href: "/shipment-status",
      },
    ],
  },
  {
    label: "Modul",
    children: [
      {
        label: "Pemasaran/Penjualan",
        children: [
          // Fitur 2 (2026-11-27): one item per page; tabs inside the page.
          { label: "Customer & Penerima", href: "/marketing?tab=customer" },
          { label: "Pendapatan Pelanggan", href: "/marketing/revenue" },
        ],
      },
      {
        label: "Layanan Pelanggan / Transaksi",
        children: [
          {
            label: "AWB (Outbound, Inbound, Print)",
            href: "/transactions",
          },
          {
            label: "Persetujuan Edit/delete AWB",
            href: "/transactions/approvals",
          },
          {
            label: "Void AWB & History Delete Resi",
            href: "/transactions/void",
          },
          { label: "COD (Cod List, Kas Terima)", href: "/cod" },
        ],
      },
      {
        label: "Layanan Pelanggan",
        children: [
          {
            label: "Status Pengantaran",
            href: "/customer-service/status-pengantaran",
          },
          { label: "Cek Ongkir", href: "/customer-service/cek-ongkir" },
          { label: "Cek Resi", href: "/transactions/lookup" },
          { label: "Histori Edit Resi", href: "/transactions/history" },
          { label: "Booking (Outbound, Inbound)", href: "/bookings" },
        ],
      },
      {
        label: "Transaksi Agent",
        children: [
          { label: "AWB Agent (On Site, Print)", href: "/agent-awb" },
          { label: "History Deposit Agent", href: "/agent-deposit" },
        ],
      },
      {
        label: "Operasional / Manifest",
        children: [
          {
            label: "Manifest (Outbound, Transit, Inbound, Agen, Print)",
            href: "/manifest",
          },
        ],
      },
      {
        label: "Operasional / Lembar Pengantaran",
        children: [
          { label: "Kurir Kota & Print DRS", href: "/delivery-sheets" },
        ],
      },
      {
        label: "Operasional",
        children: [
          { label: "POD Kembali & Approval", href: "/pod-returns" },
          { label: "Proses Vendor", href: "/vendor-processes" },
        ],
      },
      {
        label: "Keuangan",
        children: [
          { label: "Invoice", href: "/finance/invoices" },
          { label: "Pembayaran Hutang", href: "/finance/debt-payments" },
        ],
      },
    ],
  },
  {
    // Sandbox order (2026-11-24): Modul, Akunting, Laporan.
    label: "Akunting",
    href: "/akunting",
  },
  {
    label: "Laporan",
    children: [
      {
        label: "Laporan Cabang",
        children: [
          {
            label: "Detail Transaksi",
            href: "/branch-reports/transaction-details",
          },
          {
            label: "Rekap Transaksi",
            href: "/branch-reports/rekap-transaksi",
          },
          {
            label: "Manifest Outbound",
            href: "/branch-reports/manifest-outbound",
          },
          {
            label: "Rekap Manifest",
            href: "/branch-reports/rekap-manifest",
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
            label: "Rekap Transaksi Harian",
            href: "/branch-reports/rekap-transaksi-harian",
          },
          {
            label: "Rekap Gross Profit",
            href: "/branch-reports/rekap-gross-profit",
          },
          {
            label: "Manifest Vendor",
            href: "/branch-reports/manifest-vendor",
          },
          {
            label: "AWB Tertunda & Termanifest",
            href: "/branch-reports/awb?view=pending",
          },
          {
            label: "Rekap Customer BUlanan",
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
          { label: "Report Cod", href: "/branch-reports/report-cod" },
        ],
      },
      {
        label: "Laporan Kurir",
        children: [
          { label: "Harian Kurir", href: "/courier-reports" },
          { label: "Laporan Detail Kurir", href: "/courier-reports/detail" },
        ],
      },
      {
        label: "Laporan Agen",
        children: [
          { label: "Transaksi & Komisi Agen", href: "/agent-reports" },
        ],
      },
      {
        label: "Laporan Keuangan",
        children: [
          { label: "Laporan AR", href: "/financial-reports/aging" },
          { label: "Laporan AP", href: "/financial-reports/ap-aging" },
          { label: "Laporan Keuntungan", href: "/financial-reports/profit" },
          { label: "Umur Piutang per Customer", href: "/financial-reports" },
        ],
      },
      {
        label: "Customer Reports",
        children: [
          { label: "Pengiriman", href: "/customer-reports/shipments" },
          { label: "POD Kembali", href: "/customer-reports/pod" },
          {
            label: "Semua Status",
            href: "/customer-reports/all-status",
          },
        ],
      },
      { label: "Report Customer", href: "/report-customer" },
    ],
  },
  {
    label: "Share Truck",
    children: [
      { label: "Dashboard Share Truck", href: "/share-truck" },
      { label: "Order Charter (Masuk, Keluar)", href: "/share-truck/orders" },
      { label: "Status (Update, Cek)", href: "/share-truck/status" },
      { label: "Invoice (Keluar, Masuk)", href: "/share-truck/invoices" },
      { label: "Ready Truck", href: "/share-truck/ready" },
    ],
  },
  {
    label: "Ticketing",
    children: [{ label: "Tiket Support & Persetujuan", href: "/ticketting" }],
  },
] as const;
