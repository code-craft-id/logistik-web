import "server-only";
import { z } from "zod";
import {
  type AccessActor,
  isAdministrator,
} from "@/features/identity/permissions";
import {
  assertPermission,
  IdentityError,
  loadAccessActor,
} from "@/features/identity/server/access";
import { identityId } from "@/features/identity/validation";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import {
  agentInput,
  branchInput,
  companyInput,
  officeInput,
  organizationKind,
  organizationQuery,
} from "../contracts";

/** Organization scalars only: no invoice, banking, wallet, notification or agent financial drafts. */
const companySelect = {
  id: true,
  name: true,
  address: true,
  city: true,
  postalCode: true,
  phoneNumber: true,
  faxNumber: true,
  directorName: true,
  taxId: true,
  website: true,
  logo: true,
  email: true,
  isDepositAgent: true,
  showPriceOnPrint: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect;
const officeSelect = {
  id: true,
  companyId: true,
  company: { select: { name: true } },
  code: true,
  name: true,
  address: true,
  city: true,
  phoneNumber: true,
  email: true,
  managerName: true,
  status: true,
  updatedAt: true,
} satisfies Prisma.OfficeSelect;
const branchSelect = {
  id: true,
  officeId: true,
  office: { select: { name: true } },
  code: true,
  name: true,
  address: true,
  city: true,
  phoneNumber: true,
  managerName: true,
  managerContact: true,
  postalCode: true,
  faxNumber: true,
  email: true,
  financeContactName: true,
  marketingContactName: true,
  taxId: true,
  status: true,
  updatedAt: true,
} satisfies Prisma.BranchSelect;
const agentSelect = {
  id: true,
  branchId: true,
  branch: { select: { name: true } },
  code: true,
  initials: true,
  name: true,
  category: true,
  phoneNumber: true,
  managerName: true,
  mobileNumber: true,
  status: true,
  updatedAt: true,
} satisfies Prisma.AgentSelect;
export function createOrganizationService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function actor(resource: string, action: string) {
    const current = await resolveActor();
    assertPermission(current, action, resource);
    return current;
  }
  // Parent records are shared across branches. Never let access to one child
  // authorize edits/deletion/reparenting affecting other branches.
  function assertGlobalWriter(current: AccessActor) {
    if (!isAdministrator(current))
      throw new IdentityError(
        "FORBIDDEN",
        403,
        "Perubahan struktur organisasi memerlukan administrator.",
      );
  }
  async function write<T>(
    resource: string,
    action: string,
    work: (tx: Prisma.TransactionClient, current: AccessActor) => Promise<T>,
  ) {
    const initial = await actor(resource, action);
    return db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(71642, 1)`;
        const session = await resolveActor();
        if (session?.id !== initial.id)
          throw new IdentityError("UNAUTHENTICATED", 401);
        const fresh = await loadAccessActor(tx, initial.id);
        assertPermission(fresh, action, resource);
        assertGlobalWriter(fresh);
        return work(tx, fresh);
      },
      { timeout: 15000 },
    );
  }
  return {
    async list(inputKind: unknown, input: unknown = {}) {
      const kind = organizationKind.parse(inputKind);
      const current = await actor(kind, "view");
      const { id, page, pageSize, search, status, parentId, sortDirection } =
        organizationQuery.parse(input);
      const common = {
        deletedAt: null,
        ...(id ? { id } : {}),
        ...(search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {}),
      };
      const paging = {
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ name: sortDirection }, { id: sortDirection }],
      };
      const branchScope = isAdministrator(current)
        ? {}
        : { id: { in: current.branchIds } };
      let items: Array<
        | Prisma.CompanyGetPayload<{ select: typeof companySelect }>
        | Prisma.OfficeGetPayload<{ select: typeof officeSelect }>
        | Prisma.BranchGetPayload<{ select: typeof branchSelect }>
        | Prisma.AgentGetPayload<{ select: typeof agentSelect }>
      >;
      let total: number;
      if (kind === "company") {
        const where: Prisma.CompanyWhereInput = {
          ...common,
          ...(!isAdministrator(current)
            ? {
                offices: {
                  some: {
                    deletedAt: null,
                    branches: { some: { ...branchScope, deletedAt: null } },
                  },
                },
              }
            : {}),
        };
        [items, total] = await Promise.all([
          db.company.findMany({ where, ...paging, select: companySelect }),
          db.company.count({ where }),
        ]);
      } else if (kind === "office") {
        const where: Prisma.OfficeWhereInput = {
          ...common,
          company: { deletedAt: null },
          ...(status ? { status } : {}),
          ...(parentId ? { companyId: parentId } : {}),
          ...(!isAdministrator(current)
            ? { branches: { some: { ...branchScope, deletedAt: null } } }
            : {}),
        };
        [items, total] = await Promise.all([
          db.office.findMany({ where, ...paging, select: officeSelect }),
          db.office.count({ where }),
        ]);
      } else if (kind === "branch") {
        const where: Prisma.BranchWhereInput = {
          ...common,
          ...(!isAdministrator(current) ? { AND: [branchScope] } : {}),
          office: { deletedAt: null, company: { deletedAt: null } },
          ...(status ? { status } : {}),
          ...(parentId ? { officeId: parentId } : {}),
        };
        [items, total] = await Promise.all([
          db.branch.findMany({ where, ...paging, select: branchSelect }),
          db.branch.count({ where }),
        ]);
      } else {
        const where: Prisma.AgentWhereInput = {
          ...common,
          ...(status ? { status } : {}),
          ...(parentId ? { branchId: parentId } : {}),
          ...(!isAdministrator(current)
            ? { AND: [{ branchId: { in: current.branchIds } }] }
            : {}),
        };
        [items, total] = await Promise.all([
          db.agent.findMany({ where, ...paging, select: agentSelect }),
          db.agent.count({ where }),
        ]);
      }
      return {
        items: items.map((item) => ({
          ...item,
          ...(kind === "branch" && !isAdministrator(current)
            ? { taxId: null }
            : {}),
          ...("company" in item ? { companyIdLabel: item.company.name } : {}),
          ...("office" in item ? { officeIdLabel: item.office.name } : {}),
          ...("branch" in item ? { branchIdLabel: item.branch.name } : {}),
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
        writable: isAdministrator(current),
      };
    },
    async save(
      inputKind: unknown,
      inputId: unknown,
      input: unknown,
      inputVersion: unknown = undefined,
    ) {
      const version =
        inputVersion === undefined
          ? undefined
          : z.coerce.date().parse(inputVersion);
      const kind = organizationKind.parse(inputKind);
      const id = inputId === null ? null : identityId.parse(inputId);
      return write(
        kind,
        id === null ? "create" : "update",
        async (tx, current) => {
          let record: { id: number };
          if (kind === "company") {
            const data = companyInput.parse(input);
            if (
              id !== null &&
              !(await tx.company.findFirst({
                where: { id, deletedAt: null },
                select: { id: true },
              }))
            )
              throw new IdentityError("NOT_FOUND", 404);
            if (
              id !== null &&
              version &&
              !(await tx.company.findFirst({
                where: { ...{ id, deletedAt: null }, updatedAt: version },
                select: { id: true },
              }))
            )
              throw new IdentityError(
                "CONFLICT",
                409,
                "Data telah berubah. Tutup formulir dan muat data terbaru sebelum mengedit kembali.",
              );
            record =
              id === null
                ? await tx.company.create({ data, select: { id: true } })
                : await tx.company.update({
                    where: { id },
                    data,
                    select: { id: true },
                  });
          } else if (kind === "office") {
            const data = officeInput.parse(input);
            if (
              !(await tx.company.findFirst({
                where: { id: data.companyId, deletedAt: null },
                select: { id: true },
              }))
            )
              throw new IdentityError(
                "INVALID_PARENT",
                400,
                "Perusahaan tidak tersedia.",
              );
            if (
              id !== null &&
              !(await tx.office.findFirst({
                where: { id, deletedAt: null },
                select: { id: true },
              }))
            )
              throw new IdentityError("NOT_FOUND", 404);
            if (
              id !== null &&
              version &&
              !(await tx.office.findFirst({
                where: { ...{ id, deletedAt: null }, updatedAt: version },
                select: { id: true },
              }))
            )
              throw new IdentityError(
                "CONFLICT",
                409,
                "Data telah berubah. Tutup formulir dan muat data terbaru sebelum mengedit kembali.",
              );
            record =
              id === null
                ? await tx.office.create({ data, select: { id: true } })
                : await tx.office.update({
                    where: { id },
                    data,
                    select: { id: true },
                  });
          } else if (kind === "branch") {
            const data = branchInput.parse(input);
            const previous =
              id === null
                ? null
                : await tx.branch.findFirst({
                    where: { id, deletedAt: null },
                    select: { officeId: true, status: true },
                  });
            if (id !== null && !previous)
              throw new IdentityError("NOT_FOUND", 404);
            // Existing links remain maintainable; new links and reactivation
            // still require an active parent.
            const maintainingParent =
              previous?.officeId === data.officeId &&
              !(previous.status === "INACTIVE" && data.status === "ACTIVE");
            if (
              !(await tx.office.findFirst({
                where: {
                  id: data.officeId,
                  ...(!maintainingParent ? { status: "ACTIVE" as const } : {}),
                  deletedAt: null,
                  company: { deletedAt: null },
                },
                select: { id: true },
              }))
            )
              throw new IdentityError(
                "INVALID_PARENT",
                400,
                "Kantor tidak tersedia atau tidak aktif.",
              );
            if (
              id !== null &&
              !(await tx.branch.findFirst({
                where: { id, deletedAt: null },
                select: { id: true },
              }))
            )
              throw new IdentityError("NOT_FOUND", 404);
            if (
              id !== null &&
              version &&
              !(await tx.branch.findFirst({
                where: { ...{ id, deletedAt: null }, updatedAt: version },
                select: { id: true },
              }))
            )
              throw new IdentityError(
                "CONFLICT",
                409,
                "Data telah berubah. Tutup formulir dan muat data terbaru sebelum mengedit kembali.",
              );
            record =
              id === null
                ? await tx.branch.create({ data, select: { id: true } })
                : await tx.branch.update({
                    where: { id },
                    data,
                    select: { id: true },
                  });
          } else {
            const data = agentInput.parse(input);
            const previous =
              id === null
                ? null
                : await tx.agent.findFirst({
                    where: { id, deletedAt: null },
                    select: { branchId: true, status: true },
                  });
            if (id !== null && !previous)
              throw new IdentityError("NOT_FOUND", 404);
            const maintainingParent =
              previous?.branchId === data.branchId &&
              !(previous.status === "INACTIVE" && data.status === "ACTIVE");
            if (
              !(await tx.branch.findFirst({
                where: {
                  id: data.branchId,
                  ...(!maintainingParent ? { status: "ACTIVE" as const } : {}),
                  deletedAt: null,
                  office: {
                    ...(!maintainingParent
                      ? { status: "ACTIVE" as const }
                      : {}),
                    deletedAt: null,
                    company: { deletedAt: null },
                  },
                },
                select: { id: true },
              }))
            )
              throw new IdentityError(
                "INVALID_PARENT",
                400,
                "Cabang tidak tersedia atau tidak aktif.",
              );
            if (
              id !== null &&
              !(await tx.agent.findFirst({
                where: { id, deletedAt: null },
                select: { id: true },
              }))
            )
              throw new IdentityError("NOT_FOUND", 404);
            if (
              id !== null &&
              version &&
              !(await tx.agent.findFirst({
                where: { id, deletedAt: null, updatedAt: version },
                select: { id: true },
              }))
            )
              throw new IdentityError(
                "CONFLICT",
                409,
                "Data telah berubah. Muat data terbaru.",
              );
            // Coordinator approved zero opening values in chat (2026-10-25).
            // Existing balances/rates are never read or changed by identity maintenance.
            record =
              id === null
                ? await tx.agent.create({
                    data: { ...data, balance: "0", commissionRate: "0" },
                    select: { id: true },
                  })
                : await tx.agent.update({
                    where: { id },
                    data,
                    select: { id: true },
                  });
          }
          await tx.identityAuditEvent.create({
            data: {
              actorId: current.id,
              action: id === null ? "REFERENCE_CREATED" : "REFERENCE_UPDATED",
              subjectType: kind,
              subjectId: record.id,
            },
          });
          return record;
        },
      );
    },
    async remove(inputKind: unknown, inputId: unknown) {
      const kind = organizationKind.parse(inputKind);
      const id = identityId.parse(inputId);
      return write(kind, "delete", async (tx, current) => {
        const data = { deletedAt: new Date() };
        let count: number;
        if (kind === "company") {
          if (
            await tx.company.findFirst({
              where: {
                id,
                OR: [
                  { banks: { some: { deletedAt: null } } },
                  { invoiceSettings: { some: { deletedAt: null } } },
                  { digitalWallets: { some: { deletedAt: null } } },
                  { whatsappNotifications: { some: { deletedAt: null } } },
                ],
              },
              select: { id: true },
            })
          )
            throw new IdentityError(
              "IN_USE",
              409,
              "Perusahaan masih mempunyai konfigurasi aktif.",
            );
          if (
            await tx.office.count({ where: { companyId: id, deletedAt: null } })
          )
            throw new IdentityError(
              "IN_USE",
              409,
              "Perusahaan masih mempunyai kantor.",
            );
          count = (
            await tx.company.updateMany({
              where: { id, deletedAt: null },
              data,
            })
          ).count;
        } else if (kind === "office") {
          if (
            await tx.branch.count({ where: { officeId: id, deletedAt: null } })
          )
            throw new IdentityError(
              "IN_USE",
              409,
              "Kantor masih mempunyai cabang.",
            );
          count = (
            await tx.office.updateMany({ where: { id, deletedAt: null }, data })
          ).count;
        } else if (kind === "branch") {
          if (
            await tx.branch.findFirst({
              where: {
                id,
                OR: [
                  { agents: { some: { deletedAt: null } } },
                  { drivers: { some: { deletedAt: null } } },
                  { couriers: { some: { deletedAt: null } } },
                  { vehicles: { some: { deletedAt: null } } },
                  { customers: { some: { deletedAt: null } } },
                  { consignees: { some: { deletedAt: null } } },
                  { marketingPeople: { some: { deletedAt: null } } },
                ],
              },
              select: { id: true },
            })
          )
            throw new IdentityError(
              "IN_USE",
              409,
              "Cabang masih mempunyai data yang digunakan.",
            );
          if (await tx.userAllowedBranch.count({ where: { branchId: id } }))
            throw new IdentityError(
              "IN_USE",
              409,
              "Cabang masih ditugaskan ke pengguna.",
            );
          count = (
            await tx.branch.updateMany({ where: { id, deletedAt: null }, data })
          ).count;
        } else {
          count = (
            await tx.agent.updateMany({ where: { id, deletedAt: null }, data })
          ).count;
        }
        if (!count) throw new IdentityError("NOT_FOUND", 404);
        await tx.identityAuditEvent.create({
          data: {
            actorId: current.id,
            action: "REFERENCE_DELETED",
            subjectType: kind,
            subjectId: id,
          },
        });
        return { success: true };
      });
    },
  };
}
