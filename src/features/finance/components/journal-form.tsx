"use client";
import { useRef, useState } from "react";
import { FormField } from "@/components/patterns/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandForm } from "./command-form";

export function JournalForm() {
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
        {[
          ["branchId", "ID cabang", "number"],
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
        Gunakan ID akun pada daftar akun. Akun kontrol dan kas/bank hanya
        melalui dokumen sumber, beban kas atau transfer.
      </p>
      {lines.map((line, index) => (
        <div
          key={line.row}
          className="grid gap-3 border-b pb-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FormField
            id={`journal-account-${line.row}`}
            label={`ID akun baris ${index + 1}`}
          >
            <Input
              className="min-h-11"
              required
              id={`journal-account-${line.row}`}
              type="number"
              min="1"
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
            />
          </FormField>
          <FormField id={`journal-side-${line.row}`} label="Sisi">
            <select
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
            </select>
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
