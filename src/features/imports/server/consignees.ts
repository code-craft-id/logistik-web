import "server-only";

import type { AccessActor } from "@/features/identity/permissions";
import { assertPermission } from "@/features/identity/server/access";
import { readable, writableBranch } from "@/features/sales/server/parties";
import { prisma } from "@/lib/db";
import {
  cell,
  filled,
  idSet,
  invalid,
  readRows,
  SAMPLE_ID_FLOOR,
  workbook,
} from "@/lib/excel/import-sheet";

/**
 * Provider consignee template (owner supplied 2026-11-27). "Unique" is the
 * consignee id, like the customer file. Codes are LMS ids.
 */
export const CONSIGNEE_COLUMNS = [
  "Unique",
  "Consignee Name",
  "Customer ID",
  "Branch",
  "Address (Line 1)",
  "Address (Line 2)",
  "Kabupaten",
  "Kecamatan",
  "Kelurahan",
  "Zipcode",
  "Phone",
  "Fax",
  "PIC",
  "Email",
];
const MAX_ID_JUMP = 10_000;
const live = { deletedAt: null };

export function parseConsigneeFile(bytes: Uint8Array) {
  const seen = new Set<number>();
  return readRows(bytes, CONSIGNEE_COLUMNS)
    .filter((r) => cell(r.raw[1]) !== "(Nama Consignee)")
    .map((r) => {
      const id = r.required(r.whole(0), 0);
      if (seen.has(id)) r.bad(`Unique ${id} ganda di file.`);
      seen.add(id);
      const email = r.text(13, 150);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        r.bad("Email tidak valid.");
      return {
        line: r.line,
        id,
        values: {
          name: r.required(r.text(1, 150), 1),
          ...filled({
            customerId: r.whole(2),
            branchId: r.whole(3),
            address1: r.text(4),
            address2: r.text(5),
            regencyId: r.whole(6),
            districtId: r.whole(7),
            villageId: r.whole(8),
            postalCode: r.text(9, 10),
            phone: r.text(10, 30),
            fax: r.text(11, 30),
            pic: r.text(12, 100),
            email,
          }),
        },
      };
    });
}

export async function importConsignees(actor: AccessActor, bytes: Uint8Array) {
  assertPermission(actor, "create", "consignee");
  const rows = parseConsigneeFile(bytes);
  const ids = (key: keyof (typeof rows)[number]["values"]) => ({
    id: {
      in: rows.flatMap((r) => (r.values[key] ? [Number(r.values[key])] : [])),
    },
    ...live,
  });
  return prisma.$transaction(
    async (tx) => {
      const select = { id: true } as const;
      const [existing, customers, branches, regencies, districts, villages] =
        await Promise.all([
          tx.consignee.findMany({
            where: { id: { in: rows.map((r) => r.id) } },
            select: { id: true, branchId: true, deletedAt: true },
          }),
          tx.customer.findMany({
            where: { ...ids("customerId"), AND: [readable(actor)] },
            select,
          }),
          tx.branch.findMany({ where: ids("branchId"), select }),
          tx.regency.findMany({ where: ids("regencyId"), select }),
          tx.district.findMany({ where: ids("districtId"), select }),
          tx.village.findMany({ where: ids("villageId"), select }),
        ]);
      const current = new Map(existing.map((c) => [c.id, c]));
      const checks = [
        ["customerId", "Customer ID", idSet(customers)],
        ["branchId", "Branch", idSet(branches)],
        ["regencyId", "Kabupaten", idSet(regencies)],
        ["districtId", "Kecamatan", idSet(districts)],
        ["villageId", "Kelurahan", idSet(villages)],
      ] as const;
      const last = await tx.consignee.aggregate({
        _max: { id: true },
        where: { id: { lt: SAMPLE_ID_FLOOR } },
      });
      const highest = (last._max.id ?? 0) + MAX_ID_JUMP;
      let created = 0;
      for (const { line, id, values } of rows) {
        const bad = (message: string) => invalid(`Baris ${line}: ${message}`);
        for (const [key, label, known] of checks)
          if (values[key] && !known.has(Number(values[key])))
            bad(`${label} tidak ditemukan.`);
        const old = current.get(id);
        if (old) {
          assertPermission(actor, "update", "consignee");
          if (old.deletedAt) bad(`Unique ${id} milik data yang sudah dihapus.`);
          writableBranch(actor, old.branchId);
          if (values.branchId) writableBranch(actor, values.branchId);
          await tx.consignee.update({ where: { id }, data: values });
        } else {
          if (id > highest)
            bad(`Unique ${id} terlalu jauh dari nomor terakhir.`);
          writableBranch(actor, values.branchId);
          await tx.consignee.create({ data: { ...values, id } });
          created++;
        }
      }
      if (created)
        await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('consignees', 'id'), GREATEST((SELECT max(id) FROM consignees WHERE id < ${SAMPLE_ID_FLOOR}), nextval(pg_get_serial_sequence('consignees', 'id'))))`;
      return `${created} penerima dibuat, ${rows.length - created} diperbarui.`;
    },
    { timeout: 60_000 },
  );
}

export async function lastConsigneeId(actor: AccessActor) {
  assertPermission(actor, "view", "consignee");
  const last = await prisma.consignee.aggregate({
    _max: { id: true },
    where: { id: { lt: SAMPLE_ID_FLOOR } },
  });
  return last._max.id ?? 0;
}

export async function consigneeTemplate(actor: AccessActor) {
  assertPermission(actor, "create", "consignee");
  const pick = { id: true, name: true } as const;
  const order = { name: "asc" as const };
  // Districts and villages are too many to list; use their master pages.
  const [customers, branches, regencies] = await Promise.all([
    prisma.customer.findMany({
      where: { ...live, ...readable(actor) },
      select: pick,
      orderBy: order,
    }),
    prisma.branch.findMany({ where: live, select: pick, orderBy: order }),
    prisma.regency.findMany({ where: live, select: pick, orderBy: order }),
  ]);
  return workbook(
    [CONSIGNEE_COLUMNS],
    [
      ["Customer ID", customers],
      ["Branch", branches],
      ["Kabupaten", regencies],
    ],
  );
}
