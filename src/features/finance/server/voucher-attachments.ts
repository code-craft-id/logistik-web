import "server-only";

import {
  type AccessActor,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { destroyImage, uploadWebp } from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import { CASH_VOUCHERS } from "../accounting-contracts";

/** Kasir Lampiran: up to 5 receipt / note images per voucher. */
export const MAX_ATTACHMENTS = 5;

async function voucher(actor: AccessActor, journalId: number) {
  assertPermission(actor, "create", "journal");
  if (!Number.isSafeInteger(journalId) || journalId <= 0)
    throw new IdentityError("NOT_FOUND", 404);
  const journal = await prisma.finJournal.findFirst({
    where: { id: journalId, sourceType: { in: Object.keys(CASH_VOUCHERS) } },
    select: { id: true, branchId: true },
  });
  if (!journal) throw new IdentityError("NOT_FOUND", 404);
  if (!permitsBranch(actor, journal.branchId))
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  return journal;
}

export async function addVoucherAttachment(
  actor: AccessActor,
  journalId: number,
  file: File,
) {
  await voucher(actor, journalId);
  const count = await prisma.finJournalAttachment.count({
    where: { journalId, deletedAt: null },
  });
  if (count >= MAX_ATTACHMENTS)
    throw new IdentityError(
      "CONFLICT",
      409,
      `Maksimal ${MAX_ATTACHMENTS} lampiran per bukti.`,
    );
  const uploaded = await uploadWebp(file, "lms/kasir");
  try {
    return await prisma.finJournalAttachment.create({
      data: {
        journalId,
        url: uploaded.url,
        publicId: uploaded.publicId,
        fileName: (file.name || "lampiran").slice(0, 200),
        createdById: actor.id,
      },
      select: { id: true },
    });
  } catch (error) {
    await destroyImage(uploaded.publicId);
    throw error;
  }
}

export async function removeVoucherAttachment(
  actor: AccessActor,
  attachmentId: number,
) {
  if (!Number.isSafeInteger(attachmentId) || attachmentId <= 0)
    throw new IdentityError("NOT_FOUND", 404);
  const row = await prisma.finJournalAttachment.findFirst({
    where: { id: attachmentId, deletedAt: null },
    select: { journalId: true },
  });
  if (!row) throw new IdentityError("NOT_FOUND", 404);
  await voucher(actor, row.journalId);
  await prisma.finJournalAttachment.update({
    where: { id: attachmentId },
    data: { deletedAt: new Date() },
  });
}
