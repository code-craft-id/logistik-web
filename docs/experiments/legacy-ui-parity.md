# Legacy UI parity — full presentation migration

> Historical presentation record. The 2026-10-23–24
> [Dev 1 checkpoint](../decisions/PLT-01.md) records partial identity integration,
> still pending the reviewed D-03/D-04 contract. Current entry routes are public
> `/` and protected `/dashboard`; original inventory keys below stay unchanged.

## Status and scope

2026-10-21. Branch: `feat/legacy-ui-parity`. Starting commit:
`68ace1ee54640c7e42f527fa1fad25b7477a6e93`.

**43 discovered screens have target UI routes; zero screen routes remain.**
The inventory comprises 34 routes declared by legacy App.jsx and nine dormant
standalone page components. There are 72 leaf presentation-view contracts,
including paid/unpaid invoice details, and additional embedded form/message tabs.
Five dormant pages and Profile intentionally preserve heading-only source UI.
No screens are excluded. Operational integration and full visual acceptance
remain pending; route coverage does not establish production readiness.

All 43 screens are presentation-only awaiting their owning PLT/domain work.
There were no functional operational target screens or supported data-access
contracts to integrate. Existing foundation examples remain functional locally.
No authentication, permissions, database access or successful mutation is
simulated. No PLT or roadmap status has been changed.

## Audit and sources of truth

- Legacy, read-only: `C:/Development/backup/logistik-web/frontend`.
  Vite 8, React 19 JavaScript, React Router 7, Tailwind 4, Heroicons, Recharts
  and XLSX. Bespoke CRUD/modal/menu patterns, shared CrudTab and ReportPage.
  Source inspection covers all 133 JS/JSX modules; final SHA-256 comparison
  confirms all 133 are unchanged. Legacy code was never executed, installed
  into, formatted or written. No rows, secrets, credentials, environment files,
  related-record choices, lockfiles or generated assets were copied.
- Legacy identity: green #0F5C4C, white rounded bordered panels, slate canvas,
  compact operational labels and wide dense tables. Desktop uses a horizontal
  two-row header/flyouts; mobile uses a drawer. Source tabs, menu order, table
  columns, field order, filters and controls are the presentation reference.
  The source authentication wrapper is commented out; that infrastructure is
  not inherited as a target security design.
- Target architecture remains Next.js 16.4.2 / React 19.3, strict TypeScript,
  Server Component routes/layouts, Tailwind v4 tokens, source-owned Radix-based
  primitives and Lucide. Prisma/Better Auth foundation is untouched. PLT-01
  remains unstarted. DRAFT schema models are never consumed by these previews.
- Exhaustive machine-readable provenance: [inventory](legacy-ui-inventory.json)
  contains source hashes, fields, columns, controls and navigation; [screen map](legacy-ui-screen-map.json)
  contains every route and view. AST tools only read syntax; they never execute
  legacy code. Three public SVGs have unverified usage rights and were not copied.

## Migration matrix

Existing implementation means the starting baseline. Every route below is now
implemented using target architecture. For dormant files the target URL is an
explicit supplemental preview, not a claim that the legacy router mounted it.
Risks are pending integration work, not permissions granted by a visible menu.

| Legacy screen | Target route | Reusable components | Existing implementation | Complexity | Risks | Migration status |
|---|---|---|---|---|---|---|
| Masuk Sistem (Login.jsx) | `/login` | PreviewWorkspace / Form / rights matrix / LoginPreview | Identity schema only | Medium–high | PLT-01 auth, permissions and branch scope | UI preview implemented; backend unavailable |
| Grup User (GroupUser.jsx) | `/group-user` | PreviewWorkspace / Form / rights matrix / LoginPreview | Identity schema only | Medium–high | PLT-01 auth, permissions and branch scope | UI preview implemented; backend unavailable |
| Manajemen User (UserManagement.jsx) | `/user-management` | PreviewWorkspace / Form / rights matrix / LoginPreview | Identity schema only | Medium–high | PLT-01 auth, permissions and branch scope | UI preview implemented; backend unavailable |
| Hak Akses Menu (MenuAccess.jsx) | `/hak-akses-menu` | PreviewWorkspace / Form / rights matrix / LoginPreview | Identity schema only | Medium–high | PLT-01 auth, permissions and branch scope | UI preview implemented; backend unavailable |
| Profil Saya (Profile.jsx) | `/profile` | PreviewWorkspace / Form / rights matrix / LoginPreview | Identity schema only | Low | PLT-01 auth, permissions and branch scope | UI preview implemented; backend unavailable |
| Kantor (Office.jsx) | `/office` | Nested workspace / Form / message editor | Schema foundation only | Medium–high | Parent scope and authorized CRUD | UI preview implemented; backend unavailable |
| Logistik (AreaLogistic.jsx) | `/logistics/areas` | Workspace / Form / Table | Schema foundation only | Medium–high | Validation, privacy and DRAFT boundaries | UI preview implemented; backend unavailable |
| Divisi Logistik (DivisionLogistic.jsx) | `/logistics/division` | Workspace / Form / Table | Schema foundation only | Medium–high | Validation, privacy and DRAFT boundaries | UI preview implemented; backend unavailable |
| Layanan Logistik (ServicesLogistic.jsx) | `/logistics/services` | Workspace / Form / Table | Schema foundation only | Medium–high | Validation, privacy and DRAFT boundaries | UI preview implemented; backend unavailable |
| Kendaraan Logistik (VehiclesLogistic.jsx) | `/logistics/vehicles` | Workspace / Form / Table | Schema foundation only | Medium–high | Validation, privacy and DRAFT boundaries | UI preview implemented; backend unavailable |
| Data Vendor (Vendor.jsx) | `/vendor` | Workspace / Form / Table | Schema foundation only | Medium–high | Validation, privacy and DRAFT boundaries | UI preview implemented; backend unavailable |
| Shipment Status (ShipmentStatus.jsx) | `/shipment-status` | Workspace / Form / Table | Schema foundation only | Medium–high | Validation, privacy and DRAFT boundaries | UI preview implemented; backend unavailable |
| Daftar Logistik (LogisticList.jsx) | `/master-data/logistics` | Workspace / Form / Table | Schema foundation only | Low | Validation, privacy and DRAFT boundaries | UI preview implemented; backend unavailable |
| Kategori (Category.jsx) | `/master-data/categories` | Workspace / Form / Table | Schema foundation only | Low | Validation, privacy and DRAFT boundaries | UI preview implemented; backend unavailable |
| Satuan (Unit.jsx) | `/master-data/units` | Workspace / Form / Table | Schema foundation only | Low | Validation, privacy and DRAFT boundaries | UI preview implemented; backend unavailable |
| Pemasaran/Penjualan (Marketing.jsx) | `/marketing` | Workspace / Form / ImportPreview | No functional screen | Medium–high | Customer scope and approved domain rules | UI preview implemented; backend unavailable |
| On Site Outbound (Transaction.jsx) | `/transactions` | Workspace / Form / Table | No functional screen | Medium–high | Identifiers, lifecycle and transitions | UI preview implemented; backend unavailable |
| Kelola Booking (Booking.jsx) | `/bookings` | Workspace / Form / Table | No functional screen | Medium–high | Identifiers, lifecycle and transitions | UI preview implemented; backend unavailable |
| Daftar Manifest (Manifest.jsx) | `/manifest` | Workspace / Form / Table | No functional screen | Medium–high | Identifiers, lifecycle and transitions | UI preview implemented; backend unavailable |
| Operasional (Operations.jsx) | `/operations` | Workspace / Form / Table | No functional screen | Low | Identifiers, lifecycle and transitions | UI preview implemented; backend unavailable |
| Layanan Pelanggan (CustomerService.jsx) | `/customer-service` | Workspace / Form / Table | No functional screen | Low | Identifiers, lifecycle and transitions | UI preview implemented; backend unavailable |
| Laporan Cabang (BranchReportsIndex.jsx) | `/branch-reports` | Workspace / filters / expandable Table | No functional screen | Low | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Detail Transaksi (TransactionDetailsReport.jsx) | `/branch-reports/transaction-details` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Manifest Outbound (ManifestOutboundReport.jsx) | `/branch-reports/manifest-outbound` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Pengantaran (DeliveryReport.jsx) | `/branch-reports/delivery` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Gross Profit (GrossProfitReport.jsx) | `/branch-reports/gross-profit` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Rekap Gross Profit (RekapGrossProfitReport.jsx) | `/branch-reports/rekap-gross-profit` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Penjual Manifes (ManifestVendorReport.jsx) | `/branch-reports/manifest-vendor` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| AWB (AwbReport.jsx) | `/branch-reports/awb` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Rekap Customer Bulanan (CustomerMonthlySummaryReport.jsx) | `/branch-reports/customer-monthly-summary` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Rekap Omset Harian (DailyTurnoverSummaryReport.jsx) | `/branch-reports/daily-turnover-summary` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Detail Transaksi Inbound (InboundTransactionDetailsReport.jsx) | `/branch-reports/inbound-transaction-details` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Laporan Kurir (CourierReport.jsx) | `/courier-reports` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Laporan Keuangan (FinancialReport.jsx) | `/financial-reports` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Customer Reports (CustomerReports.jsx) | `/customer-reports` | Workspace / filters / expandable Table | No functional screen | Medium–high | Approved definitions, date basis and queries | UI preview implemented; backend unavailable |
| Perkiraan (Perkiraan.jsx) | `/perkiraan` | Workspace / Form / Table | No functional screen | Medium–high | Approved posting and financial definitions | UI preview implemented; backend unavailable |
| Akunting (Akunting.jsx) | `/akunting` | Workspace / Form / Table | No functional screen | Medium–high | Approved posting and financial definitions | UI preview implemented; backend unavailable |
| Ledger (LedgerPage.jsx) | `/akunting/ledger` | Workspace / Form / Table | No functional screen | Medium–high | Approved posting and financial definitions | UI preview implemented; backend unavailable |
| Kategori Akun (KategoriAkunPage.jsx) | `/akunting/kategori-akun` | Workspace / Form / Table | No functional screen | Medium–high | Approved posting and financial definitions | UI preview implemented; backend unavailable |
| Rugi Laba (RugiLabaPage.jsx) | `/akunting/rugi-laba` | Workspace / Form / Table | No functional screen | Medium–high | Approved posting and financial definitions | UI preview implemented; backend unavailable |
| Kategori Cashflow (CashflowPage.jsx) | `/akunting/kategori-cashflow` | Workspace / Form / Table | No functional screen | Medium–high | Approved posting and financial definitions | UI preview implemented; backend unavailable |
| Ticketing (Ticketting.jsx) | `/ticketting` | Workspace / attachment Form / Dialog | No functional screen | Medium–high | Authorized lifecycle and file handling | UI preview implemented; backend unavailable |
| Filter (Dashboard.jsx) | `/` | AppShell / DashboardPanel / SVG illustration | Foundation landing | Low | Approved metric definitions and data sources | UI preview implemented; backend unavailable |

## Shared component mapping and decisions

| Legacy pattern | Target composition | Boundary |
|---|---|---|
| Header/menu/account/mobile drawer | AppShell, typed navigation, Radix Sheet and dropdown | Exact legacy MENU is primary; all 68 prior provider leaves remain supplementary. Only concrete previews are linked. |
| CRUD/table toolbar | PreviewWorkspace, Table, PreviewField, Button | Local search with Show/Reset, sorting, page size/pagination, synthetic states. |
| Create/edit and vendor grouping | PreviewForm, PreviewField, Radix Dialog/Tabs | Fields stay mounted across form tabs; observed requiredness only; saving disabled. |
| Nested office tabs/messages | Nested workspace plus action-specific form | Three WhatsApp tabs with sender/recipient sections; local text/status only, no sending. |
| Customer tools/import | Radix dropdown and ImportPreview | Filename/extension selection and drop behavior only; no XLSX parsing/upload/export or success results. |
| Reports/aging | Source-specific columns/filters, expandable Table, supplemental paid/unpaid tabs | Amounts and totals unavailable; no financial formula or posting assumptions. |
| Tickets/pictures | Attachment form, read-only details, unavailable approval/revision dialogs | Local add/remove picture fields and filenames; no upload, external URL opening or lifecycle mutation. |
| Dashboard | DashboardPanel, local filters, quick preview links, accessible native SVG | All 11 metrics unavailable; chart drawing fixtures are explicitly non-operational illustrations. |
| Loading/empty/error | Skeleton, status output, recoverable alert | State selector demonstrates these states; no operational request runs. |

Shared compositions live in `src/components/patterns/`; navigation in
`src/components/shell/`; fictional fixtures in `src/components/examples/`.
Domain metadata remains in `src/features/*/preview/screens.ts`, with thin
Server Component route wrappers. Client boundaries contain only local controls,
Radix interactions and draft state. Existing primitive consumers were inspected;
no competing component system or new dependency was introduced.

The final audit removed generic Detail actions absent from source, restored
source-specific row actions, and removed Manifest's invented action column.
Category tables omit Kode where legacy does. Financial recap and invoice details
remain separate tables. Native SVG `title` uses single-string children after a
browser-detected hydration failure was fixed and covered by an SSR regression test.

## Local migration checkpoints

| Batch | Scope | Commit |
|---|---|---|
| Initial preserved slice | Shell, mobile drawer, header/breadcrumbs, dashboard | `121a561` |
| 1 | Identity/access previews, exhaustive inventory and shared patterns | `aae9c4c` |
| 2 | Office and logistics/master-data workspaces | `f2f13aa` |
| 3 | Customers, booking, outbound and manifest | `b19070b` |
| 4 | Reports, aging and paid/unpaid details | `f0b43fd` |
| 5 | Accounting, tickets, attachments and WhatsApp message editor | `8396509` |
| Final integration | Dashboard illustrations/links, full breadcrumbs/account menu, source-action corrections, coverage and final evidence | Final local commit containing this record; see git log |

Each checkpoint received scoped checks and representative browser validation;
`batch1-*` through `batch5-*` evidence remains under
`docs/experiments/evidence/legacy-ui-parity/`. Initial-slice logs are historical.
The initial request's first-batch stop was superseded by the full-migration request.
No push, merge, rebase or PR was performed.

## Verification and reconciliation

- `npm run typecheck`: passed on current source.
- `npm run build`: passed; all inventoried routes prerender. Final build log
  is `final-build.log`.
- `npm test`: **149 passed, 1 failed** (150 total), including 92 UI cases.
  Parameterized coverage renders all 70 shared workspaces and their mounted,
  uniquely labeled form controls; separate tests cover rights/navigation,
  imports, tab draft preservation, row actions, focus restoration, pictures,
  financial table layout, disclosure, loading/empty/error and chart SSR.
- `npm run lint`: **one unrelated formatting failure** in separately owned
  `next.config.ts`, described below. Owned source/evidence passes scoped Biome.
- Integration tests were not run: an explicitly safe test environment was not
  established. No database command or staging smoke was performed.
- Browser route evidence: all 43 at 375, 768 and 1440px, heading/preview notice
  and contained page width checked (**129 checks; zero overflow findings**).
  Final console audit has zero warnings/errors after the chart correction.
  Representative screenshots across every
  batch show table scrolling, wrapped filters/tabs and mobile dialog sizing.
  Desktop compact-sidebar recovery and active two-level navigation/breadcrumbs
  work. Mobile Sheet contains keyboard focus; Escape restores its trigger.
  Radix row-dialog Escape/focus return, vendor mounted tabs, message tabs,
  ticket picture addition, report expansion and aging tabs were exercised.
  Existing UI examples retain their foundation regression tests.
- Browser caught a chart title hydration error and initially stale theme CSS;
  single-string titles and a stylesheet refresh resolved both. Final console
  findings and interaction measurements are recorded in final browser evidence.
  The existing port-3000 server was used throughout; none was started or restarted.
- Final legacy integrity: `final-legacy-integrity.json` (133/133 unchanged).
  No diff to schemas, migrations, seeds, auth/backend code, dependencies,
  package manager, AGENTS.md, PRD or ROADMAP.

### Demonstrated unrelated failures and preserved local work

The user-owned `next.config.ts` addition
`allowedDevOrigins: ['127.0.0.1']` predates this continuation. Its single quotes
are the remaining Biome format finding. The edit is preserved and excluded from
all migration commits. Initial lint's 17 failures were CRLF-related. Git
attributes require LF; index inspection showed LF while affected working files
were CRLF. Only those 17 diagnosed files were normalized, preserving encoding,
BOM and contents. Sixteen became byte-identical to committed HEAD; their index
stat cache was refreshed without a content change. No mass renormalization ran.

The unchanged SCH-01 test hashes working SQL bytes. All six fixture hashes match
the baseline committed SQL blobs; each working SQL file differs only by CRLF.
In-memory CRLF-to-LF bytes exactly match HEAD. The test and fixtures also match
baseline. This establishes a pre-existing checkout-state failure independently
of the previous agent's report. No migration, fixture or assertion was edited.
Evidence: `phase0-line-endings.json`, `baseline-check.json`, `phase0-lint-before.log`,
`phase0-lint-after.log`, `phase0-test.log`, `final-test.log`.
The user explicitly permits verified local commits with demonstrated unrelated
baseline failures. These limitations are not hidden or treated as passing gates.
Saved command logs have LF endings, trimmed trailing whitespace and one terminal
newline where the branch diff check diagnosed emitted whitespace. Diagnostic
text and result counts are retained; source-byte evidence lives in the checksum
JSON records, rather than whitespace in formatter output. The final full-branch
diff check passes after this evidence-only normalization.

## Visual findings, differences and acceptance limits

- **Legacy runtime/side-by-side screenshots remain unavailable.** No legacy
  runtime was launched. Target screenshots verify implementation and layout;
  source comparison supports structural similarity, not pixel-perfect parity
  or live provider workflow acceptance. The `before-*` images show the target
  foundation, never the legacy application.
- Green/white identity, dense columns, source menu/tab/field order and dashboard
  composition are inherited. The target keeps its desktop sidebar, breadcrumbs,
  Geist and Lucide; legacy horizontal flyouts, system typography and Heroicons
  are intentionally adapted. The drawer uses target `lg` behavior rather than
  legacy `md`. No legacy logo is copied without rights evidence.
- Row actions are grouped in accessible Radix menus; forms/filters stack or wrap
  on small screens and wide tables scroll locally. These are accessibility and
  responsive adaptations. Office parent selectors use fictional local filtering
  instead of loading or authorizing related records. Defaults and presentation
  validation do not establish business rules.
- Extra preview notices, state demonstrations, disabled operational commits and
  unavailable money differ from populated operational screens intentionally.
  Dashboard quick links use verified source destinations; illustrations never
  compute results, and filter changes do not imply live chart recalculation.
  Login cannot accept real credentials, sign in or sign out. Rights checkboxes
  grant no permissions. D-19 locale/timezone policy remains unresolved.
- Impeccable representative finish review found only stale design persistence;
  DESIGN.md is updated from built code. Its disposition and scoring scope are
  recorded in final review evidence: **ship at the persistence-fix scope only**.
  This is not domain-owner or whole-migration acceptance.

## Remaining integration batches and blockers

No discovered screen route is intentionally pending or excluded. Remaining work
is production integration and external visual acceptance, grouped for the owners:

1. Identity/auth/RBAC/branch scoping (PLT-01), then connect identity/office/master
   previews through approved authorization and validation boundaries.
2. Sales/customers, booking/AWB/shipment/manifest identifiers and lifecycle,
   followed by real import/export/file handling with approved contracts.
3. Report definitions, date/branch scope, financial postings/aging and reconciled
   fixtures; connect reports/accounting only after decisions are confirmed.
4. Ticket lifecycle/attachments and approved dashboard metric queries.
5. Obtain equivalent-viewport legacy/provider runtime evidence, perform visual
   comparison and role/workflow acceptance, then resolve evidenced differences.

These are documented blockers to operational/live-parity acceptance, not PLT
completion claims. No architecture decision was silently resolved by UI metadata.

## 2026-10-21 compact navbar refinement (local, uncommitted)

This is new evidence after the historical migration record above. The starting tree was clean on `feat/legacy-ui-parity` at `47e072a187351fa12c53e6c5ec5d1a71429a2a10`. The user authorized local shell implementation only. No commit, branch change, push, merge, deployment or server startup occurred; browser checks reused `http://localhost:3000`.

### Structure and intentional adaptation

Read-only reinspection of legacy `src/components/header.jsx` and `src/App.jsx` confirms Header before Outlet, login outside AppLayout, eight ordered primary entries, a sticky 60px mobile/68px desktop brand-account row plus a separate 50px desktop menu, click dropdowns/right flyouts, and recursive mobile drawer. Source is presentation evidence only.

The target now has one 60px primary navbar row, 61px with its border, instead of the persistent desktop sidebar or the legacy's approximately 118px desktop chrome. It keeps a local Truck/LMS placeholder, Geist, green/white/slate identity, subtle borders and full-width workspace. A separate normal-flow breadcrumb strip measures 37px on a single line and wraps independently. All header controls and route rows have 44px minimum touch targets. Existing utilities/tokens express the shell; `globals.css`, dashboard layout and feature pages are unchanged.

Source-owned `ui/navigation-menu.tsx` composes the installed Radix NavigationMenu in manual activation mode with Next.js Link. Current Context7 shadcn Radix composition and installed Radix declarations were checked; relevant installed Next.js Link, usePathname and Server/Client docs were read. Grouped, contained panels replace fragile cascades. `navigation.ts` partitions the existing typed config using `legacyMenu.length`; no second MENU is maintained. `compact-navigation.tsx` shares the existing bounded disclosures/finder with the drawer and More. Full primary navigation appears at the existing 80rem (`xl`) breakpoint. At 1280px its right edge is 991.375px and finder begins at 1137px; 1279px uses compact mode. Pathname and breakpoint changes close stale surfaces and retain a visible focus destination.

All eight legacy labels/order and URLs (including `/ticketting`), 43 preview destinations, More previews, 68 unlinked provider leaves, Tutorial System and UI examples remain. Supplemental material stays under its own More panel. Exact active links use `aria-current="page"`, with primary ancestor styling and visible nested section context. Account links only to `/profile`; logout remains unavailable. No auth, RBAC, persistence, schema, fixtures, dependencies or business rules changed; PLT-01 remains unstarted.

### Actual verification

| Check | Result |
|---|---|
| `npx vitest run tests/ui/foundation.test.ts tests/ui/dashboard.test.ts tests/unit/legacy-ui-inventory.test.ts` | PASS: 16 tests; inventory protections unchanged |
| `npm run lint` | PASS: final Biome check covered 153 files |
| `npm run typecheck` | PASS |
| `npm test` | 151 passed, 1 failed of 152: unrelated SCH-01 migration byte checksum |
| `npm run build` | PASS: optimized compilation, TypeScript and 47 static pages |
| `git diff --check` | PASS |
| Browser smoke | PASS: all 43 migrated destinations plus UI examples at 1440px; login correctly outside shell; zero missing pages/overflow |
| Representative browser matrix | Dashboard, nested inbound report, vendor dense table and UI examples at 375/768/1440px; vendor form at all three sizes; zero page overflow |
| Fit and panel probes | 375/768/1240/1279/1280/1320/1440px; 60px row throughout; all five desktop panels contained at 1280px |
| Keyboard/overlays | ArrowDown enters first desktop destination; Escape restores trigger; outside dismisses; nested link selected and menu closed; drawer focus loops in both directions, locks background scroll and closes after route selection; resize to desktop closes drawer and focuses brand |
| Finder/account | Label/path/URL matching, available and unavailable results, empty state, Clear focus, profile link and disabled logout verified |
| 200% reflow | PASS equivalent: 720x450 CSS viewport at device scale 2 (1440x900 / 2), compact navigation and `/ticketting` selection; zero overflow |

The command-output wrapper initially misrouted a lint attempt into unrelated npm/ESLint commands. Rerunning with `rtk bypass npm run lint` executed the actual package script and passed. No project dependency or lockfile changed. Other full gate commands also used `rtk bypass` to retain actual results.

Fresh checksum diagnosis is saved in `evidence/compact-navbar/checksum-diagnosis.json`: all six expected fixture hashes equal committed HEAD SQL blobs; each working SQL differs only by CRLF versus LF. The checksum test and fixture match HEAD. No SQL, fixture or unrelated file was normalized or edited.

During initial editing, a temporary Windows-encoded shell file produced six UTF-8 compilation error messages. It was corrected to UTF-8 before focused tests/browser validation. Subsequent verification produced zero console warnings/errors; the full historical log is retained in `browser-findings.json` so those transient failures are not hidden.

### Evidence and limits

Evidence directory: `docs/experiments/evidence/compact-navbar/`. `browser-findings.json` records header heights, breakpoint fit, panel bounds, representative viewports and console messages. `route-smoke.json` records all 44 destination visits. `final-lint.log`, `final-typecheck.log`, `final-test.log` and `final-build.log` retain the final package-script output. Representative JPEGs include `1440-dashboard.jpg`, `375-dashboard.jpg`, `768-ui-examples.jpg`, `desktop-active-report.jpg`, `desktop-reports.jpg`, `desktop-more-inventory.jpg`, `desktop-finder.jpg`, `desktop-account.jpg`, `mobile-drawer.jpg`, `desktop-vendor-form.jpg`, `375-vendor-form.jpg`, `768-vendor-form.jpg`, and `zoom-200-finder.jpg`. These are direct target-browser screenshots, not generated images or legacy runtime evidence.

Native browser 200% zoom and physical touch remain UNVERIFIED: browser zoom shortcuts did not change the viewport and raw touch-event injection is unsupported by this browser tool. Equivalent zoom reflow, 44px targets and pointer interactions were checked. Screen-reader review, legacy/provider runtime or pixel comparison, staging acceptance and production integration remain unverified. No historical FND-03 or migration acceptance was rewritten as navbar acceptance. Legacy integrity and final changed-file scope are recorded in `legacy-integrity.json` and `verification.json`.
