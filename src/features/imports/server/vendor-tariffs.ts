import "server-only";

import type { AccessActor } from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { idSet, invalid, readRows, workbook } from "@/lib/excel/import-sheet";

/**
 * Provider vendor price list (owner supplied 2026-11-27): import columns of
 * pricelist.xls, export layout of "TARIF - <vendor>.xls". Asal and Tujuan are
 * LMS branches. A flat price fills Next Tarif only.
 */
export const VENDOR_TARIFF_COLUMNS = [
  "Unique",
  "ID Vendor",
  "Service",
  "Moda By",
  "Asal",
  "Tujuan",
  "Min KG",
  "Tarif Pertama",
  "Next Tarif / Harga Flat",
  "Lead Time",
];
const live = { deletedAt: null };

export function parseVendorTariffFile(bytes: Uint8Array) {
  const seen = new Set<number>();
  return readRows(bytes, VENDOR_TARIFF_COLUMNS).map((r) => {
    const uniqueNo = r.required(r.whole(0), 0);
    if (seen.has(uniqueNo)) r.bad(`Unique ${uniqueNo} ganda di file.`);
    seen.add(uniqueNo);
    const minWeight = r.decimal(6) ?? null;
    const firstPrice = r.decimal(7) ?? null;
    if (!minWeight !== !firstPrice)
      r.bad("Min KG dan Tarif Pertama diisi berdua atau kosong berdua.");
    return {
      line: r.line,
      uniqueNo,
      vendorId: r.required(r.whole(1), 1),
      deliveryServiceId: r.required(r.whole(2), 2),
      transportModeId: r.required(r.whole(3), 3),
      originBranchId: r.required(r.whole(4), 4),
      destinationBranchId: r.required(r.whole(5), 5),
      minWeight,
      firstPrice,
      nextPrice: r.required(r.decimal(8), 8),
      leadTimeDays: r.whole(9) ?? null,
    };
  });
}

/** All rows or none; an existing Unique is updated. */
export async function importVendorTariffs(
  actor: AccessActor,
  bytes: Uint8Array,
) {
  assertPermission(actor, "update", "vendor");
  const rows = parseVendorTariffFile(bytes);
  return prisma.$transaction(
    async (tx) => {
      const select = { id: true } as const;
      const [vendors, services, modes, branches] = await Promise.all([
        tx.vendor.findMany({ where: live, select }),
        tx.deliveryService.findMany({ where: live, select }),
        tx.transportMode.findMany({ where: live, select }),
        tx.branch.findMany({ where: live, select }),
      ]);
      const [vendor, service, mode, branch] = [
        vendors,
        services,
        modes,
        branches,
      ].map(idSet);
      for (const { line, ...data } of rows) {
        const missing = !vendor.has(data.vendorId)
          ? "ID Vendor"
          : !service.has(data.deliveryServiceId)
            ? "Service"
            : !mode.has(data.transportModeId)
              ? "Moda By"
              : !branch.has(data.originBranchId)
                ? "Asal"
                : !branch.has(data.destinationBranchId)
                  ? "Tujuan"
                  : null;
        if (missing) invalid(`Baris ${line}: ${missing} tidak ditemukan.`);
        await tx.vendorTariff.upsert({
          where: { uniqueNo: data.uniqueNo },
          create: data,
          update: { ...data, deletedAt: null },
        });
      }
      return `${rows.length} baris tarif vendor disimpan.`;
    },
    { timeout: 60_000 },
  );
}

export async function vendorTariffOptions(actor: AccessActor) {
  assertPermission(actor, "view", "vendor");
  const [vendors, last] = await Promise.all([
    prisma.vendor.findMany({
      where: live,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.vendorTariff.aggregate({ _max: { uniqueNo: true } }),
  ]);
  return { vendors, lastUniqueNo: last._max.uniqueNo ?? 0 };
}

export async function vendorTariffTemplate(actor: AccessActor) {
  assertPermission(actor, "update", "vendor");
  const pick = { id: true, name: true } as const;
  const order = { name: "asc" as const };
  const [vendors, services, modes, branches] = await Promise.all([
    prisma.vendor.findMany({ where: live, select: pick, orderBy: order }),
    prisma.deliveryService.findMany({
      where: live,
      select: pick,
      orderBy: order,
    }),
    prisma.transportMode.findMany({
      where: live,
      select: pick,
      orderBy: order,
    }),
    prisma.branch.findMany({ where: live, select: pick, orderBy: order }),
  ]);
  return workbook(
    [VENDOR_TARIFF_COLUMNS],
    [
      ["ID Vendor", vendors],
      ["Service", services],
      ["Moda By", modes],
      ["Asal / Tujuan (Cabang)", branches],
    ],
  );
}

export async function vendorTariffExport(actor: AccessActor, vendorId: number) {
  assertPermission(actor, "view", "vendor");
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, ...live },
    select: { name: true },
  });
  if (!vendor)
    throw new IdentityError("NOT_FOUND", 404, "Vendor tidak ditemukan.");
  const rows = await prisma.vendorTariff.findMany({
    where: { vendorId, ...live },
    include: {
      deliveryService: { select: { name: true } },
      transportMode: { select: { name: true } },
      originBranch: { select: { name: true } },
      destinationBranch: { select: { name: true } },
    },
    orderBy: { uniqueNo: "asc" },
    take: 20_000,
  });
  const number = (v: { toString(): string } | null) =>
    v === null ? "" : Number(v.toString());
  return workbook([
    ["LIST TARIF"],
    [`VENDOR - ${vendor.name}`],
    [],
    [
      "NO.",
      "SERVICE",
      "ORIGIN",
      "DESTINATION",
      "MODA BY",
      "MIN KG (Kg)",
      "PRICE KG 1 (Rp)",
      "NEXT TARIF (Rp)",
      "LEADTIME (DAYS)",
    ],
    ...rows.map((r, index) => [
      index + 1,
      r.deliveryService.name,
      r.originBranch.name,
      r.destinationBranch.name,
      r.transportMode.name,
      number(r.minWeight),
      number(r.firstPrice),
      number(r.nextPrice),
      r.leadTimeDays ?? "",
    ]),
  ]);
}
