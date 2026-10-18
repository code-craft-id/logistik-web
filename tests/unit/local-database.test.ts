import { describe, expect, it } from "vitest";
import { localDatabaseUrl } from "../../prisma/local-database.mjs";

describe("SCH-01 local database guards", () => {
  it.each([
    "seed",
    "migrate",
  ])("allows the explicit local development target for %s", (purpose) => {
    const value = "postgresql://fake:fake@127.0.0.1:5432/logistik_web";
    expect(localDatabaseUrl(value, { purpose, nodeEnv: "development" })).toBe(
      value,
    );
  });

  it("allows localhost only for seed", () => {
    const value = "postgres://fake:fake@localhost/logistik_web";
    expect(localDatabaseUrl(value, { purpose: "seed" })).toBe(value);
    expect(() => localDatabaseUrl(value, { purpose: "migrate" })).toThrow();
  });

  it.each(["seed", "migrate"])("refuses production for %s", (purpose) => {
    expect(() =>
      localDatabaseUrl("postgresql://127.0.0.1/logistik_web", {
        purpose,
        nodeEnv: "production",
      }),
    ).toThrow("production");
  });

  it.each([
    undefined,
    "",
    "not a URL",
    "postgresql://127.0.0.1",
    "postgresql://127.0.0.1/logistik_web_test",
    "postgresql://127.0.0.1/production",
    "postgresql://127.0.0.1/logistik_web/other",
    "postgresql://127.0.0.1/logistik%5fweb",
    "postgresql://127.0.0.1/LOGISTIK_WEB",
    "postgresql://db.example.invalid/logistik_web",
    "postgresql://127.0.0.2/logistik_web",
    "postgresql://[::1]/logistik_web",
    "postgresql://127.0.0.1.example.invalid/logistik_web",
    "postgresql://localhost.example.invalid/logistik_web",
    "postgresql://127.0.0.1@db.example.invalid/logistik_web",
    "postgresql://127.0.0.1/logistik_web?host=remote.invalid",
    "postgresql://127.0.0.1/logistik_web?schema=other",
    "postgresql://127.0.0.1/logistik_web?dbname=production",
    "postgresql://127.0.0.1/logistik_web#override",
    "https://127.0.0.1/logistik_web",
    " postgresql://127.0.0.1/logistik_web",
    "postgresql://127.0.0.1/logistik_web\n",
    "postgresql://127.0.0.1\\remote/logistik_web",
  ])("refuses unsafe or malformed target %s for both purposes", (value) => {
    for (const purpose of ["seed", "migrate"]) {
      expect(() => localDatabaseUrl(value, { purpose })).toThrow();
    }
  });

  it("refuses missing or unexpected purpose", () => {
    const value = "postgresql://127.0.0.1/logistik_web";
    expect(() => localDatabaseUrl(value)).toThrow();
    expect(() => localDatabaseUrl(value, { purpose: "reset" })).toThrow();
  });

  it("never exposes credentials in rejection errors", () => {
    const value = "postgresql://fake:DO-NOT-EXPOSE@remote.invalid/production";
    try {
      localDatabaseUrl(value, { purpose: "seed" });
      throw new Error("Expected rejection");
    } catch (error) {
      expect(String(error)).not.toContain("DO-NOT-EXPOSE");
      expect(String(error)).not.toContain(value);
    }
  });
});
