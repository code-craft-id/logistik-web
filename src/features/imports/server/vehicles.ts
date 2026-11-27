import "server-only";

import type { AccessActor } from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { writableBranch } from "@/features/sales/server/parties";
import { prisma } from "@/lib/db";
import {
  filled,
  idSet,
  invalid,
  readRows,
  workbook,
} from "@/lib/excel/import-sheet";

/**
 * Provider Template Import Vehicle (owner supplied 2026-11-27). "Kode" is the
 * key: an existing code is updated. Jenis ID is an LMS trucking type; Type and
 * Merk are kept as text (LMS has no master for them).
 */
export const VEHICLE_COLUMNS = [
  "Kode",
  "Jenis",
  "Jenis ID",
  "Type",
  "Type ID",
  "Merk",
  "Merk ID",
  "Tahun",
  "No. Polisi",
  "Nama STNK",
  "No. STNK",
  "STNK Date",
  "Isi Silinder",
  "Warna",
  "Keterangan",
  "No. Rangka",
  "No. Mesin",
  "Warna TNKB",
  "Panjang",
  "Lebar",
  "Tinggi",
  "Branch",
  "Branch ID",
];
const live = { deletedAt: null };

export function parseVehicleFile(bytes: Uint8Array) {
  const seen = new Set<string>();
  // The provider file pre-fills a date in unused rows: key columns only.
  return readRows(bytes, VEHICLE_COLUMNS, [0, 8]).map((r) => {
    const code = r.required(r.text(0, 50), 0);
    if (seen.has(code)) r.bad(`Kode ${code} ganda di file.`);
    seen.add(code);
    const year = r.required(r.whole(7), 7);
    if (year < 1900 || year > 2100) r.bad("Tahun tidak valid.");
    const date = r.raw[11];
    let registrationDate: Date | undefined;
    if (date) {
      registrationDate =
        date instanceof Date
          ? new Date(
              Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
            )
          : new Date(`${r.text(11)}T00:00:00Z`);
      if (Number.isNaN(registrationDate.getTime()))
        r.bad("STNK Date pakai YYYY-MM-DD.");
    }
    return {
      line: r.line,
      code,
      year,
      licensePlate: r.required(r.text(8, 20), 8),
      values: filled({
        truckingTypeId: r.whole(2),
        bodyType: r.text(3, 100),
        brand: r.text(5, 100),
        registrationHolderName: r.text(9, 100),
        registrationNumber: r.text(10, 50),
        registrationDate,
        cylinderCapacity: r.text(12, 50),
        color: r.text(13, 50),
        description: r.text(14),
        chassisNumber: r.text(15, 100),
        engineNumber: r.text(16, 100),
        plateColor: r.text(17, 50),
        length: r.decimal(18),
        width: r.decimal(19),
        height: r.decimal(20),
        branchId: r.whole(22),
      }),
    };
  });
}

export async function importVehicles(actor: AccessActor, bytes: Uint8Array) {
  assertPermission(actor, "create", "vehicle");
  const rows = parseVehicleFile(bytes);
  return prisma.$transaction(
    async (tx) => {
      const select = { id: true } as const;
      const [existing, types, branches] = await Promise.all([
        tx.vehicle.findMany({
          where: {
            OR: [
              { code: { in: rows.map((r) => r.code) } },
              { licensePlate: { in: rows.map((r) => r.licensePlate) } },
            ],
          },
          select: {
            id: true,
            code: true,
            licensePlate: true,
            branchId: true,
            deletedAt: true,
          },
        }),
        tx.truckingType.findMany({ where: live, select }),
        tx.branch.findMany({ where: live, select }),
      ]);
      const [type, branch] = [types, branches].map(idSet);
      let created = 0;
      for (const { line, code, year, licensePlate, values } of rows) {
        const bad = (message: string) => invalid(`Baris ${line}: ${message}`);
        if (values.truckingTypeId && !type.has(values.truckingTypeId))
          bad("Jenis ID tidak ditemukan.");
        if (values.branchId && !branch.has(values.branchId))
          bad("Branch ID tidak ditemukan.");
        const old = existing.find((v) => v.code === code);
        if (existing.some((v) => v.licensePlate === licensePlate && v !== old))
          bad(`No. Polisi ${licensePlate} sudah dipakai.`);
        const data = {
          ...values,
          year,
          licensePlate,
          name: `${values.brand ?? "Kendaraan"} ${licensePlate}`.slice(0, 100),
        };
        if (old) {
          assertPermission(actor, "update", "vehicle");
          if (old.deletedAt) bad(`Kode ${code} milik data yang sudah dihapus.`);
          writableBranch(actor, old.branchId);
          if (values.branchId) writableBranch(actor, values.branchId);
          await tx.vehicle.update({ where: { id: old.id }, data });
        } else {
          writableBranch(actor, values.branchId);
          await tx.vehicle.create({
            data: {
              registrationHolderName: "",
              registrationNumber: "",
              cylinderCapacity: "",
              color: "",
              insuranceName: "",
              description: "",
              chassisNumber: "",
              engineNumber: "",
              ...data,
              code,
            },
          });
          created++;
        }
      }
      return `${created} kendaraan dibuat, ${rows.length - created} diperbarui.`;
    },
    { timeout: 60_000 },
  );
}

export async function vehicleTemplate(actor: AccessActor) {
  assertPermission(actor, "create", "vehicle");
  const pick = { id: true, name: true } as const;
  const order = { name: "asc" as const };
  const [types, branches] = await Promise.all([
    prisma.truckingType.findMany({ where: live, select: pick, orderBy: order }),
    prisma.branch.findMany({ where: live, select: pick, orderBy: order }),
  ]);
  return workbook(
    [["Template Import Vehicle"], [], VEHICLE_COLUMNS],
    [
      ["Jenis ID", types],
      ["Branch ID", branches],
    ],
  );
}
