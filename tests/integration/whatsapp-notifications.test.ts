import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

/** D-37 automatic WhatsApp notifications: outbox, gating and dispatch. */
const url = testDatabaseUrl(
  process.env.TEST_DATABASE_URL,
  process.env.DATABASE_URL,
);
process.env.DATABASE_URL = url;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const tag = `WAN${randomUUID().slice(0, 8)}`;
const ids = {
  company: 0,
  createdCompany: false,
  customers: [] as number[],
  tx: [] as number[],
};
let notify: typeof import("../../src/features/whatsapp/server/notifications");
let seq = 0;

async function awb(
  enabled: boolean | null,
  receiverPhone: string | null = "0812-1111-2222",
) {
  const customer = await db.customer.create({
    data: {
      name: `${tag} customer ${++seq}`,
      whatsAppNotificationEnabled: enabled,
    },
  });
  ids.customers.push(customer.id);
  const row = await db.transaction.create({
    data: {
      awbNo: `${tag}-${seq}`,
      customerId: customer.id,
      senderName: "Pengirim Uji",
      senderPhone: "081233334444",
      receiverName: "Penerima Uji",
      receiverPhone,
      receiverAddress: "Jl. Uji 1",
      status: "Open",
      transactionDate: new Date("2026-11-23T20:30:00.000Z"),
    },
  });
  ids.tx.push(row.id);
  return row;
}
const outbox = (transactionId: number) =>
  db.whatsAppOutbox.findMany({
    where: { transactionId },
    orderBy: { id: "asc" },
  });

beforeAll(async () => {
  notify = await import("../../src/features/whatsapp/server/notifications");
  const company = await db.company.findFirst({
    where: { deletedAt: null },
    orderBy: { id: "asc" },
  });
  if (company) ids.company = company.id;
  else {
    ids.company = (
      await db.company.create({
        data: {
          name: `${tag} Co`,
          isDepositAgent: false,
          showPriceOnPrint: true,
        },
      })
    ).id;
    ids.createdCompany = true;
  }
  await db.whatsAppTemplate.deleteMany({ where: { companyId: ids.company } });
});

afterAll(async () => {
  await db.whatsAppOutbox.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.whatsAppTemplate.deleteMany({ where: { companyId: ids.company } });
  await db.transaction.deleteMany({ where: { id: { in: ids.tx } } });
  await db.customer.deleteMany({ where: { id: { in: ids.customers } } });
  if (ids.createdCompany)
    await db.company.delete({ where: { id: ids.company } });
  await db.$disconnect();
});

describe("WhatsApp notifications (D-37)", () => {
  it("queues nothing when the customer's WA Notif is off or unset", async () => {
    for (const flag of [false, null]) {
      const t = await awb(flag);
      const n = await db.$transaction((tx) =>
        notify.enqueueWhatsApp(tx, ["TRX_SENDER", "TRX_RECEIVER"], t.id),
      );
      expect(n).toBe(0);
      expect(await outbox(t.id)).toHaveLength(0);
    }
  });

  it("skips kinds switched off in Pesan Whatsapp", async () => {
    await db.whatsAppTemplate.create({
      data: {
        companyId: ids.company,
        kind: "TRX_RECEIVER",
        message: "x",
        isEnabled: false,
      },
    });
    const t = await awb(true);
    const n = await db.$transaction((tx) =>
      notify.enqueueWhatsApp(tx, ["TRX_SENDER", "TRX_RECEIVER"], t.id, {
        branchId: 900001,
      }),
    );
    expect(n).toBe(1);
    expect((await outbox(t.id)).map((r) => r.kind)).toEqual(["TRX_SENDER"]);
    await db.whatsAppTemplate.deleteMany({ where: { companyId: ids.company } });
  });

  it("renders, falls back to the next branch and marks rows sent once", async () => {
    const t = await awb(true);
    await db.$transaction((tx) =>
      notify.enqueueWhatsApp(tx, ["SHIPMENT_STATUS"], t.id, {
        branchId: 900001,
        payload: {
          receivedBy: "Satpam",
          receivedAt: "2026-11-24T02:05:00.000Z",
        },
      }),
    );
    await db.transaction.update({
      where: { id: t.id },
      data: { destinationBranchId: null, originBranchId: null },
    });
    const send = vi.fn(async (branchId: number) =>
      branchId === 900001 ? ("not_connected" as const) : ("queued" as const),
    );
    // Only one candidate branch: not connected → retried later, not failed.
    const first = await notify.dispatchWhatsAppOutbox(db, { send });
    expect(first.retry).toBeGreaterThanOrEqual(1);
    const [row] = await outbox(t.id);
    expect(row?.status).toBe("PENDING");
    expect(row?.lastError).toBe("not_connected");

    await db.whatsAppOutbox.update({
      where: { id: row?.id ?? 0 },
      data: { branchId: 900002, updatedAt: new Date(Date.now() - 120_000) },
    });
    send.mockClear();
    await notify.dispatchWhatsAppOutbox(db, { send });
    const call = send.mock.calls.find(([b]) => b === 900002) as unknown as [
      number,
      { to: string; text: string; idempotencyKey: string },
    ];
    expect(call[1].to).toBe("+6281233334444");
    expect(call[1].text).toContain("Dear Pengirim Uji");
    expect(call[1].text).toContain("sudah di terima oleh Satpam");
    expect(call[1].text).toContain("pada tanggal 24-11-2026, pukul 09:05");
    expect(call[1].idempotencyKey).toBe(`lms-wa-outbox-${row?.id ?? 0}`);
    const [done] = await outbox(t.id);
    expect(done?.status).toBe("SENT");
    expect(done?.sentBranchId).toBe(900002);

    send.mockClear();
    await notify.dispatchWhatsAppOutbox(db, { send });
    expect(send.mock.calls.some(([b]) => b === 900002)).toBe(false);
  });

  it("skips an AWB without a usable recipient number", async () => {
    const t = await awb(true, "021");
    await db.$transaction((tx) =>
      notify.enqueueWhatsApp(tx, ["DELIVERY_SHEET"], t.id, {
        branchId: 900003,
      }),
    );
    const send = vi.fn(async () => "queued" as const);
    await notify.dispatchWhatsAppOutbox(db, { send });
    const [row] = await outbox(t.id);
    expect(row?.status).toBe("SKIPPED");
    expect(row?.lastError).toBe("no_phone");
    expect(send.mock.calls.length).toBe(0);
  });

  it("stops quietly when the gateway is not configured", async () => {
    const t = await awb(true);
    await db.$transaction((tx) =>
      notify.enqueueWhatsApp(tx, ["TRX_RECEIVER"], t.id, { branchId: 900004 }),
    );
    await notify.dispatchWhatsAppOutbox(db, {
      send: async () => "not_configured" as const,
    });
    const [row] = await outbox(t.id);
    expect(row?.status).toBe("SKIPPED");
    expect(row?.lastError).toBe("gateway_not_configured");
  });
});
