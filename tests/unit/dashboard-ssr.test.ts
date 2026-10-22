import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DashboardChart } from "../../src/features/dashboard/components/dashboard-chart";

describe("dashboard chart server rendering", () => {
  it("emits single-string accessible SVG titles without React SSR errors", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      for (const kind of ["monthly", "sales", "invoices", "daily"] as const) {
        const html = renderToString(
          createElement(DashboardChart, { kind, label: "Chart preview" }),
        );
        expect(html).toContain(
          "<title>Chart preview — synthetic illustration</title>",
        );
        expect(html).not.toContain("<!-- -->");
      }
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
  });
});
