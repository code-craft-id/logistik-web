"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { ComboSelect } from "@/components/ui/combo-select";
import {
  type CreateTransactionActionResult,
  createTransactionAction,
} from "../actions";

type Option = { id: number; name: string };
export type TransactionFormOptions = {
  /** Suggested next AWB number per origin branch id. */
  nextAwb: Record<number, string>;
  branches: Option[];
  destinations: Option[];
  customers: Option[];
  transportModes: Option[];
  deliveryServices: Option[];
  goodsTypes: Option[];
  costTypes: Option[];
  couriers: Option[];
  marketing: Option[];
  consignees: (Option & {
    address: string;
    phone: string;
    customerId: number | null;
  })[];
  tariffs: {
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
  onChange,
}: {
  name: string;
  text: string;
  options: Option[];
  required?: boolean;
  empty?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={row}>
      <label htmlFor={name} className={label}>
        {text}
        {required ? " *" : ""}
      </label>
      <ComboSelect
        id={name}
        name={name}
        required={required}
        defaultValue=""
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
      <label htmlFor={name} className={label}>
        {text}
      </label>
      <input id={name} name={name} className={field} {...rest} />
    </div>
  );
}

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
const initialPrice = {
  pricingType: "KG",
  koli: "",
  kilo: "",
  volume: "",
  pricePerKg: "",
  minWeight: "",
  otherFee: "",
  packingFee: "",
  pickupFee: "",
  discountPercent: "",
  ppnPercent: "11",
};
const emptyReceiver = { id: "", name: "", address: "", phone: "" };

export function TransactionForm({
  options,
  today,
}: {
  options: TransactionFormOptions;
  today: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [awb, setAwb] = useState("");
  const router = useRouter();
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

  const formRef = useRef<HTMLFormElement>(null);
  const [price, setPrice] = useState(initialPrice);
  const [route, setRoute] = useState({
    origin: "",
    destination: "",
    service: "",
  });
  const [receiver, setReceiver] = useState(emptyReceiver);
  const [manualPrice, setManualPrice] = useState(false);
  const [ppnOn, setPpnOn] = useState(false);
  const set =
    (key: keyof typeof initialPrice) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setPrice((p) => ({ ...p, [key]: event.target.value }));

  // Cek Ongkir tariff for the chosen route; a service-specific one first.
  const tariff = useMemo(() => {
    const o = Number(route.origin);
    const d = Number(route.destination);
    if (!o || !d) return null;
    const onRoute = options.tariffs.filter(
      (t) => t.originBranchId === o && t.destinationBranchId === d,
    );
    return (
      onRoute.find((t) => t.deliveryServiceId === Number(route.service)) ??
      onRoute.find((t) => t.deliveryServiceId === null) ??
      null
    );
  }, [options.tariffs, route]);
  const suggested = options.nextAwb[Number(route.origin)] ?? "";
  const pickRoute = (key: keyof typeof route) => (value: string) => {
    const next = { ...route, [key]: value };
    // Follow the origin's suggested number unless the user typed their own.
    if (key === "origin" && (awb === "" || awb === suggested))
      setAwb(options.nextAwb[Number(value)] ?? "");
    setRoute(next);
    const o = Number(next.origin);
    const d = Number(next.destination);
    const onRoute = options.tariffs.filter(
      (t) => t.originBranchId === o && t.destinationBranchId === d,
    );
    const found =
      onRoute.find((t) => t.deliveryServiceId === Number(next.service)) ??
      onRoute.find((t) => t.deliveryServiceId === null);
    if (found && price.pricingType === "KG")
      setPrice((p) => ({
        ...p,
        pricePerKg: found.pricePerKg,
        minWeight: found.minWeight,
      }));
  };

  // Preview only; the server recalculates with exact decimals.
  const heaviest = Math.max(num(price.kilo), num(price.volume));
  const freight =
    price.pricingType === "TRUCKING"
      ? num(price.pricePerKg)
      : price.pricingType === "KOLI"
        ? num(price.pricePerKg) * num(price.koli)
        : Math.max(heaviest, num(price.minWeight)) * num(price.pricePerKg);
  const total = round2(
    freight +
      num(price.otherFee) +
      num(price.packingFee) +
      num(price.pickupFee),
  );
  const discount = round2((total * num(price.discountPercent)) / 100);
  const ppn = ppnOn
    ? round2(((total - discount) * num(price.ppnPercent)) / 100)
    : 0;
  const grand = round2(total - discount + ppn);
  const priceLabel =
    price.pricingType === "KOLI"
      ? "Harga/Koli"
      : price.pricingType === "TRUCKING"
        ? "Harga Trucking"
        : "Harga/Kg";

  function onSubmit(formData: FormData) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setError(null);
    setSuccess(null);
    formData.set("idempotencyKey", idempotencyKey);
    formData.delete("status");
    // Unchanged suggestion or empty: the server assigns the number under a
    // lock, so two users saving at once still get different numbers.
    const typed = String(formData.get("awbNo") ?? "").trim();
    if (!typed || typed === suggested) {
      formData.delete("awbNo");
      formData.set("autoAwb", "true");
    }
    // Without Harga the typed Biaya is used; with Harga the server prices it.
    if (!manualPrice) formData.delete("biaya");
    else for (const key of ["pricePerKg", "minWeight"]) formData.delete(key);
    if (!ppnOn) formData.delete("ppnPercent");
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
              : res.awbNo
                ? `AWB ${res.awbNo} berhasil disimpan.`
                : "AWB berhasil disimpan.",
          );
          setIdempotencyKey(generateKey());
          formRef.current?.reset();
          window.scrollTo({ top: 0, behavior: "smooth" });
          setPrice(initialPrice);
          setReceiver(emptyReceiver);
          setAwb("");
          setRoute({ origin: "", destination: "", service: "" });
          // Fetch fresh suggested numbers.
          router.refresh();
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
    <form ref={formRef} action={onSubmit} className="space-y-4">
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
      <div className="grid gap-6 rounded-lg border bg-background p-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <div className={row}>
            <label htmlFor="awbNo" className={label}>
              AWB No.
            </label>
            <div className="min-w-0 space-y-1">
              <input
                id="awbNo"
                name="awbNo"
                maxLength={50}
                value={awb}
                onChange={(event) => setAwb(event.target.value)}
                placeholder="Pilih Asal untuk nomor otomatis"
                aria-describedby="awbNo-hint"
                className={field}
              />
              <p id="awbNo-hint" className="text-xs text-muted-foreground">
                {awb && awb === suggested
                  ? "Nomor otomatis (dikunci saat disimpan). Ubah bila ingin nomor manual."
                  : awb
                    ? "Nomor manual."
                    : "Kosongkan untuk nomor otomatis."}
              </p>
            </div>
          </div>
          <Text
            name="transactionDate"
            text="Tanggal"
            type="date"
            defaultValue={today}
            required
          />
          <div className={row}>
            <label htmlFor="pricingType" className={label}>
              Pricing Type
            </label>
            <select
              id="pricingType"
              name="pricingType"
              value={price.pricingType}
              onChange={set("pricingType")}
              className={field}
            >
              <option value="KG">Harga/Kg</option>
              <option value="KOLI">Harga/Koli</option>
              <option value="TRUCKING">Trucking</option>
            </select>
          </div>
          <Choice
            name="pickupCourierId"
            text="Pickup By"
            options={options.couriers}
            empty="Delivery to Office"
          />
          <Choice
            name="originBranchId"
            text="Asal"
            options={options.branches}
            required
            onChange={pickRoute("origin")}
          />
          <Choice
            name="destinationBranchId"
            text="Tujuan"
            options={options.destinations}
            onChange={pickRoute("destination")}
          />
          <Choice
            name="customerId"
            text="Customer"
            options={options.customers}
          />
          <Choice
            name="marketingPersonId"
            text="Marketing"
            options={options.marketing}
          />
          <Text
            name="senderName"
            text="Nama"
            placeholder="Nama Pengirim"
            maxLength={150}
          />
          <div className={row}>
            <label htmlFor="senderAddress" className={label}>
              Alamat
            </label>
            <textarea
              id="senderAddress"
              name="senderAddress"
              maxLength={500}
              rows={2}
              placeholder="Alamat Pengirim"
              className={field}
            />
          </div>
          <Text
            name="senderPhone"
            text="No. Telp"
            placeholder="No. Telepon"
            maxLength={30}
            inputMode="tel"
          />
          <Text
            name="doNo"
            text="DO / Reff"
            placeholder="No. DO / Reff"
            maxLength={50}
          />
          <Choice
            name="deliveryServiceId"
            text="Layanan"
            options={options.deliveryServices}
            onChange={pickRoute("service")}
          />
          <Choice
            name="goodsTypeId"
            text="DOC / PAC"
            options={options.goodsTypes}
          />
          <Choice
            name="transportModeId"
            text="Via Moda"
            options={options.transportModes}
          />
          <Choice
            name="costTypeId"
            text="Pembayaran"
            options={options.costTypes}
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
                <label htmlFor={key} className={label}>
                  {text}
                </label>
                <input
                  id={key}
                  name={key}
                  type="number"
                  min="0"
                  step={step}
                  value={price[key]}
                  onChange={set(key)}
                  className={field}
                />
              </div>
            ))}
            <div className="min-w-0 space-y-1">
              <label htmlFor="heaviest" className={label}>
                Terberat (Kg)
              </label>
              <input
                id="heaviest"
                readOnly
                value={heaviest || ""}
                className={readOnlyField}
              />
            </div>
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          <div className={row}>
            <label htmlFor="consigneeId" className={label}>
              Penerima
            </label>
            <ComboSelect
              id="consigneeId"
              name="consigneeId"
              defaultValue=""
              className={field}
              onChange={(event) => {
                const c = options.consignees.find(
                  (x) => String(x.id) === event.target.value,
                );
                setReceiver(
                  c
                    ? {
                        id: String(c.id),
                        name: c.name,
                        address: c.address,
                        phone: c.phone,
                      }
                    : emptyReceiver,
                );
              }}
            >
              <option value="">Select Penerima …</option>
              {options.consignees.map((c) => (
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
          <div className={row}>
            <label htmlFor="receiverAddress" className={label}>
              Alamat Penerima
            </label>
            <textarea
              id="receiverAddress"
              name="receiverAddress"
              maxLength={500}
              rows={2}
              placeholder="Alamat Penerima"
              value={receiver.address}
              onChange={(e) =>
                setReceiver((r) => ({ ...r, address: e.target.value }))
              }
              className={field}
            />
          </div>
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
              <label htmlFor="minWeight" className="text-sm">
                Min KG
              </label>
              <input
                id="minWeight"
                name="minWeight"
                type="number"
                min="0"
                step="0.01"
                value={price.minWeight}
                onChange={set("minWeight")}
                disabled={manualPrice || price.pricingType !== "KG"}
                className={field}
              />
            </div>
          </div>
          <div className={row}>
            <label htmlFor="pricePerKg" className={label}>
              {priceLabel}
            </label>
            <div className="grid grid-cols-[1fr_auto_6rem] items-center gap-2">
              <input
                id="pricePerKg"
                name="pricePerKg"
                type="number"
                min="0"
                step="0.01"
                value={price.pricePerKg}
                onChange={set("pricePerKg")}
                disabled={manualPrice}
                className={field}
              />
              <label htmlFor="insured" className="text-sm">
                Asuransi
              </label>
              <select
                id="insured"
                name="insured"
                defaultValue="N"
                className={field}
              >
                <option value="N">N</option>
                <option value="Y">Y</option>
              </select>
            </div>
          </div>
          {(
            [
              ["otherFee", "Biaya Lain"],
              ["packingFee", "Biaya Packing"],
              ["pickupFee", "Biaya Pickup"],
            ] as const
          ).map(([key, text]) => (
            <Text
              key={key}
              name={key}
              text={text}
              type="number"
              min="0"
              step="0.01"
              value={price[key]}
              onChange={set(key)}
              disabled={manualPrice}
            />
          ))}
          <div className={row}>
            <span className={label}>Total Biaya</span>
            <input
              readOnly
              aria-label="Total Biaya"
              value={manualPrice ? "-" : rupiah(total)}
              className={readOnlyField}
            />
          </div>
          <div className={row}>
            <label htmlFor="discountPercent" className={label}>
              Discount(%)
            </label>
            <div className="grid grid-cols-[1fr_auto_6rem] items-center gap-2">
              <input
                id="discountPercent"
                name="discountPercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={price.discountPercent}
                onChange={set("discountPercent")}
                disabled={manualPrice}
                className={field}
              />
              <label className="inline-flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ppnOn}
                  onChange={(e) => setPpnOn(e.target.checked)}
                  disabled={manualPrice}
                />
                PPN(%)
              </label>
              <input
                aria-label="PPN persen"
                name="ppnPercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={price.ppnPercent}
                onChange={set("ppnPercent")}
                disabled={!ppnOn || manualPrice}
                className={field}
              />
            </div>
          </div>
          <div className={row}>
            <label htmlFor="biaya" className={label}>
              Grand Total
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              {manualPrice ? (
                <input
                  id="biaya"
                  name="biaya"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className={field}
                />
              ) : (
                <input
                  id="biaya"
                  readOnly
                  value={rupiah(grand)}
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
            Grand Total dihitung ulang oleh server: {priceLabel} x Terberat
            (minimal Min KG) / Koli / tarif tetap, + biaya lain, packing,
            pickup, - discount, + PPN. Ganti Harga = isi Grand Total manual.
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
