import "server-only";
import {
  type AccessActor,
  isAdministrator,
  permits,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
  loadAccessActor,
} from "@/features/identity/server/access";
import { Prisma, type PrismaClient } from "@/lib/db/generated/client";
import type { OperationalReportResult } from "../contracts";
import { type OperationalKind, parseOperationalFilters } from "../filters";
import { quantitySelect, quantityTotals } from "./quantities";

const resources = {
  manifest: "manifest_report",
  delivery: "delivery_report",
  dashboard: "dashboard_report",
  vendor: "manifest_report",
} as const;
const literal = (search: string) => ({
  contains: search.replace(/[\\%_]/g, "\\$&"),
  mode: "insensitive" as const,
});
function transactions(actor: AccessActor): Prisma.TransactionWhereInput {
  return {
    deletedAt: null,
    ...(!isAdministrator(actor)
      ? {
          OR: [
            { originBranchId: { in: actor.branchIds } },
            { destinationBranchId: { in: actor.branchIds } },
          ],
        }
      : {}),
  };
}
function manifests(
  actor: AccessActor,
  branchId: number | null,
): Prisma.ManifestWhereInput {
  const AND: Prisma.ManifestWhereInput[] = [];
  if (!isAdministrator(actor)) AND.push({ branchId: { in: actor.branchIds } });
  if (branchId !== null) AND.push({ branchId });
  return { deletedAt: null, AND };
}
/** Legacy dashboard Quick Action order; only implemented, permitted routes are links. */
const QUICK_ACTIONS = [
  { label: "Booking", href: "/bookings", action: "view", resource: "booking" },
  {
    label: "Entry AWB",
    href: "/transactions/new",
    action: "create",
    resource: "transaction",
  },
  {
    label: "Manifest",
    href: "/manifest",
    action: "view",
    resource: "manifest",
  },
  {
    label: "Transit",
    href: "/manifest?type=Transit",
    action: "view",
    resource: "manifest",
  },
  {
    label: "Inbound Manifest",
    href: "/manifest?type=Inbound",
    action: "view",
    resource: "manifest",
  },
  {
    label: "Delivery Sheet",
    href: "/branch-reports/delivery",
    action: "view",
    resource: "delivery_report",
  },
  {
    label: "Shipment Status",
    href: "/customer-service/status-pengantaran",
    action: "view",
    resource: "transaction",
  },
  {
    label: "Invoice",
    href: "/finance/invoices",
    action: "view",
    resource: "invoice",
  },
  {
    label: "Invoice Paid",
    href: "/finance/invoices?payment=PAID",
    action: "view",
    resource: "invoice",
  },
  {
    label: "Tracking AWB",
    href: "/transactions/lookup",
    action: "view",
    resource: "transaction",
  },
  {
    label: "Report Detail Transaksi",
    href: "/branch-reports/transaction-details",
    action: "view",
    resource: "transaction_report",
  },
  {
    label: "Rekap Transaksi",
    href: "/branch-reports/rekap-transaksi",
    action: "view",
    resource: "transaction_report",
  },
  {
    label: "Report AR",
    href: "/financial-reports/aging",
    action: "view",
    resource: "invoice",
  },
] as const;
function quickActions(actor: AccessActor) {
  return QUICK_ACTIONS.filter((item) =>
    permits(actor, item.action, item.resource),
  ).map(({ label, href }) => ({ label, href }));
}

/** FIN-01 derived payment state of current ISSUED invoices (balance as of now). */
async function invoiceBalances(
  tx: Prisma.TransactionClient,
  actor: AccessActor,
  branchId: number | null,
) {
  const scope: Prisma.Sql[] = [];
  if (!isAdministrator(actor))
    scope.push(
      actor.branchIds.length
        ? Prisma.sql`i."branchId" IN (${Prisma.join(actor.branchIds)})`
        : Prisma.sql`FALSE`,
    );
  if (branchId !== null) scope.push(Prisma.sql`i."branchId" = ${branchId}`);
  const where = scope.length
    ? Prisma.sql`AND ${Prisma.join(scope, " AND ")}`
    : Prisma.empty;
  const [row] = await tx.$queryRaw<
    { unpaid: number; partial: number; paid: number; outstanding: string }[]
  >`
    SELECT count(*) FILTER (WHERE net = 0)::int AS unpaid,
           count(*) FILTER (WHERE net > 0 AND net < total)::int AS partial,
           count(*) FILTER (WHERE net = total)::int AS paid,
           COALESCE(sum(total - net), 0)::numeric(15,2)::text AS outstanding
    FROM (
      SELECT i.total,
             COALESCE(sum(CASE WHEN r."reversalOfId" IS NULL THEN r.amount ELSE -r.amount END), 0) AS net
      FROM fin_invoices i
      LEFT JOIN fin_receipts r ON r."invoiceId" = i.id
      WHERE i.status = 'ISSUED' ${where}
      GROUP BY i.id, i.total
    ) balances`;
  return row ?? { unpaid: 0, partial: 0, paid: 0, outstanding: "0.00" };
}

/** AWB count per UTC transaction day, every day of the period present (zero-filled). */
async function dailyTransactions(
  tx: Prisma.TransactionClient,
  actor: AccessActor,
  branchId: number | null,
  from: Date,
  toExclusive: Date,
) {
  const scope: Prisma.Sql[] = [];
  if (!isAdministrator(actor))
    scope.push(
      actor.branchIds.length
        ? Prisma.sql`(t.origin_branch_id IN (${Prisma.join(actor.branchIds)}) OR t.destination_branch_id IN (${Prisma.join(actor.branchIds)}))`
        : Prisma.sql`FALSE`,
    );
  if (branchId !== null)
    scope.push(
      Prisma.sql`(t.origin_branch_id = ${branchId} OR t.destination_branch_id = ${branchId})`,
    );
  const where = scope.length
    ? Prisma.sql`AND ${Prisma.join(scope, " AND ")}`
    : Prisma.empty;
  const rows = await tx.$queryRaw<{ day: string; count: number }[]>`
    SELECT to_char(t.transaction_date, 'YYYY-MM-DD') AS day, count(*)::int AS count
    FROM transactions t
    WHERE t.deleted_at IS NULL
      AND t.transaction_date >= ${from} AND t.transaction_date < ${toExclusive}
      ${where}
    GROUP BY 1`;
  const counts = new Map(rows.map((row) => [row.day, row.count]));
  const days: { date: string; count: number }[] = [];
  for (let at = from.getTime(); at < toExclusive.getTime(); at += 86_400_000) {
    const date = new Date(at).toISOString().slice(0, 10);
    days.push({ date, count: counts.get(date) ?? 0 });
  }
  return days;
}

export function createOperationalReportService(
  db: PrismaClient,
  resolve: () => Promise<AccessActor | null>,
) {
  return {
    async read(
      kind: OperationalKind,
      input: unknown = {},
    ): Promise<OperationalReportResult> {
      const identity = await resolve();
      if (!identity) throw new IdentityError("UNAUTHENTICATED", 401);
      return db.$transaction(
        async (tx) => {
          const actor = await loadAccessActor(tx, identity.id);
          assertPermission(actor, "view", resources[kind]);
          const admin = isAdministrator(actor);
          const { view, parsed } = parseOperationalFilters(kind, input);
          const branches =
            kind === "vendor"
              ? []
              : await tx.branch.findMany({
                  where: {
                    deletedAt: null,
                    ...(!admin ? { id: { in: actor.branchIds } } : {}),
                  },
                  select: { id: true, name: true },
                  orderBy: [{ name: "asc" }, { id: "asc" }],
                });
          const base = {
            parsed,
            branches,
            total: 0,
            links: {
              manifest: permits(actor, "view", "manifest_report"),
              delivery: permits(actor, "view", "delivery_report"),
              transaction: permits(actor, "view", "transaction_report"),
            },
          };
          if (kind === "vendor")
            return { ...base, kind: "vendor", state: "unavailable", items: [] };
          const empty = (
            state: "initial" | "invalid" | "ready",
          ): OperationalReportResult => {
            if (kind === "dashboard")
              return {
                ...base,
                kind: "dashboard",
                state,
                items: [],
                counts:
                  state === "ready"
                    ? { transactions: 0, manifests: 0, sheets: 0, items: 0 }
                    : null,
              };
            if (kind === "manifest")
              return { ...base, kind: "manifest", state, items: [] };
            return view === "items"
              ? { ...base, kind: "items", state, items: [] }
              : { ...base, kind: "sheets", state, items: [] };
          };
          if (parsed.status !== "valid") return empty(parsed.status);
          const f = parsed.filters;
          if (
            f.branchId !== null &&
            !branches.some((branch) => branch.id === f.branchId)
          )
            throw new IdentityError("FORBIDDEN", 403);
          if (!admin && !actor.branchIds.length) return empty("ready");
          const range = { gte: f.from, lt: f.toExclusive };
          const txVisible = transactions(actor);
          const manifestVisible = manifests(actor, f.branchId);
          const eligibleItems: Prisma.DeliverySheetItemWhereInput = {
            deletedAt: null,
            transaction: { is: txVisible },
          };
          const sheetsWhere: Prisma.DeliverySheetWhereInput = {
            deliveryDate: range,
            manifest: { is: manifestVisible },
            items: { some: eligibleItems },
          };
          const itemsWhere: Prisma.DeliverySheetItemWhereInput = {
            ...eligibleItems,
            deliverySheet: {
              is: { deliveryDate: range, manifest: { is: manifestVisible } },
            },
          };
          if (kind === "manifest") {
            const where: Prisma.ManifestWhereInput = {
              ...manifestVisible,
              manifestDate: range,
              ...(f.search ? { manifestNo: literal(f.search) } : {}),
            };
            const rows = await tx.manifest.findMany({
              where,
              select: {
                id: true,
                manifestNo: true,
                manifestDate: true,
                branch: { select: { name: true } },
                originBranchId: true,
                destinationBranchId: true,
                type: true,
                vehicle: { select: { licensePlate: true } },
                courier: { select: { name: true } },
                status: true,
                _count: {
                  select: {
                    items: {
                      where: {
                        deletedAt: null,
                        releasedAt: null,
                        transaction: { is: txVisible },
                      },
                    },
                  },
                },
              },
              orderBy: [{ manifestDate: "desc" }, { id: "desc" }],
              skip: f.skip,
              take: f.take,
            });
            const referenceIds = [
              ...new Set(
                rows
                  .flatMap((row) => [
                    row.originBranchId,
                    row.destinationBranchId,
                  ])
                  .filter((id): id is number => id !== null),
              ),
            ];
            const references = new Map(
              (referenceIds.length
                ? await tx.branch.findMany({
                    where: { id: { in: referenceIds } },
                    select: { id: true, name: true },
                  })
                : []
              ).map((branch) => [branch.id, branch.name]),
            );
            const quantities = quantityTotals(
              rows.map((row) => row.id),
              (rows.length
                ? await tx.manifestItem.findMany({
                    where: {
                      manifestId: { in: rows.map((row) => row.id) },
                      deletedAt: null,
                      releasedAt: null,
                      transaction: { is: txVisible },
                    },
                    select: {
                      manifestId: true,
                      transaction: { select: quantitySelect },
                    },
                    orderBy: { id: "asc" },
                    take: 10_001,
                  })
                : []
              ).map((item) => ({
                groupId: item.manifestId,
                transaction: item.transaction,
              })),
            );
            const total = await tx.manifest.count({ where });
            return {
              ...base,
              kind: "manifest",
              state: "ready",
              total,
              items: rows.map((row) => {
                const quantity = quantities.get(row.id);
                if (!quantity) throw new Error("Missing manifest quantities");
                return {
                  id: row.id,
                  manifestNo: row.manifestNo,
                  date: row.manifestDate.toISOString(),
                  branch: row.branch?.name ?? null,
                  originBranch:
                    row.originBranchId === null
                      ? null
                      : (references.get(row.originBranchId) ?? null),
                  destinationBranch:
                    row.destinationBranchId === null
                      ? null
                      : (references.get(row.destinationBranchId) ?? null),
                  type: row.type,
                  vehicle: row.vehicle?.licensePlate ?? null,
                  courier: row.courier?.name ?? null,
                  status: row.status,
                  assignedTransactions: row._count.items,
                  ...quantity,
                };
              }),
            };
          }
          if (kind === "dashboard") {
            const AND: Prisma.TransactionWhereInput[] = [];
            if (f.branchId !== null)
              AND.push({
                OR: [
                  { originBranchId: f.branchId },
                  { destinationBranchId: f.branchId },
                ],
              });
            const transactionCount = await tx.transaction.count({
              where: { ...txVisible, transactionDate: range, AND },
            });
            const manifestCount = await tx.manifest.count({
              where: { ...manifestVisible, manifestDate: range },
            });
            const sheetCount = await tx.deliverySheet.count({
              where: sheetsWhere,
            });
            const itemCount = await tx.deliverySheetItem.count({
              where: itemsWhere,
            });
            const inPeriod: Prisma.TransactionWhereInput = {
              ...txVisible,
              transactionDate: range,
              AND,
            };
            const awbPending = await tx.transaction.count({
              where: {
                ...inPeriod,
                manifestItems: {
                  none: {
                    deletedAt: null,
                    releasedAt: null,
                    manifest: { is: { deletedAt: null } },
                  },
                },
              },
            });
            const statuses = (
              await tx.transaction.groupBy({
                by: ["status"],
                where: inPeriod,
                _count: { _all: true },
                orderBy: { status: "asc" },
              })
            ).map((row) => ({ status: row.status, count: row._count._all }));
            const readsTransactions =
              permits(actor, "view", "transaction_report") ||
              permits(actor, "view", "transaction");
            const recent = readsTransactions
              ? (
                  await tx.transaction.findMany({
                    where: { ...txVisible, AND },
                    select: {
                      id: true,
                      awbNo: true,
                      createdAt: true,
                      createdBy: { select: { name: true } },
                    },
                    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                    take: 5,
                  })
                ).map((row) => ({
                  id: row.id,
                  awbNo: row.awbNo,
                  createdBy: row.createdBy?.name ?? null,
                  createdAt: row.createdAt.toISOString(),
                }))
              : null;
            const daily = await dailyTransactions(
              tx,
              actor,
              f.branchId,
              f.from,
              f.toExclusive,
            );
            const invoices = permits(actor, "view", "invoice")
              ? await invoiceBalances(tx, actor, f.branchId)
              : null;
            return {
              ...base,
              kind: "dashboard",
              state: "ready",
              items: [],
              counts: {
                transactions: transactionCount,
                manifests: manifestCount,
                sheets: sheetCount,
                items: itemCount,
              },
              insights: {
                actions: quickActions(actor),
                awbPending,
                daily,
                statuses,
                recent,
                invoices,
              },
            };
          }
          if (view === "sheets") {
            const where: Prisma.DeliverySheetWhereInput = {
              ...sheetsWhere,
              ...(f.search ? { sheetNo: literal(f.search) } : {}),
            };
            const rows = await tx.deliverySheet.findMany({
              where,
              select: {
                id: true,
                sheetNo: true,
                deliveryDate: true,
                manifest: {
                  select: {
                    manifestNo: true,
                    branch: { select: { name: true } },
                    courier: { select: { name: true } },
                  },
                },
                _count: { select: { items: { where: eligibleItems } } },
              },
              orderBy: [{ deliveryDate: "desc" }, { id: "desc" }],
              skip: f.skip,
              take: f.take,
            });
            const quantities = quantityTotals(
              rows.map((row) => row.id),
              (rows.length
                ? await tx.deliverySheetItem.findMany({
                    where: {
                      ...eligibleItems,
                      deliverySheetId: { in: rows.map((row) => row.id) },
                    },
                    select: {
                      deliverySheetId: true,
                      transaction: { select: quantitySelect },
                    },
                    orderBy: { id: "asc" },
                    take: 10_001,
                  })
                : []
              ).map((item) => ({
                groupId: item.deliverySheetId,
                transaction: item.transaction,
              })),
            );
            const total = await tx.deliverySheet.count({ where });
            return {
              ...base,
              kind: "sheets",
              state: "ready",
              total,
              items: rows.map((row) => {
                const quantity = quantities.get(row.id);
                if (!quantity) throw new Error("Missing delivery quantities");
                return {
                  id: row.id,
                  sheetNo: row.sheetNo,
                  date: row.deliveryDate.toISOString(),
                  manifestNo: row.manifest.manifestNo,
                  branch: row.manifest.branch?.name ?? null,
                  courier: row.manifest.courier?.name ?? null,
                  visibleTransactions: row._count.items,
                  ...quantity,
                };
              }),
            };
          }
          const where: Prisma.DeliverySheetItemWhereInput = {
            ...itemsWhere,
            transaction: {
              is: {
                ...txVisible,
                ...(f.search ? { awbNo: literal(f.search) } : {}),
              },
            },
          };
          const rows = await tx.deliverySheetItem.findMany({
            where,
            select: {
              id: true,
              deliverySheet: { select: { sheetNo: true, deliveryDate: true } },
              transaction: { select: { awbNo: true, receiverName: true } },
              outcome: true,
              deliveredAt: true,
              receivedBy: true,
              notes: true,
            },
            orderBy: [
              { deliverySheet: { deliveryDate: "desc" } },
              { id: "desc" },
            ],
            skip: f.skip,
            take: f.take,
          });
          const total = await tx.deliverySheetItem.count({ where });
          return {
            ...base,
            kind: "items",
            state: "ready",
            total,
            items: rows.map((row) => ({
              id: row.id,
              sheetNo: row.deliverySheet.sheetNo,
              date: row.deliverySheet.deliveryDate.toISOString(),
              awbNo: row.transaction.awbNo,
              receiverName: row.transaction.receiverName,
              outcome: row.outcome,
              deliveredAt: row.deliveredAt?.toISOString() ?? null,
              receivedBy: row.receivedBy,
              notes: row.notes,
            })),
          };
        },
        { isolationLevel: "RepeatableRead" },
      );
    },
  };
}
