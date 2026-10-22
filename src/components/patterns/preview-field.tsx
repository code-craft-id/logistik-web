"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PreviewField as Field } from "./preview-contract";

export function PreviewField({
  field,
  id,
  value,
  onChange,
  invalid = false,
  readOnly = false,
}: {
  field: Field;
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  readOnly?: boolean;
}) {
  const common = {
    id,
    "aria-required": field.required || undefined,
    "aria-invalid": invalid || undefined,
    "aria-describedby": invalid ? `${id}-error` : undefined,
    disabled: readOnly,
  };
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </Label>
      {field.type === "checkbox" ? (
        <div className="flex min-h-11 items-center gap-2">
          <input
            {...common}
            type="checkbox"
            checked={value === "true"}
            onChange={(event) => onChange(String(event.currentTarget.checked))}
            className="size-5 accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            {value === "true" ? "ON" : "OFF"} · preview
          </span>
        </div>
      ) : field.type === "select" ? (
        <select
          {...common}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
        >
          <option value="">Select {field.label}…</option>
          {(field.options?.length
            ? field.options
            : ["Preview A", "Preview B"]
          ).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <Textarea
          {...common}
          value={value}
          onInput={(event) => onChange(event.currentTarget.value)}
          rows={3}
        />
      ) : field.type === "file" ? (
        <Input
          {...common}
          type="file"
          className="min-h-11"
          onChange={(event) =>
            onChange(event.currentTarget.files?.[0]?.name ?? "")
          }
        />
      ) : (
        <Input
          {...common}
          type={
            [
              "date",
              "month",
              "number",
              "email",
              "password",
              "tel",
              "url",
            ].includes(field.type ?? "")
              ? field.type
              : "text"
          }
          value={value}
          autoComplete="off"
          className="min-h-11 w-full min-w-0"
          onInput={(event) => onChange(event.currentTarget.value)}
        />
      )}
      {invalid && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          Enter {field.label} for this preview.
        </p>
      )}
    </div>
  );
}
