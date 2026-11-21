import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InfoTip } from "@/components/patterns/info-tip";
import { PageTabs } from "@/components/patterns/page-tabs";
import { SelectAllCheckbox } from "@/components/patterns/select-all";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingRowActions } from "@/features/bookings/components/booking-row-actions";
import { BOOKING_STATUS } from "@/features/bookings/server/pickup";
import {
  bookingCourierOptions,
  listBookings,
} from "@/features/bookings/server/queries";
import { permits } from "@/features/identity/permissions";
import { currentIdentity } from "@/features/identity/server/context";
import { InboundBookings } from "@/features/modul/components/inbound-bookings";
import { one } from "@/features/modul/components/page-bits";
import { requirePagePermission } from "@/lib/auth/page-access";
import { businessDateString } from "@/lib/date/business-date";
import { formatRupiah } from "@/lib/format/rupiah";

export const metadata: Metadata = { title: "Kelola Booking" };

// Session- and query-dependent page; blocking render.
export const instant = false;

const tabs = [
  { key: "booking", label: "Booking", href: "/bookings" },
  { key: "inbound", label: "Inbound Booking", href: "/bookings?tab=inbound" },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePagePermission("view", "booking");
  const query = await searchParams;
  if (one(query.tab) === "inbound") {
    const current = await currentIdentity();
    if (!current) redirect("/login");
    return (
      <div className="min-w-0 space-y-5">
        <PageTabs label="Jenis booking" tabs={tabs} active="inbound" />
        <InboundBookings
          actor={current.actor}
          values={{
            search: one(query.search),
            from: one(query.from),
            to: one(query.to),
          }}
        />
      </div>
    );
  }
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const canApprove = permits(current.actor, "approve", "booking");
  const [bookings, couriers] = await Promise.all([
    listBookings({ limit: 100 }),
    canApprove ? bookingCourierOptions(current.actor) : Promise.resolve([]),
  ]);
  const tone: Record<string, string> = {
    [BOOKING_STATUS.WAITING]: "border-muted-foreground/40",
    [BOOKING_STATUS.PROGRESS]: "border-primary",
    [BOOKING_STATUS.CANCEL]: "border-destructive text-destructive",
  };

  return (
    <div className="min-w-0 space-y-5">
      <PageTabs label="Jenis booking" tabs={tabs} active="booking" />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Kelola Booking
          </h1>
          <InfoTip text="Booking adalah pesanan jemput dan berdiri sendiri (tidak tertaut ke AWB). Alur: WAITING TO PICKUP → ✔ tugaskan kurir → kurir scan barcode booking (Konfirmasi Jemput) → PROGRESS PICKUP; atau ✖ batalkan → CANCEL PICKUP. AWB dibuat terpisah setelah barang tiba." />
        </div>
        <Button asChild className="min-h-11">
          <Link href="/bookings/new">Tambah Booking</Link>
        </Button>
      </header>
      {/* Print selection form; row checkboxes join it with form="booking-print". */}
      <form
        id="booking-print"
        action="/print/bookings"
        method="get"
        target="_blank"
        rel="noopener"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3"
      >
        <SelectAllCheckbox name="ids" />
        <Button type="submit" className="min-h-11">
          Print terpilih (barcode)
        </Button>
      </form>
      <section
        aria-label="Daftar booking"
        className="min-w-0 rounded-lg border bg-background"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[80rem]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Pilih</span>
                </TableHead>
                <TableHead className="w-12">No.</TableHead>
                <TableHead>Booking No.</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Asal</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Pengirim</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead className="text-right">Koli</TableHead>
                <TableHead className="text-right">Kilo</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Tarif (Rp)</TableHead>
                <TableHead>Dibuat Oleh</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kurir</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={16}
                    className="p-4 text-center text-muted-foreground"
                  >
                    Belum ada booking.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b, index) => {
                  const waiting = b.status === BOOKING_STATUS.WAITING;
                  const branchCouriers = couriers.filter(
                    (c) => c.branchId === null || c.branchId === b.branchId,
                  );
                  return (
                    <TableRow key={b.id} className="align-top">
                      <TableCell>
                        <input
                          type="checkbox"
                          name="ids"
                          value={b.id}
                          form="booking-print"
                          aria-label={`Pilih booking ${b.bookingNo ?? b.id}`}
                          className="size-4"
                        />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono">
                        {b.bookingNo || "-"}
                      </TableCell>
                      <TableCell>{businessDateString(b.bookingDate)}</TableCell>
                      <TableCell>{b.branch?.name ?? "-"}</TableCell>
                      <TableCell>{b.destination || "-"}</TableCell>
                      <TableCell>{b.senderName || "-"}</TableCell>
                      <TableCell>{b.receiverName || "-"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {b.koli ?? 0}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {b.kilo?.toString() ?? "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {b.volume?.toString() ?? "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(b.biaya, { prefix: false })}
                      </TableCell>
                      <TableCell>{b.createdBy?.name ?? "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${tone[b.status] ?? ""}`}
                        >
                          {b.status}
                        </span>
                        {b.cancelReason && (
                          <span className="block max-w-48 whitespace-normal text-xs text-muted-foreground">
                            {b.cancelReason}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{b.courier?.name ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/print/bookings?ids=${b.id}`}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
                          >
                            Print
                          </a>
                          {waiting && canApprove && (
                            <BookingRowActions
                              bookingId={b.id}
                              bookingNo={b.bookingNo ?? `#${b.id}`}
                              courierId={b.courierId}
                              couriers={branchCouriers.map(({ id, name }) => ({
                                id,
                                name,
                              }))}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
