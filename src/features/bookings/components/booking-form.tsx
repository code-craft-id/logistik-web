"use client";

import { useTransition } from "react";
import { createBookingAction } from "../actions";

export function BookingForm() {
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      await createBookingAction(formData);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Booking No.</label>
          <input name="bookingNo" className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm font-medium">DO No.</label>
          <input name="doNo" className="w-full border rounded px-2 py-1" />
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
          <label className="text-sm font-medium">Tujuan</label>
          <input name="destination" className="w-full border rounded px-2 py-1" />
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
        {isPending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
