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
  jakartaMonthStartUtc,
} from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";
import { ModulError } from "./common";

/**
 * Cod List / Kas Terima / Report COD following the sandbox (OBSERVED
 * newapps 2026-11-24). A COD AWB (Nilai COD > 0) is collected by the
 * destination branch on delivery: Cod List shows delivered COD AWBs whose
 * cash is not handed in yet, Kas Terima those already received. Receiving
 * records who, when and a payment note; no journal is posted (D-40).
 */
const scope = (actor: AccessActor): Prisma.TransactionWhereInput =>
  isAdministrator(actor)
    ? {}
    : { destinationBranchId: { in: actor.branchIds } };

const codWhere = (actor: AccessActor): Prisma.TransactionWhereInput => ({
  deletedAt: null,
  codValue: { gt: 0 },
  ...scope(actor),
});

const listInput = z.object({
  tab: z.enum(["list", "received"]).catch("list"),
  search: z.string().trim().max(60).catch(""),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
});

const select = {
  id: true,
  awbNo: true,
  doNo: true,
  transactionDate: true,
  status: true,
  senderName: true,
  receiverName: true,
  koli: true,
  kilo: true,
  volume: true,
  codValue: true,
  codFee: true,
  biaya: true,
  codReceivedAt: true,
  codReceivedNote: true,
  destinationBranch: { select: { name: true } },
  codReceivedBy: { select: { name: true } },
} as const;

export async function listCod(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "view", "payment");
  const f = listInput.parse(raw ?? {});
  const date: Prisma.DateTimeFilter = {};
  try {
    if (f.from) date.gte = businessDateStartUtc(f.from);
    if (f.to)
      date.lt = new Date(businessDateStartUtc(f.to).getTime() + 86_400_000);
  } catch {
    throw new IdentityError("VALIDATION", 400);
  }
  const rows = await prisma.transaction.findMany({
    where: {
      ...codWhere(actor),
      ...(f.tab === "list"
        ? { codReceivedAt: null }
        : { codReceivedAt: { not: null } }),
      ...(f.search
        ? {
            OR: [
              { awbNo: { contains: f.search, mode: "insensitive" } },
              { doNo: { contains: f.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(date.gte || date.lt ? { transactionDate: date } : {}),
    },
    select,
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    take: 200,
  });
  return { filters: f, rows };
}

const receiveInput = z.object({
  transactionId: z.coerce.number().int().positive(),
  note: z.string().trim().min(2, "Isi Ket. Pembayaran.").max(255),
});

/** Terima Kas: a delivered COD AWB of the actor's branch, once. */
export async function receiveCod(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "create", "payment");
  const parsed = receiveInput.safeParse(raw);
  if (!parsed.success)
    throw new ModulError(
      parsed.error.issues[0]?.message ?? "Isian belum valid.",
    );
  const data = parsed.data;
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM transactions WHERE id = ${data.transactionId} FOR UPDATE`;
    const awb = await tx.transaction.findFirst({
      where: { id: data.transactionId, ...codWhere(actor) },
      select: { id: true, status: true, codReceivedAt: true },
    });
    if (!awb)
      throw new ModulError("AWB COD tidak ditemukan atau bukan cabang Anda.");
    if (awb.codReceivedAt)
      throw new ModulError("Kas COD AWB ini sudah diterima.");
    if (awb.status !== "Delivered")
      throw new ModulError(
        "Kas COD hanya bisa diterima untuk AWB yang sudah Delivered.",
      );
    return tx.transaction.update({
      where: { id: awb.id },
      data: {
        codReceivedAt: new Date(),
        codReceivedById: actor.id,
        codReceivedNote: data.note,
      },
      select: { id: true },
    });
  });
}

const reportInput = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

/** Report COD: COD AWBs by transaction month with delivery outcome. */
export async function codReport(actor: AccessActor, raw: unknown) {
  assertPermission(actor, "view", "payment");
  const parsed = reportInput.safeParse(raw);
  if (!parsed.success) throw new IdentityError("VALIDATION", 400);
  const { month, year } = parsed.data;
  const rows = await prisma.transaction.findMany({
    where: {
      ...codWhere(actor),
      transactionDate: {
        gte: jakartaMonthStartUtc(year, month),
        lt: jakartaMonthStartUtc(year, month + 1),
      },
    },
    select: {
      ...select,
      description: true,
      remarks: true,
      transportMode: { select: { name: true } },
      deliveryService: { select: { name: true } },
      originBranch: { select: { name: true } },
      deliveryProofs: {
        where: { deletedAt: null },
        select: { receiverName: true },
        orderBy: { id: "desc" },
        take: 1,
      },
    },
    orderBy: [{ transactionDate: "asc" }, { id: "asc" }],
    take: 5000,
  });
  return { month, year, rows };
}

export function codReportWorkbook(
  report: Awaited<ReturnType<typeof codReport>>,
) {
  const header = [
    "AWB No.",
    "Tanggal",
    "Moda",
    "Servis",
    "Asal",
    "Tujuan",
    "Pengirim",
    "Penerima Barang",
    "Koli",
    "Kilo",
    "Deskripsi",
    "Status Pengiriman",
    "Komentar",
    "Diterima Oleh",
    "Nilai COD",
    "Fee COD",
    "Kas Terima",
  ];
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Report COD"],
    [`Bulan : ${report.month}/${report.year}`],
    [],
    header,
    ...report.rows.map((r) => [
      r.awbNo,
      r.transactionDate.toISOString().slice(0, 10),
      r.transportMode?.name ?? "",
      r.deliveryService?.name ?? "",
      r.originBranch?.name ?? "",
      r.destinationBranch?.name ?? "",
      r.senderName,
      r.receiverName,
      r.koli,
      r.kilo === null ? null : Number(r.kilo),
      r.description,
      r.status,
      r.remarks,
      r.deliveryProofs[0]?.receiverName ?? "",
      r.codValue === null ? null : Number(r.codValue),
      r.codFee === null ? null : Number(r.codFee),
      r.codReceivedAt ? "Sudah" : "Belum",
    ]),
  ]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Report COD");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
