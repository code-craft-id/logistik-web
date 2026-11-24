import type { Metadata } from "next";
import Form from "next/form";
import { EmptyState } from "@/components/patterns/content-state";
import { FormDialog } from "@/components/patterns/form-dialog";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  day,
  ModulHeader,
  one,
  rupiah,
  selectClass,
} from "@/features/modul/components/page-bits";
import { createIncomingOrderAction } from "@/features/share-truck/actions";
import {
  DataTable,
  Field,
  shareTruckActor,
} from "@/features/share-truck/components/bits";
import {
  charterFormChoices,
  searchSharedTrucks,
} from "@/features/share-truck/server";
import { businessDateString } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "Share Truck" };

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
  const type = one(query.type) ?? "";
  const sort = one(query.sort) === "fast" ? "fast" : "cheap";
  const [{ rows, types }, choices] = await Promise.all([
    searchSharedTrucks(actor, { type, sort }),
    charterFormChoices(actor),
  ]);
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title="Share Truck"
        info="Cari truk yang sedang dibagikan (Ready Truck) menurut Jenis, urutkan Termurah atau Tercepat. Order membuat Order Masuk Charter untuk customer penyewa (status Menunggu sampai diterima)."
      />
      <Form
        action="/share-truck"
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-background p-4"
      >
        <label className="grid min-w-44 gap-1 text-sm font-medium">
          Jenis
          <select name="type" defaultValue={type} className={selectClass}>
            <option value="">Semua jenis</option>
            {types.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-36 gap-1 text-sm font-medium">
          Sort By
          <select name="sort" defaultValue={sort} className={selectClass}>
            <option value="cheap">Termurah</option>
            <option value="fast">Tercepat</option>
          </select>
        </label>
        <Button type="submit" variant="outline" className="min-h-11">
          Cari Kendaraan
        </Button>
      </Form>
      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada truk ready"
          description="Bagikan kendaraan di Share Truck > Ready Truck agar muncul di sini."
        />
      ) : (
        <DataTable
          heads={[
            "Cabang",
            "Nopol",
            "Type",
            "Asal",
            "Tujuan",
            "Harga",
            "Lead Time (hari)",
            "Tgl Tersedia",
            "Tgl Berakhir",
            ...(canManage ? ["Action"] : []),
          ]}
        >
          {rows.map((r) => (
            <TableRow key={r.id} className="align-top">
              <TableCell>{r.vehicle.branch?.name ?? "-"}</TableCell>
              <TableCell className="font-mono">
                {r.vehicle.licensePlate}
              </TableCell>
              <TableCell>
                {r.vehicle.truckingType?.name ?? r.vehicle.name}
              </TableCell>
              <TableCell>{r.origin}</TableCell>
              <TableCell>{r.destination}</TableCell>
              <TableCell className="text-right tabular-nums">
                {rupiah(r.price.toString())}
              </TableCell>
              <TableCell className="text-right">{r.leadTimeDays}</TableCell>
              <TableCell>{day(r.availableFrom)}</TableCell>
              <TableCell>{day(r.availableTo)}</TableCell>
              {canManage && (
                <TableCell>
                  <FormDialog
                    trigger="Order"
                    title={`Order truk ${r.vehicle.licensePlate}`}
                    description={`${r.origin} → ${r.destination}, ${r.leadTimeDays} hari. Order masuk ke Order Masuk Charter dengan status Menunggu.`}
                    action={createIncomingOrderAction}
                    submitLabel="Buat Order"
                    wide
                  >
                    <input type="hidden" name="shareId" value={r.id} />
                    <Field
                      label="Customer"
                      name="customerId"
                      required
                      options={choices.customers}
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
                    <Field
                      label="Asal"
                      name="origin"
                      required
                      defaultValue={r.origin}
                      maxLength={100}
                    />
                    <Field
                      label="Tujuan"
                      name="destination"
                      required
                      defaultValue={r.destination}
                      maxLength={100}
                    />
                    <Field label="Berat (kg)" name="weight" type="number" />
                    <Field label="Koli" name="koli" type="number" />
                    <Field
                      label="Total Biaya"
                      name="totalCost"
                      required
                      defaultValue={r.price.toFixed(0)}
                    />
                    <Field label="Isi Barang" name="goods" maxLength={255} />
                    <Field label="Keterangan" name="remarks" maxLength={255} />
                  </FormDialog>
                </TableCell>
              )}
            </TableRow>
          ))}
        </DataTable>
      )}
    </div>
  );
}
