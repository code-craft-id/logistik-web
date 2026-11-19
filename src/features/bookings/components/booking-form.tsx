"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { ComboSelect } from "@/components/ui/combo-select";
import { formatRupiah } from "@/lib/format/rupiah";
import { createBookingAction } from "../actions";
import { DimensionDialog, modeDivider } from "./dimension-dialog";

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
      return "Data booking belum lengkap atau tidak valid. Periksa Asal (wajib), kurir (harus dari cabang asal), pilihan master yang aktif, dan angka koli/berat/volume/harga.";
    case "CONFLICT":
      return "Nomor booking sudah dipakai. Gunakan nomor lain atau kembali ke nomor otomatis.";
    default:
      return "Booking belum tersimpan karena kesalahan sistem. Coba lagi; jika berulang, hubungi admin.";
  }
}

type Option = { id: number; name: string };
export type BookingFormOptions = {
  branches: Option[];
  destinations?: Option[];
  customers: Option[];
  nextBooking?: Record<number, string>;
  deliveryServices?: Option[];
  goodsTypes?: Option[];
  transportModes?: (Option & { divider?: string })[];
  costTypes?: Option[];
  couriers?: (Option & { branchId: number | null })[];
  consignees?: (Option & { address: string; phone: string })[];
  tariffs?: {
    originBranchId: number;
    destinationBranchId: number;
    deliveryServiceId: number | null;
    pricePerKg: string;
    minWeight: string;
  }[];
};

const field =
  "w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base min-h-11 md:text-sm";
const readOnlyField = `${field} bg-muted`;
const row = "grid gap-1 sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-3";
const label = "text-sm font-medium";

function Choice({
  name,
  text,
  options,
  required = false,
  empty,
  value,
  onChange,
}: {
  name: string;
  text: string;
  options: Option[];
  required?: boolean;
  empty?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={row}>
      <label htmlFor={`booking-${name}`} className={label}>
        {text}
        {required ? " *" : ""}
      </label>
      <ComboSelect
        id={`booking-${name}`}
        name={name}
        required={required}
        {...(value === undefined ? { defaultValue: "" } : { value })}
        className={field}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">
          {empty ?? (required ? "Pilih…" : "Tidak dipilih")}
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </ComboSelect>
    </div>
  );
}

function Text({
  name,
  text,
  ...rest
}: {
  name: string;
  text: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={row}>
      <label htmlFor={`booking-${name}`} className={label}>
        {text}
        {rest.required ? " *" : ""}
      </label>
      <input id={`booking-${name}`} name={name} className={field} {...rest} />
    </div>
  );
}

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const rupiah = (n: number) => formatRupiah(round2(n).toFixed(2));
const emptyReceiver = { name: "", address: "", phone: "" };
const emptyMeasure = {
  koli: "",
  volume: "",
  kilo: "",
  pricePerKg: "",
  minWeight: "",
};

/**
 * Tambah Booking as in the provider app: an AWB-like form whose number is
 * automatic (B- + branch code + YYMM + running number) and read-only until
 * "Manual AWB" is pressed. Bookings stay separate from AWBs.
 */
export function BookingForm({
  options,
  defaultOrigin,
}: {
  options?: BookingFormOptions;
  /** Asal preselected (the user's branch) so the number shows at once. */
  defaultOrigin?: number;
} = {}) {
  const startOrigin = defaultOrigin ? String(defaultOrigin) : "";
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualNo, setManualNo] = useState(false);
  const [typedNo, setTypedNo] = useState("");
  const [route, setRoute] = useState({
    origin: startOrigin,
    destination: "",
    service: "",
  });
  const [measure, setMeasure] = useState(emptyMeasure);
  const [receiver, setReceiver] = useState(emptyReceiver);
  const [manualPrice, setManualPrice] = useState(false);
  const [modeId, setModeId] = useState("");
  const mode = (options?.transportModes ?? []).find(
    (m) => String(m.id) === modeId,
  );
  const [version, setVersion] = useState(0);

  const suggested = options?.nextBooking?.[Number(route.origin)] ?? "";
  const couriers = (options?.couriers ?? []).filter(
    (c) => c.branchId === null || String(c.branchId) === route.origin,
  );
  const tariff = useMemo(() => {
    const o = Number(route.origin);
    const d = Number(route.destination);
    if (!o || !d) return null;
    const onRoute = (options?.tariffs ?? []).filter(
      (t) => t.originBranchId === o && t.destinationBranchId === d,
    );
    return (
      onRoute.find((t) => t.deliveryServiceId === Number(route.service)) ??
      onRoute.find((t) => t.deliveryServiceId === null) ??
      null
    );
  }, [options?.tariffs, route]);

  const pick = (key: keyof typeof route) => (value: string) => {
    const next = { ...route, [key]: value };
    setRoute(next);
    const o = Number(next.origin);
    const d = Number(next.destination);
    const onRoute = (options?.tariffs ?? []).filter(
      (t) => t.originBranchId === o && t.destinationBranchId === d,
    );
    const found =
      onRoute.find((t) => t.deliveryServiceId === Number(next.service)) ??
      onRoute.find((t) => t.deliveryServiceId === null);
    if (found)
      setMeasure((m) => ({
        ...m,
        pricePerKg: found.pricePerKg,
        minWeight: found.minWeight,
      }));
  };
  const setM =
    (key: keyof typeof emptyMeasure) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setMeasure((m) => ({ ...m, [key]: event.target.value }));

  // Preview only; the server recalculates with exact decimals.
  const heaviest = Math.max(num(measure.kilo), num(measure.volume));
  const total = round2(
    Math.max(heaviest, num(measure.minWeight)) * num(measure.pricePerKg),
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.delete("status");
    // Automatic number: the server assigns it under a lock, so two users
    // saving at once still get different numbers.
    const typed = String(formData.get("bookingNo") ?? "").trim();
    if (!manualNo || !typed) {
      formData.delete("bookingNo");
      formData.set("autoBookingNo", "true");
    }
    if (!manualPrice) formData.delete("biaya");
    else for (const key of ["pricePerKg", "minWeight"]) formData.delete(key);
    setErrorMessage(null);
    setSuccessMessage(null);
    startTransition(async () => {
      try {
        const result = await createBookingAction(formData);
        if (result.ok) {
          setSuccessMessage(
            result.bookingNo
              ? `Booking ${result.bookingNo} berhasil disimpan.`
              : "Booking berhasil disimpan.",
          );
          formRef.current?.reset();
          setManualNo(false);
          setTypedNo("");
          setRoute({ origin: startOrigin, destination: "", service: "" });
          setMeasure(emptyMeasure);
          setReceiver(emptyReceiver);
          setManualPrice(false);
          setModeId("");
          setVersion((v) => v + 1);
          router.refresh();
          return;
        }
        setErrorMessage(
          result.error === "REQUIRED"
            ? `Wajib diisi: ${result.missing.join(", ")}.`
            : getErrorMessage(result.error),
        );
      } catch {
        setErrorMessage(
          "Koneksi ke server terputus. Periksa jaringan lalu coba simpan lagi.",
        );
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {errorMessage && (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <output className="block rounded-md border border-primary p-3 text-sm text-primary">
          {successMessage}
        </output>
      )}
      <div className="grid gap-6 rounded-lg border bg-background p-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <div className={row}>
            <label htmlFor="booking-bookingNo" className={label}>
              AWB No.
            </label>
            <div className="min-w-0 space-y-1">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  id="booking-bookingNo"
                  name="bookingNo"
                  maxLength={50}
                  readOnly={!manualNo}
                  required={manualNo}
                  value={manualNo ? typedNo : suggested}
                  onChange={(event) => setTypedNo(event.target.value)}
                  placeholder={
                    manualNo
                      ? "Ketik nomor booking"
                      : "Pilih Asal untuk nomor otomatis"
                  }
                  aria-describedby="booking-bookingNo-hint"
                  className={manualNo ? field : readOnlyField}
                />
                <button
                  type="button"
                  aria-pressed={manualNo}
                  onClick={() => {
                    setManualNo((v) => !v);
                    setTypedNo("");
                  }}
                  className="min-h-11 rounded-md border px-3 text-sm"
                >
                  {manualNo ? "Nomor Otomatis" : "Manual AWB"}
                </button>
              </div>
              <p
                id="booking-bookingNo-hint"
                className="text-xs text-muted-foreground"
              >
                {manualNo
                  ? "Nomor manual; tidak boleh sama dengan booking lain di cabang ini."
                  : "Nomor booking otomatis (B- + kode cabang + tahun bulan + urut), dikunci saat disimpan. Tekan Manual AWB untuk mengetik sendiri."}
              </p>
            </div>
          </div>
          <Text
            key={`date-${version}`}
            name="bookingDate"
            text="Tanggal"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <Choice
            name="branchId"
            text="Asal"
            options={options?.branches ?? []}
            required
            value={route.origin}
            onChange={pick("origin")}
          />
          <Choice
            name="destinationBranchId"
            text="Tujuan"
            required
            options={options?.destinations ?? options?.branches ?? []}
            value={route.destination}
            onChange={pick("destination")}
          />
          <Choice
            key={`customer-${version}`}
            name="customerId"
            text="Customer"
            options={options?.customers ?? []}
          />
          <Text
            name="senderName"
            required
            text="Nama"
            placeholder="Nama Pengirim"
            maxLength={150}
          />
          <Text
            name="senderAddress"
            required
            text="Alamat"
            placeholder="Alamat Pengirim"
            maxLength={500}
          />
          <Text
            name="senderPhone"
            required
            text="No. Telp"
            placeholder="No. Telepon"
            maxLength={30}
            inputMode="tel"
          />
          <Choice
            name="deliveryServiceId"
            text="Layanan"
            options={options?.deliveryServices ?? []}
            value={route.service}
            onChange={pick("service")}
          />
          <Choice
            key={`goods-${version}`}
            name="goodsTypeId"
            text="DOC / PAC"
            options={options?.goodsTypes ?? []}
          />
          <Choice
            key={`courier-${version}-${route.origin}`}
            name="courierId"
            text="Kurir"
            options={couriers}
            empty="No Courier"
          />
          <Choice
            key={`moda-${version}`}
            name="transportModeId"
            text="Via Moda"
            options={options?.transportModes ?? []}
            onChange={setModeId}
          />
          <Choice
            key={`cost-${version}`}
            name="costTypeId"
            text="Pembayaran"
            options={options?.costTypes ?? []}
          />
          <Text name="description" text="Isi Barang" maxLength={500} />
          <Text name="remarks" text="Keterangan" maxLength={500} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["koli", "Koli", "1"],
                ["volume", "Volume", "0.001"],
                ["kilo", "Berat (Kg)", "0.01"],
              ] as const
            ).map(([key, text, step]) => (
              <div key={key} className="min-w-0 space-y-1">
                <label htmlFor={`booking-${key}`} className={label}>
                  {text}
                  {key === "koli" ? " *" : ""}
                </label>
                <input
                  id={`booking-${key}`}
                  name={key}
                  type="number"
                  required={key === "koli"}
                  min={key === "koli" ? "1" : "0"}
                  step={step}
                  value={measure[key]}
                  onChange={setM(key)}
                  className={field}
                />
              </div>
            ))}
            <div className="min-w-0 space-y-1">
              <span className={label}>Detail</span>
              <DimensionDialog
                koli={num(measure.koli)}
                divider={modeDivider(mode?.divider)}
                modeName={mode?.name ?? null}
                onApply={(r) =>
                  setMeasure((m) => ({
                    ...m,
                    volume: r.volume || m.volume,
                    kilo: r.kilo || m.kilo,
                  }))
                }
              />
            </div>
            <div className="min-w-0 space-y-1">
              <label htmlFor="booking-heaviest" className={label}>
                Terberat (Kg)
              </label>
              <input
                id="booking-heaviest"
                readOnly
                value={heaviest || ""}
                className={readOnlyField}
              />
            </div>
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          <div className={row}>
            <label htmlFor="booking-consigneeId" className={label}>
              Penerima
            </label>
            <ComboSelect
              key={`consignee-${version}`}
              id="booking-consigneeId"
              name="consigneeId"
              defaultValue=""
              className={field}
              onChange={(event) => {
                const c = (options?.consignees ?? []).find(
                  (x) => String(x.id) === event.target.value,
                );
                setReceiver(
                  c
                    ? { name: c.name, address: c.address, phone: c.phone }
                    : emptyReceiver,
                );
              }}
            >
              <option value="">Select Penerima …</option>
              {(options?.consignees ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </ComboSelect>
          </div>
          <Text
            name="receiverName"
            text="Nama"
            placeholder="Nama Penerima"
            maxLength={150}
            value={receiver.name}
            onChange={(e) =>
              setReceiver((r) => ({ ...r, name: e.target.value }))
            }
          />
          <Text
            name="receiverAddress"
            text="Alamat Penerima"
            placeholder="Alamat Penerima"
            maxLength={500}
            value={receiver.address}
            onChange={(e) =>
              setReceiver((r) => ({ ...r, address: e.target.value }))
            }
          />
          <Text
            name="receiverPhone"
            text="No. Telp"
            placeholder="No. Telepon"
            maxLength={30}
            inputMode="tel"
            value={receiver.phone}
            onChange={(e) =>
              setReceiver((r) => ({ ...r, phone: e.target.value }))
            }
          />
          <div className={row}>
            <span className={label}>Harga Kg I</span>
            <div className="grid grid-cols-[1fr_auto_6rem] items-center gap-2">
              <input
                readOnly
                aria-label="Harga dari tarif Cek Ongkir"
                value={
                  tariff
                    ? rupiah(Number(tariff.pricePerKg))
                    : "Tidak ada tarif rute ini"
                }
                className={readOnlyField}
              />
              <label htmlFor="booking-minWeight" className="text-sm">
                Min KG
              </label>
              <input
                id="booking-minWeight"
                name="minWeight"
                type="number"
                min="0"
                step="0.01"
                value={measure.minWeight}
                onChange={setM("minWeight")}
                disabled={manualPrice}
                className={field}
              />
            </div>
          </div>
          <Text
            name="pricePerKg"
            text="Harga/Kg"
            type="number"
            min="0"
            step="0.01"
            value={measure.pricePerKg}
            onChange={setM("pricePerKg")}
            disabled={manualPrice}
          />
          <div className={row}>
            <span className={label}>Total harga</span>
            <input
              readOnly
              aria-label="Total harga"
              value={manualPrice ? "-" : rupiah(total)}
              className={readOnlyField}
            />
          </div>
          <div className={row}>
            <label htmlFor="booking-biaya" className={label}>
              Grand Total
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              {manualPrice ? (
                <input
                  id="booking-biaya"
                  name="biaya"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className={field}
                />
              ) : (
                <input
                  id="booking-biaya"
                  readOnly
                  value={rupiah(total)}
                  className={readOnlyField}
                />
              )}
              <button
                type="button"
                onClick={() => setManualPrice((v) => !v)}
                className="min-h-11 rounded-md bg-destructive px-3 text-sm text-white"
              >
                {manualPrice ? "Hitung Otomatis" : "Ganti Harga"}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Total harga = Harga/Kg x Terberat (minimal Min KG), dihitung ulang
            oleh server. Ganti Harga = isi Grand Total manual. Memilih Kurir
            langsung menugaskan booking ke kurir itu.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="min-h-11 w-full rounded-md bg-primary px-4 text-primary-foreground"
          >
            {isPending ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </form>
  );
}
