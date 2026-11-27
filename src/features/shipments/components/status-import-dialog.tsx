"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type StatusImportResult,
  statusImportAction,
} from "../status-import-actions";

/**
 * Import status from Excel: pick a file, check it (preview with errors per
 * row), then process the valid rows. Nothing is saved before "Proses".
 */
export function StatusImportDialog() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<StatusImportResult | null>(null);
  const run = (mode: "preview" | "apply") => {
    const file = input.current?.files?.[0];
    if (!file) {
      setResult({ ok: false, message: "Pilih file terlebih dahulu." });
      return;
    }
    const data = new FormData();
    data.set("file", file);
    data.set("mode", mode);
    start(async () => {
      try {
        const next = await statusImportAction(data);
        setResult(next);
        if (next.ok && next.mode === "apply") router.refresh();
      } catch {
        setResult({ ok: false, message: "Koneksi terputus. Coba lagi." });
      }
    });
  };
  const rows = result?.ok ? result.rows : [];
  const valid = rows.filter((r) => !r.error).length;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button className="min-h-11">Import</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Status dari Excel</DialogTitle>
          <DialogDescription>
            Kolom: AWB No. | Date | Received | Status | Remarks. Status 2 =
            DITERIMA, 1 = RETUR. Periksa dulu; baris yang salah dilewati.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <input
            ref={input}
            type="file"
            accept=".xlsx,.xls,.csv"
            aria-label="File import status"
            onChange={() => setResult(null)}
            className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-md file:border file:bg-background file:px-3"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => run("preview")}
            >
              {pending ? "Memeriksa…" : "Periksa file"}
            </Button>
            {result?.ok && result.mode === "preview" && valid > 0 && (
              <Button
                type="button"
                className="min-h-11"
                disabled={pending}
                onClick={() => run("apply")}
              >
                {pending ? "Memproses…" : `Proses ${valid} baris valid`}
              </Button>
            )}
          </div>
          {result && !result.ok && (
            <p
              role="alert"
              className="rounded-md border border-destructive p-2 text-sm text-destructive"
            >
              {result.message}
            </p>
          )}
          {result?.ok && (
            <div className="space-y-2">
              <output className="block text-sm">
                {result.mode === "apply"
                  ? `${result.rows.filter((r) => r.applied).length} baris tersimpan, ${result.rows.filter((r) => !r.applied).length} dilewati.`
                  : `${valid} dari ${rows.length} baris siap diproses.`}
              </output>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2">Baris</th>
                      <th className="p-2">AWB No.</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Received</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Hasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.line}
                        className="border-b last:border-b-0 align-top"
                      >
                        <td className="p-2 tabular-nums">{r.line}</td>
                        <td className="p-2 font-mono">{r.awbNo || "-"}</td>
                        <td className="p-2">{r.date ?? "-"}</td>
                        <td className="p-2">{r.received || "-"}</td>
                        <td className="p-2">{r.status || "-"}</td>
                        <td
                          className={`p-2 ${r.error ? "text-destructive" : "text-primary"}`}
                        >
                          {r.error ??
                            ("applied" in r && r.applied
                              ? "Tersimpan"
                              : "Siap")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
