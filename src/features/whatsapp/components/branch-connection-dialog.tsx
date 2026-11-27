"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  gatewayQrSchema,
  gatewaySessionSchema,
  type WhatsAppQr,
  type WhatsAppSession,
} from "../contracts";

const labels = {
  disconnected: "Terputus",
  connecting: "Menghubungkan",
  qr: "Menunggu pemindaian QR",
  connected: "Terhubung",
};
export function BranchConnectionDialog({
  branch,
  canManage,
  onClose,
  restoreFocus,
}: {
  branch: { id: number; name: string };
  canManage: boolean;
  onClose: () => void;
  restoreFocus: () => void;
}) {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [qr, setQr] = useState<WhatsAppQr | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const endpoint = `/api/whatsapp/branches/${branch.id}/session`;
  /** Auto-follow a pairing attempt for at most two minutes. */
  const followUntil = useRef(0);
  const qrRef = useRef<WhatsAppQr | null>(null);
  qrRef.current = qr;
  useEffect(() => {
    const controller = new AbortController();
    void fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result = gatewaySessionSchema.parse(await response.json());
        if (result.branchId !== branch.id) throw new Error();
        if (!controller.signal.aborted) setSession(result);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Status WhatsApp gagal dimuat. Silakan coba lagi.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [endpoint, branch.id]);
  useEffect(() => {
    if (!qr) return;
    const timer = setTimeout(
      () => {
        setQr(null);
        if (Date.now() >= followUntil.current)
          setError("QR kedaluwarsa. Klik Hubungkan nomor untuk QR baru.");
      },
      Math.max(0, Date.parse(qr.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [qr]);
  // While a pairing attempt is followed, poll the status every 3 s and keep
  // a fresh QR on screen (WhatsApp rotates it about every 20 s). Polling
  // stops when connected, disconnected, the dialog closes or after 2 min.
  const status = session?.status;
  useEffect(() => {
    if (!canManage || (status !== "connecting" && status !== "qr")) return;
    if (followUntil.current <= Date.now()) return;
    const controller = new AbortController();
    const tick = async () => {
      try {
        const response = await fetch(endpoint, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const next = gatewaySessionSchema.parse(await response.json());
        if (next.branchId !== branch.id || controller.signal.aborted) return;
        if (next.status !== "qr") setQr(null);
        if (next.status === "qr") {
          const current = qrRef.current;
          if (!current || Date.parse(current.expiresAt) - Date.now() < 6000) {
            const qrResponse = await fetch(`${endpoint}/qr`, {
              cache: "no-store",
              signal: controller.signal,
            });
            if (qrResponse.ok) {
              const fresh = gatewayQrSchema.parse(await qrResponse.json());
              if (
                fresh.branchId === branch.id &&
                Date.parse(fresh.expiresAt) > Date.now() &&
                !controller.signal.aborted
              ) {
                setQr(fresh);
                setError("");
              }
            }
          }
        }
        if (!controller.signal.aborted) setSession(next);
      } catch {
        // A missed poll is retried on the next tick.
      }
    };
    void tick();
    const timer = setInterval(() => {
      if (Date.now() > followUntil.current) {
        clearInterval(timer);
        return;
      }
      void tick();
    }, 3000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [canManage, status, endpoint, branch.id]);
  async function request(method: "GET" | "POST" | "DELETE", getQr = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    setQr(null);
    setConfirmDisconnect(false);
    try {
      const response = await fetch(`${endpoint}${getQr ? "/qr" : ""}`, {
        method,
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      const body: unknown = await response.json();
      if (getQr) {
        const result = gatewayQrSchema.parse(body);
        if (
          result.branchId !== branch.id ||
          Date.parse(result.expiresAt) <= Date.now()
        )
          throw new Error();
        followUntil.current = Date.now() + 120_000;
        setQr(result);
      } else {
        const result = gatewaySessionSchema.parse(body);
        if (result.branchId !== branch.id) throw new Error();
        if (method === "POST") followUntil.current = Date.now() + 120_000;
        setSession(result);
      }
    } catch {
      setSession(null);
      setError(
        "Permintaan WhatsApp belum berhasil dikonfirmasi. Muat ulang status sebelum mencoba kembali.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-h-dvh overflow-y-auto"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>WhatsApp {branch.name}</DialogTitle>
          <DialogDescription>
            Hubungkan nomor khusus cabang ini. QR hanya ditampilkan kepada
            administrator.
          </DialogDescription>
        </DialogHeader>
        {busy && <output>Memuat koneksi…</output>}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {session && (
          <p>
            Status: {labels[session.status]}
            {session.phoneNumber ? ` · ${session.phoneNumber}` : ""}
          </p>
        )}
        {qr && (
          <Image
            src={qr.qrDataUrl}
            alt={`QR untuk menghubungkan WhatsApp ${branch.name}`}
            width={256}
            height={256}
            unoptimized
            className="max-w-full"
          />
        )}
        {canManage &&
          (session?.status === "qr" || session?.status === "connecting") && (
            <p className="text-sm text-muted-foreground">
              Di HP cabang buka WhatsApp &gt; Perangkat tertaut &gt; Tautkan
              perangkat, lalu pindai QR. QR diperbarui otomatis; status berubah
              menjadi Terhubung setelah berhasil.
            </p>
          )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => void request("GET")}
          >
            Muat status
          </Button>
          {canManage && session?.status === "disconnected" && (
            <Button
              className="min-h-11"
              disabled={busy}
              onClick={() => void request("POST")}
            >
              Hubungkan nomor
            </Button>
          )}
          {canManage && session?.status === "qr" && (
            <Button
              className="min-h-11"
              disabled={busy}
              onClick={() => void request("GET", true)}
            >
              Tampilkan QR
            </Button>
          )}
          {canManage && session && session.status !== "disconnected" && (
            <Button
              variant="destructive"
              className="min-h-11"
              disabled={busy}
              onClick={() => setConfirmDisconnect(true)}
            >
              Putuskan koneksi
            </Button>
          )}
        </div>
        {confirmDisconnect && (
          <div className="space-y-3 rounded-md border p-3">
            <p>
              Putuskan dan keluarkan nomor WhatsApp cabang ini? Untuk
              menghubungkan kembali, pindai QR baru.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDisconnect(false)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => void request("DELETE")}
              >
                Ya, putuskan
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
