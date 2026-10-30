/** Dev 1 permission inventory only. A configured right never activates an unfinished workflow. */
export const permissionResources = [
  {
    resource: "system_admin",
    label: "Administrator — akses penuh semua cabang",
    actions: ["manage"],
  },
  {
    resource: "user_group",
    label: "Grup User",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "user",
    label: "Manajemen User",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "permission",
    label: "Hak Akses Menu",
    actions: ["view", "update"],
  },
  {
    resource: "company",
    label: "Perusahaan",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "office",
    label: "Kantor",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "branch",
    label: "Kantor Cabang",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "agent",
    label: "Agen",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "province",
    label: "Provinsi",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "regency",
    label: "Kabupaten",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "district",
    label: "Kecamatan",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "village",
    label: "Kelurahan",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "postal_code",
    label: "Kode Pos",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "transport_mode",
    label: "Moda",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "service_category",
    label: "Kategori Layanan",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "delivery_service",
    label: "Layanan Pengantaran",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "goods_type",
    label: "Jenis Barang",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "cost_type",
    label: "Tipe Pembayaran",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "term",
    label: "Termin",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "shipment_status",
    label: "Status Pengiriman",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "vehicle",
    label: "Kendaraan",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "vehicle_type",
    label: "Jenis Kendaraan",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "trucking_type",
    label: "Jenis Trucking",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "driver",
    label: "Driver",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "marketing_person",
    label: "Marketing",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "courier",
    label: "Kurir",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "vendor_service",
    label: "Layanan Vendor",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "vendor",
    label: "Vendor",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "company_invoice",
    label: "Tanda Tangan Invoice",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "company_bank",
    label: "Data Bank Perusahaan",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "company_wallet",
    label: "Dompet Digital Perusahaan",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "whatsapp_configuration",
    label: "Konfigurasi WhatsApp",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "vendor_tax",
    label: "NPWP Vendor",
    actions: ["view", "create", "update", "delete"],
  },
  {
    resource: "booking",
    label: "Booking",
    actions: ["view", "create", "update"],
  },
  {
    resource: "transaction",
    label: "Transaksi / AWB",
    actions: ["view", "create", "update"],
  },
  {
    resource: "manifest",
    label: "Manifest",
    actions: ["view", "create", "update"],
  },
  {
    resource: "delivery",
    label: "Delivery Sheet",
    actions: ["view", "create", "update"],
  },
] as const;

export const permissionGrantCount = permissionResources.reduce(
  (count, entry) => count + entry.actions.length,
  0,
);

export const fullAccessPermission = {
  resource: "system_admin",
  action: "manage",
} as const;

/** Explains additional server restrictions; grants never override these rules. */
export function permissionRestriction(resource: string): string | undefined {
  if (resource === "vendor_tax")
    return "Lihat dan kelola NPWP vendor khusus administrator.";
  if (
    ["booking", "transaction", "manifest", "delivery"].includes(resource)
  )
    return undefined;
  if (
    permissionResources.some((entry) => entry.resource === resource) &&
    ![
      "system_admin",
      "user_group",
      "user",
      "permission",
      "driver",
      "courier",
      "marketing_person",
      "vehicle",
    ].includes(resource)
  )
    return "Tambah, ubah, dan hapus khusus administrator. Izin aksi saja tidak memberikan akses perubahan data bersama.";
  return undefined;
}

export type Grant = { resource: string; action: string };
export type IdentityCapabilities = Partial<
  Record<"create" | "update" | "delete" | "administrator", boolean>
>;
export function validPermission({ resource, action }: Grant): boolean {
  return permissionResources.some(
    (entry) =>
      entry.resource === resource &&
      (entry.actions as readonly string[]).includes(action),
  );
}

export type AccessActor = {
  id: number;
  status: string;
  group: {
    id: number;
    name: string;
    status: string;
    deletedAt: Date | null;
    permissions: Grant[];
  } | null;
  branchIds: number[];
};

export function activeActor(
  actor: AccessActor | null,
): actor is AccessActor & { group: NonNullable<AccessActor["group"]> } {
  return (
    !!actor &&
    actor.status === "ACTIVE" &&
    !!actor.group &&
    actor.group.status === "ACTIVE" &&
    actor.group.deletedAt === null
  );
}
export function isAdministrator(actor: AccessActor | null): boolean {
  return (
    activeActor(actor) &&
    actor.group.permissions.some(
      (grant) =>
        grant.resource === fullAccessPermission.resource &&
        grant.action === fullAccessPermission.action,
    )
  );
}
export function permits(
  actor: AccessActor | null,
  action: string,
  resource: string,
): boolean {
  return (
    activeActor(actor) &&
    validPermission({ action, resource }) &&
    (isAdministrator(actor) ||
      actor.group.permissions.some(
        (grant) => grant.resource === resource && grant.action === action,
      ))
  );
}
export function permitsBranch(
  actor: AccessActor | null,
  branchId: number,
): boolean {
  return (
    activeActor(actor) &&
    Number.isSafeInteger(branchId) &&
    branchId > 0 &&
    (isAdministrator(actor) || actor.branchIds.includes(branchId))
  );
}
