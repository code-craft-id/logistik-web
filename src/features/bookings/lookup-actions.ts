"use server";

import { requirePermission } from "@/lib/auth/session";
import { transactionLookupSchema } from "./schemas";
import { lookupTransactionByAwb } from "./server/queries";
import { IdentityError } from "@/features/identity/server/access";

export async function lookupTransactionAction(formData: FormData) {
  await requirePermission("view", "transaction");
  const raw = Object.fromEntries(formData.entries());
  try {
    const parsed = transactionLookupSchema.parse(raw);
    const res = await lookupTransactionByAwb(parsed.awbNo, parsed.originBranchId);
    if (!res) return { found: false };
    const isArray = Array.isArray(res);
    const items = isArray ? res : [res];
    const mapItem = (r: any) => ({
      id: r.id,
      awbNo: r.awbNo,
      status: r.status,
      transactionDate: r.transactionDate instanceof Date ? r.transactionDate.toISOString().slice(0, 10) : String(r.transactionDate).slice(0, 10),
      originBranchId: r.originBranchId,
      destinationBranchId: r.destinationBranchId,
      originBranch: r.originBranch
        ? {
            id: r.originBranch.id,
            name: r.originBranch.name,
            code: r.originBranch.code,
          }
        : undefined,
      destinationBranch: r.destinationBranch
        ? {
            id: r.destinationBranch.id,
            name: r.destinationBranch.name,
            code: r.destinationBranch.code,
          }
        : undefined,
    });
    if (items.length === 1 && !isArray) {
      return { found: true, data: mapItem(items[0]) };
    }
    if (items.length === 1 && isArray) {
      return { found: true, data: mapItem(items[0]) };
    }
    if (items.length > 1) {
      return { found: true, multiple: true, data: items.map(mapItem) };
    }
    return { found: false };
  } catch (e: any) {
    if (e instanceof IdentityError) {
      if (e.status === 409) {
        return {
          found: false,
          error: e.message,
          code: "AMBIGUOUS_ORIGIN",
          needsOriginBranch: true,
        };
      }
      if (e.status === 403) {
        return { found: false, error: e.message, code: e.code || "FORBIDDEN" };
      }
      return { found: false, error: e.message, code: e.code };
    }
    if (e?.message) {
      return { found: false, error: e.message };
    }
    throw e;
  }
}
