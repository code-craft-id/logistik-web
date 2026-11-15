import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAccountingQueries } from "../../src/features/finance/server/queries";
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
let financeBranch: number,
  financeCustomer: number,
  accountCategory: number,
  cashCategory: number;
const accounts: number[] = [],
  financeSources: number[] = [];
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
  cashAccountId: accounts[4],
  cashflowCategoryId: cashCategory,
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
  financeBranch = (
    await db.branch.create({
      data: {
        officeId: office,
        name: `${tag} FIN02`,
        code: `${tag} FIN02`,
        status: "ACTIVE",
      },
    })
  ).id;
  financeCustomer = (
    await db.customer.create({
      data: { name: `${tag} FIN02`, branchId: financeBranch },
    })
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
                  ...["view", "manage"].map((action) => ({
                    resource: "finance_account",
                    action,
                  })),
                  ...["view", "create", "post", "reverse"].map((action) => ({
                    resource: "journal",
                    action,
                  })),
                  ...["view", "create", "finalize", "reverse"].map(
                    (action) => ({ resource: "finance_cost", action }),
                  ),
                  ...["view", "close"].map((action) => ({
                    resource: "finance_period",
                    action,
                  })),
                  { resource: "financial_report", action: "view" },
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
              create: (i === 1 ? [otherBranch] : [branch, financeBranch]).map(
                (branchId) => ({ branchId }),
              ),
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
  for (let i = 0; i < 3; i++)
    financeSources.push(
      (
        await db.transaction.create({
          data: {
            originBranchId: financeBranch,
            awbNo: `${tag}-${i}-FIN02`.slice(-50),
            status: "Open",
          },
        })
      ).id,
    );
  accountCategory = (
    await service().execute({
      action: "finance_account.manage",
      key: randomUUID(),
      entity: "category",
      code: randomUUID().slice(0, 20),
      name: tag,
      kind: "ACCOUNT",
    })
  ).id;
  cashCategory = (
    await service().execute({
      action: "finance_account.manage",
      key: randomUUID(),
      entity: "category",
      code: randomUUID().slice(0, 20),
      name: tag,
      kind: "CASHFLOW",
      flowClass: "OPERATING",
    })
  ).id;
  for (const [kind, isCash] of [
    ["ASSET", false],
    ["REVENUE", false],
    ["EXPENSE", false],
    ["LIABILITY", false],
    ["ASSET", true],
    ["EXPENSE", false],
    ["EQUITY", false],
    ["ASSET", true],
  ] as const) {
    accounts.push(
      (
        await service().execute({
          action: "finance_account.manage",
          key: randomUUID(),
          entity: "account",
          code: randomUUID().slice(0, 20),
          name: tag,
          kind,
          isCash,
          categoryId: accountCategory,
        })
      ).id,
    );
  }
  for (const branchId of [branch, financeBranch])
    await service().execute({
      action: "finance_account.manage",
      key: randomUUID(),
      entity: "mapping",
      branchId,
      receivableId: accounts[0],
      revenueId: accounts[1],
      costId: accounts[2],
      liabilityId: accounts[3],
    });
});
afterAll(async () => {
  await db.$transaction(async (tx) => {
    const scope = { branchId: { in: [branch, financeBranch].filter(Boolean) } };
    await tx.finClosedPeriod.deleteMany({ where: scope });
    await tx.finLine.deleteMany({ where: { journal: scope } });
    await tx.finJournal.deleteMany({
      where: { ...scope, reversalOfId: { not: null } },
    });
    await tx.finJournal.deleteMany({ where: scope });
    await tx.finCost.deleteMany({
      where: { source: scope, reversalOfId: { not: null } },
    });
    await tx.finCost.deleteMany({ where: { source: scope } });
    await tx.finCostState.deleteMany({ where: scope });
    await tx.finMapping.deleteMany({ where: scope });
  });
  await db.finCommand.deleteMany({ where: { actorId: { in: users } } });
  const invoices = await db.finInvoice.findMany({
    where: { branchId: { in: [branch, otherBranch, financeBranch] } },
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
  await db.transaction.deleteMany({
    where: { id: { in: [...sources, ...financeSources] } },
  });
  await db.customer.deleteMany({
    where: { id: { in: [customer, financeCustomer].filter(Boolean) } },
  });
  await db.finAccount.deleteMany({ where: { id: { in: accounts } } });
  await db.finCategory.deleteMany({
    where: { id: { in: [accountCategory, cashCategory].filter(Boolean) } },
  });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  await db.branch.deleteMany({
    where: { id: { in: [branch, otherBranch, financeBranch].filter(Boolean) } },
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
    const reversals = await Promise.allSettled([
      service().execute(reverse),
      service().execute({ ...reverse, key: randomUUID() }),
    ]);
    expect(reversals.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    if (reversals[0].status === "rejected")
      await expect(service().execute(reverse)).rejects.toThrow();
    else await service().execute(reverse);
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
    await db.userAllowedBranch.createMany({
      data: [branch, financeBranch].map((branchId) => ({
        userId: users[0],
        branchId,
      })),
    });
    await db.permission.deleteMany({
      where: { groupId: groups[0], resource: "invoice", action: "create" },
    });
    await expect(service().execute(data)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await db.permission.create({
      data: { groupId: groups[0], resource: "invoice", action: "create" },
    });
  });
});

describe("FIN-02 guarded ledger and reconciliation", () => {
  it("serializes issue versus void and rechecks authority inside the critical section", async () => {
    const created = await service().execute(draft(sources[7]));
    const race = await Promise.allSettled([
      service().execute(issue(created.id)),
      service().execute({
        action: "invoice.void",
        key: randomUUID(),
        id: created.id,
        revision: 1,
        reason: "FAKE concurrent cancellation",
        accountingDate: "2026-11-15",
      }),
    ]);
    expect(race.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const row = await service().detail(created.id);
    expect(["ISSUED", "VOID"]).toContain(row.status);
    expect(
      await db.finJournal.count({
        where: { sourceKey: `invoice:${created.id}` },
      }),
    ).toBe(row.status === "ISSUED" ? 1 : 0);
    let release: () => void = () => {};
    let reached: () => void = () => {};
    const ready = new Promise<void>((r) => {
      reached = r;
    });
    const pause = new Promise<void>((r) => {
      release = r;
    });
    let count = 0;
    const delayed = createFinanceService(db, async () => {
      if (++count === 2) {
        reached();
        await pause;
      }
      return loadAccessActor(db, users[0]);
    });
    const pending = delayed.execute(draft(sources[8]));
    await ready;
    await db.permission.deleteMany({
      where: { groupId: groups[0], resource: "invoice", action: "create" },
    });
    release();
    await expect(pending).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      await db.finReservation.count({ where: { transactionId: sources[8] } }),
    ).toBe(0);
    await db.permission.create({
      data: { groupId: groups[0], resource: "invoice", action: "create" },
    });
  });
  it("keeps inactive-branch history administrator-only and refuses new receipts even for administrators", async () => {
    const created = await service().execute(draft(sources[9]));
    await service().execute(issue(created.id));
    await db.branch.update({
      where: { id: branch },
      data: { status: "INACTIVE" },
    });
    await expect(service().detail(created.id)).rejects.toMatchObject({
      code: "FORBIDDEN_BRANCH",
    });
    await db.permission.create({
      data: { groupId: groups[0], resource: "system_admin", action: "manage" },
    });
    expect((await service().detail(created.id)).id).toBe(created.id);
    await expect(service().execute(receipt(created.id))).rejects.toMatchObject({
      code: "FORBIDDEN_BRANCH",
    });
    await db.branch.update({
      where: { id: branch },
      data: { status: "ACTIVE" },
    });
    await db.permission.deleteMany({
      where: { groupId: groups[0], resource: "system_admin" },
    });
  });
  const query = (i = 0) =>
    createAccountingQueries(db, () => loadAccessActor(db, users[i]));
  const command = (action: string, data: Record<string, unknown>) =>
    service().execute({ action, key: randomUUID(), ...data });
  const period = () => ({
    branchId: financeBranch,
    start: "2026-11-01",
    end: "2026-11-30",
  });
  let invoiceId: number, receiptId: number, expenseId: number;
  const costIds: number[] = [];
  it("refuses invalid sources and rolls invoice issue back if posting configuration is inactive", async () => {
    await expect(
      service().execute(draft(sources[4], { customerId: financeCustomer })),
    ).rejects.toThrow();
    await db.transaction.update({
      where: { id: sources[4] },
      data: { status: "Cancelled" },
    });
    const created = await service().execute(draft(sources[4]));
    await expect(service().execute(issue(created.id))).rejects.toThrow();
    await db.transaction.update({
      where: { id: sources[4] },
      data: { status: "Open" },
    });
    await db.finAccount.update({
      where: { id: accounts[1] },
      data: { active: false },
    });
    await expect(service().execute(issue(created.id))).rejects.toThrow();
    expect((await service().detail(created.id)).status).toBe("DRAFT");
    expect(
      await db.finJournal.count({
        where: { sourceKey: `invoice:${created.id}` },
      }),
    ).toBe(0);
    await db.finAccount.update({
      where: { id: accounts[1] },
      data: { active: true },
    });
  });
  it("reconciles adopted 150000 revenue / 90000 actual costs / 10000 expense; receipts are not revenue", async () => {
    invoiceId = (
      await service().execute(
        draft(financeSources[0], {
          branchId: financeBranch,
          customerId: financeCustomer,
          items: [
            { transactionId: financeSources[0], amount: "100000.00" },
            { transactionId: financeSources[1], amount: "50000.00" },
          ],
        }),
      )
    ).id;
    await service().execute(issue(invoiceId));
    expect((await query().report(period())).grossProfit).toBeNull();
    await db.transaction.update({
      where: { id: financeSources[0] },
      data: { originBranchId: branch },
    });
    await command("finance_cost.finalize", {
      branchId: branch,
      transactionId: financeSources[0],
      accountingDate: "2026-11-15",
      reason: "FAKE different branch zero cost",
    });
    expect((await query().report(period())).grossProfit).toBeNull();
    await db.finCostState.delete({
      where: { transactionId: financeSources[0] },
    });
    await db.transaction.update({
      where: { id: financeSources[0] },
      data: { originBranchId: financeBranch },
    });
    receiptId = (await service().execute(receipt(invoiceId, "100000.00"))).id;
    for (const [index, amount] of ["60000.00", "30000.00"].entries()) {
      const payload = {
        branchId: financeBranch,
        transactionId: financeSources[index],
        amount,
        accountingDate: "2026-11-15",
        supplierReference: "FAKE supplier document",
        reason: "FAKE actual cost verified",
      };
      const key = randomUUID();
      const cost = await command("finance_cost.create", { ...payload, key });
      expect(await command("finance_cost.create", { ...payload, key })).toEqual(
        cost,
      );
      costIds.push(cost.id);
      await command("finance_cost.finalize", {
        branchId: financeBranch,
        transactionId: financeSources[index],
        accountingDate: "2026-11-15",
        reason: "FAKE complete reviewed supplier documents",
      });
    }
    expenseId = (
      await command("journal.expense", {
        branchId: financeBranch,
        accountingDate: "2026-11-15",
        reference: "FAKE office expense",
        reason: "FAKE paid office expense",
        amount: "10000.00",
        expenseAccountId: accounts[5],
        cashAccountId: accounts[4],
        cashflowCategoryId: cashCategory,
      })
    ).id;
    const report = await query().report(period());
    expect(report).toMatchObject({
      complete: true,
      revenue: "150000.00",
      expenses: "100000.00",
      grossProfit: "60000.00",
      netProfit: "50000.00",
      bridge: { difference: "-10000.00" },
    });
    expect(report.gp.map((r) => r.profit).sort()).toEqual([
      "20000.00",
      "40000.00",
    ]);
    expect(report.recap).toEqual([
      {
        key: "2026-11",
        revenue: "150000.00",
        cost: "90000.00",
        profit: "60000.00",
      },
    ]);
    expect(report.cashflow).toEqual([
      { category: "OPERATING", amount: "90000.00" },
    ]);
    const lines = await db.finLine.findMany({
      where: { journal: { branchId: financeBranch, status: "POSTED" } },
    });
    expect(
      lines.reduce((a, l) => a + Number(l.debit.minus(l.credit).toFixed(2)), 0),
    ).toBe(0);
    await expect(query(1).report(period())).rejects.toMatchObject({
      code: "FORBIDDEN_BRANCH",
    });
    await expect(query(2).report(period())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("enforces balanced persistence, posted immutability, controlled accounts and one-time concurrent posting", async () => {
    await expect(
      command("journal.create", {
        branchId: financeBranch,
        accountingDate: "2026-11-15",
        reference: "FAKE unbalanced",
        reason: "FAKE",
        lines: [
          { accountId: accounts[5], side: "DEBIT", amount: "10" },
          { accountId: accounts[6], side: "CREDIT", amount: "9" },
        ],
      }),
    ).rejects.toThrow();
    await expect(
      command("journal.create", {
        branchId: financeBranch,
        accountingDate: "2026-11-15",
        reference: "FAKE bypass",
        reason: "FAKE",
        lines: [
          { accountId: accounts[0], side: "DEBIT", amount: "10" },
          { accountId: accounts[1], side: "CREDIT", amount: "10" },
        ],
      }),
    ).rejects.toThrow();
    await expect(
      db.$transaction(async (tx) => {
        await tx.finJournal.create({
          data: {
            branchId: financeBranch,
            accountingDate: new Date("2026-11-15"),
            status: "POSTED",
            reference: "FAKE invalid SQL",
            reason: "FAKE",
            sourceType: "MANUAL",
            lines: {
              create: [
                {
                  accountId: accounts[5],
                  debit: "10",
                  credit: "0",
                  snapshot: {},
                },
                {
                  accountId: accounts[6],
                  debit: "0",
                  credit: "9",
                  snapshot: {},
                },
              ],
            },
          },
        });
      }),
    ).rejects.toThrow();
    const created = await command("journal.create", {
      branchId: financeBranch,
      accountingDate: "2026-11-15",
      reference: "FAKE manual",
      reason: "FAKE",
      lines: [
        { accountId: accounts[5], side: "DEBIT", amount: "10" },
        { accountId: accounts[6], side: "CREDIT", amount: "10" },
      ],
    });
    const post = { action: "journal.post", key: randomUUID(), id: created.id };
    const race = await Promise.allSettled([
      service().execute(post),
      service().execute({ ...post, key: randomUUID() }),
    ]);
    expect(race.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    await expect(
      db.finJournal.update({
        where: { id: created.id },
        data: { reason: "FAKE rewrite" },
      }),
    ).rejects.toThrow();
    const line = await db.finLine.findFirstOrThrow({
      where: { journalId: created.id },
    });
    await expect(
      db.finLine.update({ where: { id: line.id }, data: { debit: "1" } }),
    ).rejects.toThrow();
    await command("journal.reverse", {
      id: created.id,
      accountingDate: "2026-11-15",
      reason: "FAKE correction",
    });
    await expect(
      command("journal.reverse", {
        id: created.id,
        accountingDate: "2026-11-15",
        reason: "FAKE duplicate",
      }),
    ).rejects.toThrow();
    const account = await db.finAccount.findUniqueOrThrow({
      where: { id: accounts[1] },
    });
    await expect(
      command("finance_account.manage", {
        entity: "account",
        ...account,
        kind: "EXPENSE",
      }),
    ).rejects.toThrow();
    const unused = await db.finAccount.findUniqueOrThrow({
      where: { id: accounts[7] },
    });
    await command("finance_account.manage", {
      entity: "account",
      ...unused,
      active: "false",
    });
    expect(
      await db.finAccount.findUnique({ where: { id: unused.id } }),
    ).toMatchObject({ active: false, deletedAt: null });
    await command("finance_account.manage", {
      entity: "account",
      ...unused,
      active: "true",
    });
  });
  it("void retains supplier costs; cost reversal races compensate once and require renewed completeness", async () => {
    await command("payment.reverse", {
      id: receiptId,
      accountingDate: "2026-11-15",
      reason: "FAKE bank correction",
    });
    const row = await service().detail(invoiceId);
    await command("invoice.void", {
      id: invoiceId,
      revision: row.revision,
      accountingDate: "2026-11-15",
      reason: "FAKE correction",
    });
    const voided = await query().report(period());
    expect(voided).toMatchObject({
      revenue: "0.00",
      grossProfit: "-90000.00",
      netProfit: "-100000.00",
    });
    const races = await Promise.allSettled([
      command("finance_cost.reverse", {
        id: costIds[0],
        accountingDate: "2026-11-15",
        reason: "FAKE supplier cancelled obligation",
      }),
      command("finance_cost.reverse", {
        id: costIds[0],
        accountingDate: "2026-11-15",
        reason: "FAKE duplicate",
      }),
    ]);
    expect(races.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await query().report(period())).grossProfit).toBeNull();
    await command("finance_cost.reverse", {
      id: costIds[1],
      accountingDate: "2026-11-15",
      reason: "FAKE supplier cancelled obligation",
    });
    for (const transactionId of financeSources.slice(0, 2))
      await command("finance_cost.finalize", {
        branchId: financeBranch,
        transactionId,
        accountingDate: "2026-11-15",
        reason: "FAKE explicit zero remaining costs; obligations cancelled",
      });
    expect(await query().report(period())).toMatchObject({
      complete: true,
      grossProfit: "0.00",
      netProfit: "-10000.00",
    });
    const unknown = await service().execute(
      draft(financeSources[2], {
        branchId: financeBranch,
        customerId: financeCustomer,
      }),
    );
    await service().execute(issue(unknown.id));
    await command("invoice.void", {
      id: unknown.id,
      revision: 2,
      accountingDate: "2026-11-15",
      reason: "FAKE void does not establish costs",
    });
    expect((await query().report(period())).grossProfit).toBeNull();
    await expect(
      command("finance_period.close", {
        branchId: financeBranch,
        month: "2026-11",
        reason: "FAKE incomplete",
      }),
    ).rejects.toThrow();
    await command("finance_cost.finalize", {
      branchId: financeBranch,
      transactionId: financeSources[2],
      accountingDate: "2026-11-15",
      reason: "FAKE explicit zero; no supplier obligation confirmed",
    });
  });
  it("excludes internal cash transfers and rejects writes to closed periods while permitting forward reversals", async () => {
    await command("journal.transfer", {
      branchId: financeBranch,
      accountingDate: "2026-11-15",
      reference: "FAKE own transfer",
      reason: "FAKE",
      amount: "100",
      fromAccountId: accounts[4],
      toAccountId: accounts[7],
    });
    expect((await query().report(period())).cashflow).toEqual([
      { category: "OPERATING", amount: "-10000.00" },
    ]);
    const close = {
      action: "finance_period.close",
      key: randomUUID(),
      branchId: financeBranch,
      month: "2026-11",
      reason: "FAKE reconciled period",
    };
    await service().execute(close);
    await service().execute(close);
    await expect(
      command("finance_cost.create", {
        branchId: financeBranch,
        transactionId: financeSources[0],
        accountingDate: "2026-11-15",
        amount: "1",
        supplierReference: "FAKE",
        reason: "FAKE",
      }),
    ).rejects.toThrow();
    await expect(
      command("journal.reverse", {
        id: expenseId,
        accountingDate: "2026-11-15",
        reason: "FAKE backdate",
      }),
    ).rejects.toThrow();
    await command("journal.reverse", {
      id: expenseId,
      accountingDate: "2026-12-01",
      reason: "FAKE forward correction",
    });
    expect((await query().report(period())).netProfit).toBe("-10000.00");
    expect(
      (
        await query().report({
          ...period(),
          start: "2026-12-01",
          end: "2026-12-31",
        })
      ).netProfit,
    ).toBe("10000.00");
  });
});
