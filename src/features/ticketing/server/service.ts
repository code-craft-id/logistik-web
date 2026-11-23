import "server-only";
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
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import {
  type TicketCreateInput,
  type TicketDTO,
  ticketCreateInput,
  ticketDecisionInput,
  ticketId,
  ticketListInput,
  ticketStatusInput,
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
  status: true,
  approval: true,
  approvalNote: true,
  approvedAt: true,
  approvedBy: { select: { name: true } },
  createdBy: { select: { name: true } },
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
  status: row.status,
  approval: row.approval,
  approvalNote: row.approvalNote,
  approvedAt: row.approvedAt?.toISOString() ?? null,
  approvedBy: row.approvedBy?.name ?? null,
  createdBy: row.createdBy?.name ?? null,
});
/**
 * Administrators see every ticket; support staff (ticket: manage) see the
 * tickets of their branches; everyone else sees only their own.
 */
function visible(current: AccessActor): Prisma.TicketWhereInput {
  if (isAdministrator(current)) return { deletedAt: null };
  return {
    deletedAt: null,
    branchId: { in: current.branchIds },
    ...(permits(current, "manage", "ticket")
      ? {}
      : { createdById: current.id }),
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
    action: "view" | "create" | "manage",
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
      return db.$transaction(
        async (tx) => {
          const current = await actor("view", tx);
          const { page, pageSize, search, tab } = ticketListInput.parse(input);
          const where: Prisma.TicketWhereInput = {
            ...visible(current),
            ...(tab === "approval"
              ? { createdById: current.id, status: "Finish", approval: null }
              : {}),
            ...(search
              ? {
                  OR: [
                    { subject: { contains: search, mode: "insensitive" } },
                    { menuName: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
          };
          const rows = await tx.ticket.findMany({
            where,
            select: publicSelect,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          });
          const total = await tx.ticket.count({ where });
          return { items: rows.map(dto), total, page, pageSize, search, tab };
        },
        { isolationLevel: "RepeatableRead" },
      );
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
    /** Support changes the status; an approved ticket is final. */
    async setStatus(input: unknown) {
      const current = await actor("manage");
      const data = ticketStatusInput.parse(input);
      const changed = await db.ticket.updateMany({
        where: {
          ...visible(current),
          id: data.id,
          status: { not: data.status },
          // NULL-safe: a plain NOT would also skip tickets without approval.
          OR: [{ approval: null }, { approval: { not: "Approved" } }],
        },
        data: { status: data.status, approval: null, approvalNote: null },
      });
      if (changed.count !== 1)
        throw new IdentityError(
          "CONFLICT",
          409,
          "Status tidak bisa diubah: tiket sudah disetujui, sudah berstatus itu, atau tidak ditemukan.",
        );
      return { id: data.id };
    },
    /**
     * The ticket creator approves a finished ticket (final) or asks for a
     * revision, which reopens it with the note.
     */
    async decide(input: unknown) {
      const current = await actor("view");
      const data = ticketDecisionInput.parse(input);
      if (data.decision === "Revision" && !data.note)
        throw new IdentityError(
          "CONFLICT",
          409,
          "Tulis catatan revisi agar tim support tahu yang perlu diperbaiki.",
        );
      const changed = await db.ticket.updateMany({
        where: {
          ...visible(current),
          id: data.id,
          createdById: current.id,
          status: "Finish",
          approval: null,
        },
        data:
          data.decision === "Approved"
            ? {
                approval: "Approved",
                approvalNote: data.note,
                approvedById: current.id,
                approvedAt: new Date(),
              }
            : {
                status: "Open",
                approval: "Revision",
                approvalNote: data.note,
                approvedById: current.id,
                approvedAt: new Date(),
              },
      });
      if (changed.count !== 1)
        throw new IdentityError(
          "CONFLICT",
          409,
          "Hanya pembuat tiket yang bisa menyetujui tiket berstatus Finish yang belum diputuskan.",
        );
      return { id: data.id };
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
