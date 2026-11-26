import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAccountingQueries } from "../../src/features/finance/server/queries";
import { createFinanceService } from "../../src/features/finance/server/service";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { type Prisma, PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const url = testDatabaseUrl(
  process.env.TEST_DATABASE_URL,
  process.env.DATABASE_URL,
);
// Report modules use the shared client (@/lib/db): point it at the test DB.
process.env.DATABASE_URL = url;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
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
// Posted finance records are undeletable (20261118000100_fin_delete_guards).
// Test-only teardown: the test-database owner suspends those guards inside the
// cleanup transaction; ALTER TABLE is transactional, so they return on commit.
const guards = [
  ["fin_journals", "fin_journal_no_delete"],
  ["fin_lines", "fin_line_no_delete"],
  ["fin_receipts", "fin_receipt_no_delete"],
  ["fin_invoices", "fin_invoice_no_delete"],
  ["fin_invoice_items", "fin_invoice_item_no_delete"],
] as const;
async function toggleGuards(tx: Prisma.TransactionClient, on: boolean) {
  for (const [table, trigger] of guards)
    await tx.$executeRawUnsafe(
      `ALTER TABLE ${table} ${on ? "ENABLE" : "DISABLE"} TRIGGER ${trigger}`,
    );
}

afterAll(async () => {
  await db.$transaction(async (tx) => {
    await toggleGuards(tx, false);
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
    const invoices = await tx.finInvoice.findMany({
      where: { branchId: { in: [branch, otherBranch, financeBranch] } },
      select: { id: true },
    });
    const ids = invoices.map((x) => x.id);
    await tx.finReceipt.deleteMany({
      where: { invoiceId: { in: ids }, reversalOfId: { not: null } },
    });
    await tx.finReceipt.deleteMany({ where: { invoiceId: { in: ids } } });
    await tx.finReservation.deleteMany({ where: { invoiceId: { in: ids } } });
    await tx.finInvoiceItem.deleteMany({ where: { invoiceId: { in: ids } } });
    await tx.finInvoice.deleteMany({ where: { id: { in: ids } } });
    // Fire deferred balance triggers first; ALTER TABLE refuses pending events.
    await tx.$executeRawUnsafe("SET CONSTRAINTS ALL IMMEDIATE");
    await toggleGuards(tx, true);
  });
  await db.finCommand.deleteMany({ where: { actorId: { in: users } } });
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
    // Report AR (Rekap Aging Pelanggan, Belum Lunas): remaining balance in
    // one age bucket, term = due - invoice date.
    const { agingReport, agingWorkbook } = await import(
      "../../src/features/reports/aging/server/aging"
    );
    const agingActor = await loadAccessActor(db, users[0]);
    if (!agingActor) throw new Error("actor not found");
    const aging = await agingReport(agingActor, {
      month: "11",
      year: "2026",
    });
    const line = aging.items.find((x) => x.number === row.number);
    // No customer Termin in this fixture: invoice term (due - invoice date).
    expect(line).toMatchObject({
      total: 100000,
      termDays: 15,
      term: "15 Hari",
    });
    expect(
      (line?.b0_21 ?? 0) + (line?.b21_30 ?? 0) + (line?.b30plus ?? 0),
    ).toBe(20000);
    expect(aging.end).toBe("30-11-2026");
    // Serah terima faktur: recorded on the issued invoice, shown in AR.
    await expect(
      service().execute({
        action: "invoice.handover",
        key: randomUUID(),
        id,
        revision: row.revision,
        handoverDate: "2999-01-01",
        handoverTo: "Bu Sari",
      }),
    ).rejects.toThrow("masa depan");
    await service().execute({
      action: "invoice.handover",
      key: randomUUID(),
      id,
      revision: row.revision,
      handoverDate: "2026-11-16",
      handoverTo: "Bu Sari",
    });
    const handed = await service().detail(id);
    expect(handed).toMatchObject({
      handoverDate: "2026-11-16",
      handoverTo: "Bu Sari",
    });
    const agingAfter = await agingReport(agingActor, {
      month: "11",
      year: "2026",
    });
    expect(agingAfter.items.find((x) => x.number === row.number)).toMatchObject(
      { handoverDate: "16-11-2026", handoverTo: "Bu Sari" },
    );
    // Later commands use the new revision.
    row.revision = handed.revision;
    expect(agingWorkbook(aging).length).toBeGreaterThan(0);
    // Legacy list columns: snapshot customer/branch, term in days, AWB count.
    const listed = (await service().list({ branchId: branch })).items.find(
      (x) => x.id === id,
    );
    expect(listed).toMatchObject({
      customerName: row.issuedCustomerName,
      branchName: row.issuedBranchName,
      awbCount: row.items.length,
    });
    expect(listed?.termDays).toBeGreaterThanOrEqual(0);
    // Invoice Paid filter: partly paid is outstanding, fully paid is paid.
    const ids = async (payment: "PAID" | "OUTSTANDING") =>
      (await service().list({ branchId: branch, payment })).items.map(
        (x) => x.id,
      );
    expect(await ids("OUTSTANDING")).toContain(id);
    expect(await ids("PAID")).not.toContain(id);
    const rest = { ...receipt(id, "20000.00") };
    await service().execute(rest);
    expect((await service().detail(id)).paymentStatus).toBe("PAID");
    expect(await ids("PAID")).toContain(id);
    expect(await ids("OUTSTANDING")).not.toContain(id);
    const paid = await service().detail(id);
    const undo = paid.receipts.find((r) => r.amount === "20000.00");
    if (!undo) throw new Error("second receipt not found");
    await service().execute({
      action: "payment.reverse",
      key: randomUUID(),
      id: undo.id,
      reason: "FAKE undo full payment",
      accountingDate: "2026-11-15",
    });
    expect(await ids("OUTSTANDING")).toContain(id);
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

describe("Perkiraan Excel export / template / import", () => {
  it("upserts by Kode Akun in one transaction and rejects a bad row without saving", async () => {
    const XLSX = await import("xlsx");
    const excel = await import(
      "../../src/features/finance/server/account-excel"
    );
    const reader = await loadAccessActor(db, users[0]);
    if (!reader) throw new Error("actor not found");
    const categoryCode = (
      await db.finCategory.findUniqueOrThrow({ where: { id: accountCategory } })
    ).code;
    const code = `X${randomUUID().slice(0, 8)}`;
    const file = (rows: (string | number)[][]) => {
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet([[...excel.ACCOUNT_COLUMNS], ...rows]),
        "Perkiraan",
      );
      return new Uint8Array(
        XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer,
      );
    };
    const parent = [
      `${code}-P`,
      "FAKE Induk",
      "",
      "ASSET",
      categoryCode,
      "",
      "",
      "",
      "N",
      "Y",
      "Y",
    ];
    const child = [
      `${code}-C`,
      "FAKE Kas",
      "",
      "ASSET",
      categoryCode,
      `${code}-P`,
      "",
      "",
      "Y",
      "Y",
      "Y",
    ];
    expect(await excel.importAccounts(reader, file([parent, child]))).toEqual({
      created: 2,
      updated: 0,
    });
    const saved = await db.finAccount.findMany({
      where: { code: { startsWith: code } },
      orderBy: { code: "asc" },
    });
    accounts.push(...saved.map((a) => a.id));
    expect(saved.find((a) => a.code === `${code}-C`)?.parentId).toBe(
      saved.find((a) => a.code === `${code}-P`)?.id,
    );
    expect(
      await excel.importAccounts(
        reader,
        file([[...parent.slice(0, 1), "FAKE Induk Baru", ...parent.slice(2)]]),
      ),
    ).toEqual({ created: 0, updated: 1 });
    // Kas/Bank on a revenue account fails the form rule: nothing is saved.
    await expect(
      excel.importAccounts(
        reader,
        file([
          [
            `${code}-N`,
            "FAKE Baru",
            "",
            "ASSET",
            categoryCode,
            "",
            "",
            "",
            "N",
            "Y",
            "Y",
          ],
          [
            `${code}-R`,
            "FAKE Pend",
            "",
            "REVENUE",
            categoryCode,
            "",
            "",
            "",
            "Y",
            "Y",
            "Y",
          ],
        ]),
      ),
    ).rejects.toThrow("Baris 3: Kas/bank harus akun aset.");
    expect(
      await db.finAccount.count({ where: { code: { startsWith: code } } }),
    ).toBe(2);
    await expect(
      excel.importAccounts(reader, file([]).slice(0, 0)),
    ).rejects.toThrow();
    // The template keeps its guide sheet and note lines; import still finds the header.
    const template = XLSX.read(excel.accountTemplate());
    expect(template.SheetNames).toEqual(["Perkiraan", "Petunjuk"]);
    const noted = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(noted, template.Sheets.Petunjuk, "Petunjuk");
    XLSX.utils.book_append_sheet(
      noted,
      XLSX.utils.aoa_to_sheet([
        ["Catatan: isi mulai baris di bawah judul"],
        [...excel.ACCOUNT_COLUMNS],
        [
          `${code}-G`,
          "FAKE Guide",
          "",
          "ASSET",
          categoryCode,
          "",
          "",
          "",
          "1",
          "1",
          "0",
        ],
      ]),
      "Perkiraan",
    );
    expect(
      await excel.importAccounts(
        reader,
        new Uint8Array(
          XLSX.write(noted, { type: "buffer", bookType: "xlsx" }) as Buffer,
        ),
      ),
    ).toEqual({ created: 1, updated: 0 });
    const guided = await db.finAccount.findFirstOrThrow({
      where: { code: `${code}-G` },
    });
    accounts.push(guided.id);
    expect(guided).toMatchObject({ isCash: true, active: false });
    const exported = XLSX.read(await excel.accountsWorkbook(reader));
    const rows = XLSX.utils.sheet_to_json<string[]>(exported.Sheets.Perkiraan, {
      header: 1,
    });
    expect(rows[0]).toEqual([...excel.ACCOUNT_COLUMNS]);
    expect(rows.find((r) => r[0] === `${code}-C`)?.[5]).toBe(`${code}-P`);
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
  it("keeps the Perkiraan structure, opening balances and Hitung Rugi Laba consistent", async () => {
    // Kategori Rugi Laba + Induk / Tampil / Cabang on accounts.
    const pl = await command("finance_account.manage", {
      entity: "plcategory",
      code: randomUUID().slice(0, 20),
      name: "FAKE TRX LabaRugi",
    });
    const revenue = await db.finAccount.findUniqueOrThrow({
      where: { id: accounts[1] },
    });
    await command("finance_account.manage", {
      entity: "account",
      id: revenue.id,
      code: revenue.code,
      name: revenue.name,
      kind: "REVENUE",
      categoryId: revenue.categoryId,
      isCash: "false",
      active: "true",
      initial: "PDP",
      parentId: "",
      visible: "true",
      plCategoryId: String(pl.id),
      branchId: "",
    });
    // Rules: no Kategori Rugi Laba on a balance-sheet account, no loops.
    const asset = await db.finAccount.findUniqueOrThrow({
      where: { id: accounts[0] },
    });
    const editAsset = (extra: Record<string, unknown>) =>
      command("finance_account.manage", {
        entity: "account",
        id: asset.id,
        code: asset.code,
        name: asset.name,
        kind: "ASSET",
        categoryId: asset.categoryId,
        isCash: "false",
        active: "true",
        ...extra,
      });
    await expect(editAsset({ plCategoryId: String(pl.id) })).rejects.toThrow(
      "hanya untuk akun pendapatan",
    );
    await expect(editAsset({ parentId: String(asset.id) })).rejects.toThrow(
      "akun itu sendiri",
    );
    await editAsset({ parentId: String(accounts[7]) });
    const child = await db.finAccount.findUniqueOrThrow({
      where: { id: accounts[7] },
    });
    await expect(
      command("finance_account.manage", {
        entity: "account",
        id: child.id,
        code: child.code,
        name: child.name,
        kind: "ASSET",
        categoryId: child.categoryId,
        isCash: "true",
        active: "true",
        parentId: String(asset.id),
      }),
    ).rejects.toThrow("melingkar");
    await editAsset({ parentId: "" });

    // Hitung Rugi Laba matches the reconciled P&L of the same month.
    const { profitLoss, profitLossWorkbook } = await import(
      "../../src/features/finance/server/profit-loss"
    );
    const reader = await loadAccessActor(db, users[0]);
    if (!reader) throw new Error("actor not found");
    const plReport = await profitLoss(reader, {
      month: "11",
      year: "2026",
      branchId: String(financeBranch),
    });
    expect(plReport.total.month).toBe(50000);
    expect(plReport.total.year).toBe(50000);
    expect(plReport.total.percent).toBe(33.33);
    const group = plReport.groups.find((g) => g.code !== null);
    expect(group).toMatchObject({ name: "FAKE TRX LabaRugi", month: 150000 });
    expect(group?.rows[0]).toMatchObject({ code: revenue.code, percent: 100 });
    // Export Excel mirrors the table: header row, group rows, net total last.
    const XLSX = await import("xlsx");
    const sheet = XLSX.read(profitLossWorkbook(plReport, "Nov'26", 2026))
      .Sheets["Rugi Laba"];
    const sheetRows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
    });
    expect(sheetRows[3]).toEqual([
      "KODE AKUN",
      "INDUK",
      "HASIL Nov'26",
      "%",
      "Current Year 2026",
    ]);
    expect(sheetRows.at(-1)).toEqual([
      "LABA (RUGI) BERSIH",
      "",
      50000,
      "33.33 %",
      50000,
    ]);

    // Opening balance: cash account against equity; once per account and
    // branch until reversed; the P&L is untouched.
    const opening = await command("journal.opening", {
      branchId: financeBranch,
      accountingDate: "2026-11-01",
      accountId: accounts[4],
      counterAccountId: accounts[6],
      amount: "750000.00",
    });
    const lines = await db.finLine.findMany({
      where: { journalId: opening.id },
      orderBy: { id: "asc" },
    });
    expect(
      lines.map((l) => [l.accountId, l.debit.toFixed(2), l.credit.toFixed(2)]),
    ).toEqual([
      [accounts[4], "750000.00", "0.00"],
      [accounts[6], "0.00", "750000.00"],
    ]);
    await expect(
      command("journal.opening", {
        branchId: financeBranch,
        accountingDate: "2026-11-01",
        accountId: accounts[4],
        counterAccountId: accounts[6],
        amount: "1.00",
      }),
    ).rejects.toThrow("sudah ada");
    await expect(
      command("journal.opening", {
        branchId: financeBranch,
        accountingDate: "2026-11-01",
        accountId: accounts[4],
        counterAccountId: accounts[5],
        amount: "1.00",
      }),
    ).rejects.toThrow();
    await command("journal.reverse", {
      id: opening.id,
      accountingDate: "2026-11-02",
      reason: "FAKE wrong opening amount",
    });
    await command("journal.opening", {
      branchId: financeBranch,
      accountingDate: "2026-11-02",
      accountId: accounts[4],
      counterAccountId: accounts[6],
      amount: "700000.00",
    });
    expect(
      (
        await profitLoss(reader, {
          month: "11",
          year: "2026",
          branchId: String(financeBranch),
        })
      ).total.month,
    ).toBe(50000);
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
  it("rejects deletion of posted journals/lines, receipts and issued or void invoices (PR #11 review)", async () => {
    const branches = [branch, otherBranch, financeBranch].filter(Boolean);
    const journal = await db.finJournal.findFirstOrThrow({
      where: { branchId: { in: branches }, status: "POSTED" },
      select: { id: true },
    });
    const line = await db.finLine.findFirstOrThrow({
      where: { journalId: journal.id },
      select: { id: true },
    });
    const receipt = await db.finReceipt.findFirstOrThrow({
      where: { invoice: { branchId: { in: branches } } },
      select: { id: true },
    });
    const invoice = await db.finInvoice.findFirstOrThrow({
      where: { branchId: { in: branches }, status: { not: "DRAFT" } },
      select: { id: true },
    });
    const item = await db.finInvoiceItem.findFirstOrThrow({
      where: { invoiceId: invoice.id },
      select: { id: true },
    });
    for (const attempt of [
      () => db.finLine.delete({ where: { id: line.id } }),
      () => db.finJournal.delete({ where: { id: journal.id } }),
      () => db.finReceipt.delete({ where: { id: receipt.id } }),
      () => db.finInvoiceItem.delete({ where: { id: item.id } }),
      () => db.$executeRaw`DELETE FROM fin_invoices WHERE id = ${invoice.id}`,
    ])
      await expect(attempt()).rejects.toThrow(/cannot be deleted/);
    await expect(
      db.finJournal.count({ where: { id: journal.id } }),
    ).resolves.toBe(1);
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
