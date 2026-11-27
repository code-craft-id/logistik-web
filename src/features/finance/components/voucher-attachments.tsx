"use client";
import { Paperclip } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { imageToWebp } from "@/lib/image-to-webp";
import {
  addVoucherAttachmentAction,
  removeVoucherAttachmentAction,
} from "../voucher-attachment-actions";

/** Kasir Lampiran: list, add (image, max 1 MB) and remove attachments. */
export function VoucherAttachments({
  journalId,
  attachments,
  canEdit,
}: {
  journalId: number;
  attachments: { id: number; url: string; fileName: string }[];
  canEdit: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  async function send(
    action: (f: FormData) => Promise<typeof result>,
    form: FormData,
  ) {
    setBusy(true);
    setResult(undefined);
    try {
      setResult(await action(form));
    } catch {
      setResult({ ok: false, message: "Permintaan gagal. Coba lagi." });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium">Lampiran</p>
      {attachments.length === 0 && (
        <p className="text-muted-foreground">Belum ada lampiran.</p>
      )}
      <ul className="space-y-1">
        {attachments.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2">
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-primary underline underline-offset-4"
            >
              <Paperclip aria-hidden="true" className="size-4" />
              {a.fileName}
            </a>
            {canEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={busy}
                onClick={() => {
                  const form = new FormData();
                  form.set("attachmentId", String(a.id));
                  void send(removeVoucherAttachmentAction, form);
                }}
              >
                Hapus
              </Button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const picked = new FormData(form).get("file");
            if (!(picked instanceof File) || !picked.size) return;
            setBusy(true);
            // Phone photos are compressed to WebP (max 1 MB) before upload.
            void imageToWebp(picked)
              .then((webp) => {
                const data = new FormData();
                data.set("journalId", String(journalId));
                data.set("file", webp, picked.name);
                return send(addVoucherAttachmentAction, data);
              })
              .then(() => form.reset())
              .catch(() => {
                setBusy(false);
                setResult({
                  ok: false,
                  message:
                    "Gambar tidak dapat diproses. Pilih foto JPG, PNG atau WebP.",
                });
              });
          }}
        >
          <Input
            name="file"
            type="file"
            accept="image/webp,image/jpeg,image/png"
            required
            aria-label="File lampiran"
            className="min-h-11 max-w-xs"
          />
          <Button type="submit" className="min-h-11" disabled={busy}>
            {busy ? "Mengunggah…" : "Tambah Lampiran"}
          </Button>
        </form>
      )}
      {result && (
        <output className={result.ok ? "text-primary" : "text-destructive"}>
          {result.message}
        </output>
      )}
    </div>
  );
}
