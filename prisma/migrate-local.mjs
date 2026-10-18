import "dotenv/config";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { localDatabaseUrl } from "./local-database.mjs";

try {
  const connectionString = localDatabaseUrl(process.env.DATABASE_URL, {
    purpose: "migrate",
    nodeEnv: process.env.NODE_ENV,
  });
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
  if (result.error) {
    console.error("Could not start the installed Prisma CLI.");
  }
  process.exitCode = result.status ?? 1;
} catch {
  console.error(
    "Migration refused: require non-production, host 127.0.0.1, database logistik_web, and no connection overrides.",
  );
  process.exitCode = 1;
}
