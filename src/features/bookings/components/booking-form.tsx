"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ComboSelect } from "@/components/ui/combo-select";
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
      return "Anda tidak punya akses ke cabang atau customer yang dipilih. Pilih cabang/customer milik Anda.";
    case "VALIDATION":
      return "Data booking belum lengkap atau tidak valid. Periksa Cabang (wajib) dan angka koli/berat/volume/biaya.";
    case "CONFLICT":
      return "Nomor booking sudah dipakai. Gunakan nomor lain atau kosongkan.";
    default:
      return "Booking belum tersimpan karena kesalahan sistem. Coba lagi; jika berulang, hubungi admin.";
  }
}

type Option = { id: number; name: string };
const selectClass = "w-full border rounded px-2 py-1 min-h-11 bg-background";

export function BookingForm({
  options,
}: {
  options?: {
    branches: Option[];
    customers: Option[];
    nextBooking?: Record<number, string>;
  };
} = {}) {
  const [isPending, startTransition] = useTransition();
  const [bookingNo, setBookingNo] = useState("");
  const [branch, setBranch] = useState("");
  const suggested = options?.nextBooking?.[Number(branch)] ?? "";
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.delete("status");
    // Unchanged suggestion or empty: the server assigns the number under a lock.
    const typed = String(formData.get("bookingNo") ?? "").trim();
    if (!typed || typed === suggested) {
      formData.delete("bookingNo");
      formData.set("autoBookingNo", "true");
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await createBookingAction(formData);
      if (result.ok) {
        setSuccessMessage(
          result.bookingNo
            ? `Booking ${result.bookingNo} berhasil disimpan.`
            : "Booking berhasil disimpan.",
        );
        form.reset();
        setBookingNo("");
        setBranch("");
        router.refresh();
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
            maxLength={50}
            value={bookingNo}
            onChange={(e) => setBookingNo(e.target.value)}
            placeholder="Pilih Cabang untuk nomor otomatis"
            aria-describedby="bookingNo-hint"
            className="w-full border rounded px-2 py-1 min-h-11"
          />
          <p id="bookingNo-hint" className="text-xs text-muted-foreground">
            {bookingNo && bookingNo === suggested
              ? "Nomor otomatis (dikunci saat disimpan). Ubah bila ingin nomor manual."
              : bookingNo
                ? "Nomor manual."
                : "Kosongkan untuk nomor otomatis."}
          </p>
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
            <div>
              <label htmlFor="branchId" className="text-sm font-medium">
                Cabang *
              </label>
              <ComboSelect
                id="branchId"
                name="branchId"
                required
                defaultValue=""
                className={selectClass}
                onChange={(e) => {
                  const next = e.target.value;
                  // Follow the branch's suggested number unless typed manually.
                  if (bookingNo === "" || bookingNo === suggested)
                    setBookingNo(options?.nextBooking?.[Number(next)] ?? "");
                  setBranch(next);
                }}
              >
                <option value="">Pilih…</option>
                {options.branches.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </ComboSelect>
            </div>
            <div>
              <label htmlFor="customerId" className="text-sm font-medium">
                Customer
              </label>
              <ComboSelect
                id="customerId"
                name="customerId"
                defaultValue=""
                className={selectClass}
              >
                <option value="">Tidak dipilih</option>
                {options.customers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </ComboSelect>
            </div>
          </>
        ) : (
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
        )}
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
