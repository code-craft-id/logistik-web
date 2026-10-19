# FND-03 iteration 2: evidence and presentation decisions

Status: **DONE (2026-10-19)**; coordinator-reported acceptance. Final closure below supersedes historical pending statuses. 2026-10-19. Owner/integrator: Codex; feature-owner review pending. This iteration refines the existing shell and examples only. PLT-01, persistence, schema changes, operational pages and business validation remain out of scope.

## Navigation decision

Use one disclosure per documented top-level group, with flat path headers underneath. The provider's `Layanan Pelanggan > Transaksi > Onsite Outbound` becomes `Modules` disclosure, `Customer Service / Transactions` header, `Onsite Outbound` text. Master Data has still deeper area groups, making recursive indentation especially costly at 375px. Headers retain parent context without nested disclosure or flyout traversal. All documented leaves remain discoverable by expanding three groups; the drawer and sidebar scroll vertically. Collapsed desktop mode retains named active links and an explicit Expand sidebar control to recover the full menu.

`src/components/shell/navigation.ts` is the single typed navigation config, including provisional English labels and original provider labels for traceability. Provider top-level order is Dashboard, System Settings, Office, Master Data, Modules, Reports, Ticketing, System Tutorial. UI examples is a separate local destination after that order. Only `/` and `/ui-examples` link anywhere. Dashboard labels the existing foundation preview; it supplies no metrics. Screenshots outside menu notes do not establish undocumented descendants. System Settings, Office, Ticketing and System Tutorial therefore remain top-level only.

D-19 stays TBD. English follows the incumbent presentation; translations here are provisional, not a locale, timezone or formatting policy. No permission or availability is inferred from model readiness.

## Form decision

Keep three tabs, matching observed Vendor Data, NPWP and Accounting grouping. This bounded three-part form fits the narrow viewport without a separate anchor rail. `FormLayout` owns Radix tab semantics, arrow/Home/End navigation, persistent mounted panels and one shared action row. Inactive panels use `display: none`, excluding their controls from keyboard navigation while retaining input values. Callers own fields, form semantics and actions, so the layout can serve create or update modes without defining a workflow.

The vendor-style example uses synthetic fixture text, two address lines, city/postal code, phone/fax, contact/email, branch and ON/OFF status. Submit and Back are explicitly example actions with local feedback. NPWP/accounting field names follow `vendor-add.md`; disabled accounting placeholders query no DRAFT models. No requiredness, tax checks, account choices or percentages are inferred. The separate existing primitive-validation demonstration remains intact.

## Evidence inventory

All paths below are relative to the ignored private `docs/reference/app-provider/` directory. File presence does not verify all behavior shown. No personal data, AWB identifiers or figures are reproduced. Only the dashboard image was inspected for top navigation; other image contents remain UNVERIFIED in this iteration. Menu/detail notes were read in full and are OBSERVED evidence, pending domain review.

- `kantor/2026-10-19 09.37.15.png` — image present; contents UNVERIFIED.
- `kantor/2026-10-19 09.37.32.png` — image present; contents UNVERIFIED.
- `kantor/2026-10-19 09.37.44.png` — image present; contents UNVERIFIED.
- `kantor/Screenshot_12.png` — image present; contents UNVERIFIED.
- `kantor/redlogistik.tracks-app.com_index.php_company.png` — image present; contents UNVERIFIED.
- `laporan-laporan/laporan-menu.md` — note read.
- `laporan-laporan/redlogistik.tracks-app.com_index.php_all-status.png` — image present; contents UNVERIFIED.
- `laporan-laporan/redlogistik.tracks-app.com_index.php_awb-pending.png` — image present; contents UNVERIFIED.
- `laporan-laporan/redlogistik.tracks-app.com_index.php_daily-report-courier.png` — image present; contents UNVERIFIED.
- `laporan-laporan/redlogistik.tracks-app.com_index.php_detail-transaction.png` — image present; contents UNVERIFIED.
- `laporan-laporan/redlogistik.tracks-app.com_index.php_laporan-detail-kurir.png` — image present; contents UNVERIFIED.
- `laporan-laporan/redlogistik.tracks-app.com_index.php_pengiriman.png` — image present; contents UNVERIFIED.
- `laporan-laporan/redlogistik.tracks-app.com_index.php_pod-return.png` — image present; contents UNVERIFIED.
- `master-data/master-data-menu.md` — note read.
- `master-data/redlogistik.tracks-app.com_index.php_area.png` — image present; contents UNVERIFIED.
- `master-data/redlogistik.tracks-app.com_index.php_marketing.png` — image present; contents UNVERIFIED.
- `master-data/redlogistik.tracks-app.com_index.php_moda.png` — image present; contents UNVERIFIED.
- `master-data/redlogistik.tracks-app.com_index.php_mshipment-status.png` — image present; contents UNVERIFIED.
- `master-data/redlogistik.tracks-app.com_index.php_vehicle-type.png` — image present; contents UNVERIFIED.
- `master-data/redlogistik.tracks-app.com_index.php_vendors.png` — image present; contents UNVERIFIED.
- `master-data/vendor-add.md` — note read.
- `modul/edit-status-pengiriman.md` — note read.
- `modul/modul-menu.md` — note read.
- `modul/redlogistik.tracks-app.com_index.php_consignee.png` — image present; contents UNVERIFIED.
- `modul/redlogistik.tracks-app.com_index.php_customer.png` — image present; contents UNVERIFIED.
- `modul/redlogistik.tracks-app.com_index.php_delivery-sheet.png` — image present; contents UNVERIFIED.
- `modul/redlogistik.tracks-app.com_index.php_on-site-add.png` — image present; contents UNVERIFIED.
- `modul/redlogistik.tracks-app.com_index.php_revenue-customer.png` — image present; contents UNVERIFIED.
- `modul/redlogistik.tracks-app.com_index.php_sales_piutang_dagang.png` — image present; contents UNVERIFIED.
- `modul/tambah-drs.md` — note read.
- `modul/transaksi-onsite-add.md` — note read.
- `redlogistik.tracks-app.com_index.php_dashboard.png` — top navigation inspected only.
- `sistem-setting/redlogistik.tracks-app.com_index.php_group-user.png` — image present; contents UNVERIFIED.
- `sistem-setting/redlogistik.tracks-app.com_index.php_hak-akses-menu_user=1&type=all.png` — image present; contents UNVERIFIED.
- `sistem-setting/redlogistik.tracks-app.com_index.php_user-management.png` — image present; contents UNVERIFIED.

Missing/unverified evidence:

- Vendor create/update screenshot: MISSING / UNVERIFIED. `vendors.png` is a list filename, not a verified add form image. Use the supplied field list plus `vendor-add.md`.
- System Settings, Office, Ticketing and Tutorial menu tree notes: MISSING / UNVERIFIED. Existing individual screenshots do not establish complete menus.
- Any leaf without a matching screen capture: screen layout and behavior UNVERIFIED; menu-note presence establishes discoverability only. No other screenshots are assumed to exist.
- Explicit `?` questions in `modul-menu.md`: can City couriers / Kurir Kota delete DRS? Is Print DRS a read table? Both remain OPEN / UNVERIFIED. Neither becomes an action, permission or business rule.
- Live provider comparison, permissions, inputs/outputs and full parity: UNVERIFIED. D-29 remains open for stable access and archival approval. Private raw evidence is ignored, not committed.

## Menu-to-schema readiness (read-only)

Ready = matching non-DRAFT model storage exists, not a ready workflow. Partial = some supporting storage exists but the menu's required data is absent or guarded. Missing = no matching operational/fact model. DRAFT = matching storage explicitly guarded. No status enables a link, hides a menu item, or imports Prisma into UI. Unknown descendants are not invented. All provider destinations are unavailable in this foundation.

| Provider path | Status | Model evidence / gap |
|---|---|---|
| Dashboard | partial | Branch exists; operational KPI facts missing |
| Sistem Seting (descendants unverified) | partial | User exists; permission/group contracts absent, PLT-01 |
| Kantor (descendants unverified) | partial | Company, Office, Branch, Agent exist; menu hierarchy unverified |
| Ticketing (descendants unverified) | missing | No Ticket model |
| Tutorial System (descendants unverified) | missing | No tutorial content model; static content requirements unknown |
| Master Data > M. Logistik > Area Logistik > Provinsi | DRAFT | Province; D-27 |
| Master Data > M. Logistik > Area Logistik > Kabupaten | DRAFT | Regency; D-27 |
| Master Data > M. Logistik > Area Logistik > Kecamatan | DRAFT | District; D-27 |
| Master Data > M. Logistik > Area Logistik > Kelurahan | DRAFT | Village; D-27 |
| Master Data > M. Logistik > Area Logistik > Kode Pos | DRAFT | PostalCode; D-27 |
| Master Data > M. Logistik > Divisi Logistik > Pemasaran | ready | MarketingPerson |
| Master Data > M. Logistik > Divisi Logistik > Driver | ready | Driver |
| Master Data > M. Logistik > Divisi Logistik > Kurir | ready | Courier |
| Master Data > M. Logistik > Layanan Logistik > Moda | partial | TransportMode; draft numeric field D-26 |
| Master Data > M. Logistik > Layanan Logistik > Kategori Layanan | ready | ServiceCategory |
| Master Data > M. Logistik > Layanan Logistik > Layanan Pengantaran | ready | DeliveryService |
| Master Data > M. Logistik > Layanan Logistik > Jenis Barang | ready | GoodsType |
| Master Data > M. Logistik > Layanan Logistik > Jenis Biaya | ready | CostType |
| Master Data > M. Logistik > Layanan Logistik > Termin | ready | Term |
| Master Data > M. Logistik > Kendaraan Logistik > Jenis Kendaraan | ready | VehicleType |
| Master Data > M. Logistik > Kendaraan Logistik > Kendaraan | ready | Vehicle |
| Master Data > M. Logistik > Kendaraan Logistik > Jenis Trucking | ready | TruckingType |
| Master Data > M. Vendor > Vendor | partial | Vendor; VendorTaxProfile / VendorAccounting DRAFT, D-24 / D-11 / D-13 |
| Master Data > M. Vendor > Layanaan Vendor | missing | Vendor exists, no VendorService model |
| Master Data > M. Shipment Status | ready | ShipmentStatus definitions only |
| Modul > Pemasaran/Penjualan > Customer | partial | Customer; tax/accounting/integration children DRAFT |
| Modul > Pemasaran/Penjualan > Penerima | ready | Consignee |
| Modul > Pemasaran/Penjualan > Pendapatan Pelanggan | missing | No transaction/revenue facts |
| Modul > Layanan Pelanggan > Transaksi > Onsite Outbound | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Layanan Pelanggan > Transaksi > Onsite Inbound | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Layanan Pelanggan > Transaksi > Print AWB | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Layanan Pelanggan > Transaksi > Persetujuaan Edit/Delete AWB | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Layanan Pelanggan > Transaksi > Void AWB | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Layanan Pelanggan > Status Pengantaran | partial | ShipmentStatus definitions; no shipment or event history |
| Modul > Layanan Pelanggan > Cek Ongkir | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Layanan Pelanggan > Cek Resi | partial | ShipmentStatus definitions; no shipment/AWB facts |
| Modul > Layanan Pelanggan > Histori Edit Resi | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Layanan Pelanggan > Booking | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Layanan Pelanggan > Inbound Booking | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Layanan Pelanggan > History Delete Resi | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Operasional > Manifest > Cek Transit | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Operasional > Manifest > Cek Inbound | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Operasional > Manifest > Cek Inbound Agen | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Operasional > Manifest > Print Manifest | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Operasional > Lembar Pengantaran > Kurir Kota | partial | Courier, Driver, Vehicle; no delivery sheet |
| Modul > Operasional > Lembar Pengantaran > Print DRS | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Operasional > POD Kembali | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Operasional > Approval POD Kembali | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Operasional > Proses Vendor | missing | No shipment, booking, manifest, delivery or reporting fact model |
| Modul > Keuangan > Piutang Dagang > Invoice (new) | missing | No Invoice; supporting Account storage DRAFT |
| Modul > Keuangan > Hutang Dagang > Pembayaran Hutang | missing | No Payment or Invoice; Account storage DRAFT |
| Laporan > Laporan Cabang > Detail Transaksi | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Rekap Transaksi | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Manifest Outbound | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Rekap Manifest | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Pengantaran | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Gross Profit / Manifest | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Rekap Transaksi Harian | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Rekap Gross Profit | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Manifest Vendor | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > AWB Tertunda | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > AWB Termanifest | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Rekap Customer Bulanan | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Rekap Omset Harian | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Cabang > Detail Transaction Inbound | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Kurir > Harian Kurir | partial | Courier exists; delivery/report facts missing |
| Laporan > Laporan Kurir > Laporan Detail Kurir | partial | Courier exists; delivery/report facts missing |
| Laporan > Laporan Keuangan > Laporan AR | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Laporan Keuangan > Laporan AP | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Reports Customer > Pengiriman | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Reports Customer > POD Kembali | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Reports Customer > Semua Status | missing | No approved report facts or reconciliation; D-15, financial definitions gated |
| Laporan > Report Customer | missing | No approved report facts or reconciliation; D-15, financial definitions gated |

UI examples is a local presentation route, not a provider leaf; it reads no model.


## Verification and acceptance

Existing development server only: `http://localhost:3000`. No dev/start server was launched or restarted. Browser evidence is local development verification, not staging or a live provider comparison. The dashboard provider image was used only for navigation, never visual styling. Prisma files were read only; no database commands were needed.

| Criterion | Result | Evidence |
|---|---|---|
| Provider-grounded navigation | PASS for supplied menu notes | 20 Master Data + 26 Modul + 22 Reports leaves; eight top-level entries in observed order |
| Depth and typed configuration | PASS | One disclosure level, flat path headers; one `navigation.ts`; unavailable destinations are text |
| Schema readiness map | PASS, documentation only | All 68 documented leaves plus undocumented top-level groups above; no schema edits |
| Reusable create/update layout | PASS locally | Three Radix tabs; vendor-style static example on `/ui-examples`; no persistence/business validation |
| Privacy and scope | PASS locally | Provider evidence ignored; no raw record values copied; no dependency/schema/migration/seed/auth/backend changes |
| Responsive/keyboard checks | PASS for exercised paths | Matrix and measurements below |
| Focused tests | PASS | Six UI tests including two new tests; 61 total tests |
| Typecheck / build | PASS | Actual scripts below |
| Whole-repository lint | FAIL, pre-existing | 182 errors, 182 warnings, 417 infos, same counts as iteration 1; scoped changed source passes |
| Impeccable finish and documentation review | ship | Fresh read-only reviewer inspected required captures/source, no material fixes. Separate documenter confirmed no material contradictions. Neither independently reran browser/tests. |
| Staging / human feature-owner acceptance | UNVERIFIED / PENDING | No staging target or human review available in this iteration |

FND-03 is **not DONE**. Iteration 2 implementation is complete; acceptance remains pending for the lint gate, staging and feature-owner review. Live provider parity remains unverified under D-29; missing evidence is not replaced with invented behavior. D-19, D-03/D-04 and domain decisions remain unresolved; no PLT-01 or later ticket was started.

### Commands and actual outcomes

Commands ran from `C:\Development\logistik-web`:

| Command | Outcome |
|---|---|
| `.\.agents\skills\impeccable\scripts\impeccable.cmd context --target src/app` | PASS, run once; then read selected persisted surface brief without editing private tooling files |
| `.\.agents\skills\impeccable\scripts\impeccable.cmd surface-brief read 'src/app/(dashboard)/page.tsx'` | PASS; Operate mode / incumbent refinement |
| `npx ctx7@latest library 'Radix UI' 'Tabs keyboard navigation activation and accessible tab panels'` | PASS; selected `/radix-ui/primitives` |
| `npx ctx7@latest docs /radix-ui/primitives 'Tabs Root Trigger Content keyboard arrow Home End activationMode automatic preserve form field values forceMount hidden panels'` | PASS; verified installed-package tab behavior against official source docs |
| `npm run lint` (raw output via `rtk bypass npm run lint`) | FAIL; pre-existing whole-repository diagnostics listed above. Raw log: system temporary directory, `fnd-03-iteration-2-lint.log` |
| `rtk bypass npm run lint -- --max-diagnostics=5` | FAIL; same pre-existing counts. Examples: untouched skill data JSON and CRLF in `vitest.integration.config.mts` / existing unit tests |
| `npm run typecheck` | PASS; final standalone exit 0 |
| `npm test` | PASS; four files, 61 tests. Two new tests cover 68-leaf inventory/nonlinks/flat structure and tab panel relationships/value retention/status/local submit |
| `npm run build` | PASS; Next.js 16.4.2 static `/`, `/ui-examples`, framework not-found. Final build follows final UI copy |
| `npx @biomejs/biome check src/components/shell src/components/patterns/form-layout.tsx src/components/examples/vendor-form-example.tsx 'src/app/(dashboard)/ui-examples/page.tsx' tests/ui/foundation.test.ts` | PASS; six files, no fixes required |
| `.\.agents\skills\impeccable\scripts\impeccable.cmd detect --json src/components/shell/app-shell.tsx src/components/patterns/form-layout.tsx src/components/examples/vendor-form-example.tsx 'src/app/(dashboard)/ui-examples/page.tsx'` | PASS; `[]`, exit 0; one detector pass |
| `git diff --check` | PASS |
| `git check-ignore docs/reference/app-provider/master-data/vendor-add.md` | PASS; private evidence path ignored |

The initial local source formatting/encoding issue was corrected before final gates. No new source lint failure remains. No dependency was added. No commit, push, deploy or file deletion was performed.

### Browser matrix

Chromium in-app browser, existing localhost development server. Required captures live in `docs/decisions/evidence/fnd-03-iteration-2/`; private `.agents/`, `.codex/` and `.impeccable/` files were not edited.

| Check | 375 × 812 | 768 × 1024 | 1440 (1000 interaction / 1024 final captures) |
|---|---|---|---|
| `/` and `/ui-examples`, breadcrumbs and responsive layout | PASS | PASS | PASS |
| Page horizontal overflow | None | None | None |
| Sidebar collapse/expand, named active route | N/A: drawer breakpoint | N/A: drawer breakpoint | PASS via Enter; active UI examples remains named |
| Nested navigation | Modules expanded; transaction header and Onsite leaves visible | Master Data areas expanded; all five area labels visible | Modules and Reports expanded; final Customer report leaf reachable |
| Mobile focus trap | Close + Tab wraps to Dashboard; reverse wraps to Close | Same forward/reverse checks PASS | N/A |
| Escape / trigger focus restoration | PASS; Open navigation restored | PASS; Open navigation restored | N/A |
| Mobile available-route dismissal | Dashboard link closes drawer and completes navigation to `/` | Dashboard link closes drawer and completes navigation to `/` | N/A |
| Active route | Mobile UI examples has `aria-current=page` | Breadcrumbs and shared route presentation inspected | Named current link verified in collapsed state |
| Form tab keyboard | ArrowRight selects Tax; Home returns Vendor data | End selects Accounting; Home returns Vendor data | ArrowRight / End / Home select and focus expected tabs |
| Table containment | Region 326px, content 682px; ArrowRight moves scrollLeft to 40 | Region/content 687px; fits | Region/content 1103px; fits |

`measurements.json` records clientWidth/scrollWidth equality: `/` 360/360, 753/753, 1440/1440; `/ui-examples` 360/360, 753/753, 1425/1425. Scrollbars account for 15px differences. Captures: `foundation-375.png`, `foundation-768.png`, `foundation-1440.png`, `examples-375.png`, `examples-768.png`, `examples-1440.png`, and `navigation-375.png`. A supplementary `vendor-375.png` shows field focus, not a full-page capture. Fresh reviewer validated the seven required captures.

UNVERIFIED: staging; live provider side-by-side inputs/outputs/permissions; missing vendor form image; undocumented menu descendants; uninspected private image contents; full screen-reader/browser-matrix audit. No automated accessibility certification is claimed.

Pre-existing Impeccable sidecar drift and unset marketing/showcase build-path preference were reported by the context loader. They remain untouched per the user's scope. `document` can refresh the sidecar separately; no build-path choice is needed for this Operate refinement.

## Changed files by purpose (iteration 2 only)

- Navigation: `src/components/shell/navigation.ts`, `src/components/shell/app-shell.tsx`.
- Form layout and demonstration: `src/components/patterns/form-layout.tsx`, `src/components/examples/vendor-form-example.tsx`, `src/app/(dashboard)/ui-examples/page.tsx`.
- Focused verification: `tests/ui/foundation.test.ts`; local screenshot/measurement files in `docs/decisions/evidence/fnd-03-iteration-2/`.
- Evidence/privacy/conventions/status: `.gitignore`, `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `docs/ROADMAP.md`, `docs/decisions/FND-03.md`, `docs/decisions/FND-03-surface.md`, this note.

Existing iteration 1 work and unrelated local changes were retained. `globals.css`, primitives, dependencies, Prisma schemas/migrations/seeds and tooling directories were not changed in iteration 2.

## Closure pass

2026-10-19. Status: **CLOSURE IMPLEMENTED / ACCEPTANCE PENDING**. This section supersedes the flat-navigation decision, old lint failure and missing-image assumption above. It does not overwrite their historical evidence. All local automated criteria pass, but unverified add-form evidence and the explicit D-29 gate prevent recording `IMPLEMENTED, READY FOR COORDINATOR SIGN-OFF`. Human acceptance is not recorded. PLT-01 and all other tickets remain outside this pass.

### Diagnosis and Impeccable review

Method: dual-agent, independent Assessment A (`critique_a`) and Assessment B (`critique_b`), before and after refinement. Mode: Operate. Target: `src/components/shell/app-shell.tsx`; derived critique slug: `src-components-shell-app-shell-tsx`. The context loader ran once. It reported stale Impeccable sidecar/surface context; these files were left untouched. No critique ignore list was present. The craft floor was read immediately before UI edits.

Fresh before captures at 375 × 812, 768 × 1024 and 1440 × 1024 show the rejected Modules disclosure. It exposes eight headers and 26 leaves at once. Headers and leaves begin on the same axis, with weak structural distinction. Long parent-path labels compete with item labels, while scrolling separates leaves from their parent and pushes the other top-level groups out of view. Hovered disclosure and active route also appeared too similar. The 375px drawer makes this scan especially costly. Existing breadcrumbs and honest unavailable semantics were strengths, not reasons to pass the sidebar.

The first bounded-disclosure implementation still required three clicks plus a scroll to see Rekap Omset Harian at 375px. That fails a strict three-interaction limit. The local filter therefore addresses a distinct recorded failure: direct access through a 14-item report section without scrolling. No command palette, dependency or new route was introduced.

| Nielsen heuristic | Before | After |
|---|---:|---:|
| Visibility of system status | 3 | 3 |
| Match with real world | 3 | 3 |
| User control and freedom | 3 | 3 |
| Consistency and standards | 2 | 3 |
| Error prevention | 3 | 3 |
| Recognition rather than recall | 2 | 3 |
| Flexibility and efficiency | 1 | 3 |
| Aesthetic/minimalist design | 2 | 3 |
| Error recovery | N/A | 3 |
| Help/documentation | 2 | 2 |
| Total | 21/36 | 29/40 |

Error recovery becomes applicable after filtering introduces a recoverable no-match state. These are design judgments, not automated accessibility scores. Independent final Assessment A found no P0/P1 design failure. Both assessments identified omitted standalone unavailable groups in search; the final fix includes those groups, adds regression coverage, and was checked in the final production build. Singular result grammar was also corrected. Minor remaining observation: drawer header and body repeat availability guidance. No further visual polishing was performed.

Specificity verdict: the restrained workbench remains conventional but appropriate for internal logistics work. Provider labels, visible boundaries and complete result paths now provide orientation. Power users gain direct filtering; keyboard users gain explicit expansion state and focus; mobile users avoid the long known-item scan. Initial navigation still has nine top-level entries. Search helps users who know a label; disclosure browsing remains available for users who do not.

Detector: initial, independent after-change, and final post-fix CLI scans returned `[]`, exit 0. No deterministic findings or false positives. Initial B used its own fresh localhost tab; after-change B could not open its own tab because its browser inventory was empty. Parent independently completed the production browser matrix and captured clean console logs. Mutable CDP injection was preflighted and reverted by B. The overlay/live-server flow was skipped because it persists tooling state under `.impeccable/`, which the user forbade changing. No overlay findings or visible overlay are claimed. Critique persistence/trend writing under `.impeccable/` was also skipped; this section archives the result instead. No overlay server or temporary body file was created. Parent test tabs were closed and viewport override reset.

Questions skipped: the user supplied the target, failure, candidate approaches and approval boundaries; no further design choice required clarification.

### Navigation decision and trade-offs

Keep `navigation.ts` as the single typed configuration. Add observed provider section paths to its existing English labels and provider leaf labels. Domain navigation renders provider labels for correspondence with the notes; this is a scoped presentation choice, not a translation or locale policy. Dashboard and UI examples remain the only implemented routes.

Use two disclosure levels: top-level group, then section. Only one group and one section are open at a time. Folder icons identify groups; chevrons and `aria-expanded` identify disclosure controls; guide borders, bounded indentation and nested lists identify leaves. Buttons use quieter hover styling than the active route. A current-page path appears before the menu, and route ancestors initialize expanded. A synthetic navigation test exercises a complete nested active path using the existing `/ui-examples` route; no operational test route was added. Actual foundation routes are top-level and have no collapsed ancestors.

The labeled local filter searches all 68 documented leaves, available routes and standalone unavailable top-level entries, matching existing English/provider labels and provider paths. Results show complete provider paths. Unavailable matches remain unlinked text with the existing unavailable treatment. Clear restores browsing and focuses the search field. Empty results explain recovery. Trade-offs: one additional control and some introductory vertical space, plus section paths still wrap in the narrow drawer. A two-pane rail would require a larger layout change. Filtering alone would leave the original browsing hierarchy failure unresolved.

### Browser walkthrough counts

Every attempt started from a fresh production load of `/`. Count one click to open the drawer, one click to focus Find menu item, and one text-entry interaction to enter the complete provider label. Desktop omits the drawer click. No scrolling, result click, destination activation or business action is included or required: the endpoint is seeing the unavailable leaf and its path. Each attempt returned one matching, fully visible, unlinked item. This conservative count includes an explicit focus click even though the drawer initially focuses search.

| Target provider leaf | 375px | 768px | 1440px |
|---|---:|---:|---:|
| Rekap Omset Harian | 2 clicks + 1 entry = 3 | 2 clicks + 1 entry = 3 | 1 click + 1 entry = 2 |
| Onsite Inbound | 3 | 3 | 2 |
| Jenis Kendaraan | 3 | 3 | 2 |
| Kode Pos | 3 | 3 | 2 |
| Pembayaran Hutang | 3 | 3 | 2 |

All 15 attempts required zero scroll gestures. `evidence/fnd-03-closure/walkthroughs.json` records the counts, bounding boxes and nonlink checks. These measurements demonstrate inspectability, not route availability.

### Vendor evidence and privacy

Inspected only `docs/reference/app-provider/master-data/redlogistik.tracks-app.com_index.php_vendors.png`, as requested. It shows the vendor export/list surface with a Tambah control; it does **not** show the Tambah Vendor form. Therefore the Data Vendor / NPWP / Accounting grouping and add-form field set remain **UNVERIFIED against the image**. Existing form notes remain OBSERVED, pending domain-owner review. No example change is justified by this image, and none was made. No other provider images were inspected in this pass.

The image contains real data. No row values, identifiers, contact information or provider pixels were copied into code, fixtures, tests, documentation or saved evidence. Browser captures contain only the local synthetic foundation. The private `docs/reference/app-provider/` directory remains ignored; its ignore rule was not changed.

### Actual commands and outcomes

`package.json` was inspected: lint is `biome check`, typecheck is `tsc --noEmit`, test is `vitest run`, build is `next build`, start is `next start`. RTK's condensed npm lint output initially hid the result, so the real scripts were run through `rtk bypass`. Final source was validated after the search completeness fix.

| Exact command | Final result |
|---|---|
| `rtk bypass npm run lint` | PASS, exit 0; 48 files checked, no fixes applied |
| `rtk bypass npm run typecheck` | PASS, exit 0 |
| `rtk bypass npm test` | PASS, exit 0; 4 files, 64 tests |
| `rtk bypass npm run build` | PASS, exit 0; Next.js 16.4.2; static `/`, `/ui-examples`, framework not-found |
| `rtk bypass npm run start -- --port 3103` | PASS; final production server ready in 312ms; inspected in browser, then stopped |
| `.\.agents\skills\impeccable\scripts\impeccable.cmd detect --json src/components/shell/app-shell.tsx src/components/shell/navigation.ts` | PASS, exit 0; `[]` after final UI fix |
| `git diff --check` | PASS |
| `git check-ignore docs/reference/app-provider/master-data/redlogistik.tracks-app.com_index.php_vendors.png` | PASS; path ignored |

Focused formatting used `npx @biomejs/biome check --write` on only the changed shell files and `tests/ui/foundation.test.ts`. The existing inventory test now checks disclosure structure/provider labels/nonlinks; three new navigation tests cover exclusive disclosure, initial nested active path, and provider/English search, no-match recovery, standalone groups and clear focus. Existing form tests were retained. No new tests for unrelated modules were added.

Current API checks used Context7 library resolution for Next.js and `rtk bypass npx ctx7@latest docs /vercel/next.js/v16.2.9 "usePathname active links in App Router client component"`. The closest indexed version was 16.2.9; installed 16.4.2 local `use-pathname.md` and production guide were also read. Active route logic stays in the existing Client Component; pages/layouts remain Server Components.

### Local production smoke and criterion results

Coordinator decision, 2026-10-19: no staging exists. For FND-03 only, build/start plus local production smoke replaces staging smoke. Staging carries to FND-02. The team-wide definition of done in AGENTS.md is unchanged. Production used port 3103; existing dev server on port 3000, PID 10696, was neither restarted nor stopped. Each owned production run was stopped with Ctrl+C through its recorded execution session. Final listener inspection showed 3000/PID 10696 only; 3103 was closed.

| Criterion | Result and evidence |
|---|---|
| Fresh diagnosis at 375/768/1440 | PASS; `before-375.png`, `before-768.png`, `before-1440.png` |
| Group/leaf structural distinction; bounded depth | PASS; two button disclosure levels, folder/chevrons, nested lists; `navigation-*.png` |
| Active full path visible/expanded on load | PASS; actual Dashboard/UI examples paths inspected; synthetic nested-path test passes |
| All five leaves within three interactions | PASS; 15 fresh-load production walkthroughs, no scrolling |
| Keyboard/accessible names/expansion/focus | PASS for exercised controls; Enter opens group, Space opens section, both `aria-expanded=true`; 2px blue focus outline |
| Drawer focus trap, Escape, focus restoration | PASS on both routes at 375/768; Close + Tab wraps to search, Shift+Tab wraps to Close; Escape closes and focuses Open navigation |
| Available-route drawer dismissal | PASS at 375/768; Dashboard selection navigates to `/` and removes dialog |
| Desktop compact recovery | PASS on both routes at 1440; named active link keeps `aria-current=page`, Enter restores full sidebar |
| No horizontal page/navigation overflow | PASS at all widths; clientWidth equals scrollWidth; nav widths 265/368/240px also equal scroll widths |
| Form tab keyboard | PASS at all widths; ArrowRight selects Tax, End selects Accounting, Home selects Vendor data |
| Table containment/keyboard scroll | PASS; 375px region 326/content 682px, ArrowRight changes scrollLeft 0 to 40; 768px 687/687, 1440px 1103/1103 |
| Console | PASS; final production warning/error log `[]` |
| Actual lint/typecheck/test/build | PASS; commands above |
| Local production substitute | PASS; both routes at all three widths; own server stopped |
| Vendor add-form visual match | UNVERIFIED; supplied image is a list, handled as requested |
| D-29 live provider comparison/access/archive gate | UNVERIFIED / OPEN; cannot claim parity or clear the PRD gate |
| Human acceptance | PENDING; coordinator only |

Saved `production-smoke.json` records page client/scroll widths: `/` 360/360, 768/768, 1440/1440; `/ui-examples` 360/360, 753/753, 1425/1425. Vertical scrollbars account for narrower client widths. Final captures include `foundation-{375,768,1440}.png`, `examples-{375,768,1440}.png`, `navigation-{375,768,1440}.png`, and `search-{375,768,1440}.png`. `navigation-keyboard.json` records expanded-state, visible-focus, containment and route-dismissal checks. `console.json` records final warning/error logs. Initial bounded-tree captures are exploratory evidence, not the final three-interaction claim. Screenshots alone do not prove keyboard or screen-reader behavior; recorded browser interactions provide the keyboard evidence. No screen-reader certification is claimed.

### Decisions, carry-overs and sign-off checklist

PRD section 7 lists D-19 as needed before FND-01/RPT-01, not as a specific FND-03 acceptance criterion. It remains TBD and non-blocking for these policy-neutral presentation examples. No date, timezone, formatting or translation policy was added.

D-29 is different: PRD section 7 says `Blocks: All`, `Needed before: Phase 1 start`; ROADMAP Phase 0 also requires oracle access, and the FND-03 row explicitly tracks D-29 evidence. The earlier FND-03 evidence note required menu comparison before acceptance. The menu-note inventory is implemented and inspected locally, but no live parity/access/archive approval has been supplied. This pass cannot truthfully classify D-29 as non-blocking or weaken it. Keep acceptance pending and surface the gate to the coordinator.

Carry-overs: live provider parity and archival/access approval (D-29); all other uninspected screens; the two DRS questions (whether Kurir Kota can delete DRS, whether Print DRS is a read table); undocumented System Settings/Office/Ticketing/Tutorial descendants; staging environment/smoke under FND-02; domain-owner review of provider notes; a screen-reader audit. None becomes an implemented permission, workflow or approved business rule.

Coordinator sign-off checklist (unchecked; no acceptance implied):

- [ ] Review the revised sidebar at 375/768/1440 and accept or reject the original confusing-navigation finding.
- [ ] Independently rerun typecheck, test and build, as planned; review the recorded lint result.
- [ ] Address the explicit D-29 access/parity/archive gate with the responsible owners and required evidence.
- [ ] Resolve the add-form image verification gap; retain any uninspected behavior as UNVERIFIED.
- [ ] Confirm the documented FND-03-only local production smoke substitution and FND-02 staging carry-over.
- [ ] Once required criteria are verified, set `IMPLEMENTED, READY FOR COORDINATOR SIGN-OFF`; only the coordinator records human acceptance and flips FND-03 to DONE.

### Changed files and repository handoff

Navigation: `src/components/shell/navigation.ts` and `app-shell.tsx`. Focused tests: `tests/ui/foundation.test.ts`. Conventions/status/evidence: `AGENTS.md` (navigation paragraph only), `DESIGN.md`, `docs/ROADMAP.md` (FND-03 row only), `docs/decisions/FND-03-surface.md` and this appended section. Captures/measurements: `docs/decisions/evidence/fnd-03-closure/`.

The working tree was already dirty. Existing tracked changes include dependencies/configuration, database tooling, tests and the removed starter page; they were preserved, not adopted as closure work. Existing untracked `.agents/`, `.codex/`, `.impeccable/` are tooling directories for coordinator review; none was staged or intentionally edited. Existing FND-03 source/docs are also untracked in this checkout. No dependency, Prisma schema/migration/seed, authentication/RBAC, backend integration or business logic was changed in this closure pass. No files were deleted, and no commit, push or deploy was performed.

## Final closure

2026-10-19. **DONE** under the coordinator's supplied closure rule. This section supersedes earlier pending statuses and the unchecked historical checklist. Coordinator statements below are coordinator-reported, not this agent's independent verification. PLT-01 remains untouched.

### Provider evidence inspected in this pass

Listed `docs/reference/app-provider/master-data/` by descending modification time. The newest image, `vendor-form-add.webp` (2026-10-19 14:21:39 local filesystem time), shows Tambah Vendor with Data Vendor, NPWP and Accounting tabs. The visible Data Vendor fields match the synthetic example: name, two address lines, city, postal code, phone, fax, contact name, email, branch and an ON/OFF status control, with Submit and Kembali actions. **VERIFIED against the example** for tab grouping and this visible field set. Only Data Vendor is open; NPWP/Accounting field contents, validation, persistence and other behavior remain UNVERIFIED. English example labels are presentation choices; D-19 remains open. No UI change was required.

Inspected only that vendor image and the coordinator-specified Kurir Kota DRS screenshot, accessed by literal path. The DRS image shows red trash/delete controls; no action was executed. **OBSERVED (coordinator, admin account):** Kurir Kota permits admin deletion of a DRS, as coordinator-reported; this agent verified only the visible control. **OBSERVED (coordinator, admin account):** Print DRS is a read-only table, not a print action; the label may change later. Print DRS behavior was not independently inspected. Both answers require Dev 2 domain review and approve no implemented action, permission or business rule. Private provider notes were not edited. No provider pixels, row values, customer/employee information or AWB identifiers were copied into committed artifacts.

### Coordinator decisions and acceptance

- Coordinator-reported, 2026-10-19: revised sidebar accepted overall. Individual viewport/checklist items were not separately ticked or attested; no individual human checks are inferred.
- Coordinator-reported: independent typecheck, test and build passed. This agent also ran all four required commands below.
- Coordinator-reported: provider access uses an admin account; ignored screenshots are excluded from the repo and are not archived. D-29 is recorded as CONFIRMED by coordinator in PRD section 7. Admin access alone cannot establish role-level permission parity (D-04, AC-08). Side-by-side evidence must be described in PR text, not archived images.
- Coordinator-reported: local production smoke substitutes for staging for FND-03 only. Existing local production evidence above remains historical agent evidence; it was not rerun in this final pass. FND-02 CI/staging is deferred until feature work exists and remains required for Phase 1 exit.
- Coordinator-reported: `.agents/`, `.codex/` and `.impeccable/` should be committed after safety review. Local cache/consent state is excluded through narrow ignore rules.

### Current closure criteria

| Criterion | Result |
|---|---|
| Agent runs lint now | PASS: `rtk bypass npm run lint`, exit 0; 48 files, no fixes |
| Agent runs typecheck now | PASS: `rtk bypass npm run typecheck`, exit 0 |
| Agent runs test now | PASS: `rtk bypass npm test`, exit 0; 4 files, 64 tests |
| Agent runs build now | PASS: `rtk bypass npm run build`, exit 0; static `/`, `/ui-examples`, framework not-found |
| Add-form evidence | VERIFIED: three tab labels and visible Data Vendor fields match; hidden tab fields remain UNVERIFIED |
| D-29 recorded | PASS: coordinator-confirmed admin access/non-archival decision and permission-parity limitations in PRD |
| Acceptance recorded | PASS: coordinator-reported overall sidebar acceptance; individual human checks not claimed |

Current sign-off checklist (scope of each tick is explicit):

- [x] Record coordinator-reported overall revised-sidebar acceptance; individual human checklist checks remain unreported.
- [x] Record coordinator-reported independent typecheck/test/build passes; agent's fresh lint/typecheck/test/build also pass.
- [x] Record coordinator-reported D-29 access/non-archival decision and remaining D-04/AC-08 limitations.
- [x] Verify new add-form image's tab grouping and visible fields; retain hidden content as UNVERIFIED.
- [x] Record coordinator-reported FND-03-only production-smoke substitution and FND-02 staging carry-over.
- [x] Record coordinator-reported acceptance and set FND-03 DONE after every supplied closure condition passes.

Carry-overs remain: live provider inputs/outputs/permissions parity; all uninspected screens and hidden tab content; undocumented System Settings/Office/Ticketing/Tutorial descendants; domain-owner review of provider notes, including Dev 2's two DRS observations; screen-reader/browser-matrix audit; staging and CI under FND-02. None is silently verified by this closure. D-19 stays open; no locale/timezone policy, auth, RBAC, CRUD, backend integration or DRAFT-model usage was added.

### Commit scope and safety review

The UI commit adopts existing FND-03 package/configuration, shell, primitives, patterns, synthetic examples and UI tests, including the already removed starter page. No new dependency or file deletion was performed in this pass. The docs commit includes synthetic localhost evidence only. Private `docs/reference/app-provider/` remains ignored; `git ls-files docs/reference` returns no files. Existing unrelated database/auth/backend/test changes are excluded from staging. The existing `next.config.ts` development-origin change is also left unstaged because it is outside the supplied commit path groups.

Tooling review excludes `.impeccable/hook.cache.json` (session/cache state) and `.impeccable/config.local.json` (local consent). `live-browser-session.js` is reusable source code, not session data. The bundled Impeccable 0.1.15 Windows executable is 19,672,464 bytes; it is an intentional runtime asset, not a cache. Source, JSON, launchers and local synthetic review captures are reviewed for secrets/provider data before staging. No binary decompilation or external provenance certification is claimed.

Final scan result: 146 candidate files, 25,191,561 bytes. No `JKT` followed by digits, private-key headers or assigned-secret patterns were found. A credential-prefix pattern matched inside `.agents/skills/impeccable/scripts/bin/windows-x64/impeccable.exe`; the value was neither displayed nor copied. This is a credential-like finding, not a confirmed credential or a cleared false positive. Per the supplied safety rule, **skip the entire tooling commit** and leave `.agents/`, `.codex/` and `.impeccable/` unstaged. Resolving or including that binary requires coordinator input. The other candidate text content passed these pattern checks; 33 synthetic local UI images were visually reviewed together. Pattern scans do not prove the absence of every possible secret. Commit only the UI and docs groups; this tooling exception does not weaken FND-03's supplied DONE conditions.
