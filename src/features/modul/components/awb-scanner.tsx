"use client";

import { Camera, CameraOff, CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { scanAwbAction } from "../scan-actions";
import type { ScanResult } from "../server/scan";

type Row = ScanResult & { id: number; at: string; status: string };

const STATUSES = [
  { value: "In Transit", label: "Berangkat / In Transit" },
  { value: "Delivered", label: "Terkirim / Delivered" },
] as const;

type Detector = {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
};
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => Detector;
  }
}

/** Short tone and vibration so the operator need not look at the screen. */
function feedback(ok: boolean) {
  try {
    navigator.vibrate?.(ok ? 60 : [80, 60, 80]);
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = ok ? 880 : 220;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.08 : 0.25));
    osc.onended = () => ctx.close();
  } catch {
    // Feedback is optional.
  }
}

export function AwbScanner() {
  const [status, setStatus] = useState<string>(STATUSES[0].value);
  const [value, setValue] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState<"off" | "on" | "unsupported">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const queue = useRef<string[]>([]);
  const running = useRef(false);
  const lastCode = useRef({ code: "", at: 0 });
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
      feedback(result.ok);
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
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      // Ignore the same code read twice within two seconds (camera, double scan).
      const now = Date.now();
      if (lastCode.current.code === code && now - lastCode.current.at < 2000)
        return;
      lastCode.current = { code, at: now };
      queue.current.push(code);
      void drain();
    },
    [drain],
  );

  // Camera scanning with the browser's BarcodeDetector (Chrome on Android).
  useEffect(() => {
    if (camera !== "on") return;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let cancelled = false;
    (async () => {
      try {
        const Detector = window.BarcodeDetector;
        if (!Detector) {
          setCamera("unsupported");
          return;
        }
        const detector = new Detector({
          formats: ["code_128", "qr_code", "code_39", "ean_13"],
        });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        timer = window.setInterval(async () => {
          if (!video.current || video.current.readyState < 2) return;
          const found = await detector.detect(video.current).catch(() => []);
          if (found[0]?.rawValue) submit(found[0].rawValue);
        }, 300);
      } catch {
        setCameraError(
          "Kamera tidak bisa dibuka. Izinkan akses kamera di browser, atau pakai scanner genggam.",
        );
        setCamera("off");
      }
    })();
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      for (const track of stream?.getTracks() ?? []) track.stop();
    };
  }, [camera, submit]);

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
              onClick={() => {
                setStatus(s.value);
                input.current?.focus();
              }}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </fieldset>
      <form
        className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
          setValue("");
          input.current?.focus();
        }}
      >
        <div className="min-w-0 space-y-2">
          <Label htmlFor="scan-awb">Nomor AWB</Label>
          <Input
            id="scan-awb"
            ref={input}
            autoFocus
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Scan barcode atau ketik nomor lalu Enter"
            className="min-h-11 font-mono"
          />
        </div>
        <Button type="submit" className="min-h-11">
          Proses
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            setCameraError(null);
            setCamera((c) => (c === "on" ? "off" : "on"));
          }}
        >
          {camera === "on" ? (
            <CameraOff aria-hidden="true" />
          ) : (
            <Camera aria-hidden="true" />
          )}
          {camera === "on" ? "Matikan kamera" : "Scan pakai kamera"}
        </Button>
      </form>
      {camera === "on" && (
        <video
          ref={video}
          playsInline
          muted
          className="mx-auto aspect-video w-full max-w-md rounded-lg border bg-black object-cover"
        />
      )}
      {camera === "unsupported" && (
        <output className="block text-sm text-muted-foreground">
          Browser ini belum mendukung scan kamera (contoh: Safari/iPhone).
          Gunakan Chrome di Android, scanner genggam, atau ketik nomor AWB.
        </output>
      )}
      {cameraError && (
        <p role="alert" className="text-sm text-destructive">
          {cameraError}
        </p>
      )}
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
