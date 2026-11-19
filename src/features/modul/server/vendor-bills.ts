import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";
import { dayEnd, dayStart, lockKey, lockRow, ModulError } from "./common";
import { parseAwbList } from "./pod-returns";

export const VENDOR_BILL_CATEGORIES = ["Vendor", "Agen", "Lainnya"] as const;
export const VENDOR_BILL_STATUS = {
  OPEN: "Belum lunas",
  PAID: "Lunas",
} as const;

const createSchema = z.object({
  category: z.enum(VENDOR_BILL_CATEGORIES),
  vendorId: z.coerce.number().int().positive(),
  invoiceNo: z.string().trim().max(50).optional(),
  billDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  receivedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  termDays: z.coerce.number().int().min(0).max(365).default(0),
  amount: z
    .string()
    .trim()
    .regex(/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/, "Nominal tidak valid."),
  awbs: z.string().trim().max(20000).optional(),
});

/**
 * Pembayaran Hutang: register a vendor invoice with its AWBs. AWBs are
 * limited to the actor's branches. The register does not post journals.
 */
export async function createVendorBill(actor: AccessActor, input: unknown) {
  assertPermission(actor, "create", "debt_payment");
  const data = createSchema.parse(input);
  const awbNos = parseAwbList(data.awbs ?? "");
  if (awbNos.length > 500)
    throw new ModulError("Maksimal 500 AWB per invoice.");
  return prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.count({
      where: { id: data.vendorId, deletedAt: null },
    });
    if (!vendor) throw new ModulError("Vendor tidak ditemukan.");
    const admin = isAdministrator(actor);
    const found = awbNos.length
      ? await tx.transaction.findMany({
          where: {
            awbNo: { in: awbNos },
            deletedAt: null,
            ...(admin ? {} : { originBranchId: { in: actor.branchIds } }),
          },
          select: { id: true, awbNo: true },
        })
      : [];
    // Hold the AWBs against a concurrent approved delete until commit.
    if (found.length)
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM transactions WHERE id IN (${Prisma.join(found.map((r) => r.id))}) AND deleted_at IS NULL ORDER BY id FOR SHARE`,
      );
    const seen = new Set(found.map((r) => r.awbNo));
    const missing = awbNos.filter((no) => !seen.has(no));
    if (missing.length)
      throw new ModulError(
        `AWB tidak ditemukan di cabang Anda: ${missing.slice(0, 10).join(", ")}.`,
      );
    if (found.length !== awbNos.length)
      throw new ModulError(
        "Ada nomor AWB yang dipakai lebih dari satu cabang. Isi dari cabang asal masing-masing.",
      );
    const date = new Date(`${data.billDate}T00:00:00.000Z`);
    let invoiceNo = data.invoiceNo;
    // Serialize numbering and the duplicate check per vendor.
    await lockKey(tx, `vendor-bill:${data.vendorId}`);
    if (!invoiceNo) {
      await lockKey(tx, `vendor-bill-no:${data.billDate}`);
      const count = await tx.vendorBill.count({
        where: { billDate: { gte: date, lt: dayEnd(data.billDate) } },
      });
      invoiceNo = `HUT-${data.billDate.replaceAll("-", "")}-${String(count + 1).padStart(4, "0")}`;
    }
    const duplicate = await tx.vendorBill.count({
      where: { vendorId: data.vendorId, invoiceNo },
    });
    if (duplicate)
      throw new ModulError(
        "Nomor invoice ini sudah tercatat untuk vendor tersebut.",
      );
    return tx.vendorBill.create({
      data: {
        category: data.category,
        vendorId: data.vendorId,
        invoiceNo,
        billDate: date,
        receivedDate: data.receivedDate
          ? new Date(`${data.receivedDate}T00:00:00.000Z`)
          : null,
        termDays: data.termDays,
        amount: data.amount,
        createdById: actor.id,
        items: { create: found.map((row) => ({ transactionId: row.id })) },
      },
      select: { id: true },
    });
  });
}

/** Mark an open vendor invoice as paid (Tanggal Tutup). */
export async function closeVendorBill(actor: AccessActor, id: number) {
  assertPermission(actor, "close", "debt_payment");
  return prisma.$transaction(async (tx) => {
    await lockRow(tx, "vendor_bills", id);
    const bill = await tx.vendorBill.findFirst({
      where: { id, deletedAt: null, ...visible(actor) },
      select: { status: true },
    });
    if (!bill) throw new ModulError("Invoice hutang tidak ditemukan.");
    if (bill.status !== "OPEN")
      throw new ModulError("Invoice ini sudah lunas.");
    return tx.vendorBill.update({
      where: { id },
      data: { status: "PAID", closedAt: new Date(), closedById: actor.id },
      select: { id: true },
    });
  });
}

/** Non-admins see bills they created or that hold AWBs of their branches. */
function visible(actor: AccessActor) {
  if (isAdministrator(actor)) return {};
  return {
    OR: [
      { createdById: actor.id },
      {
        items: {
          some: { transaction: { originBranchId: { in: actor.branchIds } } },
        },
      },
    ],
  };
}

export async function listVendorBills(
  actor: AccessActor,
  params: { status?: string; search?: string; from?: string; to?: string } = {},
) {
  assertPermission(actor, "view", "debt_payment");
  const status =
    params.status && params.status in VENDOR_BILL_STATUS
      ? params.status
      : undefined;
  const search = params.search?.trim().slice(0, 50);
  const from = dayStart(params.from);
  const to = dayEnd(params.to);
  const rows = await prisma.vendorBill.findMany({
    where: {
      deletedAt: null,
      ...visible(actor),
      ...(status ? { status } : {}),
      ...(search
        ? { invoiceNo: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(from || to
        ? {
            billDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lt: to } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ billDate: "desc" }, { id: "desc" }],
    take: 200,
    select: {
      id: true,
      category: true,
      invoiceNo: true,
      billDate: true,
      receivedDate: true,
      termDays: true,
      amount: true,
      status: true,
      closedAt: true,
      vendor: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });
  return rows.map((row) => {
    const base = row.receivedDate ?? row.billDate;
    const reminder = new Date(base);
    reminder.setUTCDate(reminder.getUTCDate() + row.termDays);
    return { ...row, amount: row.amount.toString(), reminderDate: reminder };
  });
}
