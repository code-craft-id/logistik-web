import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingForm } from "@/features/bookings/components/booking-form";
import {
  bookingCourierOptions,
  transactionFormOptions,
} from "@/features/bookings/server/queries";
import { currentIdentity } from "@/features/identity/server/context";
import { requirePagePermission } from "@/lib/auth/page-access";

export const metadata: Metadata = { title: "Tambah Booking" };

// Session-dependent form options; blocking render.
export const instant = false;

export default async function Page() {
  await requirePagePermission("create", "booking");
  const current = await currentIdentity();
  if (!current) redirect("/login");
  const [options, couriers] = await Promise.all([
    transactionFormOptions(current.actor),
    bookingCourierOptions(current.actor),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tambah Booking
        </h1>
        <p className="text-sm text-muted-foreground">
          Pesanan jemput, berdiri sendiri (tidak tertaut ke AWB). Nomor otomatis
          setelah Asal dipilih; tekan Manual AWB untuk mengetik nomor sendiri.
        </p>
      </div>
      <BookingForm
        options={{
          branches: options.branches,
          destinations: options.destinations,
          customers: options.customers,
          nextBooking: options.nextBooking,
          deliveryServices: options.deliveryServices,
          goodsTypes: options.goodsTypes,
          transportModes: options.transportModes,
          costTypes: options.costTypes,
          couriers,
          consignees: options.consignees,
          tariffs: options.tariffs,
        }}
      />
    </div>
  );
}
