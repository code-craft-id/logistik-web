"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { scanAwbAction } from "../scan-actions";
import type { ScanResult } from "../server/scan";
import { ScanInput, scanFeedback } from "./scan-input";

type Row = ScanResult & { id: number; at: string; status: string };

const STATUSES = [
  { value: "In Transit", label: "Berangkat / In Transit" },
  { value: "Delivered", label: "Terkirim / Delivered" },
] as const;

/** Bulk mode: set one status for many AWBs scanned one after another. */
export function AwbScanner() {
  const [status, setStatus] = useState<string>(STATUSES[0].value);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const queue = useRef<string[]>([]);
  const running = useRef(false);
  const statusRef = useRef(status);
  statusRef.current = status;
  const seq = useRef(0);

  // Process scans one by one so fast scanners never race each other.
  const drain = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    while (queue.current.length) {
      const awbNo = queue.current.shift() as string;
      const target = statusRef.current;
      let result: ScanResult;
      try {
        result = await scanAwbAction({ awbNo, status: target });
      } catch {
        result = { ok: false, awbNo, message: "Koneksi terputus. Scan ulang." };
      }
      scanFeedback(result.ok);
      seq.current += 1;
      const row: Row = {
        ...result,
        awbNo: result.awbNo || awbNo,
        id: seq.current,
        status: target,
        at: new Date().toLocaleTimeString("id-ID"),
      };
      setRows((prev) => [row, ...prev].slice(0, 200));
    }
    running.current = false;
    setBusy(false);
  }, []);

  const submit = useCallback(
    (code: string) => {
      queue.current.push(code);
      void drain();
    },
    [drain],
  );

  const okCount = rows.filter((r) => r.ok).length;
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Ubah status menjadi</legend>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Button
              key={s.value}
              type="button"
              variant={status === s.value ? "default" : "outline"}
              aria-pressed={status === s.value}
              className="min-h-11"
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </fieldset>
      <ScanInput onCode={submit} />
      <section aria-label="Hasil scan" className="space-y-2">
        <p className="text-sm" aria-live="polite">
          {rows.length
            ? `${rows.length} scan · ${okCount} berhasil · ${rows.length - okCount} gagal${busy ? " · memproses…" : ""}`
            : "Belum ada scan."}
        </p>
        <ol className="space-y-1">
          {rows.map((row) => (
            <li
              key={row.id}
              className={cn(
                "flex items-start gap-2 rounded-md border p-2 text-sm",
                row.ok ? "border-primary/40" : "border-destructive/50",
              )}
            >
              {row.ok ? (
                <CheckCircle2
                  aria-label="Berhasil"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
              ) : (
                <XCircle
                  aria-label="Gagal"
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                />
              )}
              <span className="font-mono font-medium">{row.awbNo}</span>
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                {row.message}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {row.at}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
