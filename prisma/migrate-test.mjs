import "dotenv/config";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { testDatabaseUrl } from "../tests/support/test-database-url.ts";

try {
  const connectionString = testDatabaseUrl(
    process.env.TEST_DATABASE_URL,
    process.env.DATABASE_URL,
  );
  const url = new URL(connectionString);
  if (
    process.env.NODE_ENV === "production" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  ) {
    throw new Error("Only a non-production loopback test target is allowed.");
  }
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve("prisma/package.json");
  const cliPath = resolve(
    dirname(packagePath),
    require(packagePath).bin.prisma,
  );
  const result = spawnSync(process.execPath, [cliPath, "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: connectionString },
  });
  if (result.error) console.error("Could not start the installed Prisma CLI.");
  process.exitCode = result.status ?? 1;
} catch {
  console.error(
    "Test migration refused: require non-production, loopback, a separate logistik_web_test, and no connection overrides.",
  );
  process.exitCode = 1;
}
