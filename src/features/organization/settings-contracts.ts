import { z } from "zod";
import type { ReferenceDefinition } from "@/components/patterns/reference-workspace";
import { identityId } from "@/features/identity/validation";
export const configurationKind = z.enum([
  "company_invoice",
  "company_bank",
  "company_wallet",
  "whatsapp_configuration",
  "vendor_tax",
]);
export type ConfigurationKind = z.infer<typeof configurationKind>;
export const companyInvoiceSettingsInput = z.strictObject({
  companyId: identityId,
  invoiceFormat: z.string().trim().max(4000),
  signatoryName: z.string().trim().max(4000),
  signatoryPosition: z.string().trim().max(4000),
  invoiceMessage: z.string().trim().max(4000),
});
export const companyBankInput = z.strictObject({
  companyId: identityId,
  description: z.string().trim().min(1).max(4000),
});
export const companyDigitalWalletInput = z.strictObject({
  companyId: identityId,
  provider: z.string().trim().max(4000),
  accountName: z.string().trim().max(4000),
  accountNumber: z.string().trim().max(4000),
  verificationEmail: z.union([z.email().max(254), z.literal("")]),
});
export const customerWhatsAppNotificationInput = z.strictObject({
  companyId: identityId,
  customerId: identityId.nullable(),
  isEnabled: z.boolean(),
});
export const vendorTaxProfileInput = z.strictObject({
  vendorId: identityId,
  taxNumber: z.string().trim().max(4000),
  registeredName: z.string().trim().max(4000),
  address1: z.string().trim().max(4000),
  address2: z.string().trim().max(4000),
  city: z.string().trim().max(4000),
  postalCode: z.string().trim().max(4000),
});
export const configurationForms: Record<
  ConfigurationKind,
  ReferenceDefinition
> = {
  company_invoice: {
    label: "Tanda Tangan Invoice",
    status: false,
    fields: [
      {
        key: "companyId",
        label: "Perusahaan",
        type: "choice",
        choice: "company",
        required: true,
      },
      {
        key: "invoiceFormat",
        label: "Format Invoice",
        type: "text",
        maxLength: 4000,
      },
      {
        key: "signatoryName",
        label: "Nama Penandatangan",
        type: "text",
        maxLength: 4000,
      },
      {
        key: "signatoryPosition",
        label: "Jabatan",
        type: "text",
        maxLength: 4000,
      },
      {
        key: "invoiceMessage",
        table: false,
        label: "Pesan Invoice",
        type: "text",
        maxLength: 4000,
      },
    ],
  },
  company_bank: {
    label: "Data Bank",
    status: false,
    fields: [
      {
        key: "companyId",
        label: "Perusahaan",
        type: "choice",
        choice: "company",
        required: true,
      },
      {
        key: "description",
        label: "Deskripsi Bank",
        type: "text",
        required: true,
        maxLength: 4000,
      },
    ],
  },
  company_wallet: {
    label: "Dompet Digital",
    status: false,
    fields: [
      {
        key: "companyId",
        label: "Perusahaan",
        type: "choice",
        choice: "company",
        required: true,
      },
      { key: "provider", label: "Penyedia", type: "text", maxLength: 4000 },
      { key: "accountName", label: "Nama Akun", type: "text", maxLength: 4000 },
      {
        key: "accountNumber",
        label: "No. Akun",
        type: "text",
        private: true,
        maxLength: 4000,
      },
      {
        key: "verificationEmail",
        table: false,
        label: "Email Verifikasi",
        type: "email",
        maxLength: 254,
      },
    ],
  },
  whatsapp_configuration: {
    label: "WA Notifikasi",
    status: false,
    fields: [
      {
        key: "companyId",
        label: "Perusahaan",
        type: "choice",
        choice: "company",
        required: true,
      },
      {
        key: "customerId",
        label: "Customer",
        type: "choice",
        choice: "customer",
      },
      { key: "isEnabled", label: "Aktif", type: "boolean" },
    ],
  },
  vendor_tax: {
    label: "NPWP Vendor",
    status: false,
    fields: [
      {
        key: "vendorId",
        label: "Vendor",
        type: "choice",
        choice: "vendor",
        required: true,
      },
      {
        key: "taxNumber",
        label: "NPWP",
        type: "text",
        private: true,
        maxLength: 4000,
      },
      {
        key: "registeredName",
        label: "Nama NPWP",
        type: "text",
        maxLength: 4000,
      },
      { key: "address1", label: "Alamat", type: "text", maxLength: 4000 },
      { key: "address2", label: "Alamat 2", type: "text", maxLength: 4000 },
      { key: "city", label: "Kota", type: "text", maxLength: 4000 },
      { key: "postalCode", label: "Kode Pos", type: "text", maxLength: 4000 },
    ],
  },
};
