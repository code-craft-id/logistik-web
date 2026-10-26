import { z } from "zod";
import { identityId, listQuerySchema } from "@/features/identity/validation";
import { validCompanyLogo } from "./company-logo";

export const organizationKinds = [
  "company",
  "office",
  "branch",
  "agent",
] as const;
export const organizationKind = z.enum(organizationKinds);
export type OrganizationKind = z.infer<typeof organizationKind>;
const text = z.string().trim().max(1000).nullable();
const name = z.string().trim().min(1).max(100);
const email = z.union([z.email().max(254), z.literal(""), z.null()]);
export const companyInput = z.strictObject({
  name,
  address: text,
  city: text,
  postalCode: text,
  phoneNumber: text,
  faxNumber: text,
  directorName: text,
  taxId: text,
  website: text,
  logo: z
    .string()
    .trim()
    .max(350000)
    .nullable()
    .refine(
      validCompanyLogo,
      "Logo harus PNG, JPEG, atau WebP maksimal 250 KB, atau referensi teks maksimal 1000 karakter.",
    ),
  email,
  isDepositAgent: z.boolean(),
  showPriceOnPrint: z.boolean(),
});
export const officeInput = z.strictObject({
  companyId: identityId,
  code: name,
  name,
  address: text,
  city: text,
  phoneNumber: text,
  email,
  managerName: text,
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export const branchInput = z.strictObject({
  officeId: identityId,
  code: name,
  name,
  address: text,
  city: text,
  phoneNumber: text,
  managerName: text,
  managerContact: text,
  postalCode: text.optional(),
  faxNumber: text.optional(),
  email: email.optional(),
  financeContactName: text.optional(),
  marketingContactName: text.optional(),
  taxId: text.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export const agentInput = z.strictObject({
  branchId: identityId,
  code: name,
  initials: name,
  name,
  category: z.string().trim().max(100),
  phoneNumber: text,
  managerName: text,
  mobileNumber: text,
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export const organizationQuery = listQuerySchema.extend({
  id: identityId.optional(),
  parentId: identityId.optional(),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});

export type OrganizationField = {
  key: string;
  label: string;
  type?: "text" | "email" | "checkbox" | "status" | "parent";
  required?: boolean;
  table?: boolean;
  emptyValue?: string;
};
export const organizationForms: Record<
  OrganizationKind,
  { label: string; fields: OrganizationField[]; parent?: OrganizationKind }
> = {
  agent: {
    label: "Agen",
    parent: "branch",
    fields: [
      { key: "code", table: true, label: "Kode Agen", required: true },
      { key: "initials", label: "Inisial Agen", required: true },
      { key: "name", table: true, label: "Nama Agen", required: true },
      { key: "category", table: true, label: "Kategori Agen", emptyValue: "" },
      {
        key: "branchId",
        table: true,
        label: "Kantor Cabang",
        type: "parent",
        required: true,
      },
      { key: "phoneNumber", label: "No. Telepon" },
      { key: "managerName", label: "Manager Agen" },
      { key: "mobileNumber", label: "No. Handphone" },
      { key: "status", table: true, label: "Status", type: "status" },
    ],
  },
  company: {
    label: "Perusahaan",
    fields: [
      { key: "name", table: true, label: "Nama Perusahaan", required: true },
      { key: "address", table: true, label: "Alamat" },
      { key: "city", table: true, label: "Kota" },
      { key: "postalCode", label: "Kode Pos" },
      { key: "phoneNumber", table: true, label: "No. Telepon" },
      { key: "faxNumber", label: "No. Fax" },
      { key: "directorName", label: "Nama Direktur" },
      { key: "taxId", table: true, label: "NPWP" },
      { key: "website", label: "Website" },
      { key: "logo", label: "Logo" },
      { key: "email", table: true, label: "Email", type: "email" },
      {
        key: "isDepositAgent",
        table: true,
        label: "Agen Deposit",
        type: "checkbox",
      },
      {
        key: "showPriceOnPrint",
        label: "Tampilkan Harga di Cetakan",
        type: "checkbox",
      },
    ],
  },
  office: {
    label: "Kantor",
    parent: "company",
    fields: [
      { key: "code", table: true, label: "Kode Kantor", required: true },
      { key: "name", table: true, label: "Nama Kantor", required: true },
      {
        key: "companyId",
        table: true,
        label: "Perusahaan",
        type: "parent",
        required: true,
      },
      { key: "address", table: true, label: "Alamat" },
      { key: "city", table: true, label: "Kota" },
      { key: "phoneNumber", table: true, label: "No. Telepon" },
      { key: "email", label: "Email", type: "email" },
      { key: "managerName", label: "Manager Kantor" },
      { key: "status", table: true, label: "Status", type: "status" },
    ],
  },
  branch: {
    label: "Kantor Cabang",
    parent: "office",
    fields: [
      {
        key: "code",
        table: true,
        label: "Kode / Inisial Cabang",
        required: true,
      },
      { key: "name", table: true, label: "Nama Cabang", required: true },
      {
        key: "officeId",
        table: true,
        label: "Kantor",
        type: "parent",
        required: true,
      },
      { key: "address", table: true, label: "Alamat" },
      { key: "city", label: "Kota" },
      { key: "postalCode", label: "Kode Pos" },
      { key: "phoneNumber", table: true, label: "No. Telepon" },
      { key: "faxNumber", label: "No. Fax" },
      { key: "managerName", label: "Kepala Cabang" },
      { key: "managerContact", label: "Kontak Kepala" },
      { key: "email", label: "Email", type: "email" },
      { key: "financeContactName", label: "Finance" },
      { key: "marketingContactName", label: "Marketing" },
      { key: "taxId", label: "NPWP" },
      { key: "status", table: true, label: "Status", type: "status" },
    ],
  },
};
