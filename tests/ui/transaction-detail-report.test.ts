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
