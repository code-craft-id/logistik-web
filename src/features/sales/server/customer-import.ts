import "server-only";

import * as XLSX from "xlsx";
import type { AccessActor } from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { prisma } from "@/lib/db";
import { SAMPLE_ID_FLOOR } from "@/lib/excel/import-sheet";
import { customerInput, readable, writableBranch } from "./parties";

/**
 * Template Import Data Customer with the provider's columns (owner supplied
 * 2026-11-27). "Unique" is the customer id: an existing id is updated (blank
 * cells keep the stored value), a new one is created with that id. Codes are
 * LMS ids. The provider's Address 2 is joined into the single LMS address.
 */
export const CUSTOMER_COLUMNS = [
  "Unique",
  "Customer Name",
  "Address 1",
  "Address 2",
  "Kode Kabupaten",
  "Kabupaten",
  "Phone",
  "Fax",
  "Contact Person",
  "Email",
  "Kode Marketing",
  "Kode Branch",
  "Termin",
  "POD",
];
export const CUSTOMER_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 1000;
/** A far larger Unique is a typo and would jump the id sequence. */
const MAX_ID_JUMP = 10_000;

const invalid = (message: string): never => {
  throw new IdentityError("INVALID_IMPORT", 400, message);
};
const text = (v: unknown) => {
  const t = v === undefined || v === null ? "" : String(v).trim();
  return t.startsWith("#N/A") ? "" : t;
};

export function parseCustomerFile(bytes: Uint8Array) {
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
    .findIndex((r) => CUSTOMER_COLUMNS.every((c, i) => text(r?.[i]) === c));
  if (headerAt < 0)
    invalid("Judul kolom tidak cocok dengan Template Import Customer.");
  const seen = new Set<number>();
  const result = [];
  for (const [index, r] of rows.slice(headerAt + 1).entries()) {
    // The provider keeps its notes to the right of the table.
    if (!r || (!text(r[0]) && !text(r[1]))) continue;
    const line = headerAt + index + 2;
    const bad = (message: string) => invalid(`Baris ${line}: ${message}`);
    const code = (i: number) => {
      const t = text(r[i]);
      if (!t) return undefined;
      if (!/^[1-9]\d{0,8}$/.test(t))
        bad(`${CUSTOMER_COLUMNS[i]} harus angka bulat.`);
      return Number(t);
    };
    const id = code(0) ?? bad("Unique wajib diisi.");
    if (seen.has(id)) bad(`Unique ${id} ganda di file.`);
    seen.add(id);
    const parsed = customerInput
      .pick({
        name: true,
        address: true,
        phone: true,
        contactPerson: true,
        email: true,
      })
      .safeParse({
        name: text(r[1]),
        address: [text(r[2]), text(r[3])].filter(Boolean).join(", "),
        phone: text(r[6]),
        contactPerson: text(r[8]),
        email: text(r[9]),
      });
    if (!parsed.success)
      bad(`isi tidak valid pada ${String(parsed.error.issues[0]?.path[0])}.`);
    const fax = text(r[7]);
    if (fax.length > 30) bad("Fax maksimal 30 karakter.");
    const pod = text(r[13]);
    if (pod && pod !== "0" && pod !== "1") bad("POD diisi 0 atau 1.");
    const data = parsed.data as NonNullable<typeof parsed.data>;
    // Blank cells are left out so an update keeps the stored value.
    const values = Object.fromEntries(
      Object.entries({
        name: data.name,
        address: data.address,
        phone: data.phone,
        contactPerson: data.contactPerson,
        email: data.email,
        fax,
        regencyId: code(4),
        marketingPersonId: code(10),
        branchId: code(11),
        podRequired: pod ? pod === "1" : undefined,
      }).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    ) as {
      name: string;
      address?: string;
      phone?: string;
      contactPerson?: string;
      email?: string;
      fax?: string;
      regencyId?: number;
      marketingPersonId?: number;
      branchId?: number;
      podRequired?: boolean;
    };
    result.push({ line, id, term: text(r[12]), values });
    if (result.length > MAX_ROWS)
      invalid(`Maksimal ${MAX_ROWS} baris per file.`);
  }
  if (!result.length) invalid("File tidak berisi data.");
  return result;
}

const live = { deletedAt: null };
const active = { deletedAt: null, status: "ACTIVE" as const };

/** All rows or none. */
export async function importCustomers(actor: AccessActor, bytes: Uint8Array) {
  assertPermission(actor, "create", "customer");
  const rows = parseCustomerFile(bytes);
  return prisma.$transaction(
    async (tx) => {
      const existing = new Map(
        (
          await tx.customer.findMany({
            where: { id: { in: rows.map((r) => r.id) } },
            select: { id: true, branchId: true, deletedAt: true },
          })
        ).map((c) => [c.id, c]),
      );
      const [regencies, marketing, branches, terms, last] = await Promise.all([
        tx.regency.findMany({ where: live, select: { id: true } }),
        tx.marketingPerson.findMany({
          where: { ...active, ...readable(actor) },
          select: { id: true },
        }),
        tx.branch.findMany({ where: live, select: { id: true } }),
        tx.term.findMany({ where: active, select: { id: true, name: true } }),
        tx.customer.aggregate({
          _max: { id: true },
          where: { id: { lt: SAMPLE_ID_FLOOR } },
        }),
      ]);
      const [regency, marketer, branch] = [regencies, marketing, branches].map(
        (list) => new Set(list.map((x) => x.id)),
      );
      const highest = (last._max.id ?? 0) + MAX_ID_JUMP;
      let created = 0;
      for (const { line, id, term, values } of rows) {
        const bad = (message: string) => invalid(`Baris ${line}: ${message}`);
        if (values.regencyId && !regency.has(values.regencyId))
          bad("Kode Kabupaten tidak ditemukan.");
        if (values.marketingPersonId && !marketer.has(values.marketingPersonId))
          bad("Kode Marketing tidak ditemukan.");
        if (values.branchId && !branch.has(values.branchId))
          bad("Kode Branch tidak ditemukan.");
        const termId = term
          ? (terms.find(
              (t) =>
                String(t.id) === term ||
                t.name.toLowerCase() === term.toLowerCase(),
            )?.id ?? bad("Termin tidak ditemukan."))
          : undefined;
        const data = { ...values, ...(termId ? { termId } : {}) };
        const current = existing.get(id);
        if (current) {
          assertPermission(actor, "update", "customer");
          if (current.deletedAt)
            bad(`Unique ${id} milik customer yang sudah dihapus.`);
          writableBranch(actor, current.branchId);
          if (data.branchId) writableBranch(actor, data.branchId);
          await tx.customer.update({ where: { id }, data });
        } else {
          if (id > highest)
            bad(`Unique ${id} terlalu jauh dari nomor terakhir.`);
          writableBranch(actor, data.branchId);
          await tx.customer.create({
            data: { whatsAppNotificationEnabled: false, ...data, id },
          });
          created++;
        }
      }
      // Ids were given by the file: move the sequence past them.
      if (created)
        await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('customers', 'id'), GREATEST((SELECT max(id) FROM customers WHERE id < ${SAMPLE_ID_FLOOR}), nextval(pg_get_serial_sequence('customers', 'id'))))`;
      return { created, updated: rows.length - created };
    },
    { timeout: 60_000 },
  );
}

export async function lastCustomerId(actor: AccessActor) {
  assertPermission(actor, "view", "customer");
  // Numbering is shared by everyone, deleted rows included.
  const last = await prisma.customer.aggregate({
    _max: { id: true },
    where: { id: { lt: SAMPLE_ID_FLOOR } },
  });
  return last._max.id ?? 0;
}

/** Template (header only) or Export Customers (same layout, re-importable). */
export async function customerWorkbook(actor: AccessActor, withData: boolean) {
  assertPermission(actor, withData ? "view" : "create", "customer");
  const pick = { id: true, name: true } as const;
  const order = { name: "asc" as const };
  const [rows, marketing, branches, terms, regencies] = await Promise.all([
    withData
      ? prisma.customer.findMany({
          where: { ...live, ...readable(actor) },
          include: { regency: { select: { name: true } } },
          orderBy: { id: "asc" },
          take: 20_000,
        })
      : [],
    prisma.marketingPerson.findMany({
      where: { ...active, ...readable(actor) },
      select: pick,
      orderBy: order,
    }),
    prisma.branch.findMany({ where: live, select: pick, orderBy: order }),
    prisma.term.findMany({ where: active, select: pick, orderBy: order }),
    prisma.regency.findMany({ where: live, select: pick, orderBy: order }),
  ]);
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Template Import Data Customer"],
    CUSTOMER_COLUMNS,
    ...rows.map((c) => [
      c.id,
      c.name,
      c.address ?? "",
      "",
      c.regencyId ?? "",
      c.regency?.name ?? "",
      c.phone ?? "",
      c.fax ?? "",
      c.contactPerson ?? "",
      c.email ?? "",
      c.marketingPersonId ?? "",
      c.branchId ?? "",
      c.termId ?? "",
      c.podRequired === null ? "" : c.podRequired ? 1 : 0,
    ]),
  ]);
  sheet["!cols"] = CUSTOMER_COLUMNS.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(book, sheet, "Customer");
  const lists: [string, { id: number; name: string }[]][] = [
    ["Kode Marketing", marketing],
    ["Kode Branch", branches],
    ["Termin", terms],
    ["Kode Kabupaten", regencies],
  ];
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["Unique: id customer; lanjutkan dari nomor terakhir. POD: 0 atau 1."],
      ["Daftar", "Nama", "Code"],
      ...lists.flatMap(([title, list]) =>
        list.map((x) => [title, x.name, x.id]),
      ),
    ]),
    "Keterangan",
  );
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
