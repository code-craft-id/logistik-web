import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { createWhatsAppConnectionService } from "../../src/features/whatsapp/server/connection-service";
import { createWhatsAppSetupService } from "../../src/features/whatsapp/server/setup-service";
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
const tag = `FAKE WA ${randomUUID().slice(0, 8)}`;
const companies: number[] = [],
  offices: number[] = [],
  branches: number[] = [],
  groups: number[] = [],
  users: number[] = [];
const config = vi.fn(() => ({
  state: "configured" as const,
  url: "https://private-gateway.example.invalid/",
  apiKey: "FAKE-PRIVATE-KEY-AT-LEAST-32-CHARACTERS",
}));
const service = (id: number) =>
  createWhatsAppSetupService(db, () => loadAccessActor(db, id), config);

beforeAll(async () => {
  for (const permissions of [
    [{ resource: "system_admin", action: "manage" }],
    [{ resource: "whatsapp_configuration", action: "view" }],
    [],
  ]) {
    const group = await db.userGroup.create({
      data: {
        name: `${tag} ${groups.length}`,
        permissions: { create: permissions },
      },
    });
    groups.push(group.id);
    const user = await db.user.create({
      data: {
        name: tag,
        email: `${randomUUID()}@example.invalid`,
        groupId: group.id,
      },
    });
    users.push(user.id);
  }
  for (const suffix of ["A", "B"]) {
    const company = await db.company.create({
      data: {
        name: `${tag} ${suffix}`,
        isDepositAgent: false,
        showPriceOnPrint: false,
      },
    });
    companies.push(company.id);
    const office = await db.office.create({
      data: {
        companyId: company.id,
        code: `${tag}-${suffix}`,
        name: `${tag} ${suffix}`,
        status: "ACTIVE",
      },
    });
    offices.push(office.id);
  }
  for (const [index, officeId] of [
    offices[0],
    offices[0],
    offices[1],
  ].entries()) {
    const branch = await db.branch.create({
      data: {
        officeId,
        code: `${tag}-${index}`,
        name: `${tag} ${index}`,
        status: "ACTIVE",
      },
    });
    branches.push(branch.id);
  }
  await db.userAllowedBranch.createMany({
    data: [branches[0], branches[2]].map((branchId) => ({
      userId: users[1],
      branchId,
    })),
  });
});
afterAll(async () => {
  await db.identityAuditEvent.deleteMany({ where: { actorId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  await db.branch.deleteMany({ where: { id: { in: branches } } });
  await db.office.deleteMany({ where: { id: { in: offices } } });
  await db.company.deleteMany({ where: { id: { in: companies } } });
  await db.$disconnect();
});

describe("WA-01 branch setup boundary", () => {
  it("denies unauthenticated users and users without the WhatsApp view grant", async () => {
    await expect(
      createWhatsAppSetupService(db, async () => null).list(),
    ).rejects.toMatchObject({ status: 401 });
    await expect(service(users[2]).list()).rejects.toMatchObject({
      status: 403,
    });
  });
  it("applies branch scope to search, company filters, totals and pagination", async () => {
    const page = await service(users[1]).list({ search: tag, pageSize: 1 });
    expect(page.items.map((branch) => branch.id)).toEqual([branches[0]]);
    expect(page.pagination).toMatchObject({ total: 2, totalPages: 2 });
    const next = await service(users[1]).list({
      search: tag,
      pageSize: 1,
      page: 2,
    });
    expect(next.items.map((branch) => branch.id)).toEqual([branches[2]]);
    const company = await service(users[1]).list({ companyId: companies[0] });
    expect(company.items.map((branch) => branch.id)).toEqual([branches[0]]);
    expect(company.pagination.total).toBe(1);
    expect(
      (await service(users[1]).list({ search: `${tag} 1` })).items,
    ).toEqual([]);
  });
  it("exposes configuration readiness only to administrators, without gateway secrets or fabricated sessions", async () => {
    config.mockClear();
    const reader = await service(users[1]).list({ search: tag });
    expect(reader.gatewayConfiguration).toBeNull();
    expect(reader.connectionAvailable).toBe(true);
    expect(reader.canManageConnections).toBe(false);
    const admin = await service(users[0]).list({ search: tag });
    expect(admin.items.map((branch) => branch.id)).toEqual(branches);
    expect(admin.gatewayConfiguration).toBe("configured");
    expect(admin.connectionAvailable).toBe(true);
    expect(admin.canManageConnections).toBe(true);
    expect(JSON.stringify(admin)).not.toMatch(
      /PRIVATE-KEY|private-gateway|apiKey|phone|token|qr/,
    );
    await expect(
      service(users[1]).list({ branchId: branches[1] }),
    ).rejects.toThrow();
  });
  it("blocks unauthorized session access before calling the gateway and audits administrator changes", async () => {
    const gateway = {
      session: vi.fn(async (branchId: number) => ({
        branchId,
        status: "disconnected" as const,
        phoneNumber: null,
      })),
      qr: vi.fn(async (branchId: number) => ({
        branchId,
        qrDataUrl: "FAKE-PRIVATE-QR",
        expiresAt: new Date().toISOString(),
      })),
    };
    const connection = (id: number) =>
      createWhatsAppConnectionService(
        db,
        () => loadAccessActor(db, id),
        gateway,
      );
    await expect(
      connection(users[1]).status(String(branches[1])),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      connection(users[1]).change(String(branches[0]), "POST"),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      connection(users[1]).qr(String(branches[0])),
    ).rejects.toMatchObject({ status: 403 });
    expect(gateway.session).not.toHaveBeenCalled();
    expect(gateway.qr).not.toHaveBeenCalled();
    expect(
      (await connection(users[1]).status(String(branches[0]))).branchId,
    ).toBe(branches[0]);
    await connection(users[0]).change(String(branches[0]), "POST");
    await connection(users[0]).change(String(branches[0]), "DELETE");
    const events = await db.identityAuditEvent.findMany({
      where: { actorId: users[0], subjectType: "branch_whatsapp" },
    });
    expect(events.map((event) => event.action).sort()).toEqual([
      "WHATSAPP_CONNECT_COMPLETED",
      "WHATSAPP_CONNECT_REQUESTED",
      "WHATSAPP_DISCONNECT_COMPLETED",
      "WHATSAPP_DISCONNECT_REQUESTED",
    ]);
    expect(JSON.stringify(events)).not.toMatch(/phoneNumber|qrDataUrl|apiKey/);
    gateway.session.mockRejectedValueOnce(new Error("FAKE gateway failure"));
    await expect(
      connection(users[0]).change(String(branches[0]), "POST"),
    ).rejects.toThrow();
    expect(
      await db.identityAuditEvent.count({
        where: { actorId: users[0], action: "WHATSAPP_CONNECT_UNCONFIRMED" },
      }),
    ).toBe(1);
  });
  it("excludes inactive or deleted branches and inactive parents for administrators too", async () => {
    try {
      await db.branch.update({
        where: { id: branches[0] },
        data: { status: "INACTIVE" },
      });
      await db.branch.update({
        where: { id: branches[1] },
        data: { deletedAt: new Date() },
      });
      await db.office.update({
        where: { id: offices[1] },
        data: { status: "INACTIVE" },
      });
      const page = await service(users[0]).list({ search: tag });
      expect(page.items).toEqual([]);
      expect(page.pagination.total).toBe(0);
    } finally {
      await db.branch.update({
        where: { id: branches[0] },
        data: { status: "ACTIVE" },
      });
      await db.branch.update({
        where: { id: branches[1] },
        data: { deletedAt: null },
      });
      await db.office.update({
        where: { id: offices[1] },
        data: { status: "ACTIVE" },
      });
    }
  });
  it("does not release QR data if the administrator loses access while the gateway is responding", async () => {
    const gateway = {
      session: vi.fn(),
      qr: vi.fn(async (branchId: number) => {
        await db.user.update({
          where: { id: users[0] },
          data: { status: "INACTIVE" },
        });
        return {
          branchId,
          qrDataUrl: "FAKE-PRIVATE-QR",
          expiresAt: new Date().toISOString(),
        };
      }),
    };
    try {
      const connection = createWhatsAppConnectionService(
        db,
        () => loadAccessActor(db, users[0]),
        gateway,
      );
      await expect(connection.qr(String(branches[0]))).rejects.toMatchObject({
        status: 401,
      });
    } finally {
      await db.user.update({
        where: { id: users[0] },
        data: { status: "ACTIVE" },
      });
    }
  });
});
