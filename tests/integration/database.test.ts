import { PrismaPg } from "@prisma/adapter-pg";
import { expect, it } from "vitest";
import { PrismaClient } from "../../src/lib/db/generated/client";
import { testDatabaseUrl } from "../support/test-database-url";

it("runs SELECT 1 against the explicitly selected test database", async () => {
  // Validate before creating an adapter, client, or connection pool.
  const connectionString = testDatabaseUrl(
    process.env.TEST_DATABASE_URL,
    process.env.DATABASE_URL,
  );
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 5_000 }),
  });

  try {
    const rows = await client.$queryRaw<Array<{ result: number }>>`
      SELECT 1 AS result
    `;
    expect(rows).toEqual([{ result: 1 }]);
  } finally {
    // Prisma disposes the adapter-owned pg pool when disconnecting.
    await client.$disconnect();
  }
});
