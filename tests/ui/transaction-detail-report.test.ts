import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TransactionReportView } from "../../src/features/reports/transaction-details/components/report-view";
import type { TransactionReportResult } from "../../src/features/reports/transaction-details/contracts";
import { parseTransactionReportFilters } from "../../src/features/reports/transaction-details/filters";

vi.mock("next/form", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("form", props, children),
}));
const ready: TransactionReportResult = {
  state: "ready",
  parsed: parseTransactionReportFilters({
    startDate: "2026-11-01",
    endDate: "2026-11-15",
    search: "FAKE",
  }),
  branches: [{ id: 1, name: "FAKE Branch" }],
  items: [
    {
      id: 1,
      awbNo: "FAKE-42",
      transactionDate: "2026-11-02T00:00:00.000Z",
      originBranch: "FAKE Branch",
      destinationBranch: null,
      senderName: "<script>bad</script>",
      receiverName: "FAKE Receiver",
      koli: 0,
      kilo: "12.34",
      status: "Cancelled",
    },
  ],
  total: 21,
};
const render = (result: TransactionReportResult) =>
  renderToStaticMarkup(createElement(TransactionReportView, { result }));
describe("real report UI", () => {
  it("renders nine real columns, exact values and accessible scrolling without mutation/detail links", () => {
    const html = render(ready);
    const host = document.createElement("div");
    host.innerHTML = html;
    expect([...host.querySelectorAll("th")].map((x) => x.textContent)).toEqual([
      "AWB No.",
      "tanggal (UTC)",
      "Asal",
      "Tujuan",
      "Pengirim",
      "Penerima Barang",
      "Koli",
      "Kilo",
      "Status Pengiriman",
    ]);
    expect(
      host.querySelector('[aria-label="Scrollable table"][tabindex="0"]'),
    ).not.toBeNull();
    expect(html).toContain("12.34");
    expect(html).toContain("Cancelled");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toMatch(
      /href="\/transactions|Ekspor|Tarif|Total Biaya|Approval/,
    );
    expect(
      host.querySelector('input[name="search"]')?.getAttribute("maxlength"),
    ).toBe("50");
    for (const input of host.querySelectorAll("input,select"))
      expect(host.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    const next = host.querySelector('a[aria-label="Halaman berikutnya"]');
    expect(next?.getAttribute("href")).toContain("search=FAKE");
    expect(next?.getAttribute("href")).toContain("page=2");
  });
  it("distinguishes initial, empty and invalid states with recovery", () => {
    expect(
      render({
        ...ready,
        state: "initial",
        parsed: { status: "initial" },
        items: [],
        total: 0,
      }),
    ).toContain("Pilih periode laporan");
    expect(render({ ...ready, items: [], total: 0 })).toContain(
      "Tidak ada transaksi",
    );
    expect(
      render({
        ...ready,
        state: "invalid",
        parsed: {
          status: "invalid",
          issues: [
            {
              field: "endDate",
              message: "Periode UTC harus berurutan dan maksimal 31 hari.",
            },
          ],
        },
        items: [],
        total: 0,
      }),
    ).toContain('role="alert"');
  });
});

it("retains endpoint filters and sort across pagination and resets page on form submit", () => {
  const host = document.createElement("div");
  host.innerHTML = render({
    ...ready,
    branches: [
      { id: 1, name: "Origin" },
      { id: 2, name: "Destination" },
    ],
    parsed: parseTransactionReportFilters({
      startDate: "2026-11-01",
      endDate: "2026-11-15",
      branchId: "1",
      originBranchId: "1",
      destinationBranchId: "2",
      sortBy: "kilo",
      sortDirection: "asc",
      page: "2",
      pageSize: "1",
    }),
  });
  const next = new URL(
    host
      .querySelector('a[aria-label="Halaman berikutnya"]')
      ?.getAttribute("href") ?? "/missing",
    "http://localhost",
  );
  expect(Object.fromEntries(next.searchParams)).toMatchObject({
    branchId: "1",
    originBranchId: "1",
    destinationBranchId: "2",
    sortBy: "kilo",
    sortDirection: "asc",
    page: "3",
  });
  expect(host.querySelector('[name="page"]')).toBeNull();
  for (const [name, value] of Object.entries({
    originBranchId: "1",
    destinationBranchId: "2",
    sortBy: "kilo",
    sortDirection: "asc",
  })) {
    const select = host.querySelector(
      `select[name="${name}"]`,
    ) as HTMLSelectElement;
    expect(
      select?.querySelector("option[selected]")?.getAttribute("value"),
    ).toBe(value);
    expect(host.querySelector(`label[for="${select?.id}"]`)).not.toBeNull();
  }
});
it("preserves only bounded valid authorized controls when another query field is invalid", () => {
  const query = {
    startDate: "2026-11-01",
    endDate: "2026-11-15",
    search: '<img src=x onerror="bad">',
    branchId: "1",
    originBranchId: "1",
    destinationBranchId: "999",
    sortBy: "kilo",
    sortDirection: "asc",
    pageSize: "10",
    unknown: "secret",
  };
  const invalid: TransactionReportResult = {
    ...ready,
    state: "invalid",
    parsed: parseTransactionReportFilters(query),
    items: [],
    total: 0,
  };
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    createElement(TransactionReportView, { result: invalid, query }),
  );
  expect(
    (host.querySelector('[name="startDate"]') as HTMLInputElement)?.value,
  ).toBe("2026-11-01");
  expect(
    (host.querySelector('[name="search"]') as HTMLInputElement)?.value,
  ).toBe(query.search);
  expect(
    (host.querySelector('[name="originBranchId"]') as HTMLSelectElement)
      ?.querySelector("option[selected]")
      ?.getAttribute("value"),
  ).toBe("1");
  expect(
    (host.querySelector('[name="destinationBranchId"]') as HTMLSelectElement)
      ?.value,
  ).toBe("");
  expect(
    (host.querySelector('[name="sortBy"]') as HTMLSelectElement)
      ?.querySelector("option[selected]")
      ?.getAttribute("value"),
  ).toBe("kilo");
  expect(host.querySelector("img")).toBeNull();
  expect(host.querySelector("table")).toBeNull();
  expect(host.innerHTML).not.toContain("secret");
  host.innerHTML = renderToStaticMarkup(
    createElement(TransactionReportView, {
      result: invalid,
      query: {
        startDate: "2026-02-30",
        search: "x".repeat(51),
        originBranchId: ["1"],
        sortBy: "__proto__",
        sortDirection: "ASC",
        pageSize: "999",
      },
    }),
  );
  expect(
    (host.querySelector('[name="startDate"]') as HTMLInputElement)?.value,
  ).toBe("");
  expect(
    (host.querySelector('[name="search"]') as HTMLInputElement)?.value,
  ).toBe("");
  expect(
    (host.querySelector('[name="sortBy"]') as HTMLSelectElement)
      ?.querySelector("option[selected]")
      ?.getAttribute("value"),
  ).toBe("transactionDate");
  expect(
    (host.querySelector('[name="sortDirection"]') as HTMLSelectElement)
      ?.querySelector("option[selected]")
      ?.getAttribute("value"),
  ).toBe("desc");
  expect(
    (host.querySelector('[name="pageSize"]') as HTMLInputElement)?.value,
  ).toBe("20");
});
