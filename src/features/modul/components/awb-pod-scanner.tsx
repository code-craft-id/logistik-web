"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  confirmPickupAction,
  scanBookingAction,
} from "@/features/bookings/pickup-actions";
import type { BookingScanView } from "@/features/bookings/server/pickup";
import { scanLookupAction } from "../proof-actions";
import type { ScanAwbView } from "../server/proof";
import { ProofForm } from "./proof-form";
import { ScanInput, scanFeedback } from "./scan-input";

const cdn = (url: string, size: string) =>
  url.replace("/image/upload/", `/image/upload/${size},f_webp,q_auto/`);
const when = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium [overflow-wrap:anywhere]">{value ?? "-"}</dd>
    </div>
  );
}

/** Scan an AWB, see its details and tracking, then update its status (Progi-style). */
export function AwbPodScanner() {
  const [awb, setAwb] = useState<ScanAwbView | null>(null);
  const [booking, setBooking] = useState<BookingScanView | null>(null);
  const [mode, setMode] = useState<"awb" | "booking">("awb");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const lookup = useCallback(
    async (code: string) => {
      setBusy(true);
      setError(null);
      setSaved(null);
      try {
        setBooking(null);
        setAwb(null);
        if (mode === "booking") {
          const asBooking = await scanBookingAction(code);
          if (asBooking.ok && asBooking.booking) {
            scanFeedback(true);
            setBooking(asBooking.booking);
            return;
          }
          scanFeedback(false);
          setError(
            asBooking.ok ? "Nomor booking tidak ditemukan." : asBooking.message,
          );
          return;
        }
        const result = await scanLookupAction(code);
        scanFeedback(result.ok);
        if (result.ok) setAwb(result.awb);
        else setError(result.message);
      } catch {
        setError("Koneksi terputus. Scan ulang.");
      } finally {
        setBusy(false);
      }
    },
    [mode],
  );

  const latest = awb?.proofs[0];
  const final = awb?.status === "Delivered" || awb?.status === "Cancelled";
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Yang di-scan</legend>
        <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
          {(
            [
              ["awb", "AWB / Resi"],
              ["booking", "Booking (jemput)"],
            ] as const
          ).map(([value, text]) => (
            <Button
              key={value}
              type="button"
              variant={mode === value ? "default" : "outline"}
              aria-pressed={mode === value}
              className="min-h-11"
              onClick={() => {
                setMode(value);
                setAwb(null);
                setBooking(null);
                setError(null);
                setSaved(null);
              }}
            >
              {text}
            </Button>
          ))}
        </div>
      </fieldset>
      <ScanInput
        onCode={lookup}
        busy={busy}
        label={mode === "booking" ? "Nomor Booking" : "Nomor AWB"}
      />
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {saved && (
        <output className="block rounded-md border border-primary p-3 text-sm">
          {saved}
        </output>
      )}
      {booking && (
        <BookingCard
          booking={booking}
          onConfirmed={(next) => {
            setBooking(next);
            setSaved(`Booking ${next.bookingNo} dijemput (${next.status}).`);
            scanFeedback(true);
          }}
          onError={(message) => {
            setError(message);
            scanFeedback(false);
          }}
        />
      )}
      {awb && (
        <article className="space-y-4" aria-label={`AWB ${awb.awbNo}`}>
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-lg font-semibold">{awb.awbNo}</h2>
            <span className="rounded-full border px-3 py-1 text-sm">
              {awb.status}
            </span>
          </header>
          <section className="rounded-lg border bg-background p-4">
            <h3 className="mb-3 font-medium">Pengirim</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Field label="No. DO" value={awb.sender.doNo} />
              <Field label="Asal" value={awb.sender.origin} />
              <Field label="Nama" value={awb.sender.name} />
              <Field label="Alamat" value={awb.sender.address} />
            </dl>
          </section>
          <section className="rounded-lg border bg-background p-4">
            <h3 className="mb-3 font-medium">Penerima</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Field label="Nama" value={awb.receiver.name} />
              <Field label="Tujuan" value={awb.receiver.destination} />
              <Field label="Alamat" value={awb.receiver.address} />
              <Field label="No. Telp" value={awb.receiver.phone} />
              <Field label="Jumlah barang (koli)" value={awb.goods.koli} />
              <Field label="Berat (kg)" value={awb.goods.kilo} />
              <Field label="Volume" value={awb.goods.volume} />
              <Field label="Terberat (kg)" value={awb.goods.chargeable} />
            </dl>
          </section>
          <section className="rounded-lg border bg-background p-4">
            <h3 className="mb-3 font-medium">Tracking details</h3>
            <ol className="space-y-3 border-l pl-4 text-sm">
              {awb.tracking.map((event, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: events have no id
                <li key={index} className="relative">
                  <span className="absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full bg-primary" />
                  <p className="text-xs text-muted-foreground">
                    {when(event.at)}
                    {event.by ? ` · ${event.by}` : ""}
                  </p>
                  <p className="[overflow-wrap:anywhere]">{event.text}</p>
                </li>
              ))}
            </ol>
          </section>
          {latest && (latest.photos.length > 0 || latest.signatureUrl) && (
            <section className="rounded-lg border bg-background p-4">
              <h3 className="mb-3 font-medium">
                Foto penerima dan tanda tangan
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {latest.photos.map((photo) => (
                  <a
                    key={photo.position}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* biome-ignore lint/performance/noImgElement: Cloudinary thumbnail */}
                    <img
                      src={cdn(photo.url, "c_fill,w_200,h_200")}
                      alt={`Foto penerima ${photo.position}`}
                      loading="lazy"
                      className="aspect-square w-full rounded-md border object-cover"
                    />
                  </a>
                ))}
                {latest.signatureUrl && (
                  <a
                    href={latest.signatureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* biome-ignore lint/performance/noImgElement: Cloudinary image */}
                    <img
                      src={cdn(
                        latest.signatureUrl,
                        "c_pad,w_200,h_200,b_white",
                      )}
                      alt="Tanda tangan penerima"
                      loading="lazy"
                      className="aspect-square w-full rounded-md border bg-white object-contain"
                    />
                  </a>
                )}
              </div>
            </section>
          )}
          <Button
            type="button"
            className="min-h-11 w-full"
            disabled={final}
            onClick={() => setEditing(true)}
          >
            {final ? `AWB sudah ${awb.status}` : "Update Status"}
          </Button>
          <ProofForm
            awb={awb}
            open={editing}
            onOpenChange={setEditing}
            onSaved={(next) => {
              setAwb(next);
              setSaved(`Status ${next.awbNo} tersimpan.`);
              scanFeedback(true);
            }}
          />
        </article>
      )}
    </div>
  );
}

/** Scanned booking (pickup order): details and Konfirmasi Jemput. */
function BookingCard({
  booking,
  onConfirmed,
  onError,
}: {
  booking: BookingScanView;
  onConfirmed: (booking: BookingScanView) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <article className="space-y-4" aria-label={`Booking ${booking.bookingNo}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-lg font-semibold">
          Booking {booking.bookingNo}
        </h2>
        <span className="rounded-full border px-3 py-1 text-sm">
          {booking.status}
        </span>
      </header>
      <section className="rounded-lg border bg-background p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Field label="Cabang" value={booking.branch} />
          <Field label="Kurir" value={booking.courier} />
          <Field label="Tanggal" value={when(booking.bookingDate)} />
          <Field label="Tujuan" value={booking.destination} />
          <Field label="Pengirim" value={booking.senderName} />
          <Field label="Penerima" value={booking.receiverName} />
          <Field label="Koli" value={booking.koli} />
          <Field label="Berat (kg)" value={booking.kilo} />
          {booking.pickedUpAt && (
            <Field
              label="Dijemput"
              value={`${when(booking.pickedUpAt)}${booking.pickedUpBy ? ` · ${booking.pickedUpBy}` : ""}`}
            />
          )}
          {booking.cancelReason && (
            <Field label="Alasan batal" value={booking.cancelReason} />
          )}
        </dl>
      </section>
      {booking.blocked && (
        <p className="text-sm text-muted-foreground">{booking.blocked}</p>
      )}
      <Button
        type="button"
        className="min-h-11 w-full"
        disabled={!!booking.blocked || busy}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await confirmPickupAction(booking.id);
            if (result.ok) onConfirmed(result.booking);
            else onError(result.message);
          } catch {
            onError("Koneksi terputus. Coba lagi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Menyimpan…" : "Konfirmasi Jemput"}
      </Button>
    </article>
  );
}
