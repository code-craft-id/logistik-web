function parseDatabaseUrl(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required.`);

  let url: URL;
  try {
    url = new URL(value);
    decodeURIComponent(url.pathname);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL URL.`);
  }

  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    url.pathname.length <= 1 ||
    url.pathname.slice(1).includes("/") ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${name} must be a PostgreSQL URL without query or fragment.`,
    );
  }

  return url;
}

function target(url: URL) {
  const host = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    ? "loopback"
    : url.hostname.toLowerCase();
  return `${host}:${url.port || "5432"}/${decodeURIComponent(url.pathname.slice(1))}`;
}

export function testDatabaseUrl(
  testUrl: string | undefined,
  developmentUrl: string | undefined,
) {
  const parsed = parseDatabaseUrl(testUrl, "TEST_DATABASE_URL");
  const database = decodeURIComponent(parsed.pathname.slice(1));
  if (!database.toLowerCase().includes("test")) {
    throw new Error("TEST_DATABASE_URL database name must contain test.");
  }

  if (
    developmentUrl &&
    target(parsed) === target(parseDatabaseUrl(developmentUrl, "DATABASE_URL"))
  ) {
    throw new Error("TEST_DATABASE_URL must not target DATABASE_URL.");
  }

  return parsed.href;
}
