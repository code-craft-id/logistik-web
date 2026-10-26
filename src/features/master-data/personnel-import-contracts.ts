import { z } from "zod";
export const PERSONNEL_IMPORT_MAX_BYTES = 512 * 1024;
export const PERSONNEL_IMPORT_MAX_ROWS = 500;
export const personnelImportKinds = [
  "driver",
  "courier",
  "marketing_person",
] as const;
export const personnelImportKind = z.enum(personnelImportKinds);
export type PersonnelImportKind = (typeof personnelImportKinds)[number];
const commonHeaders = [
  "ID",
  "NAMA",
  "ALAMAT",
  "ALAMAT 2",
  "No KTP",
  "NO. TELP",
  "CABANG",
  "CABANG  (Branch Office)",
];
export const personnelImportDefinitions = {
  driver: {
    label: "Driver",
    filename: "Template_driver_new.xls",
    headers: [...commonHeaders, "SIM", "STATUS"],
  },
  courier: {
    label: "Kurir",
    filename: "Template_courier.xls",
    headers: [...commonHeaders, "STATUS"],
  },
  marketing_person: {
    label: "Marketing",
    filename: "Template_marketing.xls",
    headers: [...commonHeaders, "STATUS"],
  },
} satisfies Record<
  PersonnelImportKind,
  { label: string; filename: string; headers: string[] }
>;
export type PersonnelImportLine = {
  row: number;
  name: string;
  address: string;
  nationalIdNumber: string;
  phone: string;
  branch: string;
  driverLicenseNumber?: string;
  status: "ACTIVE" | "INACTIVE";
};
export type PersonnelImportIssue = { row: number; message: string };
export type PersonnelImportPreview = {
  count: number;
  valid: boolean;
  rows: { row: number; name: string; branch: string; status: string }[];
  issues: PersonnelImportIssue[];
};
