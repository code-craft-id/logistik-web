import "server-only";
import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
  permits,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
  loadAccessActor,
} from "@/features/identity/server/access";
import { Prisma, type PrismaClient } from "@/lib/db/generated/client";
import { accountingCommand } from "../accounting-contracts";
import { asDate, day, id, invoiceCommand, listInput, sum } from "../contracts";
import {
  accountingWrite,
  invoicePosting,
  receiptPosting,
  reverseSource,
} from "./accounting";

type Tx = Prisma.TransactionClient;
const fail = (message: string): never => {
  throw new IdentityError("CONFLICT", 409, message);
};
const include = { items: true, receipts: { orderBy: { id: "asc" as const } } };
type Invoice = Prisma.FinInvoiceGetPayload<{ include: typeof include }>;
export function invoiceDTO(row: Invoice, payments = true) {
  const snapshot = row.snapshot as {
    customer?: { name?: string };
    branch?: { name?: string };
    sources?: { transactionId: number; awbNo: string | null }[];
  } | null;
  const net = sum(
    row.receipts.map((r) => (r.reversalOfId ? r.amount.negated() : r.amount)),
  );
  return {
    ...row,
    issuedCustomerName: snapshot?.customer?.name ?? null,
    issuedBranchName: snapshot?.branch?.name ?? null,
    issuedSources: snapshot?.sources ?? [],
    total: row.total.toFixed(2),
    invoiceDate: day(row.invoiceDate),
    dueDate: day(row.dueDate),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: row.items.map((i) => ({ ...i, amount: i.amount.toFixed(2) })),
    receipts: payments
      ? row.receipts.map((r) => ({
          ...r,
          amount: r.amount.toFixed(2),
          receivedDate: day(r.receivedDate),
          createdAt: r.createdAt.toISOString(),
        }))
      : [],
    net: net.toFixed(2),
    balance: row.status === "ISSUED" ? row.total.minus(net).toFixed(2) : "0.00",
    paymentStatus:
      row.status !== "ISSUED"
        ? row.status
        : net.eq(0)
          ? "UNPAID"
          : net.eq(row.total)
            ? "PAID"
            : "PARTIAL",
  };
}

export function createFinanceService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function actor(
    tx: Tx,
    resource: string,
    action: string,
    expected?: number,
  ) {
    const session = await resolveActor();
    if (!session || (expected !== undefined && session.id !== expected))
      throw new IdentityError("UNAUTHENTICATED", 401);
    const fresh = await loadAccessActor(tx, session.id);
    assertPermission(fresh, action, resource);
    return fresh;
  }
  function scope(current: AccessActor, branchId: number) {
    if (!permitsBranch(current, branchId))
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  async function branch(tx: Tx, current: AccessActor, branchId: number) {
    scope(current, branchId);
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
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  async function sources(
    tx: Tx,
    data: {
      branchId: number;
      customerId: number;
      items: { transactionId: number }[];
    },
    issue = false,
  ) {
    await tx.$queryRaw`SELECT id FROM customers WHERE id = ${data.customerId} FOR SHARE`;
    const customer = await tx.customer.findFirst({
      where: { id: data.customerId, branchId: data.branchId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!customer) fail("Pelanggan harus aktif di cabang invoice.");
    const ids = data.items.map((i) => i.transactionId);
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM transactions WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR SHARE`,
    );
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM bookings WHERE id IN (SELECT booking_id FROM transactions WHERE id IN (${Prisma.join(ids)})) ORDER BY id FOR SHARE`,
    );
    const rows = await tx.transaction.findMany({
      where: { id: { in: ids } },
      include: { booking: { select: { customerId: true, deletedAt: true } } },
    });
    if (
      rows.length !== ids.length ||
      rows.some(
        (r) =>
          r.deletedAt ||
          r.originBranchId !== data.branchId ||
          !r.awbNo?.trim() ||
          (issue && r.status.toLowerCase() === "cancelled") ||
          r.booking?.deletedAt ||
          (r.booking?.customerId != null &&
            r.booking.customerId !== data.customerId),
      )
    )
      fail("Sumber AWB/pelanggan/cabang tidak valid atau telah berubah.");
    if (!customer) throw new IdentityError("INVALID_REFERENCE", 400);
    return { customer, rows };
  }
  async function invoice(tx: Tx, current: AccessActor, invoiceId: number) {
    const row = await tx.finInvoice.findUnique({
      where: { id: invoiceId },
      include,
    });
    if (!row) throw new IdentityError("NOT_FOUND", 404);
    scope(current, row.branchId);
    return row;
  }
  return {
    // Short finance writes serialize with each other; identity writers use the existing policy lock.
    async execute(input: unknown) {
      const data = z.union([invoiceCommand, accountingCommand]).parse(input);
      const [resource, action] = data.action.split(".");
      const permission =
        resource === "journal" && ["expense", "transfer"].includes(action)
          ? "post"
          : action;
      const initial = await actor(db, resource, permission);
      return db.$transaction(
        async (tx) => {
          // Deliberate v1 trade-off (FIN-02 "short finance writes serialized globally"):
          // the shared 71642 lock lets identity/policy writers exclude finance commands,
          // and the exclusive 71643 lock serializes every finance write across branches
          // so reservations, balances, period close and journals never interleave.
          // Under sustained load writers queue; lock_timeout fails a waiter after 5s
          // with a retryable error instead of hanging. Revisit with per-branch keys
          // only after the posting rules are proven safe to partition.
          await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
          await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock_shared(71642, 1)`;
          await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(71643, 1)`;
          const current = await actor(tx, resource, permission, initial.id);
          const previous = await tx.finCommand.findUnique({
            where: { actorId_key: { actorId: current.id, key: data.key } },
          });
          if (previous) {
            if (previous.branchId) scope(current, previous.branchId);
            if (
              previous.action !== data.action ||
              !sameJSON(previous.payload, data)
            )
              fail("Kunci pengiriman digunakan untuk isi berbeda.");
            return previous.result as { id: number };
          }
          if (isAccounting(data)) {
            const result = await accountingWrite(tx, current, data);
            await tx.finCommand.create({
              data: {
                actorId: current.id,
                key: data.key,
                action: data.action,
                branchId: result.branchId,
                payload: JSON.parse(JSON.stringify(data)),
                result: { id: result.id },
              },
            });
            return { id: result.id };
          }
          let resultId: number;
          let branchId: number;
          if (
            data.action === "invoice.create" ||
            data.action === "invoice.update"
          ) {
            if (data.dueDate < data.invoiceDate)
              fail("Jatuh tempo mendahului tanggal invoice.");
            await branch(tx, current, data.branchId);
            await sources(tx, data);
            const total = sum(data.items.map((i) => i.amount));
            if (data.action === "invoice.update") {
              const old = await invoice(tx, current, data.id);
              if (
                old.status !== "DRAFT" ||
                old.revision !== data.revision ||
                old.branchId !== data.branchId
              )
                fail("Draft telah berubah atau diterbitkan.");
              await tx.finReservation.deleteMany({
                where: { invoiceId: old.id },
              });
              await tx.finInvoiceItem.deleteMany({
                where: { invoiceId: old.id },
              });
              await tx.finInvoice.update({
                where: { id: old.id },
                data: {
                  customerId: data.customerId,
                  invoiceDate: asDate(data.invoiceDate),
                  dueDate: asDate(data.dueDate),
                  total,
                  revision: { increment: 1 },
                },
              });
              resultId = old.id;
            } else {
              resultId = (
                await tx.finInvoice.create({
                  data: {
                    branchId: data.branchId,
                    customerId: data.customerId,
                    invoiceDate: asDate(data.invoiceDate),
                    dueDate: asDate(data.dueDate),
                    total,
                  },
                })
              ).id;
            }
            for (const item of data.items) {
              if (
                await tx.finReservation.findUnique({
                  where: { transactionId: item.transactionId },
                })
              )
                fail("AWB telah dicadangkan invoice lain.");
              await tx.finInvoiceItem.create({
                data: { invoiceId: resultId, ...item },
              });
              await tx.finReservation.create({
                data: {
                  transactionId: item.transactionId,
                  invoiceId: resultId,
                },
              });
            }
            branchId = data.branchId;
          } else if (
            data.action === "invoice.issue" ||
            data.action === "invoice.void"
          ) {
            const row = await invoice(tx, current, data.id);
            if (row.revision !== data.revision)
              fail("Invoice telah berubah. Muat ulang.");
            if (data.action === "invoice.issue") {
              if (row.status !== "DRAFT")
                fail("Hanya draft dapat diterbitkan.");
              await branch(tx, current, row.branchId);
              const source = await sources(tx, row, true);
              if (
                (await tx.finReservation.count({
                  where: { invoiceId: row.id },
                })) !== row.items.length
              )
                fail("Reservasi sumber tidak lengkap.");
              const owner = await tx.branch.findUniqueOrThrow({
                where: { id: row.branchId },
                select: { id: true, name: true, code: true },
              });
              await tx.finInvoice.update({
                where: { id: row.id },
                data: {
                  status: "ISSUED",
                  number: `INV-${row.id}`,
                  revision: { increment: 1 },
                  snapshot: {
                    customer: source.customer,
                    branch: owner,
                    sources: source.rows.map((r) => ({
                      transactionId: r.id,
                      awbNo: r.awbNo,
                    })),
                  },
                },
              });
              await invoicePosting(tx, row.id);
            } else {
              if (row.status === "VOID") fail("Invoice telah dibatalkan.");
              if (
                !sum(
                  row.receipts.map((r) =>
                    r.reversalOfId ? r.amount.negated() : r.amount,
                  ),
                ).eq(0)
              )
                fail("Balikkan semua pembayaran dahulu.");
              if (row.status === "ISSUED")
                await reverseSource(
                  tx,
                  `invoice:${row.id}`,
                  data.accountingDate,
                  data.reason,
                  "INVOICE_VOID",
                  row.id,
                );
              await tx.finInvoice.update({
                where: { id: row.id },
                data: { status: "VOID", revision: { increment: 1 } },
              });
              await tx.finReservation.deleteMany({
                where: { invoiceId: row.id },
              });
            }
            branchId = row.branchId;
            resultId = row.id;
          } else if (data.action === "payment.create") {
            const row = await invoice(tx, current, data.invoiceId);
            await branch(tx, current, row.branchId);
            if (row.status !== "ISSUED")
              fail("Pembayaran memerlukan invoice terbit.");
            const balance = row.total.minus(
              sum(
                row.receipts.map((r) =>
                  r.reversalOfId ? r.amount.negated() : r.amount,
                ),
              ),
            );
            if (new Prisma.Decimal(data.amount).gt(balance))
              fail("Pembayaran melebihi sisa tagihan.");
            resultId = (
              await tx.finReceipt.create({
                data: {
                  invoiceId: row.id,
                  amount: data.amount,
                  receivedDate: asDate(data.receivedDate),
                  method: data.method,
                  reference: data.reference,
                  note: data.note,
                },
              })
            ).id;
            await receiptPosting(
              tx,
              resultId,
              data.cashAccountId,
              data.cashflowCategoryId,
            );
            branchId = row.branchId;
          } else {
            const original = await tx.finReceipt.findUnique({
              where: { id: data.id },
              include: { reversal: true },
            });
            if (!original) throw new IdentityError("NOT_FOUND", 404);
            const row = await invoice(tx, current, original.invoiceId);
            if (
              original.reversalOfId ||
              original.reversal ||
              row.status !== "ISSUED"
            )
              fail("Pembayaran tidak dapat dibalik lagi.");
            resultId = (
              await tx.finReceipt.create({
                data: {
                  invoiceId: row.id,
                  amount: original.amount,
                  receivedDate: asDate(data.accountingDate),
                  method: original.method,
                  reference: original.reference,
                  note: data.reason,
                  reversalOfId: original.id,
                },
              })
            ).id;
            await reverseSource(
              tx,
              `receipt:${original.id}`,
              data.accountingDate,
              data.reason,
              "RECEIPT_REVERSAL",
              resultId,
            );
            branchId = row.branchId;
          }
          const result = { id: resultId };
          await tx.finCommand.create({
            data: {
              actorId: current.id,
              key: data.key,
              action: data.action,
              branchId,
              payload: JSON.parse(JSON.stringify(data)),
              result,
            },
          });
          return result;
        },
        { timeout: 15000 },
      );
    },
    async list(input: unknown = {}) {
      const data = listInput.parse(input);
      return db.$transaction(
        async (tx) => {
          const current = await actor(tx, "invoice", "view");
          if (data.branchId) scope(current, data.branchId);
          const where = {
            ...(isAdministrator(current)
              ? {}
              : { branchId: { in: current.branchIds } }),
            ...(data.branchId ? { branchId: data.branchId } : {}),
          };
          const rows = await tx.finInvoice.findMany({
            where,
            include,
            orderBy: { id: "desc" },
            skip: (data.page - 1) * 30,
            take: 30,
          });
          // Legacy list columns (Customer, Termin, Tot. AWB): issued rows keep
          // their immutable snapshot names; drafts show current master names.
          const [customers, branches] = await Promise.all([
            tx.customer.findMany({
              where: {
                id: { in: [...new Set(rows.map((r) => r.customerId))] },
              },
              select: { id: true, name: true },
            }),
            tx.branch.findMany({
              where: { id: { in: [...new Set(rows.map((r) => r.branchId))] } },
              select: { id: true, name: true },
            }),
          ]);
          const customerName = new Map(customers.map((c) => [c.id, c.name]));
          const branchName = new Map(branches.map((b) => [b.id, b.name]));
          return {
            items: rows.map((r) => {
              const dto = invoiceDTO(r, false);
              return {
                ...dto,
                customerName:
                  dto.issuedCustomerName ??
                  customerName.get(r.customerId) ??
                  null,
                branchName:
                  dto.issuedBranchName ?? branchName.get(r.branchId) ?? null,
                termDays: Math.round(
                  (r.dueDate.getTime() - r.invoiceDate.getTime()) / 86_400_000,
                ),
                awbCount: r.items.length,
              };
            }),
            total: await tx.finInvoice.count({ where }),
            page: data.page,
          };
        },
        { isolationLevel: "RepeatableRead" },
      );
    },
    async detail(inputId: unknown) {
      return db.$transaction(
        async (tx) => {
          const current = await actor(tx, "invoice", "view");
          const row = await invoice(tx, current, id.parse(inputId));
          const payments = await canReadPayments(tx, current.id);
          const audit = await tx.finCommand.findMany({
            where: {
              branchId: row.branchId,
              OR: [
                {
                  action: { startsWith: "invoice." },
                  result: { path: ["id"], equals: row.id },
                },
                ...(payments
                  ? [
                      {
                        action: "payment.create",
                        payload: { path: ["invoiceId"], equals: row.id },
                      },
                    ]
                  : []),
                ...(payments
                  ? row.receipts.map((r) => ({
                      action: "payment.reverse",
                      result: { path: ["id"], equals: r.id },
                    }))
                  : []),
              ],
            },
            select: {
              id: true,
              actorId: true,
              action: true,
              createdAt: true,
              payload: true,
            },
            orderBy: { id: "desc" },
            take: 200,
          });
          return {
            ...invoiceDTO(row, payments),
            audit: audit.map((r) => ({
              id: r.id,
              actorId: r.actorId,
              action: r.action,
              reason: (r.payload as { reason?: string }).reason ?? null,
              createdAt: r.createdAt.toISOString(),
            })),
          };
        },
        { isolationLevel: "RepeatableRead" },
      );
    },
    async choices() {
      const current = await actor(db, "invoice", "create");
      const branches = await db.branch.findMany({
        where: {
          ...(isAdministrator(current)
            ? {}
            : { id: { in: current.branchIds } }),
          status: "ACTIVE",
          deletedAt: null,
          office: {
            status: "ACTIVE",
            deletedAt: null,
            company: { deletedAt: null },
          },
        },
        select: { id: true, name: true },
        take: 200,
        orderBy: { id: "asc" },
      });
      return branches;
    },
    async options(branchId: unknown, search: string) {
      if (typeof search !== "string" || search.length > 100)
        fail("Pencarian maksimal 100 karakter.");
      const session = await resolveActor();
      if (!session) throw new IdentityError("UNAUTHENTICATED", 401);
      const current = await loadAccessActor(db, session.id);
      if (
        !permits(current, "create", "invoice") &&
        !permits(current, "update", "invoice")
      )
        throw new IdentityError("FORBIDDEN", 403);
      const owner = id.parse(branchId);
      if (!current) throw new IdentityError("UNAUTHENTICATED", 401);
      await branch(db, current, owner);
      const customers = await db.customer.findMany({
        where: {
          branchId: owner,
          deletedAt: null,
          name: { contains: search, mode: "insensitive" },
        },
        select: { id: true, name: true },
        orderBy: { id: "asc" },
        take: 50,
      });
      const transactions = await db.transaction.findMany({
        where: {
          originBranchId: owner,
          deletedAt: null,
          awbNo: { contains: search, mode: "insensitive" },
        },
        select: {
          id: true,
          awbNo: true,
          booking: { select: { customerId: true } },
        },
        orderBy: { id: "desc" },
        take: 50,
      });
      return {
        customers,
        transactions: transactions.map((r) => ({
          id: r.id,
          awbNo: r.awbNo,
          customerId: r.booking?.customerId,
        })),
      };
    },
  };
}
async function canReadPayments(tx: Tx, actorId: number) {
  const current = await loadAccessActor(tx, actorId);
  try {
    assertPermission(current, "view", "payment");
    return true;
  } catch {
    return false;
  }
}
function sameJSON(a: unknown, b: unknown): boolean {
  const stable = (v: unknown): string =>
    JSON.stringify(v, (_, value) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(
            Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
          )
        : value,
    );
  return stable(a) === stable(b);
}
function isAccounting(
  data: z.infer<typeof invoiceCommand> | z.infer<typeof accountingCommand>,
): data is z.infer<typeof accountingCommand> {
  return (
    !data.action.startsWith("invoice.") && !data.action.startsWith("payment.")
  );
}
