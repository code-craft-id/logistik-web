"use server";

import { IdentityError } from "@/features/identity/server/access";
import { requirePermission } from "@/lib/auth/session";
import type { Transaction } from "@/lib/db/generated/client";
import { transactionLookupSchema } from "./schemas";
import { lookupTransactionByAwb } from "./server/queries";

type LookupTransactionResult = Transaction & {
  originBranch: { id: number; name: string; code: string } | null;
  destinationBranch: { id: number; name: string; code: string } | null;
};

export async function lookupTransactionAction(formData: FormData) {
  await requirePermission("view", "transaction");
  const raw = Object.fromEntries(formData.entries());
  try {
    const parsed = transactionLookupSchema.parse(raw);
    const res = await lookupTransactionByAwb(
      parsed.awbNo,
      parsed.originBranchId,
    );
    if (!res) return { found: false };
    const isArray = Array.isArray(res);
    const items = isArray ? res : [res];
    const mapItem = (r: LookupTransactionResult) => ({
      id: r.id,
      awbNo: r.awbNo,
      status: r.status,
      transactionDate:
        r.transactionDate instanceof Date
          ? r.transactionDate.toISOString().slice(0, 10)
          : String(r.transactionDate).slice(0, 10),
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
  } catch (e: unknown) {
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
    if (e instanceof Error && e.message) {
      return { found: false, error: e.message };
    }
    throw e;
  }
}
