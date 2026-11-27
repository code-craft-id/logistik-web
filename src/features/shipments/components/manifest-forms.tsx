"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ComboSelect } from "@/components/ui/combo-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignAwbFormAction,
  createDeliverySheetFormAction,
  createManifestFormAction,
  recordOutcomeFormAction,
} from "../manifest-form-actions";

type Option = { id: number; name: string };
const select =
  "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

function Feedback({ error }: { error: string | null }) {
  return error ? (
    <p
      role="alert"
      className="rounded-md border border-destructive p-3 text-sm text-destructive"
    >
      {error}
    </p>
  ) : null;
}

export function ManifestCreateForm({
  branches,
  vehicles,
  couriers,
  vendors,
  today,
}: {
  branches: Option[];
  vehicles: Option[];
  couriers: Option[];
  vendors: Option[];
  today: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const choice = (
    name: string,
    label: string,
    options: Option[],
    required = false,
  ) => (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={`mf-${name}`}>{label}</Label>
      <ComboSelect
        id={`mf-${name}`}
        name={name}
        required={required}
        defaultValue=""
        className={select}
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
  return (
    <form
      className="space-y-5 rounded-lg border bg-background p-4 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError(null);
        start(async () => {
          const result = await createManifestFormAction(data);
          if (result.ok) router.push(`/manifest/${result.id}`);
          else setError(result.message);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="mf-manifestNo">Manifes No.</Label>
          <Input
            id="mf-manifestNo"
            name="manifestNo"
            required
            maxLength={50}
            className="min-h-11"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="mf-manifestDate">Tanggal</Label>
          <Input
            id="mf-manifestDate"
            name="manifestDate"
            type="date"
            required
            defaultValue={today}
            className="min-h-11"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="mf-type">Jenis</Label>
          <ComboSelect
            id="mf-type"
            name="type"
            defaultValue="Outbound"
            className={select}
          >
            <option value="Outbound">Outbound</option>
            <option value="Transit">Transit</option>
            <option value="Inbound">Inbound</option>
          </ComboSelect>
        </div>
        {choice("branchId", "Cabang pemilik", branches, true)}
        {choice("originBranchId", "Asal", branches)}
        {choice("destinationBranchId", "Tujuan", branches)}
        {choice("vehicleId", "Kendaraan", vehicles)}
        {choice("courierId", "Kurir", couriers)}
        {choice("vendorId", "Vendor", vendors)}
        <div className="min-w-0 space-y-2">
          <Label htmlFor="mf-transit1">Transit</Label>
          <Input
            id="mf-transit1"
            name="transit1"
            maxLength={100}
            className="min-h-11"
          />
        </div>
      </div>
      <Feedback error={error} />
      <Button type="submit" disabled={pending} className="min-h-11">
        {pending ? "Menyimpan…" : "Simpan manifest"}
      </Button>
    </form>
  );
}

export function AssignAwbForm({ manifestId }: { manifestId: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const awb = String(data.get("awbNo") ?? "");
        setError(null);
        setAdded(null);
        start(async () => {
          const result = await assignAwbFormAction(data);
          if (result.ok) {
            setAdded(awb);
            if (input.current) input.current.value = "";
            input.current?.focus();
            router.refresh();
          } else setError(result.message);
        });
      }}
    >
      <input type="hidden" name="manifestId" value={manifestId} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="assign-awb">Tambah AWB</Label>
          <Input
            ref={input}
            id="assign-awb"
            name="awbNo"
            required
            maxLength={50}
            placeholder="Nomor AWB"
            className="min-h-11"
          />
        </div>
        <Button type="submit" disabled={pending} className="min-h-11">
          {pending ? "Menambahkan…" : "Tambahkan"}
        </Button>
      </div>
      <Feedback error={error} />
      {added && (
        <output className="block text-sm text-muted-foreground">
          AWB {added} ditambahkan.
        </output>
      )}
    </form>
  );
}

export function DeliverySheetForm({
  manifestId,
  suggestedNo,
  today,
}: {
  manifestId: number;
  suggestedNo: string;
  today: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError(null);
        start(async () => {
          const result = await createDeliverySheetFormAction(data);
          if (result.ok) router.refresh();
          else setError(result.message);
        });
      }}
    >
      <input type="hidden" name="manifestId" value={manifestId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="drs-no">DRS No.</Label>
          <Input
            id="drs-no"
            name="sheetNo"
            required
            maxLength={50}
            defaultValue={suggestedNo}
            className="min-h-11"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="drs-date">Tanggal antar</Label>
          <Input
            id="drs-date"
            name="deliveryDate"
            type="date"
            required
            defaultValue={today}
            className="min-h-11"
          />
        </div>
        <Button type="submit" disabled={pending} className="min-h-11">
          {pending ? "Membuat…" : "Buat DRS"}
        </Button>
      </div>
      <Feedback error={error} />
    </form>
  );
}

export function OutcomeForm({
  manifestId,
  deliverySheetId,
  transactionId,
}: {
  /** Absent for a standalone DRS (Kurir Kota). */
  manifestId?: number;
  deliverySheetId: number;
  transactionId: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex min-w-64 flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError(null);
        start(async () => {
          try {
            const result = await recordOutcomeFormAction(data);
            if (result.ok) router.refresh();
            else setError(result.message);
          } catch (e) {
            setError(
              e instanceof Error && e.message
                ? e.message
                : "Gagal menyimpan. Periksa koneksi lalu coba lagi.",
            );
          }
        });
      }}
    >
      {manifestId !== undefined && (
        <input type="hidden" name="manifestId" value={manifestId} />
      )}
      <input type="hidden" name="deliverySheetId" value={deliverySheetId} />
      <input type="hidden" name="transactionId" value={transactionId} />
      <ComboSelect
        name="outcome"
        aria-label="Hasil antar"
        required
        defaultValue=""
        className={`${select} w-auto`}
      >
        <option value="">Hasil…</option>
        <option value="DELIVERED">Terkirim</option>
        <option value="FAILED_DELIVERY">Gagal</option>
        <option value="RETURNED">Retur</option>
      </ComboSelect>
      <Input
        name="receivedBy"
        aria-label="Diterima oleh"
        placeholder="Diterima oleh"
        maxLength={150}
        className="min-h-11 w-40"
      />
      <Button type="submit" size="sm" disabled={pending} className="min-h-11">
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
      {error && (
        <span role="alert" className="w-full text-xs text-destructive">
          {error}
        </span>
      )}
    </form>
  );
}
