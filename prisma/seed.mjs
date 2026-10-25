import "dotenv/config";
import { localDatabaseUrl } from "./local-database.mjs";
import { seedDevelopmentAdministrators } from "./seed-admins.mjs";
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

  const administrators = await prisma.$transaction(
    async (tx) => {
      await seedFakeRecords(tx);
      return seedDevelopmentAdministrators(tx, process.env);
    },
    { timeout: 60000 },
  );
  console.log(
    "Fake development seed complete: 30 fixtures per list entity; existing rows unchanged.",
  );
  if (administrators.length)
    console.log(
      "Development administrators seeded: dev2_admin, dev3_admin. Existing passwords, sessions and assignments were preserved.",
    );
} catch {
  // Avoid exposing connection strings, database errors, or personal data.
  console.error(
    "Seed refused or failed. Require a guarded local logistik_web database, applied migrations, unmodified fake fixtures and valid DEV2_ADMIN_PASSWORD plus DEV3_ADMIN_PASSWORD when creating development admins. No partial seed writes are committed.",
  );
  process.exitCode = 1;
} finally {
  if (prisma) await prisma.$disconnect();
}
