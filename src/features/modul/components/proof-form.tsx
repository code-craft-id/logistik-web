"use client";

import { ImagePlus, PenLine, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { imageToWebp } from "@/lib/image-to-webp";
import { recordProofAction, uploadProofImageAction } from "../proof-actions";
import type { ScanAwbView } from "../server/proof";
import { SignaturePad } from "./signature-pad";

type Slot = { file: File; preview: string } | null;

/** Update Status (DITERIMA/RETUR) with receiver, note, photos 1–5 and signature. */
export function ProofForm({
  awb,
  open,
  onOpenChange,
  onSaved,
}: {
  awb: ScanAwbView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (awb: ScanAwbView) => void;
}) {
  const [outcome, setOutcome] = useState<"DELIVERED" | "RETURNED">("DELIVERED");
  const [receiver, setReceiver] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<Slot[]>([null, null, null, null, null]);
  const [signature, setSignature] = useState<Slot>(null);
  const [signing, setSigning] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start fresh for each AWB and release preview URLs on close.
  useEffect(() => {
    if (!open) return;
    setOutcome("DELIVERED");
    setReceiver(awb.receiver.name ?? "");
    setNotes("");
    setPhotos([null, null, null, null, null]);
    setSignature(null);
    setError(null);
  }, [open, awb.receiver.name]);

  const upload = async (file: File) => {
    const data = new FormData();
    data.set("transactionId", String(awb.id));
    data.set("outcome", outcome);
    data.set("file", file);
    const result = await uploadProofImageAction(data);
    if (!result.ok) throw new Error(result.message);
    return { url: result.url, publicId: result.publicId, token: result.token };
  };

  const submit = async () => {
    setError(null);
    if (outcome === "DELIVERED" && !receiver.trim()) {
      setError("Nama penerima wajib diisi untuk status DITERIMA.");
      return;
    }
    try {
      const chosen = photos.filter((p): p is NonNullable<Slot> => !!p);
      const uploaded = [];
      for (const [index, photo] of chosen.entries()) {
        setBusy(`Mengupload foto ${index + 1} dari ${chosen.length}…`);
        uploaded.push(await upload(photo.file));
      }
      let signed = null;
      if (signature) {
        setBusy("Mengupload tanda tangan…");
        signed = await upload(signature.file);
      }
      setBusy("Menyimpan…");
      const result = await recordProofAction({
        transactionId: awb.id,
        outcome,
        receiverName: receiver.trim() || undefined,
        notes: notes.trim() || undefined,
        photos: uploaded,
        signature: signed,
      });
      if (!result.ok) throw new Error(result.message);
      onSaved(result.awb);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan. Coba lagi.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Status {awb.awbNo}</DialogTitle>
            <DialogDescription>
              Foto dan tanda tangan opsional. Foto dikompres ke WebP sebelum
              dikirim.
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={!!busy} className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["DELIVERED", "DITERIMA"],
                    ["RETURNED", "RETUR"],
                  ] as const
                ).map(([value, text]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={outcome === value ? "default" : "outline"}
                    aria-pressed={outcome === value}
                    className="min-h-11"
                    onClick={() => setOutcome(value)}
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proof-receiver">
                Nama penerima{outcome === "DELIVERED" ? " *" : ""}
              </Label>
              <Input
                id="proof-receiver"
                value={receiver}
                maxLength={150}
                onChange={(e) => setReceiver(e.target.value)}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proof-notes">Keterangan</Label>
              <Textarea
                id="proof-notes"
                value={notes}
                maxLength={500}
                rows={2}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Foto penerima (1–5)</span>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {photos.map((slot, index) => (
                  <PhotoSlot
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed five slots
                    key={index}
                    index={index}
                    slot={slot}
                    onChange={(next) =>
                      setPhotos((prev) =>
                        prev.map((p, i) => (i === index ? next : p)),
                      )
                    }
                    onError={setError}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Tanda tangan</span>
              {signature ? (
                <div className="flex items-center gap-3">
                  {/* biome-ignore lint/performance/noImgElement: local preview */}
                  <img
                    src={signature.preview}
                    alt="Tanda tangan penerima"
                    className="h-20 rounded border bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setSigning(true)}
                  >
                    Ulangi
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setSignature(null)}
                  >
                    Hapus
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setSigning(true)}
                >
                  <PenLine aria-hidden="true" />
                  Tanda tangan
                </Button>
              )}
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {busy && (
              <output className="block text-sm text-muted-foreground">
                {busy}
              </output>
            )}
            <Button type="button" className="min-h-11 w-full" onClick={submit}>
              Simpan {outcome === "DELIVERED" ? "DITERIMA" : "RETUR"}
            </Button>
          </fieldset>
        </DialogContent>
      </Dialog>
      <SignaturePad
        open={signing}
        onOpenChange={setSigning}
        onSave={(png) =>
          setSignature({
            file: new File([png], "signature.png", { type: "image/png" }),
            preview: URL.createObjectURL(png),
          })
        }
      />
    </>
  );
}

function PhotoSlot({
  index,
  slot,
  onChange,
  onError,
}: {
  index: number;
  slot: Slot;
  onChange: (slot: Slot) => void;
  onError: (message: string) => void;
}) {
  const id = `proof-photo-${index}`;
  return slot ? (
    <div className="relative">
      {/* biome-ignore lint/performance/noImgElement: local preview */}
      <img
        src={slot.preview}
        alt={`Foto penerima ${index + 1}`}
        className="aspect-square w-full rounded-md border object-cover"
      />
      <button
        type="button"
        aria-label={`Hapus foto ${index + 1}`}
        onClick={() => onChange(null)}
        className="absolute top-1 right-1 inline-flex size-8 items-center justify-center rounded-full bg-background/90 shadow"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  ) : (
    <label
      htmlFor={id}
      className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground"
    >
      <ImagePlus className="size-5" aria-hidden="true" />
      Foto {index + 1}
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={async (event) => {
          const picked = event.target.files?.[0];
          event.target.value = "";
          if (!picked) return;
          try {
            const file = await imageToWebp(picked);
            onChange({ file, preview: URL.createObjectURL(file) });
          } catch (e) {
            onError(
              e instanceof Error ? e.message : "Foto tidak bisa diproses.",
            );
          }
        }}
      />
    </label>
  );
}
