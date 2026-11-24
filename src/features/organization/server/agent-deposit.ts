import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { ModulError } from "@/features/modul/server/common";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";

/**
 * Agent deposit and commission (D-41, owner decision 2026-11-24):
 * - an AWB for an agent charges Grand Total minus commission, where
 *   commission = commissionRate % x Grand Total (rounded to whole rupiah);
 *   the AWB is refused when the deposit is too low;
 * - voiding that AWB refunds exactly what was charged;
 * - Debit Saldo (top up) adds to the deposit.
 * Every change is one AgentDepositMovement row (History Deposit Agent).
 */
type Tx = Prisma.TransactionClient;
const D = Prisma.Decimal;

async function lockAgent(tx: Tx, agentId: number) {
  const [row] = await tx.$queryRaw<
    {
      id: number;
      branch_id: number;
      balance: string;
      commission_rate: string;
      status: string;
    }[]
  >`SELECT id, branch_id, balance::text, commission_rate::text, status::text
    FROM agents WHERE id = ${agentId} AND deleted_at IS NULL FOR UPDATE`;
  return row ?? null;
}

/** Commission in whole rupiah: rate % x Grand Total, half up. */
export function agentCommission(
  grandTotal: Prisma.Decimal,
  ratePercent: Prisma.Decimal,
) {
  return grandTotal
    .mul(ratePercent)
    .div(100)
    .toDecimalPlaces(0, D.ROUND_HALF_UP);
}

/** Inside the AWB create transaction: charge the agent's deposit. */
export async function chargeAgentForAwb(
  tx: Tx,
  actor: AccessActor,
  awb: {
    id: number;
    agentId: number | null;
    biaya: Prisma.Decimal | null;
    awbNo: string | null;
  },
) {
  if (!awb.agentId) return;
  const agent = await lockAgent(tx, awb.agentId);
  if (!agent || agent.status !== "ACTIVE")
    throw new ModulError("Agen tidak ditemukan atau tidak aktif.");
  if (!permitsBranch(actor, agent.branch_id))
    throw new ModulError("Agen bukan dari cabang Anda.");
  const total = awb.biaya ?? new D(0);
  const commission = agentCommission(total, new D(agent.commission_rate));
  const charge = total.sub(commission);
  const before = new D(agent.balance);
  if (before.lt(charge))
    throw new ModulError(
      `Saldo deposit agen tidak cukup (saldo Rp ${before.toFixed(0)}, dibutuhkan Rp ${charge.toFixed(0)}). Minta admin melakukan Debit Saldo.`,
    );
  const after = before.sub(charge);
  await tx.agent.update({ where: { id: agent.id }, data: { balance: after } });
  await tx.agentDepositMovement.create({
    data: {
      agentId: agent.id,
      kind: "AWB",
      transactionId: awb.id,
      balanceBefore: before,
      amount: total.neg(),
      commission,
      balanceAfter: after,
      note: `AWB ${awb.awbNo ?? awb.id}`,
      createdById: actor.id,
    },
  });
}

/** Inside the void transaction: refund what the AWB charged, once. */
export async function refundAgentForAwb(
  tx: Tx,
  actor: AccessActor,
  transactionId: number,
) {
  const charged = await tx.agentDepositMovement.findUnique({
    where: { transactionId_kind: { transactionId, kind: "AWB" } },
  });
  if (!charged) return;
  const agent = await lockAgent(tx, charged.agentId);
  if (!agent) return;
  const refund = charged.amount.neg().sub(charged.commission);
  const before = new D(agent.balance);
  const after = before.add(refund);
  await tx.agent.update({ where: { id: agent.id }, data: { balance: after } });
  await tx.agentDepositMovement.create({
    data: {
      agentId: agent.id,
      kind: "VOID",
      transactionId,
      balanceBefore: before,
      amount: charged.amount.neg(),
      commission: charged.commission.neg(),
      balanceAfter: after,
      note: `Void ${charged.note ?? ""}`.trim(),
      createdById: actor.id,
    },
  });
}

const topUpInput = z.object({
  agentId: z.coerce.number().int().positive(),
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,15}(\.\d{1,2})?$/, "Jumlah harus angka positif.")
    .refine((v) => Number(v) > 0, "Jumlah harus lebih dari 0."),
  note: z.string().trim().max(255).optional().default(""),
});

/** Debit Saldo: add deposit to an agent of the actor's branch. */
export async function topUpAgent(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "update", "agent");
  const parsed = topUpInput.safeParse(raw);
  if (!parsed.success)
    throw new ModulError(
      parsed.error.issues[0]?.message ?? "Isian belum valid.",
    );
  const data = parsed.data;
  return prisma.$transaction(async (tx) => {
    const agent = await lockAgent(tx, data.agentId);
    if (!agent || !permitsBranch(actor, agent.branch_id))
      throw new ModulError("Agen tidak ditemukan atau bukan cabang Anda.");
    const before = new D(agent.balance);
    const amount = new D(data.amount);
    const after = before.add(amount);
    await tx.agent.update({
      where: { id: agent.id },
      data: { balance: after },
    });
    return tx.agentDepositMovement.create({
      data: {
        agentId: agent.id,
        kind: "TOPUP",
        balanceBefore: before,
        amount,
        balanceAfter: after,
        note: data.note || "Debit Saldo",
        createdById: actor.id,
      },
      select: { id: true },
    });
  });
}

const agentScope = (actor: AccessActor): Prisma.AgentWhereInput =>
  isAdministrator(actor) ? {} : { branchId: { in: actor.branchIds } };

export async function agentChoices(actor: AccessActor) {
  return prisma.agent.findMany({
    where: { deletedAt: null, ...agentScope(actor) },
    select: {
      id: true,
      name: true,
      code: true,
      balance: true,
      commissionRate: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function depositHistory(
  actor: AccessActor,
  agentId: number | null,
) {
  assertPermission(actor, "view", "agent");
  const agents = await agentChoices(actor);
  const agent = agents.find((a) => a.id === agentId) ?? null;
  const rows = agent
    ? await prisma.agentDepositMovement.findMany({
        where: { agentId: agent.id },
        select: {
          id: true,
          kind: true,
          balanceBefore: true,
          amount: true,
          commission: true,
          balanceAfter: true,
          note: true,
          createdAt: true,
          createdBy: { select: { name: true } },
        },
        orderBy: { id: "desc" },
        take: 500,
      })
    : [];
  return { agents, agent, rows };
}
