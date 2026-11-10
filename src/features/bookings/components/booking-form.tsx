"use client";

import { useTransition } from "react";
import { createBookingAction } from "../actions";

export function BookingForm() {
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    formData.delete("status");
    startTransition(async () => {
      await createBookingAction(formData);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 max-w-2xl">
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
