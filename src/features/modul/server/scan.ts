import "server-only";

import { z } from "zod";
import { updateTransactionStatus } from "@/features/bookings/server/service";
import { TRANSACTION_STATUS } from "@/features/bookings/status";
import type { AccessActor } from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { transactionScope } from "./common";

/** Statuses a scan may set; transitions are validated by the AWB service. */
export const SCAN_STATUSES = [
  TRANSACTION_STATUS.IN_TRANSIT,
  TRANSACTION_STATUS.DELIVERED,
] as const;

export type ScanResult = {
  ok: boolean;
  awbNo: string;
  message: string;
  transactionId?: number;
};

const scanSchema = z.object({
  awbNo: z.string().trim().min(1).max(50),
  status: z.enum(SCAN_STATUSES),
});

/**
 * Scan AWB: set the status of one AWB in the actor's branches, recorded in
 * the status history with reason "Scan AWB". Scanning an AWB that already
 * has the status is reported, not an error.
 */
export async function scanAwb(
  actor: AccessActor,
  input: unknown,
): Promise<ScanResult> {
  // Its own right, so couriers can scan without full AWB edit rights.
  assertPermission(actor, "use", "awb_scan");
  const parsed = scanSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      awbNo: "",
      message: "Nomor AWB atau status tidak valid.",
    };
  // Barcode scanners may add spaces or lowercase; AWB numbers are stored as typed.
  const awbNo = parsed.data.awbNo.replace(/\s+/g, "");
  const matches = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      awbNo: { equals: awbNo, mode: "insensitive" },
      ...transactionScope(actor),
    },
    select: { id: true, awbNo: true, status: true },
    take: 2,
  });
  if (!matches.length)
    return {
      ok: false,
      awbNo,
      message: "AWB tidak ditemukan atau bukan milik cabang Anda.",
    };
  if (matches.length > 1)
    return {
      ok: false,
      awbNo,
      message:
        "Nomor AWB dipakai lebih dari satu cabang. Ubah lewat detail AWB.",
    };
  const [awb] = matches;
  const label = awb.awbNo ?? awbNo;
  if (awb.status === parsed.data.status)
    return {
      ok: true,
      awbNo: label,
      transactionId: awb.id,
      message: `Sudah berstatus ${awb.status}.`,
    };
  try {
    await updateTransactionStatus(
      {
        transactionId: awb.id,
        newStatus: parsed.data.status,
        reason: "Scan AWB",
      },
      actor,
    );
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    return {
      ok: false,
      awbNo: label,
      transactionId: awb.id,
      message:
        code === "INVALID_STATUS_TRANSITION"
          ? `Status ${awb.status} tidak bisa langsung diubah ke ${parsed.data.status}.`
          : code === "STATUS_CONCURRENTLY_UPDATED"
            ? "Status AWB berubah bersamaan. Scan ulang."
            : "Status tidak bisa diubah. Coba lagi atau ubah lewat detail AWB.",
    };
  }
  return {
    ok: true,
    awbNo: label,
    transactionId: awb.id,
    message: `${awb.status} → ${parsed.data.status}`,
  };
}
