"use client";

import { Camera, CameraOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Detector = {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
};
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => Detector;
  }
}

/**
 * Scan input for handheld scanners (they type and press Enter), the phone
 * camera (browser BarcodeDetector: Chrome on Android) or typing. The same
 * code read twice within two seconds is ignored.
 */
export function ScanInput({
  onCode,
  label = "Nomor AWB",
  busy = false,
}: {
  onCode: (code: string) => void;
  label?: string;
  busy?: boolean;
}) {
  const [value, setValue] = useState("");
  const [camera, setCamera] = useState<"off" | "on" | "unsupported">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const last = useRef({ code: "", at: 0 });

  const emit = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      const now = Date.now();
      if (last.current.code === code && now - last.current.at < 2000) return;
      last.current = { code, at: now };
      onCode(code);
    },
    [onCode],
  );

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
          if (found[0]?.rawValue) emit(found[0].rawValue);
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
  }, [camera, emit]);

  return (
    <div className="space-y-3">
      <form
        className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          emit(value);
          setValue("");
          input.current?.focus();
        }}
      >
        <div className="min-w-0 space-y-2">
          <Label htmlFor="scan-code">{label}</Label>
          <Input
            id="scan-code"
            ref={input}
            autoFocus
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Scan barcode atau ketik nomor lalu Enter"
            className="min-h-11 font-mono"
          />
        </div>
        <Button type="submit" className="min-h-11" disabled={busy}>
          {busy ? "Memproses…" : "Proses"}
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
          Gunakan Chrome di Android, scanner genggam, atau ketik nomor.
        </output>
      )}
      {cameraError && (
        <p role="alert" className="text-sm text-destructive">
          {cameraError}
        </p>
      )}
    </div>
  );
}

/** Short tone and vibration so the operator need not look at the screen. */
export function scanFeedback(ok: boolean) {
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
