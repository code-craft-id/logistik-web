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
        href: "/perkiraan",
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
        href: "/marketing",
      },
      {
        label: "Layanan Pelanggan",
        children: [
          {
            label: "Transaksi",
            href: "/transactions",
          },
          {
            label: "Booking",
            href: "/bookings",
          },
        ],
      },
      {
        label: "Operasional",
        children: [
          {
            label: "Manifest",
            href: "/manifest",
          },
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
        href: "/customer-reports",
      },
    ],
  },
  {
    label: "Ticketing",
    href: "/ticketting",
  },
] as const;
