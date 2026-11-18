"use client";

import { useState, useTransition } from "react";
import { ComboSelect } from "@/components/ui/combo-select";
import {
  type CreateTransactionActionResult,
  createTransactionAction,
} from "../actions";

type Option = { id: number; name: string };
export type TransactionFormOptions = {
  branches: Option[];
  customers: Option[];
  transportModes: Option[];
  deliveryServices: Option[];
  goodsTypes: Option[];
  costTypes: Option[];
};
const selectClass = "w-full border rounded px-2 py-1 min-h-11 bg-background";

function Choice({
  name,
  label,
  options,
  required = false,
}: {
  name: string;
  label: string;
  options: Option[];
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </label>
      <ComboSelect
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className={selectClass}
      >
        <option value="">{required ? "Pilih…" : "Tidak dipilih"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </ComboSelect>
    </div>
  );
}

export function TransactionForm({
  options,
}: {
  options?: TransactionFormOptions;
} = {}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const generateKey = () => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.getRandomValues === "function"
    ) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    throw new Error(
      "Secure cryptographic random generator is required for idempotency keys",
    );
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
        const res: CreateTransactionActionResult =
          await createTransactionAction(formData);
        if (res.ok) {
          setSuccess(
            res.idempotent
              ? "AWB ini sudah tersimpan sebelumnya; tidak dibuat ganda."
              : "AWB berhasil disimpan.",
          );
          setIdempotencyKey(generateKey());
        } else {
          if (res.error === "VALIDATION") {
            setError(
              "Data belum lengkap atau tidak valid. Periksa Asal (wajib), angka koli/berat/volume/biaya, dan pilihan master yang aktif.",
            );
          } else if (res.error === "UNAUTHENTICATED") {
            setError("Sesi Anda berakhir. Silakan masuk kembali.");
          } else if (res.error === "FORBIDDEN_BRANCH") {
            setError(
              "Anda tidak punya akses ke cabang atau customer yang dipilih. Pilih cabang/customer milik Anda.",
            );
          } else if (res.error === "IDEMPOTENCY_CONFLICT") {
            setError(
              "Nomor AWB ini sudah dipakai dengan data yang berbeda. Gunakan nomor AWB lain atau kosongkan agar dibuat otomatis.",
            );
          } else if (res.error === "CONFLICT") {
            setError(
              "Nomor AWB sudah dipakai di cabang asal ini. Gunakan nomor AWB lain.",
            );
          } else {
            setError(
              "AWB belum tersimpan karena kesalahan sistem. Coba lagi; jika berulang, hubungi admin.",
            );
          }
        }
      } catch {
        setError(
          "Koneksi ke server terputus. Periksa jaringan lalu coba simpan lagi.",
        );
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 max-w-3xl">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <output className="block rounded-md border border-primary p-3 text-sm text-primary">
          {success}
        </output>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="awbNo" className="text-sm font-medium">
            AWB No. (opsional)
          </label>
          <input
            id="awbNo"
            name="awbNo"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="doNo" className="text-sm font-medium">
            DO No.
          </label>
          <input
            id="doNo"
            name="doNo"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        {options ? (
          <>
            <Choice
              name="originBranchId"
              label="Asal"
              options={options.branches}
              required
            />
            <Choice
              name="destinationBranchId"
              label="Tujuan"
              options={options.branches}
            />
          </>
        ) : (
          <>
            <div>
              <label htmlFor="originBranchId" className="text-sm font-medium">
                Cabang Asal (originBranchId) *
              </label>
              <input
                id="originBranchId"
                name="originBranchId"
                type="number"
                required
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label
                htmlFor="destinationBranchId"
                className="text-sm font-medium"
              >
                Cabang Tujuan (destinationBranchId)
              </label>
              <input
                id="destinationBranchId"
                name="destinationBranchId"
                type="number"
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="bookingId" className="text-sm font-medium">
            Booking ID (opsional)
          </label>
          <input
            id="bookingId"
            name="bookingId"
            type="number"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="senderName" className="text-sm font-medium">
            Pengirim
          </label>
          <input
            id="senderName"
            name="senderName"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="receiverName" className="text-sm font-medium">
            Penerima
          </label>
          <input
            id="receiverName"
            name="receiverName"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="koli" className="text-sm font-medium">
            Koli
          </label>
          <input
            id="koli"
            name="koli"
            type="number"
            min="0"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="kilo" className="text-sm font-medium">
            Kilo
          </label>
          <input
            id="kilo"
            name="kilo"
            type="number"
            step="0.01"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="volume" className="text-sm font-medium">
            Volume
          </label>
          <input
            id="volume"
            name="volume"
            type="number"
            step="0.001"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="biaya" className="text-sm font-medium">
            Biaya (Rp.)
          </label>
          <input
            id="biaya"
            name="biaya"
            type="number"
            step="0.01"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        {options && (
          <>
            <Choice
              name="customerId"
              label="Customer"
              options={options.customers}
            />
            <Choice
              name="deliveryServiceId"
              label="Layanan"
              options={options.deliveryServices}
            />
            <Choice
              name="goodsTypeId"
              label="DOC / PAC"
              options={options.goodsTypes}
            />
            <Choice
              name="transportModeId"
              label="Via Moda"
              options={options.transportModes}
            />
            <Choice
              name="costTypeId"
              label="Pembayaran"
              options={options.costTypes}
            />
          </>
        )}
        <div>
          <label htmlFor="description" className="text-sm font-medium">
            Isi Barang
          </label>
          <input
            id="description"
            name="description"
            maxLength={500}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="remarks" className="text-sm font-medium">
            Keterangan
          </label>
          <input
            id="remarks"
            name="remarks"
            maxLength={500}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        {isPending ? "Menyimpan..." : "Simpan AWB/Transaction"}
      </button>
    </form>
  );
}
