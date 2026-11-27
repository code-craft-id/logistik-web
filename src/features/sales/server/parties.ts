import "server-only";

import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import { prisma } from "@/lib/db";

export type PartyKind = "customer" | "consignee";
export const PARTY_PAGE_SIZE = 25;

const text = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable().optional(),
  );
const id = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.coerce.number().int().positive().nullable().optional(),
);

export const customerInput = z.strictObject({
  name: z.string().trim().min(1).max(150),
  address: text(500),
  phone: text(30),
  contactPerson: text(100),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.email().max(150).nullable().optional(),
  ),
  branchId: id,
  marketingPersonId: id,
  termId: id,
  costTypeId: id,
  /** Provider "WA Notif": Y = send WhatsApp notifications to this customer. */
  whatsAppNotificationEnabled: z.preprocess(
    (v) => (v === "Y" ? true : v === "N" ? false : v),
    z.boolean().optional(),
  ),
});
export const consigneeInput = z.strictObject({
  name: z.string().trim().min(1).max(150),
  address1: text(500),
  phone: text(30),
  pic: text(100),
  customerId: id,
  branchId: id,
});

/** Branch scope: admins see all; others see their branches and shared rows. */
export function readable(actor: AccessActor) {
  return isAdministrator(actor)
    ? {}
    : { OR: [{ branchId: { in: actor.branchIds } }, { branchId: null }] };
}
/** Writes: non-admins may only touch rows owned by one of their branches. */
export function writableBranch(
  actor: AccessActor,
  branchId: number | null | undefined,
) {
  if (isAdministrator(actor)) return;
  if (!branchId || !actor.branchIds.includes(branchId))
    throw new IdentityError(
      "FORBIDDEN_BRANCH",
      403,
      "Pilih cabang Anda sendiri untuk data ini.",
    );
}

export async function listParties(
  actor: AccessActor,
  kind: PartyKind,
  params: { search?: string; page?: number } = {},
) {
  assertPermission(actor, "view", kind);
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const search = params.search?.trim().slice(0, 100);
  const where = {
    deletedAt: null,
    ...readable(actor),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };
  const paging = {
    orderBy: [{ name: "asc" as const }, { id: "asc" as const }],
    skip: (page - 1) * PARTY_PAGE_SIZE,
    take: PARTY_PAGE_SIZE,
  };
  if (kind === "customer") {
    const [rows, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        ...paging,
        include: {
          branch: { select: { name: true } },
          marketingPerson: { select: { name: true } },
          costType: { select: { name: true } },
          term: { select: { name: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);
    return {
      kind,
      page,
      total,
      pages: Math.max(1, Math.ceil(total / PARTY_PAGE_SIZE)),
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        values: {
          name: r.name,
          address: r.address,
          phone: r.phone,
          contactPerson: r.contactPerson,
          email: r.email,
          branchId: r.branchId,
          marketingPersonId: r.marketingPersonId,
          termId: r.termId,
          costTypeId: r.costTypeId,
          whatsAppNotificationEnabled: r.whatsAppNotificationEnabled
            ? "Y"
            : "N",
        },
        columns: [
          r.name,
          r.address,
          r.phone,
          r.contactPerson,
          r.branch?.name ?? "Semua cabang",
          r.marketingPerson?.name ?? null,
          r.costType?.name ?? null,
          r.term?.name ?? null,
          r.whatsAppNotificationEnabled ? "Aktif" : "Nonaktif",
        ],
      })),
    };
  }
  const [rows, total] = await Promise.all([
    prisma.consignee.findMany({
      where,
      ...paging,
      include: {
        branch: { select: { name: true } },
        customer: { select: { name: true } },
      },
    }),
    prisma.consignee.count({ where }),
  ]);
  return {
    kind,
    page,
    total,
    pages: Math.max(1, Math.ceil(total / PARTY_PAGE_SIZE)),
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      values: {
        name: r.name,
        address1: r.address1,
        phone: r.phone,
        pic: r.pic,
        customerId: r.customerId,
        branchId: r.branchId,
      },
      columns: [
        r.name,
        r.address1,
        r.phone,
        r.pic,
        r.customer?.name ?? null,
        r.branch?.name ?? "Semua cabang",
      ],
    })),
  };
}

/**
 * Choices for the party form of one tab only, limited to what the actor may
 * reference. Callers skip this entirely when the actor cannot create/update.
 */
export async function partyOptions(actor: AccessActor, kind: PartyKind) {
  const admin = isAdministrator(actor);
  const active = { deletedAt: null, status: "ACTIVE" as const };
  const pick = { id: true, name: true } as const;
  const byName = { name: "asc" as const };
  const branches = prisma.branch.findMany({
    where: { ...active, ...(admin ? {} : { id: { in: actor.branchIds } }) },
    select: pick,
    orderBy: byName,
  });
  if (kind === "consignee") {
    const [b, customers] = await Promise.all([
      branches,
      prisma.customer.findMany({
        where: { deletedAt: null, ...readable(actor) },
        select: pick,
        orderBy: byName,
        take: 1000,
      }),
    ]);
    return { branches: b, marketing: [], terms: [], costTypes: [], customers };
  }
  const [b, marketing, terms, costTypes] = await Promise.all([
    branches,
    prisma.marketingPerson.findMany({
      where: { ...active, ...readable(actor) },
      select: pick,
      orderBy: byName,
      take: 1000,
    }),
    prisma.term.findMany({ where: active, select: pick, orderBy: byName }),
    prisma.costType.findMany({ where: active, select: pick, orderBy: byName }),
  ]);
  return { branches: b, marketing, terms, costTypes, customers: [] };
}

export async function saveParty(
  actor: AccessActor,
  kind: PartyKind,
  input: unknown,
  existingId?: number,
) {
  assertPermission(actor, existingId ? "update" : "create", kind);
  return prisma.$transaction(async (tx) => {
    if (existingId) {
      const current =
        kind === "customer"
          ? await tx.customer.findFirst({
              where: { id: existingId, deletedAt: null },
              select: { branchId: true },
            })
          : await tx.consignee.findFirst({
              where: { id: existingId, deletedAt: null },
              select: { branchId: true },
            });
      if (!current)
        throw new IdentityError("NOT_FOUND", 404, "Data tidak ditemukan.");
      writableBranch(actor, current.branchId);
    }
    if (kind === "customer") {
      const data = customerInput.parse(input);
      writableBranch(actor, data.branchId);
      if (
        data.marketingPersonId &&
        !(await tx.marketingPerson.findFirst({
          where: {
            id: data.marketingPersonId,
            deletedAt: null,
            ...readable(actor),
          },
        }))
      )
        throw new IdentityError(
          "FORBIDDEN_BRANCH",
          403,
          "Marketing tidak tersedia.",
        );
      for (const [value, model] of [
        [data.termId, tx.term],
        [data.costTypeId, tx.costType],
      ] as const)
        if (
          value &&
          !(await (
            model as unknown as {
              findFirst: (a: unknown) => Promise<unknown>;
            }
          ).findFirst({
            where: { id: value, deletedAt: null, status: "ACTIVE" },
          }))
        )
          throw new IdentityError(
            "INVALID",
            400,
            "Pilihan master tidak aktif.",
          );
      const values = {
        name: data.name,
        address: data.address ?? null,
        phone: data.phone ?? null,
        contactPerson: data.contactPerson ?? null,
        email: data.email ?? null,
        branchId: data.branchId ?? null,
        marketingPersonId: data.marketingPersonId ?? null,
        termId: data.termId ?? null,
        costTypeId: data.costTypeId ?? null,
        // Only change WA Notif when the form sent it; new customers start
        // with notifications off.
        ...(data.whatsAppNotificationEnabled !== undefined
          ? { whatsAppNotificationEnabled: data.whatsAppNotificationEnabled }
          : existingId
            ? {}
            : { whatsAppNotificationEnabled: false }),
      };
      return existingId
        ? tx.customer.update({ where: { id: existingId }, data: values })
        : tx.customer.create({ data: values });
    }
    const data = consigneeInput.parse(input);
    writableBranch(actor, data.branchId);
    if (
      data.customerId &&
      !(await tx.customer.findFirst({
        where: { id: data.customerId, deletedAt: null, ...readable(actor) },
      }))
    )
      throw new IdentityError(
        "FORBIDDEN_BRANCH",
        403,
        "Customer tidak tersedia.",
      );
    const values = {
      name: data.name,
      address1: data.address1 ?? null,
      phone: data.phone ?? null,
      pic: data.pic ?? null,
      customerId: data.customerId ?? null,
      branchId: data.branchId ?? null,
    };
    return existingId
      ? tx.consignee.update({ where: { id: existingId }, data: values })
      : tx.consignee.create({ data: values });
  });
}

/** Soft delete; historical transactions keep their customer reference. */
export async function deleteParty(
  actor: AccessActor,
  kind: PartyKind,
  id: number,
) {
  assertPermission(actor, "delete", kind);
  return prisma.$transaction(async (tx) => {
    const current =
      kind === "customer"
        ? await tx.customer.findFirst({
            where: { id, deletedAt: null },
            select: { branchId: true },
          })
        : await tx.consignee.findFirst({
            where: { id, deletedAt: null },
            select: { branchId: true },
          });
    if (!current)
      throw new IdentityError("NOT_FOUND", 404, "Data tidak ditemukan.");
    writableBranch(actor, current.branchId);
    const deletedAt = new Date();
    if (kind === "customer")
      await tx.customer.update({ where: { id }, data: { deletedAt } });
    else await tx.consignee.update({ where: { id }, data: { deletedAt } });
  });
}
