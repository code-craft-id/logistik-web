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
import { identityId, listQuerySchema } from "@/features/identity/validation";
import type { Prisma, PrismaClient } from "@/lib/db/generated/client";
import {
  costTypeInput,
  courierInput,
  deliveryServiceInput,
  districtInput,
  driverInput,
  goodsTypeInput,
  marketingPersonInput,
  masterKind,
  postalCodeInput,
  provinceInput,
  regencyInput,
  serviceCategoryInput,
  shipmentStatusInput,
  termInput,
  transportModeInput,
  truckingTypeInput,
  vehicleInput,
  vehicleTypeInput,
  vendorInput,
  vendorServiceInput,
  villageInput,
} from "../contracts";

const querySchema = listQuerySchema.extend({
  branchId: identityId.optional(),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});
export type MasterRow = {
  id: number;
  name: string;
  updatedAt: Date;
  [key: string]: unknown;
};
/** Dev 1 reference dictionaries/personnel/vehicles only. No DRAFT, financial, or operational models. */
function referenceName(value: unknown) {
  return value &&
    typeof value === "object" &&
    "name" in value &&
    typeof value.name === "string"
    ? value.name
    : undefined;
}
export function createMasterDataService(
  db: PrismaClient,
  resolveActor: () => Promise<AccessActor | null>,
) {
  async function actor(resource: string, action: string) {
    const current = await resolveActor();
    assertPermission(current, action, resource);
    return current;
  }
  async function mutate<T>(
    resource: string,
    action: string,
    work: (tx: Prisma.TransactionClient, current: AccessActor) => Promise<T>,
  ) {
    const initial = await actor(resource, action);
    return db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(71642, 1)`;
        if ((await resolveActor())?.id !== initial.id)
          throw new IdentityError("UNAUTHENTICATED", 401);
        const fresh = await loadAccessActor(tx, initial.id);
        assertPermission(fresh, action, resource);
        if (
          !["driver", "courier", "marketing_person", "vehicle"].includes(
            resource,
          ) &&
          !isAdministrator(fresh)
        )
          throw new IdentityError(
            "FORBIDDEN",
            403,
            "Data bersama memerlukan administrator.",
          );
        return work(tx, fresh);
      },
      { timeout: 15000 },
    );
  }
  async function reference(
    tx: Prisma.TransactionClient,
    type: string,
    id: number | null,
    current: AccessActor,
    allowInactive = false,
  ) {
    const activeStatus = allowInactive ? {} : { status: "ACTIVE" as const };
    if (id === null) {
      if (type === "branch" && !isAdministrator(current))
        throw new IdentityError(
          "FORBIDDEN_BRANCH",
          403,
          "Cabang wajib dipilih dari cakupan Anda.",
        );
      return;
    }
    let found: { id: number } | null = null;
    switch (type) {
      case "service_category":
        found = await tx.serviceCategory.findFirst({
          where: { id, ...activeStatus, deletedAt: null },
          select: { id: true },
        });
        break;
      case "transport_mode":
        found = await tx.transportMode.findFirst({
          where: { id, ...activeStatus, deletedAt: null },
          select: { id: true },
        });
        break;
      case "vendor":
        found = await tx.vendor.findFirst({
          where: { id, ...activeStatus, deletedAt: null },
          select: { id: true },
        });
        break;
      case "branch":
        found = await tx.branch.findFirst({
          where: {
            id,
            ...activeStatus,
            deletedAt: null,
            office: {
              ...activeStatus,
              deletedAt: null,
              company: { deletedAt: null },
            },
          },
          select: { id: true },
        });
        break;
      case "trucking_type":
        found = await tx.truckingType.findFirst({
          where: { id, ...activeStatus, deletedAt: null },
          select: { id: true },
        });
        break;
    }
    if (!found)
      throw new IdentityError(
        "INVALID_REFERENCE",
        400,
        "Pilihan terkait tidak tersedia atau tidak aktif.",
      );
    if (
      type === "branch" &&
      !isAdministrator(current) &&
      !current.branchIds.includes(id)
    )
      throw new IdentityError("FORBIDDEN_BRANCH", 403);
  }
  return {
    async list(inputKind: unknown, input: unknown = {}) {
      const kind = masterKind.parse(inputKind);
      const current = await actor(kind, "view");
      const { page, pageSize, search, status, branchId, sortDirection } =
        querySchema.parse(input);
      const common = {
        deletedAt: null,
        ...(search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {}),
        ...(status ? { status } : {}),
      };
      const scoped = {
        ...common,
        ...(isAdministrator(current)
          ? branchId
            ? { branchId }
            : {}
          : {
              branchId: {
                in:
                  branchId && current.branchIds.includes(branchId)
                    ? [branchId]
                    : branchId
                      ? []
                      : current.branchIds,
              },
            }),
      };
      const paging = {
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ name: sortDirection }, { id: sortDirection }],
      };
      let items: MasterRow[];
      let total: number;
      switch (kind) {
        case "service_category":
          [items, total] = await Promise.all([
            db.serviceCategory.findMany({
              where: common,
              ...paging,
              select: { id: true, name: true, updatedAt: true, status: true },
            }),
            db.serviceCategory.count({ where: common }),
          ]);
          break;
        case "vendor_service":
          [items, total] = await Promise.all([
            db.vendorService.findMany({
              where: common,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                vendorId: true,
                vendor: { select: { name: true } },
              },
            }),
            db.vendorService.count({ where: common }),
          ]);
          break;
        case "goods_type":
          [items, total] = await Promise.all([
            db.goodsType.findMany({
              where: common,
              ...paging,
              select: { id: true, name: true, updatedAt: true, status: true },
            }),
            db.goodsType.count({ where: common }),
          ]);
          break;
        case "cost_type":
          [items, total] = await Promise.all([
            db.costType.findMany({
              where: common,
              ...paging,
              select: { id: true, name: true, updatedAt: true, status: true },
            }),
            db.costType.count({ where: common }),
          ]);
          break;
        case "term":
          [items, total] = await Promise.all([
            db.term.findMany({
              where: common,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                description: true,
              },
            }),
            db.term.count({ where: common }),
          ]);
          break;
        case "vehicle_type":
          [items, total] = await Promise.all([
            db.vehicleType.findMany({
              where: common,
              ...paging,
              select: { id: true, name: true, updatedAt: true, status: true },
            }),
            db.vehicleType.count({ where: common }),
          ]);
          break;
        case "trucking_type":
          [items, total] = await Promise.all([
            db.truckingType.findMany({
              where: common,
              ...paging,
              select: { id: true, name: true, updatedAt: true, status: true },
            }),
            db.truckingType.count({ where: common }),
          ]);
          break;
        case "delivery_service":
          [items, total] = await Promise.all([
            db.deliveryService.findMany({
              where: common,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                serviceCategoryId: true,
                serviceCategory: { select: { name: true } },
                transportModeId: true,
                transportMode: { select: { name: true } },
              },
            }),
            db.deliveryService.count({ where: common }),
          ]);
          break;
        case "shipment_status":
          [items, total] = await Promise.all([
            db.shipmentStatus.findMany({
              where: common,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                code: true,
              },
            }),
            db.shipmentStatus.count({ where: common }),
          ]);
          break;
        case "vendor":
          [items, total] = await Promise.all([
            db.vendor.findMany({
              where: common,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                address1: true,
                address2: true,
                city: true,
                postalCode: true,
                phone: true,
                fax: true,
                email: true,
                contactName: true,
                branch: true,
              },
            }),
            db.vendor.count({ where: common }),
          ]);
          break;
        case "driver":
          [items, total] = await Promise.all([
            db.driver.findMany({
              where: scoped,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                address: true,
                phone: true,
                branchId: true,
                branch: { select: { name: true } },
              },
            }),
            db.driver.count({ where: scoped }),
          ]);
          break;
        case "courier":
          [items, total] = await Promise.all([
            db.courier.findMany({
              where: scoped,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                address: true,
                phone: true,
                branchId: true,
                branch: { select: { name: true } },
              },
            }),
            db.courier.count({ where: scoped }),
          ]);
          break;
        case "marketing_person":
          [items, total] = await Promise.all([
            db.marketingPerson.findMany({
              where: scoped,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                address: true,
                phone: true,
                branchId: true,
                branch: { select: { name: true } },
              },
            }),
            db.marketingPerson.count({ where: scoped }),
          ]);
          break;
        case "vehicle":
          [items, total] = await Promise.all([
            db.vehicle.findMany({
              where: scoped,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                truckingTypeId: true,
                truckingType: { select: { name: true } },
                year: true,
                licensePlate: true,
                registrationHolderName: true,
                registrationNumber: true,
                registrationDate: true,
                cylinderCapacity: true,
                color: true,
                insuranceName: true,
                insuranceExpiry: true,
                description: true,
                chassisNumber: true,
                engineNumber: true,
                serviceTrucking: true,
                branchId: true,
                branch: { select: { name: true } },
              },
            }),
            db.vehicle.count({ where: scoped }),
          ]);
          break;
        case "province":
          [items, total] = await Promise.all([
            db.province.findMany({
              where: common,
              ...paging,
              select: { id: true, name: true, updatedAt: true, status: true },
            }),
            db.province.count({ where: common }),
          ]);
          break;
        case "regency":
          [items, total] = await Promise.all([
            db.regency.findMany({
              where: common,
              ...paging,
              select: { id: true, name: true, updatedAt: true, status: true },
            }),
            db.regency.count({ where: common }),
          ]);
          break;
        case "district":
          [items, total] = await Promise.all([
            db.district.findMany({
              where: common,
              ...paging,
              select: { id: true, name: true, updatedAt: true, status: true },
            }),
            db.district.count({ where: common }),
          ]);
          break;
        case "village":
          [items, total] = await Promise.all([
            db.village.findMany({
              where: common,
              ...paging,
              select: { id: true, name: true, updatedAt: true, status: true },
            }),
            db.village.count({ where: common }),
          ]);
          break;
        case "postal_code": {
          const where = {
            deletedAt: null,
            ...(search
              ? { code: { contains: search, mode: "insensitive" as const } }
              : {}),
            ...(status ? { status } : {}),
          };
          [items, total] = await Promise.all([
            db.postalCode
              .findMany({
                where,
                ...paging,
                orderBy: [{ code: sortDirection }, { id: sortDirection }],
                select: { id: true, updatedAt: true, status: true, code: true },
              })
              .then((rows) => rows.map((row) => ({ ...row, name: row.code }))),
            db.postalCode.count({ where }),
          ]);
          break;
        }
        case "transport_mode":
          [items, total] = await Promise.all([
            db.transportMode.findMany({
              where: common,
              ...paging,
              select: {
                id: true,
                name: true,
                updatedAt: true,
                status: true,
                divider: true,
              },
            }),
            db.transportMode.count({ where: common }),
          ]);
          break;
      }
      return {
        items: items.map((item) => ({
          ...item,
          branchIdLabel: referenceName(item.branch),
          vendorIdLabel: referenceName(item.vendor),
          serviceCategoryIdLabel: referenceName(item.serviceCategory),
          transportModeIdLabel: referenceName(item.transportMode),
          truckingTypeIdLabel: referenceName(item.truckingType),
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
        globalWriter: isAdministrator(current),
      };
    },
    async detail(inputKind: unknown, inputId: unknown) {
      const kind = masterKind.parse(inputKind);
      const id = identityId.parse(inputId);
      const current = await actor(kind, "update");
      let record: MasterRow | null;
      const common = { id, deletedAt: null };
      const scoped = {
        ...common,
        ...(!isAdministrator(current)
          ? { branchId: { in: current.branchIds } }
          : {}),
      };
      switch (kind) {
        case "service_category":
          record = await db.serviceCategory.findFirst({
            where: common,
            select: { id: true, name: true, updatedAt: true, status: true },
          });
          break;
        case "vendor_service":
          record = await db.vendorService.findFirst({
            where: common,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              vendorId: true,
              vendor: { select: { name: true } },
            },
          });
          if (record)
            record = { ...record, vendorIdLabel: referenceName(record.vendor) };
          break;
        case "goods_type":
          record = await db.goodsType.findFirst({
            where: common,
            select: { id: true, name: true, updatedAt: true, status: true },
          });
          break;
        case "cost_type":
          record = await db.costType.findFirst({
            where: common,
            select: { id: true, name: true, updatedAt: true, status: true },
          });
          break;
        case "term":
          record = await db.term.findFirst({
            where: common,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              description: true,
            },
          });
          break;
        case "vehicle_type":
          record = await db.vehicleType.findFirst({
            where: common,
            select: { id: true, name: true, updatedAt: true, status: true },
          });
          break;
        case "trucking_type":
          record = await db.truckingType.findFirst({
            where: common,
            select: { id: true, name: true, updatedAt: true, status: true },
          });
          break;
        case "delivery_service":
          record = await db.deliveryService.findFirst({
            where: common,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              serviceCategoryId: true,
              transportModeId: true,
            },
          });
          break;
        case "shipment_status":
          record = await db.shipmentStatus.findFirst({
            where: common,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              code: true,
            },
          });
          break;
        case "vendor":
          record = await db.vendor.findFirst({
            where: common,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              address1: true,
              address2: true,
              city: true,
              postalCode: true,
              phone: true,
              fax: true,
              email: true,
              contactName: true,
              branch: true,
            },
          });
          break;
        case "driver":
          record = await db.driver.findFirst({
            where: scoped,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              address: true,
              nationalIdNumber: true,
              driverLicenseNumber: true,
              phone: true,
              branchId: true,
            },
          });
          break;
        case "courier":
          record = await db.courier.findFirst({
            where: scoped,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              address: true,
              nationalIdNumber: true,
              phone: true,
              branchId: true,
            },
          });
          break;
        case "marketing_person":
          record = await db.marketingPerson.findFirst({
            where: scoped,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              address: true,
              nationalIdNumber: true,
              phone: true,
              branchId: true,
            },
          });
          break;
        case "vehicle":
          record = await db.vehicle.findFirst({
            where: scoped,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              truckingTypeId: true,
              year: true,
              licensePlate: true,
              registrationHolderName: true,
              registrationNumber: true,
              registrationDate: true,
              cylinderCapacity: true,
              color: true,
              insuranceName: true,
              insuranceExpiry: true,
              description: true,
              chassisNumber: true,
              engineNumber: true,
              serviceTrucking: true,
              branchId: true,
            },
          });
          break;
        case "province":
          record = await db.province.findFirst({
            where: common,
            select: { id: true, name: true, updatedAt: true, status: true },
          });
          break;
        case "regency":
          record = await db.regency.findFirst({
            where: common,
            select: { id: true, name: true, updatedAt: true, status: true },
          });
          break;
        case "district":
          record = await db.district.findFirst({
            where: common,
            select: { id: true, name: true, updatedAt: true, status: true },
          });
          break;
        case "village":
          record = await db.village.findFirst({
            where: common,
            select: { id: true, name: true, updatedAt: true, status: true },
          });
          break;
        case "postal_code": {
          const value = await db.postalCode.findFirst({
            where: common,
            select: { id: true, updatedAt: true, status: true, code: true },
          });
          record = value ? { ...value, name: value.code } : null;
          break;
        }
        case "transport_mode":
          record = await db.transportMode.findFirst({
            where: common,
            select: {
              id: true,
              name: true,
              updatedAt: true,
              status: true,
              divider: true,
            },
          });
          break;
      }
      if (!record)
        throw new IdentityError("NOT_FOUND", 404, "Data tidak ditemukan.");
      return record;
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
      const kind = masterKind.parse(inputKind);
      const id = inputId === null ? null : identityId.parse(inputId);
      return mutate(
        kind,
        id === null ? "create" : "update",
        async (tx, current) => {
          let record: { id: number };
          const common = { id: id ?? -1, deletedAt: null };
          const scoped = {
            ...common,
            ...(!isAdministrator(current)
              ? { branchId: { in: current.branchIds } }
              : {}),
          };
          switch (kind) {
            case "service_category": {
              const data = serviceCategoryInput.parse(input);
              if (
                id !== null &&
                !(await tx.serviceCategory.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.serviceCategory.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.serviceCategory.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.serviceCategory.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "vendor_service": {
              const data = vendorServiceInput.parse(input);
              const previous =
                id === null
                  ? null
                  : await tx.vendorService.findFirst({ where: common });
              if (id !== null && !previous)
                throw new IdentityError("NOT_FOUND", 404);
              if (
                previous &&
                version &&
                previous.updatedAt.getTime() !== version.getTime()
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Muat data terbaru sebelum mengedit kembali.",
                );
              const maintaining =
                previous !== null &&
                !(previous.status === "INACTIVE" && data.status === "ACTIVE");
              await reference(
                tx,
                "vendor",
                data.vendorId,
                current,
                maintaining && previous?.vendorId === data.vendorId,
              );
              record =
                id === null
                  ? await tx.vendorService.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.vendorService.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "goods_type": {
              const data = goodsTypeInput.parse(input);
              if (
                id !== null &&
                !(await tx.goodsType.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.goodsType.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.goodsType.create({ data, select: { id: true } })
                  : await tx.goodsType.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "cost_type": {
              const data = costTypeInput.parse(input);
              if (
                id !== null &&
                !(await tx.costType.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.costType.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.costType.create({ data, select: { id: true } })
                  : await tx.costType.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "term": {
              const data = termInput.parse(input);
              if (
                id !== null &&
                !(await tx.term.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.term.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.term.create({ data, select: { id: true } })
                  : await tx.term.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "vehicle_type": {
              const data = vehicleTypeInput.parse(input);
              if (
                id !== null &&
                !(await tx.vehicleType.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.vehicleType.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.vehicleType.create({ data, select: { id: true } })
                  : await tx.vehicleType.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "trucking_type": {
              const data = truckingTypeInput.parse(input);
              if (
                id !== null &&
                !(await tx.truckingType.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.truckingType.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.truckingType.create({ data, select: { id: true } })
                  : await tx.truckingType.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "delivery_service": {
              const data = deliveryServiceInput.parse(input);
              const previous =
                id === null
                  ? null
                  : await tx.deliveryService.findFirst({
                      where: common,
                      select: {
                        status: true,
                        serviceCategoryId: true,
                        transportModeId: true,
                      },
                    });
              const maintaining =
                previous !== null &&
                !(previous.status === "INACTIVE" && data.status === "ACTIVE");
              if (
                id !== null &&
                !(await tx.deliveryService.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.deliveryService.findFirst({
                  where: { ...common, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Tutup formulir dan muat data terbaru sebelum mengedit kembali.",
                );
              await reference(
                tx,
                "service_category",
                data.serviceCategoryId,
                current,
                maintaining &&
                  previous?.serviceCategoryId === data.serviceCategoryId,
              );
              await reference(
                tx,
                "transport_mode",
                data.transportModeId,
                current,
                maintaining &&
                  previous?.transportModeId === data.transportModeId,
              );
              record =
                id === null
                  ? await tx.deliveryService.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.deliveryService.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "shipment_status": {
              const data = shipmentStatusInput.parse(input);
              if (
                id !== null &&
                !(await tx.shipmentStatus.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.shipmentStatus.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.shipmentStatus.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.shipmentStatus.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "vendor": {
              const data = vendorInput.parse(input);
              if (
                id !== null &&
                !(await tx.vendor.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.vendor.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.vendor.create({ data, select: { id: true } })
                  : await tx.vendor.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "driver": {
              const data = driverInput.parse(input);
              const previous =
                id === null
                  ? null
                  : await tx.driver.findFirst({
                      where: scoped,
                      select: { status: true, branchId: true },
                    });
              const maintaining =
                previous !== null &&
                !(previous.status === "INACTIVE" && data.status === "ACTIVE");
              if (
                id !== null &&
                !(await tx.driver.findFirst({
                  where: scoped,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.driver.findFirst({
                  where: { ...scoped, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Tutup formulir dan muat data terbaru sebelum mengedit kembali.",
                );
              await reference(
                tx,
                "branch",
                data.branchId,
                current,
                maintaining && previous?.branchId === data.branchId,
              );
              record =
                id === null
                  ? await tx.driver.create({ data, select: { id: true } })
                  : await tx.driver.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "courier": {
              const data = courierInput.parse(input);
              const previous =
                id === null
                  ? null
                  : await tx.courier.findFirst({
                      where: scoped,
                      select: { status: true, branchId: true },
                    });
              const maintaining =
                previous !== null &&
                !(previous.status === "INACTIVE" && data.status === "ACTIVE");
              if (
                id !== null &&
                !(await tx.courier.findFirst({
                  where: scoped,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.courier.findFirst({
                  where: { ...scoped, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Tutup formulir dan muat data terbaru sebelum mengedit kembali.",
                );
              await reference(
                tx,
                "branch",
                data.branchId,
                current,
                maintaining && previous?.branchId === data.branchId,
              );
              record =
                id === null
                  ? await tx.courier.create({ data, select: { id: true } })
                  : await tx.courier.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "marketing_person": {
              const data = marketingPersonInput.parse(input);
              const previous =
                id === null
                  ? null
                  : await tx.marketingPerson.findFirst({
                      where: scoped,
                      select: { status: true, branchId: true },
                    });
              const maintaining =
                previous !== null &&
                !(previous.status === "INACTIVE" && data.status === "ACTIVE");
              if (
                id !== null &&
                !(await tx.marketingPerson.findFirst({
                  where: scoped,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.marketingPerson.findFirst({
                  where: { ...scoped, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Tutup formulir dan muat data terbaru sebelum mengedit kembali.",
                );
              await reference(
                tx,
                "branch",
                data.branchId,
                current,
                maintaining && previous?.branchId === data.branchId,
              );
              record =
                id === null
                  ? await tx.marketingPerson.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.marketingPerson.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "vehicle": {
              const data = vehicleInput.parse(input);
              const previous =
                id === null
                  ? null
                  : await tx.vehicle.findFirst({
                      where: scoped,
                      select: {
                        status: true,
                        branchId: true,
                        truckingTypeId: true,
                      },
                    });
              const maintaining =
                previous !== null &&
                !(previous.status === "INACTIVE" && data.status === "ACTIVE");
              if (
                id !== null &&
                !(await tx.vehicle.findFirst({
                  where: scoped,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.vehicle.findFirst({
                  where: { ...scoped, updatedAt: version },
                  select: { id: true },
                }))
              )
                throw new IdentityError(
                  "CONFLICT",
                  409,
                  "Data telah berubah. Tutup formulir dan muat data terbaru sebelum mengedit kembali.",
                );
              await reference(
                tx,
                "trucking_type",
                data.truckingTypeId,
                current,
                maintaining && previous?.truckingTypeId === data.truckingTypeId,
              );
              await reference(
                tx,
                "branch",
                data.branchId,
                current,
                maintaining && previous?.branchId === data.branchId,
              );
              record =
                id === null
                  ? await tx.vehicle.create({ data, select: { id: true } })
                  : await tx.vehicle.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "province": {
              const data = provinceInput.parse(input);
              if (
                id !== null &&
                !(await tx.province.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.province.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.province.create({ data, select: { id: true } })
                  : await tx.province.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "regency": {
              const data = regencyInput.parse(input);
              if (
                id !== null &&
                !(await tx.regency.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.regency.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.regency.create({ data, select: { id: true } })
                  : await tx.regency.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "district": {
              const data = districtInput.parse(input);
              if (
                id !== null &&
                !(await tx.district.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.district.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.district.create({ data, select: { id: true } })
                  : await tx.district.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "village": {
              const data = villageInput.parse(input);
              if (
                id !== null &&
                !(await tx.village.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.village.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.village.create({ data, select: { id: true } })
                  : await tx.village.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "postal_code": {
              const data = postalCodeInput.parse(input);
              if (
                id !== null &&
                !(await tx.postalCode.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.postalCode.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.postalCode.create({ data, select: { id: true } })
                  : await tx.postalCode.update({
                      where: { id },
                      data,
                      select: { id: true },
                    });
              break;
            }
            case "transport_mode": {
              const data = transportModeInput.parse(input);
              if (
                id !== null &&
                !(await tx.transportMode.findFirst({
                  where: common,
                  select: { id: true },
                }))
              )
                throw new IdentityError("NOT_FOUND", 404);
              if (
                id !== null &&
                version &&
                !(await tx.transportMode.findFirst({
                  where: { ...common, updatedAt: version },
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
                  ? await tx.transportMode.create({
                      data,
                      select: { id: true },
                    })
                  : await tx.transportMode.update({
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
      const kind = masterKind.parse(inputKind);
      const id = identityId.parse(inputId);
      return mutate(kind, "delete", async (tx, current) => {
        const common = { id, deletedAt: null };
        const scoped = {
          ...common,
          ...(!isAdministrator(current)
            ? { branchId: { in: current.branchIds } }
            : {}),
        };
        const data = { deletedAt: new Date() };
        let result: { count: number };
        if (
          kind === "vendor" &&
          (await tx.vendorTaxProfile.count({
            where: { vendorId: id, deletedAt: null },
          }))
        )
          throw new IdentityError(
            "IN_USE",
            409,
            "Vendor masih mempunyai konfigurasi NPWP aktif.",
          );
        if (
          kind === "vendor" &&
          (await tx.vendorService.count({
            where: { vendorId: id, deletedAt: null },
          }))
        )
          throw new IdentityError(
            "IN_USE",
            409,
            "Vendor masih mempunyai layanan aktif.",
          );
        if (
          kind === "service_category" &&
          (await tx.deliveryService.count({
            where: { serviceCategoryId: id, deletedAt: null },
          }))
        )
          throw new IdentityError("IN_USE", 409);
        if (
          kind === "transport_mode" &&
          (await tx.deliveryService.count({
            where: { transportModeId: id, deletedAt: null },
          }))
        )
          throw new IdentityError("IN_USE", 409);
        if (
          kind === "trucking_type" &&
          (await tx.vehicle.count({
            where: { truckingTypeId: id, deletedAt: null },
          }))
        )
          throw new IdentityError("IN_USE", 409);
        if (
          kind === "marketing_person" &&
          (await tx.customer.count({
            where: { marketingPersonId: id, deletedAt: null },
          }))
        )
          throw new IdentityError(
            "IN_USE",
            409,
            "Marketing masih digunakan oleh pelanggan.",
          );
        switch (kind) {
          case "service_category":
            result = await tx.serviceCategory.updateMany({
              where: common,
              data,
            });
            break;
          case "vendor_service":
            result = await tx.vendorService.updateMany({ where: common, data });
            break;
          case "goods_type":
            result = await tx.goodsType.updateMany({ where: common, data });
            break;
          case "cost_type":
            result = await tx.costType.updateMany({ where: common, data });
            break;
          case "term":
            result = await tx.term.updateMany({ where: common, data });
            break;
          case "vehicle_type":
            result = await tx.vehicleType.updateMany({ where: common, data });
            break;
          case "trucking_type":
            result = await tx.truckingType.updateMany({ where: common, data });
            break;
          case "delivery_service":
            result = await tx.deliveryService.updateMany({
              where: common,
              data,
            });
            break;
          case "shipment_status":
            result = await tx.shipmentStatus.updateMany({
              where: common,
              data,
            });
            break;
          case "vendor":
            result = await tx.vendor.updateMany({ where: common, data });
            break;
          case "driver":
            result = await tx.driver.updateMany({ where: scoped, data });
            break;
          case "courier":
            result = await tx.courier.updateMany({ where: scoped, data });
            break;
          case "marketing_person":
            result = await tx.marketingPerson.updateMany({
              where: scoped,
              data,
            });
            break;
          case "vehicle":
            result = await tx.vehicle.updateMany({ where: scoped, data });
            break;
          case "province":
            result = await tx.province.updateMany({ where: common, data });
            break;
          case "regency":
            result = await tx.regency.updateMany({ where: common, data });
            break;
          case "district":
            result = await tx.district.updateMany({ where: common, data });
            break;
          case "village":
            result = await tx.village.updateMany({ where: common, data });
            break;
          case "postal_code":
            result = await tx.postalCode.updateMany({ where: common, data });
            break;
          case "transport_mode":
            result = await tx.transportMode.updateMany({ where: common, data });
            break;
        }
        if (!result.count) throw new IdentityError("NOT_FOUND", 404);
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
    async choices(inputKind: unknown, inputType: unknown, input: unknown = {}) {
      const kind = masterKind.parse(inputKind);
      const current = await actor(kind, "view");
      const type = z
        .enum([
          "branch",
          "service_category",
          "transport_mode",
          "trucking_type",
          "vendor",
        ])
        .parse(inputType);
      const allowed: Record<string, string[]> = {
        vendor_service: ["vendor"],
        delivery_service: ["service_category", "transport_mode"],
        driver: ["branch"],
        courier: ["branch"],
        marketing_person: ["branch"],
        vehicle: ["branch", "trucking_type"],
      };
      if (!allowed[kind]?.includes(type))
        throw new IdentityError("INVALID_REFERENCE", 400);
      const { search, page, pageSize } = listQuerySchema.parse(input);
      const where = {
        deletedAt: null,
        status: "ACTIVE" as const,
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
      switch (type) {
        case "vendor":
          [items, total] = await Promise.all([
            db.vendor.findMany({ where, ...paging }),
            db.vendor.count({ where }),
          ]);
          break;
        case "service_category":
          [items, total] = await Promise.all([
            db.serviceCategory.findMany({ where, ...paging }),
            db.serviceCategory.count({ where }),
          ]);
          break;
        case "transport_mode":
          [items, total] = await Promise.all([
            db.transportMode.findMany({ where, ...paging }),
            db.transportMode.count({ where }),
          ]);
          break;
        case "branch": {
          const scoped = {
            ...where,
            ...(!isAdministrator(current)
              ? { id: { in: current.branchIds } }
              : {}),
            office: {
              status: "ACTIVE" as const,
              deletedAt: null,
              company: { deletedAt: null },
            },
          };
          [items, total] = await Promise.all([
            db.branch.findMany({ where: scoped, ...paging }),
            db.branch.count({ where: scoped }),
          ]);
          break;
        }
        case "trucking_type":
          [items, total] = await Promise.all([
            db.truckingType.findMany({ where, ...paging }),
            db.truckingType.count({ where }),
          ]);
          break;
      }
      return {
        items,
        page,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
  };
}
