"use client";

import { useState, useTransition } from "react";
import { createBookingAction } from "../actions";

type BookingActionError =
  | "UNAUTHENTICATED"
  | "FORBIDDEN_BRANCH"
  | "VALIDATION"
  | "CONFLICT"
  | "UNKNOWN";

function getErrorMessage(error: BookingActionError) {
  switch (error) {
    case "UNAUTHENTICATED":
      return "Sesi Anda berakhir. Silakan masuk kembali.";
    case "FORBIDDEN_BRANCH":
      return "Anda tidak memiliki akses ke cabang yang dipilih.";
    case "VALIDATION":
      return "Data booking tidak valid. Periksa kembali isian Anda.";
    case "CONFLICT":
      return "Booking tidak dapat disimpan karena terjadi konflik data.";
    default:
      return "Gagal menyimpan booking. Silakan coba lagi.";
  }
}

export function BookingForm() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.delete("status");
    setErrorMessage(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await createBookingAction(formData);
      if (result.ok) {
        setSuccessMessage("Booking berhasil disimpan.");
        return;
      }
      setErrorMessage(getErrorMessage(result.error));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="bookingNo" className="text-sm font-medium">
            Booking No.
          </label>
          <input
            id="bookingNo"
            name="bookingNo"
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
        <div>
          <label htmlFor="branchId" className="text-sm font-medium">
            Cabang (branchId)
          </label>
          <input
            id="branchId"
            name="branchId"
            type="number"
            className="w-full border rounded px-2 py-1"
            required
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
          <label htmlFor="destination" className="text-sm font-medium">
            Tujuan
          </label>
          <input
            id="destination"
            name="destination"
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
      </div>
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <output className="block text-sm text-green-700">
          {successMessage}
        </output>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        {isPending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
