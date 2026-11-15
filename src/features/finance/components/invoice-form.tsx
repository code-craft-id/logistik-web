"use client";
import { useRef, useState } from "react";
import { FormField } from "@/components/patterns/form-field";
import { FormLayout } from "@/components/patterns/form-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financeOptions } from "../actions";
import { CommandForm } from "./command-form";

type Draft = {
  id: number;
  branchId: number;
  customerId: number;
  revision: number;
  invoiceDate: string;
  dueDate: string;
  items: { transactionId: number; amount: string }[];
};
export function InvoiceForm({
  branches,
  draft,
}: {
  branches: { id: number; name: string }[];
  draft?: Draft;
}) {
  const [branchId, setBranchId] = useState(
    draft?.branchId ?? branches[0]?.id ?? 0,
  );
  const [customerId, setCustomerId] = useState(draft?.customerId ?? 0);
  const [items, setItems] = useState(
    (draft?.items ?? [{ transactionId: 0, amount: "", rowKey: 0 }]).map(
      (item, rowKey) => ({ ...item, rowKey }),
    ),
  );
  const nextRow = useRef(items.length);
  const [options, setOptions] = useState<{
    customers: { id: number; name: string }[];
    transactions: { id: number; awbNo: string | null }[];
  }>({ customers: [], transactions: [] });
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectClass =
    "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base md:text-sm";
  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await financeOptions(branchId, search);
      if (result.ok) setOptions(result.data);
      else setError(result.message);
    } catch {
      setError("Pilihan belum dimuat. Coba kembali.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <CommandForm
      label={draft ? "Simpan draft" : "Buat draft"}
      href="/finance/invoices/:id"
      values={{
        action: draft ? "invoice.update" : "invoice.create",
        ...(draft ? { id: draft.id, revision: draft.revision } : {}),
        branchId,
        customerId,
        items,
      }}
    >
      <FormLayout
        label="Invoice"
        actions={
          <span className="text-sm text-muted-foreground">
            Periksa sumber dan jumlah sebelum menyimpan draft.
          </span>
        }
        tabs={[
          {
            id: "customer",
            label: "Cabang & pelanggan",
            content: (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="branch" label="Cabang">
                  <select
                    id="branch"
                    className={selectClass}
                    value={branchId}
                    disabled={!!draft}
                    onChange={(e) => {
                      setBranchId(Number(e.target.value));
                      setCustomerId(0);
                      setItems([
                        {
                          transactionId: 0,
                          amount: "",
                          rowKey: nextRow.current++,
                        },
                      ]);
                      setOptions({ customers: [], transactions: [] });
                    }}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="space-y-2">
                  <FormField
                    id="lookup"
                    label="Cari pelanggan / AWB"
                    hint="Maksimal 50 pilihan per pencarian."
                  >
                    <Input
                      id="lookup"
                      maxLength={100}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </FormField>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={loading || !branchId}
                    onClick={load}
                  >
                    {loading ? "Memuat…" : "Cari pilihan"}
                  </Button>
                </div>
                <FormField id="customer" label="Pelanggan">
                  <select
                    required
                    id="customer"
                    className={selectClass}
                    value={customerId}
                    onChange={(e) => setCustomerId(Number(e.target.value))}
                  >
                    <option value="0">Pilih pelanggan</option>
                    {customerId > 0 &&
                      !options.customers.some((c) => c.id === customerId) && (
                        <option value={customerId}>
                          Pelanggan #{customerId}
                        </option>
                      )}
                    {options.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <output>{error}</output>
              </div>
            ),
          },
          {
            id: "dates",
            label: "Tanggal",
            content: (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="invoiceDate" label="Tanggal invoice">
                  <Input
                    required
                    id="invoiceDate"
                    name="invoiceDate"
                    type="date"
                    defaultValue={draft?.invoiceDate}
                  />
                </FormField>
                <FormField id="dueDate" label="Jatuh tempo">
                  <Input
                    required
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={draft?.dueDate}
                  />
                </FormField>
              </div>
            ),
          },
          {
            id: "lines",
            label: "AWB & tagihan",
            content: (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Masukkan tagihan akhir IDR. Tarif operasional tidak disalin
                  otomatis.
                </p>
                {items.map((item, index) => (
                  <div
                    key={item.rowKey}
                    className="grid gap-3 border-b pb-4 sm:grid-cols-3"
                  >
                    <FormField
                      id={`source-${index}`}
                      label={`AWB ${index + 1}`}
                    >
                      <select
                        required
                        id={`source-${index}`}
                        className={selectClass}
                        value={item.transactionId}
                        onChange={(e) =>
                          setItems(
                            items.map((i, n) =>
                              n === index
                                ? {
                                    ...i,
                                    transactionId: Number(e.target.value),
                                  }
                                : i,
                            ),
                          )
                        }
                      >
                        <option value="0">Pilih AWB</option>
                        {item.transactionId > 0 &&
                          !options.transactions.some(
                            (s) => s.id === item.transactionId,
                          ) && (
                            <option value={item.transactionId}>
                              Transaksi #{item.transactionId}
                            </option>
                          )}
                        {options.transactions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.awbNo || `#${s.id}`}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id={`amount-${index}`} label="Tagihan IDR">
                      <Input
                        required
                        id={`amount-${index}`}
                        inputMode="decimal"
                        value={item.amount}
                        onChange={(e) =>
                          setItems(
                            items.map((i, n) =>
                              n === index
                                ? { ...i, amount: e.target.value }
                                : i,
                            ),
                          )
                        }
                      />
                    </FormField>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 self-end"
                      disabled={items.length === 1}
                      onClick={() =>
                        setItems(items.filter((_, n) => n !== index))
                      }
                    >
                      Hapus baris {index + 1}
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={items.length >= 100}
                  onClick={() =>
                    setItems([
                      ...items,
                      {
                        transactionId: 0,
                        amount: "",
                        rowKey: nextRow.current++,
                      },
                    ])
                  }
                >
                  Tambah AWB
                </Button>
              </div>
            ),
          },
        ]}
      />
    </CommandForm>
  );
}
