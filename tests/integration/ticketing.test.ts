import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { createTicketService } from "../../src/features/ticketing/server/service";
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
const tag = `FAKE SUP ${randomUUID()}`;
const groups: number[] = [],
  users: number[] = [],
  branches: number[] = [];
let companyId: number, officeId: number;
const service = (id: number) =>
  createTicketService(db, () => loadAccessActor(db, id));
const payload = (extra = {}) => ({
  branchId: branches[0],
  subject: tag,
  menuName: "FAKE Menu",
  relatedPageUrl: "/ticketting",
  priority: "Normal",
  remarks: "FAKE remarks",
  idempotencyKey: randomUUID(),
  ...extra,
});
beforeAll(async () => {
  const company = await db.company.create({
    data: { name: tag, isDepositAgent: false, showPriceOnPrint: false },
  });
  companyId = company.id;
  const office = await db.office.create({
    data: { companyId, name: tag, code: tag, status: "ACTIVE" },
  });
  officeId = office.id;
  for (let i = 0; i < 3; i++)
    branches.push(
      (
        await db.branch.create({
          data: {
            officeId,
            name: `${tag} ${i}`,
            code: `${tag} ${i}`,
            status: "ACTIVE",
          },
        })
      ).id,
    );
  for (let i = 0; i < 4; i++) {
    const group = await db.userGroup.create({
      data: {
        name: `${tag} ${i}`,
        permissions: {
          create:
            i === 0
              ? [{ resource: "system_admin", action: "manage" }]
              : i === 3
                ? []
                : [
                    { resource: "ticket", action: "view" },
                    { resource: "ticket", action: "create" },
                  ],
        },
      },
    });
    groups.push(group.id);
    users.push(
      (
        await db.user.create({
          data: {
            name: tag,
            email: `${randomUUID()}@example.invalid`,
            groupId: group.id,
            allowedBranches: {
              create: branches.slice(0, 2).map((branchId) => ({ branchId })),
            },
          },
        })
      ).id,
    );
  }
});
afterAll(async () => {
  await db.ticket.deleteMany({ where: { createdById: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  await db.branch.deleteMany({ where: { id: { in: branches } } });
  if (officeId) await db.office.delete({ where: { id: officeId } });
  if (companyId) await db.company.delete({ where: { id: companyId } });
  await db.$disconnect();
});
describe("SUP-01 guarded PostgreSQL acceptance", () => {
  it("creates real records, restricts own multibranch list/count/detail and permits explicit global admin reads", async () => {
    const first = await service(users[1]).create(payload());
    const second = await service(users[1]).create(
      payload({ branchId: branches[1] }),
    );
    const other = await service(users[2]).create(payload());
    const list = await service(users[1]).list({ search: tag });
    expect(list.total).toBe(2);
    expect(list.items.map((x) => x.id)).toEqual([second.id, first.id]);
    expect(await service(users[1]).detail(other.id)).toBeNull();
    expect(await service(users[1]).detail(2147483647)).toBeNull();
    expect((await service(users[0]).list({ search: tag })).total).toBe(3);
    expect(await service(users[1]).detail(first.id)).toMatchObject({
      createdById: users[1],
      branchId: branches[0],
      subject: tag,
    });
    expect(await service(users[1]).detail(first.id)).not.toHaveProperty(
      "idempotencyKey",
    );
  });
  it("makes simultaneous identical-key creates one row and rejects changed payload", async () => {
    const input = payload();
    const results = await Promise.all(
      Array.from({ length: 4 }, () => service(users[1]).create(input)),
    );
    expect(new Set(results.map((x) => x.id)).size).toBe(1);
    expect(
      await db.ticket.count({
        where: { createdById: users[1], idempotencyKey: input.idempotencyKey },
      }),
    ).toBe(1);
    await expect(
      service(users[1]).create({ ...input, subject: "Changed" }),
    ).rejects.toHaveProperty("status", 409);
    expect(
      (await service(users[1]).create({ ...input, subject: ` ${tag} ` })).id,
    ).toBe(results[0].id);
  });
  it("denies missing grant, forged creator/branch and inactive actor/group without partial writes", async () => {
    const before = await db.ticket.count({
      where: { createdById: { in: users } },
    });
    await expect(service(users[3]).list({})).rejects.toHaveProperty(
      "status",
      403,
    );
    await expect(service(users[3]).create(payload())).rejects.toHaveProperty(
      "status",
      403,
    );
    await expect(
      service(users[1]).create(payload({ createdById: users[2] })),
    ).rejects.toBeDefined();
    await expect(
      service(users[1]).create(payload({ branchId: branches[2] })),
    ).rejects.toHaveProperty("status", 403);
    await db.user.update({
      where: { id: users[1] },
      data: { status: "INACTIVE" },
    });
    await expect(service(users[1]).list({})).rejects.toHaveProperty(
      "status",
      401,
    );
    await db.user.update({
      where: { id: users[1] },
      data: { status: "ACTIVE" },
    });
    await db.userGroup.update({
      where: { id: groups[1] },
      data: { status: "INACTIVE" },
    });
    await expect(service(users[1]).create(payload())).rejects.toHaveProperty(
      "status",
      401,
    );
    await db.userGroup.update({
      where: { id: groups[1] },
      data: { status: "ACTIVE" },
    });
    expect(
      await db.ticket.count({ where: { createdById: { in: users } } }),
    ).toBe(before);
  });
  it("denies list/detail/replay after current membership loss", async () => {
    const input = payload(),
      created = await service(users[2]).create(input);
    await db.userAllowedBranch.deleteMany({
      where: { userId: users[2], branchId: branches[0] },
    });
    expect(await service(users[2]).detail(created.id)).toBeNull();
    expect((await service(users[2]).list({ search: tag })).total).toBe(0);
    await expect(service(users[2]).create(input)).rejects.toHaveProperty(
      "status",
      403,
    );
    await db.userAllowedBranch.create({
      data: { userId: users[2], branchId: branches[0] },
    });
  });
  it("validates active branch/office/company even for administrator and hides soft-deleted tickets", async () => {
    const created = await service(users[1]).create(payload());
    await db.ticket.update({
      where: { id: created.id },
      data: { deletedAt: new Date() },
    });
    expect(await service(users[0]).detail(created.id)).toBeNull();
    for (const entity of ["branch", "office", "company"] as const) {
      if (entity === "branch")
        await db.branch.update({
          where: { id: branches[0] },
          data: { status: "INACTIVE" },
        });
      if (entity === "office")
        await db.office.update({
          where: { id: officeId },
          data: { deletedAt: new Date() },
        });
      if (entity === "company")
        await db.company.update({
          where: { id: companyId },
          data: { deletedAt: new Date() },
        });
      await expect(service(users[0]).create(payload())).rejects.toHaveProperty(
        "status",
        403,
      );
      await expect(service(users[1]).create(payload())).rejects.toHaveProperty(
        "status",
        403,
      );
      await db.branch.update({
        where: { id: branches[0] },
        data: { status: "ACTIVE" },
      });
      await db.office.update({
        where: { id: officeId },
        data: { deletedAt: null },
      });
      await db.company.update({
        where: { id: companyId },
        data: { deletedAt: null },
      });
    }
  });
  it("enforces the named priority CHECK and restrictive creator/branch references", async () => {
    const input = payload();
    await expect(
      db.ticket.create({
        data: { ...input, createdById: users[1], priority: "Invented" },
      }),
    ).rejects.toBeDefined();
    expect(
      await db.ticket.count({
        where: { createdById: users[1], idempotencyKey: input.idempotencyKey },
      }),
    ).toBe(0);
    await expect(
      db.user.delete({ where: { id: users[1] } }),
    ).rejects.toHaveProperty("code", "P2003");
    await expect(
      db.branch.delete({ where: { id: branches[0] } }),
    ).rejects.toHaveProperty("code", "P2003");
  });
});
