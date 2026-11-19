"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useConfirm } from "@/components/patterns/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ComboSelect } from "@/components/ui/combo-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deletePartyAction, savePartyAction } from "../party-actions";

type Option = { id: number; name: string };
export type PartyField =
  | {
      key: string;
      label: string;
      type: "text" | "email";
      required?: boolean;
      max: number;
    }
  | {
      key: string;
      label: string;
      type: "choice";
      options: Option[];
      emptyLabel: string;
    };

const select =
  "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

export function PartyForm({
  kind,
  fields,
  values,
  id,
  doneHref,
}: {
  kind: "customer" | "consignee";
  fields: PartyField[];
  values?: Record<string, string | number | null>;
  id?: number;
  doneHref: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setError(null);
        start(async () => {
          const result = await savePartyAction(data);
          if (result.ok) {
            if (!id) form.reset();
            router.push(doneHref);
            router.refresh();
          } else setError(result.message);
        });
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      {id && <input type="hidden" name="id" value={id} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          const fieldId = `party-${field.key}`;
          const value = values?.[field.key];
          return (
            <div key={field.key} className="min-w-0 space-y-2">
              <Label htmlFor={fieldId}>
                {field.label}
                {"required" in field && field.required ? " *" : ""}
              </Label>
              {field.type === "choice" ? (
                <ComboSelect
                  id={fieldId}
                  name={field.key}
                  defaultValue={value ?? ""}
                  className={select}
                >
                  <option value="">{field.emptyLabel}</option>
                  {field.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </ComboSelect>
              ) : (
                <Input
                  id={fieldId}
                  name={field.key}
                  type={field.type}
                  required={field.required}
                  maxLength={field.max}
                  defaultValue={value ?? ""}
                  className="min-h-11"
                />
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} className="min-h-11">
          {pending ? "Menyimpan…" : id ? "Simpan perubahan" : "Tambah"}
        </Button>
        {id && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => router.push(doneHref)}
          >
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}

export function DeletePartyButton({
  kind,
  id,
  name,
}: {
  kind: "customer" | "consignee";
  id: number;
  name: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();
  return (
    <span className="inline-flex flex-col">
      {dialog}
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 text-destructive"
        disabled={pending}
        onClick={async () => {
          if (
            !(await confirm({
              title: `Hapus ${name}?`,
              description: "Data lama yang memakai ini tetap tersimpan.",
            }))
          )
            return;
          const data = new FormData();
          data.set("kind", kind);
          data.set("id", String(id));
          start(async () => {
            const result = await deletePartyAction(data);
            if (result.ok) router.refresh();
            else setError(result.message);
          });
        }}
      >
        {pending ? "Menghapus…" : "Hapus"}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
