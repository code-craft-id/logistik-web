import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/patterns/content-state";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { selectClass } from "@/features/modul/components/page-bits";
import { isMoneyField } from "@/lib/format/money-fields";

/** Signed-in actor with Share Truck view right, or a denial element. */
export async function shareTruckActor() {
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const actor = current.actor;
  if (!permits(actor, "view", "share_truck"))
    return {
      denied: (
        <EmptyState
          title="Akses ditolak"
          description="Grup Anda belum memiliki hak lihat Share Truck. Minta admin menambahkannya di Hak Akses Menu."
        />
      ),
    } as const;
  return { actor, canManage: permits(actor, "manage", "share_truck") } as const;
}

export function DataTable({
  heads,
  children,
}: {
  heads: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            {heads.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  options,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  options?: { id: number | string; name: string }[];
  maxLength?: number;
}) {
  const labelClass = "grid min-w-0 gap-1 text-sm font-medium";
  if (options)
    return (
      <label className={labelClass}>
        {label}
        <select
          name={name}
          required={required}
          defaultValue={defaultValue ?? ""}
          className={selectClass}
        >
          <option value="">Pilih…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
    );
  if (isMoneyField(name))
    return (
      <div className={labelClass}>
        <label htmlFor={`st-${name}`}>{label}</label>
        <MoneyInput
          id={`st-${name}`}
          name={name}
          required={required}
          defaultValue={defaultValue}
          className={selectClass}
        />
      </div>
    );
  return (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        maxLength={maxLength}
        inputMode={type === "number" ? "decimal" : undefined}
        step={type === "number" ? "any" : undefined}
        className={selectClass}
      />
    </label>
  );
}

export const STATUS_LABEL: Record<string, string> = {
  WAITING: "Menunggu",
  ACCEPTED: "Diterima",
  LOADING: "Muat",
  "ON THE WAY": "Dalam Perjalanan",
  ARRIVED: "Tiba",
  DONE: "Selesai",
  REJECTED: "Ditolak",
};
