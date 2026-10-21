# Legacy UI parity — first batch

## Full migration continuation (2026-10-21)

Current scope supersedes the original first-batch stop: migrate all discovered
legacy presentation on the existing branch, without backend/auth/schema work.
The original audit and checks below are historical evidence, not current status.

Phase 0 reconciled: all original UI work preserved. A separate preexisting local
`next.config.ts` edit adds `allowedDevOrigins: ['127.0.0.1']`; it is preserved and
excluded from migration commits. Fresh lint diagnosed 17 CRLF files. Only those
17 files were rewritten from CRLF to LF, preserving UTF-8/BOM and all other bytes.
Sixteen then exactly match HEAD; the seventeenth is the separately owned config.
No migration/schema was changed or normalized. Evidence:
`phase0-line-endings.json`, `phase0-lint-before.log`, `phase0-lint-after.log`.

Current gates for the initial slice: typecheck/build pass, tests 66 pass / 1
unchanged SQL byte-checksum failure, lint only the unrelated config's single-quote
formatting difference. All owned files pass scoped Biome. The checksum failure
is independently demonstrated: each fixture equals its HEAD SQL blob; working SQL
differs only by CRLF; original test/fixture files equal HEAD. This is checkout
state, not a branch regression. Migrations remain untouched by explicit constraint.
No assertions or safeguards were weakened. Logs: `phase0-test.log`,
`phase0-build.log`. The user explicitly authorizes committing verified owned work
with demonstrated unrelated failures. Initial slice ready for local checkpoint.

### Current inventory and batch checkpoints

- Initial shell/dashboard checkpoint: `121a561`.
- Exhaustive source audit: **34 declared routes + nine dormant page entrypoints
  = 43 screens**, with **68 leaf workspace views** and 133 JS/JSX modules read.
  All three public SVG assets have unverified usage rights and were not copied.
  Login/Profile are separate screens; ticket support/approval and report/company
  subsections are embedded views. Nine dormant pages receive supplemental routes,
  rather than an unapproved exclusion. Full field/column/control provenance and
  SHA-256 source hashes: `legacy-ui-inventory.json`; per-screen map:
  `legacy-ui-screen-map.json`. No legacy rows, credentials, related-record choices,
  endpoints or service code are copied. AST extraction never executes legacy JS.
- Batch 1: **6/43 route UIs implemented**, including the initial dashboard and
  five identity screens. Login inputs/sign-in are explicitly disabled; profile
  matches its heading-only legacy source. Groups/users use the full source field
  and column layouts. Menu rights has 19 × 4 local checkboxes; none grant access.
  All writes remain unavailable, never simulated as successful.
- Shared pattern note: source-owned Radix dropdown, tabs and Dialog compose
  PreviewWorkspace, PreviewForm and PreviewField. An isolated typed fixture
  generator supports real local filtering, sorting, page sizing/pagination,
  details and draft editing. Save/delete/approval/import/export remain unavailable.
  Form tabs stay mounted; only observed UI requiredness is checked locally.
  These are repeated legacy patterns, not domain services or backend contracts.
- Primary navigation now follows legacy MENU ordering/hierarchy, progressively
  linking only concrete implemented preview pages. All 68 original provider
  leaves remain in a supplementary two-level Provider inventory. More previews
  exposes dormant/auxiliary screens. This resolves the earlier UI-source mismatch
  under the user's explicit full-migration instruction without changing AGENTS,
  permissions or roadmap status. Provider inventory tests retain their original
  strict 68-leaf/unavailable assertions; primary-menu coverage tests are added.
- Batch 1 checks: 15 UI tests + two inventory tests pass; typecheck and build
  pass. Lint has only the separately owned next.config quote-format difference;
  SQL checksum limitation is unchanged. No new failure accepted. Browser captures
  at 375/1440 for login, groups and rights show no page overflow. Permission
  matrix creates 76 preview checkboxes with save disabled; create dialog has
  accessible title/description and initial field focus. Evidence: `batch1-*`.

- Batch 1 checkpoint committed: `aae9c4c`.
- Batch 2: office plus nine master-data routes, including all company sub-tabs,
  four logistics workspaces, vendor's three table/form groups, shipment status
  and three dormant headings. **16/43 route UIs implemented; 27 remain.**
  No Prisma/DRAFT model is consumed. Vendor form opens the source-selected
  group (e.g. NPWP), with all three form panels mounted. Office company-dependent
  tabs expose their parent selector with fictional choices. Arrow-key switching
  between Data Bank / Dompet Digital verified. At 375/768/1440, representative
  office (15 columns), vendor (12), and vehicle (19) tables scroll within the
  work area with no page overflow. NPWP dialog is 343px at a 375px viewport.
  Typecheck, 15 UI tests and two inventory tests pass; lint remains only the
  unrelated config format error. Evidence: `batch2-*`.

Next: operations → reports/accounting/tickets → dashboard visual and cross-screen
verification. Runtime/legacy pixel comparison is still unverified.

Date: 2026-10-21. Owner: Codex, presentation migration requested by coordinator.
Branch: `feat/legacy-ui-parity`, created from clean `main` at
`68ace1ee54640c7e42f527fa1fad25b7477a6e93`.

## Comparative audit

Legacy was inspected read-only at `C:/Development/backup/logistik-web/frontend`.
Evidence: `package.json`, `src/App.jsx`, `src/main.jsx`, `src/index.css`,
`src/components/header.jsx`, `CrudTab.jsx`, `src/pages/Dashboard.jsx`,
`src/pages/master-data/Vendor.jsx`, `src/pages/office/Office.jsx`,
`src/pages/module/Marketing.jsx`, and the report components/routes.
This is prototype presentation evidence, not confirmation of business rules.

- Legacy: Vite 8, React 19 JavaScript, React Router 7, Tailwind 4, Heroicons,
  Recharts and XLSX. Bespoke dropdowns/modals; `CrudTab` drives tabbed CRUD,
  marketing has feature components, reports share `ReportPage`/toolbar/table.
- White two-row sticky desktop header (68px branding, 50px navigation),
  click-open nested flyouts, mobile 288px drawer below `md`, account dropdown.
  No persistent desktop sidebar or breadcrumbs. Green `#0F5C4C`, slate borders,
  white rounded panels, compact 12–15px labels, 24/32px page padding.
  Global system-font CSS includes an 18px root and dark-mode starter styles;
  these are not a portable design system and are not copied.
- Legacy `App.jsx` comments out its `RequireAuth` wrapper. This infrastructure
  is not inherited; no target authentication or route protection is changed.
- Dashboard uses period/date/year/branch filters with explicit Show/Reset,
  six quick-action groups, six branch metrics, five operational metrics,
  monthly stacked bars, two donut summaries and a daily area chart.
  Its values are mock arithmetic and its cache timestamp is hardcoded.
  Some destinations (e.g. `/operations`) are not declared routes.
- CRUD uses search, add/edit forms, tabs, delete confirmation and API calls.
  Vendor has Data Vendor / NPWP / Accounting tabs. Office has parent-dependent
  company/office/branch/agent tabs. Reports expose sortable tables, filters,
  summaries, pagination and XLSX export. Source interactions were inspected;
  legacy runtime behavior has not been verified.
- Target: Next.js 16.4.2 / React 19.3 TypeScript App Router, Tailwind v4,
  source-owned shadcn-style Radix primitives and Lucide. Only `/` and
  `/ui-examples` exist, both under the dashboard Server Component layout.
  No server actions, route handlers, sessions or operational data contracts
  are implemented. Better Auth schema options are storage foundation only.
  ROADMAP explicitly says PLT-01 has not started; no PLT completion is inferred
  from the user's phase description. FND-03 is accepted foundation work.
- Existing primitives: Button, Badge, Input, Label, Textarea, Table, Dialog,
  Sheet, Skeleton; Radix tabs are composed in `FormLayout`. Shared patterns:
  PageHeading, FilterBar, FormField, ContentState, FormLayout. Existing example
  consumers and `tests/ui/foundation.test.ts` were inspected before edits.
  Existing navigation has 68 provider leaves, only two linked routes, one
  open group/section, local menu filtering, and focus-managed mobile Sheet.

## Migration matrix

Paths in the first column are verified declarations in legacy `src/App.jsx`.
Future target paths are **unassigned** until the owning ticket defines them;
legacy URLs do not authorize target routes.

| Legacy screen | Target route | Reusable components | Existing implementation | Complexity | Risks | Status |
|---|---|---|---|---|---|---|
| Dashboard `/` | `/` | AppShell, DashboardPanel, Button, Input, Label | Foundation landing | Medium | Mock metrics, D-15/D-19, no data | First batch: supported presentation only |
| Login `/login`; profile `/profile` | Unassigned | FormField, Button, Dialog | Identity schema options only | High | PLT-01, D-03/D-04 | Deferred |
| User groups `/group-user`; users `/user-management`; rights `/hak-akses-menu` | Unassigned | Table, FormLayout, Dialog | No screens | High | Server RBAC and scope | Deferred |
| Office `/office` | Unassigned | Tabs, FormLayout, Table | Schema only | High | Parent scope, D-03/D-24 | Deferred |
| Areas `/logistics/areas`; divisions `/logistics/division`; services `/logistics/services`; vehicles `/logistics/vehicles` | Unassigned | Table, FilterBar, FormField, Dialog | Schema only | Medium–high | D-25/D-26/D-27, permissions | Deferred |
| Vendor `/vendor`; shipment status `/shipment-status` | Unassigned | FormLayout, Table, Dialog | Synthetic vendor form at `/ui-examples` only | High | DRAFT tax/accounting, D-07 | Deferred |
| Perkiraan `/perkiraan`; accounting `/akunting` | Unassigned | Table, FormLayout | DRAFT schema only | High | Financial definitions and postings | Deferred |
| Marketing `/marketing` | Unassigned | Table, FormLayout, Dialog | Schema only | High | Customer/consignee privacy, D-10 | Deferred |
| Transactions `/transactions`; bookings `/bookings`; manifest `/manifest` | Unassigned | FilterBar, Table, Dialog | No operational implementation | High | D-05–D-09, numbering, transitions | Deferred |
| Report index `/branch-reports` | Unassigned | PageHeading, links | None | Medium | Route/permission inventory | Deferred |
| Branch reports `/branch-reports/transaction-details`, `/manifest-outbound`, `/delivery`, `/manifest-vendor`, `/awb`, `/customer-monthly-summary`, `/daily-turnover-summary`, `/inbound-transaction-details` (all suffixes under `/branch-reports`) | Unassigned | FilterBar, Table, ContentState | None | High | D-15, source reconciliation | Deferred |
| Profit `/branch-reports/gross-profit`, `/branch-reports/rekap-gross-profit` | Unassigned | FilterBar, Table | None | High | D-11–D-15 | Deferred |
| `/courier-reports`; `/financial-reports`; `/customer-reports` | Unassigned | FilterBar, Table | None | High | Approved report definitions | Deferred |
| Ticketing `/ticketting` | Unassigned | Table, Dialog, FormField | None | High | D-16, no lifecycle contract | Deferred |

## Shared component mapping and migration order

Short design note for this batch (shared presentation changes require another
developer's review before integration; no independent review is claimed):

| Legacy pattern | Target composition / decision |
|---|---|
| Header, mobile drawer, nested menu | Adapt existing AppShell/Navigation; preserve typed provider inventory and order, use Lucide domain icons and existing Radix Sheet. Keep required desktop sidebar instead of legacy flyouts. |
| Green actions, slate canvas, white panels | Shared semantic tokens in `globals.css`; no legacy stylesheet or second styling system. Retain Geist and existing small control radii. |
| Branding/account menu | Text LMS mark; truthful preview account state. No copied logo without provenance, fake user, login or logout. |
| Page heading and full-width page gutters | Existing PageHeading; fluid main area with legacy-style 24/32px spacing. Existing breadcrumb contract preserved. |
| Dashboard section/panel | Small server-rendered DashboardPanel composition in `components/patterns`; caller supplies heading, description and content. |
| Filter/Show/Reset | Isolated dashboard Client Component; period/date/year local preview only, branch selector disabled until PLT-01. No network, persistence or fabricated branch membership. |
| Quick menu, metric cards, charts | Server-rendered dashboard feature compositions; observed labels/sequence, unlinked destinations, explicit unavailable values/chart regions. No mock money, counts, cache time, charts or exports. |
| CRUD tables/forms/modals | Existing Table/FilterBar/FormLayout/Dialog retained for later owner-approved slices; example page remains available. |

First batch is shell + `/` dashboard only, related to the existing FND-03
presentation surface (Codex integrator); dashboard domain ownership remains
Dev 3. No new ROADMAP ticket or status is invented. PLT-01/02/03 behavior is
outside this experiment. Authentication is neither implemented nor bypassed.
Pages/layouts remain Server Components; only navigation state and local filter
state are client-side. No database reads, schema changes or new dependencies.
Installed Next.js Server/Client guide and Context7's official Next.js guide
were consulted before implementation.

Remaining batches, each separately scoped and reviewed:

1. Dev 1: PLT-01 login/account, user/group/rights presentation alongside approved
   sessions, action permissions and branch scope (D-03/D-04 gates).
2. Dev 1: office and essential logistics lists/forms (PLT-02), then vehicles,
   personnel/vendor/ETA (PLT-03); privacy and region decisions remain gates.
3. Dev 2: customer/consignee, booking/transactions, then manifests/delivery;
   preserve each approved full-stack contract and lifecycle dependency.
4. Dev 3: operational reports and tickets with definitions/scoping, then
   financial reports/accounting only after financial decisions are approved.
5. Dev 3: connect dashboard filters, quick actions, metrics and charts to the
   resulting approved data sources; choose charts within the dependency policy.

## Implementation and verification

Implementation is present but **not marked complete and not committed** because
the required repository-wide gates fail on existing working-copy line endings.
No files are staged. No push, PR, merge, rebase, database access or server launch
was performed. The original dev server at `http://localhost:3000` was used.

Changed files:

- `src/components/shell/app-shell.tsx`: legacy-style white shell, compact header,
  fluid canvas/gutters, domain icons, named compact group recovery with focus
  transfer. Existing navigation config, provider inventory, disclosure behavior,
  menu filter, active paths, breadcrumbs and Radix mobile Sheet retained.
- `src/app/globals.css`: green primary/focus/selection, white sidebar, shared
  workspace surface token. No feature-local tokens or dependency changes.
- `src/app/(dashboard)/page.tsx`: Server Component entry and Dashboard metadata.
- `src/features/dashboard/components/dashboard-overview.tsx`: Server Component
  composition with legacy headings, quick groups, metric and chart regions.
- `src/features/dashboard/components/dashboard-filters.tsx`: local controlled
  preview form. Draft changes require Show; Reset clears both draft/applied state.
- `src/components/patterns/dashboard-panel.tsx`: shared bordered panel composition.
- `tests/ui/dashboard.test.ts`: three tests for draft/apply/reset, honest
  unavailable workflows/results and compact navigation recovery.
- `DESIGN.md`: synchronize authorized palette/layout/panel changes while retaining
  historical FND-03 acceptance separately. Ignored `.impeccable/design.json`
  updated locally; unrelated preexisting sidecar drift is not claimed fixed.
- This record and `docs/experiments/evidence/legacy-ui-parity/`: synthetic-only
  screenshots, measurements, interaction notes, console and validation evidence.

Required checks (actual command output is retained with the evidence):

| Command | Result |
|---|---|
| `npm run lint` | FAIL: 17 preexisting CRLF formatting errors outside changed UI files; no blanket formatting performed. |
| `npm run typecheck` | PASS. |
| `npm test` | FAIL: 66 passed, 1 failed (67 total). The existing SCH-01 byte-checksum assertion fails on CRLF SQL working copies. All 12 UI tests pass, including all nine existing foundation tests. |
| `npm run build` | PASS: static `/`, `/ui-examples`, generated not-found route; no new operational route. |
| Scoped Biome check of seven changed source/test files | PASS. |
| `git diff --check` | PASS. |
| Integration tests | Not run; no explicitly safe integration environment was established or needed for this UI-only slice. |

Commands use `rtk bypass` where the installed output wrapper mangled npm output;
this changes output handling only, not the repository scripts or safeguards.
An initial `npx biome` launcher failed; the installed
`node node_modules/@biomejs/biome/bin/biome` executable was then used only for
scoped formatting/checks. No package/lockfile changed.

Read-only diagnosis: `git ls-files --eol` reports LF index / CRLF working files
despite the LF attribute. For all six baseline migrations the fixture checksum
matches the committed blob; normalizing the working-copy bytes in memory yields
the same blob. `baseline-check.json` records this. Migrations, fixtures and
unrelated files remain untouched. Resolving the checkout line-ending state is
separate work before these gates and the local commit can be completed.

Browser checks on the existing server:

- Dashboard and existing examples captured at **375, 768 and 1440px**. In both
  routes document scroll width equals client width at every viewport. At 375px
  the existing table scrolls within its 326px region (682px content); the page
  does not overflow. Dashboard inputs and Show/Reset have 44px height and fit.
- Desktop collapse/expand, active Dashboard label, compact Master Data recovery
  and focus transfer, two-level keyboard disclosure and one-open-group behavior
  verified. Menu search for Rekap Omset Harian yields one unlinked full-path
  result; clear restores the tree. Existing automated tests cover all 68 leaves.
- Mobile Sheet: initial focus inside, Shift+Tab wraps to Close, Tab wraps to
  search, Enter opens group/section, Escape closes and restores trigger focus.
  Selecting Dashboard from the examples drawer closes it and navigates to `/`.
- Dashboard: period `2026-10`, date `2026-10-21`, year `2026` applied only on
  Show; output explicitly says data remains unavailable. Reset clears selection.
- Existing example regression: search reduces rows to one; simulated error
  recovers to five rows; ArrowRight scrolls the focused table; invalid form
  focuses `example-name`; Radix ArrowRight/Home selects Tax/Vendor data while
  all three panels remain mounted. Dialog Tab/Shift+Tab wraps, Escape closes
  and restores trigger focus. Dialog captured at 375px.
- No browser console warnings/errors were captured (`console.json`). This is a
  local development check, not staging or exhaustive runtime coverage.
- The server initially served stale blue CSS; after the authorized build it
  refreshed. Final captures/measurements verify actual green `#0f5c4c`, white
  sidebar and slate workspace. No second server was created or restarted.
- Impeccable finish review requested one malformed sticky-sidebar capture be
  retaken from scroll position zero, then found only documentation persistence
  stale. That fix was scored resolved with **ship at the persistence-fix scope**;
  this is not full feature acceptance or an independent domain-owner review.

Evidence: `dashboard-{375,768,1440}.png`, `viewport-{375,1440}.png`,
`navigation-375.png`, `examples-{375,768,1440}.png`, `dialog-375.png`,
`browser-measurements.json`, `examples-measurements.json`, `interactions.json`.
The `before-*` images are the original target foundation, **not the legacy app**.

Known differences and unverified items:

- No legacy runtime was launched or exposed by a supplied URL. Comparison is
  source-based; equivalent-viewport legacy screenshots, pixel parity and live
  operational workflow parity remain **unverified**. The legacy directory was
  never modified, formatted, installed into or run.
- Target provider navigation remains authoritative: 68 leaves, original order
  and provider spellings. Legacy uses a separate Akunting top-level entry and
  shorter report inventory; these are not substituted for the verified provider
  tree. Desktop sidebar/breadcrumbs and `lg` drawer breakpoint intentionally
  adapt legacy horizontal desktop flyouts and its `md` mobile breakpoint.
- Geist, the LMS text mark and small existing control radii are retained;
  no legacy logo/assets were copied without usage-rights evidence. No fake
  account menu/user, branch membership, counts, money, cache timestamps,
  financial arithmetic, exports or chart library are introduced.
- Period/year options are native empty inputs instead of hardcoded legacy
  months/years; branch is unavailable. Observed Indonesian headings are retained
  with provisional English preview/accessibility text. D-19 stays unresolved.
- Metrics and charts preserve layout/labels but show unavailable states, rather
  than mock results. Connecting them is deferred to approved data contracts.
  Existing form/table examples remain synthetic; no operational page is added.
- PLT-01, domain decisions, staging validation and another developer's shared
  UI review remain separate gates. ROADMAP task statuses were not changed.
