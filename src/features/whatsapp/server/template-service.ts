import "server-only";
import { z } from "zod";
import { type AccessActor, permits } from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import type { PrismaClient } from "@/lib/db/generated/client";
import {
  WHATSAPP_KINDS,
  WHATSAPP_TEMPLATE_INFO,
  type WhatsAppKind,
  whatsappTemplateInput,
} from "../templates";

export type WhatsAppTemplateView = {
  kind: WhatsAppKind;
  message: string;
  isEnabled: boolean;
};
export type WhatsAppNotificationSettings = {
  templates: WhatsAppTemplateView[];
  canEdit: boolean;
  /** Last 7 days of the outbox, by status. */
  recent: Record<"PENDING" | "SENT" | "SKIPPED" | "FAILED", number>;
};

const customerQuery = z.strictObject({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  search: z.string().trim().max(100).default(""),
});
const PAGE_SIZE = 10;

/** Pesan Whatsapp settings of the single company (D-35, D-37). */
export function createWhatsAppTemplateService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function company() {
    const row = await db.company.findFirst({
      where: { deletedAt: null },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    if (!row)
      throw new IdentityError("NOT_FOUND", 404, "Perusahaan belum ada.");
    return row;
  }
  return {
    async settings(): Promise<WhatsAppNotificationSettings> {
      const actor = await resolveActor();
      assertPermission(actor, "view", "whatsapp_configuration");
      const { id } = await company();
      const [rows, grouped] = await Promise.all([
        db.whatsAppTemplate.findMany({
          where: { companyId: id },
          select: { kind: true, message: true, isEnabled: true },
        }),
        db.whatsAppOutbox.groupBy({
          by: ["status"],
          where: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
          _count: { _all: true },
        }),
      ]);
      const byKind = new Map(rows.map((r) => [r.kind, r]));
      const recent = { PENDING: 0, SENT: 0, SKIPPED: 0, FAILED: 0 };
      for (const g of grouped) {
        const key = g.status === "SENDING" ? "PENDING" : g.status;
        if (key in recent) recent[key as keyof typeof recent] += g._count._all;
      }
      return {
        templates: WHATSAPP_KINDS.map((kind) => ({
          kind,
          message:
            byKind.get(kind)?.message ??
            WHATSAPP_TEMPLATE_INFO[kind].defaultMessage,
          isEnabled: byKind.get(kind)?.isEnabled ?? true,
        })),
        canEdit: permits(actor, "update", "whatsapp_configuration"),
        recent,
      };
    },

    async save(input: unknown) {
      const actor = await resolveActor();
      assertPermission(actor, "update", "whatsapp_configuration");
      const data = whatsappTemplateInput.parse(input);
      const { id } = await company();
      await db.whatsAppTemplate.upsert({
        where: { companyId_kind: { companyId: id, kind: data.kind } },
        create: { companyId: id, ...data },
        update: { message: data.message, isEnabled: data.isEnabled },
      });
      return { kind: data.kind };
    },

    /** Provider "List Customer Aktif WA Notifikasi": customers with WA Notif on. */
    async activeCustomers(input: unknown = {}) {
      const actor = await resolveActor();
      assertPermission(actor, "view", "whatsapp_configuration");
      const { page, search } = customerQuery.parse(input);
      const where = {
        deletedAt: null,
        whatsAppNotificationEnabled: true,
        ...(search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {}),
      };
      const [items, total] = await Promise.all([
        db.customer.findMany({
          where,
          select: { id: true, name: true },
          orderBy: [{ name: "asc" }, { id: "asc" }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        db.customer.count({ where }),
      ]);
      return {
        items,
        page,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        pageSize: PAGE_SIZE,
      };
    },
  };
}
