/** Validate before creating any database client or launching Prisma Migrate. */
export function localDatabaseUrl(value, { purpose, nodeEnv } = {}) {
  if (!["seed", "migrate"].includes(purpose)) {
    throw new Error("Database purpose must be seed or migrate.");
  }
  if (nodeEnv === "production") {
    throw new Error("Local database tools refuse NODE_ENV=production.");
  }
  if (typeof value !== "string" || !value || value.trim() !== value) {
    throw new Error("DATABASE_URL must be a valid local PostgreSQL URL.");
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid local PostgreSQL URL.");
  }
  const hosts =
    purpose === "migrate" ? ["127.0.0.1"] : ["127.0.0.1", "localhost"];
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !hosts.includes(url.hostname) ||
    url.pathname !== "/logistik_web" ||
    url.search ||
    url.hash ||
    /[\s\\]/u.test(value)
  ) {
    throw new Error(
      "DATABASE_URL rejected: require an allowed local host, logistik_web, and no query or fragment.",
    );
  }
  return value;
}
