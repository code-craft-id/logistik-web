"use client";

import { useTransition, useState } from "react";
import { createTransactionAction, type CreateTransactionActionResult } from "../actions";

export function TransactionForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    setError(null);
    setSuccess(null);
    formData.set("idempotencyKey", idempotencyKey);
    formData.delete("status");
    for (const key of ["bookingId", "destinationBranchId", "courierId"]) {
      const val = formData.get(key);
      if (typeof val === "string" && val.trim() === "") {
        formData.delete(key);
      }
    }
    startTransition(async () => {
      try {
        const res: CreateTransactionActionResult = await createTransactionAction(formData);
        if (res.ok) {
          setSuccess(res.idempotent ? "AWB/Transaksi sudah ada (idempotent)." : "AWB/Transaksi berhasil disimpan.");
          setIdempotencyKey(generateKey());
        } else {
          if (res.error === "VALIDATION") {
            setError("Data tidak valid. Periksa kolom wajib dan format angka.");
          } else if (res.error === "UNAUTHENTICATED") {
            setError("Sesi tidak valid. Silakan login kembali.");
          } else if (res.error === "FORBIDDEN_BRANCH") {
            setError("Tidak memiliki akses cabang untuk operasi ini.");
          } else if (res.error === "IDEMPOTENCY_CONFLICT") {
            setError("AWB/IDempotency bertabrakan dengan payload berbeda.");
          } else if (res.error === "CONFLICT") {
            setError("Data bertabrakan atau sudah digunakan.");
          } else {
            setError("Gagal menyimpan AWB/Transaksi.");
          }
        }
      } catch {
        setError("Terjadi kesalahan saat menyimpan.");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 max-w-3xl">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-700">{success}</div> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="awbNo" className="text-sm font-medium">AWB No. (opsional)</label>
          <input id="awbNo" name="awbNo" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="doNo" className="text-sm font-medium">DO No.</label>
          <input id="doNo" name="doNo" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="originBranchId" className="text-sm font-medium">Cabang Asal (originBranchId) *</label>
          <input id="originBranchId" name="originBranchId" type="number" required className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="destinationBranchId" className="text-sm font-medium">Cabang Tujuan (destinationBranchId)</label>
          <input id="destinationBranchId" name="destinationBranchId" type="number" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="bookingId" className="text-sm font-medium">Booking ID (opsional)</label>
          <input id="bookingId" name="bookingId" type="number" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="senderName" className="text-sm font-medium">Pengirim</label>
          <input id="senderName" name="senderName" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="receiverName" className="text-sm font-medium">Penerima</label>
          <input id="receiverName" name="receiverName" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="koli" className="text-sm font-medium">Koli</label>
          <input id="koli" name="koli" type="number" min="0" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="kilo" className="text-sm font-medium">Kilo</label>
          <input id="kilo" name="kilo" type="number" step="0.01" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="volume" className="text-sm font-medium">Volume</label>
          <input id="volume" name="volume" type="number" step="0.001" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label htmlFor="biaya" className="text-sm font-medium">Biaya (Rp.)</label>
          <input id="biaya" name="biaya" type="number" step="0.01" className="w-full border rounded px-2 py-1" />
        </div>
      </div>
      <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded">
        {isPending ? "Menyimpan..." : "Simpan AWB/Transaction"}
      </button>
    </form>
  );
}
