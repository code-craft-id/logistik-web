"use client";

import { useTransition, useState } from "react";
import { createTransactionAction } from "../actions";

export function TransactionForm() {
  const [isPending, startTransition] = useTransition();
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  );

  function onSubmit(formData: FormData) {
    formData.set("idempotencyKey", idempotencyKey);
    startTransition(async () => {
      await createTransactionAction(formData);
      // Rotate key for next submission to avoid accidental reuse
      setIdempotencyKey(
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      );
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 max-w-3xl">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">AWB No. (opsional)</label>
          <input name="awbNo" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">DO No.</label>
          <input name="doNo" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Cabang Asal (originBranchId) *</label>
          <input name="originBranchId" type="number" required className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Cabang Tujuan (destinationBranchId)</label>
          <input name="destinationBranchId" type="number" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Booking ID (opsional)</label>
          <input name="bookingId" type="number" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Pengirim</label>
          <input name="senderName" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Penerima</label>
          <input name="receiverName" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <input name="status" defaultValue="Open" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Koli</label>
          <input name="koli" type="number" min="0" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Kilo</label>
          <input name="kilo" type="number" step="0.01" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Volume</label>
          <input name="volume" type="number" step="0.001" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Biaya (Rp.)</label>
          <input name="biaya" type="number" step="0.01" className="w-full border rounded px-2 py-1" />
        </div>
      </div>
      <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded">
        {isPending ? "Menyimpan..." : "Simpan AWB/Transaction"}
      </button>
    </form>
  );
}
