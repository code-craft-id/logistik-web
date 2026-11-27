import "server-only";

import * as XLSX from "xlsx";
import type { AccessActor } from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { readable, writableBranch } from "./parties";

/**
 * Template Import Tarif Customers with the provider's columns (owner supplied
 * 2026-11-27) for Tarif/Kg, Tarif/Koli and Trucking. For trucking, Service ID
 * is an LMS trucking type. Tujuan is an LMS branch. In the provider file the id of Asal sits
 * in column H although its header reads the other way round.
 */
export type TariffPricing = "KG" | "KOLI" | "TRUCKING";
export const tariffPricing = (v: unknown): TariffPricing =>
  v === "KOLI" || v === "TRUCKING" ? v : "KG";
export const tariffLabel = {
  KG: "Tarif/Kg",
  KOLI: "Tarif/Koli",
  TRUCKING: "Trucking",
} as const;

const lead = [
  "Unique",
  "ID Customer",
  "Service",
  "Service ID",
  "Moda By",
  "Moda ID",
  "Asal Code (Branch Office)",
  "Asal (Branch Office)",
  "Tujuan",
  "Tujuan Code",
];
export const tariffColumns = (pricing: TariffPricing) =>
  pricing === "KG"
    ? [...lead, "MinKg", "Tarif Pertama", "Tarif Selanjutnya", "Lead Time"]
    : [
        ...lead,
        pricing === "KOLI" ? "Tarif Koli" : "Tarif Trucking",
        "Lead Time",
      ];

export const TARIFF_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 1000;
const invalid = (message: string): never => {
  throw new IdentityError("INVALID_IMPORT", 400, message);
};
const text = (v: unknown) => {
  const t = v === undefined || v === null ? "" : String(v).trim();
  return t.startsWith("#N/A") ? "" : t;
};

export function parseTariffFile(bytes: Uint8Array, pricing: TariffPricing) {
  let rows: unknown[][] = [];
  try {
    const book = XLSX.read(bytes, { type: "array" });
    rows = XLSX.utils.sheet_to_json<unknown[]>(
      book.Sheets[book.SheetNames[0]],
      { header: 1 },
    );
  } catch {
    invalid("File Excel tidak terbaca.");
  }
  const columns = tariffColumns(pricing);
  const headerAt = rows
    .slice(0, 10)
    .findIndex((r) => columns.every((c, i) => text(r?.[i]) === c));
  if (headerAt < 0)
    invalid(`Judul kolom tidak cocok dengan Template ${tariffLabel[pricing]}.`);
  const seen = new Set<number>();
  const result = [];
  for (const [index, r] of rows.slice(headerAt + 1).entries()) {
    if (!r || (!text(r[0]) && !text(r[1]))) continue;
    const line = headerAt + index + 2;
    const whole = (i: number) => {
      const t = text(r[i]);
      if (!/^[1-9]\d{0,8}$/.test(t))
        invalid(`Baris ${line}: ${columns[i]} harus angka bulat.`);
      return Number(t);
    };
    const money = (i: number) => {
      const t = text(r[i]);
      if (!/^\d{1,12}(\.\d{1,2})?$/.test(t))
        invalid(`Baris ${line}: ${columns[i]} harus angka.`);
      return t;
    };
    const days = columns.length - 1;
    const item = {
      line,
      uniqueNo: whole(0),
      customerId: whole(1),
      deliveryServiceId: pricing === "TRUCKING" ? null : whole(3),
      truckingTypeId: pricing === "TRUCKING" ? whole(3) : null,
      transportModeId: whole(5),
      originBranchId: whole(7),
      destinationBranchId: whole(9),
      minWeight: pricing === "KG" ? money(10) : null,
      price: money(pricing === "KG" ? 11 : 10),
      nextPrice: pricing === "KG" ? money(12) : null,
      leadTimeDays: text(r[days]) ? whole(days) : null,
    };
    if (seen.has(item.uniqueNo))
      invalid(`Baris ${line}: Unique ${item.uniqueNo} ganda di file.`);
    seen.add(item.uniqueNo);
    result.push(item);
    if (result.length > MAX_ROWS)
      invalid(`Maksimal ${MAX_ROWS} baris per file.`);
  }
  if (!result.length) invalid("File tidak berisi data.");
  return result;
}

const live = { deletedAt: null };

/** All rows or none; an existing Unique is updated. */
export async function importCustomerTariffs(
  actor: AccessActor,
  pricing: TariffPricing,
  bytes: Uint8Array,
) {
  assertPermission(actor, "update", "customer");
  const rows = parseTariffFile(bytes, pricing);
  const ids = (key: keyof (typeof rows)[number]) => ({
    id: { in: [...new Set(rows.map((r) => Number(r[key])))] },
    ...live,
  });
  return prisma.$transaction(
    async (tx) => {
      const select = { id: true } as const;
      const [customers, services, modes, branches, existing] =
        await Promise.all([
          tx.customer.findMany({
            where: ids("customerId"),
            select: { id: true, branchId: true },
          }),
          (pricing === "TRUCKING"
            ? tx.truckingType
            : (tx.deliveryService as unknown as typeof tx.truckingType)
          ).findMany({
            where: ids(
              pricing === "TRUCKING" ? "truckingTypeId" : "deliveryServiceId",
            ),
            select,
          }),
          tx.transportMode.findMany({
            where: ids("transportModeId"),
            select,
          }),
          tx.branch.findMany({
            where: {
              ...live,
              id: {
                in: rows.flatMap((r) => [
                  r.originBranchId,
                  r.destinationBranchId,
                ]),
              },
            },
            select,
          }),
          tx.customerTariff.findMany({
            where: { pricing, uniqueNo: { in: rows.map((r) => r.uniqueNo) } },
            select: {
              uniqueNo: true,
              customer: { select: { branchId: true } },
            },
          }),
        ]);
      const branchOf = new Map(customers.map((c) => [c.id, c.branchId]));
      const known = (list: { id: number }[]) => new Set(list.map((x) => x.id));
      const [service, mode, branch] = [services, modes, branches].map(known);
      // A Unique may not move another branch's tariff to this actor.
      for (const row of existing) writableBranch(actor, row.customer.branchId);
      for (const { line, ...data } of rows) {
        const missing = !branchOf.has(data.customerId)
          ? "ID Customer"
          : !service.has(Number(data.deliveryServiceId ?? data.truckingTypeId))
            ? "Service ID"
            : !mode.has(data.transportModeId)
              ? "Moda ID"
              : !branch.has(data.originBranchId)
                ? "Asal"
                : !branch.has(data.destinationBranchId)
                  ? "Tujuan Code"
                  : null;
        if (missing) invalid(`Baris ${line}: ${missing} tidak ditemukan.`);
        writableBranch(actor, branchOf.get(data.customerId));
        await tx.customerTariff.upsert({
          where: {
            pricing_uniqueNo: { pricing, uniqueNo: data.uniqueNo },
          },
          create: { pricing, ...data },
          update: { ...data, deletedAt: null },
        });
      }
      return rows.length;
    },
    { timeout: 60_000 },
  );
}

const include = {
  customer: { select: { name: true } },
  deliveryService: { select: { name: true } },
  truckingType: { select: { name: true } },
  transportMode: { select: { name: true } },
  originBranch: { select: { name: true } },
  destinationBranch: { select: { name: true } },
} as const;

export async function listCustomerTariffs(
  actor: AccessActor,
  pricing: TariffPricing,
  customerId?: number,
  take = 500,
) {
  assertPermission(actor, "view", "customer");
  const where = {
    pricing,
    ...live,
    customer: { ...live, ...readable(actor) },
    ...(customerId ? { customerId } : {}),
  };
  const [rows, last] = await Promise.all([
    prisma.customerTariff.findMany({
      where,
      include,
      orderBy: { uniqueNo: "asc" },
      take,
    }),
    // Numbering is shared by everyone, so the last Unique ignores scope.
    prisma.customerTariff.aggregate({
      where: { pricing },
      _max: { uniqueNo: true },
    }),
  ]);
  return { rows, lastUniqueNo: last._max.uniqueNo ?? 0 };
}

type Row = Awaited<ReturnType<typeof listCustomerTariffs>>["rows"][number];
export const serviceName = (r: Row) =>
  r.deliveryService?.name ?? r.truckingType?.name ?? "";
const fileRow = (r: Row) => [
  r.uniqueNo,
  r.customerId,
  serviceName(r),
  r.deliveryServiceId ?? r.truckingTypeId,
  r.transportMode.name,
  r.transportModeId,
  r.originBranch.name,
  r.originBranchId,
  r.destinationBranch.name,
  r.destinationBranchId,
  ...(r.pricing === "KG"
    ? [Number(r.minWeight), Number(r.price), Number(r.nextPrice)]
    : [Number(r.price)]),
  r.leadTimeDays ?? "",
];

/** Template (header only) or Export Tarif (same layout, so it re-imports). */
export async function tariffWorkbook(
  actor: AccessActor,
  pricing: TariffPricing,
  withData: boolean,
  customerId?: number,
) {
  assertPermission(actor, withData ? "view" : "update", "customer");
  const rows = withData
    ? (await listCustomerTariffs(actor, pricing, customerId, 20_000)).rows
    : [];
  const pick = { id: true, name: true } as const;
  const order = { name: "asc" as const };
  const [customers, services, modes, branches] = await Promise.all([
    prisma.customer.findMany({
      where: { ...live, ...readable(actor) },
      select: pick,
      orderBy: order,
    }),
    pricing === "TRUCKING"
      ? prisma.truckingType.findMany({
          where: live,
          select: pick,
          orderBy: order,
        })
      : prisma.deliveryService.findMany({
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
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Template Import Tarif Customers"],
    tariffColumns(pricing),
    ...rows.map(fileRow),
  ]);
  sheet["!cols"] = tariffColumns(pricing).map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(book, sheet, "Tarif");
  const lists: [string, { id: number; name: string }[]][] = [
    ["ID Customer", customers],
    ["Service ID", services],
    ["Moda ID", modes],
    ["Asal / Tujuan (Cabang)", branches],
  ];
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["Daftar", "Nama", "ID"],
      ...lists.flatMap(([title, list]) =>
        list.map((x) => [title, x.name, x.id]),
      ),
    ]),
    "Keterangan",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
