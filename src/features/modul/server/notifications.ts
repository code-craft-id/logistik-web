import "server-only";

import {
  type AccessActor,
  isAdministrator,
  permits,
} from "@/features/identity/permissions";
import { prisma } from "@/lib/db";
import { transactionScope } from "./common";

export type PendingApprovals = {
  awbChanges: number;
  podReturns: number;
};

/**
 * Items waiting for this user's decision: AWB edit/delete requests in their
 * branches (not their own) and POD Kembali headed to their branches. Two
 * indexed counts; zero when the user lacks the approve right.
 */
export async function pendingApprovals(
  actor: AccessActor,
): Promise<PendingApprovals> {
  const admin = isAdministrator(actor);
  const [awbChanges, podReturns] = await Promise.all([
    permits(actor, "approve", "awb_change")
      ? prisma.awbChangeRequest.count({
          where: {
            status: "PENDING",
            ...(admin ? {} : { requestedById: { not: actor.id } }),
            transaction: transactionScope(actor),
          },
        })
      : 0,
    permits(actor, "approve", "pod_return")
      ? prisma.podReturn.count({
          where: {
            status: "PENDING",
            deletedAt: null,
            ...(admin ? {} : { destinationBranchId: { in: actor.branchIds } }),
          },
        })
      : 0,
  ]);
  return { awbChanges, podReturns };
}
