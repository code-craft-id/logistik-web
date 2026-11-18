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
        label: "Perkiraan",
        href: "/finance/accounting/accounts",
      },
      {
        label: "Shipment Status",
        href: "/shipment-status",
      },
    ],
  },
  {
    label: "Akunting",
    href: "/akunting",
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
          { label: "Onsite Outbound", href: "/transactions/new" },
          {
            label: "Onsite Inbound",
            href: "/branch-reports/inbound-transaction-details?view=onsite",
          },
          { label: "Print AWB", href: "/transactions" },
          { label: "Persetujuaan Edit/Delete AWB" },
          { label: "Void AWB", href: "/transactions/void" },
        ],
      },
      {
        label: "Layanan Pelanggan",
        children: [
          {
            label: "Status Pengantaran",
            href: "/branch-reports/delivery?view=items",
          },
          { label: "Cek Ongkir" },
          { label: "Cek Resi", href: "/transactions/lookup" },
          { label: "Histori Edit Resi", href: "/transactions/history" },
          { label: "Booking", href: "/bookings" },
          { label: "Inbound Booking" },
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
          { label: "Cek Inbound Agen" },
          { label: "Print Manifest", href: "/manifest?type=Outbound" },
        ],
      },
      {
        label: "Operasional / Lembar Pengantaran",
        children: [
          { label: "Kurir Kota", href: "/courier-reports?view=city" },
          { label: "Print DRS", href: "/branch-reports/delivery" },
        ],
      },
      {
        label: "Operasional",
        children: [
          { label: "POD Kembali", href: "/customer-reports/pod?view=ops" },
          { label: "Approval POD Kembali" },
          {
            label: "Proses Vendor",
            href: "/branch-reports/manifest-vendor?view=process",
          },
        ],
      },
      {
        label: "Keuangan",
        children: [
          { label: "Invoice (new)", href: "/finance/invoices?from=modul" },
          { label: "Pembayaran Hutang" },
        ],
      },
    ],
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
            label: "Manifest Vendor",
            href: "/branch-reports/manifest-vendor",
          },
          {
            label: "AWB",
            href: "/branch-reports/awb",
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
        href: "/courier-reports",
      },
      {
        label: "Laporan Keuangan",
        href: "/financial-reports",
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
    ],
  },
  {
    label: "Ticketing",
    href: "/ticketting",
  },
] as const;
