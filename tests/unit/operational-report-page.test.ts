import { beforeEach, expect, it, vi } from "vitest";
import { IdentityError } from "../../src/features/identity/server/access";
import { OperationalReportPage } from "../../src/features/reports/operational/components/report-page";

const { read, redirect } = vi.hoisted(() => ({
  read: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("LOGIN_REDIRECT");
  }),
}));
vi.mock("../../src/features/reports/operational/server/context", () => ({
  operationalReportService: { read },
}));
vi.mock("next/navigation", () => ({ redirect }));
beforeEach(() => vi.resetAllMocks());
it("redirects anonymous requests and gives denied dashboard users a safe profile escape", async () => {
  read.mockRejectedValueOnce(new IdentityError("UNAUTHENTICATED", 401));
  await expect(
    OperationalReportPage({ kind: "dashboard", query: {} }),
  ).rejects.toThrow("LOGIN_REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/login");
  read.mockRejectedValueOnce(new IdentityError("FORBIDDEN", 403));
  const denied = await OperationalReportPage({ kind: "dashboard", query: {} });
  expect(denied.props.title).toBe("Akses ditolak");
  expect(denied.props.action.props.href).toBe("/profile");
  read.mockRejectedValueOnce(new Error("DB failure"));
  await expect(
    OperationalReportPage({ kind: "manifest", query: {} }),
  ).rejects.toThrow("DB failure");
});
