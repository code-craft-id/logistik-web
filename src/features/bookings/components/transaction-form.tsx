"use client";

import { useTransition, useState } from "react";
import { createTransactionAction } from "../actions";

export function TransactionForm() {
  const [isPending, startTransition] = useTransition();
  const generateKey = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    throw new Error("Secure cryptographic random generator is required for idempotency keys");
  };

  const [idempotencyKey, setIdempotencyKey] = useState(() => generateKey());

  function onSubmit(formData: FormData) {
    formData.set("idempotencyKey", idempotencyKey);
    startTransition(async () => {
      await createTransactionAction(formData);
      // Rotate key for next submission to avoid accidental reuse
      setIdempotencyKey(generateKey());
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
