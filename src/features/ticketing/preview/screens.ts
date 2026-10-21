import type { PreviewScreen } from "@/components/patterns/preview-contract";

// Source-derived UI metadata only; never consumes a DRAFT model or legacy data.
export const screens = {
  "/ticketting": {
    path: "/ticketting",
    title: "Ticketing",
    source: "src/pages/ticketting/Ticketting.jsx",
    kind: "workspace",
    integration: "Awaiting the owning PLT/domain workflow.",
    views: [
      {
        id: "ticket-support",
        label: "Ticket Support",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "No. Ticket",
            label: "No. Ticket",
          },
          {
            key: "tanggal",
            label: "Tanggal",
          },
          {
            key: "priority",
            label: "Priority",
          },
          {
            key: "subject",
            label: "Subject",
          },
          {
            key: "namaMenu",
            label: "Nama Menu",
          },
          {
            key: "Status",
            label: "Status",
          },
        ],
        fields: [
          {
            key: "tanggal",
            label: "Tanggal",
            type: "date",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "priority",
            label: "Priority",
            type: "select",
            required: false,
            table: true,
            options: ["Low", "Medium", "High"],
          },
          {
            key: "subject",
            label: "Subject",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "namaMenu",
            label: "Nama Menu",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "url",
            label: "URL",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            required: false,
            table: true,
            options: [],
          },
        ],
        filters: [
          {
            key: "No. Ticket",
            label: "No. Ticket",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "Dari",
            label: "Dari",
            type: "date",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "Sampai",
            label: "Sampai",
            type: "date",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "Status Ticket",
            label: "Status Ticket",
            type: "select",
            required: false,
            table: true,
            options: ["Semua Status", "Pending", "Revisi", "Selesai"],
          },
        ],
        actions: ["Detail", "Edit", "Selesai", "Revisi", "Close"],
      },
      {
        id: "persetujuan-ticketing",
        label: "Persetujuan Ticketing",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "Judul",
            label: "Judul",
          },
          {
            key: "Nama Menu",
            label: "Nama Menu",
          },
          {
            key: "Link URL",
            label: "Link URL",
          },
        ],
        fields: [],
        actions: ["Detail", "Buka Link"],
      },
    ],
  },
} satisfies Record<string, PreviewScreen>;
