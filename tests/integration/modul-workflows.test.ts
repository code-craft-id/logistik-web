import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AccessActor } from "../../src/features/identity/permissions";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const url = testDatabaseUrl(
  process.env.TEST_DATABASE_URL,
  process.env.DATABASE_URL,
);
process.env.DATABASE_URL = url;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const tag = `MW${randomUUID().slice(0, 8)}`;
const ids = {
  company: 0,
  office: 0,
  a: 0,
  b: 0,
  requester: 0,
  approver: 0,
  vendor: 0,
  tx: [] as number[],
};
type Modules = {
  awb: typeof import("../../src/features/modul/server/awb-changes");
  tariffs: typeof import("../../src/features/modul/server/tariffs");
  pod: typeof import("../../src/features/modul/server/pod-returns");
  bills: typeof import("../../src/features/modul/server/vendor-bills");
  inbound: typeof import("../../src/features/modul/server/inbound");
  proof: typeof import("../../src/features/modul/server/proof");
};
let m: Modules;
const all = [
  ["awb_change", ["view", "request", "approve"]],
  ["tariff", ["view", "manage"]],
  ["pod_return", ["view", "create", "approve"]],
  ["debt_payment", ["view", "create", "close"]],
  ["booking", ["view"]],
  ["awb_scan", ["use"]],
] as const;
const actor = (id: number, branchIds: number[]): AccessActor => ({
  id,
  status: "ACTIVE",
  branchIds,
  group: {
    id: 1,
    name: "FAKE",
    status: "ACTIVE",
    deletedAt: null,
    permissions: all.flatMap(([resource, actions]) =>
      actions.map((action) => ({ resource, action })),
    ),
  },
});
const awb = async (suffix: string, status = "Open", destination?: number) => {
  const row = await db.transaction.create({
    data: {
      awbNo: `${tag}-${suffix}`,
      originBranchId: ids.a,
      destinationBranchId: destination ?? ids.b,
      status,
      koli: 1,
      kilo: "2",
      biaya: "10000",
    },
  });
  ids.tx.push(row.id);
  return row;
};

beforeAll(async () => {
  m = {
    awb: await import("../../src/features/modul/server/awb-changes"),
    tariffs: await import("../../src/features/modul/server/tariffs"),
    pod: await import("../../src/features/modul/server/pod-returns"),
    bills: await import("../../src/features/modul/server/vendor-bills"),
    inbound: await import("../../src/features/modul/server/inbound"),
    proof: await import("../../src/features/modul/server/proof"),
  };
  ids.company = (
    await db.company.create({
      data: { name: tag, isDepositAgent: false, showPriceOnPrint: false },
    })
  ).id;
  ids.office = (
    await db.office.create({
      data: { companyId: ids.company, name: tag, code: tag, status: "ACTIVE" },
    })
  ).id;
  for (const key of ["a", "b"] as const)
    ids[key] = (
      await db.branch.create({
        data: {
          officeId: ids.office,
          name: `${tag}${key.toUpperCase()}`,
          code: `${tag}${key}`,
          status: "ACTIVE",
        },
      })
    ).id;
  for (const key of ["requester", "approver"] as const)
    ids[key] = (
      await db.user.create({
        data: {
          name: `FAKE ${key}`,
          email: `${randomUUID()}@example.invalid`,
          status: "ACTIVE",
        },
      })
    ).id;
  ids.vendor = (
    await db.vendor.create({
      data: {
        name: `${tag} vendor`,
        address1: "-",
        address2: "-",
        city: "-",
        postalCode: "-",
        phone: "-",
        fax: "-",
        email: "-",
        contactName: "-",
        branch: "-",
      },
    })
  ).id;
});

afterAll(async () => {
  await db.vendorBillItem.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.vendorBill.deleteMany({ where: { vendorId: ids.vendor } });
  await db.podReturnItem.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.podReturn.deleteMany({
    where: { originBranchId: { in: [ids.a, ids.b] } },
  });
  await db.awbChangeRequest.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.tariff.deleteMany({
    where: { originBranchId: { in: [ids.a, ids.b] } },
  });
  await db.booking.deleteMany({ where: { bookingNo: { startsWith: tag } } });
  await db.transactionStatusHistory.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.deliveryProofPhoto.deleteMany({
    where: { proof: { transactionId: { in: ids.tx } } },
  });
  await db.deliveryProof.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.deliverySheetItem.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.deliverySheet.deleteMany({
    where: { manifest: { branchId: { in: [ids.a, ids.b] } } },
  });
  await db.manifestItem.deleteMany({
    where: { transactionId: { in: ids.tx } },
  });
  await db.manifest.deleteMany({ where: { branchId: { in: [ids.a, ids.b] } } });
  await db.transaction.deleteMany({ where: { id: { in: ids.tx } } });
  await db.vendor.deleteMany({ where: { id: ids.vendor } });
  await db.user.deleteMany({
    where: { id: { in: [ids.requester, ids.approver] } },
  });
  await db.branch.deleteMany({ where: { id: { in: [ids.a, ids.b] } } });
  await db.office.deleteMany({ where: { id: ids.office } });
  await db.company.deleteMany({ where: { id: ids.company } });
  await db.$disconnect();
});

describe("Persetujuan Edit/delete AWB", () => {
  it("deletes an AWB only after another user approves", async () => {
    const t = await awb("del");
    const requester = actor(ids.requester, [ids.a]);
    const { id } = await m.awb.requestAwbChange(requester, {
      transactionId: t.id,
      kind: "DELETE",
      reason: "Salah input",
    });
    await expect(
      m.awb.requestAwbChange(requester, {
        transactionId: t.id,
        kind: "DELETE",
        reason: "Salah input lagi",
      }),
    ).rejects.toThrow("masih menunggu");
    await expect(
      m.awb.decideAwbChange(requester, { id, decision: "APPROVE" }),
    ).rejects.toThrow("pengaju sendiri");
    await m.awb.decideAwbChange(actor(ids.approver, [ids.a]), {
      id,
      decision: "APPROVE",
    });
    const row = await db.transaction.findUniqueOrThrow({ where: { id: t.id } });
    expect(row.deletedAt).not.toBeNull();
  });

  it("lets only one of two admins decide the same request", async () => {
    const t = await awb("race");
    const { id } = await m.awb.requestAwbChange(actor(ids.requester, [ids.a]), {
      transactionId: t.id,
      kind: "DELETE",
      reason: "Dobel input",
    });
    const adminA = actor(ids.approver, [ids.a]);
    const adminB = actor(ids.approver, [ids.a]);
    const results = await Promise.allSettled([
      m.awb.decideAwbChange(adminA, { id, decision: "APPROVE" }),
      m.awb.decideAwbChange(adminB, { id, decision: "REJECT" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected");
    expect(String((rejected as PromiseRejectedResult).reason)).toContain(
      "sudah diputuskan",
    );
  });

  it("creates one tariff when two admins save the same route at once", async () => {
    const admin = actor(ids.approver, []);
    admin.group?.permissions.push({
      resource: "system_admin",
      action: "manage",
    });
    const input = {
      originBranchId: ids.b,
      destinationBranchId: ids.a,
      minWeight: "1",
      pricePerKg: "9000",
    };
    const results = await Promise.allSettled([
      m.tariffs.saveTariff(admin, input),
      m.tariffs.saveTariff(admin, input),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      await db.tariff.count({
        where: {
          originBranchId: ids.b,
          destinationBranchId: ids.a,
          deletedAt: null,
        },
      }),
    ).toBe(1);
  });

  it("refuses deleting an AWB that is in a POD Kembali", async () => {
    const t = await awb("busy", "Delivered");
    await m.pod.createPodReturn(actor(ids.requester, [ids.a]), {
      returnDate: "2026-11-19",
      originBranchId: ids.a,
      destinationBranchId: ids.b,
      awbs: t.awbNo,
    });
    const { id } = await m.awb.requestAwbChange(actor(ids.requester, [ids.a]), {
      transactionId: t.id,
      kind: "DELETE",
      reason: "Coba hapus",
    });
    await expect(
      m.awb.decideAwbChange(actor(ids.approver, [ids.a]), {
        id,
        decision: "APPROVE",
      }),
    ).rejects.toThrow("POD Kembali");
  });

  it("applies an approved edit once and keeps the before/after values", async () => {
    const t = await awb("edit");
    const requester = actor(ids.requester, [ids.a]);
    const { id } = await m.awb.requestAwbChange(requester, {
      transactionId: t.id,
      kind: "EDIT",
      reason: "Penerima salah",
    });
    await expect(
      m.awb.applyApprovedEdit(requester, { requestId: id, receiverName: "X" }),
    ).rejects.toThrow("setelah pengajuan disetujui");
    await m.awb.decideAwbChange(actor(ids.approver, [ids.a]), {
      id,
      decision: "APPROVE",
    });
    await m.awb.applyApprovedEdit(requester, {
      requestId: id,
      receiverName: "Budi Santoso",
      kilo: "2.00",
    });
    const request = await db.awbChangeRequest.findUniqueOrThrow({
      where: { id },
    });
    expect(request.status).toBe("USED");
    expect(request.changes).toEqual({ receiverName: [null, "Budi Santoso"] });
    await expect(
      m.awb.applyApprovedEdit(requester, { requestId: id, receiverName: "Y" }),
    ).rejects.toThrow("hanya sekali");
  });

  it("hides requests outside the actor's branches", async () => {
    const rows = await m.awb.listAwbChanges(
      actor(ids.requester, [ids.vendor + 999_999]),
    );
    expect(rows.some((r) => r.transaction.awbNo?.startsWith(tag))).toBe(false);
  });
});

describe("Cek Ongkir", () => {
  it("charges max(weight, minimum) x price and rejects duplicate routes", async () => {
    const admin = actor(ids.approver, []);
    admin.group?.permissions.push({
      resource: "system_admin",
      action: "manage",
    });
    await m.tariffs.saveTariff(admin, {
      originBranchId: ids.a,
      destinationBranchId: ids.b,
      minWeight: "3",
      pricePerKg: "8500",
      eta: "2-3 hari",
    });
    await expect(
      m.tariffs.saveTariff(admin, {
        originBranchId: ids.a,
        destinationBranchId: ids.b,
        minWeight: "1",
        pricePerKg: "1",
      }),
    ).rejects.toThrow("sudah ada");
    const route = { origin: ids.a, destination: ids.b };
    const [light] = await m.tariffs.checkTariffs(admin, {
      ...route,
      weight: "2",
    });
    const [heavy] = await m.tariffs.checkTariffs(admin, {
      ...route,
      weight: "4.5",
    });
    expect(light.charge).toBe("25500");
    expect(heavy.charge).toBe("38250");
  });
});

describe("POD Kembali", () => {
  it("accepts only delivered AWBs and lets only the destination branch decide", async () => {
    const delivered = await awb("pod-ok", "Delivered");
    const open = await awb("pod-open");
    const sender = actor(ids.requester, [ids.a]);
    await expect(
      m.pod.createPodReturn(sender, {
        returnDate: "2026-11-19",
        originBranchId: ids.a,
        destinationBranchId: ids.b,
        awbs: `${delivered.awbNo}\n${open.awbNo}`,
      }),
    ).rejects.toThrow("Delivered");
    const doc = await m.pod.createPodReturn(sender, {
      returnDate: "2026-11-19",
      originBranchId: ids.a,
      destinationBranchId: ids.b,
      awbs: `${delivered.awbNo}`,
    });
    expect(doc.returnNo).toMatch(/^POD-20261119-\d{4}$/);
    await expect(
      m.pod.decidePodReturn(sender, { id: doc.id, decision: "APPROVE" }),
    ).rejects.toThrow("cabang tujuan");
    await m.pod.decidePodReturn(actor(ids.approver, [ids.b]), {
      id: doc.id,
      decision: "APPROVE",
    });
    const saved = await db.podReturn.findUniqueOrThrow({
      where: { id: doc.id },
    });
    expect(saved.status).toBe("APPROVED");
  });
});

describe("Pembayaran Hutang", () => {
  it("registers a vendor invoice with AWBs and closes it once", async () => {
    const t = await awb("bill");
    const user = actor(ids.requester, [ids.a]);
    const { id } = await m.bills.createVendorBill(user, {
      category: "Vendor",
      vendorId: ids.vendor,
      billDate: "2026-11-10",
      receivedDate: "2026-11-12",
      termDays: "14",
      amount: "150000",
      awbs: t.awbNo,
    });
    await expect(
      m.bills.createVendorBill(user, {
        category: "Vendor",
        vendorId: ids.vendor,
        billDate: "2026-11-10",
        amount: "1",
        invoiceNo: (await db.vendorBill.findUniqueOrThrow({ where: { id } }))
          .invoiceNo,
      }),
    ).rejects.toThrow("sudah tercatat");
    const [row] = (await m.bills.listVendorBills(user)).filter(
      (r) => r.id === id,
    );
    expect(row.reminderDate.toISOString().slice(0, 10)).toBe("2026-11-26");
    expect(row._count.items).toBe(1);
    await m.bills.closeVendorBill(user, id);
    await expect(m.bills.closeVendorBill(user, id)).rejects.toThrow(
      "sudah lunas",
    );
  });
});

describe("Inbound Booking", () => {
  it("lists bookings whose destination is the actor's branch", async () => {
    await db.booking.create({
      data: { bookingNo: `${tag}-in`, branchId: ids.a, destination: `${tag}B` },
    });
    await db.booking.create({
      data: {
        bookingNo: `${tag}-out`,
        branchId: ids.a,
        destination: "Kota lain",
      },
    });
    const rows = await m.inbound.listInboundBookings(
      actor(ids.approver, [ids.b]),
      {
        search: tag,
      },
    );
    expect(rows.map((r) => r.booking_no)).toEqual([`${tag}-in`]);
  });
});

describe("Scan & Konfirmasi (bukti terima)", () => {
  const photo = (n: number) => ({
    url: `https://res.cloudinary.com/demo/image/upload/v1/lms/pod/${tag}-${n}.webp`,
    publicId: `lms/pod/${tag}-${n}`,
  });

  it("shows the AWB card with tracking and records DITERIMA from Open", async () => {
    const t = await awb("pod1");
    const manifest = await db.manifest.create({
      data: {
        manifestNo: `${tag}-M1`,
        branchId: ids.a,
        originBranchId: ids.a,
        destinationBranchId: ids.b,
      },
    });
    await db.manifestItem.create({
      data: { manifestId: manifest.id, transactionId: t.id },
    });
    const sheet = await db.deliverySheet.create({
      data: { sheetNo: `${tag}-D1`, manifestId: manifest.id },
    });
    const courier = actor(ids.approver, [ids.a]);
    const card = await m.proof.scanLookup(courier, `${tag}-pod1`.toLowerCase());
    expect(card.awbNo).toBe(`${tag}-pod1`);
    expect(card.tracking.some((e) => e.text.startsWith("Masuk manifest"))).toBe(
      true,
    );
    await m.proof.recordProof(
      courier,
      {
        transactionId: t.id,
        outcome: "DELIVERED",
        receiverName: "Budi",
        notes: "Diterima satpam",
      },
      { photos: [photo(1), photo(2)], signature: photo(9) },
    );
    const after = await m.proof.awbForScan(courier, t.id);
    expect(after.status).toBe("Delivered");
    expect(after.proofs[0]).toMatchObject({
      outcome: "DELIVERED",
      receiverName: "Budi",
      signatureUrl: photo(9).url,
    });
    expect(after.proofs[0].photos.map((p) => p.position)).toEqual([1, 2]);
    const history = await db.transactionStatusHistory.findMany({
      where: { transactionId: t.id },
      orderBy: { id: "asc" },
    });
    expect(history.map((h) => `${h.priorStatus}>${h.newStatus}`)).toEqual([
      "Open>In Transit",
      "In Transit>Delivered",
    ]);
    const line = await db.deliverySheetItem.findFirstOrThrow({
      where: { deliverySheetId: sheet.id, transactionId: t.id },
    });
    expect(line).toMatchObject({ outcome: "DELIVERED", receivedBy: "Budi" });
    await expect(
      m.proof.recordProof(
        courier,
        { transactionId: t.id, outcome: "RETURNED" },
        { photos: [] },
      ),
    ).rejects.toThrow("sudah DITERIMA");
  });

  it("records RETUR without changing the AWB status and enforces the rules", async () => {
    const t = await awb("pod2", "In Transit");
    const courier = actor(ids.approver, [ids.a]);
    await expect(
      m.proof.recordProof(
        courier,
        { transactionId: t.id, outcome: "DELIVERED" },
        { photos: [] },
      ),
    ).rejects.toThrow("Nama penerima wajib");
    await expect(
      m.proof.recordProof(
        courier,
        { transactionId: t.id, outcome: "RETURNED" },
        { photos: [1, 2, 3, 4, 5, 6].map(photo) },
      ),
    ).rejects.toThrow("Maksimal 5 foto");
    await expect(
      m.proof.recordProof(
        actor(ids.approver, [ids.vendor + 999_999]),
        { transactionId: t.id, outcome: "RETURNED" },
        { photos: [] },
      ),
    ).rejects.toThrow("bukan milik cabang");
    await m.proof.recordProof(
      courier,
      {
        transactionId: t.id,
        outcome: "RETURNED",
        notes: "Alamat tidak ditemukan",
      },
      { photos: [] },
    );
    const row = await db.transaction.findUniqueOrThrow({ where: { id: t.id } });
    expect(row.status).toBe("In Transit");
    await expect(
      m.proof.assertProofAllowed(courier, t.id, "DELIVERED"),
    ).resolves.toBeUndefined();
  });

  it("resolves a koli label AWB-n to its AWB when n is within the koli", async () => {
    const t = await db.transaction.create({
      data: {
        awbNo: `${tag}-K`,
        originBranchId: ids.a,
        destinationBranchId: ids.b,
        koli: 3,
      },
    });
    ids.tx.push(t.id);
    const courier = actor(ids.approver, [ids.a]);
    expect((await m.proof.scanLookup(courier, `${tag}-K-2`)).id).toBe(t.id);
    expect((await m.proof.scanLookup(courier, `${tag}-K-3`)).id).toBe(t.id);
    await expect(m.proof.scanLookup(courier, `${tag}-K-4`)).rejects.toThrow(
      "tidak ditemukan",
    );
  });
});
