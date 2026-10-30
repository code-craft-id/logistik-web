import { z } from "zod";

const decimalString = (maxInt: number, scale: number) => {
  const max = 10 ** maxInt - 10 ** (-scale);
  const regex = new RegExp(
    `^-?(?:0|[1-9][0-9]*)(?:\.[0-9]{1,${scale}})?$`,
  );
  return z
    .string()
    .trim()
    .regex(regex, "Invalid decimal format")
    .refine((v) => {
      const num = Number(v);
      if (!Number.isFinite(num)) return false;
      if (num < 0) return false;
      if (Math.abs(num) > max) return false;
      return true;
    }, "Value out of range")
    .transform((v) => v);
};

const decimalField = (maxInt: number, scale: number) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => {
      if (v === null) return null;
      if (v === undefined || v === "") return undefined;
      if (typeof v === "number") {
        if (!Number.isFinite(v) || v < 0) return undefined;
        return v.toFixed(scale);
      }
      if (typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed === "") return undefined;
        return trimmed;
      }
      return undefined;
    })
    .pipe(decimalString(maxInt, scale).nullable().optional());

export const createBookingSchema = z
  .object({
    bookingNo: z.string().trim().max(50).optional().nullable(),
    bookingDate: z.coerce.date().optional(),
    branchId: z.coerce.number().int().positive().optional().nullable(),
    customerId: z.coerce.number().int().positive().optional().nullable(),
    senderName: z.string().trim().max(150).optional().nullable(),
    receiverName: z.string().trim().max(150).optional().nullable(),
    doNo: z.string().trim().max(50).optional().nullable(),
    destination: z.string().trim().max(150).optional().nullable(),
    koli: z.coerce.number().int().min(0).optional(),
    kilo: decimalField(8, 2),
    volume: decimalField(7, 3),
    biaya: decimalField(13, 2),
    status: z.never().optional(),
  })
  .strip();

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const createTransactionSchema = z
  .object({
    idempotencyKey: z.string().min(8).max(64).optional(),
    bookingId: z.coerce.number().int().positive().optional().nullable(),
    awbNo: z.string().trim().max(50).optional().nullable(),
    transactionDate: z.coerce.date().optional(),
    doNo: z.string().trim().max(50).optional().nullable(),
    senderName: z.string().trim().max(150).optional().nullable(),
    receiverName: z.string().trim().max(150).optional().nullable(),
    originBranchId: z.coerce.number().int().positive(),
    destinationBranchId: z.coerce.number().int().positive().optional().nullable(),
    koli: z.coerce.number().int().min(0).optional(),
    kilo: decimalField(8, 2),
    volume: decimalField(7, 3),
    biaya: decimalField(13, 2),
    courierId: z.coerce.number().int().positive().optional().nullable(),
    status: z.never().optional(),
  })
  .strip();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const transactionLookupSchema = z.object({
  awbNo: z.string().trim().min(1).max(50),
  originBranchId: z.coerce.number().int().positive().optional(),
});

export type TransactionLookupInput = z.infer<typeof transactionLookupSchema>;

export const updateTransactionStatusSchema = z.object({
  transactionId: z.coerce.number().int().positive(),
  newStatus: z.string().trim().min(1).max(30),
  reason: z.string().trim().max(500).optional().nullable(),
});

export type UpdateTransactionStatusInput = z.infer<
  typeof updateTransactionStatusSchema
>;
