import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { createTransactionReportService } from "../../src/features/reports/transaction-details/server/service";
import { type Prisma, PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: testDatabaseUrl(
      process.env.TEST_DATABASE_URL,
      process.env.DATABASE_URL,
    ),
  }),
});
const tag = `RPT${randomUUID().slice(0, 20)}`;
const period = {
  startDate: "2026-11-01",
  endDate: "2026-11-15",
  search: tag,
  pageSize: "100",
};
const groups: number[] = [],
  users: number[] = [],
  branches: number[] = [],
  transactionIds: number[] = [],
  visibleIds: number[] = [];
let companyId: number,
  officeId: number,
  nullId: number,
  noAwbId: number,
  destinationId: number,
  hiddenId: number,
  inactiveId: number,
  beforeId: number,
  cutoffId: number;
const service = (id: number) =>
  createTransactionReportService(db, () => loadAccessActor(db, id));
async function record(
  data: Prisma.TransactionUncheckedCreateInput,
  visible = false,
) {
  const row = await db.transaction.create({ data });
  transactionIds.push(row.id);
  if (visible) visibleIds.push(row.id);
  return row.id;
}
beforeAll(async () => {
  companyId = (
    await db.company.create({
      data: { name: tag, isDepositAgent: false, showPriceOnPrint: false },
    })
  ).id;
  officeId = (
    await db.office.create({
      data: { companyId, name: tag, code: tag, status: "ACTIVE" },
    })
  ).id;
  for (let i = 0; i < 4; i++)
    branches.push(
      (
        await db.branch.create({
          data: {
            officeId,
            code: `${tag}${i}`,
            name: `FAKE report branch ${i}`,
            status: i === 3 ? "INACTIVE" : "ACTIVE",
          },
        })
      ).id,
    );
  for (let i = 0; i < 4; i++) {
    groups.push(
      (
        await db.userGroup.create({
          data: {
            name: `${tag}${i}`,
            permissions: {
              create:
                i === 0
                  ? [{ resource: "system_admin", action: "manage" }]
                  : i === 2
                    ? [{ resource: "transaction", action: "view" }]
                    : [{ resource: "transaction_report", action: "view" }],
            },
          },
        })
      ).id,
    );
    users.push(
      (
        await db.user.create({
          data: {
            name: "FAKE report user",
            email: `${randomUUID()}@example.invalid`,
            groupId: groups[i],
            allowedBranches: {
              create: (i === 3
                ? []
                : [branches[0], branches[1], branches[3]]
              ).map((branchId) => ({ branchId })),
            },
          },
        })
      ).id,
    );
  }
  for (let i = 0; i < 30; i++)
    await record(
      {
        awbNo: `${tag}-${i}`,
        transactionDate: new Date("2026-11-02T12:00:00Z"),
        originBranchId: branches[0],
        destinationBranchId: branches[2],
        senderName: "FAKE sender",
        receiverName: "FAKE receiver",
        koli: i === 0 ? 0 : i,
        kilo: i === 0 ? "0.00" : "12.34",
        biaya: "99.99",
        status: ["Open", "In Transit", "Delivered", "Cancelled"][i % 4],
      },
      true,
    );
  await record(
    {
      awbNo: `${tag}-dup`,
      transactionDate: new Date("2026-11-01T00:00:00Z"),
      originBranchId: branches[0],
      koli: null,
      kilo: null,
    },
    true,
  );
  await record(
    {
      awbNo: `${tag}-dup`,
      transactionDate: new Date("2026-11-01T00:00:00Z"),
      originBranchId: branches[1],
    },
    true,
  );
  destinationId = await record(
    {
      awbNo: `${tag}-destination`,
      transactionDate: new Date("2026-11-03T00:00:00Z"),
      originBranchId: branches[2],
      destinationBranchId: branches[1],
    },
    true,
  );
  hiddenId = await record({
    awbNo: `${tag}-hidden`,
    transactionDate: new Date("2026-11-03T00:00:00Z"),
    originBranchId: branches[2],
  });
  inactiveId = await record({
    awbNo: `${tag}-inactive`,
    transactionDate: new Date("2026-11-03T00:00:00Z"),
    originBranchId: branches[3],
  });
  nullId = await record({
    awbNo: `${tag}-null`,
    transactionDate: new Date("2026-11-03T00:00:00Z"),
  });
  noAwbId = await record({
    awbNo: null,
    transactionDate: new Date("2026-11-03T00:00:00Z"),
    originBranchId: branches[0],
  });
  await record({
    awbNo: `${tag}-deleted`,
    transactionDate: new Date("2026-11-03T00:00:00Z"),
    originBranchId: branches[0],
    deletedAt: new Date(),
  });
  beforeId = await record({
    awbNo: `${tag}-before`,
    transactionDate: new Date("2026-10-31T23:59:59.999Z"),
    originBranchId: branches[0],
  });
  cutoffId = await record({
    awbNo: `${tag}-cutoff`,
    transactionDate: new Date("2026-11-16T00:00:00Z"),
    originBranchId: branches[0],
  });
});
afterAll(async () => {
  await db.transaction.deleteMany({ where: { id: { in: transactionIds } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  await db.branch.deleteMany({ where: { id: { in: branches } } });
  if (officeId) await db.office.delete({ where: { id: officeId } });
  if (companyId) await db.company.delete({ where: { id: companyId } });
  await db.$disconnect();
});
describe("RPT-01A guarded real PostgreSQL report", () => {
  it("reconciles exact scoped source IDs, UTC boundaries, all statuses, duplicate AWBs and Decimal/null values", async () => {
    const result = await service(users[1]).read(period);
    expect(result.total).toBe(visibleIds.length);
    expect(new Set(result.items.map((row) => row.id))).toEqual(
      new Set(visibleIds),
    );
    expect(result.items.some((row) => row.id === destinationId)).toBe(true);
    expect(result.items.map((row) => row.id)).not.toEqual(
      expect.arrayContaining([
        hiddenId,
        inactiveId,
        nullId,
        beforeId,
        cutoffId,
      ]),
    );
    expect(new Set(result.items.map((row) => row.status))).toEqual(
      new Set(["Open", "In Transit", "Delivered", "Cancelled"]),
    );
    expect(
      result.items.filter((row) => row.awbNo === `${tag}-dup`),
    ).toHaveLength(2);
    expect(result.items.find((row) => row.awbNo === `${tag}-0`)?.kilo).toBe(
      "0",
    );
    expect(result.items.some((row) => row.kilo === "12.34")).toBe(true);
    expect(
      result.items.some((row) => row.koli === null && row.kilo === null),
    ).toBe(true);
    expect(JSON.stringify(result.items)).not.toMatch(
      /biaya|idempotencyKey|createdById/,
    );
    const noSearch = await service(users[1]).read({
      ...period,
      search: "",
      branchId: String(branches[0]),
    });
    expect(noSearch.items.find((row) => row.id === noAwbId)?.awbNo).toBeNull();
  });
  it("paginates same-date source records stably and keeps selected-branch filter within current membership", async () => {
    const first = await service(users[1]).read({ ...period, pageSize: "10" });
    const second = await service(users[1]).read({
      ...period,
      pageSize: "10",
      page: "2",
    });
    const all = await service(users[1]).read(period);
    expect([...first.items, ...second.items].map((row) => row.id)).toEqual(
      all.items.slice(0, 20).map((row) => row.id),
    );
    expect(
      new Set([...first.items, ...second.items].map((row) => row.id)).size,
    ).toBe(20);
    await expect(
      service(users[1]).read({ ...period, branchId: String(branches[2]) }),
    ).rejects.toHaveProperty("status", 403);
    await expect(
      service(users[1]).read({ ...period, branchId: String(branches[3]) }),
    ).rejects.toHaveProperty("status", 403);
    expect((await service(users[3]).read(period)).total).toBe(0);
  });
  it("admin sees inactive and null/null historical source but cannot forge a missing option", async () => {
    const result = await service(users[0]).read(period);
    expect(result.items.map((row) => row.id)).toEqual(
      expect.arrayContaining([hiddenId, inactiveId, nullId]),
    );
    expect(result.branches.map((branch) => branch.id)).toContain(branches[3]);
    expect(
      (
        await service(users[0]).read({
          ...period,
          branchId: String(branches[3]),
        })
      ).items.map((row) => row.id),
    ).toEqual([inactiveId]);
    await expect(
      service(users[0]).read({ ...period, branchId: "2147483647" }),
    ).rejects.toHaveProperty("status", 403);
  });
  it("denies transaction-only grant and observes live permission/membership/active hierarchy changes", async () => {
    await expect(service(users[2]).read(period)).rejects.toHaveProperty(
      "status",
      403,
    );
    await db.permission.deleteMany({ where: { groupId: groups[1] } });
    await expect(service(users[1]).read(period)).rejects.toHaveProperty(
      "status",
      403,
    );
    await db.permission.create({
      data: {
        groupId: groups[1],
        resource: "transaction_report",
        action: "view",
      },
    });
    await db.userAllowedBranch.deleteMany({
      where: { userId: users[1], branchId: branches[1] },
    });
    expect(
      (await service(users[1]).read(period)).items.some(
        (row) => row.id === destinationId,
      ),
    ).toBe(false);
    await db.userAllowedBranch.create({
      data: { userId: users[1], branchId: branches[1] },
    });
    await db.office.update({
      where: { id: officeId },
      data: { status: "INACTIVE" },
    });
    expect((await service(users[1]).read(period)).total).toBe(0);
    await db.office.update({
      where: { id: officeId },
      data: { status: "ACTIVE" },
    });
  });
  it("preserves OR visibility through an active allowed endpoint when the other branch is inactive", async () => {
    const mixed = await record({
      awbNo: `${tag}-mixed`,
      transactionDate: new Date("2026-11-03T00:00:00Z"),
      originBranchId: branches[3],
      destinationBranchId: branches[0],
    });
    const result = await service(users[1]).read(period);
    expect(result.items.map((row) => row.id)).toContain(mixed);
    expect(result.branches.map((branch) => branch.id)).not.toContain(
      branches[3],
    );
  });
  it("treats AWB wildcard characters as literal substrings", async () => {
    const literalId = await record({
      awbNo: `${tag}-literal_%\\`,
      transactionDate: new Date("2026-11-03T00:00:00Z"),
      originBranchId: branches[0],
    });
    await record({
      awbNo: `${tag}-literalABC`,
      transactionDate: new Date("2026-11-03T00:00:00Z"),
      originBranchId: branches[0],
    });
    for (const search of ["literal_", "%", "\\"]) {
      const result = await service(users[1]).read({ ...period, search });
      expect(result.items.map((row) => row.id)).toEqual([literalId]);
      expect(result.total).toBe(1);
    }
  });
  it("keeps one rows/count snapshot when a real external writer commits between the two reads", async () => {
    const before = (await service(users[1]).read(period)).total;
    let inserted = false;
    const wrapped = new Proxy(db, {
      get(target, property) {
        if (property !== "$transaction") return Reflect.get(target, property);
        return (
          work: (tx: Prisma.TransactionClient) => Promise<unknown>,
          options: object,
        ) =>
          db.$transaction(
            async (tx) =>
              work(
                new Proxy(tx, {
                  get(inner, key) {
                    if (key !== "transaction") return Reflect.get(inner, key);
                    return new Proxy(tx.transaction, {
                      get(model, method) {
                        if (method !== "findMany")
                          return Reflect.get(model, method);
                        return async (args: Prisma.TransactionFindManyArgs) => {
                          const rows = await tx.transaction.findMany(args);
                          if (!inserted) {
                            inserted = true;
                            await record({
                              awbNo: `${tag}-concurrent`,
                              transactionDate: new Date("2026-11-03T00:00:00Z"),
                              originBranchId: branches[0],
                            });
                          }
                          return rows;
                        };
                      },
                    });
                  },
                }),
              ),
            options,
          );
      },
    });
    const result = await createTransactionReportService(wrapped, () =>
      loadAccessActor(db, users[1]),
    ).read(period);
    expect(inserted).toBe(true);
    expect(result.total).toBe(before);
    expect(result.items).toHaveLength(before);
    expect((await service(users[1]).read(period)).total).toBe(before + 1);
  });
});
