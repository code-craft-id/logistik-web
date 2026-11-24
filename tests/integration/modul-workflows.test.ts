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
  apAging: typeof import("../../src/features/reports/aging/server/ap-aging");
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
  ["booking", ["view", "approve"]],
  ["transaction", ["view", "update"]],
  ["transaction_report", ["view", "export"]],
  ["manifest", ["view", "update"]],
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
    apAging: await import("../../src/features/reports/aging/server/ap-aging"),
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
  await db.courier.deleteMany({ where: { name: { startsWith: tag } } });
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
  await db.manifestScan.deleteMany({
    where: { transactionId: { in: ids.tx } },
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
      receiverName: "Budi Santoso",
    });
    await expect(
      m.awb.applyApprovedEdit(requester, { requestId: id, receiverName: "X" }),
    ).rejects.toThrow("setelah pengajuan disetujui");
    await m.awb.decideAwbChange(actor(ids.approver, [ids.a]), {
      id,
      decision: "APPROVE",
    });
    await m.awb.applyApprovedEdit(requester, { requestId: id });
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
      branchId: ids.a,
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
        branchId: ids.a,
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

  it("reports all bills open at Jakarta month end within owning branches", async () => {
    const month = 6;
    const year = 2025;
    const records = await Promise.all([
      db.vendorBill.create({
        data: {
          branchId: ids.a,
          vendorId: ids.vendor,
          invoiceNo: `${tag}-aging-open`,
          category: "Vendor",
          billDate: new Date("2025-04-15T00:00:00.000Z"),
          createdAt: new Date("2025-04-15T00:00:00.000Z"),
          amount: "0.10",
        },
      }),
      db.vendorBill.create({
        data: {
          branchId: ids.a,
          vendorId: ids.vendor,
          invoiceNo: `${tag}-aging-paid-after`,
          category: "Vendor",
          billDate: new Date("2025-06-30T00:00:00.000Z"),
          createdAt: new Date("2025-06-30T00:00:00.000Z"),
          amount: "0.20",
          status: "PAID",
          closedAt: new Date("2025-07-01T00:00:00.001+07:00"),
        },
      }),
      db.vendorBill.create({
        data: {
          branchId: ids.a,
          vendorId: ids.vendor,
          invoiceNo: `${tag}-aging-paid-before`,
          category: "Vendor",
          billDate: new Date("2025-06-30T00:00:00.000Z"),
          createdAt: new Date("2025-06-30T00:00:00.000Z"),
          amount: "4.00",
          status: "PAID",
          closedAt: new Date("2025-06-30T23:59:59.999+07:00"),
        },
      }),
      db.vendorBill.create({
        data: {
          branchId: ids.b,
          vendorId: ids.vendor,
          invoiceNo: `${tag}-aging-other-branch`,
          category: "Vendor",
          billDate: new Date("2025-06-30T00:00:00.000Z"),
          createdAt: new Date("2025-06-30T00:00:00.000Z"),
          amount: "8.00",
        },
      }),
    ]);
    const report = await m.apAging.apAgingReport(
      actor(ids.requester, [ids.a]),
      { month, year, vendorId: ids.vendor },
    );
    expect(report.items.map((row) => row.number)).toEqual([
      `${tag}-aging-open`,
      `${tag}-aging-paid-after`,
    ]);
    expect(report.totals.total).toBe("0.30");
    expect(report.totals.b61_90).toBe("0.10");
    expect(report.totals.b0_30).toBe("0.20");
    expect(report.end).toBe("30-06-2025");
    expect(records).toHaveLength(4);
    await db.vendorBill.deleteMany({
      where: { id: { in: records.map((r) => r.id) } },
    });
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

  it("records RETUR as Returned, allows a later delivery and enforces the rules", async () => {
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
    expect(row.status).toBe("Returned");
    await expect(
      m.proof.assertProofAllowed(courier, t.id, "RETURNED"),
    ).rejects.toThrow("sudah RETUR");
    // Resent and delivered later: Returned → In Transit → Delivered.
    await m.proof.recordProof(
      courier,
      { transactionId: t.id, outcome: "DELIVERED", receiverName: "Sari" },
      { photos: [] },
    );
    const history = await db.transactionStatusHistory.findMany({
      where: { transactionId: t.id },
      orderBy: { id: "asc" },
    });
    expect(history.map((h) => `${h.priorStatus}>${h.newStatus}`)).toEqual([
      "In Transit>Returned",
      "Returned>In Transit",
      "In Transit>Delivered",
    ]);
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

describe("Booking pickup (berdiri sendiri)", () => {
  it("assigns a courier, refuses other branches and confirms the pickup once", async () => {
    const pickup = await import("../../src/features/bookings/server/pickup");
    const courierA = await db.courier.create({
      data: {
        name: `${tag} kurir A`,
        address: "-",
        nationalIdNumber: "1",
        phone: "1",
        branchId: ids.a,
      },
    });
    const courierB = await db.courier.create({
      data: {
        name: `${tag} kurir B`,
        address: "-",
        nationalIdNumber: "2",
        phone: "2",
        branchId: ids.b,
      },
    });
    const booking = await db.booking.create({
      data: { bookingNo: `${tag}-BK1`, branchId: ids.a, senderName: "Toko" },
    });
    expect(booking.status).toBe("WAITING TO PICKUP");
    const adminA = actor(ids.approver, [ids.a]);
    // Scanning from another branch: the provider's message.
    await expect(
      pickup.scanBooking(actor(ids.approver, [ids.b]), `${tag}-bk1`),
    ).rejects.toThrow("No. Booking tidak sesuai dengan cabang asal kurir.");
    // Not assigned yet: the card explains, confirming is refused.
    expect((await pickup.scanBooking(adminA, `${tag}-BK1`))?.blocked).toContain(
      "belum ditugaskan",
    );
    await expect(pickup.confirmPickup(adminA, booking.id)).rejects.toThrow(
      "belum ditugaskan",
    );
    await expect(
      pickup.assignCourier(adminA, {
        bookingId: booking.id,
        courierId: courierB.id,
      }),
    ).rejects.toThrow("cabang yang sama");
    await pickup.assignCourier(adminA, {
      bookingId: booking.id,
      courierId: courierA.id,
    });
    const done = await pickup.confirmPickup(adminA, booking.id);
    expect(done).toMatchObject({
      status: "PROGRESS PICKUP",
      courier: `${tag} kurir A`,
    });
    await expect(pickup.confirmPickup(adminA, booking.id)).rejects.toThrow(
      "sedang dijemput",
    );
    await expect(
      pickup.cancelBooking(adminA, { bookingId: booking.id, reason: "Batal" }),
    ).rejects.toThrow("tidak bisa dibatalkan");
  });

  it("records the courier's pickup result and retries a missed pickup", async () => {
    const pickup = await import("../../src/features/bookings/server/pickup");
    const courier = await db.courier.create({
      data: {
        name: `${tag} kurir C`,
        address: "-",
        nationalIdNumber: "3",
        phone: "3",
        branchId: ids.a,
      },
    });
    const booking = await db.booking.create({
      data: { bookingNo: `${tag}-BK3`, branchId: ids.a, courierId: courier.id },
    });
    const adminA = actor(ids.approver, [ids.a]);
    await expect(
      pickup.recordPickupResult(adminA, {
        bookingId: booking.id,
        result: "SUCCESS",
      }),
    ).rejects.toThrow("PROGRESS PICKUP");
    await pickup.confirmPickup(adminA, booking.id);
    await expect(
      pickup.recordPickupResult(adminA, {
        bookingId: booking.id,
        result: "MISS",
        note: "",
      }),
    ).rejects.toThrow("minimal 3");
    const missed = await pickup.recordPickupResult(adminA, {
      bookingId: booking.id,
      result: "MISS",
      note: "Toko tutup",
    });
    expect(missed).toMatchObject({
      status: "MISS PICKUP",
      pickupNote: "Toko tutup",
    });
    // Admin re-assigns: back to waiting, the courier can pick up again.
    await pickup.assignCourier(adminA, {
      bookingId: booking.id,
      courierId: courier.id,
    });
    await pickup.confirmPickup(adminA, booking.id);
    const taken = await pickup.recordPickupResult(adminA, {
      bookingId: booking.id,
      result: "SUCCESS",
    });
    expect(taken.status).toBe("SUCCESS PICKUP");
    await expect(
      pickup.recordPickupResult(adminA, {
        bookingId: booking.id,
        result: "MISS",
        note: "lagi",
      }),
    ).rejects.toThrow("PROGRESS PICKUP");
  });

  it("cancels a waiting booking with a reason", async () => {
    const pickup = await import("../../src/features/bookings/server/pickup");
    const booking = await db.booking.create({
      data: { bookingNo: `${tag}-BK2`, branchId: ids.a },
    });
    const adminA = actor(ids.approver, [ids.a]);
    await expect(
      pickup.cancelBooking(adminA, { bookingId: booking.id, reason: "x" }),
    ).rejects.toThrow("minimal 3");
    await pickup.cancelBooking(adminA, {
      bookingId: booking.id,
      reason: "Pengirim membatalkan",
    });
    const saved = await db.booking.findUniqueOrThrow({
      where: { id: booking.id },
    });
    expect(saved).toMatchObject({
      status: "CANCEL PICKUP",
      cancelReason: "Pengirim membatalkan",
    });
    expect((await pickup.scanBooking(adminA, `${tag}-BK2`))?.blocked).toBe(
      "Booking sudah dibatalkan.",
    );
  });
});

describe("Tracking AWB", () => {
  it("finds AWBs by AWB No., koli label or DO and builds the tracking card", async () => {
    const tracking = await import(
      "../../src/features/shipments/server/tracking"
    );
    const t = await awb("TRK1");
    await db.transaction.update({
      where: { id: t.id },
      data: { doNo: `${tag}-DO1 ${tag}-DO2`, remarks: "Fragile" },
    });
    const inA = actor(ids.approver, [ids.a]);
    const byAwb = await tracking.searchTracking(inA, {
      awb: `${tag}-trk1`,
    });
    expect(byAwb.map((x) => x.id)).toEqual([t.id]);
    expect(
      (await tracking.searchTracking(inA, { awb: `${tag}-TRK1-1` })).map(
        (x) => x.id,
      ),
    ).toEqual([t.id]);
    expect(
      (await tracking.searchTracking(inA, { doNo: `${tag}-DO2` })).map(
        (x) => x.id,
      ),
    ).toEqual([t.id]);
    // Outside the actor's branches: nothing.
    const stranger = await db.branch.create({
      data: {
        officeId: ids.office,
        name: `${tag}X`,
        code: `${tag}X`,
        status: "ACTIVE",
      },
    });
    const other = actor(ids.approver, [stranger.id]);
    expect(
      await tracking.searchTracking(other, { awb: `${tag}-TRK1` }),
    ).toEqual([]);
    expect(await tracking.trackingDetail(other, t.id)).toBeNull();
    const card = await tracking.trackingDetail(inA, t.id);
    expect(card).toMatchObject({
      awbNo: `${tag}-TRK1`,
      remarks: "Fragile",
      receivedAt: null,
      leadTimeDays: null,
      photos: [],
    });
    await db.branch.delete({ where: { id: stranger.id } });
  });
});

describe("Kelola Status Pengiriman", () => {
  it("lists AWBs of the actor's branches with receipt data and SLA", async () => {
    const list = await import(
      "../../src/features/shipments/server/status-list"
    );
    const open = await awb("STS1");
    const done = await awb("STS2", "Delivered");
    await db.deliveryProof.create({
      data: {
        transactionId: done.id,
        outcome: "DELIVERED",
        receiverName: "Pak Penerima",
      },
    });
    await db.tariff.create({
      data: {
        originBranchId: ids.a,
        destinationBranchId: ids.b,
        pricePerKg: "1000",
        eta: "1-2 hari",
      },
    });
    const inA = actor(ids.approver, [ids.a]);
    const result = await list.listShipmentStatus(inA, { search: `${tag}-STS` });
    const byId = new Map(result.rows.map((r) => [r.id, r]));
    expect(byId.get(open.id)).toMatchObject({
      sla: "In Progress",
      receivedBy: null,
    });
    expect(byId.get(done.id)).toMatchObject({
      // Received the same day: On Time against the route's Estimasi.
      sla: "On Time",
      receivedBy: "Pak Penerima",
      leadTimeDays: 0,
    });
    expect(
      (
        await list.listShipmentStatus(inA, {
          search: `${tag}-STS`,
          status: "Delivered",
        })
      ).rows.map((r) => r.id),
    ).toEqual([done.id]);
    // Another branch sees none of them.
    const stranger = await db.branch.create({
      data: {
        officeId: ids.office,
        name: `${tag}Y`,
        code: `${tag}Y`,
        status: "ACTIVE",
      },
    });
    expect(
      (
        await list.listShipmentStatus(actor(ids.approver, [stranger.id]), {
          search: `${tag}-STS`,
        })
      ).total,
    ).toBe(0);
    await db.deliveryProof.deleteMany({ where: { transactionId: done.id } });
    await db.branch.delete({ where: { id: stranger.id } });
  });
});

describe("Rekap Transaksi", () => {
  it("groups a month per day and destination like the provider export", async () => {
    const recap = await import("../../src/features/reports/recap/server/recap");
    const XLSX = await import("xlsx");
    const created: number[] = [];
    const costType = async (name: string) => {
      const found = await db.costType.findFirst({
        where: { name, deletedAt: null },
      });
      if (found) return found.id;
      const made = await db.costType.create({ data: { name } });
      created.push(made.id);
      return made.id;
    };
    const cash = await costType("CASH");
    const cod = await costType("COD");
    const make = async (suffix: string, day: string, data: object) => {
      const t = await awb(suffix);
      await db.transaction.update({
        where: { id: t.id },
        data: { transactionDate: new Date(`${day}T03:00:00Z`), ...data },
      });
      return t;
    };
    await make("RK1", "2026-03-02", {
      costTypeId: cash,
      biaya: "10000",
      koli: 2,
    });
    await make("RK2", "2026-03-02", { costTypeId: cod, biaya: "5000" });
    // Voided AWB: its day still gets a sheet, with zero totals.
    await make("RK3", "2026-03-03", { deletedAt: new Date() });
    await make("RK4", "2026-04-01", {});
    const result = await recap.recapTransactions(actor(ids.approver, [ids.a]), {
      month: "3",
      year: "2026",
      branchId: String(ids.a),
    });
    expect(result.days.map((d) => d.day)).toEqual(["2026-03-02", "2026-03-03"]);
    expect(result.days[0].total).toMatchObject({
      awb: 2,
      koli: 3,
      kilo: 4,
      cash: 10000,
      cod: 5000,
      kredit: 0,
    });
    expect(result.days[1].total.awb).toBe(0);
    // Another branch is refused.
    await expect(
      recap.recapTransactions(actor(ids.approver, [ids.b]), {
        month: "3",
        year: "2026",
        branchId: String(ids.a),
      }),
    ).rejects.toThrow();
    const book = XLSX.read(recap.recapWorkbook(result));
    expect(book.SheetNames).toEqual(["2026-03-02", "2026-03-03"]);
    const rows = XLSX.utils.sheet_to_json<string[]>(book.Sheets["2026-03-02"], {
      header: 1,
      defval: "",
    });
    expect(rows[1][1]).toBe("Rekap Transaksi");
    expect(rows[2][1]).toBe(`Cabang : ${tag}A`);
    expect(rows[4].slice(1)).toEqual([
      "No.",
      "Cabang Tujuan",
      "Total AWB",
      "Total Koli",
      "Total Berat",
      "Total Volume",
      "CASH",
      "KREDIT",
      "COD",
      "Total Penagihan",
    ]);
    expect(rows.at(-1)?.slice(2)).toEqual([
      "TOTAL",
      2,
      3,
      4,
      0,
      10000,
      0,
      5000,
      15000,
    ]);
    const one = XLSX.read(
      recap.recapWorkbook({
        ...result,
        input: { ...result.input, sheet: "one" },
      }),
    );
    expect(one.SheetNames).toEqual(["Rekap Transaksi"]);
    await db.transaction.updateMany({
      where: { id: { in: ids.tx } },
      data: { costTypeId: null },
    });
    await db.costType.deleteMany({ where: { id: { in: created } } });
  });
});

describe("Import Status Excel", () => {
  it("checks every row, applies DITERIMA/RETUR rows and skips the rest", async () => {
    const imp = await import(
      "../../src/features/shipments/server/status-import"
    );
    const XLSX = await import("xlsx");
    const ok = await awb("IMP1");
    const retur = await awb("IMP2", "In Transit");
    const odd = await awb("IMP3");
    const sheet = XLSX.utils.aoa_to_sheet([
      imp.IMPORT_HEADERS,
      [`${tag}-imp1`, "2026-11-18", "Ryan", 2, "Sudah diterima dengan baik"],
      [`${tag}-IMP2`, "2026-11-18", "", "001", "Alamat tidak ditemukan"],
      [`${tag}-IMP3`, "2026-11-18", "Budi", 7, ""],
      [`${tag}-NOPE`, "2026-11-18", "Budi", 2, ""],
      [`${tag}-IMP1`, "2026-11-18", "Ryan", 2, ""],
      [`${tag}-IMP3`, "2999-01-01", "Budi", 2, ""],
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Import Status");
    const bytes = new Uint8Array(
      XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer,
    );
    const parsed = imp.parseStatusFile(bytes, "status.xlsx");
    const inA = actor(ids.approver, [ids.a]);
    const preview = await imp.checkStatusRows(inA, parsed);
    expect(preview.map((r) => r.error === null)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(preview[2].error).toContain("belum didukung");
    expect(preview[3].error).toContain("tidak ditemukan");
    expect(preview[4].error).toContain("baris sebelumnya");
    // Preview writes nothing.
    expect(
      (await db.transaction.findUniqueOrThrow({ where: { id: ok.id } })).status,
    ).toBe("Open");
    const applied = await imp.applyStatusRows(inA, parsed);
    expect(applied.filter((r) => r.applied).map((r) => r.line)).toEqual([2, 3]);
    expect(
      (await db.transaction.findUniqueOrThrow({ where: { id: ok.id } })).status,
    ).toBe("Delivered");
    const proof = await db.deliveryProof.findFirstOrThrow({
      where: { transactionId: ok.id },
    });
    expect(proof).toMatchObject({ outcome: "DELIVERED", receiverName: "Ryan" });
    expect(proof.createdAt.toISOString().slice(0, 10)).toBe("2026-11-18");
    expect(
      (await db.transaction.findUniqueOrThrow({ where: { id: retur.id } }))
        .status,
    ).toBe("Returned");
    expect(
      (await db.transaction.findUniqueOrThrow({ where: { id: odd.id } }))
        .status,
    ).toBe("Open");
    // Wrong header or file type is refused before any row is read.
    expect(() =>
      imp.parseStatusFile(new TextEncoder().encode("a,b\n1,2"), "x.csv"),
    ).toThrow("Kolom harus persis");
    expect(() =>
      imp.parseStatusFile(new Uint8Array([1, 2, 3]), "x.png"),
    ).toThrow("file Excel");
  });
});

describe("Laporan AP (Rekap Aging Pemasok)", () => {
  it("lists bills still open at Jakarta month end with exact amounts", async () => {
    const ap = await import("../../src/features/reports/aging/server/ap-aging");
    const { businessDateString } = await import(
      "../../src/lib/date/business-date"
    );
    const [year, month, today] = businessDateString().split("-").map(Number);
    const day = (n: number) => new Date(Date.UTC(year, month - 1, n));
    const open = await db.vendorBill.create({
      data: {
        branchId: ids.a,
        category: "Vendor",
        vendorId: ids.vendor,
        invoiceNo: `${tag}-AP1`,
        billDate: day(1),
        termDays: 30,
        amount: "250000",
        createdById: ids.approver,
      },
    });
    const paid = await db.vendorBill.create({
      data: {
        branchId: ids.a,
        category: "Agen",
        vendorId: ids.vendor,
        invoiceNo: `${tag}-AP2`,
        billDate: day(Math.max(1, today - 1)),
        amount: "90000",
        status: "PAID",
        closedAt: new Date("2020-01-01T00:00:00Z"),
        createdById: ids.approver,
      },
    });
    const report = await ap.apAgingReport(actor(ids.approver, [ids.a]), {
      month: String(month),
      year: String(year),
      vendorId: String(ids.vendor),
    });
    expect(report.items.map((r) => r.number)).toEqual([`${tag}-AP1`]);
    expect(report.items[0]).toMatchObject({
      category: "Vendor",
      total: "250000.00",
      b0_30: "250000.00",
    });
    expect(report.percent.b0_30).toBe(100);
    // Another user without the bill's branch or authorship sees nothing.
    const other = await ap.apAgingReport(actor(ids.requester, [ids.b]), {
      month: String(month),
      year: String(year),
      vendorId: String(ids.vendor),
    });
    expect(other.items).toEqual([]);
    expect(ap.apAgingWorkbook(report).length).toBeGreaterThan(0);
    await db.vendorBill.deleteMany({
      where: { id: { in: [open.id, paid.id] } },
    });
  });
});

describe("Scan koli transit / inbound", () => {
  it("records each koli once at the transit and destination branches", async () => {
    const scan = await import(
      "../../src/features/shipments/server/manifest-scan"
    );
    const t = await awb("MS1");
    await db.transaction.update({ where: { id: t.id }, data: { koli: 2 } });
    const manifest = await db.manifest.create({
      data: {
        manifestNo: `${tag}-MS`,
        branchId: ids.a,
        originBranchId: ids.a,
        destinationBranchId: ids.b,
        transit1: `${tag}A`,
        status: "Draft",
      },
    });
    await db.manifestItem.create({
      data: { manifestId: manifest.id, transactionId: t.id },
    });
    const inA = actor(ids.approver, [ids.a]);
    const inB = actor(ids.approver, [ids.b]);
    await expect(
      scan.scanKoli(inB, manifest.id, "INBOUND", `${tag}-MS1`),
    ).rejects.toThrow("Draft");
    await db.manifest.update({
      where: { id: manifest.id },
      data: { status: "In Transit" },
    });
    // Only the destination scans inbound; only a listed transit branch scans transit.
    await expect(
      scan.scanKoli(inA, manifest.id, "INBOUND", `${tag}-MS1`),
    ).rejects.toThrow("cabang tujuan");
    await expect(
      scan.scanKoli(inB, manifest.id, "TRANSIT", `${tag}-MS1`),
    ).rejects.toThrow("Transit1-5");
    const transit = await scan.scanKoli(
      inA,
      manifest.id,
      "TRANSIT",
      `${tag}-ms1`,
    );
    expect(transit).toMatchObject({ piece: 1, scanned: 1, koli: 2 });
    expect(
      (await scan.manifestScanView(inA, manifest.id, "TRANSIT")).transitNo,
    ).toBe(1);
    // Inbound: bare AWB takes the next koli, a label takes its koli.
    await scan.scanKoli(inB, manifest.id, "INBOUND", `${tag}-MS1-2`);
    expect(
      await scan.scanKoli(inB, manifest.id, "INBOUND", `${tag}-MS1`),
    ).toMatchObject({ piece: 1, scanned: 2 });
    await expect(
      scan.scanKoli(inB, manifest.id, "INBOUND", `${tag}-MS1`),
    ).rejects.toThrow("Semua koli");
    await expect(
      scan.scanKoli(inB, manifest.id, "INBOUND", `${tag}-MS1-2`),
    ).rejects.toThrow("sudah di-scan");
    await expect(
      scan.scanKoli(inB, manifest.id, "INBOUND", `${tag}-MS1-3`),
    ).rejects.toThrow("hanya 2 koli");
    await expect(
      scan.scanKoli(inB, manifest.id, "INBOUND", `${tag}-NOPE`),
    ).rejects.toThrow("tidak ada di manifest");
    const view = await scan.manifestScanView(inB, manifest.id, "INBOUND");
    expect(view).toMatchObject({ totalKoli: 2, totalScanned: 2 });
    expect(
      (await scan.firstTransitScans([manifest.id])).get(manifest.id)?.user,
    ).toBe("FAKE approver");
    expect((await scan.firstInboundScans([t.id])).has(t.id)).toBe(true);
    const list = await import(
      "../../src/features/shipments/server/status-list"
    );
    const row = (
      await list.listShipmentStatus(inB, { search: `${tag}-MS1` })
    ).rows.find((r) => r.id === t.id);
    expect(row?.accIn).not.toBeNull();
  });
});
