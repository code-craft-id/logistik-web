import "server-only";

import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";
import { dayEnd, dayStart } from "./common";

export type InboundBookingRow = {
  id: number;
  booking_no: string | null;
  tanggal: string;
  asal: string | null;
  tujuan: string | null;
  pengirim: string | null;
  penerima: string | null;
  koli: number | null;
  kilo: string | null;
  volume: string | null;
  biaya: string | null;
  dibuat_oleh: string | null;
  status: string;
};

/**
 * Inbound Booking: bookings headed to the actor's branches. A booking has
 * a Tujuan branch (booking form) or, for older rows, a free-text destination
 * matched to a branch name (case-insensitive). Bookings stand alone (not linked to AWBs), as in
 * the provider app.
 */
export async function listInboundBookings(
  actor: AccessActor,
  params: { search?: string; from?: string; to?: string } = {},
): Promise<InboundBookingRow[]> {
  assertPermission(actor, "view", "booking");
  const admin = isAdministrator(actor);
  if (!admin && !actor.branchIds.length) return [];
  const ids = admin ? null : Prisma.join(actor.branchIds);
  const scope = ids
    ? Prisma.sql`db.id IN (${ids})`
    : Prisma.sql`db.id IS NOT NULL`;
  const search = params.search?.trim().slice(0, 50);
  const from = dayStart(params.from);
  const to = dayEnd(params.to);
  return prisma.$queryRaw<InboundBookingRow[]>`
    SELECT b.id, b.booking_no, to_char(b.booking_date, 'YYYY-MM-DD') AS tanggal,
           ob.name AS asal, COALESCE(db.name, b.destination) AS tujuan,
           b.sender_name AS pengirim, b.receiver_name AS penerima, b.koli,
           b.kilo::text AS kilo, b.volume::text AS volume, b.biaya::text AS biaya,
           u.name AS dibuat_oleh, b.status
    FROM bookings b
    LEFT JOIN branches ob ON ob.id = b.branch_id
    LEFT JOIN LATERAL (
      SELECT x.id, x.name FROM branches x
      WHERE x.deleted_at IS NULL
        AND (x.id = b.destination_branch_id
             OR (b.destination_branch_id IS NULL
                 AND lower(x.name) = lower(trim(b.destination))))
      ORDER BY x.id LIMIT 1) db ON TRUE
    LEFT JOIN auth_users u ON u.id = b.created_by_id
    WHERE b.deleted_at IS NULL AND ${scope}
      ${search ? Prisma.sql`AND b.booking_no ILIKE ${`%${search.replace(/[\\%_]/g, "\\$&")}%`}` : Prisma.empty}
      ${from ? Prisma.sql`AND b.booking_date >= ${from}` : Prisma.empty}
      ${to ? Prisma.sql`AND b.booking_date < ${to}` : Prisma.empty}
    ORDER BY b.booking_date DESC, b.id DESC
    LIMIT 500`;
}

/** Active branches for filters (names only). */
export async function branchChoices() {
  return prisma.branch.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
