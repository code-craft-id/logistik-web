"use server";

import { requirePermission } from "@/lib/auth/session";
import { transactionLookupSchema } from "./schemas";
import { lookupTransactionByAwb } from "./server/queries";

export async function lookupTransactionAction(formData: FormData) {
  await requirePermission("view", "transaction");
  const raw = Object.fromEntries(formData.entries());
  const parsed = transactionLookupSchema.parse(raw);
  const res = await lookupTransactionByAwb(parsed.awbNo, parsed.originBranchId);
  if (!res) return { found: false };
  return {
    found: true,
    data: {
      id: res.id,
      awbNo: res.awbNo,
      status: res.status,
      transactionDate: res.transactionDate.toISOString().slice(0, 10),
      originBranchId: res.originBranchId,
      destinationBranchId: res.destinationBranchId,
    },
  };
}
