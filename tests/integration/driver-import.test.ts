import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { loadAccessActor } from "../../src/features/identity/server/access";
import { personnelImportDefinitions } from "../../src/features/master-data/personnel-import-contracts";
import { createPersonnelImportService } from "../../src/features/master-data/server/personnel-import-service";
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
const tag = randomUUID().slice(0, 8),
  prefix = `FAKE IMPORT ${tag}`;
const users: number[] = [],
  groups: number[] = [],
  branches: number[] = [];
let companyId: number, officeId: number;
const codeA = `A-${tag}`,
  codeB = `B-${tag}`;
const rawService = (id: number) =>
  createPersonnelImportService(db, () => loadAccessActor(db, id));
const service = (id: number) => {
  const api = rawService(id);
  return {
    preview: (bytes: Uint8Array) => api.preview("driver", bytes),
    import: (bytes: Uint8Array) => api.import("driver", bytes),
    template: () => api.template("driver"),
  };
};
const DRIVER_IMPORT_HEADERS = personnelImportDefinitions.driver.headers;
const data = (name: string, branch = codeA, status = "Y") => [
  "",
  `${prefix} ${name}`,
  "FAKE Address",
  "FAKE Address 2",
  "000123",
  "080000000000",
  branch,
  "",
  "000456",
  status,
];
function file(rows: string[][]) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["Template Import Driver"],
      [],
      [...DRIVER_IMPORT_HEADERS],
      ...rows,
    ]),
    "Worksheet",
  );
  return XLSX.write(book, { type: "buffer", bookType: "biff8" }) as Uint8Array;
}
const count = () =>
  db.driver.count({
    where: { name: { startsWith: prefix }, branchId: { in: branches } },
  });
beforeAll(async () => {
  const company = await db.company.create({
    data: { name: prefix, isDepositAgent: false, showPriceOnPrint: false },
  });
  companyId = company.id;
  const office = await db.office.create({
    data: { companyId, code: tag, name: prefix, status: "ACTIVE" },
  });
  officeId = office.id;
  for (const code of [codeA, codeB])
    branches.push(
      (
        await db.branch.create({
          data: { officeId, code, name: `${prefix} ${code}`, status: "ACTIVE" },
        })
      ).id,
    );
  for (const grants of [
    [{ resource: "system_admin", action: "manage" }],
    [
      ...["driver", "courier", "marketing_person"].flatMap((resource) => [
        { resource, action: "view" },
        { resource, action: "create" },
      ]),
    ],
    [
      ...["driver", "courier", "marketing_person"].map((resource) => ({
        resource,
        action: "view",
      })),
    ],
  ]) {
    const group = await db.userGroup.create({
      data: {
        name: `${prefix} ${groups.length}`,
        permissions: { create: grants },
      },
    });
    groups.push(group.id);
    users.push(
      (
        await db.user.create({
          data: {
            name: prefix,
            email: `${randomUUID()}@example.invalid`,
            groupId: group.id,
            allowedBranches: { create: { branchId: branches[0] } },
          },
        })
      ).id,
    );
  }
});
afterAll(async () => {
  await db.identityAuditEvent.deleteMany({ where: { actorId: { in: users } } });
  await db.driver.deleteMany({
    where: { name: { startsWith: prefix }, branchId: { in: branches } },
  });
  await db.courier.deleteMany({
    where: { name: { startsWith: prefix }, branchId: { in: branches } },
  });
  await db.marketingPerson.deleteMany({
    where: { name: { startsWith: prefix }, branchId: { in: branches } },
  });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.userGroup.deleteMany({ where: { id: { in: groups } } });
  await db.branch.deleteMany({ where: { id: { in: branches } } });
  if (officeId) await db.office.delete({ where: { id: officeId } });
  if (companyId) await db.company.delete({ where: { id: companyId } });
  await db.$disconnect();
});
describe("transactional Driver Excel import", () => {
  it("previews without writes, persists valid rows and records one audit per driver", async () => {
    const bytes = file([data("ONE"), data("TWO", codeA, "N")]);
    const before = await count();
    const preview = await service(users[1]).preview(bytes);
    expect(preview).toMatchObject({ count: 2, valid: true, issues: [] });
    expect(JSON.stringify(preview)).not.toMatch(/000123|080000000000|000456/);
    expect(await count()).toBe(before);
    expect(await service(users[1]).import(bytes)).toEqual({ count: 2 });
    expect(await count()).toBe(before + 2);
    expect(
      await db.identityAuditEvent.count({
        where: { actorId: users[1], action: "REFERENCE_IMPORTED" },
      }),
    ).toBe(2);
    expect((await service(users[1]).preview(bytes)).valid).toBe(false);
    await expect(service(users[1]).import(bytes)).rejects.toMatchObject({
      code: "INVALID_IMPORT",
    });
    expect(await count()).toBe(before + 2);
  });
  it("rejects repeated rows and aborts the complete batch for an unauthorized or inactive branch", async () => {
    const before = await count();
    expect(
      (
        await service(users[1]).preview(
          file([data("REPEATED"), data("REPEATED")]),
        )
      ).valid,
    ).toBe(false);
    const outside = file([data("SAFE"), data("OUTSIDE", codeB)]);
    expect((await service(users[1]).preview(outside)).valid).toBe(false);
    await expect(service(users[1]).import(outside)).rejects.toMatchObject({
      code: "INVALID_IMPORT",
    });
    expect(await count()).toBe(before);
    await db.branch.update({
      where: { id: branches[0] },
      data: { status: "INACTIVE" },
    });
    try {
      await expect(
        service(users[1]).import(file([data("INACTIVE")])),
      ).rejects.toMatchObject({ code: "INVALID_IMPORT" });
    } finally {
      await db.branch.update({
        where: { id: branches[0] },
        data: { status: "ACTIVE" },
      });
    }
  });
  it("enforces create permission independently and limits template branch references", async () => {
    await expect(
      service(users[2]).preview(file([data("READER")])),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service(users[2]).import(file([data("READER")])),
    ).rejects.toMatchObject({ status: 403 });
    const book = XLSX.read(await service(users[1]).template(), {
      type: "array",
    });
    const text = JSON.stringify(
      XLSX.utils.sheet_to_json(book.Sheets.Keterangan, { header: 1 }),
    );
    expect(text).toContain(codeA);
    expect(text).not.toContain(codeB);
  });
  it("revalidates revoked request sessions and prevents duplicate concurrent imports", async () => {
    const before = await count();
    let reads = 0;
    const revoked = createPersonnelImportService(db, async () =>
      ++reads === 1 ? loadAccessActor(db, users[1]) : null,
    );
    await expect(
      revoked.import("driver", file([data("REVOKED")])),
    ).rejects.toMatchObject({ status: 401 });
    expect(await count()).toBe(before);
    const bytes = file([data("CONCURRENT")]);
    const results = await Promise.allSettled([
      service(users[1]).import(bytes),
      service(users[1]).import(bytes),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(await count()).toBe(before + 1);
  });
  it("rejects branch changes after preview and allows an administrator to import into an explicitly named other branch", async () => {
    const bytes = file([data("CHANGED")]);
    expect((await service(users[1]).preview(bytes)).valid).toBe(true);
    await db.userAllowedBranch.deleteMany({ where: { userId: users[1] } });
    try {
      await expect(service(users[1]).import(bytes)).rejects.toMatchObject({
        code: "INVALID_IMPORT",
      });
    } finally {
      await db.userAllowedBranch.create({
        data: { userId: users[1], branchId: branches[0] },
      });
    }
    expect(
      await service(users[0]).import(file([data("ADMIN-B", codeB)])),
    ).toEqual({ count: 1 });
  });
  it.each([
    "courier",
    "marketing_person",
  ] as const)("imports %s using its own permission and table, with branch denial and no duplicates", async (kind) => {
    const make = (branch: string) => {
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet([
          [`Template Import ${kind}`],
          [],
          personnelImportDefinitions[kind].headers,
          [...data(kind, branch).slice(0, 8), "Y"],
        ]),
        "Worksheet",
      );
      return XLSX.write(book, {
        type: "buffer",
        bookType: "biff8",
      }) as Uint8Array;
    };
    const bytes = make(codeA);
    const api = rawService(users[1]);
    expect((await api.preview(kind, bytes)).valid).toBe(true);
    expect(await api.import(kind, bytes)).toEqual({ count: 1 });
    expect((await api.preview(kind, bytes)).valid).toBe(false);
    await expect(api.import(kind, make(codeB))).rejects.toMatchObject({
      code: "INVALID_IMPORT",
    });
    await expect(
      rawService(users[2]).import(kind, bytes),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      await db.identityAuditEvent.count({
        where: {
          actorId: users[1],
          subjectType: kind,
          action: "REFERENCE_IMPORTED",
        },
      }),
    ).toBe(1);
    const record =
      kind === "courier"
        ? await db.courier.findFirst({
            where: { name: `${prefix} ${kind}`, branchId: branches[0] },
          })
        : await db.marketingPerson.findFirst({
            where: { name: `${prefix} ${kind}`, branchId: branches[0] },
          });
    expect(record).toMatchObject({
      name: `${prefix} ${kind}`,
      nationalIdNumber: "000123",
      status: "ACTIVE",
    });
  });
});
