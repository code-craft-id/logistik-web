import type { Metadata } from "next";
import { EmptyState } from "@/components/patterns/content-state";
import { FormDialog } from "@/components/patterns/form-dialog";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ActionForm } from "@/features/modul/components/action-form";
import {
  day,
  ListFilter,
  ModulHeader,
  one,
  rupiah,
} from "@/features/modul/components/page-bits";
import {
  createCharterInvoiceAction,
  payCharterInvoiceAction,
} from "@/features/share-truck/actions";
import {
  DataTable,
  Field,
  shareTruckActor,
} from "@/features/share-truck/components/bits";
import { listCharterInvoices } from "@/features/share-truck/server";

export const metadata: Metadata = { title: "Invoice Charter" };

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
  const incoming = one(query.type) === "masuk";
  const search = one(query.search) ?? "";
  const from = one(query.from);
  const to = one(query.to);
  const { invoices, uninvoiced } = await listCharterInvoices(
    actor,
    incoming ? "OUT" : "IN",
    search,
    { from, to },
  );
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title={incoming ? "Invoice Masuk" : "Invoice Keluar"}
        info={
          incoming
            ? "Tagihan vendor untuk Order Keluar Charter (kita menyewa truk vendor). Catat No. Invoice vendor lalu tandai Lunas saat dibayar. Nilai = Total Biaya order; belum membuat jurnal."
            : "Tagihan ke customer untuk Order Masuk Charter yang sudah diterima. Pilih No. Order, isi Invoice No lalu tandai Lunas saat dibayar. Nilai = Total Biaya order; belum membuat jurnal."
        }
      />
      {canManage &&
        (uninvoiced.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Semua order yang diterima sudah punya invoice.
          </p>
        ) : (
          <div>
            <FormDialog
              trigger="Add Invoice"
              title={incoming ? "Add Invoice Masuk" : "Add Invoice Keluar"}
              description="Nilai invoice = Total Biaya order."
              action={createCharterInvoiceAction}
            >
              <Field
                label="Nopol / No. Order"
                name="orderId"
                required
                options={uninvoiced.map((o) => ({
                  id: o.id,
                  name: `${o.plateNumber} · ${o.orderNo} · Rp ${rupiah(o.totalCost.toString())}`,
                }))}
              />
              <Field
                label="Invoice No"
                name="invoiceNo"
                required
                maxLength={50}
              />
              <Field label="Keterangan" name="notes" maxLength={255} />
            </FormDialog>
          </div>
        ))}
      <ListFilter
        action="/share-truck/invoices"
        searchLabel="Invoice No."
        values={{ search, from, to }}
        hidden={incoming ? { type: "masuk" } : undefined}
      />
      {invoices.length === 0 ? (
        <EmptyState
          title="Belum ada invoice"
          description="Invoice yang dibuat tampil di sini."
        />
      ) : (
        <DataTable
          heads={[
            incoming ? "Company" : "Nopol",
            "Invoice No",
            "No. Order",
            "Created Date",
            "Keterangan",
            "Nilai",
            "Status",
            "Payment Date",
            ...(canManage ? ["Action"] : []),
          ]}
        >
          {invoices.map((i) => (
            <TableRow key={i.id}>
              <TableCell>
                {incoming ? (i.order.vendor?.name ?? "-") : i.order.plateNumber}
              </TableCell>
              <TableCell className="font-mono">{i.invoiceNo}</TableCell>
              <TableCell className="font-mono">{i.order.orderNo}</TableCell>
              <TableCell>{day(i.createdAt)}</TableCell>
              <TableCell>{i.notes ?? "-"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {rupiah(i.amount.toString())}
              </TableCell>
              <TableCell>
                {i.status === "PAID" ? "Lunas" : "Belum Lunas"}
              </TableCell>
              <TableCell>{day(i.paidAt)}</TableCell>
              {canManage && (
                <TableCell>
                  {i.status === "UNPAID" ? (
                    <ActionForm
                      action={payCharterInvoiceAction}
                      submit={
                        <Button type="submit" className="min-h-11">
                          Lunas
                        </Button>
                      }
                    >
                      <input type="hidden" name="invoiceId" value={i.id} />
                    </ActionForm>
                  ) : (
                    "-"
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </DataTable>
      )}
    </div>
  );
}
