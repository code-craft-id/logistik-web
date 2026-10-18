import { describe, expect, it } from "vitest";
import { testDatabaseUrl } from "../support/test-database-url";

const development = "postgresql://postgres@127.0.0.1:5432/logistik-web";
const valid = "postgresql://postgres@127.0.0.1:5432/logistik-web_test";

describe("integration database safety", () => {
  it("accepts a separate test database", () => {
    expect(testDatabaseUrl(valid, development)).toBe(valid);
  });

  it.each([
    undefined,
    "",
    "not-a-url",
    "https://localhost/app_test",
    "postgresql://localhost/",
    "postgresql://localhost/logistik-web",
    "postgresql://localhost/%ZZ_test",
    "postgresql://localhost/app_test/other",
    "postgresql://localhost/app_test?dbname=production",
    "postgresql://localhost/app_test?host=elsewhere",
    "postgresql://localhost/app_test#other",
  ])("rejects unsafe test URL %s", (value) => {
    expect(() => testDatabaseUrl(value, development)).toThrow();
  });

  it.each([
    valid,
    "postgres://other@localhost/logistik-web_test",
    "postgresql://postgres@[::1]:5432/logistik-web_%74est",
  ])("rejects the same database despite URL spelling: %s", (value) => {
    expect(() => testDatabaseUrl(value, valid)).toThrow(
      "must not target DATABASE_URL",
    );
  });

  it("rejects an invalid development URL instead of bypassing comparison", () => {
    expect(() => testDatabaseUrl(valid, "invalid")).toThrow();
  });
});
