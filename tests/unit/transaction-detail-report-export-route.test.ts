import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "../../src/app/(dashboard)/branch-reports/transaction-details/export/route";
import { IdentityError } from "../../src/features/identity/server/access";
import { parseTransactionReportFilters } from "../../src/features/reports/transaction-details/filters";

const { download } = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock(
  "../../src/features/reports/transaction-details/server/context",
  () => ({ transactionReportService: { export: download } }),
);
const url =
  "http://localhost/branch-reports/transaction-details/export?startDate=2026-11-01&endDate=2026-11-15";
beforeEach(() => vi.resetAllMocks());
it("returns UTF8 CSV attachment with private no-store/nosniff headers and a static filename", async () => {
  download.mockResolvedValue('"雪"\r\n');
  const response = await GET(new Request(url));
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("text/csv;charset=utf-8");
  expect(response.headers.get("Content-Disposition")).toBe(
    'attachment; filename="transaction-details.csv"',
  );
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(await response.text()).toBe('"雪"\r\n');
  expect(download).toHaveBeenCalledWith({
    startDate: "2026-11-01",
    endDate: "2026-11-15",
  });
});
it.each([
  "&sortBy=kilo&sortBy=status",
  "&branchId=1&branchId=1",
  "&unknown=secret",
  "&page=0",
])("rejects duplicate or malformed query without silently dropping values: %s", async (extra) => {
  download.mockImplementation(async (query) => {
    if (parseTransactionReportFilters(query).status !== "valid")
      throw new IdentityError("INVALID_FILTER", 400);
    return "unexpected";
  });
  const response = await GET(new Request(url + extra));
  expect(response.status).toBe(400);
  expect(response.headers.get("Content-Disposition")).toBeNull();
  expect(await response.text()).not.toContain("secret");
});
it.each([
  401, 403, 400, 422, 500,
])("sanitizes %i failures and keeps errors private without attachment headers", async (status) => {
  download.mockRejectedValue(
    status === 500
      ? new Error("postgres://secret internal stack")
      : new IdentityError(
          "FAILURE",
          status,
          "postgres://secret internal stack",
        ),
  );
  const response = await GET(new Request(url));
  expect(response.status).toBe(status);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Content-Disposition")).toBeNull();
  expect(await response.text()).not.toMatch(/secret|postgres|stack/);
});
