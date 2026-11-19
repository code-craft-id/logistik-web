import Form from "next/form";
import type { ReactNode } from "react";
import { InfoTip } from "@/components/patterns/info-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const selectClass =
  "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

export const day = (value: Date | null | undefined) =>
  value ? value.toISOString().slice(0, 10) : "-";
export const rupiah = (value: string | null | undefined) =>
  value === null || value === undefined
    ? "-"
    : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
        Number(value),
      );

export function ModulHeader({
  title,
  info,
  children,
}: {
  title: string;
  info: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        <InfoTip text={info} />
      </div>
      {children}
    </header>
  );
}

/** GET filter row: optional status, search text and date range. */
export function ListFilter({
  action,
  values,
  searchLabel,
  statuses,
  hidden,
}: {
  action: string;
  values: { status?: string; search?: string; from?: string; to?: string };
  searchLabel: string;
  statuses?: Record<string, string>;
  hidden?: Record<string, string>;
}) {
  return (
    <Form
      action={action}
      className="grid items-end gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_10rem_auto]"
    >
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="min-w-0 space-y-2">
        <Label htmlFor="f-search">{searchLabel}</Label>
        <Input
          id="f-search"
          name="search"
          maxLength={50}
          defaultValue={values.search}
          className="min-h-11"
        />
      </div>
      {statuses ? (
        <div className="min-w-0 space-y-2">
          <Label htmlFor="f-status">Status</Label>
          <select
            id="f-status"
            name="status"
            defaultValue={values.status ?? ""}
            className={selectClass}
          >
            {!("ALL" in statuses) && <option value="">Semua</option>}
            {Object.entries(statuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="hidden lg:block" />
      )}
      <div className="min-w-0 space-y-2">
        <Label htmlFor="f-from">Dari tanggal</Label>
        <Input
          id="f-from"
          name="from"
          type="date"
          defaultValue={values.from}
          className="min-h-11"
        />
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="f-to">Sampai tanggal</Label>
        <Input
          id="f-to"
          name="to"
          type="date"
          defaultValue={values.to}
          className="min-h-11"
        />
      </div>
      <Button type="submit" variant="outline" className="min-h-11">
        Tampilkan
      </Button>
    </Form>
  );
}

export function StatusText({
  value,
  labels,
}: {
  value: string;
  labels: Record<string, string>;
}) {
  const tone =
    value === "APPROVED" || value === "PAID" || value === "USED"
      ? "border-primary"
      : value === "REJECTED"
        ? "border-destructive text-destructive"
        : "border-muted-foreground/40";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${tone}`}
    >
      {labels[value] ?? value}
    </span>
  );
}

export function one(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}
