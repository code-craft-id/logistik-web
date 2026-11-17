import type { AwbStatusResult } from "./contracts";

export type AwbStatusColumn = { label: string; numeric?: boolean };
export type AwbStatusTable = {
  columns: AwbStatusColumn[];
  rows: { id: number; values: (string | number | null)[] }[];
};

/** Single column contract shared by the page table and the CSV export. */
export function awbStatusTable(result: AwbStatusResult): AwbStatusTable {
  if (result.kind === "pending")
    return {
      columns: [
        { label: "AWB No." },
        { label: "DO No." },
        { label: "Tanggal transaksi (UTC)" },
        { label: "Tujuan" },
        { label: "Koli", numeric: true },
        { label: "Berat (kg)", numeric: true },
        { label: "Volume", numeric: true },
      ],
      rows: result.items.map((row) => ({
        id: row.id,
        values: [
          row.awbNo,
          row.doNo,
          row.transactionDate,
          row.destinationBranch,
          row.koli,
          row.kilo,
          row.volume,
        ],
      })),
    };
  if (result.kind === "manifested")
    return {
      columns: [
        { label: "AWB No." },
        { label: "DO No." },
        { label: "Manifes No." },
        { label: "Tanggal manifest (UTC)" },
        { label: "Tujuan" },
        { label: "Koli", numeric: true },
        { label: "Berat (kg)", numeric: true },
        { label: "Volume", numeric: true },
      ],
      rows: result.items.map((row) => ({
        id: row.id,
        values: [
          row.awbNo,
          row.doNo,
          row.manifestNo,
          row.manifestDate,
          row.destinationBranch,
          row.koli,
          row.kilo,
          row.volume,
        ],
      })),
    };
  return {
    columns: [
      { label: "AWB No." },
      { label: "Tanggal transaksi (UTC)" },
      { label: "Asal" },
      { label: "Tujuan" },
      { label: "Pengirim" },
      { label: "Penerima barang" },
      { label: "Koli", numeric: true },
      { label: "Berat (kg)", numeric: true },
      { label: "Status pengiriman" },
      { label: "Diterima oleh" },
      { label: "Waktu diterima (UTC)" },
      { label: "Manifes No." },
    ],
    rows: result.items.map((row) => ({
      id: row.id,
      values: [
        row.awbNo,
        row.transactionDate,
        row.originBranch,
        row.destinationBranch,
        row.senderName,
        row.receiverName,
        row.koli,
        row.kilo,
        row.status,
        row.receivedBy,
        row.deliveredAt,
        row.manifestNo,
      ],
    })),
  };
}
