import { EmptyState } from "@/components/patterns/content-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AccessActor } from "@/features/identity/permissions";
import { listInboundBookings } from "../server/inbound";
import { ListFilter, ModulHeader, rupiah } from "./page-bits";

export async function InboundBookings({
  actor,
  values,
}: {
  actor: AccessActor;
  values: { search?: string; from?: string; to?: string };
}) {
  const rows = await listInboundBookings(actor, values);
  const heads = [
    "Booking No.",
    "Tanggal",
    "Asal",
    "Tujuan",
    "Pengirim",
    "Penerima",
    "Koli",
    "Kilo",
    "Volume",
    "Harga (Rp)",
    "Dibuat Oleh",
    "Status",
  ];
  const right = new Set(["Koli", "Kilo", "Volume", "Harga (Rp)"]);
  return (
    <>
      <ModulHeader
        title="Kelola Inbound Booking"
        info="Booking yang menuju cabang Anda: tujuan booking sama dengan nama cabang Anda. Maksimal 500 baris terbaru."
      />
      <ListFilter
        action="/bookings"
        hidden={{ tab: "inbound" }}
        values={values}
        searchLabel="Booking No."
      />
      <section
        aria-label="Daftar inbound booking"
        className="min-w-0 rounded-lg border bg-background"
      >
        {rows.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[64rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  {heads.map((h) => (
                    <TableHead
                      key={h}
                      className={right.has(h) ? "text-right" : undefined}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell className="tabular-nums">{i + 1}</TableCell>
                    <TableCell>{r.booking_no ?? "-"}</TableCell>
                    <TableCell>{r.tanggal}</TableCell>
                    <TableCell>{r.asal ?? "-"}</TableCell>
                    <TableCell>{r.tujuan ?? "-"}</TableCell>
                    <TableCell>{r.pengirim ?? "-"}</TableCell>
                    <TableCell>{r.penerima ?? "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.koli ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.kilo ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.volume ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {rupiah(r.biaya)}
                    </TableCell>
                    <TableCell>{r.dibuat_oleh ?? "-"}</TableCell>
                    <TableCell>{r.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Belum ada inbound booking"
            description="Booking yang tujuannya cabang Anda akan tampil di sini. Ubah filter tanggal atau nomor booking jika perlu."
          />
        )}
      </section>
    </>
  );
}
