import type { Metadata } from "next";
import { EmptyState } from "@/components/patterns/content-state";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ActionForm } from "@/features/modul/components/action-form";
import {
  day,
  ModulHeader,
  rupiah,
} from "@/features/modul/components/page-bits";
import {
  shareTruckAction,
  unshareTruckAction,
} from "@/features/share-truck/actions";
import {
  DataTable,
  Field,
  shareTruckActor,
} from "@/features/share-truck/components/bits";
import { readyTrucks } from "@/features/share-truck/server";
import { businessDateString } from "@/lib/date/business-date";

export const metadata: Metadata = { title: "Ready Truck" };

// Session-dependent page; blocking render.
export const instant = false;

export default async function Page() {
  const access = await shareTruckActor();
  if ("denied" in access) return access.denied;
  const { actor, canManage } = access;
  const vehicles = await readyTrucks(actor);
  const today = businessDateString();
  return (
    <div className="min-w-0 space-y-5">
      <ModulHeader
        title="Ready Truck"
        info="Daftar kendaraan aktif dari Master Data > Kendaraan. Share menawarkan truk untuk charter dengan Asal, Tujuan, Lead Time, Tgl Tersedia, Tgl Berakhir dan Harga; truk yang di-share muncul di Dashboard Share Truck sampai Tgl Berakhir. Unshare menarik tawaran."
      />
      {vehicles.length === 0 ? (
        <EmptyState
          title="Belum ada kendaraan"
          description="Tambahkan kendaraan di Master Data > Kendaraan Logistik."
        />
      ) : (
        <DataTable
          heads={[
            "Kode",
            "Jenis",
            "Type",
            "No. Polisi",
            "Asal",
            "Tujuan",
            "Lead Time",
            "Tgl Tersedia",
            "Tgl Berakhir",
            "Harga",
            ...(canManage ? ["Action"] : []),
          ]}
        >
          {vehicles.map((v) => {
            const s = v.share?.active ? v.share : null;
            return (
              <TableRow key={v.id} className="align-top">
                <TableCell>{v.id}</TableCell>
                <TableCell>{v.truckingType?.name ?? "-"}</TableCell>
                <TableCell>{v.name}</TableCell>
                <TableCell className="font-mono">{v.licensePlate}</TableCell>
                <TableCell>{s?.origin ?? "-"}</TableCell>
                <TableCell>{s?.destination ?? "-"}</TableCell>
                <TableCell>{s?.leadTimeDays ?? "-"}</TableCell>
                <TableCell>{s ? day(s.availableFrom) : "-"}</TableCell>
                <TableCell>{s ? day(s.availableTo) : "-"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {s ? rupiah(s.price.toString()) : "-"}
                </TableCell>
                {canManage && (
                  <TableCell className="min-w-72">
                    <details>
                      <summary className="min-h-11 cursor-pointer py-2 text-primary">
                        {s ? "Ubah Share" : "Share"}
                      </summary>
                      <ActionForm
                        action={shareTruckAction}
                        className="grid gap-2 pt-2"
                      >
                        <input type="hidden" name="vehicleId" value={v.id} />
                        <Field
                          label="Asal"
                          name="origin"
                          required
                          defaultValue={s?.origin}
                          maxLength={100}
                        />
                        <Field
                          label="Tujuan"
                          name="destination"
                          required
                          defaultValue={s?.destination}
                          maxLength={100}
                        />
                        <Field
                          label="Lead Time (hari)"
                          name="leadTimeDays"
                          type="number"
                          required
                          defaultValue={s?.leadTimeDays}
                        />
                        <Field
                          label="Tgl Tersedia"
                          name="availableFrom"
                          type="date"
                          required
                          defaultValue={
                            s ? businessDateString(s.availableFrom) : today
                          }
                        />
                        <Field
                          label="Tgl Berakhir"
                          name="availableTo"
                          type="date"
                          required
                          defaultValue={
                            s ? businessDateString(s.availableTo) : today
                          }
                        />
                        <Field
                          label="Harga"
                          name="price"
                          required
                          defaultValue={s?.price.toFixed(0)}
                        />
                      </ActionForm>
                    </details>
                    {s && (
                      <ActionForm
                        action={unshareTruckAction}
                        submit={
                          <Button
                            type="submit"
                            variant="outline"
                            className="min-h-11"
                          >
                            Unshare
                          </Button>
                        }
                      >
                        <input type="hidden" name="vehicleId" value={v.id} />
                      </ActionForm>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
