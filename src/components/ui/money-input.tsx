"use client";
import { type ComponentProps, useState } from "react";
import { Input } from "./input";

/** "1.250.000,5" (typed or pasted) -> "1250000.5"; at most 2 decimals. */
export function moneyRaw(text: string) {
  const cleaned = text.replace(/[^\d,]/g, "");
  const [whole = "", ...rest] = cleaned.split(",");
  const fraction = rest.join("").slice(0, 2);
  const digits = whole.replace(/^0+(?=\d)/, "");
  return cleaned.includes(",") ? `${digits || "0"}.${fraction}` : digits;
}
/** "1250000.50" -> "1.250.000,5"; empty stays empty. */
export function moneyText(raw: string) {
  if (!raw) return "";
  const [whole, fraction = ""] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (raw.endsWith(".")) return `${grouped},`;
  // Stored values like 150000.00 show as 150.000; typed cents stay as typed.
  return fraction && fraction !== "00" ? `${grouped},${fraction}` : grouped;
}

/**
 * Rupiah input: shows thousand separators while typing, submits the plain
 * number (no dots or commas) under `name` through a hidden field.
 */
export function MoneyInput({
  name,
  value,
  defaultValue,
  onValueChange,
  ...props
}: Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  name: string;
  value?: string | number | null;
  defaultValue?: string | number | null;
  onValueChange?: (raw: string) => void;
}) {
  const [own, setOwn] = useState(() =>
    defaultValue === null || defaultValue === undefined
      ? ""
      : String(defaultValue),
  );
  const raw = value === undefined ? own : value === null ? "" : String(value);
  return (
    <>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={moneyText(raw)}
        onChange={(event) => {
          const next = moneyRaw(event.target.value);
          if (value === undefined) setOwn(next);
          onValueChange?.(next);
        }}
      />
      <input type="hidden" name={name} value={raw} disabled={props.disabled} />
    </>
  );
}
