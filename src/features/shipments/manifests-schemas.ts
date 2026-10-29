import { z } from "zod";

export const createManifestSchema = z.object({
  manifestNo: z.string().trim().min(1).max(50),
  manifestDate: z.coerce.date().optional(),
  type: z.string().trim().max(30).optional().nullable(),
  branchId: z.coerce.number().int().positive().optional().nullable(),
  vehicleId: z.coerce.number().int().positive().optional().nullable(),
  courierId: z.coerce.number().int().positive().optional().nullable(),
  originBranchId: z.coerce.number().int().positive().optional().nullable(),
  destinationBranchId: z.coerce.number().int().positive().optional().nullable(),
  transit1: z.string().trim().max(100).optional().nullable(),
  transit2: z.string().trim().max(100).optional().nullable(),
  transit3: z.string().trim().max(100).optional().nullable(),
  transit4: z.string().trim().max(100).optional().nullable(),
  transit5: z.string().trim().max(100).optional().nullable(),
});

export type CreateManifestInput = z.infer<typeof createManifestSchema>;

export const assignToManifestSchema = z.object({
  manifestId: z.coerce.number().int().positive(),
  transactionId: z.coerce.number().int().positive(),
});

export type AssignToManifestInput = z.infer<typeof assignToManifestSchema>;

export const deliveryOutcomeSchema = z.object({
  deliverySheetId: z.coerce.number().int().positive(),
  transactionId: z.coerce.number().int().positive(),
  outcome: z.enum(["DELIVERED", "FAILED_DELIVERY", "RETURNED"]).optional(),
  receivedBy: z.string().trim().max(150).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type DeliveryOutcomeInput = z.infer<typeof deliveryOutcomeSchema>;
