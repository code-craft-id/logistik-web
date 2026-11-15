import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { OperationalReportView } from "../../src/features/reports/operational/components/report-view";
import type { OperationalReportResult } from "../../src/features/reports/operational/contracts";
import { parseOperationalFilters } from "../../src/features/reports/operational/filters";

vi.mock("next/form", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("form", props, children),
}));
const base = {
  state: "ready" as const,
  parsed: parseOperationalFilters("manifest", {
    startDate: "2026-11-01",
    endDate: "2026-11-15",
  }).parsed,
  branches: [{ id: 1, name: "FAKE Branch" }],
  total: 21,
  links: { manifest: true, delivery: false, transaction: false },
};
const render = (result: OperationalReportResult) =>
  renderToStaticMarkup(createElement(OperationalReportView, { result }));
it("renders scoped manifest rows with accessible filters/table and no invented Driver/money", () => {
  const html = render({
    ...base,
    kind: "manifest",
    items: [
      {
        id: 1,
        manifestNo: "FAKE-M",
        date: "2026-11-02T00:00:00Z",
        branch: "FAKE Branch",
        type: "Transit",
        vehicle: null,
        courier: "<script>bad</script>",
        status: "Draft",
        assignedTransactions: 0,
      },
    ],
  });
  const host = document.createElement("div");
  host.innerHTML = html;
  expect([...host.querySelectorAll("th")].map((x) => x.textContent)).toEqual([
    "Manifes No.",
    "Tanggal (UTC)",
    "Cabang pemilik",
    "Jenis",
    "Kendaraan",
    "Kurir manifest",
    "Status",
    "Penugasan aktif terlihat",
  ]);
  expect(
    host.querySelector('[aria-label="Scrollable table"][tabindex="0"]'),
  ).not.toBeNull();
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toMatch(/Biaya|Sopir|profit|Ekspor/);
  for (const input of host.querySelectorAll("input:not([type=hidden]),select"))
    expect(host.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
  expect(
    host
      .querySelector('a[aria-label="Halaman berikutnya"]')
      ?.getAttribute("href"),
  ).toContain("page=2");
});
it("preserves per-DRS grain and exposes explicit outcome view without fabricated sheet status", () => {
  const html = render({
    ...base,
    kind: "sheets",
    items: [
      {
        id: 1,
        sheetNo: "FAKE-DRS",
        date: "2026-11-02T00:00:00Z",
        manifestNo: "FAKE-M",
        branch: null,
        courier: null,
        visibleTransactions: 1,
      },
    ],
  });
  expect(html).toContain("DRS No.");
  expect(html).toContain("Transaksi terlihat");
  expect(html).toContain("view=items");
  expect(html).not.toMatch(/>Status<|Sukses|Gagal|Biaya/);
});
it("renders stored outcomes and actual delivered date without interpreting null", () => {
  const html = render({
    ...base,
    kind: "items",
    items: [
      {
        id: 1,
        sheetNo: "FAKE-DRS",
        date: "2026-11-02T00:00:00Z",
        awbNo: null,
        receiverName: "FAKE",
        outcome: "EXCEPTION",
        deliveredAt: null,
        receivedBy: null,
        notes: "<b>note</b>",
      },
    ],
  });
  expect(html).toContain("Hasil tersimpan");
  expect(html).toContain("EXCEPTION");
  expect(html).toContain("Tidak tersedia");
  expect(html).toContain("&lt;b&gt;note&lt;/b&gt;");
});
it("shows raw date-labelled dashboard counts without unauthorized links or synthetic charts", () => {
  const html = render({
    ...base,
    kind: "dashboard",
    items: [],
    counts: { transactions: 4, manifests: 3, sheets: 2, items: 1 },
  });
  expect(html).toContain("Ringkasan Operasional");
  expect(html).toContain("Tanggal transaksi");
  expect(html).toContain("Tanggal manifest");
  expect(html).toContain("Tanggal lembar pengantaran");
  expect(html).not.toMatch(
    /Invoice|Piutang|Penjualan|<svg|href="\/branch-reports\/delivery/,
  );
});
it("distinguishes unavailable vendor, initial, empty and invalid states", () => {
  const vendor = render({
    ...base,
    kind: "vendor",
    state: "unavailable",
    items: [],
  });
  expect(vendor).toContain("Laporan vendor belum tersedia");
  expect(vendor).not.toContain("<form");
  expect(vendor).not.toContain("<table");
  expect(
    render({
      ...base,
      kind: "manifest",
      state: "initial",
      parsed: { status: "initial" },
      items: [],
    }),
  ).toContain("Pilih periode laporan");
  expect(render({ ...base, kind: "manifest", total: 0, items: [] })).toContain(
    "Tidak ada data",
  );
  expect(
    render({
      ...base,
      kind: "manifest",
      state: "invalid",
      parsed: {
        status: "invalid",
        issues: [{ field: "query", message: "Perbaiki filter." }],
      },
      items: [],
    }),
  ).toContain('role="alert"');
});
