import type { PreviewScreen } from "@/components/patterns/preview-contract";

// Source-derived UI metadata only; never consumes a DRAFT model or legacy data.
export const screens = {
  "/perkiraan": {
    path: "/perkiraan",
    title: "Perkiraan",
    source: "src/pages/master-data/Perkiraan.jsx",
    kind: "workspace",
    integration: "Awaiting approved accounting and posting rules.",
    views: [
      {
        id: "perkiraan",
        label: "Perkiraan",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "kode_rekening",
            label: "Kode Rekening",
          },
          {
            key: "nama_rekening",
            label: "Nama Rekening",
          },
          {
            key: "tampil",
            label: "Tampil",
          },
          {
            key: "Normal",
            label: "Normal",
          },
          {
            key: "posisi",
            label: "Posisi",
          },
          {
            key: "status",
            label: "Status",
          },
        ],
        fields: [
          {
            key: "kode_rekening",
            label: "Kode Rekening",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
          {
            key: "inisial_akun",
            label: "Inisial Akun",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "nama_rekening",
            label: "Nama Rekening",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
          {
            key: "posisi",
            label: "Posisi",
            type: "select",
            required: false,
            table: true,
            options: ["Neraca", "Rugi Laba"],
          },
          {
            key: "normal_balance",
            label: "Normal Balance",
            type: "select",
            required: false,
            table: true,
            options: ["Debet", "Kredit"],
          },
          {
            key: "tampil",
            label: "Tampil",
            type: "select",
            required: false,
            table: true,
            options: ["Show", "Hide"],
          },
          {
            key: "jenis_kategori",
            label: "Jenis Kategori",
            type: "select",
            required: false,
            table: true,
            options: ["Parent", "Child"],
          },
          {
            key: "ledger_id",
            label: "Ledger",
            type: "select",
            required: false,
            table: true,
            options: ["Pilih Ledger"],
          },
          {
            key: "kategori_akun_id",
            label: "Kategori Akun",
            type: "select",
            required: false,
            table: true,
            options: ["Pilih Kategori"],
          },
          {
            key: "rugi_laba_id",
            label: "Rugi Laba",
            type: "select",
            required: false,
            table: true,
            options: ["Pilih Rugi Laba"],
          },
          {
            key: "kategori_cashflow_id",
            label: "Kategori Cashflow",
            type: "select",
            required: false,
            table: true,
            options: ["Pilih Cashflow"],
          },
          {
            key: "cabang_id",
            label: "Cabang",
            type: "select",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "status",
            label: "Status",
            type: "checkbox",
          },
        ],
      },
    ],
  },
  "/akunting": {
    path: "/akunting",
    title: "Akunting",
    source: "src/pages/akunting/Akunting.jsx",
    kind: "workspace",
    integration: "Awaiting approved accounting and posting rules.",
    views: [
      {
        id: "ledger",
        label: "Ledger",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "kode",
            label: "Kode",
          },
          {
            key: "nama",
            label: "Nama",
          },
        ],
        fields: [
          {
            key: "kode",
            label: "Kode",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
          {
            key: "nama",
            label: "Nama",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
        ],
      },
      {
        id: "kategori-akun",
        label: "Kategori Akun",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "nama",
            label: "Nama",
          },
        ],
        fields: [
          {
            key: "nama",
            label: "Nama",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
        ],
      },
      {
        id: "rugi-laba",
        label: "Rugi Laba",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "kode",
            label: "Kode",
          },
          {
            key: "nama",
            label: "Nama",
          },
        ],
        fields: [
          {
            key: "kode",
            label: "Kode",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
          {
            key: "nama",
            label: "Nama",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
        ],
      },
      {
        id: "kategori-cashflow",
        label: "Kategori Cashflow",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "nama",
            label: "Nama",
          },
        ],
        fields: [
          {
            key: "nama",
            label: "Nama",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
        ],
      },
    ],
  },
  "/akunting/ledger": {
    path: "/akunting/ledger",
    title: "Ledger",
    source: "src/pages/akunting/LedgerPage.jsx",
    kind: "workspace",
    integration:
      "Dormant legacy page preview; no operational integration exists.",
    views: [
      {
        id: "ledger",
        label: "Ledger",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "Kode *",
            label: "Kode",
          },
          {
            key: "Nama *",
            label: "Nama",
          },
        ],
        fields: [
          {
            key: "Kode *",
            label: "Kode",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "Nama *",
            label: "Nama",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
        ],
      },
    ],
  },
  "/akunting/kategori-akun": {
    path: "/akunting/kategori-akun",
    title: "Kategori Akun",
    source: "src/pages/akunting/KategoriAkunPage.jsx",
    kind: "workspace",
    integration:
      "Dormant legacy page preview; no operational integration exists.",
    views: [
      {
        id: "kategori-akun",
        label: "Kategori Akun",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "Nama *",
            label: "Nama",
          },
        ],
        fields: [
          {
            key: "Nama *",
            label: "Nama",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
        ],
      },
    ],
  },
  "/akunting/rugi-laba": {
    path: "/akunting/rugi-laba",
    title: "Rugi Laba",
    source: "src/pages/akunting/RugiLabaPage.jsx",
    kind: "workspace",
    integration:
      "Dormant legacy page preview; no operational integration exists.",
    views: [
      {
        id: "rugi-laba",
        label: "Rugi Laba",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "Kode",
            label: "Kode",
          },
          {
            key: "Nama *",
            label: "Nama",
          },
        ],
        fields: [
          {
            key: "Kode",
            label: "Kode",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "Nama *",
            label: "Nama",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
        ],
      },
    ],
  },
  "/akunting/kategori-cashflow": {
    path: "/akunting/kategori-cashflow",
    title: "Kategori Cashflow",
    source: "src/pages/akunting/CashflowPage.jsx",
    kind: "workspace",
    integration:
      "Dormant legacy page preview; no operational integration exists.",
    views: [
      {
        id: "kategori-cashflow",
        label: "Kategori Cashflow",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "Nama *",
            label: "Nama",
          },
        ],
        fields: [
          {
            key: "Nama *",
            label: "Nama",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
        ],
      },
    ],
  },
} satisfies Record<string, PreviewScreen>;
