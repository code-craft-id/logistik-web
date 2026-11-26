"use client";
import { useRef, useState } from "react";
import { FormField } from "@/components/patterns/form-field";
import { Button } from "@/components/ui/button";
import { ComboSelect } from "@/components/ui/combo-select";
import { Input } from "@/components/ui/input";
import { moneyRaw, moneyText } from "@/components/ui/money-input";
import { formatRupiah } from "@/lib/format/rupiah";
import { CommandForm } from "./command-form";

type Choice = { id: number; name: string };
type Voucher = "CASH_IN" | "CASH_OUT" | "VENDOR_PAYMENT" | "GENERAL";

/**
 * Sandbox Kasir Penerimaan Lainnya / Kasir Pembayaran Lainnya / Kasir
 * Pembayaran Vendor / Bukti Jurnal Umum (OBSERVED newapps 2026-11-24):
 * header (Nomor Bukti, Tanggal, Kas & Bank, Keterangan) and lines
 * (Kode Rekening, Keterangan, Jumlah, Posisi). Kas/Bank takes the balance.
 * Saving creates a draft; Posting is a separate step, as in the sandbox.
 */
export function VoucherForm({
  voucher,
  branches,
  cashAccounts,
  accounts,
  costCentres,
  customers,
  vendors,
}: {
  voucher: Voucher;
  branches: Choice[];
  cashAccounts: Choice[];
  accounts: Choice[];
  costCentres: Choice[];
  customers?: Choice[];
  vendors?: Choice[];
}) {
  const receipt = voucher === "CASH_IN";
  const defaultSide = receipt ? "CREDIT" : "DEBIT";
  const next = useRef(1);
  const [lines, setLines] = useState([
    { row: 0, accountId: "", side: defaultSide, amount: "", memo: "" },
  ]);
  const signed = lines.reduce((total, l) => {
    const n = Number(l.amount.replace(",", "."));
    if (!Number.isFinite(n)) return total;
    return total + (l.side === defaultSide ? n : -n);
  }, 0);
  const update = (row: number, patch: Partial<(typeof lines)[number]>) =>
    setLines(lines.map((l) => (l.row === row ? { ...l, ...patch } : l)));
  const id = (name: string) => `voucher-${voucher}-${name}`;
  const select = (
    name: string,
    label: string,
    options: Choice[],
    optional = false,
  ) => (
    <FormField id={id(name)} label={label}>
      <ComboSelect
        id={id(name)}
        name={name}
        required={!optional}
        defaultValue=""
      >
        <option value="">{optional ? "Tidak ada" : "Pilih…"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </ComboSelect>
    </FormField>
  );
  return (
    <CommandForm
      label="Masukan (simpan draft)"
      values={{
        action: "journal.cash",
        voucher,
        lines: lines.map(({ row: _row, ...l }) => l),
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {select("branchId", "Cabang", branches)}
        <FormField id={id("reference")} label="Nomor Bukti (kosong = otomatis)">
          <Input
            className="min-h-11"
            id={id("reference")}
            name="reference"
            maxLength={160}
          />
        </FormField>
        <FormField id={id("accountingDate")} label="Tanggal">
          <Input
            className="min-h-11"
            id={id("accountingDate")}
            name="accountingDate"
            type="date"
            required
          />
        </FormField>
        {select(
          "cashAccountId",
          voucher === "GENERAL" ? "Kas/Bank (K)" : "Kas & Bank",
          cashAccounts,
        )}
        <FormField id={id("reason")} label="Keterangan">
          <Input
            className="min-h-11"
            id={id("reason")}
            name="reason"
            required
            maxLength={500}
          />
        </FormField>
        {select("costCentreId", "Cost Centre", costCentres, true)}
        {customers && select("customerId", "Customer", customers, true)}
        {vendors && select("vendorId", "Vendor", vendors)}
      </div>
      {cashAccounts.length === 0 && (
        <p role="alert" className="text-sm text-destructive">
          Belum ada akun Kas/Bank. Tandai akun sebagai kas/bank di Data Akun.
        </p>
      )}
      <div className="space-y-3">
        {lines.map((line, index) => (
          <div
            key={line.row}
            className="grid gap-3 border-b pb-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <FormField
              id={id(`account-${line.row}`)}
              label={`Kode Rekening ${index + 1}`}
            >
              <ComboSelect
                required
                id={id(`account-${line.row}`)}
                value={line.accountId}
                onChange={(e) =>
                  update(line.row, { accountId: e.target.value })
                }
              >
                <option value="">Pilih akun…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </ComboSelect>
            </FormField>
            <FormField id={id(`memo-${line.row}`)} label="Keterangan">
              <Input
                className="min-h-11"
                id={id(`memo-${line.row}`)}
                maxLength={500}
                value={line.memo}
                onChange={(e) => update(line.row, { memo: e.target.value })}
              />
            </FormField>
            <FormField id={id(`amount-${line.row}`)} label="Jumlah (Rp)">
              <Input
                className="min-h-11"
                required
                id={id(`amount-${line.row}`)}
                inputMode="decimal"
                value={moneyText(line.amount)}
                onChange={(e) =>
                  update(line.row, { amount: moneyRaw(e.target.value) })
                }
              />
            </FormField>
            <FormField id={id(`side-${line.row}`)} label="Posisi">
              <ComboSelect
                id={id(`side-${line.row}`)}
                value={line.side}
                onChange={(e) => update(line.row, { side: e.target.value })}
              >
                <option value="DEBIT">Debet</option>
                <option value="CREDIT">Kredit</option>
              </ComboSelect>
            </FormField>
            <Button
              className="min-h-11 h-auto self-end whitespace-normal"
              type="button"
              variant="outline"
              disabled={lines.length <= 1}
              onClick={() => setLines(lines.filter((l) => l.row !== line.row))}
            >
              Hapus
            </Button>
          </div>
        ))}
        <Button
          className="min-h-11"
          type="button"
          variant="outline"
          disabled={lines.length >= 100}
          onClick={() =>
            setLines([
              ...lines,
              {
                row: next.current++,
                accountId: "",
                side: defaultSide,
                amount: "",
                memo: "",
              },
            ])
          }
        >
          Tambah Baris
        </Button>
      </div>
      <output className="block text-sm font-medium" aria-live="polite">
        Total {receipt ? "Penerimaan" : "Payment"}:{" "}
        {formatRupiah(Math.max(signed, 0).toFixed(2))} · Kas/Bank{" "}
        {receipt ? "Debet" : "Kredit"} otomatis sebesar total
        {signed <= 0 && " (total harus lebih dari 0)"}
      </output>
    </CommandForm>
  );
}
