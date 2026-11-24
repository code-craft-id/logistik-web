import "server-only";

import {
  type AccessActor,
  permitsBranch,
} from "@/features/identity/permissions";
import { IdentityError } from "@/features/identity/server/access";
import { chargeAgentForAwb } from "@/features/organization/server/agent-deposit";
import { enqueueWhatsApp } from "@/features/whatsapp/server/notifications";
import { prisma } from "@/lib/db";
import type { Transaction } from "@/lib/db/generated/client";
import { Prisma } from "@/lib/db/generated/client";
import {
  type CreateBookingInput,
  type CreateTransactionInput,
  createBookingSchema,
  createTransactionSchema,
  type UpdateTransactionStatusInput,
  updateTransactionStatusSchema,
} from "../schemas";
import { ALLOWED_TRANSITIONS } from "../status";

type TxClient = Prisma.TransactionClient;

type Money = Prisma.Decimal;
const dec = (v: string | null | undefined) =>
  v == null || v.trim() === "" ? null : new Prisma.Decimal(v);

function yearMonthInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) throw new Error("INVALID_NUMBER_DATE");
  return `${year.slice(-2)}${month}`;
}

type DimensionRow = NonNullable<
  CreateTransactionInput["dimensionRows"]
>[number];
type DimensionTotals = {
  kilo: string | null;
  volume: string | null;
  chargeableWeight: string;
  packingFee: string;
};

export function calculateDimensionTotals(
  rows: DimensionRow[],
  dividerText: string | null | undefined,
  koli: number | null | undefined,
): DimensionTotals {
  if (!koli || koli < 1 || rows.length !== koli)
    throw new Error("VALIDATION_DIMENSION_KOLI");
  const divider = dec(dividerText);
  let totalKilo = new Prisma.Decimal(0);
  let totalVolume = new Prisma.Decimal(0);
  let totalChargeable = new Prisma.Decimal(0);
  let totalPacking = new Prisma.Decimal(0);

  for (const row of rows) {
    const sides = [row.length, row.width, row.height].map(
      (value) => dec(value) ?? new Prisma.Decimal(0),
    );
    const anySide = sides.some((value) => value.gt(0));
    const allSides = sides.every((value) => value.gt(0));
    if (anySide && !allSides) throw new Error("VALIDATION_DIMENSION_FIELDS");
    if (anySide && (!divider || !divider.gt(0)))
      throw new Error("VALIDATION_MODE_DIVIDER");

    const kilo = dec(row.kilo) ?? new Prisma.Decimal(0);
    if (!allSides && !kilo.gt(0))
      throw new Error("VALIDATION_DIMENSION_FIELDS");
    const volume = allSides
      ? sides[0]
          .times(sides[1])
          .times(sides[2])
          .div(divider as Money)
      : new Prisma.Decimal(0);
    totalKilo = totalKilo.plus(kilo);
    totalVolume = totalVolume.plus(volume);
    totalChargeable = totalChargeable.plus(Prisma.Decimal.max(volume, kilo));
    if (row.packed)
      totalPacking = totalPacking.plus(
        dec(row.packing) ?? new Prisma.Decimal(0),
      );
  }

  const kilo = totalKilo.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const volume = totalVolume.toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);
  const chargeable = totalChargeable.toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
  const packing = totalPacking.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  return {
    kilo: kilo.gt(0) ? kilo.toFixed(2) : null,
    volume: volume.gt(0) ? volume.toFixed(3) : null,
    chargeableWeight: chargeable.toFixed(2),
    packingFee: packing.toFixed(0),
  };
}

/**
 * Entry AWB pricing as observed in the legacy form (rules pending finance
 * confirmation): Terberat = max(Berat, Volume). Freight by Pricing Type:
 * KG = max(Terberat, Min KG) x Harga; KOLI = Koli x Harga; TRUCKING = Harga.
 * Total Biaya = freight + Biaya Lain + Packing + Pickup + Biaya Asuransi +
 * Biaya COD (owner decision D-35); Grand Total = (Total - Discount%) + PPN% of the discounted amount,
 * each step rounded half-up to 2 decimals. Grand Total is stored as `biaya`.
 * Without Harga/Kg the typed Biaya is kept (legacy "Ganti Harga").
 */
export function priceAwb(input: {
  pricingType?: "KG" | "KOLI" | "TRUCKING" | null;
  koli?: number | null;
  kilo?: string | null;
  volume?: string | null;
  /** Terberat from Dimensi: per-koli max(volume, berat), summed. */
  chargeableWeight?: string | null;
  dimensionRows?: DimensionRow[];
  modeDivider?: string | null;
  pricePerKg?: string | null;
  minWeight?: string | null;
  otherFee?: string | null;
  packingFee?: string | null;
  pickupFee?: string | null;
  insuranceFee?: string | null;
  codFee?: string | null;
  discountPercent?: string | null;
  ppnPercent?: string | null;
  biaya?: string | null;
}) {
  const dimensions = input.dimensionRows?.length
    ? calculateDimensionTotals(
        input.dimensionRows,
        input.modeDivider,
        input.koli,
      )
    : null;
  if (input.chargeableWeight && !dimensions)
    throw new Error("VALIDATION_CHARGEABLE_WEIGHT");
  const kilo = dec(dimensions?.kilo ?? input.kilo);
  const volume = dec(dimensions?.volume ?? input.volume);
  const totals: Money | null =
    kilo && volume ? Prisma.Decimal.max(kilo, volume) : (kilo ?? volume);
  const heaviest: Money | null = dimensions
    ? new Prisma.Decimal(dimensions.chargeableWeight)
    : totals;
  const packingFee = dimensions?.packingFee ?? input.packingFee;
  const price = dec(input.pricePerKg);
  if (!price) {
    return {
      kilo: kilo?.toFixed(2) ?? null,
      volume: volume?.toFixed(3) ?? null,
      packingFee: packingFee ?? null,
      chargeableWeight: heaviest?.toFixed(2) ?? null,
      totalCost: null,
      biaya: input.biaya ?? null,
    };
  }
  const round = (v: Money) =>
    v.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const zero = new Prisma.Decimal(0);
  const freight =
    input.pricingType === "TRUCKING"
      ? price
      : input.pricingType === "KOLI"
        ? price.times(input.koli ?? 0)
        : Prisma.Decimal.max(
            heaviest ?? zero,
            dec(input.minWeight) ?? zero,
          ).times(price);
  const total = round(
    freight
      .plus(dec(input.otherFee) ?? zero)
      .plus(dec(packingFee) ?? zero)
      .plus(dec(input.pickupFee) ?? zero)
      .plus(dec(input.insuranceFee) ?? zero)
      .plus(dec(input.codFee) ?? zero),
  );
  const discount = round(
    total.times(dec(input.discountPercent) ?? zero).div(100),
  );
  const afterDiscount = total.minus(discount);
  const ppn = round(
    afterDiscount.times(dec(input.ppnPercent) ?? zero).div(100),
  );
  return {
    kilo: kilo?.toFixed(2) ?? null,
    volume: volume?.toFixed(3) ?? null,
    packingFee: packingFee ?? null,
    chargeableWeight: heaviest?.toFixed(2) ?? null,
    totalCost: total.toFixed(2),
    biaya: afterDiscount.plus(ppn).toFixed(2),
  };
}

/**
 * Next document number for a branch: prefix + YYMM + a 5-digit running
 * number. Both AWB and booking numbers use the Asia/Jakarta calendar. The
 * branch row lock serializes concurrent numbering.
 */
async function nextNumber(
  tx: TxClient,
  kind: "awb" | "booking",
  branchId: number,
  date: Date,
  lock: boolean,
) {
  const rows = lock
    ? await tx.$queryRaw<{ code: string }[]>`
        SELECT code FROM branches WHERE id = ${branchId} FOR UPDATE`
    : await tx.$queryRaw<{ code: string }[]>`
        SELECT code FROM branches WHERE id = ${branchId}`;
  const code =
    (rows[0]?.code ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10) || `C${branchId}`;
  const yymm = yearMonthInTimeZone(date, "Asia/Jakarta");
  const prefix = kind === "booking" ? `B-${code}${yymm}` : `${code}${yymm}`;
  const start = prefix.length + 1;
  const found =
    kind === "booking"
      ? await tx.$queryRaw<{ max: number | null }[]>`
          SELECT max(CASE WHEN substring(booking_no FROM ${start}::int) ~ '^[0-9]{1,9}$'
                          THEN substring(booking_no FROM ${start}::int)::int END) AS max
          FROM bookings
          WHERE branch_id = ${branchId} AND booking_no LIKE ${`${prefix}%`}`
      : await tx.$queryRaw<{ max: number | null }[]>`
          SELECT max(CASE WHEN substring(awb_no FROM ${start}::int) ~ '^[0-9]{1,9}$'
                          THEN substring(awb_no FROM ${start}::int)::int END) AS max
          FROM transactions
          WHERE origin_branch_id = ${branchId} AND awb_no LIKE ${`${prefix}%`}`;
  return `${prefix}${String((found[0]?.max ?? 0) + 1).padStart(5, "0")}`;
}

/**
 * Next automatic booking number, e.g. B-JKT261100001 (the provider shows
 * B-JKT26485800001: "B-" + branch code + year; its middle digits are not
 * documented, so YYMM is used as for AWBs).
 */
export function nextBookingNo(
  tx: TxClient,
  branchId: number,
  date: Date,
  { lock = true }: { lock?: boolean } = {},
) {
  return nextNumber(tx, "booking", branchId, date, lock);
}

/**
 * Next automatic AWB number for a branch: branch code + YYMM
 * (Asia/Jakarta) + a 5-digit running number, e.g. JKT261100001. The project
 * owner approved the system-wide timezone basis; Dev 2 agreed for AWB.
 * The branch row lock serializes concurrent numbering for one branch.
 */
export async function nextAwbNo(
  tx: TxClient,
  branchId: number,
  date: Date,
  { lock = true }: { lock?: boolean } = {},
) {
  return nextNumber(tx, "awb", branchId, date, lock);
}

export async function createBooking(
  input: CreateBookingInput,
  actor: AccessActor,
) {
  const data = createBookingSchema.parse(input);
  const { isAdministrator } = await import("@/features/identity/permissions");
  let branchId = data.branchId;
  if (branchId == null) {
    if (isAdministrator(actor)) {
      throw new IdentityError(
        "FORBIDDEN_BRANCH",
        403,
        "Cabang tujuan wajib diisi untuk administrator.",
      );
    }
    if (!actor.branchIds || actor.branchIds.length === 0) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    branchId = actor.branchIds[0];
  }
  if (!branchId || !Number.isSafeInteger(branchId) || branchId <= 0) {
    throw new IdentityError(
      "FORBIDDEN_BRANCH",
      403,
      "Cabang tujuan tidak valid.",
    );
  }
  if (!permitsBranch(actor, branchId)) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  return prisma.$transaction(async (tx: TxClient) => {
    if (data.customerId) {
      const customer = await tx.customer.findFirst({
        where: {
          id: data.customerId,
          deletedAt: null,
          ...(isAdministrator(actor)
            ? {}
            : {
                OR: [{ branchId: { in: actor.branchIds } }, { branchId: null }],
              }),
        },
      });
      if (!customer) {
        throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }
    }

    // Same master rules as Entry AWB: active masters, branch-scoped parties.
    const scopedParty = isAdministrator(actor)
      ? {}
      : { OR: [{ branchId: { in: actor.branchIds } }, { branchId: null }] };
    if (data.consigneeId) {
      const found = await tx.consignee.findFirst({
        where: { id: data.consigneeId, deletedAt: null, ...scopedParty },
        select: { id: true },
      });
      if (!found) throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    if (data.courierId) {
      const courier = await tx.courier.findFirst({
        where: { id: data.courierId, deletedAt: null, status: "ACTIVE" },
        select: { branchId: true },
      });
      if (
        !courier ||
        (courier.branchId !== null && courier.branchId !== branchId)
      )
        throw new Error("VALIDATION_COURIER_BRANCH");
    }
    let destinationName: string | null = data.destination ?? null;
    if (data.destinationBranchId) {
      const destination = await tx.branch.findFirst({
        where: { id: data.destinationBranchId, deletedAt: null },
        select: { name: true },
      });
      if (!destination) throw new Error("VALIDATION_MASTER_NOT_FOUND");
      // Kept in the free-text column too (Inbound Booking, older rows).
      destinationName = destination.name;
    }
    for (const [id, model] of [
      [data.transportModeId, tx.transportMode],
      [data.deliveryServiceId, tx.deliveryService],
      [data.goodsTypeId, tx.goodsType],
      [data.costTypeId, tx.costType],
    ] as const) {
      if (!id) continue;
      const found = await (
        model as unknown as {
          findFirst: (a: unknown) => Promise<{ id: number } | null>;
        }
      ).findFirst({
        where: { id, deletedAt: null, status: "ACTIVE" },
        select: { id: true },
      });
      if (!found) throw new Error("VALIDATION_MASTER_NOT_FOUND");
    }
    const dimensionMode = data.dimensionRows?.length
      ? await tx.transportMode.findFirst({
          where: {
            id: data.transportModeId ?? -1,
            deletedAt: null,
            status: "ACTIVE",
          },
          select: { divider: true },
        })
      : null;
    // Booking price as on the provider form: Harga/Kg x max(Terberat, Min
    // KG); "Ganti Harga" keeps the typed Grand Total.
    const priced = priceAwb({
      pricingType: "KG",
      kilo: data.kilo ?? null,
      volume: data.volume ?? null,
      chargeableWeight: data.chargeableWeight ?? null,
      dimensionRows: data.dimensionRows,
      modeDivider: dimensionMode?.divider,
      pricePerKg: data.pricePerKg ?? null,
      minWeight: data.minWeight ?? null,
      biaya: data.biaya ?? null,
    });

    let bookingNo = data.bookingNo?.trim() || null;
    if (!bookingNo && data.autoBookingNo)
      bookingNo = await nextBookingNo(
        tx,
        branchId,
        data.bookingDate ?? new Date(),
      );
    else if (bookingNo) {
      // Typed numbers must be unique within the branch.
      await tx.$queryRaw`SELECT id FROM branches WHERE id = ${branchId} FOR UPDATE`;
      const used = await tx.booking.count({
        where: { branchId, bookingNo, deletedAt: null },
      });
      if (used) throw new Error("BOOKING_NO_CONFLICT");
    }
    return tx.booking.create({
      data: {
        bookingNo,
        bookingDate: data.bookingDate,
        branchId,
        customerId: data.customerId ?? null,
        senderName: data.senderName ?? null,
        receiverName: data.receiverName ?? null,
        doNo: data.doNo ?? null,
        destination: destinationName,
        destinationBranchId: data.destinationBranchId ?? null,
        senderAddress: data.senderAddress ?? null,
        senderPhone: data.senderPhone ?? null,
        consigneeId: data.consigneeId ?? null,
        receiverAddress: data.receiverAddress ?? null,
        receiverPhone: data.receiverPhone ?? null,
        deliveryServiceId: data.deliveryServiceId ?? null,
        goodsTypeId: data.goodsTypeId ?? null,
        transportModeId: data.transportModeId ?? null,
        costTypeId: data.costTypeId ?? null,
        description: data.description ?? null,
        remarks: data.remarks ?? null,
        koli: data.koli ?? null,
        kilo: priced.kilo,
        volume: priced.volume,
        chargeableWeight: priced.chargeableWeight,
        pricePerKg: data.pricePerKg ?? null,
        minWeight: data.minWeight ?? null,
        totalCost: priced.totalCost,
        biaya: priced.biaya,
        ...(data.courierId
          ? {
              courierId: data.courierId,
              assignedAt: new Date(),
              assignedById: actor.id,
            }
          : {}),
        createdById: actor.id,
      },
    });
  });
}

function normalizeDecimal(v: unknown) {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    // Normalize by removing unnecessary trailing zeros
    if (t.includes(".")) {
      const [intPart, fracPart] = t.split(".");
      const fracTrimmed = fracPart.replace(/0+$/, "");
      return fracTrimmed.length === 0
        ? intPart || "0"
        : `${intPart}.${fracTrimmed}`;
    }
    return t;
  }
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return null;
    return v.toString();
  }
  if (typeof v === "object" && v !== null && "toString" in v) {
    const s = (v as { toString: () => string }).toString();
    // Try to normalize decimal string representation
    try {
      // Basic normalization
      if (s.includes(".")) {
        const [intPart, fracPart] = s.split(".");
        const fracTrimmed = fracPart.replace(/0+$/, "");
        return fracTrimmed.length === 0
          ? intPart || "0"
          : `${intPart}.${fracTrimmed}`;
      }
      return s;
    } catch {
      return s;
    }
  }
  return String(v);
}

function normalizeAwbValue(v: unknown): string | null | undefined {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    return t;
  }
  return undefined;
}

function normalizeDateValue(v: unknown) {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString();
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return t;
    return d.toISOString();
  }
  if (typeof v === "number") {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toISOString();
  }
  if (typeof v === "object" && v !== null && "toISOString" in v) {
    try {
      const d = v as Date;
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function hasExplicitTransactionDate(input: unknown) {
  if (!input || typeof input !== "object") return false;
  if (!Object.hasOwn(input, "transactionDate")) return false;
  const v = (input as Record<string, unknown>).transactionDate;
  if (v === undefined || v === null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  return true;
}

function payloadMatchesExisting(
  existing: Record<string, unknown>,
  data: Record<string, unknown>,
  opts?: { explicitTransactionDate?: boolean },
) {
  // Compare key fields that define the business payload; ignore server-set fields
  const fields = [
    "bookingId",
    "awbNo",
    "doNo",
    "senderName",
    "receiverName",
    "originBranchId",
    "destinationBranchId",
    "courierId",
    "customerId",
    "transportModeId",
    "deliveryServiceId",
    "goodsTypeId",
    "costTypeId",
    "description",
    "remarks",
  ];
  for (const f of fields) {
    const a = existing[f];
    const b = f === "awbNo" ? normalizeAwbValue(data[f]) : data[f];
    if (f === "awbNo") {
      // A retried automatic-number request matches the number it was given.
      if (b == null && data.autoAwb === true) continue;
      if (a === b) continue;
      if (a == null && b == null) continue;
      if (String(a ?? null) !== String(b ?? null)) {
        return false;
      }
      continue;
    }
    if (a === b) continue;
    if (a == null && b == null) continue;
    if (a == null && b === undefined) continue;
    if (b == null && a === undefined) continue;
    // Normalize numbers
    if (typeof a === "number" && typeof b === "number" && a === b) continue;
    if (typeof a === "bigint" && typeof b === "bigint" && a === b) continue;
    if (String(a ?? null) !== String(b ?? null)) {
      return false;
    }
  }
  if (opts?.explicitTransactionDate) {
    const aDate = normalizeDateValue(existing.transactionDate);
    const bDate = normalizeDateValue(data.transactionDate);
    if (aDate !== bDate) {
      return false;
    }
  }
  // Compare koli with server default 0
  const aKoli = existing.koli ?? 0;
  const bKoli = data.koli ?? 0;
  if (Number(aKoli) !== Number(bKoli)) {
    return false;
  }
  // Compare decimals as normalized strings
  const decFields = [
    "kilo",
    "volume",
    "chargeableWeight",
    "packingFee",
    "insuranceFee",
    "codFee",
    "totalCost",
    "biaya",
  ];
  for (const f of decFields) {
    const aNorm = normalizeDecimal(existing[f]);
    const bNorm = normalizeDecimal(data[f]);
    if (aNorm !== bNorm) return false;
  }
  return true;
}

export async function createTransaction(
  input: CreateTransactionInput,
  actor: AccessActor,
): Promise<
  | { transaction: Transaction; created: true; idempotent: false }
  | {
      transaction: Transaction;
      created: false;
      idempotent: true;
      matchedBy?: string;
    }
> {
  const parsed = createTransactionSchema.parse(input);
  const data: CreateTransactionInput = parsed;
  const normalizedAwb = normalizeAwbValue(data.awbNo);
  data.awbNo = normalizedAwb;
  const explicitTransactionDate = hasExplicitTransactionDate(input);
  const { isAdministrator } = await import("@/features/identity/permissions");
  if (
    !data.originBranchId ||
    !Number.isSafeInteger(data.originBranchId) ||
    data.originBranchId <= 0
  ) {
    throw new IdentityError(
      "FORBIDDEN_BRANCH",
      403,
      "Cabang asal wajib diisi dan tidak valid.",
    );
  }
  if (data.destinationBranchId != null) {
    if (
      !Number.isSafeInteger(data.destinationBranchId) ||
      data.destinationBranchId <= 0
    ) {
      throw new IdentityError(
        "FORBIDDEN_BRANCH",
        403,
        "Cabang tujuan tidak valid.",
      );
    }
  }
  if (isAdministrator(actor)) {
    if (!permitsBranch(actor, data.originBranchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    if (
      data.destinationBranchId &&
      !permitsBranch(actor, data.destinationBranchId)
    ) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
  } else {
    if (!actor.branchIds || actor.branchIds.length === 0) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    if (!permitsBranch(actor, data.originBranchId)) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
    if (
      data.destinationBranchId &&
      !permitsBranch(actor, data.destinationBranchId)
    ) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }
  }

  let matchPayload: Record<string, unknown> = data;
  try {
    return await prisma.$transaction(async (tx: TxClient) => {
      const { isAdministrator } = await import(
        "@/features/identity/permissions"
      );
      if (data.bookingId) {
        const booking = await tx.booking.findFirst({
          where: {
            id: data.bookingId,
            deletedAt: null,
            ...(isAdministrator(actor)
              ? {}
              : {
                  OR: [
                    { branchId: { in: actor.branchIds } },
                    { branchId: null },
                  ],
                }),
          },
        });
        if (!booking) {
          throw new IdentityError("FORBIDDEN_BRANCH", 403);
        }
      }
      if (data.courierId) {
        const courier = await tx.courier.findFirst({
          where: {
            id: data.courierId,
            deletedAt: null,
            ...(isAdministrator(actor)
              ? {}
              : {
                  OR: [
                    { branchId: { in: actor.branchIds } },
                    { branchId: null },
                  ],
                }),
          },
        });
        if (!courier) {
          throw new IdentityError("FORBIDDEN_BRANCH", 403);
        }
      }

      // Legacy Entry AWB capture: referenced masters must exist and be usable.
      if (data.customerId) {
        const customer = await tx.customer.findFirst({
          where: {
            id: data.customerId,
            deletedAt: null,
            ...(isAdministrator(actor)
              ? {}
              : {
                  OR: [
                    { branchId: { in: actor.branchIds } },
                    { branchId: null },
                  ],
                }),
          },
          select: { id: true },
        });
        if (!customer) throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }
      const scoped = (id: number | undefined | null) =>
        id
          ? {
              id,
              deletedAt: null,
              ...(isAdministrator(actor)
                ? {}
                : {
                    OR: [
                      { branchId: { in: actor.branchIds } },
                      { branchId: null },
                    ],
                  }),
            }
          : null;
      for (const [where, model] of [
        [scoped(data.pickupCourierId), tx.courier],
        [scoped(data.marketingPersonId), tx.marketingPerson],
        [scoped(data.consigneeId), tx.consignee],
      ] as const) {
        if (!where) continue;
        const found = await (
          model as unknown as {
            findFirst: (a: unknown) => Promise<{ id: number } | null>;
          }
        ).findFirst({ where, select: { id: true } });
        if (!found) throw new IdentityError("FORBIDDEN_BRANCH", 403);
      }
      const masters = [
        [data.transportModeId, tx.transportMode],
        [data.deliveryServiceId, tx.deliveryService],
        [data.goodsTypeId, tx.goodsType],
        [data.costTypeId, tx.costType],
      ] as const;
      for (const [id, model] of masters) {
        if (!id) continue;
        const found = await (
          model as unknown as {
            findFirst: (a: unknown) => Promise<{ id: number } | null>;
          }
        ).findFirst({
          where: { id, deletedAt: null, status: "ACTIVE" },
          select: { id: true },
        });
        if (!found) throw new Error("VALIDATION_MASTER_NOT_FOUND");
      }

      const dimensionMode = data.dimensionRows?.length
        ? await tx.transportMode.findFirst({
            where: {
              id: data.transportModeId ?? -1,
              deletedAt: null,
              status: "ACTIVE",
            },
            select: { divider: true },
          })
        : null;
      const priced = priceAwb({
        ...data,
        modeDivider: dimensionMode?.divider,
      });
      matchPayload = { ...data, totalCost: priced.totalCost };
      data.kilo = priced.kilo;
      data.volume = priced.volume;
      data.chargeableWeight = priced.chargeableWeight;
      data.packingFee = priced.packingFee;
      data.biaya = priced.biaya;

      if (data.idempotencyKey) {
        const existingByKey = await tx.transaction.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (existingByKey) {
          if (
            !payloadMatchesExisting(existingByKey, matchPayload, {
              explicitTransactionDate,
            })
          ) {
            throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
          }
          return {
            transaction: existingByKey,
            created: false,
            idempotent: true,
          } as const;
        }
      }
      if (data.awbNo && data.originBranchId) {
        const existingByAwb = await tx.transaction.findFirst({
          where: {
            originBranchId: data.originBranchId,
            awbNo: data.awbNo,
            deletedAt: null,
          },
        });
        if (existingByAwb) {
          if (
            data.idempotencyKey &&
            existingByAwb.idempotencyKey &&
            existingByAwb.idempotencyKey !== data.idempotencyKey
          ) {
            throw new Error(
              "IDEMPOTENCY_CONFLICT_AWB_EXISTS_WITH_DIFFERENT_KEY",
            );
          }
          if (
            !payloadMatchesExisting(existingByAwb, matchPayload, {
              explicitTransactionDate,
            })
          ) {
            throw new Error("AWB_EXISTS_WITH_DIFFERENT_PAYLOAD");
          }
          return {
            transaction: existingByAwb,
            created: false,
            idempotent: true,
            matchedBy: "awb",
          } as const;
        }
        const existingByAwbAny = await tx.transaction.findFirst({
          where: {
            originBranchId: data.originBranchId,
            awbNo: data.awbNo,
          },
        });
        if (existingByAwbAny?.deletedAt) {
          throw new Error("AWB_ALREADY_USED");
        }
      }

      if (!data.awbNo && data.autoAwb) {
        data.awbNo = await nextAwbNo(
          tx,
          data.originBranchId,
          data.transactionDate ?? new Date(),
        );
      }
      const { status: _status, idempotencyKey, autoAwb: _auto, ...rest } = data;
      const created = await tx.transaction.create({
        data: {
          idempotencyKey: idempotencyKey ?? null,
          awbNo: rest.awbNo ?? null,
          bookingId: rest.bookingId ?? null,
          transactionDate: rest.transactionDate,
          doNo: rest.doNo ?? null,
          senderName: rest.senderName ?? null,
          receiverName: rest.receiverName ?? null,
          originBranchId: rest.originBranchId,
          destinationBranchId: rest.destinationBranchId ?? null,
          koli: rest.koli ?? null,
          kilo: rest.kilo ?? null,
          volume: rest.volume ?? null,
          biaya: priced.biaya,
          chargeableWeight: priced.chargeableWeight,
          totalCost: priced.totalCost,
          pickupCourierId: rest.pickupCourierId ?? null,
          marketingPersonId: rest.marketingPersonId ?? null,
          consigneeId: rest.consigneeId ?? null,
          senderAddress: rest.senderAddress ?? null,
          senderPhone: rest.senderPhone ?? null,
          receiverAddress: rest.receiverAddress ?? null,
          receiverPhone: rest.receiverPhone ?? null,
          pricingType: rest.pricingType ?? (rest.pricePerKg ? "KG" : null),
          pricePerKg: rest.pricePerKg ?? null,
          minWeight: rest.minWeight ?? null,
          insured: rest.insured ?? null,
          otherFee: rest.otherFee ?? null,
          packingFee: rest.packingFee ?? null,
          pickupFee: rest.pickupFee ?? null,
          goodsValue: rest.goodsValue ?? null,
          insuranceFee: rest.insuranceFee ?? null,
          codValue: rest.codValue ?? null,
          codFee: rest.codFee ?? null,
          pic1: rest.pic1 ?? null,
          pic2: rest.pic2 ?? null,
          leadTime: rest.leadTime ?? null,
          showPriceOnPrint: rest.showPriceOnPrint ?? null,
          discountPercent: rest.discountPercent ?? null,
          ppnPercent: rest.ppnPercent ?? null,
          courierId: rest.courierId ?? null,
          customerId: rest.customerId ?? null,
          transportModeId: rest.transportModeId ?? null,
          deliveryServiceId: rest.deliveryServiceId ?? null,
          goodsTypeId: rest.goodsTypeId ?? null,
          costTypeId: rest.costTypeId ?? null,
          agentId: rest.agentId ?? null,
          description: rest.description ?? null,
          remarks: rest.remarks ?? null,
          status: "Open",
          createdById: actor.id,
        },
      });
      await chargeAgentForAwb(tx, actor, created);
      await tx.transactionStatusHistory.create({
        data: {
          transactionId: created.id,
          priorStatus: null,
          newStatus: "Open",
          reason: "CREATED",
          actorId: actor.id,
        },
      });
      await enqueueWhatsApp(tx, ["TRX_SENDER", "TRX_RECEIVER"], created.id, {
        branchId: created.originBranchId,
      });
      return {
        transaction: created,
        created: true,
        idempotent: false,
      } as const;
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      if (data.idempotencyKey) {
        const existingByKey = await prisma.transaction.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (existingByKey) {
          if (
            !payloadMatchesExisting(existingByKey, matchPayload, {
              explicitTransactionDate,
            })
          ) {
            throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
          }
          return {
            transaction: existingByKey,
            created: false,
            idempotent: true,
          } as const;
        }
      }
      if (data.awbNo && data.originBranchId) {
        const existingByAwb = await prisma.transaction.findFirst({
          where: {
            originBranchId: data.originBranchId,
            awbNo: data.awbNo,
            deletedAt: null,
          },
        });
        if (existingByAwb) {
          if (
            data.idempotencyKey &&
            existingByAwb.idempotencyKey &&
            existingByAwb.idempotencyKey !== data.idempotencyKey
          ) {
            throw new Error(
              "IDEMPOTENCY_CONFLICT_AWB_EXISTS_WITH_DIFFERENT_KEY",
            );
          }
          if (
            !payloadMatchesExisting(existingByAwb, matchPayload, {
              explicitTransactionDate,
            })
          ) {
            throw new Error("AWB_EXISTS_WITH_DIFFERENT_PAYLOAD");
          }
          return {
            transaction: existingByAwb,
            created: false,
            idempotent: true,
            matchedBy: "awb",
          } as const;
        }
        const existingByAwbAny = await prisma.transaction.findFirst({
          where: {
            originBranchId: data.originBranchId,
            awbNo: data.awbNo,
          },
        });
        if (existingByAwbAny?.deletedAt) {
          throw new Error("AWB_ALREADY_USED");
        }
      }
    }
    throw e;
  }
}

export async function updateTransactionStatus(
  input: UpdateTransactionStatusInput,
  actor: AccessActor,
) {
  const data = updateTransactionStatusSchema.parse(input);
  const { isAdministrator } = await import("@/features/identity/permissions");
  if (
    !isAdministrator(actor) &&
    (!actor.branchIds || actor.branchIds.length === 0)
  ) {
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }

  return prisma.$transaction(async (tx: TxClient) => {
    const transaction = await tx.transaction.findFirst({
      where: {
        id: data.transactionId,
        deletedAt: null,
        ...(isAdministrator(actor)
          ? {}
          : {
              OR: [
                { originBranchId: { in: actor.branchIds } },
                { destinationBranchId: { in: actor.branchIds } },
              ],
            }),
      },
    });
    if (!transaction) {
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    }

    const allowed = ALLOWED_TRANSITIONS[transaction.status] || [];
    if (!allowed.includes(data.newStatus)) {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    const result = await tx.transaction.updateMany({
      where: { id: transaction.id, status: transaction.status },
      data: { status: data.newStatus },
    });
    if (result.count !== 1) {
      throw new Error("STATUS_CONCURRENTLY_UPDATED");
    }

    const updated = await tx.transaction.findUnique({
      where: { id: transaction.id },
    });

    await tx.transactionStatusHistory.create({
      data: {
        transactionId: transaction.id,
        priorStatus: transaction.status,
        newStatus: data.newStatus,
        reason: data.reason || null,
        actorId: actor.id,
      },
    });
    if (data.newStatus === "Delivered")
      await enqueueWhatsApp(tx, ["SHIPMENT_STATUS"], transaction.id, {
        branchId: transaction.destinationBranchId,
        payload: { receivedAt: new Date().toISOString() },
      });

    return updated;
  });
}
