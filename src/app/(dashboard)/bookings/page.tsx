import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageTabs } from "@/components/patterns/page-tabs";
import { listBookings } from "@/features/bookings/server/queries";
import { currentIdentity } from "@/features/identity/server/context";
import { InboundBookings } from "@/features/modul/components/inbound-bookings";
import { one } from "@/features/modul/components/page-bits";
import { requirePagePermission } from "@/lib/auth/page-access";

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
  const bookings = await listBookings({ limit: 50 });

  return (
    <div className="space-y-6">
      <PageTabs label="Jenis booking" tabs={tabs} active="booking" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kelola Booking
          </h1>
          <p className="text-sm text-muted-foreground">
            Daftar booking. Booking boleh dihubungkan ke AWB, tetapi tidak
            wajib.
          </p>
        </div>
        <Link href="/bookings/new" className="px-3 py-2 border rounded">
          Tambah Booking
        </Link>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">No.</th>
              <th className="text-left p-2">Booking No.</th>
              <th className="text-left p-2">Tanggal</th>
              <th className="text-left p-2">DO No.</th>
              <th className="text-left p-2">Pengirim</th>
              <th className="text-left p-2">Penerima</th>
              <th className="text-left p-2">Tujuan</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Koli</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="p-4 text-center text-muted-foreground"
                >
                  Belum ada data
                </td>
              </tr>
            ) : (
              bookings.map((b, index) => (
                <tr key={b.id} className="border-b">
                  <td className="p-2 tabular-nums">{index + 1}</td>
                  <td className="p-2">{b.bookingNo || "-"}</td>
                  <td className="p-2">
                    {b.bookingDate.toISOString().slice(0, 10)}
                  </td>
                  <td className="p-2">{b.doNo || "-"}</td>
                  <td className="p-2">{b.senderName || "-"}</td>
                  <td className="p-2">{b.receiverName || "-"}</td>
                  <td className="p-2">{b.destination || "-"}</td>
                  <td className="p-2">{b.status}</td>
                  <td className="p-2">{b.koli ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
