import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { prisma } from "@/lib/db";

export const createDeliverySheetInput = z.strictObject({
  manifestId: z.coerce.number().int().positive(),
  sheetNo: z.string().trim().min(1).max(50),
  deliveryDate: z.iso.date(),
});

/**
 * One delivery sheet (DRS) per manifest (delivery_sheets.manifest_id is
 * unique). Outcomes are recorded through the existing Dev 2 service.
 */
export async function createDeliverySheet(actor: AccessActor, input: unknown) {
  assertPermission(actor, "create", "delivery");
  const data = createDeliverySheetInput.parse(input);
  return prisma.$transaction(async (tx) => {
    const manifest = await tx.manifest.findFirst({
      where: { id: data.manifestId, deletedAt: null },
      select: { id: true, branchId: true, status: true },
    });
    if (
      !manifest?.branchId ||
      (!isAdministrator(actor) && !permitsBranch(actor, manifest.branchId))
    )
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    if (manifest.status === "Closed")
      throw new IdentityError("CONFLICT", 409, "Manifest sudah ditutup.");
    return tx.deliverySheet.create({
      data: {
        manifestId: manifest.id,
        sheetNo: data.sheetNo,
        deliveryDate: new Date(`${data.deliveryDate}T00:00:00.000Z`),
        // deliveredBy means the delivering user, not the creator; the courier
        // is the manifest's courier, so it stays unset here.
      },
    });
  });
}
