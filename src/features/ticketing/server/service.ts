import "server-only";
import {
  type AccessActor,
  isAdministrator,
  permitsBranch,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
  loadAccessActor,
} from "@/features/identity/server/access";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import {
  type TicketCreateInput,
  type TicketDTO,
  ticketCreateInput,
  ticketId,
  ticketListInput,
} from "../contracts";

const publicSelect = {
  id: true,
  branchId: true,
  createdById: true,
  subject: true,
  menuName: true,
  relatedPageUrl: true,
  remarks: true,
  priority: true,
  createdAt: true,
} satisfies Prisma.TicketSelect;
type PublicRecord = Prisma.TicketGetPayload<{ select: typeof publicSelect }>;
const dto = (row: PublicRecord): TicketDTO => ({
  id: row.id,
  branchId: row.branchId,
  createdById: row.createdById,
  subject: row.subject,
  menuName: row.menuName,
  relatedPageUrl: row.relatedPageUrl,
  remarks: row.remarks,
  priority: row.priority,
  createdAt: row.createdAt.toISOString(),
});
function visible(current: AccessActor): Prisma.TicketWhereInput {
  return {
    deletedAt: null,
    ...(!isAdministrator(current)
      ? { createdById: current.id, branchId: { in: current.branchIds } }
      : {}),
  };
}
function identical(row: PublicRecord, input: TicketCreateInput) {
  return (
    row.branchId === input.branchId &&
    row.subject === input.subject &&
    row.menuName === input.menuName &&
    row.relatedPageUrl === input.relatedPageUrl &&
    row.remarks === input.remarks &&
    row.priority === input.priority
  );
}

export function createTicketService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function actor(
    action: "view" | "create",
    connection: Prisma.TransactionClient = db,
    expectedId?: number,
  ) {
    const sessionActor = await resolveActor();
    if (
      !sessionActor ||
      (expectedId !== undefined && sessionActor.id !== expectedId)
    )
      throw new IdentityError("UNAUTHENTICATED", 401);
    const fresh = await loadAccessActor(connection, sessionActor.id);
    assertPermission(fresh, action, "ticket");
    return fresh;
  }
  async function creationBranch(
    connection: Prisma.TransactionClient,
    current: AccessActor,
    branchId: number,
  ) {
    if (!permitsBranch(current, branchId))
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
    const branch = await connection.branch.findFirst({
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
      select: { id: true },
    });
    if (!branch) throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  async function replay(
    connection: Prisma.TransactionClient,
    current: AccessActor,
    input: TicketCreateInput,
  ) {
    // Even administrators may replay only their own token. Current scope still applies.
    const row = await connection.ticket.findFirst({
      where: {
        ...visible(current),
        createdById: current.id,
        idempotencyKey: input.idempotencyKey,
      },
      select: publicSelect,
    });
    if (!row) return null;
    if (!identical(row, input))
      throw new IdentityError(
        "CONFLICT",
        409,
        "Kunci pengiriman sudah digunakan untuk isi tiket yang berbeda. Muat formulir baru.",
      );
    return dto(row);
  }
  return {
    async list(input: unknown = {}) {
      const current = await actor("view");
      const { page, pageSize, search } = ticketListInput.parse(input);
      const where: Prisma.TicketWhereInput = {
        ...visible(current),
        ...(search
          ? {
              OR: [
                { subject: { contains: search, mode: "insensitive" } },
                { menuName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };
      const [rows, total] = await Promise.all([
        db.ticket.findMany({
          where,
          select: publicSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        }),
        db.ticket.count({ where }),
      ]);
      return { items: rows.map(dto), total, page, pageSize, search };
    },
    async detail(inputId: unknown) {
      const current = await actor("view");
      const id = ticketId.parse(inputId);
      const row = await db.ticket.findFirst({
        where: { ...visible(current), id },
        select: publicSelect,
      });
      return row ? dto(row) : null;
    },
    async branches() {
      const current = await actor("create");
      return db.branch.findMany({
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
        orderBy: [{ name: "asc" }, { id: "asc" }],
      });
    },
    async create(input: unknown) {
      const initial = await actor("create");
      const data = ticketCreateInput.parse(input);
      try {
        return await db.$transaction(
          async (tx) => {
            // Shared creators coexist; exclusive identity/organization writers still block scope checks.
            await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
            await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock_shared(71642, 1)`;
            const fresh = await actor("create", tx, initial.id);
            await creationBranch(tx, fresh, data.branchId);
            const previous = await replay(tx, fresh, data);
            if (previous) return previous;
            const row = await tx.ticket.create({
              data: { ...data, createdById: fresh.id },
              select: publicSelect,
            });
            return dto(row);
          },
          { timeout: 15000 },
        );
      } catch (error) {
        if (
          !error ||
          typeof error !== "object" ||
          !("code" in error) ||
          error.code !== "P2002"
        )
          throw error;
        // A PostgreSQL unique violation aborts its transaction: reread outside it.
        const fresh = await actor("create", db, initial.id);
        await creationBranch(db, fresh, data.branchId);
        const previous = await replay(db, fresh, data);
        if (!previous) throw new IdentityError("NOT_FOUND", 404);
        return previous;
      }
    },
  };
}
