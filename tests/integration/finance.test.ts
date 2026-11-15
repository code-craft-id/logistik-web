import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createFinanceService } from "../../src/features/finance/server/service";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: testDatabaseUrl(
      process.env.TEST_DATABASE_URL,
      process.env.DATABASE_URL,
    ),
  }),
});
const tag = `FAKE FIN ${randomUUID()}`;
let company: number,
  office: number,
  branch: number,
  otherBranch: number,
  customer: number;
const users: number[] = [],
  groups: number[] = [],
  sources: number[] = [];
const service = (i = 0) =>
  createFinanceService(db, () => loadAccessActor(db, users[i]));
const draft = (source: number, extra = {}) => ({
  action: "invoice.create",
  key: randomUUID(),
  branchId: branch,
  customerId: customer,
  invoiceDate: "2026-11-15",
  dueDate: "2026-11-30",
  items: [{ transactionId: source, amount: "100000.00" }],
  ...extra,
});
const issue = (id: number, revision = 1) => ({
  action: "invoice.issue",
  key: randomUUID(),
  id,
  revision,
});
const receipt = (invoiceId: number, amount = "80000.00") => ({
  action: "payment.create",
  key: randomUUID(),
  invoiceId,
  amount,
  receivedDate: "2026-11-15",
  method: "bank",
  reference: "FAKE ref",
  note: "",
  cashAccountId: 1,
});

beforeAll(async () => {
  company = (
    await db.company.create({
      data: { name: tag, isDepositAgent: false, showPriceOnPrint: false },
    })
  ).id;
  office = (
    await db.office.create({
      data: { companyId: company, code: tag, name: tag, status: "ACTIVE" },
    })
  ).id;
  branch = (
    await db.branch.create({
      data: { officeId: office, name: tag, code: tag, status: "ACTIVE" },
    })
  ).id;
  otherBranch = (
    await db.branch.create({
      data: {
        officeId: office,
        name: `${tag} X`,
        code: `${tag} X`,
        status: "ACTIVE",
      },
    })
  ).id;
  customer = (
    await db.customer.create({ data: { name: tag, branchId: branch } })
  ).id;
  for (let i = 0; i < 3; i++) {
    const group = await db.userGroup.create({
      data: {
        name: `${tag} ${i}`,
        permissions: {
          create:
            i === 2
              ? []
              : [
                  ...["view", "create", "update", "issue", "void"].map(
                    (action) => ({ resource: "invoice", action }),
                  ),
                  ...["view", "create", "reverse"].map((action) => ({
                    resource: "payment",
                    action,
                  })),
                ],
        },
      },
    });
    groups.push(group.id);
    users.push(
      (
        await db.user.create({
          data: {
            name: tag,
            email: `${randomUUID()}@example.invalid`,
            groupId: group.id,
            allowedBranches: {
              create: { branchId: i === 1 ? otherBranch : branch },
            },
          },
        })
      ).id,
    );
  }
  for (let i = 0; i < 12; i++)
    sources.push(
      (
        await db.transaction.create({
          data: {
            originBranchId: branch,
            awbNo: `${tag}-${i}`.slice(-50),
            status: "Open",
            biaya: "999999.99",
          },
        })
      ).id,
    );
});
afterAll(async () => {
  await db.finCommand.deleteMany({ where: { actorId: { in: users } } });
  const invoices = await db.finInvoice.findMany({
    where: { branchId: { in: [branch, otherBranch] } },
    select: { id: true },
  });
  const ids = invoices.map((x) => x.id);
  await db.finReceipt.deleteMany({
    where: { invoiceId: { in: ids }, reversalOfId: { not: null } },
  });
  await db.finReceipt.deleteMany({ where: { invoiceId: { in: ids } } });
  await db.finReservation.deleteMany({ where: { invoiceId: { in: ids } } });
  await db.finInvoiceItem.deleteMany({ where: { invoiceId: { in: ids } } });
  await db.finInvoice.deleteMany({ where: { id: { in: ids } } });
  await db.transaction.deleteMany({ where: { id: { in: sources } } });
  if (customer) await db.customer.delete({ where: { id: customer } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  await db.branch.deleteMany({
    where: { id: { in: [branch, otherBranch].filter(Boolean) } },
  });
  if (office) await db.office.delete({ where: { id: office } });
  if (company) await db.company.delete({ where: { id: company } });
  await db.$disconnect();
});
describe("FIN-01 guarded persistence", () => {
  it("reserves a source once under concurrent creates and rejects duplicate lines", async () => {
    const results = await Promise.allSettled([
      service().execute(draft(sources[0])),
      service().execute(draft(sources[0])),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      await db.finReservation.count({ where: { transactionId: sources[0] } }),
    ).toBe(1);
    await expect(
      service().execute(
        draft(sources[1], {
          items: [
            { transactionId: sources[1], amount: "1" },
            { transactionId: sources[1], amount: "2" },
          ],
        }),
      ),
    ).rejects.toThrow();
  });
  it("serializes edits with issue, preserves snapshot and rejects stale void", async () => {
    const { id } = await service().execute(draft(sources[1]));
    const results = await Promise.allSettled([
      service().execute(issue(id)),
      service().execute({
        ...draft(sources[1]),
        action: "invoice.update",
        id,
        revision: 1,
        items: [{ transactionId: sources[1], amount: "1.00" }],
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    let row = await service().detail(id);
    if (row.status === "DRAFT")
      await service().execute(issue(id, row.revision));
    row = await service().detail(id);
    await db.transaction.update({
      where: { id: sources[1] },
      data: { awbNo: `FAKE changed ${randomUUID()}` },
    });
    expect((await service().detail(id)).snapshot).toEqual(row.snapshot);
    await expect(
      service().execute({
        ...draft(sources[1]),
        action: "invoice.update",
        id,
        revision: row.revision,
      }),
    ).rejects.toThrow();
    await expect(
      service().execute({
        action: "invoice.void",
        key: randomUUID(),
        id,
        revision: 1,
        reason: "FAKE",
        accountingDate: "2026-11-15",
      }),
    ).rejects.toThrow();
  });
  it("prevents overpayment races; reversals restore balance exactly once, void releases source", async () => {
    const { id } = await service().execute(draft(sources[2]));
    const issued = issue(id);
    await service().execute(issued);
    await service().execute(issued);
    const results = await Promise.allSettled([
      service().execute(receipt(id)),
      service().execute(receipt(id)),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const row = await service().detail(id);
    expect(row.balance).toBe("20000.00");
    expect(row.paymentStatus).toBe("PARTIAL");
    await expect(
      service().execute({
        action: "invoice.void",
        key: randomUUID(),
        id,
        revision: row.revision,
        reason: "FAKE",
        accountingDate: "2026-11-15",
      }),
    ).rejects.toThrow();
    const reverse = {
      action: "payment.reverse",
      key: randomUUID(),
      id: row.receipts[0].id,
      reason: "FAKE correction",
      accountingDate: "2026-11-15",
    };
    await service().execute(reverse);
    await service().execute(reverse);
    await expect(
      service().execute({ ...reverse, key: randomUUID() }),
    ).rejects.toThrow();
    expect((await service().detail(id)).balance).toBe("100000.00");
    await service().execute({
      action: "invoice.void",
      key: randomUUID(),
      id,
      revision: row.revision,
      reason: "FAKE",
      accountingDate: "2026-11-15",
    });
    expect((await service().detail(id)).balance).toBe("0.00");
    await expect(service().execute(draft(sources[2]))).resolves.toHaveProperty(
      "id",
    );
  });
  it("rechecks current grants and branch on reads, writes and idempotent replay", async () => {
    const data = draft(sources[3]);
    const result = await service().execute(data);
    expect(await service().execute(data)).toEqual(result);
    await expect(
      service().execute({
        ...data,
        items: [{ transactionId: sources[3], amount: "5.00" }],
      }),
    ).rejects.toThrow();
    await expect(service(1).detail(result.id)).rejects.toMatchObject({
      code: "FORBIDDEN_BRANCH",
    });
    await expect(service(1).execute(draft(sources[4]))).rejects.toMatchObject({
      code: "FORBIDDEN_BRANCH",
    });
    await expect(service(2).list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await db.userAllowedBranch.deleteMany({ where: { userId: users[0] } });
    await expect(service().execute(data)).rejects.toMatchObject({
      code: "FORBIDDEN_BRANCH",
    });
    expect((await service().list()).total).toBe(0);
    await db.userAllowedBranch.create({
      data: { userId: users[0], branchId: branch },
    });
    await db.permission.deleteMany({
      where: { groupId: groups[0], resource: "invoice", action: "create" },
    });
    await expect(service().execute(data)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
