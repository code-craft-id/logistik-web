"use server";

import { currentIdentity } from "@/features/identity/server/context";
import {
  type PendingApprovals,
  pendingApprovals,
} from "./server/notifications";

/** Pending approval counts for the header bell; empty when signed out. */
export async function pendingApprovalsAction(): Promise<PendingApprovals> {
  const current = await currentIdentity();
  if (!current) return { awbChanges: 0, podReturns: 0 };
  try {
    return await pendingApprovals(current.actor);
  } catch {
    return { awbChanges: 0, podReturns: 0 };
  }
}
