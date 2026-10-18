import "dotenv/config";
import { localDatabaseUrl } from "./local-database.mjs";

import { seedFakeRecords } from "./seed-data.mjs";

let prisma;
try {
  const connectionString = localDatabaseUrl(process.env.DATABASE_URL, {
    purpose: "seed",
    nodeEnv: process.env.NODE_ENV,
  });
  // The guard must pass before importing the client or creating the adapter.
  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import("../src/lib/db/generated/client.ts"),
    import("@prisma/adapter-pg"),
  ]);
  prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 3000 }),
  });

  await prisma.$transaction(seedFakeRecords, { timeout: 30000 });
  console.log(
    "Fake development seed complete: 30 fixtures per list entity; existing rows unchanged.",
  );
} catch {
  // Avoid exposing connection strings, database errors, or personal data.
  console.error(
    "Seed refused or failed. Require non-production, localhost/127.0.0.1, logistik_web, no connection overrides, applied migrations, and unmodified fake IDs 9100001-9100030. No partial seed writes are committed.",
  );
  process.exitCode = 1;
} finally {
  if (prisma) await prisma.$disconnect();
}
