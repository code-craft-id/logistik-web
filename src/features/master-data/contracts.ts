import { z } from "zod";
import { identityId } from "@/features/identity/validation";

const status = z.enum(["ACTIVE", "INACTIVE"]);
const dateInput = z
  .union([z.iso.date(), z.null()])
  .transform((value) =>
    value === null ? null : new Date(`${value}T00:00:00.000Z`),
  );
export const masterKinds = [
  "service_category",
  "goods_type",
  "cost_type",
  "term",
  "vehicle_type",
  "trucking_type",
  "delivery_service",
  "shipment_status",
  "vendor",
  "vendor_service",
  "driver",
  "courier",
  "marketing_person",
  "vehicle",
  "province",
  "regency",
  "district",
  "village",
  "postal_code",
  "transport_mode",
] as const;
export const masterKind = z.enum(masterKinds);
export type MasterKind = z.infer<typeof masterKind>;
export const serviceCategoryInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  status,
});
export const goodsTypeInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  status,
});
export const costTypeInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  status,
});
export const termInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(100),
  status,
});
export const vehicleTypeInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  status,
});
export const truckingTypeInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  status,
});
export const deliveryServiceInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  serviceCategoryId: identityId.nullable(),
  transportModeId: identityId.nullable(),
  status,
});
export const shipmentStatusInput = z.strictObject({
  code: z.string().trim().max(20),
  name: z.string().trim().min(1).max(100),
  status,
});
export const vendorInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  address1: z.string().trim().max(4000),
  address2: z.string().trim().max(4000),
  city: z.string().trim().max(4000),
  postalCode: z.string().trim().max(4000),
  phone: z.string().trim().max(4000),
  fax: z.string().trim().max(4000),
  email: z.union([z.email().max(254), z.literal("")]),
  contactName: z.string().trim().max(4000),
  branch: z.string().trim().max(4000),
  status,
});
export const vendorServiceInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  vendorId: identityId,
  status,
});
export const driverInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().max(4000),
  nationalIdNumber: z.string().trim().max(20),
  driverLicenseNumber: z.string().trim().max(20),
  phone: z.string().trim().max(20),
  branchId: identityId.nullable(),
  status,
});
export const courierInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().max(4000),
  nationalIdNumber: z.string().trim().max(20),
  phone: z.string().trim().max(20),
  branchId: identityId.nullable(),
  status,
});
export const marketingPersonInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().max(4000),
  nationalIdNumber: z.string().trim().max(20),
  phone: z.string().trim().max(20),
  branchId: identityId.nullable(),
  status,
});
export const vehicleInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  truckingTypeId: identityId.nullable(),
  year: z
    .union([z.number(), z.string().trim().min(1)])
    .transform((value) => Number(value))
    .pipe(z.number().int().min(0).max(9999)),
  licensePlate: z.string().trim().max(20),
  registrationHolderName: z.string().trim().max(100),
  registrationNumber: z.string().trim().max(50),
  registrationDate: dateInput,
  cylinderCapacity: z.string().trim().max(50),
  color: z.string().trim().max(50),
  insuranceName: z.string().trim().max(100),
  insuranceExpiry: dateInput,
  description: z.string().trim().max(4000),
  chassisNumber: z.string().trim().max(100),
  engineNumber: z.string().trim().max(100),
  serviceTrucking: z.boolean(),
  branchId: identityId.nullable(),
  status,
});
export const provinceInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  status,
});
export const regencyInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  status,
});
export const districtInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  status,
});
export const villageInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  status,
});
export const postalCodeInput = z.strictObject({
  code: z.string().trim().min(1).max(10),
  status,
});
export const transportModeInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  divider: z.string().trim().max(100),
  status,
});
export type MasterField = {
  key: string;
  label: string;
  type: "text" | "email" | "date" | "integer" | "boolean" | "choice";
  required?: boolean;
  private?: boolean;
  maxLength?: number;
  choice?: string;
};
export const masterForms: Record<
  MasterKind,
  { label: string; scoped: boolean; fields: MasterField[] }
> = {
  service_category: {
    label: "Kategori Layanan",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  goods_type: {
    label: "Jenis Barang",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  cost_type: {
    label: "Tipe Pembayaran",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Tipe Pembayaran",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  term: {
    label: "Termin",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Termin",
        type: "text",
        required: true,
        maxLength: 100,
      },
      { key: "description", label: "Keterangan", type: "text", maxLength: 100 },
    ],
  },
  vehicle_type: {
    label: "Jenis Kendaraan",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  trucking_type: {
    label: "Jenis Trucking",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  delivery_service: {
    label: "Layanan Pengantaran",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
      {
        key: "serviceCategoryId",
        label: "Kategori Layanan",
        type: "choice",
        choice: "service_category",
      },
      {
        key: "transportModeId",
        label: "Moda",
        type: "choice",
        choice: "transport_mode",
      },
    ],
  },
  shipment_status: {
    label: "Status Pengiriman",
    scoped: false,
    fields: [
      { key: "code", label: "Kode", type: "text", maxLength: 20 },
      {
        key: "name",
        label: "Status Pengiriman",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  vendor: {
    label: "Vendor",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
      { key: "address1", label: "Alamat 1", type: "text", maxLength: 4000 },
      { key: "address2", label: "Alamat 2", type: "text", maxLength: 4000 },
      { key: "city", label: "Kota", type: "text", maxLength: 4000 },
      { key: "postalCode", label: "Kode Pos", type: "text", maxLength: 4000 },
      { key: "phone", label: "Telepon", type: "text", maxLength: 4000 },
      { key: "fax", label: "Fax", type: "text", maxLength: 4000 },
      { key: "email", label: "Email", type: "email", maxLength: 254 },
      { key: "contactName", label: "Kontak", type: "text", maxLength: 4000 },
      { key: "branch", label: "Cabang", type: "text", maxLength: 4000 },
    ],
  },
  vendor_service: {
    label: "Layanan Vendor",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
      {
        key: "vendorId",
        label: "Vendor",
        type: "choice",
        choice: "vendor",
        required: true,
      },
    ],
  },
  driver: {
    label: "Driver",
    scoped: true,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
      { key: "address", label: "Alamat", type: "text", maxLength: 4000 },
      {
        key: "nationalIdNumber",
        label: "Nomor KTP",
        type: "text",
        private: true,
        maxLength: 20,
      },
      {
        key: "driverLicenseNumber",
        label: "Nomor SIM",
        type: "text",
        private: true,
        maxLength: 20,
      },
      { key: "phone", label: "Telepon", type: "text", maxLength: 20 },
      { key: "branchId", label: "Cabang", type: "choice", choice: "branch" },
    ],
  },
  courier: {
    label: "Kurir",
    scoped: true,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
      { key: "address", label: "Alamat", type: "text", maxLength: 4000 },
      {
        key: "nationalIdNumber",
        label: "Nomor KTP",
        type: "text",
        private: true,
        maxLength: 20,
      },
      { key: "phone", label: "Telepon", type: "text", maxLength: 20 },
      { key: "branchId", label: "Cabang", type: "choice", choice: "branch" },
    ],
  },
  marketing_person: {
    label: "Marketing",
    scoped: true,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
      { key: "address", label: "Alamat", type: "text", maxLength: 4000 },
      {
        key: "nationalIdNumber",
        label: "Nomor KTP",
        type: "text",
        private: true,
        maxLength: 20,
      },
      { key: "phone", label: "Telepon", type: "text", maxLength: 20 },
      { key: "branchId", label: "Cabang", type: "choice", choice: "branch" },
    ],
  },
  vehicle: {
    label: "Kendaraan",
    scoped: true,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
      {
        key: "truckingTypeId",
        label: "Jenis Trucking",
        type: "choice",
        choice: "trucking_type",
      },
      { key: "year", label: "Tahun", type: "integer", required: true },
      { key: "licensePlate", label: "No. Polisi", type: "text", maxLength: 20 },
      {
        key: "registrationHolderName",
        label: "Nama Pemilik STNK",
        type: "text",
        maxLength: 100,
      },
      {
        key: "registrationNumber",
        label: "No. STNK",
        type: "text",
        maxLength: 50,
      },
      { key: "registrationDate", label: "Tanggal STNK", type: "date" },
      {
        key: "cylinderCapacity",
        label: "Kapasitas Silinder",
        type: "text",
        maxLength: 50,
      },
      { key: "color", label: "Warna", type: "text", maxLength: 50 },
      { key: "insuranceName", label: "Asuransi", type: "text", maxLength: 100 },
      { key: "insuranceExpiry", label: "Berlaku Asuransi", type: "date" },
      {
        key: "description",
        label: "Keterangan",
        type: "text",
        maxLength: 4000,
      },
      {
        key: "chassisNumber",
        label: "No. Rangka",
        type: "text",
        maxLength: 100,
      },
      { key: "engineNumber", label: "No. Mesin", type: "text", maxLength: 100 },
      { key: "serviceTrucking", label: "Layanan Trucking", type: "boolean" },
      { key: "branchId", label: "Cabang", type: "choice", choice: "branch" },
    ],
  },
  province: {
    label: "Provinsi",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  regency: {
    label: "Kabupaten",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  district: {
    label: "Kecamatan",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  village: {
    label: "Kelurahan",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
    ],
  },
  postal_code: {
    label: "Kode Pos",
    scoped: false,
    fields: [{ key: "code", label: "Kode Pos", type: "text", maxLength: 10 }],
  },
  transport_mode: {
    label: "Moda",
    scoped: false,
    fields: [
      {
        key: "name",
        label: "Nama",
        type: "text",
        required: true,
        maxLength: 100,
      },
      { key: "divider", label: "Divider", type: "text", maxLength: 100 },
    ],
  },
};
