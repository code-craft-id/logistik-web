"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { imageToWebp } from "@/lib/image-to-webp";
import { attachDeliveryPhotoFormAction } from "../manifest-form-actions";

/**
 * Optional proof-of-delivery photo for one delivery sheet line. The photo is
 * compressed to WebP in the browser, previewed, then uploaded on submit.
 */
export function DeliveryPhotoForm({
  manifestId,
  deliverySheetId,
  transactionId,
}: {
  manifestId: number | null;
  deliverySheetId: number;
  transactionId: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const id = `pod-photo-${deliverySheetId}-${transactionId}`;
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!file) {
          setError("Pilih atau ambil foto terlebih dahulu.");
          return;
        }
        const data = new FormData(event.currentTarget);
        data.set("photo", file);
        setError(null);
        start(async () => {
          try {
            const result = await attachDeliveryPhotoFormAction(data);
            if (result.ok) router.refresh();
            else setError(result.message);
          } catch {
            setError("Gagal upload. Periksa koneksi lalu coba lagi.");
          }
        });
      }}
    >
      {manifestId !== null && (
        <input type="hidden" name="manifestId" value={manifestId} />
      )}
      <input type="hidden" name="deliverySheetId" value={deliverySheetId} />
      <input type="hidden" name="transactionId" value={transactionId} />
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium">
          Foto bukti terima (opsional)
        </label>
        <input
          id={id}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={pending}
          onChange={async (event) => {
            const picked = event.target.files?.[0];
            setError(null);
            setFile(null);
            setPreview(null);
            if (!picked) return;
            try {
              const webp = await imageToWebp(picked);
              setFile(webp);
              setPreview(URL.createObjectURL(webp));
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Foto tidak bisa diproses.",
              );
            }
          }}
          className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-md file:border file:bg-background file:px-3"
        />
        <p className="text-xs text-muted-foreground">
          Di HP bisa langsung memotret. Foto dikompres ke WebP sebelum dikirim.
        </p>
      </div>
      {preview && (
        // biome-ignore lint/performance/noImgElement: local object URL preview
        <img
          src={preview}
          alt="Pratinjau foto bukti terima"
          className="max-h-64 rounded-md border object-contain"
        />
      )}
      <Button type="submit" disabled={pending || !file} className="min-h-11">
        {pending ? "Mengupload…" : "Upload foto"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
