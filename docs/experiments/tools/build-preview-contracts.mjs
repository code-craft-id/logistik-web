import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync as writeBytes,
} from "node:fs";
import path from "node:path";

function writeFileSync(file, source) {
  const formatted = execFileSync(
    process.execPath,
    [
      path.resolve("node_modules/@biomejs/biome/bin/biome"),
      "format",
      "--stdin-file-path",
      file,
    ],
    { input: source, encoding: "utf8" },
  );
  if (!existsSync(file) || readFileSync(file, "utf8") !== formatted)
    writeBytes(file, formatted);
}

const inventory = JSON.parse(
  readFileSync("docs/experiments/legacy-ui-inventory.json", "utf8"),
);
const bySource = new Map(
  inventory.components.map((component) => [component.source, component]),
);
const component = (source) => {
  const found = bySource.get(`src/${source}`);
  if (!found) throw Error(`Missing source ${source}`);
  return found;
};
const slug = (label) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const fields = (source) => component(source).fields;
const columns = (source) =>
  component(source).columns.filter(
    (column) => !/^(Aksi|Actions)$/i.test(column.label),
  );
const colLabels = (labels) =>
  labels.map((label, index) => ({ key: `column-${index}`, label }));
const cleanColumns = (items) => {
  const seen = new Set();
  return (items ?? []).filter((column) => {
    if (seen.has(column.key) || /^(Aksi|Actions)$/i.test(column.label))
      return false;
    seen.add(column.key);
    return true;
  });
};
const dateFilters = [
  { key: "dateFrom", label: "Tanggal Dari", type: "date" },
  { key: "dateTo", label: "Tanggal Sampai", type: "date" },
];
const branchFilter = {
  key: "branch",
  label: "Cabang",
  type: "select",
  options: ["Preview A", "Preview B"],
};
const base = (label, cols = [], form = []) => ({
  id: slug(label),
  label,
  columns: cleanColumns(cols).map((column) => {
    const match =
      form.find(
        (field) =>
          field.label.toLowerCase() === column.label.toLowerCase() &&
          (!field.group || field.group === label),
      ) ??
      form.find(
        (field) => field.label.toLowerCase() === column.label.toLowerCase(),
      );
    return match ? { ...column, key: match.key } : column;
  }),
  fields: form,
});
function crudTab(tab) {
  const view = base(
    tab.label,
    [
      { key: "no", label: "No" },
      ...(tab.fields ?? [])
        .filter((f) => f.table !== false)
        .map((f) => ({ key: f.key, label: f.label, type: f.type })),
    ],
    tab.fields ?? [],
  );
  if (tab.tabs?.length) view.children = tab.tabs.map(crudTab);
  if (tab.actions?.includes("Lihat Pesan WhatsApp")) {
    view.tools = tab.actions;
    view.actionForms = {
      "Lihat Pesan WhatsApp": {
        ...base("Pesan WhatsApp"),
        fields: [
          ["transaksi", "Message WA Transaksi", ["Pengirim", "Penerima"]],
          ["shipment", "Message WA Shipment Status", ["Pengirim"]],
          ["delivery", "Message WA Delivery Sheet", ["Penerima"]],
        ].flatMap(([key, group, sections]) =>
          sections.flatMap((section) => [
            {
              key: `${key}.${section}.recipient`,
              label: "Penerima",
              group,
              section,
            },
            {
              key: `${key}.${section}.message`,
              label: "Message",
              type: "textarea",
              group,
              section,
            },
            {
              key: `${key}.${section}.status`,
              label: "Status",
              type: "checkbox",
              group,
              section,
            },
          ]),
        ),
      },
    };
  }
  if (/Tanda Tangan|Data Bank|Dompet|WA Notif/.test(tab.label))
    view.filters = [
      {
        key: "parentCompany",
        label: "Perusahaan",
        type: "select",
        options: ["Preview A", "Preview B"],
      },
    ];
  return view;
}
const domains = {
  identity: {},
  organization: {},
  "master-data": {},
  sales: {},
  shipments: {},
  reports: {},
  accounting: {},
  ticketing: {},
  dashboard: {},
};
const customTitles = {
  "/transactions": "On Site Outbound",
  "/bookings": "Kelola Booking",
  "/marketing": "Pemasaran/Penjualan",
  "/vendor": "Data Vendor",
  "/logistics/areas": "Logistik",
  "/manifest": "Daftar Manifest",
};
function domainFor(route) {
  if (
    [
      "/login",
      "/profile",
      "/group-user",
      "/user-management",
      "/hak-akses-menu",
    ].includes(route)
  )
    return "identity";
  if (route === "/office") return "organization";
  if (
    route.startsWith("/logistics/") ||
    ["/vendor", "/shipment-status"].includes(route)
  )
    return "master-data";
  if (route === "/marketing") return "sales";
  if (["/transactions", "/bookings", "/manifest"].includes(route))
    return "shipments";
  if (route.includes("reports")) return "reports";
  if (["/akunting", "/perkiraan"].includes(route)) return "accounting";
  if (route === "/ticketting") return "ticketing";
  return "dashboard";
}
for (const route of inventory.routes) {
  const info = bySource.get(route.source);
  const domain = domainFor(route.path);
  const title =
    customTitles[route.path] ??
    info.config?.title ??
    (route.path === "/courier-reports" ? "Laporan Kurir" : info.headings[0]) ??
    route.component;
  const screen = {
    path: route.path,
    title,
    source: route.source,
    kind:
      info.columns.length || info.config || info.fields.length
        ? "workspace"
        : "heading",
    integration: `Awaiting ${domain === "identity" ? "PLT-01 identity, session and access contracts" : domain === "reports" ? "approved report definitions and source queries" : domain === "accounting" ? "approved accounting and posting rules" : "the owning PLT/domain workflow"}.`,
    views: [],
  };
  if (info.config) screen.views = info.config.tabs.map(crudTab);
  else screen.views = [base(title, info.columns, info.fields)];
  if (route.path === "/") {
    screen.kind = "heading";
    screen.views = [];
  }
  if (route.path === "/group-user")
    screen.views = [
      base(title, columns("pages/setting/GroupUser.jsx"), [
        ...info.fields.map((f) => ({
          ...f,
          required: f.key === "level" || f.required,
        })),
        { key: "status", label: "Status", type: "checkbox" },
      ]),
    ];
  if (route.path === "/user-management")
    screen.views = [
      base("User", columns("pages/setting/UserManagement.jsx"), [
        ...info.fields,
        { key: "active", label: "Aktif", type: "checkbox" },
      ]),
    ];
  if (route.path === "/vendor") {
    screen.views = info.tabs.map((tab) => ({
      ...base(tab, colLabels(info.headerSets[tab] ?? []), info.fields),
      formGroups: info.tabs,
    }));
  }
  if (route.path === "/marketing") {
    const customer = component("features/marketing/constants/customer.js")
      .configs.CUSTOMER_CONFIG;
    const consignee = component("features/marketing/constants/consignee.js")
      .configs.CONSIGNEE_CONFIG;
    const customerForm = component(
      "features/marketing/components/CustomerForm.jsx",
    );
    screen.kind = "workspace";
    screen.views = [
      {
        ...base("Customer", customer.columns, customerForm.fields),
        formGroups: customerForm.tabs,
        actions: ["Detail", ...customer.actions],
        tools: customer.tools,
        toolsAsMenu: true,
      },
      {
        ...base("Consignee", consignee.columns, consignee.fields),
        actions: ["Detail", ...consignee.actions],
        tools: consignee.tools,
        toolsAsMenu: true,
      },
    ];
  }
  if (["/transactions", "/bookings"].includes(route.path)) {
    const feature = route.path === "/transactions" ? "transaction" : "booking";
    screen.kind = "workspace";
    const fs = fields(
      `features/${feature}/components/${feature === "transaction" ? "Transaction" : "Booking"}Form.jsx`,
    );
    screen.views = [
      {
        ...base(title, columns(`features/${feature}/constants/columns.js`), fs),
        filters: [],
        searchLabel: "Search",
        createLabel:
          route.path === "/transactions" ? "Tambah AWB" : "Tambah Booking",
        tools:
          route.path === "/transactions"
            ? ["Template Import", "Import Data"]
            : [],
        actions: ["Detail", "Edit", "Delete"],
      },
    ];
  }
  if (route.path === "/manifest") {
    screen.kind = "workspace";
    screen.views = [
      {
        ...base(
          "Manifest",
          columns("features/manifest/constants/manifestColumns.js"),
          fields("features/manifest/components/ManifestForm.jsx"),
        ),
        inlineForm: true,
        searchLabel: "Search Manifest No",
        filters: [
          { key: "dateFrom", label: "Filter Periode - Dari", type: "date" },
          { key: "dateTo", label: "Filter Periode - Sampai", type: "date" },
        ],
        tools: ["Export Excel"],
      },
    ];
  }
  if (route.path === "/akunting")
    screen.views = info.tabs.map((tab, index) =>
      base(
        tab,
        columns("pages/akunting/Akunting.jsx").filter(
          (field) => index % 2 === 0 || !/kode/i.test(field.label),
        ),
        info.fields
          .filter((field) => index % 2 === 0 || !/kode/i.test(field.label))
          .map((field) => ({ ...field, required: true })),
      ),
    );
  if (route.path === "/perkiraan")
    screen.views = [
      base(title, info.columns, [
        ...info.fields,
        { key: "status", label: "Status", type: "checkbox" },
      ]),
    ];
  if (domain === "reports") {
    screen.kind = "workspace";
    screen.views = [
      {
        ...base(title, info.columns, []),
        filters: [
          ...(info.reportProps?.dateField ? dateFilters : []),
          ...(info.reportProps?.branchField ? [branchFilter] : []),
          ...(info.reportProps?.selectFilters ?? []).map((field) => ({
            ...field,
            type: "select",
          })),
        ],
        summaries: info.reportProps?.summaries ?? [],
        tools: ["Export Excel"],
        actions: [],
      },
    ];
    if (route.path === "/branch-reports") {
      screen.kind = "index";
      screen.views = [];
      screen.links = inventory.routes
        .filter((r) => r.path.startsWith("/branch-reports/"))
        .map((r) => ({
          label: bySource.get(r.source).headings[0],
          href: r.path,
        }));
    }
    if (route.path === "/branch-reports/awb")
      screen.views = info.tabs.map((tab, index) => ({
        ...base(
          tab,
          info.columnSets[
            index === 0 ? "TERTUNDA_COLUMNS" : "TERMANIFEST_COLUMNS"
          ],
          [],
        ),
        filters: [
          ...(index
            ? [
                { key: "month", label: "Bulan", type: "month" },
                { key: "pengguna", label: "Pengguna", type: "select" },
              ]
            : []),
          { key: "tujuan", label: "Tujuan", type: "select" },
        ],
        tools: ["Export Excel"],
        actions: ["Detail"],
        detailLabels: index ? ["Manifes No.", "Tujuan"] : ["AWB No.", "Tujuan"],
      }));
    if (route.path === "/customer-reports")
      screen.views = info.tabs.map((tab, index) => ({
        ...base(
          tab,
          info.columnSets[
            index === 0
              ? "TAB1_COLUMNS"
              : index === 2
                ? "TAB3_COLUMNS"
                : index === 3
                  ? "exportColumns"
                  : "TAB2_COLUMNS"
          ],
          [],
        ),
        filters:
          index === 1
            ? [
                { key: "dateFrom", label: "Start Date", type: "date" },
                { key: "dateTo", label: "End Date", type: "date" },
                { key: "origin", label: "Asal", type: "select" },
                { key: "destination", label: "Tujuan", type: "select" },
                { key: "customer", label: "Customer", type: "select" },
              ]
            : index === 2
              ? [
                  { key: "dateFrom", label: "Periode Dari", type: "date" },
                  { key: "dateTo", label: "Periode Sampai", type: "date" },
                  ...[
                    "Asal",
                    "Tujuan",
                    "Customer",
                    "Billing",
                    "Status Kiriman",
                  ].map((label) => ({
                    key: slug(label),
                    label,
                    type: "select",
                  })),
                ]
              : index === 3
                ? [
                    { key: "dateFrom", label: "Start Date", type: "date" },
                    { key: "dateTo", label: "End Date", type: "date" },
                    ...[
                      "Customer",
                      "Origin",
                      "Destination",
                      "Billing Type",
                    ].map((label) => ({
                      key: slug(label),
                      label,
                      type: "select",
                    })),
                  ]
                : [
                    { key: "dateFrom", label: "Start Date", type: "date" },
                    { key: "dateTo", label: "End Date", type: "date" },
                    { key: "customer", label: "Customer", type: "select" },
                    {
                      key: "destination",
                      label: "Destination",
                      type: "select",
                    },
                  ],
        summaries: index === 2 ? ["Total POD", "Total Kilo", "Total Koli"] : [],
        tools: ["Export Excel"],
        actions: [],
      }));
    if (route.path === "/courier-reports")
      screen.views = info.tabs.map((tab, index) => ({
        ...base(
          tab,
          index === 0
            ? info.columnSets.COLUMNS
            : colLabels([
                "Nama Kurir",
                "Jumlah Terambil",
                "Jumlah Miss Pickup",
              ]),
          [],
        ),
        filters:
          index === 0
            ? [
                { key: "dateFrom", label: "Periode Dari", type: "date" },
                { key: "dateTo", label: "Periode Sampai", type: "date" },
                ...["Branch", "Kurir", "Status"].map((label) => ({
                  key: slug(label),
                  label,
                  type: "select",
                })),
              ]
            : dateFilters,
        summaries:
          index === 0 ? ["Tot. Sukses", "Tot. Pending", "Tot. Failed"] : [],
        tools: ["Export Excel"],
        actions: [],
      }));
    if (route.path === "/financial-reports")
      screen.views = info.tabs.map((tab, index) => ({
        ...base(
          tab,
          info.configs[index === 0 ? "AR_CONFIG" : "AP_CONFIG"].recapColumns,
          [],
        ),
        tableTitle:
          info.configs[index === 0 ? "AR_CONFIG" : "AP_CONFIG"].recapTitle,
        hideSearch: true,
        footerLabel: "HASIL AKHIR",
        filters: [
          { key: "month", label: "Bulan", type: "month" },
          { key: "year", label: "Tahun", type: "number" },
          {
            key: "entity",
            label:
              info.configs[index === 0 ? "AR_CONFIG" : "AP_CONFIG"].entityLabel,
            type: "select",
          },
        ],
        tools: ["Export Excel"],
        actions: [],
        supplementalViews: ["Belum Lunas", "Lunas"].map((status) => ({
          ...base(status, info.columnSets.DETAIL_COLUMNS, []),
          id: `${slug(tab)}-${slug(status)}`,
          fixtureStatus: status,
          tools: ["Export Excel"],
          actions: [],
        })),
      }));
    if (/customer-monthly-summary|daily-turnover-summary/.test(route.path))
      screen.views = [
        {
          ...base(title, info.columnSets.exportColumns, []),
          filters: [
            { key: "month", label: "Bulan", type: "month" },
            { key: "year", label: "Tahun", type: "number" },
            branchFilter,
          ],
          tools: ["Export Excel"],
          actions: [],
        },
      ];
    if (route.path === "/branch-reports/gross-profit")
      screen.views = [
        {
          ...base(title, info.columnSets.MANIFEST_COLUMNS, []),
          filters: [
            { key: "month", label: "Bulan", type: "month" },
            { key: "year", label: "Tahun", type: "number" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["Destination", "Transit", "Vendor"],
            },
          ],
          tools: ["Export Excel"],
          actions: ["Detail"],
          detailLabels: ["Status", "Rute", "Tujuan"],
        },
      ];
    if (route.path === "/branch-reports/manifest-vendor")
      screen.views = [
        {
          ...base(title, info.columnSets.COLUMNS, []),
          filters: [
            { key: "month", label: "Bulan", type: "month" },
            { key: "year", label: "Tahun", type: "number" },
            { key: "penjual", label: "Penjual", type: "select" },
            { key: "pengguna", label: "Pengguna", type: "select" },
          ],
          tools: ["Export Excel"],
          actions: ["Detail"],
          detailLabels: ["Rute", "Pengguna"],
        },
      ];
  }
  if (route.path === "/ticketting") {
    screen.kind = "workspace";
    screen.views = [
      {
        ...base(
          "Ticket Support",
          columns("pages/ticketting/TicketSupport.jsx"),
          fields("pages/ticketting/TicketFormModal.jsx").flatMap((field) => [
            {
              ...field,
              required: ["tanggal", "subject", "priority"].includes(field.key),
            },
            ...(field.key === "subject"
              ? [{ key: "file", label: "Upload File", type: "file" }]
              : []),
          ]),
        ),
        searchLabel: "No. Ticket",
        attachments: true,
        readOnlyFields: [
          {
            key: "Status",
            label: "Status",
            type: "select",
            options: ["Pending", "Revisi", "Selesai"],
          },
        ],
        filters: fields("pages/ticketting/TicketSupport.jsx")
          .filter((field) => field.label !== "No. Ticket")
          .map((field) => ({
            ...field,
            key:
              field.label === "Dari"
                ? "dateFrom"
                : field.label === "Sampai"
                  ? "dateTo"
                  : "Status",
            options: field.options?.filter(
              (option) => option !== "Semua Status",
            ),
          })),
        actions: ["Lihat", "Approve Finish", "Revisi"],
      },
      {
        ...base(
          "Persetujuan Ticketing",
          columns("pages/ticketting/TicketApproval.jsx"),
          [],
        ),
        actions: ["Buka Link"],
      },
    ];
  }
  if (route.path === "/profile") {
    screen.kind = "heading";
    screen.views = [];
  }
  domains[domain][route.path] = screen;
}
// These nine source page components are not mounted by legacy App.jsx. Preserve
// them at explicit supplemental preview paths instead of silently excluding them.
const dormant = [
  [
    "master-data",
    "/master-data/logistics",
    "pages/master-data/LogisticList.jsx",
  ],
  ["master-data", "/master-data/categories", "pages/master-data/Category.jsx"],
  ["master-data", "/master-data/units", "pages/master-data/Unit.jsx"],
  ["shipments", "/operations", "pages/module/Operations.jsx"],
  ["shipments", "/customer-service", "pages/module/CustomerService.jsx"],
  ["accounting", "/akunting/ledger", "pages/akunting/LedgerPage.jsx"],
  [
    "accounting",
    "/akunting/kategori-akun",
    "pages/akunting/KategoriAkunPage.jsx",
  ],
  ["accounting", "/akunting/rugi-laba", "pages/akunting/RugiLabaPage.jsx"],
  [
    "accounting",
    "/akunting/kategori-cashflow",
    "pages/akunting/CashflowPage.jsx",
  ],
];
for (const [domain, route, source] of dormant) {
  const info = component(source);
  domains[domain][route] = {
    path: route,
    title: info.headings[0],
    source: `src/${source}`,
    kind: info.columns.length ? "workspace" : "heading",
    integration:
      "Dormant legacy page preview; no operational integration exists.",
    views: info.columns.length
      ? [base(info.headings[0], info.columns, info.fields)]
      : [],
  };
}
for (const [domain, screens] of Object.entries(domains)) {
  const dir = `src/features/${domain}/preview`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    `${dir}/screens.ts`,
    `import type { PreviewScreen } from "@/components/patterns/preview-contract";\n\n// Source-derived UI metadata only; never consumes a DRAFT model or legacy data.\nexport const screens = ${JSON.stringify(screens, null, 2)} satisfies Record<string, PreviewScreen>;\n`,
  );
}
const screenList = Object.values(domains).flatMap(Object.values);
function leafViews(views, prefix = "") {
  return views.flatMap((view) => [
    ...(view.children?.length
      ? leafViews(view.children, `${prefix}${view.label} / `)
      : [`${prefix}${view.label}`]),
    ...leafViews(view.supplementalViews ?? [], `${prefix}${view.label} / `),
  ]);
}
writeFileSync(
  "docs/experiments/legacy-ui-screen-map.json",
  `${JSON.stringify(
    screenList.map((s) => ({
      path: s.path,
      title: s.title,
      source: s.source,
      domain: Object.keys(domains).find((d) => domains[d][s.path]),
      kind: s.kind,
      routeImplemented: existsSync(
        path.join(
          s.path === "/login" ? "src/app/(auth)" : "src/app/(dashboard)",
          s.path.slice(1),
          "page.tsx",
        ),
      ),
      backend: "unavailable",
      views: leafViews(s.views),
    })),
    null,
    2,
  )}\n`,
);
console.log(
  `${screenList.length} screen contracts:34 routed +9 dormant; ${screenList.reduce((n, s) => n + leafViews(s.views).length, 0)} leaf workspace views.`,
);
const batch = process.argv[2];
if (batch) {
  if (!domains[batch]) throw Error(`Unknown domain ${batch}`);
  for (const screen of Object.values(domains[batch])) {
    if (["/", "/login", "/hak-akses-menu"].includes(screen.path)) continue;
    if (!/^\/[a-z0-9/-]+$/.test(screen.path)) throw Error("Unsafe route");
    const dir = path.join("src/app/(dashboard)", screen.path.slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, "page.tsx"),
      `import type { Metadata } from "next";\nimport { PreviewScreenPage } from "@/components/patterns/preview-screen";\nimport { screens } from "@/features/${batch}/preview/screens";\n\nexport const metadata: Metadata = { title: ${JSON.stringify(screen.title)} };\nexport default function Page() { return <PreviewScreenPage screen={screens[${JSON.stringify(screen.path)}]} />; }\n`,
    );
  }
  console.log(`Materialized ${batch} routes.`);
}
const available = screenList.filter((s) =>
  existsSync(
    path.join(
      s.path === "/login" ? "src/app/(auth)" : "src/app/(dashboard)",
      s.path.slice(1),
      "page.tsx",
    ),
  ),
);
writeFileSync(
  "src/components/shell/implemented-preview-routes.ts",
  `// Generated from explicitly implemented preview pages; no backend availability implied.\nexport const implementedPreviewRoutes = ${JSON.stringify(
    available.map((s) => ({ href: s.path, label: s.title })),
    null,
    2,
  )} as const;\n`,
);
writeFileSync(
  "src/components/shell/legacy-menu.ts",
  `// Read-only source inventory of legacy components/header.jsx MENU ordering.\nexport const legacyMenu = ${JSON.stringify(inventory.navigation, null, 2)} as const;\n`,
);
