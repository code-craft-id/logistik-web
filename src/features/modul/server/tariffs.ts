import "server-only";

import { z } from "zod";
import type { AccessActor } from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";
import { lockKey, ModulError } from "./common";

export type TariffRow = {
  id: number;
  service: string | null;
  origin: string;
  destination: string;
  minWeight: string;
  pricePerKg: string;
  /** max(weight, minWeight) x pricePerKg, or minWeight x pricePerKg. */
  charge: string;
  eta: string | null;
};

/**
 * Cek Ongkir: active tariffs for a route. Tariffs are shared reference
 * data (like the legacy page), so every user with the view right sees all.
 */
export async function checkTariffs(
  actor: AccessActor,
  params: { origin?: number; destination?: number; weight?: string } = {},
): Promise<TariffRow[]> {
  assertPermission(actor, "view", "tariff");
  const weight =
    params.weight && /^\d{1,6}(\.\d{1,2})?$/.test(params.weight)
      ? new Prisma.Decimal(params.weight)
      : null;
  const rows = await prisma.tariff.findMany({
    where: {
      deletedAt: null,
      ...(params.origin ? { originBranchId: params.origin } : {}),
      ...(params.destination
        ? { destinationBranchId: params.destination }
        : {}),
    },
    orderBy: [
      { originBranch: { name: "asc" } },
      { destinationBranch: { name: "asc" } },
      { id: "asc" },
    ],
    take: 500,
    select: {
      id: true,
      minWeight: true,
      pricePerKg: true,
      eta: true,
      deliveryService: { select: { name: true } },
      originBranch: { select: { name: true } },
      destinationBranch: { select: { name: true } },
    },
  });
  return rows.map((row) => {
    const billed = weight?.greaterThan(row.minWeight) ? weight : row.minWeight;
    return {
      id: row.id,
      service: row.deliveryService?.name ?? null,
      origin: row.originBranch.name,
      destination: row.destinationBranch.name,
      minWeight: row.minWeight.toString(),
      pricePerKg: row.pricePerKg.toString(),
      charge: billed.times(row.pricePerKg).toDecimalPlaces(2).toString(),
      eta: row.eta,
    };
  });
}

const money = (max: number) =>
  z
    .string()
    .trim()
    .regex(
      new RegExp(`^(0|[1-9]\\d{0,${max}})(\\.\\d{1,2})?$`),
      "Angka tidak valid.",
    );
const tariffSchema = z.object({
  deliveryServiceId: z.coerce.number().int().positive().optional(),
  originBranchId: z.coerce.number().int().positive(),
  destinationBranchId: z.coerce.number().int().positive(),
  minWeight: money(7),
  pricePerKg: money(12),
  eta: z.string().trim().max(50).optional(),
});

export async function saveTariff(actor: AccessActor, input: unknown) {
  assertPermission(actor, "manage", "tariff");
  const data = tariffSchema.parse(input);
  const [origin, destination, service] = await Promise.all([
    prisma.branch.count({
      where: { id: data.originBranchId, deletedAt: null },
    }),
    prisma.branch.count({
      where: { id: data.destinationBranchId, deletedAt: null },
    }),
    data.deliveryServiceId
      ? prisma.deliveryService.count({
          where: { id: data.deliveryServiceId, deletedAt: null },
        })
      : 1,
  ]);
  if (!origin || !destination)
    throw new ModulError("Cabang asal atau tujuan tidak ditemukan.");
  if (!service) throw new ModulError("Layanan tidak ditemukan.");
  // Two users saving the same route at once: only one tariff is created.
  return prisma.$transaction(async (tx) => {
    await lockKey(
      tx,
      `tariff:${data.originBranchId}:${data.destinationBranchId}:${data.deliveryServiceId ?? 0}`,
    );
    const duplicate = await tx.tariff.count({
      where: {
        deletedAt: null,
        originBranchId: data.originBranchId,
        destinationBranchId: data.destinationBranchId,
        deliveryServiceId: data.deliveryServiceId ?? null,
      },
    });
    if (duplicate)
      throw new ModulError(
        "Tarif untuk layanan dan rute ini sudah ada. Hapus tarif lama dulu jika ingin mengganti.",
      );
    return tx.tariff.create({
      data: { ...data, eta: data.eta || null },
      select: { id: true },
    });
  });
}

export async function deleteTariff(actor: AccessActor, id: number) {
  assertPermission(actor, "manage", "tariff");
  const result = await prisma.tariff.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count !== 1)
    throw new ModulError("Tarif tidak ditemukan atau sudah dihapus.");
}
