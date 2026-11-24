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
  createOutgoingOrderAction,
  decideIncomingOrderAction,
} from "@/features/share-truck/actions";
import {
  DataTable,
  Field,
  STATUS_LABEL,
  shareTruckActor,
} from "@/features/share-truck/components/bits";
import { charterFormChoices, listOrders } from "@/features/share-truck/server";
import { businessDateString } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "Charter" };

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
  const incoming = one(query.dir) !== "out";
  const [{ filters, rows }, choices] = await Promise.all([
    listOrders(actor, {
      direction: incoming ? "IN" : "OUT",
      search: one(query.search) ?? "",
      from: one(query.from),
      to: one(query.to),
    }),
    charterFormChoices(actor),
  ]);
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title={incoming ? "Order Masuk Charter" : "List Order Keluar Charter"}
        info={
          incoming
            ? "Order customer untuk truk kita yang di-share (dibuat dari Dashboard Share Truck). Status Menunggu: Terima atau Tolak. Order yang diterima lanjut di Update Status dan bisa dibuatkan Invoice Keluar."
            : "Order kita untuk menyewa truk vendor. Tambah Order mencatat vendor, nopol, rute, muatan dan Total Biaya; order langsung Diterima, lanjut di Update Status dan Invoice Masuk dari vendor."
        }
      />
      {!incoming && canManage && (
        <div>
          <FormDialog
            trigger="Tambah Order Keluar"
            title="Tambah Order Keluar Charter"
            description="Sewa truk vendor. Order langsung Diterima dan lanjut di Update Status."
            action={createOutgoingOrderAction}
            wide
          >
            <Field
              label="Vendor"
              name="vendorId"
              required
              options={choices.vendors}
            />
            <Field
              label="Cabang"
              name="branchId"
              required
              options={choices.branches}
              defaultValue={choices.branches[0]?.id}
            />
            <Field
              label="Tanggal Muat"
              name="loadDate"
              type="date"
              required
              defaultValue={businessDateString()}
            />
            <Field label="Nopol" name="plateNumber" required maxLength={20} />
            <Field label="Jenis Truk" name="truckType" maxLength={100} />
            <Field label="Asal" name="origin" required maxLength={100} />
            <Field label="Tujuan" name="destination" required maxLength={100} />
            <Field label="Berat (kg)" name="weight" type="number" />
            <Field label="Koli" name="koli" type="number" />
            <Field label="Total Biaya" name="totalCost" required />
            <Field label="Isi Barang" name="goods" maxLength={255} />
            <Field label="Keterangan" name="remarks" maxLength={255} />
          </FormDialog>
        </div>
      )}
      <ListFilter
        action="/share-truck/orders"
        searchLabel="No. Order"
        values={{ search: filters.search, from: filters.from, to: filters.to }}
        hidden={incoming ? undefined : { dir: "out" }}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada order"
          description={
            incoming
              ? "Order masuk dibuat dari Dashboard Share Truck."
              : "Klik Tambah Order Keluar untuk menyewa truk vendor."
          }
        />
      ) : (
        <DataTable
          heads={[
            "No. Order",
            "Tanggal Muat",
            "Nopol",
            incoming ? "Customer" : "Vendor",
            "Asal",
            "Tujuan",
            "Jenis",
            "Berat",
            "Koli",
            "Total Biaya",
            "Isi Barang",
            "Status",
            "Keterangan",
            ...(incoming && canManage ? ["Action"] : []),
          ]}
        >
          {rows.map((r) => (
            <TableRow key={r.id} className="align-top">
              <TableCell className="font-mono">{r.orderNo}</TableCell>
              <TableCell>{day(r.loadDate)}</TableCell>
              <TableCell className="font-mono">{r.plateNumber}</TableCell>
              <TableCell>
                {(incoming ? r.customer?.name : r.vendor?.name) ?? "-"}
              </TableCell>
              <TableCell>{r.origin}</TableCell>
              <TableCell>{r.destination}</TableCell>
              <TableCell>{r.truckType ?? "-"}</TableCell>
              <TableCell>{r.weight?.toString() ?? "-"}</TableCell>
              <TableCell>{r.koli ?? "-"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {rupiah(r.totalCost.toString())}
              </TableCell>
              <TableCell>{r.goods ?? "-"}</TableCell>
              <TableCell>{STATUS_LABEL[r.status] ?? r.status}</TableCell>
              <TableCell>{r.remarks ?? "-"}</TableCell>
              {incoming && canManage && (
                <TableCell className="min-w-56">
                  {r.status === "WAITING" ? (
                    <ActionForm
                      action={decideIncomingOrderAction}
                      submit={
                        <>
                          <Button
                            type="submit"
                            name="decision"
                            value="ACCEPT"
                            className="min-h-11"
                          >
                            Terima
                          </Button>
                          <Button
                            type="submit"
                            name="decision"
                            value="REJECT"
                            variant="destructive"
                            className="min-h-11"
                          >
                            Tolak
                          </Button>
                        </>
                      }
                    >
                      <input type="hidden" name="orderId" value={r.id} />
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
