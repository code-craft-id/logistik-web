import "server-only";

import * as XLSX from "xlsx";
import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import {
  businessDateStartUtc,
  businessDateString,
} from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";

/**
 * On Site Agent list, Rekap Transaksi Agen and Rekap Komisi Agen (sandbox,
 * OBSERVED 2026-11-24; D-41). Rows are AWBs entered for an agent of the
 * actor's branches; commission comes from the deposit movement of the AWB.
 */
const id = z
  .union([z.literal(""), z.coerce.number().int().positive()])
  .optional()
  .transform((v) => (typeof v === "number" ? v : null));
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);
export const agentFilterInput = z.object({
  from: date,
  to: date,
  agentId: id,
  originId: id,
  destinationId: id,
  customerId: id,
  costTypeId: id,
  search: z.string().trim().max(60).catch(""),
});

export async function agentAwbs(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "view", "transaction");
  const f = agentFilterInput.parse(raw ?? {});
  const range: Prisma.DateTimeFilter = {};
  try {
    if (f.from) range.gte = businessDateStartUtc(f.from);
    if (f.to)
      range.lt = new Date(businessDateStartUtc(f.to).getTime() + 86_400_000);
  } catch {
    throw new IdentityError("VALIDATION", 400);
  }
  const rows = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      agentId: f.agentId ?? { not: null },
      ...(isAdministrator(actor)
        ? {}
        : { agent: { branchId: { in: actor.branchIds } } }),
      ...(f.originId ? { originBranchId: f.originId } : {}),
      ...(f.destinationId ? { destinationBranchId: f.destinationId } : {}),
      ...(f.customerId ? { customerId: f.customerId } : {}),
      ...(f.costTypeId ? { costTypeId: f.costTypeId } : {}),
      ...(range.gte || range.lt ? { transactionDate: range } : {}),
      ...(f.search
        ? {
            OR: [
              { awbNo: { contains: f.search, mode: "insensitive" } },
              { doNo: { contains: f.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      awbNo: true,
      doNo: true,
      transactionDate: true,
      senderName: true,
      receiverName: true,
      koli: true,
      kilo: true,
      volume: true,
      biaya: true,
      status: true,
      agent: { select: { name: true } },
      originBranch: { select: { name: true } },
      destinationBranch: { select: { name: true } },
      customer: { select: { name: true } },
      costType: { select: { name: true } },
      agentDepositMovements: {
        where: { kind: "AWB" },
        select: { commission: true },
      },
    },
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    take: 1000,
  });
  return {
    filters: f,
    rows: rows.map((r) => ({
      ...r,
      commission: r.agentDepositMovements[0]?.commission ?? null,
    })),
  };
}

export function agentReportWorkbook(
  kind: "transaksi" | "komisi",
  report: Awaited<ReturnType<typeof agentAwbs>>,
) {
  const komisi = kind === "komisi";
  const header = [
    "No.",
    "AWB No.",
    "Tanggal",
    "Agen",
    "Asal",
    "Tujuan",
    "Customer",
    "Pengirim",
    "Penerima",
    "Koli",
    "Kilo",
    "Pembayaran",
    "Grand Total",
    ...(komisi ? ["Komisi Agen"] : ["Status"]),
  ];
  const lines = report.rows.map((r, i) => [
    i + 1,
    r.awbNo,
    businessDateString(r.transactionDate),
    r.agent?.name ?? "",
    r.originBranch?.name ?? "",
    r.destinationBranch?.name ?? "",
    r.customer?.name ?? "",
    r.senderName,
    r.receiverName,
    r.koli,
    r.kilo === null ? null : Number(r.kilo),
    r.costType?.name ?? "",
    r.biaya === null ? null : Number(r.biaya),
    komisi ? Number(r.commission ?? 0) : r.status,
  ]);
  const sum = (col: number) =>
    lines.reduce((t, l) => t + (Number(l[col]) || 0), 0);
  const sheet = XLSX.utils.aoa_to_sheet([
    [komisi ? "Rekap Komisi Agen" : "Rekap Transaksi Agen"],
    [`Periode : ${report.filters.from ?? "-"} s/d ${report.filters.to ?? "-"}`],
    [],
    header,
    ...lines,
    ["", "TOTAL", ...Array(10).fill(""), sum(12), komisi ? sum(13) : ""],
  ]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    sheet,
    komisi ? "Komisi Agen" : "Transaksi Agen",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
