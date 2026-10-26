import { z } from "zod";
import { identityId } from "@/features/identity/validation";

export const branchSetupQuery = z.strictObject({
  companyId: identityId.optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(""),
});

export type GatewayConfigurationState =
  | "not_configured"
  | "invalid_configuration"
  | "configured";

/** Setup inventory only. No fabricated phone, connection state, session or QR. */
export type BranchWhatsAppSetup = {
  items: { id: number; code: string; name: string; officeName: string }[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  connectionAvailable: boolean;
  canManageConnections: boolean;
  gatewayConfiguration: GatewayConfigurationState | null;
};

export const whatsappBranchId = z
  .string()
  .regex(/^[1-9]\d{0,9}$/)
  .transform(Number)
  .pipe(z.number().int().positive().max(2_147_483_647));
export const gatewaySessionSchema = z
  .strictObject({
    branchId: z.number().int().positive().max(2_147_483_647),
    status: z.enum(["disconnected", "connecting", "qr", "connected"]),
    phoneNumber: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/)
      .nullable(),
  })
  .refine(
    (value) => (value.status === "connected") === (value.phoneNumber !== null),
  );
export const gatewayQrSchema = z.strictObject({
  branchId: z.number().int().positive().max(2_147_483_647),
  qrDataUrl: z
    .string()
    .max(180_000)
    .regex(/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/),
  expiresAt: z.iso.datetime(),
});
export type WhatsAppSession = z.infer<typeof gatewaySessionSchema>;
export type WhatsAppQr = z.infer<typeof gatewayQrSchema>;
