import { z } from "zod";

const decimalString = (maxInt: number, scale: number) => {
  const max = 10 ** maxInt - 10 ** -scale;
  const regex = new RegExp(`^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,${scale}})?$`);
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

const emptyToUndefined = (v: unknown) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
};

const optionalPositiveInt = z.preprocess((v) => {
  const e = emptyToUndefined(v);
  if (e === undefined || e === null) return undefined;
  if (typeof e === "string") {
    const t = e.trim();
    if (t === "") return undefined;
  }
  return e;
}, z.coerce.number().int().positive().optional());

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
    branchId: optionalPositiveInt,
    customerId: optionalPositiveInt,
    senderName: z.string().trim().max(150).optional().nullable(),
    receiverName: z.string().trim().max(150).optional().nullable(),
    doNo: z.string().trim().max(255).optional().nullable(),
    destination: z.string().trim().max(150).optional().nullable(),
    koli: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).optional(),
    ),
    kilo: decimalField(8, 2),
    volume: decimalField(7, 3),
    biaya: decimalField(13, 2),
    /** Generate the booking number when none is typed (like the AWB). */
    autoBookingNo: z.preprocess(
      (v) => v === true || v === "on" || v === "true",
      z.boolean().optional(),
    ),
    status: z.never().optional(),
  })
  .strict();

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

const normalizeAwbSchema = (v: unknown) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    return t;
  }
  return v;
};

export const createTransactionSchema = z
  .object({
    idempotencyKey: z.preprocess(
      emptyToUndefined,
      z.string().min(8).max(64).optional(),
    ),
    bookingId: optionalPositiveInt,
    awbNo: z.preprocess(
      normalizeAwbSchema,
      z.string().min(1).max(50).nullable().optional(),
    ),
    transactionDate: z.coerce.date().optional(),
    doNo: z.string().trim().max(255).optional().nullable(),
    senderName: z.string().trim().max(150).optional().nullable(),
    receiverName: z.string().trim().max(150).optional().nullable(),
    originBranchId: z.preprocess((v) => {
      const e = emptyToUndefined(v);
      if (e === undefined || e === null) return e;
      if (typeof e === "string") {
        const t = e.trim();
        if (t === "") return undefined;
      }
      return e;
    }, z.coerce.number().int().positive()),
    destinationBranchId: optionalPositiveInt,
    koli: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).optional(),
    ),
    kilo: decimalField(8, 2),
    volume: decimalField(7, 3),
    biaya: decimalField(13, 2),
    courierId: optionalPositiveInt,
    customerId: optionalPositiveInt,
    transportModeId: optionalPositiveInt,
    deliveryServiceId: optionalPositiveInt,
    goodsTypeId: optionalPositiveInt,
    costTypeId: optionalPositiveInt,
    description: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(500).optional().nullable(),
    ),
    remarks: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(500).optional().nullable(),
    ),
    pickupCourierId: optionalPositiveInt,
    marketingPersonId: optionalPositiveInt,
    consigneeId: optionalPositiveInt,
    senderAddress: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(500).optional().nullable(),
    ),
    senderPhone: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(30).optional().nullable(),
    ),
    receiverAddress: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(500).optional().nullable(),
    ),
    receiverPhone: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(30).optional().nullable(),
    ),
    pricingType: z.preprocess(
      emptyToUndefined,
      z.enum(["KG", "KOLI", "TRUCKING"]).optional(),
    ),
    pricePerKg: decimalField(13, 2),
    minWeight: decimalField(8, 2),
    insured: z.preprocess(
      (v) =>
        v === "Y" || v === true
          ? true
          : v === "N" || v === false
            ? false
            : undefined,
      z.boolean().optional(),
    ),
    otherFee: decimalField(13, 2),
    packingFee: decimalField(13, 2),
    pickupFee: decimalField(13, 2),
    discountPercent: decimalField(3, 2).refine(
      (v) => v == null || Number(v) <= 100,
      "Discount maksimal 100%",
    ),
    ppnPercent: decimalField(3, 2).refine(
      (v) => v == null || Number(v) <= 100,
      "PPN maksimal 100%",
    ),
    /** Generate the AWB number when none is typed (legacy "Manual AWB" off). */
    autoAwb: z.preprocess(
      (v) => v === true || v === "on" || v === "true",
      z.boolean().optional(),
    ),
    status: z.never().optional(),
  })
  .strict();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

const normalizeAwbLookupSchema = (v: unknown) => {
  if (v === null || v === undefined) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return undefined;
    return t;
  }
  return v;
};

export const transactionLookupSchema = z.object({
  awbNo: z.preprocess(normalizeAwbLookupSchema, z.string().min(1).max(50)),
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
