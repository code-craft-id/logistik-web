"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { IdentityError } from "@/features/identity/server/access";
import { currentIdentity } from "@/features/identity/server/context";
import type { ModulResult } from "@/features/modul/actions";
import { awbScanEnabled } from "@/lib/features";
import {
  assignCourier,
  type BookingScanView,
  cancelBooking,
  confirmPickup,
  PickupError,
  recordPickupResult,
  scanBooking,
} from "./server/pickup";

const message = (e: unknown) =>
  e instanceof PickupError
    ? e.message
    : e instanceof ZodError
      ? "Isian belum valid. Pilih kurir terlebih dahulu."
      : e instanceof IdentityError
        ? e.code === "UNAUTHENTICATED"
          ? "Sesi Anda berakhir. Silakan masuk kembali."
          : "Grup Anda belum memiliki hak untuk tindakan ini. Minta admin menambahkannya di Hak Akses Menu."
        : "Terjadi kesalahan sistem. Coba lagi.";

async function actor() {
  const current = await currentIdentity();
  if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
  return current.actor;
}

export async function assignCourierAction(
  formData: FormData,
): Promise<ModulResult> {
  try {
    await assignCourier(await actor(), Object.fromEntries(formData));
    revalidatePath("/bookings");
    return { ok: true, message: "Kurir ditugaskan." };
  } catch (e) {
    return { ok: false, message: message(e) };
  }
}

export async function cancelBookingAction(
  formData: FormData,
): Promise<ModulResult> {
  try {
    await cancelBooking(await actor(), Object.fromEntries(formData));
    revalidatePath("/bookings");
    return { ok: true, message: "Booking dibatalkan (CANCEL PICKUP)." };
  } catch (e) {
    return { ok: false, message: message(e) };
  }
}

type ScanResult =
  | { ok: true; booking: BookingScanView | null }
  | { ok: false; message: string };

/** Booking card for a scanned number; booking null means "not a booking". */
export async function scanBookingAction(code: string): Promise<ScanResult> {
  try {
    if (!awbScanEnabled())
      throw new PickupError("Fitur Scan AWB belum diaktifkan.");
    return {
      ok: true,
      booking: await scanBooking(await actor(), String(code ?? "")),
    };
  } catch (e) {
    return { ok: false, message: message(e) };
  }
}

export async function confirmPickupAction(
  bookingId: number,
): Promise<
  { ok: true; booking: BookingScanView } | { ok: false; message: string }
> {
  try {
    if (!awbScanEnabled())
      throw new PickupError("Fitur Scan AWB belum diaktifkan.");
    const booking = await confirmPickup(await actor(), Number(bookingId));
    revalidatePath("/bookings");
    return { ok: true, booking };
  } catch (e) {
    return { ok: false, message: message(e) };
  }
}

export async function recordPickupResultAction(input: {
  bookingId: number;
  result: "SUCCESS" | "MISS";
  note?: string;
}): Promise<
  { ok: true; booking: BookingScanView } | { ok: false; message: string }
> {
  try {
    if (!awbScanEnabled())
      throw new PickupError("Fitur Scan AWB belum diaktifkan.");
    const booking = await recordPickupResult(await actor(), input);
    revalidatePath("/bookings");
    return { ok: true, booking };
  } catch (e) {
    return { ok: false, message: message(e) };
  }
}
