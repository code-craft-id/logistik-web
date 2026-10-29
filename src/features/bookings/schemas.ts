import { z } from "zod";

export const createBookingSchema = z.object({
  bookingNo: z.string().trim().max(50).optional().nullable(),
  bookingDate: z.coerce.date().optional(),
  branchId: z.coerce.number().int().positive().optional().nullable(),
  customerId: z.coerce.number().int().positive().optional().nullable(),
  senderName: z.string().trim().max(150).optional().nullable(),
  receiverName: z.string().trim().max(150).optional().nullable(),
  doNo: z.string().trim().max(50).optional().nullable(),
  destination: z.string().trim().max(150).optional().nullable(),
  koli: z.coerce.number().int().min(0).optional(),
  kilo: z.coerce.number().nonnegative().optional(),
  volume: z.coerce.number().nonnegative().optional(),
  biaya: z.coerce.number().nonnegative().optional(),
  status: z.string().trim().max(30).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const createTransactionSchema = z.object({
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
  kilo: z.coerce.number().nonnegative().optional(),
  volume: z.coerce.number().nonnegative().optional(),
  biaya: z.coerce.number().nonnegative().optional(),
  courierId: z.coerce.number().int().positive().optional().nullable(),
  status: z.string().trim().max(30).optional(),
});

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
