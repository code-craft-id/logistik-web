import { beforeEach, expect, it, vi } from "vitest";
import { IdentityError } from "../../src/features/identity/server/access";
import { TransactionReportPage } from "../../src/features/reports/transaction-details/components/report-page";

const { read, redirect } = vi.hoisted(() => ({
  read: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("LOGIN_REDIRECT");
  }),
}));
vi.mock(
  "../../src/features/reports/transaction-details/server/context",
  () => ({ transactionReportService: { read } }),
);
vi.mock("next/navigation", () => ({ redirect }));
beforeEach(() => vi.resetAllMocks());
it("redirects anonymous callers and sanitizes denied scope without swallowing database errors", async () => {
  read.mockRejectedValueOnce(new IdentityError("UNAUTHENTICATED", 401));
  await expect(TransactionReportPage({ query: {} })).rejects.toThrow(
    "LOGIN_REDIRECT",
  );
  expect(redirect).toHaveBeenCalledWith("/login");
  read.mockRejectedValueOnce(new IdentityError("FORBIDDEN", 403));
  expect((await TransactionReportPage({ query: {} })).props.title).toBe(
    "Akses ditolak",
  );
  read.mockRejectedValueOnce(new Error("DB unavailable"));
  await expect(TransactionReportPage({ query: {} })).rejects.toThrow(
    "DB unavailable",
  );
});
it("passes only the independently authorized service result into the view", async () => {
  const result = {
    state: "initial",
    parsed: { status: "initial" },
    branches: [],
    items: [],
    total: 0,
  };
  read.mockResolvedValue(result);
  expect((await TransactionReportPage({ query: {} })).props.result).toBe(
    result,
  );
});
