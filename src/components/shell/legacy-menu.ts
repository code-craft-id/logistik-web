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
        label: "Area Logistik",
        children: [
          { label: "Provinsi", href: "/logistics/areas?kind=province" },
          { label: "Kabupaten", href: "/logistics/areas?kind=regency" },
          { label: "Kecamatan", href: "/logistics/areas?kind=district" },
          { label: "Kelurahan", href: "/logistics/areas?kind=village" },
          { label: "Kode Pos", href: "/logistics/areas?kind=postal_code" },
        ],
      },
      {
        label: "Divisi Logistik",
        children: [
          {
            label: "Pemasaran",
            href: "/logistics/division?kind=marketing_person",
          },
          { label: "Driver", href: "/logistics/division?kind=driver" },
          { label: "Kurir", href: "/logistics/division?kind=courier" },
        ],
      },
      {
        label: "Layanan Logistik",
        children: [
          { label: "Moda", href: "/logistics/services?kind=transport_mode" },
          {
            label: "Kategori Layanan",
            href: "/logistics/services?kind=service_category",
          },
          {
            label: "Layanan Pengantaran",
            href: "/logistics/services?kind=delivery_service",
          },
          {
            label: "Jenis Barang",
            href: "/logistics/services?kind=goods_type",
          },
          { label: "Jenis Biaya", href: "/logistics/services?kind=cost_type" },
          { label: "Termin", href: "/logistics/services?kind=term" },
        ],
      },
      {
        label: "Kendaraan Logistik",
        children: [
          {
            label: "Jenis Kendaraan",
            href: "/logistics/vehicles?kind=vehicle_type",
          },
          { label: "Kendaraan", href: "/logistics/vehicles?kind=vehicle" },
          {
            label: "Jenis Trucking",
            href: "/logistics/vehicles?kind=trucking_type",
          },
        ],
      },
      {
        label: "M. Vendor",
        children: [
          { label: "Vendor", href: "/vendor" },
          { label: "Layanan Vendor", href: "/vendor/services" },
        ],
      },
      {
        label: "Perkiraan",
        href: "/finance/accounting/accounts",
      },
      {
        label: "M.Shipment Status",
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
          { label: "Customer", href: "/marketing?tab=customer" },
          { label: "Penerima", href: "/marketing?tab=consignee" },
          { label: "Pendapatan Pelanggan", href: "/marketing/revenue" },
        ],
      },
      {
        label: "Layanan Pelanggan / Transaksi",
        children: [
          { label: "On Site Outbound", href: "/transactions" },
          { label: "On Site Inbound", href: "/transactions?tab=inbound" },
          { label: "Print AWB", href: "/transactions?print=1" },
          {
            label: "Persetujuan Edit/delete AWB",
            href: "/transactions/approvals",
          },
          { label: "Void Awb", href: "/transactions/void" },
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
          { label: "Booking", href: "/bookings" },
          { label: "Inbound Booking", href: "/bookings?tab=inbound" },
          {
            label: "History Delete Resi",
            href: "/transactions/void?view=deleted",
          },
        ],
      },
      {
        label: "Operasional / Manifest",
        children: [
          { label: "Manifest", href: "/manifest" },
          { label: "Cek Transit", href: "/manifest?type=Transit" },
          { label: "Cek Inbound", href: "/manifest?type=Inbound" },
          { label: "Cek Inbound Agen", href: "/manifest?view=agent" },
          { label: "Print Manifest", href: "/manifest?type=Outbound" },
        ],
      },
      {
        label: "Operasional / Lembar Pengantaran",
        children: [
          { label: "Kurir Kota", href: "/delivery-sheets" },
          { label: "Print DRS", href: "/delivery-sheets?tab=print" },
        ],
      },
      {
        label: "Operasional",
        children: [
          { label: "POD Kembali", href: "/pod-returns" },
          { label: "Approval Pod Kembali", href: "/pod-returns?tab=approval" },
          { label: "Proses Vendor", href: "/vendor-processes" },
        ],
      },
      {
        label: "Keuangan",
        children: [
          { label: "Invoice (New)", href: "/finance/invoices?from=modul" },
          // Sandbox Piutang Dagang > Invoice (not in the real web menu).
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
            label: "AWB Tertunda",
            href: "/branch-reports/awb?view=pending",
          },
          {
            label: "AWB Termanifest",
            href: "/branch-reports/awb?view=manifested",
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
        label: "Laporan Keuangan",
        children: [
          { label: "Laporan AR", href: "/financial-reports/aging" },
          { label: "Laporan AP", href: "/financial-reports/ap-aging" },
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
    label: "Ticketing",
    children: [
      { label: "Tiket Support", href: "/ticketting" },
      { label: "Persetujuan Tiketing", href: "/ticketting?tab=approval" },
    ],
  },
] as const;
