import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import {
  formatWhatsAppDate,
  formatWhatsAppTime,
  renderWhatsAppMessage,
  toWhatsAppNumber,
  WHATSAPP_TEMPLATE_INFO,
  type WhatsAppKind,
} from "../templates";
import { createWhatsAppGateway } from "./gateway";

/**
 * Automatic WhatsApp notifications (D-37), as in the provider: four
 * messages, each with an on/off switch, sent only when the AWB's customer
 * has WA Notif active. Events write an outbox row inside their own database
 * transaction; delivery to the gateway happens after commit, so a gateway
 * outage never blocks or rolls back operational work.
 */

type Tx = Prisma.TransactionClient;
const MAX_ATTEMPTS = 5;
const EXPIRE_MS = 24 * 60 * 60_000;

export type WhatsAppEventPayload = {
  /** SHIPMENT_STATUS: who received it and when. */
  receivedBy?: string | null;
  receivedAt?: string;
  /** DELIVERY_SHEET: the sheet the AWB was put on. */
  deliverySheetId?: number;
};

/** The single company's template switches (D-35 single company). */
async function templatesOf(db: Tx | PrismaClient) {
  const company = await db.company.findFirst({
    where: { deletedAt: null },
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      whatsappTemplates: {
        select: { kind: true, message: true, isEnabled: true },
      },
    },
  });
  const byKind = new Map(company?.whatsappTemplates.map((t) => [t.kind, t]));
  return {
    companyName: company?.name ?? "",
    get(kind: WhatsAppKind) {
      const row = byKind.get(kind);
      return {
        message: row?.message ?? WHATSAPP_TEMPLATE_INFO[kind].defaultMessage,
        isEnabled: row?.isEnabled ?? true,
      };
    },
  };
}

/**
 * Record notifications for one AWB inside the caller's transaction. Does
 * nothing when the customer's WA Notif is off or every kind is switched off.
 */
export async function enqueueWhatsApp(
  tx: Tx,
  kinds: WhatsAppKind[],
  transactionId: number,
  options: { branchId?: number | null; payload?: WhatsAppEventPayload } = {},
) {
  const awb = await tx.transaction.findUnique({
    where: { id: transactionId },
    select: { customer: { select: { whatsAppNotificationEnabled: true } } },
  });
  if (awb?.customer?.whatsAppNotificationEnabled !== true) return 0;
  const templates = await templatesOf(tx);
  const enabled = kinds.filter((kind) => templates.get(kind).isEnabled);
  if (!enabled.length) return 0;
  await tx.whatsAppOutbox.createMany({
    data: enabled.map((kind) => ({
      kind,
      transactionId,
      branchId: options.branchId ?? null,
      payload: (options.payload ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
    })),
  });
  scheduleWhatsAppDispatch();
  return enabled.length;
}

/** Run the dispatcher after the current response; no-op outside a request. */
export function scheduleWhatsAppDispatch() {
  try {
    after(() =>
      dispatchWhatsAppOutbox().catch(() => {
        // Rows stay PENDING and are retried on the next event.
      }),
    );
  } catch {
    // Outside a request scope (scripts, tests): leave rows PENDING.
  }
}

/** Claim, render and hand pending rows to the gateway. Returns counts. */
export async function dispatchWhatsAppOutbox(
  db: PrismaClient = prisma,
  gateway: Pick<
    ReturnType<typeof createWhatsAppGateway>,
    "send"
  > = createWhatsAppGateway(),
  now: () => Date = () => new Date(),
) {
  const counts = { sent: 0, skipped: 0, retry: 0, failed: 0 };
  for (let batch = 0; batch < 20; batch += 1) {
    const claimed = await db.$queryRaw<{ id: number }[]>`
      UPDATE whatsapp_outbox SET status = 'SENDING', attempts = attempts + 1, updated_at = (now() AT TIME ZONE 'UTC')
      WHERE id IN (
        SELECT id FROM whatsapp_outbox
        WHERE (status = 'PENDING'
               AND (attempts = 0 OR updated_at < (now() AT TIME ZONE 'UTC') - interval '1 minute'))
           OR (status = 'SENDING' AND updated_at < (now() AT TIME ZONE 'UTC') - interval '5 minutes')
        ORDER BY id LIMIT 20 FOR UPDATE SKIP LOCKED)
      RETURNING id`;
    if (!claimed.length) break;
    const templates = await templatesOf(db);
    for (const { id } of claimed) {
      const outcome = await deliver(db, gateway, templates, id, now());
      counts[outcome] += 1;
    }
  }
  return counts;
}

async function deliver(
  db: PrismaClient,
  gateway: Pick<ReturnType<typeof createWhatsAppGateway>, "send">,
  templates: Awaited<ReturnType<typeof templatesOf>>,
  id: number,
  at: Date,
): Promise<"sent" | "skipped" | "retry" | "failed"> {
  const finish = (
    status: string,
    lastError: string | null,
    sentBranchId?: number,
  ) =>
    db.whatsAppOutbox.update({
      where: { id },
      data: { status, lastError, sentBranchId: sentBranchId ?? null },
    });
  const row = await db.whatsAppOutbox.findUnique({
    where: { id },
    select: {
      kind: true,
      branchId: true,
      payload: true,
      attempts: true,
      createdAt: true,
      transaction: {
        select: {
          id: true,
          awbNo: true,
          transactionDate: true,
          senderName: true,
          senderAddress: true,
          senderPhone: true,
          receiverName: true,
          receiverAddress: true,
          receiverPhone: true,
          originBranchId: true,
          destinationBranchId: true,
          originBranch: { select: { name: true } },
          destinationBranch: { select: { name: true } },
          customer: {
            select: { name: true, whatsAppNotificationEnabled: true },
          },
          consignee: { select: { name: true } },
        },
      },
    },
  });
  if (!row) return "skipped";
  const kind = row.kind as WhatsAppKind;
  const info = WHATSAPP_TEMPLATE_INFO[kind];
  const template = templates.get(kind);
  const t = row.transaction;
  if (
    !info ||
    !template.isEnabled ||
    t.customer?.whatsAppNotificationEnabled !== true
  ) {
    await finish("SKIPPED", "disabled");
    return "skipped";
  }
  if (at.getTime() - row.createdAt.getTime() > EXPIRE_MS) {
    await finish("FAILED", "expired");
    return "failed";
  }
  const to = toWhatsAppNumber(
    info.recipient === "sender" ? t.senderPhone : t.receiverPhone,
  );
  if (!to) {
    await finish("SKIPPED", "no_phone");
    return "skipped";
  }

  const payload = (row.payload ?? {}) as WhatsAppEventPayload;
  let eventAt = payload.receivedAt ? new Date(payload.receivedAt) : at;
  let courierName: string | null = null;
  if (payload.deliverySheetId) {
    const sheet = await db.deliverySheet.findUnique({
      where: { id: payload.deliverySheetId },
      select: { deliveryDate: true, courier: { select: { name: true } } },
    });
    if (sheet) {
      eventAt = sheet.deliveryDate;
      courierName = sheet.courier?.name ?? null;
    }
  }
  const text = renderWhatsAppMessage(template.message, {
    namaPengirim: t.senderName ?? t.customer?.name,
    namaPenerima: t.receiverName ?? t.consignee?.name,
    alamatPengirim: t.senderAddress,
    alamatPenerima: t.receiverAddress,
    cabangAsal: t.originBranch?.name,
    cabangTujuan: t.destinationBranch?.name,
    awb: t.awbNo,
    tglKonos: formatWhatsAppDate(t.transactionDate),
    diterima: payload.receivedBy,
    tglDiterima: formatWhatsAppDate(eventAt),
    jamDiterima: formatWhatsAppTime(eventAt),
    namaKurir: courierName,
    namaPerusahaan: templates.companyName,
  });

  // The acting branch's number first, then the AWB's own branches.
  const candidates = [
    row.branchId,
    ...(info.recipient === "receiver" || kind === "SHIPMENT_STATUS"
      ? [t.destinationBranchId, t.originBranchId]
      : [t.originBranchId, t.destinationBranchId]),
  ].filter((b, i, all): b is number => !!b && all.indexOf(b) === i);

  let lastError = "no_branch";
  for (const branchId of candidates) {
    const result = await gateway.send(branchId, {
      to,
      text,
      idempotencyKey: `lms-wa-outbox-${id}`,
    });
    if (result === "queued") {
      await finish("SENT", null, branchId);
      return "sent";
    }
    if (result === "not_configured") {
      await finish("SKIPPED", "gateway_not_configured");
      return "skipped";
    }
    lastError = result;
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await finish("FAILED", lastError);
    return "failed";
  }
  await db.whatsAppOutbox.update({
    where: { id },
    data: { status: "PENDING", lastError },
  });
  return "retry";
}
