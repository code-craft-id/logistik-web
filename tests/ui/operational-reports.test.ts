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
const render = (
  result: OperationalReportResult,
  query?: Record<string, string | string[] | undefined>,
) =>
  renderToStaticMarkup(createElement(OperationalReportView, { result, query }));
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
        originBranch: null,
        destinationBranch: "FAKE destination",
        type: "Transit",
        vehicle: null,
        courier: "<script>bad</script>",
        status: "Draft",
        assignedTransactions: 0,
        totalKoli: 0,
        totalKilo: "0",
        totalVolume: "0",
      },
    ],
  });
  const host = document.createElement("div");
  host.innerHTML = html;
  expect([...host.querySelectorAll("th")].map((x) => x.textContent)).toEqual([
    "No.",
    "Manifes No.",
    "Tanggal (Asia/Jakarta)",
    "Cabang pemilik",
    "Asal (cabang tersimpan)",
    "Tujuan (cabang tersimpan)",
    "Jenis",
    "Kendaraan",
    "Kurir manifest",
    "Status",
    "Penugasan aktif terlihat",
    "Koli terlihat",
    "Berat terlihat (kg)",
    "Volume terlihat",
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
        totalKoli: null,
        totalKilo: "0.3",
        totalVolume: null,
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
  expect(html).toContain("Dashboard");
  expect(html).toContain("Tanggal transaksi");
  expect(html).toContain("Tanggal manifest");
  expect(html).toContain("Tanggal lembar pengantaran");
  expect(html).not.toMatch(
    /Invoice|Piutang|Penjualan|Grafik|href="\/branch-reports\/delivery/,
  );
});
it("renders legacy dashboard widgets from sources and hides gated detail", () => {
  const counts = { transactions: 4, manifests: 3, sheets: 2, items: 1 };
  const html = render({
    ...base,
    kind: "dashboard",
    items: [],
    counts,
    insights: {
      actions: [{ label: "Entry AWB", href: "/transactions/new" }],
      awbPending: 3,
      daily: [
        { date: "2026-11-01", count: 0 },
        { date: "2026-11-02", count: 4 },
      ],
      statuses: [
        { status: "Delivered", count: 1 },
        { status: "Open", count: 3 },
      ],
      recent: [
        {
          id: 1,
          awbNo: "<b>FAKE</b>",
          createdBy: "FAKE User",
          createdAt: "2026-11-02T03:04:00.000Z",
        },
      ],
      invoices: null,
      analytics: null,
    },
  });
  expect(html.indexOf("Quick Action")).toBeLessThan(
    html.indexOf("Lembar pengantaran terlihat"),
  );
  expect(html).toContain('href="/transactions/new"');
  expect(html).toContain("AWB Pending");
  expect(html).toContain("1 (25.00%)");
  expect(html).toContain("&lt;b&gt;FAKE&lt;/b&gt;");
  expect(html).not.toContain("Invoice Outstanding");
  expect(html).not.toContain("Analytics &amp; Nominal");
  expect(html).toContain("Ringkasan Eksekutif");
  expect(html).toContain("Total 4 AWB dalam periode ini.");
  expect(html).toContain("Delivery success mencapai 25%.");
  expect(html).toContain("Grafik Transaksi Harian");
  expect(html).toContain("2026-11-02: 4 AWB");
  expect(html).toContain("Tertinggi 4 AWB pada 2026-11-02");
});
it("renders money analytics, top customers and POD outstanding", () => {
  const html = render({
    ...base,
    kind: "dashboard",
    items: [],
    counts: { transactions: 2, manifests: 0, sheets: 0, items: 0 },
    insights: {
      actions: [],
      awbPending: 0,
      daily: [{ date: "2026-11-01", count: 2 }],
      statuses: [{ status: "Delivered", count: 2 }],
      recent: [],
      invoices: { unpaid: 1, partial: 0, paid: 0, outstanding: "1500.00" },
      analytics: {
        amount: "300000.00",
        payments: {
          cash: "100000.00",
          kredit: "200000.00",
          cod: "0.00",
          transfer: "0.00",
          other: "0.00",
        },
        awb: 2,
        average: "150000",
        activeCustomers: 1,
        previous: { amount: "150000.00", awb: 1 },
        topCustomers: [
          { name: "FAKE Customer", amount: "300000.00", previous: "0.00" },
        ],
        podOutstanding: {
          total: 2,
          rows: [{ destination: "FAKE Branch", count: 2 }],
        },
      },
    },
  });
  expect(html).toContain("Rp 300.000");
  expect(html).toContain("+100% vs");
  expect(html).toContain("Rata-rata / AWB");
  expect(html).toContain("1. FAKE Customer");
  expect(html).toContain("Tidak ada data sebelumnya");
  expect(html).toContain("FAKE Branch");
  expect(html).toContain("Prioritaskan follow up 2 POD outstanding.");
  expect(html).toContain("Tagih 1 invoice yang belum lunas.");
  expect(html).toContain("Rp 1.500");
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

const invalidManifest: OperationalReportResult = {
  ...base,
  kind: "manifest",
  state: "invalid",
  parsed: {
    status: "invalid",
    issues: [{ field: "endDate", message: "Periode maksimal 31 hari." }],
  },
  items: [],
  total: 0,
};
function formValues(html: string) {
  const host = document.createElement("div");
  host.innerHTML = html;
  return {
    start: host.querySelector<HTMLInputElement>('input[name="startDate"]')
      ?.value,
    end: host.querySelector<HTMLInputElement>('input[name="endDate"]')?.value,
    search: host.querySelector<HTMLInputElement>('input[name="search"]')?.value,
    branch: host.querySelector<HTMLSelectElement>('select[name="branchId"]')
      ?.value,
    size: host.querySelector<HTMLInputElement>('input[name="pageSize"]')?.value,
  };
}
it("preserves safe input values on a fresh invalid SSR without treating the range as valid", () => {
  const html = render(invalidManifest, {
    startDate: "2026-11-01",
    endDate: "2026-12-02",
    search: "NO_MATCH",
    branchId: "1",
    pageSize: "1",
  });
  expect(formValues(html)).toEqual({
    start: "2026-11-01",
    end: "2026-12-02",
    search: "NO_MATCH",
    branch: "1",
    size: "1",
  });
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("<table");
});
it("does not reflect malformed, duplicate, oversized, forged or unknown query values", () => {
  for (const query of [
    {
      startDate: "2026-02-30",
      endDate: "<date>",
      search: ["DUPLICATE_SECRET"],
      branchId: "999",
      pageSize: "01",
      password: "UNKNOWN_SECRET",
    },
    {
      startDate: ["2026-11-01"],
      endDate: ["2026-11-15"],
      search: "OVERSIZED_SECRET".repeat(4),
      branchId: ["1"],
      pageSize: ["1"],
      token: "UNKNOWN_SECRET",
    },
  ]) {
    const html = render(invalidManifest, query);
    expect(formValues(html)).toEqual({
      start: "",
      end: "",
      search: "",
      branch: "",
      size: "20",
    });
    expect(html).not.toMatch(
      /DUPLICATE_SECRET|OVERSIZED_SECRET|UNKNOWN_SECRET|value="999"|2026-02-30/,
    );
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("<table");
  }
});
it("uses normalized service filters rather than display-only query on valid results", () => {
  const html = render(
    { ...base, kind: "manifest", items: [], total: 0 },
    {
      startDate: "2030-01-01",
      endDate: "2030-01-02",
      branchId: "1",
      search: "RAW_QUERY",
      pageSize: "1",
    },
  );
  expect(formValues(html)).toEqual({
    start: "2026-11-01",
    end: "2026-11-15",
    search: "",
    branch: "",
    size: "20",
  });
  expect(html).not.toContain("RAW_QUERY");
});
