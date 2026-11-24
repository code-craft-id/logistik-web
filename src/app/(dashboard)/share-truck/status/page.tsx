import type { Metadata } from "next";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { ActionForm } from "@/features/modul/components/action-form";
import {
  day,
  ListFilter,
  ModulHeader,
  one,
  rupiah,
} from "@/features/modul/components/page-bits";
import { advanceOrderStatusAction } from "@/features/share-truck/actions";
import {
  DataTable,
  STATUS_LABEL,
  shareTruckActor,
} from "@/features/share-truck/components/bits";
import { listOrders, nextCharterStatus } from "@/features/share-truck/server";
import { businessDateTimeString } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "Status Charter" };

// Session- and query-dependent page; blocking render.
export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await shareTruckActor();
  if ("denied" in access) return access.denied;
  const { actor, canManage } = access;
  const query = await searchParams;
  const check = one(query.view) === "check";
  const update = !check && canManage;
  const { filters, rows } = await listOrders(actor, {
    search: one(query.search) ?? "",
    from: one(query.from),
    to: one(query.to),
    ...(check ? {} : { active: true }),
  });
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title={check ? "Cek Status" : "Update Status"}
        info={
          check
            ? "Semua order charter (masuk dan keluar) dengan riwayat status: siapa dan kapan status diubah."
            : "Order charter yang sedang berjalan. Status maju satu langkah: Diterima → Muat → Dalam Perjalanan → Tiba → Selesai; setiap perubahan dicatat di Cek Status."
        }
      />
      <ListFilter
        action="/share-truck/status"
        searchLabel="No. Order"
        values={{ search: filters.search, from: filters.from, to: filters.to }}
        hidden={check ? { view: "check" } : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada order"
          description="Order charter yang diterima akan tampil di sini."
        />
      ) : (
        <DataTable
          heads={[
            "No Order",
            "Tanggal Muat",
            "Nopol",
            "Asal",
            "Tujuan",
            "Berat",
            "Koli",
            "Total Biaya",
            "Type",
            "Status",
            check ? "Riwayat" : "Action",
          ]}
        >
          {rows.map((r) => {
            const next = nextCharterStatus(r.status);
            return (
              <TableRow key={r.id} className="align-top">
                <TableCell className="font-mono">{r.orderNo}</TableCell>
                <TableCell>{day(r.loadDate)}</TableCell>
                <TableCell className="font-mono">{r.plateNumber}</TableCell>
                <TableCell>{r.origin}</TableCell>
                <TableCell>{r.destination}</TableCell>
                <TableCell>{r.weight?.toString() ?? "-"}</TableCell>
                <TableCell>{r.koli ?? "-"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {rupiah(r.totalCost.toString())}
                </TableCell>
                <TableCell>
                  {r.direction === "IN" ? "Order Masuk" : "Order Keluar"}
                </TableCell>
                <TableCell>{STATUS_LABEL[r.status] ?? r.status}</TableCell>
                <TableCell className="min-w-64">
                  {check ? (
                    <ol className="space-y-1 text-xs">
                      {r.statusLogs.map((l) => (
                        <li key={l.id}>
                          {businessDateTimeString(l.createdAt)} ·{" "}
                          {STATUS_LABEL[l.newStatus] ?? l.newStatus}
                          {l.actor ? ` · ${l.actor.name}` : ""}
                          {l.note ? ` · ${l.note}` : ""}
                        </li>
                      ))}
                    </ol>
                  ) : update && next ? (
                    <ActionForm
                      action={advanceOrderStatusAction}
                      submit={
                        <Button type="submit" className="min-h-11">
                          {STATUS_LABEL[next]}
                        </Button>
                      }
                    >
                      <input type="hidden" name="orderId" value={r.id} />
                      <input type="hidden" name="status" value={next} />
                      <Input
                        name="note"
                        maxLength={255}
                        placeholder="Catatan (opsional)"
                        aria-label={`Catatan status ${r.orderNo}`}
                        className="min-h-11"
                      />
                    </ActionForm>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
