import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import {
  businessDateStartUtc,
  businessDateString,
} from "@/lib/date/business-date";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db/generated/client";
import { lockRow, ModulError, transactionScope } from "./common";

/**
 * Proses Vendor (Modul > Operasional, D-35 simplified). Provider OBSERVED
 * columns: Tanggal, AWB, AWB Vendor, Vendor, Keterangan. An AWB has at most
 * one active vendor process; the record belongs to the branch that handles
 * the AWB (origin first, otherwise destination) within the user's scope.
 */
export const vendorProcessInput = z.strictObject({
  awbNo: z.string().trim().min(1, "Isi nomor AWB").max(50),
  vendorId: z.coerce.number().int().positive("Pilih vendor"),
  vendorAwbNo: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(100).optional(),
  ),
  processDate: z.iso.date(),
  remarks: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});

export async function createVendorProcess(actor: AccessActor, input: unknown) {
  assertPermission(actor, "create", "vendor_process");
  const data = vendorProcessInput.parse(input);
  return prisma.$transaction(async (tx) => {
    const matches = await tx.transaction.findMany({
      where: {
        awbNo: { equals: data.awbNo, mode: "insensitive" },
        deletedAt: null,
        ...transactionScope(actor),
      },
      select: {
        id: true,
        awbNo: true,
        status: true,
        originBranchId: true,
        destinationBranchId: true,
      },
      take: 2,
    });
    if (matches.length > 1)
      throw new ModulError(
        "Nomor AWB ini dipakai di lebih dari satu cabang asal. Hubungi admin.",
      );
    const awb = matches[0];
    if (!awb)
      throw new ModulError("AWB tidak ditemukan dalam cakupan cabang Anda.");
    if (awb.status === "Cancelled")
      throw new ModulError(`AWB ${awb.awbNo} sudah dibatalkan.`);
    const branchId = [awb.originBranchId, awb.destinationBranchId].find(
      (id): id is number => id !== null && permitsBranch(actor, id),
    );
    if (!branchId)
      throw new ModulError("AWB ini bukan dari atau menuju cabang Anda.");
    await lockRow(tx, "transactions", awb.id);
    const active = await tx.vendorProcess.findFirst({
      where: { transactionId: awb.id, deletedAt: null },
      select: { vendor: { select: { name: true } } },
    });
    if (active)
      throw new ModulError(
        `AWB ${awb.awbNo} sudah diproses ke vendor ${active.vendor.name}. Hapus dulu bila salah.`,
      );
    const vendor = await tx.vendor.findFirst({
      where: { id: data.vendorId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    if (!vendor) throw new ModulError("Vendor tidak aktif atau tidak ada.");
    return tx.vendorProcess.create({
      data: {
        transactionId: awb.id,
        vendorId: vendor.id,
        branchId,
        vendorAwbNo: data.vendorAwbNo ?? null,
        processDate: businessDateStartUtc(data.processDate),
        remarks: data.remarks ?? null,
        createdById: actor.id,
      },
      select: { id: true },
    });
  });
}

export async function deleteVendorProcess(actor: AccessActor, input: unknown) {
  assertPermission(actor, "delete", "vendor_process");
  const { id } = z
    .strictObject({ id: z.coerce.number().int().positive() })
    .parse(input);
  const row = await prisma.vendorProcess.findFirst({
    where: { id, deletedAt: null },
    select: { branchId: true },
  });
  if (!row) throw new ModulError("Data proses vendor tidak ditemukan.");
  if (!permitsBranch(actor, row.branchId))
    throw new ModulError("Data ini milik cabang lain.");
  const done = await prisma.vendorProcess.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (done.count !== 1)
    throw new ModulError("Data sudah berubah. Muat ulang halaman.");
  return { id };
}

const filters = z.object({
  search: z.string().trim().max(100).optional().catch(undefined),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

const PAGE_SIZE = 25;

export async function listVendorProcesses(
  actor: AccessActor,
  raw: Record<string, unknown>,
) {
  assertPermission(actor, "view", "vendor_process");
  const f = filters.parse(raw);
  const today = businessDateString();
  const from = f.from ?? `${today.slice(0, 8)}01`;
  const to = f.to ?? today;
  const end = businessDateStartUtc(to);
  end.setUTCDate(end.getUTCDate() + 1);
  const where: Prisma.VendorProcessWhereInput = {
    deletedAt: null,
    processDate: { gte: businessDateStartUtc(from), lt: end },
    ...(isAdministrator(actor) ? {} : { branchId: { in: actor.branchIds } }),
    ...(f.search
      ? {
          OR: [
            {
              transaction: {
                awbNo: { equals: f.search, mode: "insensitive" },
              },
            },
            { vendorAwbNo: { contains: f.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.vendorProcess.count({ where }),
    prisma.vendorProcess.findMany({
      where,
      orderBy: [{ processDate: "desc" }, { id: "desc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        processDate: true,
        vendorAwbNo: true,
        remarks: true,
        branchId: true,
        transactionId: true,
        transaction: {
          select: {
            awbNo: true,
            receiverName: true,
            destinationBranch: { select: { name: true } },
          },
        },
        vendor: { select: { name: true } },
        branch: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    }),
  ]);
  return {
    filters: { ...f, from, to },
    total,
    pageSize: PAGE_SIZE,
    rows: rows.map((row) => ({
      ...row,
      date: businessDateString(row.processDate),
    })),
  };
}

/** Active vendors for the form. */
export function vendorChoices() {
  return prisma.vendor.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 1000,
  });
}
