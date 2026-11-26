import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createAkuntingQueries } from "../../src/features/finance/server/akunting-queries";
import { createFinanceService } from "../../src/features/finance/server/service";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

/** Akunting following the sandbox (2026-11-24): Kas Bank, reports, masters. */
const url = testDatabaseUrl(
  process.env.TEST_DATABASE_URL,
  process.env.DATABASE_URL,
);
process.env.DATABASE_URL = url;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
// Kasir Lampiran tests never upload to Cloudinary.
vi.mock("../../src/lib/cloudinary", async (actual) => ({
  ...(await actual<typeof import("../../src/lib/cloudinary")>()),
  uploadWebp: vi.fn(async () => ({
    url: "https://example.invalid/fake.webp",
    publicId: `fake/${Math.random()}`,
  })),
  destroyImage: vi.fn(async () => undefined),
}));
const tag = `FAKE AKT ${randomUUID().slice(0, 8)}`;
const ids = {
  company: 0,
  office: 0,
  branch: 0,
  other: 0,
  vendor: 0,
  category: 0,
  users: [] as number[],
  groups: [] as number[],
};
const acc = {} as Record<
  | "cash"
  | "bank"
  | "revenue"
  | "expense"
  | "equity"
  | "asset"
  | "receivable"
  | "mapRevenue"
  | "mapCost",
  number
>;
const service = (i = 0) =>
  createFinanceService(db, () => loadAccessActor(db, ids.users[i]));
const queries = (i = 0) =>
  createAkuntingQueries(db, () => loadAccessActor(db, ids.users[i]));
const run = (input: Record<string, unknown>, i = 0) =>
  service(i).execute({ key: randomUUID(), ...input });
const DATE = "2026-11-20";

beforeAll(async () => {
  ids.company = (
    await db.company.create({
      data: { name: tag, isDepositAgent: false, showPriceOnPrint: false },
    })
  ).id;
  ids.office = (
    await db.office.create({
      data: { companyId: ids.company, code: tag, name: tag, status: "ACTIVE" },
    })
  ).id;
  for (const key of ["branch", "other"] as const)
    ids[key] = (
      await db.branch.create({
        data: {
          officeId: ids.office,
          name: `${tag} ${key}`,
          code: `${tag} ${key}`,
          status: "ACTIVE",
        },
      })
    ).id;
  ids.vendor = (
    await db.vendor.create({
      data: {
        name: `${tag} vendor`,
        address1: "",
        address2: "",
        city: "",
        postalCode: "",
        phone: "",
        fax: "",
        email: "",
        contactName: "",
        branch: "",
      },
    })
  ).id;
  const full = [
    ...["view", "manage"].map((action) => ({
      resource: "finance_account",
      action,
    })),
    ...["view", "create", "post", "reverse"].map((action) => ({
      resource: "journal",
      action,
    })),
    { resource: "financial_report", action: "view" },
  ];
  for (const [i, permissions] of [
    full,
    [{ resource: "journal", action: "view" }],
  ].entries()) {
    const group = await db.userGroup.create({
      data: { name: `${tag} ${i}`, permissions: { create: permissions } },
    });
    ids.groups.push(group.id);
    ids.users.push(
      (
        await db.user.create({
          data: {
            name: tag,
            email: `${randomUUID()}@example.invalid`,
            groupId: group.id,
            allowedBranches: { create: [{ branchId: ids.branch }] },
          },
        })
      ).id,
    );
  }
  ids.category = (
    await run({
      action: "finance_account.manage",
      entity: "category",
      code: randomUUID().slice(0, 20),
      name: tag,
      kind: "ACCOUNT",
    })
  ).id;
  for (const [key, kind, isCash] of [
    ["cash", "ASSET", true],
    ["bank", "ASSET", true],
    ["revenue", "REVENUE", false],
    ["expense", "EXPENSE", false],
    ["equity", "EQUITY", false],
    ["asset", "ASSET", false],
    ["receivable", "ASSET", false],
    ["mapRevenue", "REVENUE", false],
    ["mapCost", "EXPENSE", false],
  ] as const)
    acc[key] = (
      await run({
        action: "finance_account.manage",
        entity: "account",
        code: `${tag.slice(-8)}-${key}`,
        name: `${tag} ${key}`,
        kind,
        isCash,
        categoryId: ids.category,
      })
    ).id;
  // A control mapping, so the receivable becomes a control account.
  await run({
    action: "finance_account.manage",
    entity: "mapping",
    branchId: ids.branch,
    receivableId: acc.receivable,
    revenueId: acc.mapRevenue,
    costId: acc.mapCost,
    liabilityId: (
      await run({
        action: "finance_account.manage",
        entity: "account",
        code: `${tag.slice(-8)}-liab`,
        name: `${tag} liab`,
        kind: "LIABILITY",
        categoryId: ids.category,
      })
    ).id,
  });
});

const guards = [
  ["fin_journals", "fin_journal_no_delete"],
  ["fin_lines", "fin_line_no_delete"],
] as const;
afterAll(async () => {
  await db.$transaction(async (tx) => {
    for (const [table, trigger] of guards)
      await tx.$executeRawUnsafe(
        `ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`,
      );
    const scope = { branchId: { in: [ids.branch, ids.other] } };
    await tx.finJournalAttachment.deleteMany({ where: { journal: scope } });
    await tx.finLine.deleteMany({ where: { journal: scope } });
    await tx.finJournal.deleteMany({
      where: { ...scope, reversalOfId: { not: null } },
    });
    await tx.finJournal.deleteMany({ where: scope });
    await tx.finBankStatement.deleteMany({ where: scope });
    await tx.finAsset.deleteMany({
      where: { category: { name: { startsWith: tag } } },
    });
    await tx.finAssetCategory.deleteMany({
      where: { name: { startsWith: tag } },
    });
    await tx.finCostCentre.deleteMany({ where: scope });
    await tx.finMapping.deleteMany({ where: scope });
    await tx.finCommand.deleteMany({ where: { actorId: { in: ids.users } } });
    await tx.$executeRawUnsafe("SET CONSTRAINTS ALL IMMEDIATE");
    for (const [table, trigger] of guards)
      await tx.$executeRawUnsafe(
        `ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`,
      );
  });
  await db.finAccount.deleteMany({ where: { name: { startsWith: tag } } });
  await db.finCategory.deleteMany({ where: { id: ids.category } });
  await db.userAllowedBranch.deleteMany({
    where: { userId: { in: ids.users } },
  });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.permission.deleteMany({ where: { groupId: { in: ids.groups } } });
  await db.userGroup.deleteMany({ where: { id: { in: ids.groups } } });
  await db.vendor.deleteMany({ where: { id: ids.vendor } });
  await db.branch.deleteMany({
    where: { id: { in: [ids.branch, ids.other] } },
  });
  await db.office.deleteMany({ where: { id: ids.office } });
  await db.company.deleteMany({ where: { id: ids.company } });
  await db.$disconnect();
});

describe("Akunting (sandbox) Kas Bank and reports", () => {
  let cashIn = 0;
  it("saves Kasir Penerimaan Lainnya as a draft with Kas/Bank debited by the line balance and an automatic Nomor Bukti", async () => {
    cashIn = (
      await run({
        action: "journal.cash",
        voucher: "CASH_IN",
        branchId: ids.branch,
        accountingDate: DATE,
        reference: "",
        reason: "Setoran modal",
        cashAccountId: acc.cash,
        lines: [
          {
            accountId: acc.equity,
            side: "CREDIT",
            amount: "150000",
            memo: "Modal",
          },
          { accountId: acc.expense, side: "DEBIT", amount: "50000" },
        ],
      })
    ).id;
    const j = await db.finJournal.findUniqueOrThrow({
      where: { id: cashIn },
      include: { lines: { orderBy: { id: "asc" } } },
    });
    expect(j.status).toBe("DRAFT");
    expect(j.sourceType).toBe("CASH_IN");
    expect(j.reference).toMatch(/^BKM\/2611\/\d{4}$/);
    expect(j.lines[0]).toMatchObject({ accountId: acc.cash });
    expect(j.lines[0]?.debit.toFixed(2)).toBe("100000.00");
    expect(j.lines[1]?.memo).toBe("Modal");
  });

  it("keeps Kasir Lampiran per voucher: branch-scoped, at most 5, soft removal", async () => {
    const att = await import(
      "../../src/features/finance/server/voucher-attachments"
    );
    const writer = await loadAccessActor(db, ids.users[0]);
    if (!writer?.group) throw new Error("actor not found");
    const file = new File([new Uint8Array([1])], "nota.webp", {
      type: "image/webp",
    });
    const first = await att.addVoucherAttachment(writer, cashIn, file);
    for (let i = 1; i < att.MAX_ATTACHMENTS; i++)
      await att.addVoucherAttachment(writer, cashIn, file);
    await expect(
      att.addVoucherAttachment(writer, cashIn, file),
    ).rejects.toMatchObject({ status: 409 });
    const outsider = {
      ...writer,
      branchIds: [ids.other],
      group: {
        ...writer.group,
        permissions: writer.group.permissions.filter(
          (p) => p.resource !== "system_admin",
        ),
      },
    };
    await expect(
      att.addVoucherAttachment(outsider, cashIn, file),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      att.addVoucherAttachment(writer, Number.NaN, file),
    ).rejects.toMatchObject({ status: 404 });
    await att.removeVoucherAttachment(writer, first.id);
    expect(
      await db.finJournalAttachment.count({
        where: { journalId: cashIn, deletedAt: null },
      }),
    ).toBe(att.MAX_ATTACHMENTS - 1);
  });

  it("rejects control accounts, unbalanced direction, missing vendor and another branch's cost centre", async () => {
    const base = {
      action: "journal.cash",
      branchId: ids.branch,
      accountingDate: DATE,
      reason: "x",
      cashAccountId: acc.cash,
    };
    await expect(
      run({
        ...base,
        voucher: "CASH_OUT",
        lines: [{ accountId: acc.receivable, side: "DEBIT", amount: "1" }],
      }),
    ).rejects.toThrow(/kontrol/);
    await expect(
      run({
        ...base,
        voucher: "CASH_OUT",
        lines: [{ accountId: acc.expense, side: "CREDIT", amount: "1" }],
      }),
    ).rejects.toThrow(/debit/);
    await expect(
      run({
        ...base,
        voucher: "VENDOR_PAYMENT",
        lines: [{ accountId: acc.expense, side: "DEBIT", amount: "1" }],
      }),
    ).rejects.toThrow(/Vendor/);
    const otherCentre = await db.finCostCentre.create({
      data: { code: `${tag}-X`, name: "X", branchId: ids.other },
    });
    await expect(
      run({
        ...base,
        voucher: "CASH_OUT",
        costCentreId: otherCentre.id,
        lines: [{ accountId: acc.expense, side: "DEBIT", amount: "1" }],
      }),
    ).rejects.toThrow(/Cost Centre/);
  });

  it("denies writes without journal create and hides another branch", async () => {
    await expect(
      run(
        {
          action: "journal.cash",
          voucher: "CASH_OUT",
          branchId: ids.branch,
          accountingDate: DATE,
          reason: "x",
          cashAccountId: acc.cash,
          lines: [{ accountId: acc.expense, side: "DEBIT", amount: "1" }],
        },
        1,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      queries().postings({ branchId: String(ids.other) }),
    ).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
  });

  it("posts the draft from Kasir and shows it in Buku Bank, Neraca Saldo and a balanced Neraca", async () => {
    await run({ action: "journal.post", id: cashIn });
    const posting = await queries().postings({
      branchId: String(ids.branch),
      status: "POSTED",
    });
    expect(posting.items.filter((r) => r.journalId === cashIn)).toHaveLength(3);

    const book = await queries().accountBook(
      {
        accountId: String(acc.cash),
        branchId: String(ids.branch),
        start: "2026-11-01",
        end: "2026-11-30",
      },
      true,
    );
    expect(book.book?.opening).toBe("0.00");
    expect(book.book?.closing).toBe("100000.00");
    expect(book.book?.items[0]?.counter).toContain(`${tag} equity`);

    const trial = await queries().trialBalance({
      branchId: String(ids.branch),
      start: "2026-11-01",
      end: "2026-11-30",
    });
    const row = (id: number) => trial.rows.find((r) => r.id === id);
    expect(row(acc.cash)?.debit).toBe("100000.00");
    expect(row(acc.equity)?.credit).toBe("150000.00");
    expect(row(acc.expense)?.balance).toBe("50000.00");

    const sheet = await queries().balanceSheet({
      branchId: String(ids.branch),
      end: "2026-11-30",
    });
    expect(sheet.balanced).toBe(true);
    expect(sheet.labaBerjalan).toBe("-50000.00");
  });

  it("deletes only drafts (Hapus Nomor Bukti) and records bank statements for Rekonsiliasi Bank", async () => {
    await expect(
      run({ action: "journal.discard", id: cashIn }),
    ).rejects.toThrow(/draft/);
    const draft = await run({
      action: "journal.cash",
      voucher: "VENDOR_PAYMENT",
      branchId: ids.branch,
      accountingDate: DATE,
      reason: "Bayar vendor",
      cashAccountId: acc.cash,
      vendorId: ids.vendor,
      lines: [{ accountId: acc.expense, side: "DEBIT", amount: "1000" }],
    });
    expect(
      (await db.finJournal.findUniqueOrThrow({ where: { id: draft.id } }))
        .reference,
    ).toMatch(/^BKV\//);
    await run({ action: "journal.discard", id: draft.id });
    expect(
      await db.finJournal.findUnique({ where: { id: draft.id } }),
    ).toBeNull();

    await run({
      action: "journal.bank_statement",
      branchId: ids.branch,
      accountId: acc.cash,
      statementDate: "2026-11-30",
      bankBalance: "99000",
    });
    const recon = await queries().reconciliation({
      branchId: String(ids.branch),
      end: "2026-11-30",
    });
    const cash = recon.rows.find((r) => r.id === acc.cash);
    expect(cash).toMatchObject({
      system: "100000.00",
      bank: "99000.00",
      difference: "1000.00",
    });
  });

  it("keeps Cost Centre, Kategori Assets and Assets with straight-line depreciation", async () => {
    await run({
      action: "finance_account.cost_centre",
      code: `${tag}-CC`,
      name: "Operasional",
      branchId: ids.branch,
    });
    const category = await run({
      action: "finance_account.asset_category",
      name: `${tag} Kendaraan`,
      accountId: acc.asset,
      counterAccountId: acc.expense,
    });
    const asset = await run({
      action: "finance_account.asset",
      name: "Truk",
      categoryId: category.id,
      branchId: String(ids.branch),
      units: "1",
      acquiredOn: "2025-11-01",
      cost: "120000000",
      additions: "0",
      reductions: "0",
      lifeMonths: "48",
    });
    const masters = await queries().masters();
    expect(masters.costCentres.some((c) => c.code === `${tag}-CC`)).toBe(true);
    const row = masters.assets.find((a) => a.id === asset.id);
    expect(row?.monthly).toBe("2500000.00");
    expect(row?.elapsed).toBeGreaterThanOrEqual(12);
    await run({ action: "finance_account.asset_remove", id: asset.id });
    expect(
      (await queries().masters()).assets.some((a) => a.id === asset.id),
    ).toBe(false);
  });
});
