"use client";
import { useRef, useState } from "react";
import { FormField } from "@/components/patterns/form-field";
import { Button } from "@/components/ui/button";
import { ComboSelect } from "@/components/ui/combo-select";
import { Input } from "@/components/ui/input";
import { CommandForm } from "./command-form";

type Choice = { id: number; name: string };

export function JournalForm({
  branches = [],
  accounts = [],
}: {
  branches?: Choice[];
  accounts?: Choice[];
}) {
  const next = useRef(2);
  const [lines, setLines] = useState([
    { row: 0, accountId: "", side: "DEBIT", amount: "" },
    { row: 1, accountId: "", side: "CREDIT", amount: "" },
  ]);
  return (
    <CommandForm
      label="Simpan draft jurnal"
      values={{ action: "journal.create", lines }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="journal-new-branchId" label="Cabang">
          <ComboSelect
            id="journal-new-branchId"
            name="branchId"
            required
            defaultValue=""
          >
            <option value="">Pilih…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </ComboSelect>
        </FormField>
        {[
          ["accountingDate", "Tanggal akuntansi", "date"],
          ["reference", "Referensi dokumen", "text"],
          ["reason", "Keterangan", "text"],
        ].map(([name, label, type]) => (
          <FormField key={name} id={`journal-new-${name}`} label={label}>
            <Input
              className="min-h-11"
              required
              id={`journal-new-${name}`}
              name={name}
              type={type}
              maxLength={name === "reason" ? 500 : 160}
            />
          </FormField>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Akun kontrol dan kas/bank hanya bisa dipakai melalui dokumen sumber,
        beban kas atau transfer.
      </p>
      {lines.map((line, index) => (
        <div
          key={line.row}
          className="grid gap-3 border-b pb-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FormField
            id={`journal-account-${line.row}`}
            label={`Akun baris ${index + 1}`}
          >
            <ComboSelect
              required
              id={`journal-account-${line.row}`}
              value={line.accountId}
              onChange={(e) =>
                setLines(
                  lines.map((l) =>
                    l.row === line.row
                      ? { ...l, accountId: e.target.value }
                      : l,
                  ),
                )
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
          <FormField id={`journal-side-${line.row}`} label="Sisi">
            <ComboSelect
              className="min-h-11 w-full rounded-md border border-input bg-background px-3"
              id={`journal-side-${line.row}`}
              value={line.side}
              onChange={(e) =>
                setLines(
                  lines.map((l) =>
                    l.row === line.row ? { ...l, side: e.target.value } : l,
                  ),
                )
              }
            >
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Kredit</option>
            </ComboSelect>
          </FormField>
          <FormField id={`journal-amount-${line.row}`} label="Jumlah IDR">
            <Input
              className="min-h-11"
              required
              id={`journal-amount-${line.row}`}
              inputMode="decimal"
              value={line.amount}
              onChange={(e) =>
                setLines(
                  lines.map((l) =>
                    l.row === line.row ? { ...l, amount: e.target.value } : l,
                  ),
                )
              }
            />
          </FormField>
          <Button
            className="min-h-11 h-auto self-end whitespace-normal"
            type="button"
            variant="outline"
            disabled={lines.length <= 2}
            onClick={() => setLines(lines.filter((l) => l.row !== line.row))}
          >
            Hapus baris {index + 1}
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
            { row: next.current++, accountId: "", side: "DEBIT", amount: "" },
          ])
        }
      >
        Tambah baris
      </Button>
    </CommandForm>
  );
}
