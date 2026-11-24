import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { businessDateStartUtc } from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import { type DailyRecapLine, groupDailyRecap } from "../daily-recap-groups";

/**
 * Rekap Transaksi Harian as printed by the provider (OBSERVED real web
 * 2026-11-24, `print_rekap_omset.php?Date=&Cabang=`): one origin branch and
 * one Asia/Jakarta day, PENDAPATAN rows per Kategori (Layanan) and Kiriman
 * Via (Moda) with CS (AWB creator).
 *
 * Money columns follow the provider payment types by name (Master Tipe
 * Pembayaran: CASH, KREDIT, COD, TRF, FOC): Tunai-Onhand = CASH,
 * Tunai-Transfer = TRF, Kredit = KREDIT, Tagih Tujuan = COD; amount is the
 * AWB Grand Total (`biaya`). The observed sample had zero amounts, so this
 * mapping is OBSERVED by name and pending finance confirmation. Voided AWBs
 * are excluded.
 */
export const dailyRecapInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  branchId: z.coerce.number().int().positive(),
});

export async function dailyTransactionRecap(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "view", "transaction_report");
  const parsed = dailyRecapInput.safeParse(raw);
  if (!parsed.success) throw new IdentityError("VALIDATION", 400);
  const { date, branchId } = parsed.data;
  let from: Date;
  try {
    from = businessDateStartUtc(date);
  } catch {
    throw new IdentityError("VALIDATION", 400);
  }
  if (!permitsBranch(actor, branchId))
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, deletedAt: null },
    select: { name: true },
  });
  if (!branch) throw new IdentityError("VALIDATION", 400);

  const rows = await prisma.$queryRaw<
    {
      category: string | null;
      mode: string | null;
      cs: string | null;
      awb: number;
      onhand: string;
      transfer: string;
      kredit: string;
      tagih: string;
    }[]
  >`
    SELECT s.name AS category, m.name AS mode, u.name AS cs,
           count(*)::int AS awb,
           COALESCE(sum(t.biaya) FILTER (WHERE upper(trim(c.name)) = 'CASH'), 0)::text AS onhand,
           COALESCE(sum(t.biaya) FILTER (WHERE upper(trim(c.name)) = 'TRF'), 0)::text AS transfer,
           COALESCE(sum(t.biaya) FILTER (WHERE upper(trim(c.name)) = 'KREDIT'), 0)::text AS kredit,
           COALESCE(sum(t.biaya) FILTER (WHERE upper(trim(c.name)) = 'COD'), 0)::text AS tagih
    FROM transactions t
    LEFT JOIN delivery_services s ON s.id = t.delivery_service_id
    LEFT JOIN transport_modes m ON m.id = t.transport_mode_id
    LEFT JOIN auth_users u ON u.id = t.created_by_id
    LEFT JOIN cost_types c ON c.id = t.cost_type_id
    WHERE t.origin_branch_id = ${branchId}
      AND t.deleted_at IS NULL
      AND t.transaction_date >= ${from}
      AND t.transaction_date < ${new Date(from.getTime() + 86_400_000)}
    GROUP BY 1, 2, 3
    ORDER BY 1, 2, 3`;
  const lines: DailyRecapLine[] = rows.map((r) => ({
    category: r.category ?? "-",
    mode: r.mode ?? "-",
    cs: r.cs ?? "-",
    awb: r.awb,
    onhand: Number(r.onhand),
    transfer: Number(r.transfer),
    kredit: Number(r.kredit),
    tagih: Number(r.tagih),
  }));
  return { branch: branch.name, date, ...groupDailyRecap(lines) };
}
