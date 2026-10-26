import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { createOrganizationService } from "../../src/features/organization/server/service";
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
const tag = `FAKE ORG ${randomUUID().slice(0, 8)}`;
const companies: number[] = [],
  offices: number[] = [],
  branches: number[] = [],
  groups: number[] = [],
  users: number[] = [];
const agents: number[] = [];
let adminId: number, readerId: number;
const service = (id: number) =>
  createOrganizationService(db, () => loadAccessActor(db, id));
const companyData = {
  name: tag,
  address: null,
  city: null,
  postalCode: null,
  phoneNumber: null,
  faxNumber: null,
  directorName: null,
  taxId: null,
  website: null,
  logo: null,
  email: null,
  isDepositAgent: false,
  showPriceOnPrint: false,
};
beforeAll(async () => {
  const admin = await db.userGroup.create({
    data: {
      name: `${tag} Admin`,
      permissions: { create: { resource: "system_admin", action: "manage" } },
    },
  });
  const reader = await db.userGroup.create({
    data: {
      name: `${tag} Reader`,
      permissions: {
        create: ["company", "office", "branch"].flatMap((resource) =>
          ["view", "create", "update", "delete"].map((action) => ({
            resource,
            action,
          })),
        ),
      },
    },
  });
  groups.push(admin.id, reader.id);
  for (const group of [admin, reader]) {
    const user = await db.user.create({
      data: {
        name: tag,
        email: `${randomUUID()}@example.invalid`,
        groupId: group.id,
      },
    });
    users.push(user.id);
  }
  [adminId, readerId] = users;
  for (let i = 0; i < 2; i++) {
    const company = await db.company.create({
      data: { ...companyData, name: `${tag} ${i}` },
    });
    companies.push(company.id);
    const office = await db.office.create({
      data: {
        companyId: company.id,
        name: `${tag} ${i}`,
        code: `FAKE-${i}`,
        status: "ACTIVE",
      },
    });
    offices.push(office.id);
    const branch = await db.branch.create({
      data: {
        officeId: office.id,
        name: `${tag} ${i}`,
        code: `FAKE-${i}`,
        status: "ACTIVE",
      },
    });
    branches.push(branch.id);
  }
  await db.userAllowedBranch.create({
    data: { userId: readerId, branchId: branches[0] },
  });
});
afterAll(async () => {
  await db.identityAuditEvent.deleteMany({ where: { actorId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  await db.agent.deleteMany({ where: { id: { in: agents } } });
  await db.branch.deleteMany({ where: { id: { in: branches } } });
  await db.office.deleteMany({ where: { id: { in: offices } } });
  await db.company.deleteMany({ where: { id: { in: companies } } });
  await db.$disconnect();
});
describe("PLT-02 organization persistence and boundaries", () => {
  it("roundtrips approved branch contact fields, preserves omitted fields and restricts NPWP to administrators", async () => {
    const fields = {
      postalCode: "00123",
      faxNumber: "000456",
      email: "branch@example.invalid",
      financeContactName: "FAKE Finance",
      marketingContactName: "FAKE Marketing",
      taxId: "FAKE-NPWP-001",
    };
    const data = {
      officeId: offices[0],
      code: "FAKE-REFERENCE",
      name: `${tag} Contact`,
      address: "FAKE Address 1\nFAKE Address 2",
      city: "FAKE City",
      phoneNumber: "000789",
      managerName: "FAKE Manager",
      managerContact: "000987",
      status: "ACTIVE",
      ...fields,
    };
    const saved = await service(adminId).save("branch", null, data);
    branches.push(saved.id);
    expect(
      await db.branch.findUniqueOrThrow({ where: { id: saved.id } }),
    ).toMatchObject({ ...fields, address: data.address });
    const listed = await service(adminId).list("branch", { id: saved.id });
    expect(listed.items[0]).toMatchObject(fields);
    const {
      postalCode: _postalCode,
      faxNumber: _fax,
      email: _email,
      financeContactName: _finance,
      marketingContactName: _marketing,
      taxId: _tax,
      ...legacy
    } = data;
    await service(adminId).save("branch", saved.id, {
      ...legacy,
      name: `${tag} Updated`,
    });
    expect(
      await db.branch.findUniqueOrThrow({ where: { id: saved.id } }),
    ).toMatchObject(fields);
    await expect(
      service(adminId).save("branch", saved.id, {
        ...data,
        email: "invalid-email",
      }),
    ).rejects.toThrow();
    await expect(
      service(readerId).save("branch", saved.id, data),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await db.userAllowedBranch.create({
      data: { userId: readerId, branchId: saved.id },
    });
    expect(
      (await service(readerId).list("branch", { id: saved.id })).items[0],
    ).toMatchObject({ taxId: null, postalCode: fields.postalCode });
    expect(
      (await service(readerId).list("branch", { id: branches[1] })).items,
    ).toEqual([]);
    await db.userAllowedBranch.deleteMany({
      where: { userId: readerId, branchId: saved.id },
    });
  });
  it("stores a validated inline logo in the existing company column", async () => {
    const logo =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
    const saved = await service(adminId).save("company", null, {
      ...companyData,
      name: `${tag} Logo`,
      logo,
    });
    companies.push(saved.id);
    expect(
      (await db.company.findUniqueOrThrow({ where: { id: saved.id } })).logo,
    ).toBe(logo);
    expect(
      (await service(adminId).list("company", { id: saved.id })).items[0],
    ).toMatchObject({ id: saved.id, logo });
    await expect(
      service(adminId).save("company", saved.id, {
        ...companyData,
        logo: "data:image/svg+xml;base64,PHN2Zy8+",
      }),
    ).rejects.toThrow();
  });
  it("maintains agent identity with approved zero opening values and no balance/rate editing", async () => {
    const data = {
      code: "FAKE",
      initials: "FAKE",
      name: `${tag} Agent`,
      category: "FAKE",
      branchId: branches[0],
      phoneNumber: null,
      managerName: null,
      mobileNumber: null,
      status: "ACTIVE",
    };
    const created = await service(adminId).save("agent", null, data);
    agents.push(created.id);
    const stored = await db.agent.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(stored.balance.toString()).toBe("0");
    expect(stored.commissionRate.toString()).toBe("0");
    await service(adminId).save(
      "agent",
      created.id,
      { ...data, name: `${tag} Agent changed` },
      stored.updatedAt,
    );
    await expect(
      service(adminId).save("agent", created.id, { ...data, balance: "999" }),
    ).rejects.toThrow();
    const page = await service(adminId).list("agent", {
      search: `${tag} Agent changed`,
    });
    expect(page.items.map((row) => row.id)).toEqual([created.id]);
    expect(JSON.stringify(page.items)).not.toMatch(
      /balance|commissionRate|departmentId/,
    );
    await service(adminId).remove("agent", created.id);
    expect(
      (await db.agent.findUniqueOrThrow({ where: { id: created.id } }))
        .deletedAt,
    ).not.toBeNull();
  });
  it("maintains existing children under inactive parents without allowing new links or reactivation", async () => {
    const branchData = {
      officeId: offices[1],
      code: `MAINT-${tag}`,
      name: `${tag} Maintained branch`,
      address: null,
      city: null,
      phoneNumber: null,
      managerName: null,
      managerContact: null,
      status: "ACTIVE",
    };
    const branch = await service(adminId).save("branch", null, branchData);
    branches.push(branch.id);
    const agentData = {
      branchId: branch.id,
      code: "MAINT",
      initials: "MAINT",
      name: `${tag} Maintained agent`,
      category: "",
      phoneNumber: null,
      managerName: null,
      mobileNumber: null,
      status: "ACTIVE",
    };
    const agent = await service(adminId).save("agent", null, agentData);
    agents.push(agent.id);
    await db.office.update({
      where: { id: offices[1] },
      data: { status: "INACTIVE" },
    });
    try {
      await service(adminId).save("branch", branch.id, {
        ...branchData,
        phoneNumber: "INVALID-PHONE",
      });
      await service(adminId).save("agent", agent.id, {
        ...agentData,
        managerName: "FAKE updated manager",
      });
      await expect(
        service(adminId).save("branch", null, branchData),
      ).rejects.toMatchObject({ code: "INVALID_PARENT" });
      await expect(
        service(adminId).save("agent", null, agentData),
      ).rejects.toMatchObject({ code: "INVALID_PARENT" });
      await service(adminId).save("branch", branch.id, {
        ...branchData,
        status: "INACTIVE",
      });
      await service(adminId).save("agent", agent.id, {
        ...agentData,
        status: "INACTIVE",
      });
      await expect(
        service(adminId).save("branch", branch.id, branchData),
      ).rejects.toMatchObject({ code: "INVALID_PARENT" });
      await expect(
        service(adminId).save("agent", agent.id, agentData),
      ).rejects.toMatchObject({ code: "INVALID_PARENT" });
      await expect(
        service(adminId).save("agent", agent.id, {
          ...agentData,
          branchId: branches[1],
          status: "INACTIVE",
        }),
      ).rejects.toMatchObject({ code: "INVALID_PARENT" });
      await db.branch.update({
        where: { id: branch.id },
        data: { deletedAt: new Date() },
      });
      await expect(
        service(adminId).save("agent", agent.id, {
          ...agentData,
          status: "INACTIVE",
        }),
      ).rejects.toMatchObject({ code: "INVALID_PARENT" });
      await db.branch.update({
        where: { id: branch.id },
        data: { deletedAt: null },
      });
    } finally {
      await db.office.update({
        where: { id: offices[1] },
        data: { status: "ACTIVE" },
      });
    }
  });
  it("removes branch scope immediately when its parent office becomes inactive", async () => {
    await db.office.update({
      where: { id: offices[0] },
      data: { status: "INACTIVE" },
    });
    try {
      expect((await loadAccessActor(db, readerId))?.branchIds).toEqual([]);
      expect(
        (await service(readerId).list("branch", {})).pagination.total,
      ).toBe(0);
    } finally {
      await db.office.update({
        where: { id: offices[0] },
        data: { status: "ACTIVE" },
      });
    }
  });
  it("scopes parent and child lists and totals to explicitly assigned branches", async () => {
    for (const [kind, ids] of [
      ["company", companies],
      ["office", offices],
      ["branch", branches],
    ] as const) {
      const page = await service(readerId).list(kind, {
        search: tag,
        pageSize: 1,
      });
      expect(page.items.map((row) => row.id)).toEqual([ids[0]]);
      expect(page.pagination.total).toBe(1);
      expect(page.writable).toBe(false);
    }
    const outside = await service(readerId).list("branch", {
      parentId: offices[1],
    });
    expect(outside.pagination.total).toBe(0);
    expect(
      (await service(readerId).list("branch", { id: branches[1] })).pagination
        .total,
    ).toBe(0);
    expect(
      (await service(readerId).list("company", { id: companies[1] })).pagination
        .total,
    ).toBe(0);
  });
  it("rejects shared organization mutations by a branch user even with action grants", async () => {
    await expect(
      service(readerId).save("company", null, companyData),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service(readerId).remove("branch", branches[1]),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      await db.identityAuditEvent.count({ where: { actorId: readerId } }),
    ).toBe(0);
  });
  it("creates and edits atomically, soft deletes, and audits without contact data", async () => {
    const created = await service(adminId).save("company", null, {
      ...companyData,
      name: `${tag} created`,
    });
    companies.push(created.id);
    await service(adminId).save("company", created.id, {
      ...companyData,
      name: `${tag} changed`,
      phoneNumber: "INVALID-CONTACT",
    });
    await service(adminId).remove("company", created.id);
    expect(
      (await db.company.findUniqueOrThrow({ where: { id: created.id } }))
        .deletedAt,
    ).not.toBeNull();
    const page = await service(adminId).list("company", {
      search: `${tag} changed`,
    });
    expect(page.items).toHaveLength(0);
    const events = await db.identityAuditEvent.findMany({
      where: {
        actorId: adminId,
        subjectType: "company",
        subjectId: created.id,
      },
    });
    expect(events).toHaveLength(3);
    expect(JSON.stringify(events)).not.toContain("INVALID-CONTACT");
    await expect(
      service(adminId).save("company", created.id, companyData),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("rejects live children, assigned branches, invalid parents and invalid input without partial writes", async () => {
    await expect(
      service(adminId).remove("company", companies[0]),
    ).rejects.toMatchObject({ code: "IN_USE" });
    await expect(
      service(adminId).remove("office", offices[0]),
    ).rejects.toMatchObject({ code: "IN_USE" });
    await expect(
      service(adminId).remove("branch", branches[0]),
    ).rejects.toMatchObject({ code: "IN_USE" });
    const before = await db.office.count();
    await expect(
      service(adminId).save("office", null, {
        companyId: 2147483647,
        code: "FAKE",
        name: tag,
        address: null,
        city: null,
        phoneNumber: null,
        email: null,
        managerName: null,
        status: "ACTIVE",
      }),
    ).rejects.toMatchObject({ code: "INVALID_PARENT" });
    await expect(
      service(adminId).save("company", null, {
        ...companyData,
        injected: true,
      }),
    ).rejects.toThrow();
    expect(await db.office.count()).toBe(before);
  });
});
