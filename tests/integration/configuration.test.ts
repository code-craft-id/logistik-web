import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { createConfigurationService } from "../../src/features/organization/server/settings-service";
import {
  type ConfigurationKind,
  configurationForms,
  configurationKind,
} from "../../src/features/organization/settings-contracts";
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
  records: { kind: ConfigurationKind; id: number }[] = [];
let companyId: number,
  vendorId: number,
  customerId: number,
  adminId: number,
  readerId: number;
const service = (id: number) =>
  createConfigurationService(db, () => loadAccessActor(db, id));
function input(kind: ConfigurationKind): Record<string, unknown> {
  return Object.fromEntries(
    configurationForms[kind].fields.map((field) => [
      field.key,
      field.choice === "company"
        ? companyId
        : field.choice === "vendor"
          ? vendorId
          : field.choice === "customer"
            ? customerId
            : field.type === "boolean"
              ? true
              : field.type === "email"
                ? `${tag}@example.invalid`
                : `INVALID-${tag}`,
    ]),
  );
}
beforeAll(async () => {
  companyId = (
    await db.company.create({
      data: {
        name: `FAKE CONFIG ${tag}`,
        isDepositAgent: false,
        showPriceOnPrint: false,
      },
    })
  ).id;
  vendorId = (
    await db.vendor.create({
      data: {
        name: `FAKE CONFIG ${tag}`,
        address1: "",
        address2: "",
        city: "",
        postalCode: "",
        phone: "",
        fax: "",
        email: "",
        contactName: "",
        branch: "",
      },
    })
  ).id;
  customerId = (
    await db.customer.create({ data: { name: `FAKE CONFIG ${tag}` } })
  ).id;
  groups.push(
    (
      await db.userGroup.create({
        data: {
          name: `FAKE CONFIG ADMIN ${tag}`,
          permissions: {
            create: { resource: "system_admin", action: "manage" },
          },
        },
      })
    ).id,
  );
  groups.push(
    (
      await db.userGroup.create({
        data: {
          name: `FAKE CONFIG READER ${tag}`,
          permissions: {
            create: configurationKind.options.flatMap((resource) =>
              ["view", "create", "update", "delete"].map((action) => ({
                resource,
                action,
              })),
            ),
          },
        },
      })
    ).id,
  );
  for (const groupId of groups)
    users.push(
      (
        await db.user.create({
          data: {
            name: "FAKE Config test",
            email: `${randomUUID()}@example.invalid`,
            groupId,
          },
        })
      ).id,
    );
  [adminId, readerId] = users;
});
afterAll(async () => {
  const ids = (kind: ConfigurationKind) =>
    records.filter((record) => record.kind === kind).map((record) => record.id);
  await db.identityAuditEvent.deleteMany({ where: { actorId: { in: users } } });
  await db.companyInvoiceSettings.deleteMany({
    where: { id: { in: ids("company_invoice") } },
  });
  await db.companyBank.deleteMany({
    where: { id: { in: ids("company_bank") } },
  });
  await db.companyDigitalWallet.deleteMany({
    where: { id: { in: ids("company_wallet") } },
  });
  await db.customerWhatsAppNotification.deleteMany({
    where: { id: { in: ids("whatsapp_configuration") } },
  });
  await db.vendorTaxProfile.deleteMany({
    where: { id: { in: ids("vendor_tax") } },
  });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  if (customerId) await db.customer.delete({ where: { id: customerId } });
  if (vendorId) await db.vendor.delete({ where: { id: vendorId } });
  if (companyId) await db.company.delete({ where: { id: companyId } });
  await db.$disconnect();
});
describe("Dev 1 company/vendor configuration storage", () => {
  it.each(
    configurationKind.options,
  )("maintains %s without financial or external side effects", async (kind) => {
    const data = input(kind);
    const created = await service(adminId).save(kind, null, data);
    records.push({ kind, id: created.id });
    const page = await service(adminId).list(kind, {
      search: `FAKE CONFIG ${tag}`,
    });
    expect(page.items.map((row) => row.id)).toEqual([created.id]);
    if (kind !== "vendor_tax") {
      expect(
        (await service(adminId).list(kind, { companyId })).items.map(
          (row) => row.id,
        ),
      ).toContain(created.id);
      expect(
        (await service(adminId).list(kind, { companyId: 2147483647 })).items,
      ).toEqual([]);
      expect((await service(readerId).list(kind, { companyId })).items).toEqual(
        [],
      );
    }
    expect(JSON.stringify(page.items)).not.toMatch(/accountNumber|taxNumber/);
    const detail = await service(adminId).detail(kind, created.id);
    await service(adminId).save(kind, created.id, data, detail.updatedAt);
    await expect(
      service(adminId).save(kind, created.id, data, detail.updatedAt),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await service(adminId).remove(kind, created.id);
    expect(
      (await service(adminId).list(kind, { search: `FAKE CONFIG ${tag}` }))
        .items,
    ).toHaveLength(0);
    await expect(
      service(adminId).detail(kind, created.id),
    ).rejects.toMatchObject({ status: 404 });
    const audits = await db.identityAuditEvent.findMany({
      where: { actorId: adminId, subjectType: kind, subjectId: created.id },
    });
    expect(audits).toHaveLength(3);
    expect(JSON.stringify(audits)).not.toContain(`INVALID-${tag}`);
  });
  it("denies shared writes and unassigned company lists despite action grants", async () => {
    await expect(
      service(readerId).save("company_bank", null, input("company_bank")),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (await service(readerId).list("company_bank", {})).items,
    ).toHaveLength(0);
    expect(
      (await service(readerId).choices("company_bank", "company", {})).items,
    ).toHaveLength(0);
    await expect(
      service(readerId).list("vendor_tax", {}),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("rejects unsupported templates and invalid foreign keys with no partial configuration/audit", async () => {
    const before = await db.customerWhatsAppNotification.count();
    const audits = await db.identityAuditEvent.count({
      where: { actorId: adminId },
    });
    await expect(
      service(adminId).save("whatsapp_configuration", null, {
        ...input("whatsapp_configuration"),
        messageTemplates: {},
      }),
    ).rejects.toThrow();
    await expect(
      service(adminId).save("whatsapp_configuration", null, {
        ...input("whatsapp_configuration"),
        customerId: 2147483647,
      }),
    ).rejects.toMatchObject({ code: "INVALID_REFERENCE" });
    expect(await db.customerWhatsAppNotification.count()).toBe(before);
    expect(
      await db.identityAuditEvent.count({ where: { actorId: adminId } }),
    ).toBe(audits);
  });
});
