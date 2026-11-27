import "server-only";

import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import { Prisma } from "@/lib/db/generated/client";

/** A business-rule refusal whose message is safe to show to the user. */
export class ModulError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModulError";
  }
}

/** AWB visible to the actor: origin or destination branch in scope. */
export function transactionScope(
  actor: AccessActor,
): Prisma.TransactionWhereInput {
  if (isAdministrator(actor)) return {};
  return {
    OR: [
      { originBranchId: { in: actor.branchIds } },
      { destinationBranchId: { in: actor.branchIds } },
    ],
  };
}

/** Same scope as raw SQL for alias `t`. */
export function transactionScopeSql(actor: AccessActor) {
  if (isAdministrator(actor)) return Prisma.sql`TRUE`;
  if (!actor.branchIds.length) return Prisma.sql`FALSE`;
  const ids = Prisma.join(actor.branchIds);
  return Prisma.sql`(t.origin_branch_id IN (${ids}) OR t.destination_branch_id IN (${ids}))`;
}

export function inScope(actor: AccessActor, ...branchIds: (number | null)[]) {
  return (
    isAdministrator(actor) ||
    branchIds.some((id) => id !== null && actor.branchIds.includes(id))
  );
}

/** Parse a YYYY-MM-DD date filter; invalid input means "no filter". */
export function dayStart(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
export function dayEnd(value?: string) {
  const start = dayStart(value);
  if (!start) return undefined;
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/** Lock a row for the rest of the database transaction. */
export async function lockRow(
  tx: Prisma.TransactionClient,
  table:
    | "transactions"
    | "awb_change_requests"
    | "pod_returns"
    | "vendor_bills",
  id: number,
) {
  await tx.$queryRawUnsafe(
    `SELECT id FROM "${table}" WHERE id = $1 FOR UPDATE`,
    id,
  );
}

/**
 * Serialize one kind of work (e.g. numbering a day's documents or saving a
 * tariff route) across concurrent users until the transaction ends.
 */
export async function lockKey(tx: Prisma.TransactionClient, key: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}
