import { z } from "zod";
import { Prisma } from "@/lib/db/generated/client";

export const id = z.coerce.number().int().positive().max(2147483647);
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Tanggal kalender tidak valid");
export const money = z
  .string()
  .regex(/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/)
  .refine((v) => new Prisma.Decimal(v).gt(0), "Jumlah harus positif")
  .transform((v) => new Prisma.Decimal(v).toFixed(2));
export const reason = z.string().trim().min(1).max(500);
const base = { key: z.string().uuid() };
const invoice = { id, revision: id };
const items = z
  .array(z.object({ transactionId: id, amount: money }))
  .min(1)
  .max(100)
  .refine(
    (v) => new Set(v.map((x) => x.transactionId)).size === v.length,
    "AWB duplikat",
  );
const draft = {
  branchId: id,
  customerId: id,
  invoiceDate: date,
  dueDate: date,
  items,
};
export const invoiceCommand = z.discriminatedUnion("action", [
  z.object({ ...base, ...draft, action: z.literal("invoice.create") }),
  z.object({
    ...base,
    ...draft,
    ...invoice,
    action: z.literal("invoice.update"),
  }),
  z.object({ ...base, ...invoice, action: z.literal("invoice.issue") }),
  z.object({
    ...base,
    ...invoice,
    action: z.literal("invoice.void"),
    reason,
    accountingDate: date,
  }),
  z.object({
    ...base,
    action: z.literal("payment.create"),
    invoiceId: id,
    amount: money,
    receivedDate: date,
    method: z.string().trim().min(1).max(80),
    reference: z.string().trim().max(160),
    note: z.string().trim().max(500),
    cashAccountId: id,
  }),
  z.object({
    ...base,
    action: z.literal("payment.reverse"),
    id,
    reason,
    accountingDate: date,
  }),
]);
export const listInput = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  branchId: z.preprocess((v) => (v === "" ? undefined : v), id.optional()),
});
export function sum(values: (string | Prisma.Decimal)[]) {
  const total = values.reduce<Prisma.Decimal>(
    (a, b) => a.plus(b),
    new Prisma.Decimal(0),
  );
  if (total.abs().gt("9999999999999.99"))
    throw new Error("Jumlah melebihi batas");
  return total;
}
export const asDate = (v: string) => new Date(`${v}T00:00:00Z`);
export const day = (v: Date) => v.toISOString().slice(0, 10);
