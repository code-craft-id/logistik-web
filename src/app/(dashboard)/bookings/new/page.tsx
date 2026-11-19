import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingForm } from "@/features/bookings/components/booking-form";
import { transactionFormOptions } from "@/features/bookings/server/queries";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePagePermission } from "@/lib/auth/page-access";

export const metadata: Metadata = { title: "Tambah Booking" };

// Session-dependent form options; blocking render.
export const instant = false;

export default async function Page() {
  await requirePagePermission("create", "booking");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const { branches, customers } = await transactionFormOptions(current.actor);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tambah Booking
        </h1>
        <p className="text-sm text-muted-foreground">
          Buat booking baru. Relasi booking-AWB mengikuti aturan yang diamati
          (opsional).
        </p>
      </div>
      <BookingForm options={{ branches, customers }} />
    </div>
  );
}
