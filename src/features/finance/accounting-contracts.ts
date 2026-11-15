import { z } from "zod";
import { date, id, money, reason } from "./contracts";

const base = { key: z.string().uuid() };
const boolean = z.preprocess(
  (v) => (v === "true" ? true : v === "false" ? false : v),
  z.boolean(),
);
const reference = z.string().trim().min(1).max(160);
export const accountKind = z.enum([
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
]);
export const categoryInput = z.object({
  id: id.optional(),
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(100),
  kind: z.enum(["ACCOUNT", "CASHFLOW"]),
  flowClass: z.enum(["OPERATING", "INVESTING", "FINANCING"]).optional(),
  active: boolean.default(true),
});
export const accountInput = z.object({
  id: id.optional(),
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(100),
  kind: accountKind,
  categoryId: id,
  isCash: boolean.default(false),
  active: boolean.default(true),
});
export const mappingInput = z.object({
  branchId: id,
  receivableId: id,
  revenueId: id,
  costId: id,
  liabilityId: id,
});
const line = z.object({
  accountId: id,
  side: z.enum(["DEBIT", "CREDIT"]),
  amount: money,
});
export const accountingCommand = z.discriminatedUnion("action", [
  z.object({
    ...base,
    action: z.literal("finance_account.manage"),
    entity: z.enum(["category", "account", "mapping"]),
    id: id.optional(),
    code: z.string().optional(),
    name: z.string().optional(),
    kind: z.string().optional(),
    flowClass: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().optional(),
    ),
    categoryId: id.optional(),
    isCash: boolean.optional(),
    active: boolean.optional(),
    branchId: id.optional(),
    receivableId: id.optional(),
    revenueId: id.optional(),
    costId: id.optional(),
    liabilityId: id.optional(),
  }),
  z.object({
    ...base,
    action: z.literal("journal.create"),
    branchId: id,
    accountingDate: date,
    reference,
    reason,
    lines: z.array(line).min(2).max(100),
  }),
  z.object({ ...base, action: z.literal("journal.post"), id }),
  z.object({
    ...base,
    action: z.literal("journal.reverse"),
    id,
    accountingDate: date,
    reason,
  }),
  z.object({
    ...base,
    action: z.literal("journal.expense"),
    branchId: id,
    accountingDate: date,
    reference,
    reason,
    amount: money,
    expenseAccountId: id,
    cashAccountId: id,
    cashflowCategoryId: id,
  }),
  z.object({
    ...base,
    action: z.literal("journal.transfer"),
    branchId: id,
    accountingDate: date,
    reference,
    reason,
    amount: money,
    fromAccountId: id,
    toAccountId: id,
  }),
  z.object({
    ...base,
    action: z.literal("finance_cost.create"),
    branchId: id,
    transactionId: id,
    accountingDate: date,
    amount: money,
    supplierReference: reference,
    reason,
  }),
  z.object({
    ...base,
    action: z.literal("finance_cost.finalize"),
    branchId: id,
    transactionId: id,
    accountingDate: date,
    reason,
  }),
  z.object({
    ...base,
    action: z.literal("finance_cost.reverse"),
    id,
    accountingDate: date,
    reason,
  }),
  z.object({
    ...base,
    action: z.literal("finance_period.close"),
    branchId: id,
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    reason,
  }),
]);
export const reportInput = z
  .object({ branchId: id, start: date, end: date })
  .refine(
    (v) =>
      v.start <= v.end &&
      new Date(v.end).getTime() - new Date(v.start).getTime() <= 365 * 86400000,
    "Periode maksimal 366 hari",
  );
