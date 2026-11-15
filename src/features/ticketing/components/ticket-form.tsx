"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTicket } from "../actions";

export function TicketForm({
  branches,
  idempotencyKey,
  canView = true,
}: {
  branches: { id: number; name: string }[];
  idempotencyKey: string;
  canView?: boolean;
}) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<number | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || savedId !== null) return;
    const data = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const result = await createTicket({
        branchId: data.get("branchId"),
        subject: data.get("subject"),
        menuName: data.get("menuName"),
        relatedPageUrl: data.get("relatedPageUrl"),
        remarks: data.get("remarks"),
        priority: data.get("priority"),
        idempotencyKey,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSavedId(result.id);
      if (canView) {
        router.push(`/ticketting/${result.id}`);
        router.refresh();
      }
    } catch {
      setError(
        "Tiket belum dapat dikonfirmasi. Coba kembali dengan isi yang sama.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-6" aria-busy={pending}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ticket-branch">Cabang pemilik</Label>
          <select
            id="ticket-branch"
            name="branchId"
            required
            defaultValue=""
            className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
          >
            <option value="" disabled>
              Pilih cabang
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} (ID {branch.id})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticket-priority">Prioritas</Label>
          <select
            id="ticket-priority"
            name="priority"
            required
            defaultValue=""
            className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
          >
            <option value="" disabled>
              Pilih prioritas
            </option>
            {["Low", "Normal", "High"].map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ticket-subject">Judul</Label>
          <Input
            id="ticket-subject"
            name="subject"
            required
            maxLength={200}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticket-menu">Menu</Label>
          <Input
            id="ticket-menu"
            name="menuName"
            required
            maxLength={200}
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticket-url">Link URL terkait</Label>
          <Input
            id="ticket-url"
            name="relatedPageUrl"
            required
            maxLength={2048}
            aria-describedby="ticket-url-help"
            className="min-h-11"
          />
          <p id="ticket-url-help" className="text-xs text-muted-foreground">
            Gunakan http(s) tanpa kredensial atau /path. URL disimpan sebagai
            teks.
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ticket-remarks">Keterangan (opsional)</Label>
          <Textarea
            id="ticket-remarks"
            name="remarks"
            maxLength={5000}
            rows={5}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error}
        </p>
      )}
      {savedId !== null && (
        <output className="block text-sm">
          Tiket tersimpan. ID internal: {savedId}.
        </output>
      )}
      {!branches.length && (
        <output className="block text-sm text-muted-foreground">
          Tidak ada cabang aktif yang tersedia. Hubungi administrator.
        </output>
      )}
      <div className="flex flex-wrap gap-3 border-t pt-4">
        <Button
          type="submit"
          className="min-h-11"
          disabled={pending || !branches.length || savedId !== null}
        >
          {pending ? "Menyimpan…" : "Simpan tiket"}
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link href={canView ? "/ticketting" : "/dashboard"}>Kembali</Link>
        </Button>
      </div>
    </form>
  );
}
