import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";

/** Booking pickup lifecycle (OBSERVED in the provider app). */
export const BOOKING_STATUS = {
  WAITING: "WAITING TO PICKUP",
  PROGRESS: "PROGRESS PICKUP",
  CANCEL: "CANCEL PICKUP",
} as const;

export class PickupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PickupError";
  }
}

const lock = (tx: { $queryRaw: typeof prisma.$queryRaw }, id: number) =>
  tx.$queryRaw`SELECT id FROM bookings WHERE id = ${id} FOR UPDATE`;

async function bookingInScope(
  tx: Pick<typeof prisma, "booking">,
  actor: AccessActor,
  id: number,
) {
  const booking = await tx.booking.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, branchId: true, status: true, courierId: true },
  });
  if (!booking || !booking.branchId || !permitsBranch(actor, booking.branchId))
    throw new PickupError(
      "Booking tidak ditemukan atau bukan milik cabang Anda.",
    );
  return booking;
}

const assignSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  courierId: z.coerce.number().int().positive(),
});

/** ✔ in the booking list: assign (or change) the courier while waiting. */
export async function assignCourier(actor: AccessActor, input: unknown) {
  assertPermission(actor, "approve", "booking");
  const data = assignSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await lock(tx, data.bookingId);
    const booking = await bookingInScope(tx, actor, data.bookingId);
    if (booking.status !== BOOKING_STATUS.WAITING)
      throw new PickupError(
        `Kurir hanya bisa ditugaskan saat ${BOOKING_STATUS.WAITING}.`,
      );
    const courier = await tx.courier.findFirst({
      where: { id: data.courierId, deletedAt: null, status: "ACTIVE" },
      select: { branchId: true },
    });
    if (!courier)
      throw new PickupError("Kurir tidak ditemukan atau tidak aktif.");
    if (courier.branchId !== null && courier.branchId !== booking.branchId)
      throw new PickupError(
        "Kurir harus dari cabang yang sama dengan booking.",
      );
    return tx.booking.update({
      where: { id: booking.id },
      data: {
        courierId: data.courierId,
        assignedAt: new Date(),
        assignedById: actor.id,
      },
      select: { id: true },
    });
  });
}

const cancelSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3, "Alasan batal minimal 3 karakter.").max(500),
});

/** ✖ in the booking list: cancel a booking that was not picked up yet. */
export async function cancelBooking(actor: AccessActor, input: unknown) {
  assertPermission(actor, "approve", "booking");
  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success)
    throw new PickupError(
      parsed.error.issues[0]?.message ?? "Alasan batal wajib diisi.",
    );
  const data = parsed.data;
  return prisma.$transaction(async (tx) => {
    await lock(tx, data.bookingId);
    const booking = await bookingInScope(tx, actor, data.bookingId);
    if (booking.status !== BOOKING_STATUS.WAITING)
      throw new PickupError(
        booking.status === BOOKING_STATUS.CANCEL
          ? "Booking sudah dibatalkan."
          : "Booking yang sudah dijemput tidak bisa dibatalkan.",
      );
    return tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.CANCEL,
        cancelledAt: new Date(),
        cancelledById: actor.id,
        cancelReason: data.reason,
      },
      select: { id: true },
    });
  });
}

export type BookingScanView = {
  id: number;
  bookingNo: string;
  status: string;
  branch: string | null;
  courier: string | null;
  senderName: string | null;
  receiverName: string | null;
  destination: string | null;
  koli: number | null;
  kilo: string | null;
  bookingDate: string;
  pickedUpAt: string | null;
  pickedUpBy: string | null;
  cancelReason: string | null;
  /** Why "Konfirmasi Jemput" is not possible, or null when it is. */
  blocked: string | null;
};

const view = {
  id: true,
  bookingNo: true,
  status: true,
  branchId: true,
  senderName: true,
  receiverName: true,
  destination: true,
  koli: true,
  kilo: true,
  bookingDate: true,
  pickedUpAt: true,
  cancelReason: true,
  courierId: true,
  branch: { select: { name: true } },
  courier: { select: { name: true } },
  pickedUpBy: { select: { name: true } },
} as const;

function toView(b: {
  id: number;
  bookingNo: string | null;
  status: string;
  senderName: string | null;
  receiverName: string | null;
  destination: string | null;
  koli: number | null;
  kilo: { toString(): string } | null;
  bookingDate: Date;
  pickedUpAt: Date | null;
  cancelReason: string | null;
  courierId: number | null;
  branch: { name: string } | null;
  courier: { name: string } | null;
  pickedUpBy: { name: string } | null;
}): BookingScanView {
  const blocked =
    b.status === BOOKING_STATUS.CANCEL
      ? "Booking sudah dibatalkan."
      : b.status === BOOKING_STATUS.PROGRESS
        ? "Booking sudah dijemput."
        : !b.courierId
          ? "Booking belum ditugaskan ke kurir. Minta admin cabang menugaskan kurir dulu."
          : null;
  return {
    id: b.id,
    bookingNo: b.bookingNo ?? `#${b.id}`,
    status: b.status,
    branch: b.branch?.name ?? null,
    courier: b.courier?.name ?? null,
    senderName: b.senderName,
    receiverName: b.receiverName,
    destination: b.destination,
    koli: b.koli,
    kilo: b.kilo?.toString() ?? null,
    bookingDate: b.bookingDate.toISOString(),
    pickedUpAt: b.pickedUpAt?.toISOString() ?? null,
    pickedUpBy: b.pickedUpBy?.name ?? null,
    cancelReason: b.cancelReason,
    blocked,
  };
}

/**
 * Scan a booking number: a booking of another branch is refused with
 * "No. Booking tidak sesuai dengan cabang asal kurir" (OBSERVED in Progi).
 * Returns null when no booking has this number (the caller tries AWBs).
 */
export async function scanBooking(actor: AccessActor, code: string) {
  assertPermission(actor, "use", "awb_scan");
  const value = code.replace(/\s+/g, "").slice(0, 50);
  if (!value) return null;
  const found = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      bookingNo: { equals: value, mode: "insensitive" },
    },
    select: view,
    take: 20,
  });
  if (!found.length) return null;
  const mine = isAdministrator(actor)
    ? found
    : found.filter(
        (b) => b.branchId !== null && actor.branchIds.includes(b.branchId),
      );
  if (!mine.length)
    throw new PickupError("No. Booking tidak sesuai dengan cabang asal kurir.");
  if (mine.length > 1)
    throw new PickupError(
      "Nomor booking dipakai lebih dari satu cabang. Hubungi admin.",
    );
  return toView(mine[0]);
}

/** Konfirmasi Jemput: WAITING TO PICKUP (with a courier) → PROGRESS PICKUP. */
export async function confirmPickup(actor: AccessActor, bookingId: number) {
  assertPermission(actor, "use", "awb_scan");
  return prisma.$transaction(async (tx) => {
    await lock(tx, bookingId);
    const booking = await bookingInScope(tx, actor, bookingId);
    const current = await tx.booking.findUniqueOrThrow({
      where: { id: booking.id },
      select: view,
    });
    const blocked = toView(current).blocked;
    if (blocked) throw new PickupError(blocked);
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.PROGRESS,
        pickedUpAt: new Date(),
        pickedUpById: actor.id,
      },
      select: view,
    });
    return toView(updated);
  });
}
