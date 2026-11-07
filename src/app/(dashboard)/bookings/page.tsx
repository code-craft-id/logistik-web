import { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { listBookings } from "@/features/bookings/server/queries";

export const metadata: Metadata = { title: "Kelola Booking" };

export default async function Page() {
  await requirePermission("view", "booking");
  const bookings = await listBookings({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kelola Booking</h1>
          <p className="text-sm text-muted-foreground">
            Daftar booking. Relasi booking-AWB bersifat opsional (D-05 belum terkonfirmasi).
          </p>
        </div>
        <Link href="/bookings/new" className="px-3 py-2 border rounded">Tambah Booking</Link>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
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
              <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Belum ada data</td></tr>
            ) : bookings.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="p-2">{b.bookingNo || "-"}</td>
                <td className="p-2">{b.bookingDate.toISOString().slice(0, 10)}</td>
                <td className="p-2">{b.doNo || "-"}</td>
                <td className="p-2">{b.senderName || "-"}</td>
                <td className="p-2">{b.receiverName || "-"}</td>
                <td className="p-2">{b.destination || "-"}</td>
                <td className="p-2">{b.status}</td>
                <td className="p-2">{b.koli ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
