import "server-only";

import * as XLSX from "xlsx";
import type { AccessActor } from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { missingAwbFields } from "../required-fields";
import { createTransactionSchema } from "../schemas";
import { createTransaction } from "./service";

/**
 * AWB Template Import / Import Data with the provider's columns (template
 * supplied by the owner 2026-11-27). Codes are LMS ids listed on the
 * Keterangan sheet. Destination Code is an LMS branch (provider: kecamatan).
 * No tariff is in the file, so Grand Total stays empty.
 * Every row is checked first; a bad row stops the whole file. Saving is one
 * AWB at a time through the same service as the form.
 */
// Column positions; "Name", "Address", "Phone" repeat so headers cannot key them.
export const AWB_COLUMNS = [
  "Connote No.",
  "DO / Reff",
  "Tanggal",
  "Pickup BY",
  "Pickup Kode",
  "Origin",
  "Origin Code",
  "Destination",
  "Destination Code",
  "Customer",
  "Customer Code",
  "Moda",
  "Moda Code",
  "Service",
  "Service Code",
  "Doc/Pack",
  "Doc/Pack Code",
  "Koli",
  "Volume",
  "Weight",
  "Name",
  "Address",
  "Phone",
  "Email",
  "Name",
  "Address",
  "Phone",
  "Isi Barang",
  "Keterangan",
  "Asuransi (Y/N)",
  "Nilai Barang",
  "Asuransi (%)",
  "Biaya Lain",
  "Biaya Packing",
  "Biaya Pickup",
  "Jenis Pembayaran",
  "Jenis Pembayaran Code",
  "",
  "Connote No.",
  "Connote-Koli",
  "Panjang",
  "Lebar",
  "Tinggi",
  "Actual Weight",
] as const;
export const AWB_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 200;

const text = (v: unknown) => {
  const t = v === undefined || v === null ? "" : String(v).trim();
  // The provider file keeps formula errors in unused rows.
  return t.startsWith("#N/A") ? "" : t;
};
const invalid = (message: string): never => {
  throw new IdentityError("INVALID_IMPORT", 400, message);
};
function dateText(v: unknown) {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    return d
      ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`
      : "";
  }
  return text(v);
}
/** "0" and empty both mean "not given" for codes and money. */
const optional = (v: unknown) => {
  const t = text(v);
  return t === "" || Number(t) === 0 ? undefined : t;
};

export type AwbImportRow = {
  line: number;
  customerId?: string;
  input: Record<string, unknown>;
};

export function parseAwbFile(bytes: Uint8Array): AwbImportRow[] {
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
  const headerAt = rows
    .slice(0, 10)
    .findIndex(
      (r) =>
        text(r?.[0]) === AWB_COLUMNS[0] &&
        AWB_COLUMNS.slice(0, 37).every((c, i) => text(r[i]) === c),
    );
  if (headerAt < 0)
    invalid("Judul kolom tidak ditemukan. Gunakan Template Import.");
  const body = rows.slice(headerAt + 1);

  // Right-hand table: one row per koli.
  const dimensions = new Map<string, Record<string, string>[]>();
  for (const r of body) {
    const awb = text(r?.[38]).toUpperCase();
    const [length, width, height, kilo] = [40, 41, 42, 43].map((i) =>
      text(r?.[i]),
    );
    if (awb && [length, width, height].every((v) => Number(v) > 0))
      dimensions.set(awb, [
        ...(dimensions.get(awb) ?? []),
        { length, width, height, kilo: kilo || "0" },
      ]);
  }

  const result: AwbImportRow[] = [];
  const seen = new Set<string>();
  for (const [index, r] of body.entries()) {
    if (!r || (!text(r[0]) && !text(r[6]) && !text(r[24]))) continue;
    const line = headerAt + index + 2;
    const awbNo = text(r[0]);
    if (awbNo) {
      if (seen.has(awbNo.toUpperCase()))
        invalid(`Baris ${line}: Connote No. ${awbNo} ganda di file.`);
      seen.add(awbNo.toUpperCase());
    }
    const date = dateText(r[2]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      invalid(`Baris ${line}: Tanggal pakai YYYY-MM-DD.`);
    const goodsValue = optional(r[30]);
    const percent = Number(text(r[31])) || 0;
    const insured = text(r[29]).toUpperCase() === "Y";
    const rowsForAwb = dimensions.get(awbNo.toUpperCase());
    result.push({
      line,
      customerId: optional(r[10]),
      input: {
        ...(awbNo ? { awbNo } : { autoAwb: true }),
        doNo: text(r[1]) || undefined,
        transactionDate: date,
        pickupCourierId: optional(r[4]),
        originBranchId: optional(r[6]),
        destinationBranchId: optional(r[8]),
        transportModeId: optional(r[12]),
        deliveryServiceId: optional(r[14]),
        goodsTypeId: optional(r[16]),
        koli: optional(r[17]),
        volume: optional(r[18]),
        kilo: optional(r[19]),
        senderName: text(r[20]) || undefined,
        senderAddress: text(r[21]) || undefined,
        senderPhone: text(r[22]) || undefined,
        receiverName: text(r[24]) || undefined,
        receiverAddress: text(r[25]) || undefined,
        receiverPhone: text(r[26]) || undefined,
        description: text(r[27]) || undefined,
        remarks: text(r[28]) || undefined,
        insured: insured ? "Y" : "N",
        goodsValue,
        insuranceFee:
          insured && goodsValue && percent > 0
            ? ((Number(goodsValue) * percent) / 100).toFixed(2)
            : undefined,
        otherFee: optional(r[32]),
        packingFee: optional(r[33]),
        pickupFee: optional(r[34]),
        costTypeId: optional(r[36]),
        ...(rowsForAwb ? { dimensionRows: JSON.stringify(rowsForAwb) } : {}),
      },
    });
    if (result.length > MAX_ROWS) invalid(`Maksimal ${MAX_ROWS} AWB per file.`);
  }
  if (!result.length) invalid("File tidak berisi data.");
  return result;
}

export async function importAwbs(actor: AccessActor, bytes: Uint8Array) {
  assertPermission(actor, "create", "transaction");
  const rows = parseAwbFile(bytes);

  const customerIds = rows.flatMap((r) =>
    r.customerId ? [Number(r.customerId)] : [],
  );
  const customers = new Map(
    (
      await prisma.customer.findMany({
        where: { id: { in: customerIds }, deletedAt: null },
        select: { id: true, name: true, address: true, phone: true },
      })
    ).map((c) => [c.id, c]),
  );

  const ready = rows.map((row) => {
    const bad = (message: string) => invalid(`Baris ${row.line}: ${message}`);
    const input = { ...row.input };
    if (row.customerId) {
      const customer = customers.get(Number(row.customerId));
      if (!customer) bad(`Customer Code ${row.customerId} tidak ditemukan.`);
      input.customerId = row.customerId;
      input.senderName ??= customer?.name;
      input.senderAddress ??= customer?.address ?? undefined;
      input.senderPhone ??= customer?.phone ?? undefined;
    }
    const defined = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );
    const missing = missingAwbFields(
      Object.fromEntries(
        Object.entries(defined).map(([k, v]) => [k, String(v)]),
      ),
    );
    if (missing.length) bad(`Wajib diisi: ${missing.join(", ")}.`);
    const parsed = createTransactionSchema.safeParse(defined);
    if (!parsed.success)
      bad(`Isi tidak valid pada ${String(parsed.error.issues[0]?.path[0])}.`);
    return {
      line: row.line,
      data: parsed.data as NonNullable<typeof parsed.data>,
    };
  });

  const awbNos = ready.flatMap((r) => (r.data.awbNo ? [r.data.awbNo] : []));
  const used = await prisma.transaction.findFirst({
    where: { awbNo: { in: awbNos } },
    select: { awbNo: true },
  });
  if (used) invalid(`Connote No. ${used.awbNo} sudah dipakai.`);

  let created = 0;
  const failed: string[] = [];
  for (const row of ready) {
    try {
      await createTransaction(row.data, actor);
      created++;
    } catch (error) {
      failed.push(
        `baris ${row.line} (${
          error instanceof IdentityError && error.code === "FORBIDDEN_BRANCH"
            ? "cabang atau data master di luar hak Anda"
            : "kode master tidak ditemukan atau isi tidak valid"
        })`,
      );
    }
  }
  return { created, failed };
}

/** Template with the provider's two sheets; codes come from LMS masters. */
export async function awbTemplate(actor: AccessActor) {
  assertPermission(actor, "create", "transaction");
  const active = { deletedAt: null, status: "ACTIVE" as const };
  const pick = { id: true, name: true } as const;
  const order = { name: "asc" as const };
  const [branches, modes, services, goods, costs, couriers] = await Promise.all(
    [
      prisma.branch.findMany({ where: active, select: pick, orderBy: order }),
      prisma.transportMode.findMany({
        where: active,
        select: pick,
        orderBy: order,
      }),
      prisma.deliveryService.findMany({
        where: active,
        select: pick,
        orderBy: order,
      }),
      prisma.goodsType.findMany({
        where: active,
        select: pick,
        orderBy: order,
      }),
      prisma.costType.findMany({ where: active, select: pick, orderBy: order }),
      prisma.courier.findMany({ where: active, select: pick, orderBy: order }),
    ],
  );
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    [...AWB_COLUMNS],
    [
      "CONTOH001",
      "REF-1",
      "2026-11-27",
      "Delivery to Office",
      0,
      "Asal",
      branches[0]?.id ?? "",
      "Tujuan",
      branches[1]?.id ?? "",
      "",
      "",
      "",
      modes[0]?.id ?? "",
      "",
      services[0]?.id ?? "",
      "",
      goods[0]?.id ?? "",
      1,
      0,
      1,
      "Nama Pengirim",
      "Alamat Pengirim",
      "0800000000",
      "",
      "Nama Penerima",
      "Alamat Penerima",
      "0800000001",
      "Isi barang",
      "Keterangan",
      "N",
      0,
      0,
      0,
      0,
      0,
      "",
      costs[0]?.id ?? "",
      "",
      "CONTOH001",
      "CONTOH001-1",
      0,
      0,
      0,
      1,
    ],
  ]);
  sheet["!cols"] = AWB_COLUMNS.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(book, sheet, "Import AWB");
  const lists: [string, { id: number; name: string }[]][] = [
    ["Cabang (Origin / Destination)", branches],
    ["Moda", modes],
    ["Service", services],
    ["Doc/Pack", goods],
    ["Jenis Pembayaran", costs],
    ["Pickup BY (0 = antar ke kantor)", couriers],
  ];
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["Daftar", "Nama", "Code"],
      ...lists.flatMap(([title, list]) =>
        list.map((x) => [title, x.name, x.id]),
      ),
    ]),
    "Keterangan",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
