"use client";

import { useTransition } from "react";
import { updateTransactionStatusAction } from "../actions";
import { ALLOWED_TRANSITIONS } from "../status";

export function StatusUpdateForm({
  transactionId,
  currentStatus,
}: {
  transactionId: number;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

  function onSubmit(formData: FormData) {
    formData.set("transactionId", String(transactionId));
    startTransition(async () => {
      try {
        await updateTransactionStatusAction(formData);
      } catch (e) {
        alert("Gagal mengubah status. Pastikan transisi valid.");
      }
    });
  }

  if (allowed.length === 0) {
    return <div className="text-sm text-muted-foreground">Tidak ada transisi status yang diizinkan.</div>;
  }

  return (
    <form action={onSubmit} className="space-y-2">
      <div className="flex gap-2 items-center">
        <select name="newStatus" className="border rounded px-2 py-1">
          {allowed.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input name="reason" placeholder="Alasan (opsional)" className="border rounded px-2 py-1 flex-1" />
        <button type="submit" disabled={isPending} className="px-3 py-1 border rounded">
          {isPending ? "Menyimpan..." : "Ubah Status"}
        </button>
      </div>
    </form>
  );
}
