import "server-only";

import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db/generated/client";

export const MANIFEST_PAGE_SIZE = 25;

/** Manifest visibility follows its owning branch, as in createManifest. */
function visible(actor: AccessActor): Prisma.ManifestWhereInput {
  if (isAdministrator(actor)) return { deletedAt: null };
  // No branch membership: an empty list rather than an error page.
  return { deletedAt: null, branchId: { in: actor.branchIds } };
}

/** Read access also covers manifests headed to the actor's branches. */
function readable(actor: AccessActor): Prisma.ManifestWhereInput {
  if (isAdministrator(actor)) return { deletedAt: null };
  return {
    deletedAt: null,
    OR: [
      { branchId: { in: actor.branchIds } },
      { destinationBranchId: { in: actor.branchIds } },
    ],
  };
}

type TotalRow = {
  manifestId: number;
  awb: number;
  koli: number | null;
  kilo: string | null;
  volume: string | null;
};
/**
 * Active-item totals for many manifests in one aggregate query (no per-row
 * item loading). A total is null when any active AWB lacks that value.
 */
async function manifestTotals(manifestIds: number[]) {
  if (!manifestIds.length) return new Map<number, TotalRow>();
  const rows = await prisma.$queryRaw<TotalRow[]>`
    SELECT mi.manifest_id AS "manifestId",
           count(*)::int AS awb,
           CASE WHEN count(t.koli) = count(*) THEN COALESCE(sum(t.koli), 0)::int END AS koli,
           CASE WHEN count(t.kilo) = count(*) THEN COALESCE(sum(t.kilo), 0)::text END AS kilo,
           CASE WHEN count(t.volume) = count(*) THEN COALESCE(sum(t.volume), 0)::text END AS volume
    FROM manifest_items mi
    JOIN transactions t ON t.id = mi.transaction_id
    WHERE mi.manifest_id IN (${Prisma.join(manifestIds)})
      AND mi.deleted_at IS NULL AND mi.released_at IS NULL
    GROUP BY mi.manifest_id`;
  return new Map(rows.map((row) => [row.manifestId, row]));
}
const noItems = { awb: 0, koli: 0, kilo: "0", volume: "0" };
const trim = (value: string | null) =>
  value === null ? null : new Prisma.Decimal(value).toString();

function totals(
  items: {
    transaction: {
      koli: number | null;
      kilo: Prisma.Decimal | null;
      volume: Prisma.Decimal | null;
    };
  }[],
) {
  // Unknown source values make the total unknown instead of silently zero.
  const known = <T>(values: (T | null)[]) =>
    values.every((v) => v !== null) ? (values as T[]) : null;
  const koli = known(items.map((i) => i.transaction.koli));
  const kilo = known(items.map((i) => i.transaction.kilo));
  const volume = known(items.map((i) => i.transaction.volume));
  return {
    awb: items.length,
    koli: koli ? koli.reduce((a, b) => a + b, 0) : null,
    kilo: kilo
      ? kilo.reduce((a, b) => a.plus(b), new Prisma.Decimal(0)).toString()
      : null,
    volume: volume
      ? volume.reduce((a, b) => a.plus(b), new Prisma.Decimal(0)).toString()
      : null,
  };
}

export async function listManifests(
  actor: AccessActor,
  params: {
    page?: number;
    search?: string;
    type?: string;
    /** Cek Inbound Agen: manifests handed to an agent/vendor. */
    agent?: boolean;
    destination?: number;
  } = {},
) {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const search = params.search?.trim().slice(0, 50);
  const type = ["Outbound", "Transit", "Inbound"].includes(params.type ?? "")
    ? params.type
    : undefined;
  const destination =
    params.destination && Number.isSafeInteger(params.destination)
      ? params.destination
      : undefined;
  // Inbound views also show manifests headed to the actor's branches.
  const scope =
    params.agent || type === "Inbound" ? readable(actor) : visible(actor);
  const where: Prisma.ManifestWhereInput = {
    ...scope,
    ...(type ? { type } : {}),
    ...(params.agent ? { vendorId: { not: null } } : {}),
    ...(destination ? { destinationBranchId: destination } : {}),
    ...(search
      ? { manifestNo: { contains: search, mode: "insensitive" as const } }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.manifest.findMany({
      where,
      orderBy: [{ manifestDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * MANIFEST_PAGE_SIZE,
      take: MANIFEST_PAGE_SIZE,
      select: {
        id: true,
        manifestNo: true,
        manifestDate: true,
        type: true,
        status: true,
        originBranchId: true,
        destinationBranchId: true,
        branch: { select: { name: true } },
        vehicle: { select: { name: true, licensePlate: true } },
        courier: { select: { name: true } },
        vendor: { select: { name: true } },
      },
    }),
    prisma.manifest.count({ where }),
  ]);
  // Only the branches and totals this page needs.
  const branchIds = [
    ...new Set(rows.flatMap((r) => [r.originBranchId, r.destinationBranchId])),
  ].filter((v): v is number => v !== null);
  const [branches, sums] = await Promise.all([
    prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true },
    }),
    manifestTotals(rows.map((r) => r.id)),
  ]);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  return {
    page,
    total,
    pages: Math.max(1, Math.ceil(total / MANIFEST_PAGE_SIZE)),
    items: rows.map((row) => ({
      id: row.id,
      manifestNo: row.manifestNo,
      date: row.manifestDate.toISOString().slice(0, 10),
      type: row.type,
      status: row.status,
      branch: row.branch?.name ?? null,
      origin: row.originBranchId
        ? (branchName.get(row.originBranchId) ?? null)
        : null,
      destination: row.destinationBranchId
        ? (branchName.get(row.destinationBranchId) ?? null)
        : null,
      vehicle: row.vehicle
        ? `${row.vehicle.licensePlate} · ${row.vehicle.name}`
        : null,
      courier: row.courier?.name ?? null,
      vendor: row.vendor?.name ?? null,
      ...(() => {
        const sum = sums.get(row.id);
        return sum
          ? {
              awb: sum.awb,
              koli: sum.koli,
              kilo: trim(sum.kilo),
              volume: trim(sum.volume),
            }
          : noItems;
      })(),
    })),
  };
}

export async function getManifest(actor: AccessActor, id: number) {
  const row = await prisma.manifest.findFirst({
    where: { ...readable(actor), id },
    include: {
      branch: { select: { name: true } },
      vehicle: { select: { name: true, licensePlate: true } },
      courier: { select: { name: true } },
      vendor: { select: { name: true } },
      createdBy: { select: { name: true } },
      deliverySheet: {
        select: {
          id: true,
          sheetNo: true,
          deliveryDate: true,
          items: {
            where: { deletedAt: null },
            select: {
              transactionId: true,
              outcome: true,
              receivedBy: true,
              deliveredAt: true,
              podPhotoUrl: true,
            },
          },
        },
      },
      items: {
        where: { deletedAt: null, releasedAt: null },
        orderBy: { id: "asc" },
        select: {
          id: true,
          assignedAt: true,
          transaction: {
            select: {
              id: true,
              awbNo: true,
              doNo: true,
              receiverName: true,
              koli: true,
              kilo: true,
              volume: true,
              status: true,
              destinationBranch: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!row) return null;
  const ids = [row.originBranchId, row.destinationBranchId].filter(
    (v): v is number => v !== null,
  );
  const branches = await prisma.branch.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const name = (id: number | null) =>
    id ? (branches.find((b) => b.id === id)?.name ?? null) : null;
  return {
    id: row.id,
    manifestNo: row.manifestNo,
    date: row.manifestDate.toISOString().slice(0, 10),
    type: row.type,
    status: row.status,
    branch: row.branch?.name ?? null,
    origin: name(row.originBranchId),
    destination: name(row.destinationBranchId),
    vehicle: row.vehicle
      ? `${row.vehicle.licensePlate} · ${row.vehicle.name}`
      : null,
    courier: row.courier?.name ?? null,
    vendor: row.vendor?.name ?? null,
    deliverySheet: row.deliverySheet
      ? {
          id: row.deliverySheet.id,
          sheetNo: row.deliverySheet.sheetNo,
          date: row.deliverySheet.deliveryDate.toISOString().slice(0, 10),
        }
      : null,
    createdBy: row.createdBy?.name ?? null,
    transit: [
      row.transit1,
      row.transit2,
      row.transit3,
      row.transit4,
      row.transit5,
    ].filter((v): v is string => !!v),
    assignable: row.status !== "Closed",
    ...totals(row.items),
    items: row.items.map((item) => {
      const outcome = row.deliverySheet?.items.find(
        (d) => d.transactionId === item.transaction.id,
      );
      return {
        outcome: outcome?.outcome ?? null,
        receivedBy: outcome?.receivedBy ?? null,
        deliveredAt: outcome?.deliveredAt?.toISOString() ?? null,
        photoUrl: outcome?.podPhotoUrl ?? null,
        id: item.id,
        assignedAt: item.assignedAt.toISOString(),
        transactionId: item.transaction.id,
        awbNo: item.transaction.awbNo,
        doNo: item.transaction.doNo,
        receiver: item.transaction.receiverName,
        destination: item.transaction.destinationBranch?.name ?? null,
        koli: item.transaction.koli,
        kilo: item.transaction.kilo?.toString() ?? null,
        volume: item.transaction.volume?.toString() ?? null,
        status: item.transaction.status,
      };
    }),
  };
}

/** Options the create form may offer; the service re-validates every value. */
export async function manifestFormOptions(actor: AccessActor) {
  const admin = isAdministrator(actor);
  const scoped = admin ? {} : { id: { in: actor.branchIds } };
  const [branches, vehicles, couriers, vendors] = await Promise.all([
    prisma.branch.findMany({
      where: { deletedAt: null, status: "ACTIVE", ...scoped },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.vehicle.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        ...(admin ? {} : { branchId: { in: actor.branchIds } }),
      },
      select: { id: true, name: true, licensePlate: true },
      orderBy: { licensePlate: "asc" },
      take: 500,
    }),
    prisma.courier.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        ...(admin
          ? {}
          : {
              OR: [{ branchId: { in: actor.branchIds } }, { branchId: null }],
            }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.vendor.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);
  return {
    vendors,
    branches: branches.filter((b) => admin || permitsBranch(actor, b.id)),
    vehicles: vehicles.map((v) => ({
      id: v.id,
      name: `${v.licensePlate} · ${v.name}`,
    })),
    couriers,
  };
}

/** Resolve an AWB number to a visible, not-deleted transaction for assignment. */
export async function findAssignableTransaction(
  actor: AccessActor,
  awbNo: string,
) {
  const admin = isAdministrator(actor);
  // AWB numbers are unique per origin branch only; refuse to guess between two.
  const matches = await prisma.transaction.findMany({
    where: {
      awbNo: { equals: awbNo.trim(), mode: "insensitive" },
      deletedAt: null,
      ...(admin
        ? {}
        : {
            OR: [
              { originBranchId: { in: actor.branchIds } },
              { destinationBranchId: { in: actor.branchIds } },
            ],
          }),
    },
    select: { id: true },
    orderBy: { id: "desc" },
    take: 2,
  });
  if (matches.length > 1) return "AMBIGUOUS" as const;
  return matches[0] ?? null;
}

/**
 * Delivery sheet lines of one AWB for its detail page (proof of delivery).
 * Callers have already checked that the AWB is visible to the actor.
 */
export async function deliveryProofs(transactionId: number) {
  return prisma.deliverySheetItem.findMany({
    where: {
      transactionId,
      deletedAt: null,
      deliverySheet: { manifest: { deletedAt: null } },
    },
    orderBy: { id: "desc" },
    take: 10,
    select: {
      deliverySheetId: true,
      outcome: true,
      receivedBy: true,
      deliveredAt: true,
      notes: true,
      podPhotoUrl: true,
      podPhotoAt: true,
      deliverySheet: {
        select: {
          sheetNo: true,
          manifest: {
            select: { id: true, manifestNo: true, branchId: true },
          },
        },
      },
    },
  });
}
