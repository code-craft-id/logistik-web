"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type DimensionResult = {
  volume: string;
  kilo: string;
  /** Terberat: sum over koli of max(volume, berat) (provider "Berat diambil"). */
  chargeable: string;
  packingFee: string;
  notes: string;
  rows: Pick<
    Row,
    "length" | "width" | "height" | "kilo" | "packed" | "packing"
  >[];
};
type Row = {
  length: string;
  width: string;
  height: string;
  kilo: string;
  packed: boolean;
  packing: string;
  note: string;
};
const empty: Row = {
  length: "",
  width: "",
  height: "",
  kilo: "",
  packed: false,
  packing: "",
  note: "",
};
const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const fixed = (n: number, d: number) =>
  String(Math.round(n * 10 ** d) / 10 ** d);

/** Divider of a Moda (text in master data); 0 when not a positive number. */
export const modeDivider = (divider: string | null | undefined) =>
  num(divider ?? "");

/**
 * Dimensi as in the provider (OBSERVED 2026-11-19): one row per koli with
 * Panjang, Lebar, Tinggi (cm), Berat, packing and Keterangan. Volume =
 * P x L x T / Moda divider (D-26: DARAT 4000, UDARA 6000, LAUT 1000000).
 * "Berikutnya" fills Volume, Berat and Biaya Packing of the form; the
 * server recalculates the price as usual.
 */
export function DimensionDialog({
  koli,
  divider,
  modeName,
  onApply,
}: {
  koli: number;
  divider: number;
  modeName: string | null;
  onApply: (result: DimensionResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const count = Math.min(Math.max(1, Math.trunc(koli) || 1), 100);
  const openDialog = () => {
    setRows((prev) =>
      Array.from({ length: count }, (_, i) => prev[i] ?? { ...empty }),
    );
    setOpen(true);
  };
  const set = (i: number, key: keyof Row, value: string | boolean) =>
    setRows((prev) =>
      prev.map((r, j) => (j === i ? { ...r, [key]: value } : r)),
    );
  const volumeOf = (r: Row) =>
    divider > 0 ? (num(r.length) * num(r.width) * num(r.height)) / divider : 0;
  const totalVolume = rows.reduce((t, r) => t + volumeOf(r), 0);
  const totalKilo = rows.reduce((t, r) => t + num(r.kilo), 0);
  const totalPacking = rows.reduce(
    (t, r) => t + (r.packed ? num(r.packing) : 0),
    0,
  );
  const takenOf = (r: Row) => Math.max(volumeOf(r), num(r.kilo));
  // Provider: Terberat = sum of each koli's "Berat diambil".
  const heaviest = rows.reduce((t, r) => t + takenOf(r), 0);
  const copyRow = (from: number, to: number[]) =>
    setRows((prev) =>
      prev.map((r, j) =>
        to.includes(j)
          ? {
              ...r,
              length: prev[from].length,
              width: prev[from].width,
              height: prev[from].height,
              kilo: prev[from].kilo,
            }
          : r,
      ),
    );
  const cell =
    "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm";
  return (
    <>
      <Button
        type="button"
        className="min-h-11"
        onClick={openDialog}
        aria-label="Dimensi per koli"
      >
        Dimensi
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Dimensi</DialogTitle>
            <DialogDescription>
              {divider > 0
                ? `Volume = Panjang × Lebar × Tinggi (cm) ÷ ${divider} (Moda ${modeName ?? "-"}).`
                : "Pilih Via Moda yang punya pembagi (Master Moda) agar volume terhitung."}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-sm">
              <thead>
                <tr className="text-left">
                  {[
                    "Koli",
                    "Panjang",
                    "Lebar",
                    "Tinggi",
                    "Volume",
                    "Berat (Kg)",
                    "Berat diambil",
                    "Packing",
                    "Biaya Packing",
                    "Keterangan",
                    "",
                  ].map((h) => (
                    <th key={h} className="p-1 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: one fixed row per koli
                  <tr key={i}>
                    <td className="p-1 tabular-nums">{i + 1}</td>
                    {(["length", "width", "height"] as const).map((k) => (
                      <td key={k} className="p-1">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          aria-label={`${k === "length" ? "Panjang" : k === "width" ? "Lebar" : "Tinggi"} koli ${i + 1}`}
                          value={r[k]}
                          onChange={(e) => set(i, k, e.target.value)}
                          className={cell}
                        />
                      </td>
                    ))}
                    <td className="p-1 tabular-nums">
                      {fixed(volumeOf(r), 3)}
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Berat koli ${i + 1}`}
                        value={r.kilo}
                        onChange={(e) => set(i, "kilo", e.target.value)}
                        className={cell}
                      />
                    </td>
                    <td className="p-1 tabular-nums">{fixed(takenOf(r), 2)}</td>
                    <td className="p-1 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Packing koli ${i + 1}`}
                        checked={r.packed}
                        onChange={(e) => set(i, "packed", e.target.checked)}
                        className="size-5"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        aria-label={`Biaya packing koli ${i + 1}`}
                        value={r.packing}
                        disabled={!r.packed}
                        onChange={(e) => set(i, "packing", e.target.value)}
                        className={cell}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        maxLength={100}
                        aria-label={`Keterangan koli ${i + 1}`}
                        value={r.note}
                        onChange={(e) => set(i, "note", e.target.value)}
                        className={cell}
                      />
                    </td>
                    <td className="p-1">
                      {i < rows.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11"
                          aria-label={`Salin ukuran koli ${i + 1} ke koli ${i + 2}`}
                          onClick={() => copyRow(i, [i + 1])}
                        >
                          Copy
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td colSpan={4} className="p-1 text-right">
                    Grand Total
                  </td>
                  <td className="p-1 tabular-nums">{fixed(totalVolume, 3)}</td>
                  <td className="p-1 tabular-nums">{fixed(totalKilo, 2)}</td>
                  <td className="p-1 tabular-nums">{fixed(heaviest, 2)}</td>
                  <td />
                  <td className="p-1 tabular-nums">{fixed(totalPacking, 0)}</td>
                  <td />
                  <td className="p-1">
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        onClick={() =>
                          copyRow(
                            0,
                            rows.map((_, j) => j).filter((j) => j > 0),
                          )
                        }
                      >
                        Copy All
                      </Button>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-sm">
            Terberat (Kg): <strong>{fixed(heaviest, 2)}</strong>
          </p>
          <DialogFooter>
            <Button
              type="button"
              className="min-h-11"
              onClick={() => {
                onApply({
                  volume: totalVolume ? fixed(totalVolume, 3) : "",
                  kilo: totalKilo ? fixed(totalKilo, 2) : "",
                  chargeable: heaviest ? fixed(heaviest, 2) : "",
                  packingFee: totalPacking ? fixed(totalPacking, 0) : "",
                  notes: rows
                    .map((r, i) =>
                      r.length || r.width || r.height
                        ? `K${i + 1} ${num(r.length)}x${num(r.width)}x${num(r.height)}${r.note ? ` ${r.note}` : ""}`
                        : "",
                    )
                    .filter(Boolean)
                    .join("; "),
                  rows: rows.map(
                    ({ length, width, height, kilo, packed, packing }) => ({
                      length,
                      width,
                      height,
                      kilo,
                      packed,
                      packing,
                    }),
                  ),
                });
                setOpen(false);
              }}
            >
              Berikutnya
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
