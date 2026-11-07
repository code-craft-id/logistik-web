import { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { BookingForm } from "@/features/bookings/components/booking-form";

export const metadata: Metadata = { title: "Tambah Booking" };

export default async function Page() {
  await requirePermission("create", "booking");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tambah Booking</h1>
        <p className="text-sm text-muted-foreground">
          Buat booking baru. Relasi booking-AWB mengikuti aturan yang diamati (opsional).
        </p>
      </div>
      <BookingForm />
    </div>
  );
}
