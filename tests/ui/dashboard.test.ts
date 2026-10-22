import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../../src/components/shell/app-shell";
import { DashboardFilters } from "../../src/features/dashboard/components/dashboard-filters";
import { DashboardOverview } from "../../src/features/dashboard/components/dashboard-overview";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("legacy dashboard supported presentation", () => {
  it("applies draft filters only on Show and resets both draft and applied selection", async () => {
    await act(async () => root.render(createElement(DashboardFilters)));
    const form = container.querySelector("form");
    const field =
      container.querySelector<HTMLInputElement>("#dashboard-period");
    if (!form || !field) throw new Error("Dashboard filters missing");
    await act(async () => {
      field.value = "2026-10";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.querySelector("output")?.textContent).toBe(
      "No preview selection applied.",
    );
    await act(async () =>
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      ),
    );
    expect(container.querySelector("output")?.textContent).toContain(
      "period 2026-10",
    );
    expect(container.querySelector("output")?.textContent).toContain(
      "Data remains unavailable",
    );
    await act(async () => {
      field.value = "2026-11";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.querySelector("output")?.textContent).toContain(
      "period 2026-10",
    );
    await act(async () => form.reset());
    expect(field.value).toBe("");
    expect(container.querySelector("output")?.textContent).toBe(
      "No preview selection applied.",
    );
    expect(
      container.querySelector<HTMLSelectElement>("#dashboard-branch")?.disabled,
    ).toBe(true);
  });

  it("links implemented previews and labels chart illustrations without fabricating metrics", async () => {
    await act(async () => root.render(createElement(DashboardOverview)));
    expect(
      Array.from(container.querySelectorAll("a")).map((link) =>
        link.getAttribute("href"),
      ),
    ).toEqual([
      "/ui-examples",
      "/bookings",
      "/transactions",
      "/shipment-status",
      "/transactions",
      "/manifest",
      "/manifest",
      "/manifest",
      "/branch-reports/delivery",
      "/akunting",
      "/akunting",
      "/branch-reports/transaction-details",
      "/branch-reports/daily-turnover-summary",
      "/financial-reports",
    ]);
    expect(container.querySelectorAll('svg[role="img"]')).toHaveLength(4);
    expect(container.textContent).toContain("Synthetic illustration");
    expect(container.textContent).toContain("Filters do not recalculate");
    expect(container.querySelectorAll("dd")).toHaveLength(11);
    for (const value of container.querySelectorAll("dd"))
      expect(value.textContent).toBe("Unavailable");
    expect(container.textContent).not.toContain("Last Updated");
    expect(container.querySelector("h1")?.textContent).toBe("Dashboard");
  });

  it("opens the complete compact drawer and dismisses it after selecting Dashboard", async () => {
    await act(async () =>
      root.render(createElement(AppShell, null, "Dashboard")),
    );
    const trigger = container.querySelector<HTMLButtonElement>(
      '[aria-label="Open navigation"]',
    );
    if (!trigger) throw new Error("Navigation trigger missing");
    trigger.focus();
    await act(async () => trigger.click());
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog?.getAttribute("aria-describedby")).toBeTruthy();
    const nav = dialog?.querySelector('nav[aria-label="Mobile navigation"]');
    expect(nav?.querySelector('[aria-current="page"]')?.textContent).toBe(
      "Dashboard",
    );
    expect(nav?.textContent).toContain("Provider inventory");
    expect(nav?.textContent).toContain("More previews");
    const master = Array.from(nav?.querySelectorAll("button") ?? []).find(
      (button) => button.textContent === "Master Data",
    );
    await act(async () => master?.click());
    expect(master?.getAttribute("aria-expanded")).toBe("true");
    const section = Array.from(nav?.querySelectorAll("button") ?? []).find(
      (button) => button.textContent === "Logistik4",
    );
    await act(async () => section?.click());
    expect(section?.getAttribute("aria-expanded")).toBe("true");
    const dashboard = nav?.querySelector<HTMLAnchorElement>('a[href="/"]');
    dashboard?.addEventListener("click", (event) => event.preventDefault());
    await act(async () => dashboard?.click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
