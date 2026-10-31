import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { getAuthTables } from "better-auth/db";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { authSchemaOptions } from "../../src/lib/auth/schema-options";
import type {
  Customer,
  PrismaClient,
  User,
  Vehicle,
} from "../../src/lib/db/generated/client";
import baseline from "../fixtures/sch01-baseline.json";

const source = readdirSync("prisma/schema")
  .map((name) => readFileSync(`prisma/schema/${name}`, "utf8"))
  .join("\n");
const models = [...source.matchAll(/model (\w+) \{([\s\S]*?)\n\}/g)];

describe("SCH-01 preservation and adapter contract", () => {
  it("preserves every baseline scalar field and all applied migration bytes", () => {
    for (const { table, fields } of baseline.models) {
      const model = models.find(([, , body]) =>
        body.includes(`@@map("${table}")`),
      );
      expect(model, table).toBeDefined();
      for (const field of fields) {
        expect(model?.[2], `${table}.${field}`).toMatch(
          new RegExp(`\\b${field}\\s`),
        );
      }
    }
    for (const [name, checksum] of Object.entries(baseline.migrations)) {
      expect(
        createHash("sha256")
          .update(readFileSync(`prisma/migrations/${name}/migration.sql`))
          .digest("hex"),
      ).toBe(checksum);
    }
  });

  it("keeps domain lifecycles, narrow keys, draft guards and auth exceptions", () => {
    expect(source).not.toMatch(/\bBigInt\b|\/\/\/ (?:Prototype:|PII)/);
    for (const [, name, body] of models) {
      expect(body, name).toMatch(/\bid\s+Int\s+@id/);
      expect(body, name).toMatch(
        /\bcreatedAt\s+DateTime\s+@default\(now\(\)\)/,
      );
      expect(body, name).toMatch(/\bupdatedAt\s+DateTime\s+@updatedAt/);
      if (!["User", "Session", "AuthAccount", "Verification"].includes(name)) {
        expect(body, name).toMatch(/\bdeletedAt\s+DateTime\?/);
      }
    }
    expect(source).toMatch(/DRAFT:.*D-27/);
    expect(source).toMatch(/DRAFT:.*D-26/);
    expect(source).toMatch(/DRAFT:.*D-11, D-13/);
    expectTypeOf<Vehicle["id"]>().toEqualTypeOf<number>();
    expectTypeOf<Customer["branchId"]>().toEqualTypeOf<number | null>();
    expectTypeOf<User["emailVerified"]>().toEqualTypeOf<boolean>();
  });

  it("matches every required field from the installed Better Auth version", () => {
    const options = authSchemaOptions({} as PrismaClient);
    const tables = getAuthTables(options);
    const names: Record<string, string> = {
      user: "User",
      session: "Session",
      account: "AuthAccount",
      verification: "Verification",
    };
    for (const [key, table] of Object.entries(tables)) {
      const body = models.find(([, name]) => name === names[key])?.[2];
      expect(body, key).toBeDefined();
      for (const field of Object.keys(table.fields)) {
        expect(body, `${key}.${field}`).toMatch(new RegExp(`\\b${field}\\s`));
      }
    }
    expect(options.advanced.database.generateId).toBe("serial");
  });

  it("routes provider accounts to authAccount and converts numeric IDs", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const financialLookup = vi.fn();
    const options = authSchemaOptions({
      authAccount: { findFirst },
      account: { findFirst: financialLookup },
    } as unknown as PrismaClient);
    const adapter = options.database(options);
    await adapter.findOne({
      model: "account",
      where: [{ field: "userId", value: "42" }],
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: { equals: 42 } } }),
    );
    expect(financialLookup).not.toHaveBeenCalled();
  });
});
