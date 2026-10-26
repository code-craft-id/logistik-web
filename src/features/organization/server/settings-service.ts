import "server-only";
import { z } from "zod";
import type { ReferenceRow } from "@/components/patterns/reference-workspace";
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
import { identityId, listQuerySchema } from "@/features/identity/validation";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import {
  companyBankInput,
  companyDigitalWalletInput,
  companyInvoiceSettingsInput,
  configurationKind,
  customerWhatsAppNotificationInput,
  vendorTaxProfileInput,
} from "../settings-contracts";

/** Coordinator-approved configuration maintenance only. No payments, postings,
 * external API calls, notification delivery or use of financial account models.
 * Template payload storage is intentionally absent: schema changes were declined.
 */
const configurationQuery = listQuerySchema.extend({
  companyId: identityId.optional(),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});
export function createConfigurationService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function actor(kind: string, action: string) {
    const current = await resolveActor();
    assertPermission(current, action, kind);
    // Vendor.branch is free text; it cannot establish authorized branch membership.
    if (kind === "vendor_tax" && !isAdministrator(current))
      throw new IdentityError("FORBIDDEN", 403);
    return current;
  }
  const companyScope = (current: AccessActor): Prisma.CompanyWhereInput => ({
    deletedAt: null,
    ...(!isAdministrator(current)
      ? {
          offices: {
            some: {
              deletedAt: null,
              status: "ACTIVE",
              branches: {
                some: {
                  id: { in: current.branchIds },
                  deletedAt: null,
                  status: "ACTIVE",
                },
              },
            },
          },
        }
      : {}),
  });
  async function mutate<T>(
    kind: string,
    action: string,
    work: (tx: Prisma.TransactionClient, current: AccessActor) => Promise<T>,
  ) {
    const initial = await actor(kind, action);
    return db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(71642, 1)`;
        if ((await resolveActor())?.id !== initial.id)
          throw new IdentityError("UNAUTHENTICATED", 401);
        const current = await loadAccessActor(tx, initial.id);
        assertPermission(current, action, kind);
        if (!isAdministrator(current))
          throw new IdentityError(
            "FORBIDDEN",
            403,
            "Perubahan konfigurasi bersama memerlukan administrator.",
          );
        return work(tx, current);
      },
      { timeout: 15000 },
    );
  }
  function dto<
    T extends {
      id: number;
      updatedAt: Date;
      company?: { name: string };
      vendor?: { name: string };
      customer?: { name: string } | null;
    },
  >(value: T): ReferenceRow {
    const { company, vendor, customer, ...scalars } = value;
    return {
      ...scalars,
      name: company?.name ?? vendor?.name ?? "",
      companyIdLabel: company?.name,
      vendorIdLabel: vendor?.name,
      customerIdLabel: customer?.name,
    };
  }
  return {
    async capabilities(inputKind: unknown) {
      const kind = configurationKind.parse(inputKind);
      const current = await actor(kind, "view");
      return {
        create: isAdministrator(current) && permits(current, "create", kind),
        update: isAdministrator(current) && permits(current, "update", kind),
        delete: isAdministrator(current) && permits(current, "delete", kind),
      };
    },
    async list(inputKind: unknown, input: unknown = {}) {
      const kind = configurationKind.parse(inputKind);
      const current = await actor(kind, "view");
      const { page, pageSize, search, sortDirection, companyId } =
        configurationQuery.parse(input);
      const paging = {
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: sortDirection },
      };
      let items: ReferenceRow[];
      let total: number;
      switch (kind) {
        case "company_invoice": {
          const where = {
            deletedAt: null,
            company: companyScope(current),
            ...(companyId ? { companyId } : {}),
            ...(search
              ? {
                  OR: [
                    {
                      company: {
                        name: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                    {
                      invoiceFormat: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      signatoryName: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      signatoryPosition: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      invoiceMessage: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                }
              : {}),
          };
          [items, total] = await Promise.all([
            db.companyInvoiceSettings
              .findMany({
                where,
                ...paging,
                orderBy: [
                  { company: { name: sortDirection } },
                  { id: sortDirection },
                ],
                select: {
                  id: true,
                  updatedAt: true,
                  company: { select: { name: true } },
                  companyId: true,
                  invoiceFormat: true,
                  signatoryName: true,
                  signatoryPosition: true,
                  invoiceMessage: true,
                },
              })
              .then((rows) => rows.map(dto)),
            db.companyInvoiceSettings.count({ where }),
          ]);
          break;
        }
        case "company_bank": {
          const where = {
            deletedAt: null,
            company: companyScope(current),
            ...(companyId ? { companyId } : {}),
            ...(search
              ? {
                  OR: [
                    {
                      company: {
                        name: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                    {
                      description: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                }
              : {}),
          };
          [items, total] = await Promise.all([
            db.companyBank
              .findMany({
                where,
                ...paging,
                orderBy: [
                  { company: { name: sortDirection } },
                  { id: sortDirection },
                ],
                select: {
                  id: true,
                  updatedAt: true,
                  company: { select: { name: true } },
                  companyId: true,
                  description: true,
                },
              })
              .then((rows) => rows.map(dto)),
            db.companyBank.count({ where }),
          ]);
          break;
        }
        case "company_wallet": {
          const where = {
            deletedAt: null,
            company: companyScope(current),
            ...(companyId ? { companyId } : {}),
            ...(search
              ? {
                  OR: [
                    {
                      company: {
                        name: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                    {
                      provider: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      accountName: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      verificationEmail: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                }
              : {}),
          };
          [items, total] = await Promise.all([
            db.companyDigitalWallet
              .findMany({
                where,
                ...paging,
                orderBy: [
                  { company: { name: sortDirection } },
                  { id: sortDirection },
                ],
                select: {
                  id: true,
                  updatedAt: true,
                  company: { select: { name: true } },
                  companyId: true,
                  provider: true,
                  accountName: true,
                  verificationEmail: true,
                },
              })
              .then((rows) => rows.map(dto)),
            db.companyDigitalWallet.count({ where }),
          ]);
          break;
        }
        case "whatsapp_configuration": {
          const where = {
            deletedAt: null,
            company: companyScope(current),
            ...(!isAdministrator(current)
              ? {
                  AND: [
                    {
                      OR: [
                        { customerId: null },
                        {
                          customer: {
                            deletedAt: null,
                            branchId: { in: current.branchIds },
                          },
                        },
                      ],
                    },
                  ],
                }
              : {}),
            ...(companyId ? { companyId } : {}),
            ...(search
              ? {
                  OR: [
                    {
                      company: {
                        name: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  ],
                }
              : {}),
          };
          [items, total] = await Promise.all([
            db.customerWhatsAppNotification
              .findMany({
                where,
                ...paging,
                orderBy: [
                  { company: { name: sortDirection } },
                  { id: sortDirection },
                ],
                select: {
                  id: true,
                  updatedAt: true,
                  company: { select: { name: true } },
                  companyId: true,
                  customerId: true,
                  customer: { select: { name: true } },
                  isEnabled: true,
                },
              })
              .then((rows) => rows.map(dto)),
            db.customerWhatsAppNotification.count({ where }),
          ]);
          break;
        }
        case "vendor_tax": {
          const where = {
            deletedAt: null,
            vendor: { deletedAt: null },
            ...(search
              ? {
                  OR: [
                    {
                      vendor: {
                        name: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                    {
                      registeredName: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      address1: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      address2: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      city: { contains: search, mode: "insensitive" as const },
                    },
                    {
                      postalCode: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                }
              : {}),
          };
          [items, total] = await Promise.all([
            db.vendorTaxProfile
              .findMany({
                where,
                ...paging,
                orderBy: [
                  { vendor: { name: sortDirection } },
                  { id: sortDirection },
                ],
                select: {
                  id: true,
                  updatedAt: true,
                  vendor: { select: { name: true } },
                  vendorId: true,
                  registeredName: true,
                  address1: true,
                  address2: true,
                  city: true,
                  postalCode: true,
                },
              })
              .then((rows) => rows.map(dto)),
            db.vendorTaxProfile.count({ where }),
          ]);
          break;
        }
      }
      return {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    },
    async detail(inputKind: unknown, inputId: unknown) {
      const kind = configurationKind.parse(inputKind);
      const id = identityId.parse(inputId);
      const current = await actor(kind, "update");
      if (!isAdministrator(current)) throw new IdentityError("FORBIDDEN", 403);
      let record: ReferenceRow | null;
      switch (kind) {
        case "company_invoice": {
          const value = await db.companyInvoiceSettings.findFirst({
            where: { id, deletedAt: null, company: { deletedAt: null } },
            select: {
              id: true,
              updatedAt: true,
              company: { select: { name: true } },
              companyId: true,
              invoiceFormat: true,
              signatoryName: true,
              signatoryPosition: true,
              invoiceMessage: true,
            },
          });
          record = value ? dto(value) : null;
          break;
        }
        case "company_bank": {
          const value = await db.companyBank.findFirst({
            where: { id, deletedAt: null, company: { deletedAt: null } },
            select: {
              id: true,
              updatedAt: true,
              company: { select: { name: true } },
              companyId: true,
              description: true,
            },
          });
          record = value ? dto(value) : null;
          break;
        }
        case "company_wallet": {
          const value = await db.companyDigitalWallet.findFirst({
            where: { id, deletedAt: null, company: { deletedAt: null } },
            select: {
              id: true,
              updatedAt: true,
              company: { select: { name: true } },
              companyId: true,
              provider: true,
              accountName: true,
              accountNumber: true,
              verificationEmail: true,
            },
          });
          record = value ? dto(value) : null;
          break;
        }
        case "whatsapp_configuration": {
          const value = await db.customerWhatsAppNotification.findFirst({
            where: { id, deletedAt: null, company: { deletedAt: null } },
            select: {
              id: true,
              updatedAt: true,
              company: { select: { name: true } },
              companyId: true,
              customerId: true,
              isEnabled: true,
            },
          });
          record = value ? dto(value) : null;
          break;
        }
        case "vendor_tax": {
          const value = await db.vendorTaxProfile.findFirst({
            where: { id, deletedAt: null, vendor: { deletedAt: null } },
            select: {
              id: true,
              updatedAt: true,
              vendor: { select: { name: true } },
              vendorId: true,
              taxNumber: true,
              registeredName: true,
              address1: true,
              address2: true,
              city: true,
              postalCode: true,
            },
          });
          record = value ? dto(value) : null;
          break;
        }
      }
      if (!record) throw new IdentityError("NOT_FOUND", 404);
      return record;
    },
    async save(
      inputKind: unknown,
      inputId: unknown,
      input: unknown,
      inputVersion: unknown = undefined,
    ) {
      const kind = configurationKind.parse(inputKind);
      const id = inputId === null ? null : identityId.parse(inputId);
      const version =
        inputVersion === undefined
          ? undefined
          : z.coerce.date().parse(inputVersion);
      return mutate(
        kind,
        id === null ? "create" : "update",
        async (tx, current) => {
          let record: { id: number };
          switch (kind) {
            case "company_invoice": {
              const data = companyInvoiceSettingsInput.parse(input);
              if (
                !(await tx.company.findFirst({
                  where: { id: data.companyId, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "INVALID_PARENT",
                  400,
                  "Induk konfigurasi tidak tersedia.",
                );
              if (
                id !== null &&
                !(await tx.companyInvoiceSettings.findFirst({
                  where: { id, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.companyInvoiceSettings.findFirst({
                  where: { id, deletedAt: null, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Muat data terbaru sebelum mengedit kembali.",
                );
              record =
                id === null
                  ? await tx.companyInvoiceSettings.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.companyInvoiceSettings.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "company_bank": {
              const data = companyBankInput.parse(input);
              if (
                !(await tx.company.findFirst({
                  where: { id: data.companyId, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "INVALID_PARENT",
                  400,
                  "Induk konfigurasi tidak tersedia.",
                );
              if (
                id !== null &&
                !(await tx.companyBank.findFirst({
                  where: { id, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.companyBank.findFirst({
                  where: { id, deletedAt: null, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Muat data terbaru sebelum mengedit kembali.",
                );
              record =
                id === null
                  ? await tx.companyBank.create({ data, select: { id: true } })
                  : await tx.companyBank.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "company_wallet": {
              const data = companyDigitalWalletInput.parse(input);
              if (
                !(await tx.company.findFirst({
                  where: { id: data.companyId, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "INVALID_PARENT",
                  400,
                  "Induk konfigurasi tidak tersedia.",
                );
              if (
                id !== null &&
                !(await tx.companyDigitalWallet.findFirst({
                  where: { id, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.companyDigitalWallet.findFirst({
                  where: { id, deletedAt: null, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Muat data terbaru sebelum mengedit kembali.",
                );
              record =
                id === null
                  ? await tx.companyDigitalWallet.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.companyDigitalWallet.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "whatsapp_configuration": {
              const data = customerWhatsAppNotificationInput.parse(input);
              if (
                !(await tx.company.findFirst({
                  where: { id: data.companyId, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "INVALID_PARENT",
                  400,
                  "Induk konfigurasi tidak tersedia.",
                );
              if (
                data.customerId !== null &&
                !(await tx.customer.findFirst({
                  where: { id: data.customerId, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "INVALID_REFERENCE",
                  400,
                  "Customer tidak tersedia.",
                );
              if (
                id !== null &&
                !(await tx.customerWhatsAppNotification.findFirst({
                  where: { id, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.customerWhatsAppNotification.findFirst({
                  where: { id, deletedAt: null, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Muat data terbaru sebelum mengedit kembali.",
                );
              record =
                id === null
                  ? await tx.customerWhatsAppNotification.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.customerWhatsAppNotification.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "vendor_tax": {
              const data = vendorTaxProfileInput.parse(input);
              if (
                !(await tx.vendor.findFirst({
                  where: { id: data.vendorId, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "INVALID_PARENT",
                  400,
                  "Induk konfigurasi tidak tersedia.",
                );
              if (
                id !== null &&
                !(await tx.vendorTaxProfile.findFirst({
                  where: { id, deletedAt: null },
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.vendorTaxProfile.findFirst({
                  where: { id, deletedAt: null, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Muat data terbaru sebelum mengedit kembali.",
                );
              record =
                id === null
                  ? await tx.vendorTaxProfile.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.vendorTaxProfile.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
          }
          await tx.identityAuditEvent.create({
            data: {
              actorId: current.id,
              action:
                id === null ? "CONFIGURATION_CREATED" : "CONFIGURATION_UPDATED",
              subjectType: kind,
              subjectId: record.id,
            },
          });
          return record;
        },
      );
    },
    async remove(inputKind: unknown, inputId: unknown) {
      const kind = configurationKind.parse(inputKind);
      const id = identityId.parse(inputId);
      return mutate(kind, "delete", async (tx, current) => {
        let result: { count: number };
        const where = { id, deletedAt: null };
        const data = { deletedAt: new Date() };
        switch (kind) {
          case "company_invoice":
            result = await tx.companyInvoiceSettings.updateMany({
              where,
              data,
            });
            break;
          case "company_bank":
            result = await tx.companyBank.updateMany({ where, data });
            break;
          case "company_wallet":
            result = await tx.companyDigitalWallet.updateMany({ where, data });
            break;
          case "whatsapp_configuration":
            result = await tx.customerWhatsAppNotification.updateMany({
              where,
              data,
            });
            break;
          case "vendor_tax":
            result = await tx.vendorTaxProfile.updateMany({ where, data });
            break;
        }
        if (!result.count) throw new IdentityError("NOT_FOUND", 404);
        await tx.identityAuditEvent.create({
          data: {
            actorId: current.id,
            action: "CONFIGURATION_DELETED",
            subjectType: kind,
            subjectId: id,
          },
        });
        return { success: true };
      });
    },
    async choices(inputKind: unknown, inputType: unknown, input: unknown = {}) {
      const kind = configurationKind.parse(inputKind);
      const current = await actor(kind, "view");
      const type = z.enum(["company", "vendor", "customer"]).parse(inputType);
      if (
        type === "vendor"
          ? kind !== "vendor_tax"
          : type === "customer"
            ? kind !== "whatsapp_configuration"
            : kind === "vendor_tax"
      )
        throw new IdentityError("INVALID_REFERENCE", 400);
      const { page, pageSize, search } = listQuerySchema.parse(input);
      const common = {
        deletedAt: null,
        ...(search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {}),
      };
      const paging = {
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ name: "asc" as const }, { id: "asc" as const }],
        select: { id: true, name: true },
      };
      let items: { id: number; name: string }[];
      let total: number;
      if (type === "company") {
        const where = { ...common, ...companyScope(current) };
        [items, total] = await Promise.all([
          db.company.findMany({ where, ...paging }),
          db.company.count({ where }),
        ]);
      } else if (type === "vendor")
        [items, total] = await Promise.all([
          db.vendor.findMany({ where: common, ...paging }),
          db.vendor.count({ where: common }),
        ]);
      else {
        const where = {
          ...common,
          ...(!isAdministrator(current)
            ? { branchId: { in: current.branchIds } }
            : {}),
        };
        [items, total] = await Promise.all([
          db.customer.findMany({ where, ...paging }),
          db.customer.count({ where }),
        ]);
      }
      return {
        items,
        page,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
  };
}
