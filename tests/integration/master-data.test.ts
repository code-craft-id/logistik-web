import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadAccessActor } from "../../src/features/identity/server/access";
import {
  type MasterKind,
  masterForms,
  masterKinds,
} from "../../src/features/master-data/contracts";
import { createMasterDataService } from "../../src/features/master-data/server/service";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: testDatabaseUrl(
      process.env.TEST_DATABASE_URL,
      process.env.DATABASE_URL,
    ),
  }),
});
const tag = randomUUID().slice(0, 8);
const users: number[] = [],
  groups: number[] = [],
  branches: number[] = [];
const records: { kind: MasterKind; id: number }[] = [];
let companyId: number, officeId: number, adminId: number, operatorId: number;
const service = (id: number) =>
  createMasterDataService(db, () => loadAccessActor(db, id));
function input(kind: MasterKind): Record<string, unknown> {
  return {
    ...Object.fromEntries(
      masterForms[kind].fields.map((field) => [
        field.key,
        field.key === "name"
          ? `FAKE MASTER ${tag} ${kind}`
          : field.type === "boolean"
            ? false
            : field.type === "date" || field.type === "choice"
              ? null
              : field.type === "integer"
                ? 2026
                : field.type === "email"
                  ? `${tag}@example.invalid`
                  : kind === "postal_code"
                    ? `F${tag}`
                    : "INVALID-FAKE",
      ]),
    ),
    status: "ACTIVE",
  };
}
beforeAll(async () => {
  const company = await db.company.create({
    data: {
      name: `FAKE ${tag}`,
      isDepositAgent: false,
      showPriceOnPrint: false,
    },
  });
  companyId = company.id;
  const office = await db.office.create({
    data: { companyId, code: tag, name: `FAKE ${tag}`, status: "ACTIVE" },
  });
  officeId = office.id;
  for (let i = 0; i < 2; i++)
    branches.push(
      (
        await db.branch.create({
          data: {
            officeId,
            code: `FAKE${i}`,
            name: `FAKE ${tag} ${i}`,
            status: "ACTIVE",
          },
        })
      ).id,
    );
  const admin = await db.userGroup.create({
    data: {
      name: `FAKE MASTER ADMIN ${tag}`,
      permissions: { create: { resource: "system_admin", action: "manage" } },
    },
  });
  groups.push(admin.id);
  const operator = await db.userGroup.create({
    data: {
      name: `FAKE MASTER OP ${tag}`,
      permissions: {
        create: [
          "driver",
          "courier",
          "marketing_person",
          "vehicle",
          "service_category",
        ].flatMap((resource) =>
          ["view", "create", "update", "delete"].map((action) => ({
            resource,
            action,
          })),
        ),
      },
    },
  });
  groups.push(operator.id);
  for (const groupId of groups)
    users.push(
      (
        await db.user.create({
          data: {
            name: "FAKE Master test",
            email: `${randomUUID()}@example.invalid`,
            groupId,
          },
        })
      ).id,
    );
  [adminId, operatorId] = users;
  await db.userAllowedBranch.create({
    data: { userId: operatorId, branchId: branches[0] },
  });
});
afterAll(async () => {
  // Only exact records created by this file; preserve unrelated fixtures and history.
  const ids = (kind: MasterKind) =>
    records.filter((record) => record.kind === kind).map((record) => record.id);
  await db.identityAuditEvent.deleteMany({ where: { actorId: { in: users } } });
  await db.deliveryService.deleteMany({
    where: { id: { in: ids("delivery_service") } },
  });
  await db.vehicle.deleteMany({ where: { id: { in: ids("vehicle") } } });
  await db.driver.deleteMany({ where: { id: { in: ids("driver") } } });
  await db.marketingPerson.deleteMany({
    where: { id: { in: ids("marketing_person") } },
  });
  await db.courier.deleteMany({ where: { id: { in: ids("courier") } } });
  await db.vendorService.deleteMany({
    where: { id: { in: ids("vendor_service") } },
  });
  await db.vendor.deleteMany({ where: { id: { in: ids("vendor") } } });
  await db.serviceCategory.deleteMany({
    where: { id: { in: ids("service_category") } },
  });
  await db.goodsType.deleteMany({ where: { id: { in: ids("goods_type") } } });
  await db.costType.deleteMany({ where: { id: { in: ids("cost_type") } } });
  await db.term.deleteMany({ where: { id: { in: ids("term") } } });
  await db.vehicleType.deleteMany({
    where: { id: { in: ids("vehicle_type") } },
  });
  await db.truckingType.deleteMany({
    where: { id: { in: ids("trucking_type") } },
  });
  await db.shipmentStatus.deleteMany({
    where: { id: { in: ids("shipment_status") } },
  });
  await db.province.deleteMany({ where: { id: { in: ids("province") } } });
  await db.regency.deleteMany({ where: { id: { in: ids("regency") } } });
  await db.district.deleteMany({ where: { id: { in: ids("district") } } });
  await db.village.deleteMany({ where: { id: { in: ids("village") } } });
  await db.postalCode.deleteMany({ where: { id: { in: ids("postal_code") } } });
  await db.transportMode.deleteMany({
    where: { id: { in: ids("transport_mode") } },
  });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  await db.branch.deleteMany({ where: { id: { in: branches } } });
  if (officeId) await db.office.delete({ where: { id: officeId } });
  if (companyId) await db.company.delete({ where: { id: companyId } });
  await db.$disconnect();
});
describe("Dev 1 persisted reference data", () => {
  it("paginates and sorts in the database with bounded, validated ordering", async () => {
    const prefix = `FAKE SORT ${tag}`;
    const ids: number[] = [];
    for (const suffix of ["A", "B"]) {
      const created = await service(adminId).save("goods_type", null, {
        name: `${prefix} ${suffix}`,
        status: "ACTIVE",
      });
      records.push({ kind: "goods_type", id: created.id });
      ids.push(created.id);
    }
    const first = await service(adminId).list("goods_type", {
      search: prefix,
      pageSize: 1,
      sortDirection: "asc",
    });
    expect(first.items.map((row) => row.id)).toEqual([ids[0]]);
    expect(first.pagination).toMatchObject({ total: 2, totalPages: 2 });
    expect(
      (
        await service(adminId).list("goods_type", {
          search: prefix,
          pageSize: 1,
          sortDirection: "desc",
        })
      ).items.map((row) => row.id),
    ).toEqual([ids[1]]);
    expect(
      (
        await service(adminId).list("goods_type", {
          search: prefix,
          pageSize: 1,
          page: 2,
        })
      ).items.map((row) => row.id),
    ).toEqual([ids[1]]);
    await expect(
      service(adminId).list("goods_type", { sortDirection: "unsupported" }),
    ).rejects.toThrow();
  });
  it.each(
    masterKinds,
  )("creates, filters, edits and soft deletes %s with transactional audit", async (kind) => {
    const data = input(kind);
    if (kind === "vendor_service") {
      const vendor = await service(adminId).save(
        "vendor",
        null,
        input("vendor"),
      );
      records.push({ kind: "vendor", id: vendor.id });
      data.vendorId = vendor.id;
    }
    const created = await service(adminId).save(kind, null, data);
    records.push({ kind, id: created.id });
    const found = await service(adminId).list(kind, {
      search: String(data.name ?? data.code),
      pageSize: 1,
    });
    expect(found.items.map((row) => row.id)).toEqual([created.id]);
    expect(found.pagination.total).toBe(1);
    expect(JSON.stringify(found.items)).not.toMatch(
      /nationalIdNumber|driverLicenseNumber/,
    );
    const detail = await service(adminId).detail(kind, created.id);
    expect(detail.name).toBe(data.name ?? data.code);
    await service(adminId).save(kind, created.id, {
      ...data,
      status: "INACTIVE",
    });
    await expect(
      service(adminId).save(kind, created.id, data, detail.updatedAt),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
    expect(
      (
        await service(adminId).list(kind, {
          search: String(data.name ?? data.code),
          status: "ACTIVE",
        })
      ).items,
    ).toHaveLength(0);
    await service(adminId).remove(kind, created.id);
    expect(
      (
        await service(adminId).list(kind, {
          search: String(data.name ?? data.code),
        })
      ).items,
    ).toHaveLength(0);
    await expect(
      service(adminId).detail(kind, created.id),
    ).rejects.toMatchObject({ status: 404 });
    const audits = await db.identityAuditEvent.findMany({
      where: { actorId: adminId, subjectType: kind, subjectId: created.id },
    });
    expect(audits).toHaveLength(3);
    expect(JSON.stringify(audits)).not.toContain("INVALID-FAKE");
  });
  it.each([
    "driver",
    "marketing_person",
  ] as const)("enforces %s branch scope for create/list/detail/update/delete and choice options", async (kind) => {
    const data: Record<string, unknown> = {
      ...input(kind),
      branchId: branches[0],
    };
    const created = await service(operatorId).save(kind, null, data);
    records.push({ kind: kind, id: created.id });
    const outside = await service(adminId).save(kind, null, {
      ...data,
      branchId: branches[1],
    });
    records.push({ kind: kind, id: outside.id });
    expect(
      (
        await service(operatorId).list(kind, {
          search: String(data.name ?? data.code),
        })
      ).items.map((row) => row.id),
    ).toEqual([created.id]);
    await expect(
      service(operatorId).detail(kind, outside.id),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      service(operatorId).save(kind, created.id, {
        ...data,
        branchId: branches[1],
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service(operatorId).save(kind, null, { ...data, branchId: null }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service(operatorId).remove(kind, outside.id),
    ).rejects.toMatchObject({ status: 404 });
    const choices = await service(operatorId).choices(kind, "branch", {});
    expect(choices.items.map((row) => row.id)).toEqual([branches[0]]);
    await expect(
      service(operatorId).save(
        "service_category",
        null,
        input("service_category"),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("validates vendor service references and prevents deleting referenced vendors", async () => {
    const vendor = await service(adminId).save("vendor", null, input("vendor"));
    records.push({ kind: "vendor", id: vendor.id });
    const data = {
      name: `FAKE SERVICE ${tag}`,
      vendorId: vendor.id,
      status: "ACTIVE",
    };
    const created = await service(adminId).save("vendor_service", null, data);
    records.push({ kind: "vendor_service", id: created.id });
    expect(
      (await service(adminId).list("vendor_service", { search: data.name }))
        .items[0].vendorIdLabel,
    ).toBe(input("vendor").name);
    await expect(
      service(adminId).remove("vendor", vendor.id),
    ).rejects.toMatchObject({ code: "IN_USE" });
    await expect(
      service(operatorId).list("vendor_service"),
    ).rejects.toMatchObject({ status: 403 });
    await db.vendor.update({
      where: { id: vendor.id },
      data: { status: "INACTIVE" },
    });
    await service(adminId).save("vendor_service", created.id, {
      ...data,
      name: `${data.name} maintained`,
    });
    await expect(
      service(adminId).save("vendor_service", null, data),
    ).rejects.toMatchObject({ code: "INVALID_REFERENCE" });
    await service(adminId).save("vendor_service", created.id, {
      ...data,
      status: "INACTIVE",
    });
    await expect(
      service(adminId).save("vendor_service", created.id, data),
    ).rejects.toMatchObject({ code: "INVALID_REFERENCE" });
    await expect(
      service(adminId).save("vendor_service", null, {
        ...data,
        vendorId: null,
      }),
    ).rejects.toThrow();
    await service(adminId).remove("vendor_service", created.id);
    await service(adminId).remove("vendor", vendor.id);
  });
  it("preserves marketing references held by customer records", async () => {
    const person = await service(adminId).save(
      "marketing_person",
      null,
      input("marketing_person"),
    );
    records.push({ kind: "marketing_person", id: person.id });
    const customer = await db.customer.create({
      data: { name: `FAKE ${tag}`, marketingPersonId: person.id },
    });
    try {
      await expect(
        service(adminId).remove("marketing_person", person.id),
      ).rejects.toMatchObject({ code: "IN_USE" });
    } finally {
      await db.customer.delete({ where: { id: customer.id } });
    }
    await service(adminId).remove("marketing_person", person.id);
  });
  it("rejects inactive related records and unknown fields, preserving existing data and audit", async () => {
    const category = await db.serviceCategory.create({
      data: { name: `FAKE ${tag}`, status: "INACTIVE" },
    });
    records.push({ kind: "service_category", id: category.id });
    const audits = await db.identityAuditEvent.count({
      where: { actorId: adminId },
    });
    await expect(
      service(adminId).save("delivery_service", null, {
        ...input("delivery_service"),
        serviceCategoryId: category.id,
      }),
    ).rejects.toMatchObject({ code: "INVALID_REFERENCE" });
    await expect(
      service(adminId).save("vendor", null, {
        ...input("vendor"),
        accounting: {},
      }),
    ).rejects.toThrow();
    expect(
      await db.identityAuditEvent.count({ where: { actorId: adminId } }),
    ).toBe(audits);
    await expect(service(operatorId).list("vendor", {})).rejects.toMatchObject({
      status: 403,
    });
  });
  it.each([
    "driver",
    "courier",
    "marketing_person",
    "vehicle",
    "delivery_service",
  ] as const)("maintains %s under inactive references but blocks new links and reactivation", async (kind) => {
    const data = {
      ...input(kind),
      ...(kind === "delivery_service" ? {} : { branchId: branches[0] }),
    };
    let referenceId: number | undefined;
    if (kind === "delivery_service" || kind === "vehicle") {
      const parentKind =
        kind === "delivery_service" ? "service_category" : "trucking_type";
      const parent = await service(adminId).save(
        parentKind,
        null,
        input(parentKind),
      );
      records.push({ kind: parentKind, id: parent.id });
      referenceId = parent.id;
      Object.assign(
        data,
        kind === "delivery_service"
          ? { serviceCategoryId: parent.id }
          : { truckingTypeId: parent.id },
      );
    }
    const created = await service(adminId).save(kind, null, data);
    records.push({ kind, id: created.id });
    const setStatus = async (status: "ACTIVE" | "INACTIVE") => {
      if (kind === "delivery_service")
        await db.serviceCategory.update({
          where: { id: referenceId },
          data: { status },
        });
      else if (kind === "vehicle")
        await db.truckingType.update({
          where: { id: referenceId },
          data: { status },
        });
      else
        await db.office.update({ where: { id: officeId }, data: { status } });
    };
    await setStatus("INACTIVE");
    try {
      await service(adminId).save(kind, created.id, {
        ...data,
        name: `FAKE ${tag} maintained ${kind}`,
      });
      await expect(
        service(adminId).save(kind, null, data),
      ).rejects.toMatchObject({ code: "INVALID_REFERENCE" });
      await service(adminId).save(kind, created.id, {
        ...data,
        status: "INACTIVE",
      });
      await expect(
        service(adminId).save(kind, created.id, data),
      ).rejects.toMatchObject({ code: "INVALID_REFERENCE" });
    } finally {
      await setStatus("ACTIVE");
    }
  });
});
