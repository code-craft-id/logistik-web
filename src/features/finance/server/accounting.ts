import "server-only";
import {
  type AccessActor,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
} from "@/features/identity/server/access";
import type { FinAccount, Prisma } from "@/lib/db/generated/client";
import {
  accountInput,
  accountingCommand,
  categoryInput,
  mappingInput,
} from "../accounting-contracts";
import { asDate, day, sum } from "../contracts";

type Tx = Prisma.TransactionClient;
const fail = (message: string): never => {
  throw new IdentityError("CONFLICT", 409, message);
};
export function scoped(current: AccessActor, branchId: number) {
  if (!permitsBranch(current, branchId))
    throw new IdentityError("FORBIDDEN_BRANCH", 403);
}
async function activeBranch(tx: Tx, current: AccessActor, branchId: number) {
  scoped(current, branchId);
  if (
    !(await tx.branch.findFirst({
      where: {
        id: branchId,
        status: "ACTIVE",
        deletedAt: null,
        office: {
          status: "ACTIVE",
          deletedAt: null,
          company: { deletedAt: null },
        },
      },
    }))
  )
    fail("Cabang aktif diperlukan.");
}
export async function openPeriod(
  tx: Tx,
  branchId: number,
  accountingDate: string,
) {
  if (
    await tx.finClosedPeriod.findFirst({
      where: { branchId, month: { gte: accountingDate.slice(0, 7) } },
    })
  )
    fail("Periode sudah ditutup. Gunakan tanggal periode terbuka.");
}
async function account(tx: Tx, id: number, kind?: string, cash?: boolean) {
  const row = await tx.finAccount.findFirst({
    where: {
      id,
      active: true,
      deletedAt: null,
      category: { active: true, deletedAt: null },
      ...(kind ? { kind } : {}),
      ...(cash !== undefined ? { isCash: cash } : {}),
    },
  });
  if (!row) fail("Akun aktif atau klasifikasi tidak sesuai.");
  return row as FinAccount;
}
async function flow(tx: Tx, id: number) {
  const category = await tx.finCategory.findFirst({
    where: { id, kind: "CASHFLOW", active: true, deletedAt: null },
  });
  if (!category?.flowClass) fail("Kategori arus kas aktif diperlukan.");
  return category;
}
async function mapping(tx: Tx, branchId: number) {
  const row = await tx.finMapping.findFirst({
    where: { branchId },
    orderBy: { id: "desc" },
  });
  if (!row) fail("Konfigurasikan pemetaan akun cabang sebelum posting.");
  const m = row as NonNullable<typeof row>;
  await account(tx, m.receivableId, "ASSET", false);
  await account(tx, m.revenueId, "REVENUE", false);
  await account(tx, m.costId, "EXPENSE", false);
  await account(tx, m.liabilityId, "LIABILITY", false);
  return m;
}
type Line = {
  accountId: number;
  debit?: string;
  credit?: string;
  transactionId?: number | null;
  cashflowCategoryId?: number | null;
  snapshot?: Prisma.InputJsonValue;
};
type Journal = {
  branchId: number;
  accountingDate: string;
  reference: string;
  reason: string;
  sourceType: string;
  sourceId?: number;
  sourceKey?: string;
  reversalOfId?: number;
  mappingId?: number;
  lines: Line[];
};
async function journal(tx: Tx, data: Journal, posted = true, preserve = false) {
  await openPeriod(tx, data.branchId, data.accountingDate);
  const debit = sum(data.lines.map((l) => l.debit ?? "0")),
    credit = sum(data.lines.map((l) => l.credit ?? "0"));
  if (data.lines.length < 2 || !debit.gt(0) || !debit.eq(credit))
    fail("Debit dan kredit harus sama dan positif.");
  const lines = [];
  for (const line of data.lines) {
    const a = preserve ? null : await account(tx, line.accountId);
    const c =
      line.cashflowCategoryId && !preserve
        ? await flow(tx, line.cashflowCategoryId)
        : null;
    const snapshot = line.snapshot ?? {
      code: a?.code ?? "",
      name: a?.name ?? "",
      kind: a?.kind ?? "",
      isCash: a?.isCash ?? false,
      categoryId: a?.categoryId ?? null,
      flowClass: c?.flowClass ?? null,
    };
    lines.push({
      accountId: line.accountId,
      debit: line.debit ?? "0",
      credit: line.credit ?? "0",
      transactionId: line.transactionId ?? null,
      cashflowCategoryId: line.cashflowCategoryId ?? null,
      snapshot,
    });
  }
  const { lines: _, accountingDate, ...rest } = data;
  return tx.finJournal.create({
    data: {
      ...rest,
      accountingDate: asDate(accountingDate),
      status: posted ? "POSTED" : "DRAFT",
      lines: { create: lines },
    },
  });
}
async function reverse(
  tx: Tx,
  originalId: number,
  accountingDate: string,
  reason: string,
  sourceType: string,
  sourceKey: string,
  sourceId?: number,
) {
  const original = await tx.finJournal.findUnique({
    where: { id: originalId },
    include: { lines: true, reversal: true },
  });
  if (
    !original ||
    original.status !== "POSTED" ||
    original.reversalOfId ||
    original.reversal
  )
    fail("Jurnal tidak dapat dibalik lagi.");
  const row = original as NonNullable<typeof original>;
  return journal(
    tx,
    {
      branchId: row.branchId,
      accountingDate,
      reference: row.reference,
      reason,
      sourceType,
      sourceKey,
      sourceId,
      reversalOfId: row.id,
      ...(row.mappingId ? { mappingId: row.mappingId } : {}),
      lines: row.lines.map((l) => ({
        accountId: l.accountId,
        debit: l.credit.toFixed(2),
        credit: l.debit.toFixed(2),
        transactionId: l.transactionId,
        cashflowCategoryId: l.cashflowCategoryId,
        snapshot: l.snapshot as Prisma.InputJsonValue,
      })),
    },
    true,
    true,
  );
}
export async function invoicePosting(tx: Tx, invoiceId: number) {
  const row = await tx.finInvoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { items: true },
  });
  const m = await mapping(tx, row.branchId);
  return journal(tx, {
    branchId: row.branchId,
    accountingDate: day(row.invoiceDate),
    reference: `INV-${row.id}`,
    reason: "Invoice issued",
    sourceType: "INVOICE",
    sourceId: row.id,
    sourceKey: `invoice:${row.id}`,
    mappingId: m.id,
    lines: [
      { accountId: m.receivableId, debit: row.total.toFixed(2) },
      ...row.items.map((l) => ({
        accountId: m.revenueId,
        credit: l.amount.toFixed(2),
        transactionId: l.transactionId,
      })),
    ],
  });
}
export async function receiptPosting(
  tx: Tx,
  receiptId: number,
  cashAccountId: number,
  cashflowCategoryId: number,
) {
  const r = await tx.finReceipt.findUniqueOrThrow({
    where: { id: receiptId },
    include: { invoice: true },
  });
  const issued = await tx.finJournal.findUnique({
    where: { sourceKey: `invoice:${r.invoiceId}` },
  });
  if (!issued?.mappingId)
    throw new IdentityError(
      "CONFLICT",
      409,
      "Posting sumber invoice belum tersedia.",
    );
  const m = await tx.finMapping.findUniqueOrThrow({
    where: { id: issued.mappingId },
  });
  await account(tx, m.receivableId, "ASSET", false);
  await account(tx, cashAccountId, "ASSET", true);
  await flow(tx, cashflowCategoryId);
  return journal(tx, {
    branchId: r.invoice.branchId,
    accountingDate: day(r.receivedDate),
    reference: r.reference || `Receipt-${r.id}`,
    reason: r.note || "Receipt",
    sourceType: "RECEIPT",
    sourceId: r.id,
    sourceKey: `receipt:${r.id}`,
    mappingId: m.id,
    lines: [
      {
        accountId: cashAccountId,
        debit: r.amount.toFixed(2),
        cashflowCategoryId,
      },
      { accountId: m.receivableId, credit: r.amount.toFixed(2) },
    ],
  });
}
export async function reverseSource(
  tx: Tx,
  originalKey: string,
  date: string,
  reason: string,
  sourceType: string,
  sourceId: number,
) {
  const original = await tx.finJournal.findUnique({
    where: { sourceKey: originalKey },
  });
  if (!original)
    throw new IdentityError(
      "CONFLICT",
      409,
      "Jurnal sumber tidak ditemukan; aktivasi akuntansi ditolak.",
    );
  return reverse(
    tx,
    original.id,
    date,
    reason,
    sourceType,
    `${sourceType}:${sourceId}`,
    sourceId,
  );
}
async function manualAccounts(tx: Tx, ids: number[]) {
  const controlled = await tx.finMapping.findFirst({
    where: {
      OR: [
        { receivableId: { in: ids } },
        { revenueId: { in: ids } },
        { costId: { in: ids } },
        { liabilityId: { in: ids } },
      ],
    },
  });
  if (controlled) fail("Akun kontrol hanya melalui dokumen sumber.");
  for (const id of ids) {
    const a = await account(tx, id);
    if (a.isCash) fail("Gunakan beban kas atau transfer untuk akun kas/bank.");
  }
}
export async function accountingWrite(
  tx: Tx,
  current: AccessActor,
  input: unknown,
): Promise<{ id: number; branchId: number | null }> {
  const d = accountingCommand.parse(input);
  if (d.action === "finance_account.manage") {
    if (d.entity === "category") {
      const data = categoryInput.parse(d);
      if ((data.kind === "CASHFLOW") !== !!data.flowClass)
        fail("Kategori arus kas memerlukan jenis arus; kategori akun tidak.");
      if (data.id) {
        const old = await tx.finCategory.findUniqueOrThrow({
          where: { id: data.id },
        });
        if (
          (old.kind !== data.kind ||
            old.flowClass !== (data.flowClass ?? null)) &&
          ((await tx.finLine.count({
            where: { cashflowCategoryId: old.id },
          })) ||
            (await tx.finAccount.count({ where: { categoryId: old.id } })))
        )
          fail("Klasifikasi kategori yang dipakai tidak dapat diubah.");
      }
      const { id, ...fields } = data;
      const row = id
        ? await tx.finCategory.update({
            where: { id },
            data: fields,
          })
        : await tx.finCategory.create({ data: fields });
      return { id: row.id, branchId: null };
    }
    if (d.entity === "account") {
      const data = accountInput.parse(d);
      if (data.isCash && data.kind !== "ASSET")
        fail("Kas/bank harus akun aset.");
      if (
        !(await tx.finCategory.findFirst({
          where: {
            id: data.categoryId,
            kind: "ACCOUNT",
            active: true,
            deletedAt: null,
          },
        }))
      )
        fail("Kategori akun tidak tersedia.");
      const normalBalance = ["ASSET", "EXPENSE"].includes(data.kind)
        ? "DEBIT"
        : "CREDIT";
      if (data.id) {
        const old = await tx.finAccount.findUniqueOrThrow({
          where: { id: data.id },
        });
        const used =
          (await tx.finLine.count({ where: { accountId: old.id } })) ||
          (await tx.finMapping.count({
            where: {
              OR: [
                { receivableId: old.id },
                { revenueId: old.id },
                { costId: old.id },
                { liabilityId: old.id },
              ],
            },
          }));
        if (
          used &&
          (old.code !== data.code ||
            old.kind !== data.kind ||
            old.categoryId !== data.categoryId ||
            old.isCash !== data.isCash)
        )
          fail("Klasifikasi/kode akun terpakai tidak dapat diubah.");
      }
      const { id, ...fields } = data;
      const row = id
        ? await tx.finAccount.update({
            where: { id },
            data: {
              ...fields,
              normalBalance,
            },
          })
        : await tx.finAccount.create({ data: { ...fields, normalBalance } });
      return { id: row.id, branchId: null };
    }
    const m = mappingInput.parse(d);
    await activeBranch(tx, current, m.branchId);
    if (
      new Set([m.receivableId, m.revenueId, m.costId, m.liabilityId]).size !== 4
    )
      fail("Pemetaan akun harus berbeda.");
    await account(tx, m.receivableId, "ASSET", false);
    await account(tx, m.revenueId, "REVENUE", false);
    await account(tx, m.costId, "EXPENSE", false);
    await account(tx, m.liabilityId, "LIABILITY", false);
    const row = await tx.finMapping.create({ data: m });
    return { id: row.id, branchId: m.branchId };
  }
  if (
    d.action === "journal.create" ||
    d.action === "journal.expense" ||
    d.action === "journal.transfer"
  ) {
    if (d.action !== "journal.create")
      assertPermission(current, "create", "journal");
    await activeBranch(tx, current, d.branchId);
    let lines: Line[];
    if (d.action === "journal.create") {
      await manualAccounts(
        tx,
        d.lines.map((l) => l.accountId),
      );
      lines = d.lines.map((l) => ({
        accountId: l.accountId,
        [l.side === "DEBIT" ? "debit" : "credit"]: l.amount,
      }));
    } else if (d.action === "journal.expense") {
      await manualAccounts(tx, [d.expenseAccountId]);
      await account(tx, d.expenseAccountId, "EXPENSE", false);
      await account(tx, d.cashAccountId, "ASSET", true);
      await flow(tx, d.cashflowCategoryId);
      lines = [
        { accountId: d.expenseAccountId, debit: d.amount },
        {
          accountId: d.cashAccountId,
          credit: d.amount,
          cashflowCategoryId: d.cashflowCategoryId,
        },
      ];
    } else {
      if (d.fromAccountId === d.toAccountId)
        fail("Akun transfer harus berbeda.");
      await account(tx, d.fromAccountId, "ASSET", true);
      await account(tx, d.toAccountId, "ASSET", true);
      lines = [
        { accountId: d.toAccountId, debit: d.amount },
        { accountId: d.fromAccountId, credit: d.amount },
      ];
    }
    const row = await journal(
      tx,
      {
        branchId: d.branchId,
        accountingDate: d.accountingDate,
        reference: d.reference,
        reason: d.reason,
        sourceType:
          d.action === "journal.create"
            ? "MANUAL"
            : d.action === "journal.expense"
              ? "CASH_EXPENSE"
              : "TRANSFER",
        lines,
      },
      d.action !== "journal.create",
    );
    return { id: row.id, branchId: row.branchId };
  }
  if (d.action === "journal.post" || d.action === "journal.reverse") {
    const row = await tx.finJournal.findUniqueOrThrow({
      where: { id: d.id },
      include: { lines: true },
    });
    scoped(current, row.branchId);
    if (d.action === "journal.post") {
      if (row.status !== "DRAFT" || row.sourceType !== "MANUAL")
        fail("Hanya draft manual dapat diposting.");
      await activeBranch(tx, current, row.branchId);
      await openPeriod(tx, row.branchId, day(row.accountingDate));
      await manualAccounts(
        tx,
        row.lines.map((l) => l.accountId),
      );
      for (const l of row.lines) {
        const a = await account(tx, l.accountId);
        await tx.finLine.update({
          where: { id: l.id },
          data: {
            snapshot: {
              code: a.code,
              name: a.name,
              kind: a.kind,
              isCash: a.isCash,
              categoryId: a.categoryId,
              flowClass: null,
            },
          },
        });
      }
      await tx.finJournal.update({
        where: { id: row.id },
        data: { status: "POSTED" },
      });
      return { id: row.id, branchId: row.branchId };
    }
    if (!["MANUAL", "CASH_EXPENSE", "TRANSFER"].includes(row.sourceType))
      fail("Balikkan dokumen sumber, bukan jurnal kontrol.");
    const reversed = await reverse(
      tx,
      row.id,
      d.accountingDate,
      d.reason,
      "MANUAL_REVERSAL",
      `journal-reversal:${row.id}`,
    );
    return { id: reversed.id, branchId: row.branchId };
  }
  if (
    d.action === "finance_cost.create" ||
    d.action === "finance_cost.finalize"
  ) {
    await activeBranch(tx, current, d.branchId);
    await openPeriod(tx, d.branchId, d.accountingDate);
    await tx.$queryRaw`SELECT id FROM transactions WHERE id = ${d.transactionId} FOR SHARE`;
    if (
      !(await tx.transaction.findFirst({
        where: {
          id: d.transactionId,
          originBranchId: d.branchId,
          deletedAt: null,
        },
      }))
    )
      fail("Sumber biaya tidak tersedia di cabang asal.");
    const existing = await tx.finCostState.findUnique({
      where: { transactionId: d.transactionId },
    });
    if (existing && existing.branchId !== d.branchId)
      fail("Kepemilikan sumber biaya berubah.");
    const finalized = d.action === "finance_cost.finalize";
    await tx.finCostState.upsert({
      where: { transactionId: d.transactionId },
      create: {
        transactionId: d.transactionId,
        branchId: d.branchId,
        evidence: d.reason,
        finalized,
      },
      update: { evidence: d.reason, finalized },
    });
    if (finalized) return { id: d.transactionId, branchId: d.branchId };
    const cost = await tx.finCost.create({
      data: {
        transactionId: d.transactionId,
        accountingDate: asDate(d.accountingDate),
        amount: d.amount,
        supplierReference: d.supplierReference,
        reason: d.reason,
      },
    });
    const m = await mapping(tx, d.branchId);
    await journal(tx, {
      branchId: d.branchId,
      accountingDate: d.accountingDate,
      reference: d.supplierReference,
      reason: d.reason,
      sourceType: "COST",
      sourceId: cost.id,
      sourceKey: `cost:${cost.id}`,
      mappingId: m.id,
      lines: [
        {
          accountId: m.costId,
          debit: d.amount,
          transactionId: d.transactionId,
        },
        { accountId: m.liabilityId, credit: d.amount },
      ],
    });
    return { id: cost.id, branchId: d.branchId };
  }
  if (d.action === "finance_cost.reverse") {
    const cost = await tx.finCost.findUniqueOrThrow({
      where: { id: d.id },
      include: { source: true, reversal: true },
    });
    scoped(current, cost.source.branchId);
    if (cost.reversalOfId || cost.reversal) fail("Biaya sudah dibalik.");
    const reversal = await tx.finCost.create({
      data: {
        transactionId: cost.transactionId,
        accountingDate: asDate(d.accountingDate),
        amount: cost.amount,
        supplierReference: cost.supplierReference,
        reason: d.reason,
        reversalOfId: cost.id,
      },
    });
    await reverseSource(
      tx,
      `cost:${cost.id}`,
      d.accountingDate,
      d.reason,
      "COST_REVERSAL",
      reversal.id,
    );
    await tx.finCostState.update({
      where: { transactionId: cost.transactionId },
      data: { finalized: false, evidence: d.reason },
    });
    return { id: reversal.id, branchId: cost.source.branchId };
  }
  await activeBranch(tx, current, d.branchId);
  await openPeriod(tx, d.branchId, `${d.month}-01`);
  const end = new Date(`${d.month}-01T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const pending = await tx.finJournal.count({
    where: {
      branchId: d.branchId,
      status: "DRAFT",
      accountingDate: { lt: end },
    },
  });
  const drafts = await tx.finInvoice.count({
    where: { branchId: d.branchId, status: "DRAFT", invoiceDate: { lt: end } },
  });
  const missing = await tx.finInvoiceItem.count({
    where: {
      invoice: {
        branchId: d.branchId,
        number: { not: null },
        invoiceDate: { lt: end },
      },
      OR: [
        { transaction: { finCostState: null } },
        { transaction: { finCostState: { finalized: false } } },
        { transaction: { finCostState: { branchId: { not: d.branchId } } } },
      ],
    },
  });
  const unfinished = await tx.finCostState.count({
    where: {
      branchId: d.branchId,
      finalized: false,
      costs: { some: { accountingDate: { lt: end } } },
    },
  });
  if (pending || drafts || missing || unfinished)
    fail("Tutup periode ditolak: draft atau kelengkapan biaya belum selesai.");
  const row = await tx.finClosedPeriod.create({
    data: { branchId: d.branchId, month: d.month },
  });
  return { id: row.id, branchId: d.branchId };
}
