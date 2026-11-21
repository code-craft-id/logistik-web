import type { ReactElement } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import DashboardPage from "../../src/app/(dashboard)/dashboard/page";
import { DashboardOverview } from "../../src/features/dashboard/components/dashboard-overview";
import { OperationalReportPage } from "../../src/features/reports/operational/components/report-page";

const { currentIdentity, redirect } = vi.hoisted(() => ({
  currentIdentity: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("LOGIN_REDIRECT");
  }),
}));
vi.mock("../../src/features/identity/server/context", () => ({
  currentIdentity,
}));
vi.mock("../../src/features/reports/operational/server/context", () => ({
  operationalReportService: { read: vi.fn() },
}));
vi.mock("next/navigation", () => ({ redirect }));
beforeEach(() => vi.resetAllMocks());

const actor = (permissions: { resource: string; action: string }[]) => ({
  id: 7,
  status: "ACTIVE",
  deletedAt: null,
  branchIds: [1],
  group: { status: "ACTIVE", deletedAt: null, permissions },
});
async function render() {
  const page = DashboardPage({ searchParams: Promise.resolve({}) });
  const content = page.props.children as ReactElement<{
    searchParams: Promise<Record<string, string>>;
  }>;
  const component = content.type as (props: unknown) => Promise<ReactElement>;
  return component(content.props);
}

it("keeps /dashboard reachable for users without dashboard_report rights", async () => {
  currentIdentity.mockResolvedValue({
    actor: actor([{ resource: "ticket", action: "view" }]),
  });
  expect((await render()).type).toBe(DashboardOverview);
});

it("shows operational counts only with dashboard_report.view", async () => {
  currentIdentity.mockResolvedValue({
    actor: actor([{ resource: "dashboard_report", action: "view" }]),
  });
  const result = await render();
  expect(result.type).toBe(OperationalReportPage);
  expect(result.props).toMatchObject({ kind: "dashboard" });
});

it("redirects anonymous visitors to login", async () => {
  currentIdentity.mockResolvedValue(null);
  await expect(render()).rejects.toThrow("LOGIN_REDIRECT");
});
