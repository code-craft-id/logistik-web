# Dev3 legacy migration parity audit

## 1. Audit metadata and baseline

2026-11-16, Asia/Bangkok. Branch `codex/dev3-ready-for-review`, HEAD `b8829d74c6a714cac74af5e672a9b8cf3ac46ef8`. Preflight found only untracked `DEV3-LEGACY-NAVIGATION-INVENTORY.md`; preserved unchanged. This audit changes documentation only. Single agent; no implementation, mutation, test-suite rerun, merge or deployment.

Evidence keys (repository-relative links):

- **I:** [navigation/page inventory](DEV3-LEGACY-NAVIGATION-INVENTORY.md), observed earlier on 2026-11-16; exact legacy URLs, hierarchy, controls/column order and bounded outputs. Retained as evidence, not recreated. Origin `<legacy-origin>/index.php/`; displayed IVAN, Administrator role user-provided, effective permissions unverified.
- **L:** [DISC-04 catalogue](../agent-state/dev3/REPORT_CATALOGUE.md), stable LP identities and LD observations. Historical observations do not prove current behavior or source formulas.
- **S:** [SUP-01 contract](SUP-01-contract.md).
- **A:** [owner-adopted minimum scope and RPT-03/04 extension](DEV3-SUP-RPT-FOLLOWUPS.md), 2026-11-15. Explicit NOT NEEDED dispositions remain valid.
- **R1/R2:** [transaction contract](RPT-01-contract.md), [operational contract](RPT-02-contract.md).
- **F1/F2:** [invoice contract](FIN-01-contract.md), [adopted A+B](FIN-02-contract.md), [implementation evidence](FIN-implementation.md).
- **M:** current disk source at baseline SHA, specific paths below. Source verification proves structure/logic, not successful rendering or parity with hidden legacy rules.

Runtime attempt: Chrome DevTools Lab `list_pages` failed connection to port 9333. Connected Chrome listing found existing legacy tab and localhost:3000 finance tab. Binding the modern tab timed out on focus emulation, including one focused retry. Native Windows fallback stopped because it could not establish the browser URL confidently enough to enforce policy. Browser work ended; no further bypass/retries. **This describes the initial pass; the browser follow-up below supersedes it only for explicitly listed surfaces.** Earlier I observations remain applicable only to their recorded scope. No credentials, business mutations, private row values or exported files retained. This is a concrete verification limitation, not evidence pages fail.

**B — Browser follow-up, 2026-11-16:** user requested another audit using the current Chrome tab. Lab still refused connection; standard DevTools showed only a separate blank browser. Connected Chrome successfully bound the current authenticated legacy Detail Transaksi tab. The modern background tab initially timed out; after the existing modern tab became active, binding succeeded. Native UI activation had coordinate/input-state failures, so no causal claim that the agent fixed the browser is made. No server/config changes or duplicate browser launched.

Current legacy page reconfirmed 14 headers, date range 2016-11-01–2026-11-16 and populated indicator 1–16 of 82,201; private rows omitted. This was an already-loaded result, not a new broad historical query. Fourteen modern page surfaces rendered in existing `localhost:3000` session: invoice list; ticket list/new; transaction report; manifest report; delivery sheets/items; Dashboard; accounting overview/accounts/journals/costs/periods/reports initial filters. Modern branch options visibly use FAKE fixtures. Session allowed the listed pages; no nonadmin/denied case or production identity equivalence established.

Browser queries used only 2026-11-01–2026-11-16. Ticket search `audit-no-match` showed the no-match state and reset links. Transaction, manifest, sheet and item queries returned 0 records. Dashboard returned four 0 counts with correct date-basis labels and report links. Transaction query exposed Unduh CSV with the same period/order and stated max5000, but no download was executed. Empty datasets do not prove populated table rendering, sorting/paging correctness or source reconciliation.

FIN overview/accounts/journals/costs/periods rendered empty states and forms; manual journal disclosure opened without input/submission. Financial report filters rendered. A read-only report query using a branch from the visible FAKE options and the bounded dates did not produce a verifiable output: subsequent reads timed out (Runtime.evaluate/focus emulation), and observed URL remained `/finance/accounting/reports` without confirmed query parameters. Its submission outcome is UNVERIFIED, not a confirmed backend defect. Two direct Page.navigate attempts (ticket new/delivery) timed out while the old page remained; visible links subsequently reached those pages. Native UI later returned stale/inconsistent page/address content and was not used to certify results. Tool timeouts were not treated as product failures.

**B precedence:** per-page B notes below supersede initial “runtime UNVERIFIED” wording only for observed empty/initial render and successful read-only interactions. Modern invoice new/detail, populated ticket detail/approval, all preview routes, denied roles, export files and financial report results were not browser-verified in this follow-up. No writes, record creation, issue/post/close/reversal, legacy business forms, private exports, screenshots or application changes. No EXACT/equivalence promotion follows from this pass.

Status conventions: implementation DONE means source-backed accepted target implemented; it does not promote ROADMAP release acceptance. FIN ROADMAP remains PARTIAL for human/migration/staging gates. PREVIEW_ONLY is presentation without a working report query. SHARED_IMPLEMENTATION records a shared route, not equivalence. Parity APPROVED_DEVIATION applies only to the cited adopted subset, not unknown rules. No page earns EXACT or VERIFIED_EQUIVALENT without all relevant dimensions demonstrated.

Progress: SUP, all 22 reports plus Dashboard, and FIN complete to explicit evidence limits. No pending page assessment; unknown dimensions remain named UNVERIFIED. A dimension marked UNVERIFIED has a stated evidence limit; no silent parity pass.

## 2. Executive coverage matrix

| Ticket | Legacy pages | Modern routes | Implementation | Parity | Unresolved |
|---|---|---|---|---|---|
| SUP-01 | Four support surfaces | /ticketting, /new, /[id] | DONE bounded create/list/detail; approval MISSING | PARTIAL_PARITY; approved omissions | Lifecycle/attachment scope conflict, role behavior, runtime |
| RPT-01/03/04 | LP-R01 | /branch-reports/transaction-details | DONE accepted nine-field query/filter/sort/CSV target | PARTIAL_PARITY; approved target differences | Five fields, customer/billing/mode filters, export parity, runtime |
| RPT-02 | LP-R03/05/09, Dashboard | /branch-reports/manifest-outbound, /delivery, /manifest-vendor, /dashboard | DONE manifest/delivery/dashboard subset; vendor MISSING | PARTIAL_PARITY; vendor APPROVED_DEVIATION | Legacy aggregates/finance widgets, vendor scope conflict |
| Broader RPT inventory | Other 18 LP identities | 15 preview identities plus three missing recap pages | PREVIEW_ONLY / MISSING | NOT_MIGRATED | No dedicated real queries/exports or demonstrated duplicates |
| FIN-01 | Invoice, debt, AR, dashboard references | /finance/invoices/* | DONE adopted implementation; ROADMAP acceptance PARTIAL | PARTIAL_PARITY / LEGACY_UNVERIFIED; supplier settlement APPROVED_DEVIATION | Legacy search/columns/export/lifecycle, no historical import |
| FIN-02 | Available finance references; accounting legacy unknown | /finance/accounting/* | DONE adopted implementation; ROADMAP acceptance PARTIAL | LEGACY_UNVERIFIED; manifest GP NOT_MIGRATED | No legacy formula equivalence; ledger/COA/P&L source provenance unknown |

## 3. SUP page-by-page audit

M sources: `src/features/ticketing/{contracts.ts,actions.ts,server/service.ts,components/ticket-form.tsx,components/ticket-views.tsx,components/ticket-pages.tsx}` and three `/ticketting` page entry points. Service reloads authority and current scope. Ordinary visibility is creator plus allowed current branch; explicit administrator override. This is an adopted security target, not demonstrated legacy permission equivalence.

### SUP-LIST — Ticketing > Tiket Support

Legacy `ticketing-support`; modern `/ticketting`. **Implementation DONE; parity PARTIAL_PARITY; disposition KEEP** for accepted subset, omitted lifecycle INTENTIONALLY_DEFERRED under A.

| Dimension | Comparison and evidence |
|---|---|
| Navigation | I verifies legacy sidebar/Add/eye routes; M links Buat tiket and Lihat. Canonical spelling is `/ticketting`. Rendered access/discoverability UNVERIFIED due browser failure. |
| Presentation | Legacy Date/No. Ticket/Judul/Link URL/Status/Approval/Approve By/Action. Modern ID internal/Dibuat (UTC)/Judul/Menu/Cabang (ID)/Prioritas/Link URL/Aksi. Legacy number and approval indicators omitted, extra scope/priority shown (S/A). |
| Interaction | Legacy Select Searching/Search/Refresh/local Search/sort affordances; modern subject/menu search max100, clear search, previous/next, fixed createdAt DESC/id DESC; pageSize default20/max100. No arbitrary column-sort or legacy searching-mode parity. M defines empty/no-match states; fresh runtime UNVERIFIED. |
| Data | Ticket table, nondeleted creator/current-branch predicate; rows/count same RepeatableRead snapshot. I had one legacy row, no imported record correspondence. Legacy creator/branch visibility UNVERIFIED; no same-record reconciliation. |
| Business behavior | Priority Low/Normal/High; no editable lifecycle/status/approval fields. Actor/time server-owned; legacy numbering/transition rules unknown. Explicitly omitted via S/A, not accidental missing helpdesk implementation. |
| Export | Neither I list nor modern list exposes report export; universal absence outside inspected surface UNVERIFIED. |
| Verification | B: Ticketing rendered empty (0 tickets); read-only audit-no-match search settled to Tidak ada tiket yang cocok with Hapus pencarian/Kembali links. No populated table, detail, sort or paging case available. Initial evidence: I + L LD017/020 and M. Earlier contract checks are historical; no fresh rendering/security execution. |

Smallest correction for comprehensive parity: retain this list, separately define and source legacy number/status/approval data before adding columns. D-16; ordinary access must retain central authorization. Do not invent values or broaden reads to imitate Administrator visibility.

### SUP-ADD — Ticketing > Tiket Support > Add

Legacy `ticketing-support/tambah`; modern `/ticketting/new`. **Implementation DONE; parity PARTIAL_PARITY; disposition KEEP**; attachments/Picture INTENTIONALLY_DEFERRED by A (SUP-03).

| Dimension | Comparison and evidence |
|---|---|
| Navigation | Legacy Add link and modern permissioned create entry exist (I/M). Rendered routing UNVERIFIED. |
| Presentation | Legacy Date/Priority/Subject/Upload File/Nama Menu/Picture+Detail/URL/Remarks/submit/Back. Modern branch/Priority/Judul/Menu/related URL/remarks; server creation time replaces submitted Date; no file/Picture controls (S/A). |
| Interaction | M pending/busy feedback, disabled submit, safe retry key and server result feedback; no attachment interaction. Live create intentionally not submitted; feedback runtime UNVERIFIED. |
| Data | New Ticket with actor/branch and unique creator+UUID retry key, not legacy import/AWB/customer relation. Fresh branch validation; current allowed active hierarchy. Legacy ownership source UNVERIFIED. |
| Business behavior | Strict input: positive Int branch; subject/menu trimmed 1–200; URL max2048, http(s) without credentials or single-slash path, no controls/backslashes; remarks max5000; explicit Low/Normal/High; UUID. Same-token identical retry reuses authorized row, changed payload conflicts. Legacy backend limits/defaults/idempotency UNVERIFIED. These are S target safeguards. |
| Export | Not a report; no export exposed on either inspected create form. Attachments are an omitted input/output capability, not export parity. |
| Verification | B: Buat tiket rendered branch selector, explicit Low/Normal/High, required basic fields, inert-URL guidance and save/back controls; no date/file/Picture fields. No form submitted. Initial evidence: I form + L LD036 priorities; M contracts/form/service. No fresh successful save or denied-branch browser proof in this audit. |

Comprehensive-target conflict: reinstating files/Picture requires revising NOT NEEDED, D-16/D-25 storage/access/limits and safe attachment retrieval. Existing approval does not authorize that functionality automatically.

### SUP-DETAIL — Ticketing > Tiket Support > eye detail

Legacy `ticketing-support/chat/[id]` (private ID redacted); modern `/ticketting/[id]`. **Implementation DONE; parity PARTIAL_PARITY; disposition KEEP**, omitted extensions INTENTIONALLY_DEFERRED.

| Dimension | Comparison and evidence |
|---|---|
| Navigation | Legacy existing eye link inspected; modern ID link generated from scoped rows. Missing/inaccessible modern ID shares not-found behavior (S/M). Actual current navigation UNVERIFIED. |
| Presentation | Legacy Edit Ticketing title; basic date/priority/subject/menu/URL/remarks plus file/Picture/Detail/Back. Modern subject heading, internal ID, UTC time, owner branch/creator IDs, menu/priority/inert URL/remarks and list link. No attachment/status/history panel. |
| Interaction | Modern readonly detail; URL displayed as escaped inert text. Legacy detail's file/Picture affordances skipped; no mutation/editability test. History/comment/edit/reopen functionality UNVERIFIED in legacy, absent in target. |
| Data | Modern current authorized Ticket, nondeleted and scoped; no legacy record migration demonstrated. Creator/branch IDs are provenance, not a lifecycle history. |
| Business behavior | No assignment/transition/approval engine; S/A deliberately exclude it. Legacy transition rules not inferred from title or labels. |
| Export | Legacy attachment link observed but not downloaded; modern attachment retrieval absent under SUP-03 omission. Format/access safety UNVERIFIED. |
| Verification | I + LD020; M detail DTO/view/service. No browser runtime this pass. |

### SUP-APPROVAL — Ticketing > Persetujuan Tiketing

Legacy `approval-ticketing`; no modern standalone equivalent. **Implementation MISSING; parity APPROVED_DEVIATION; disposition INTENTIONALLY_DEFERRED** (A/SUP-02). Comprehensive parity would require revisiting that omission, not relabeling SUP-01 incomplete retroactively.

| Dimension | Comparison and evidence |
|---|---|
| Navigation | I separate sidebar destination; no corresponding target page/action in bounded SUP routes. |
| Presentation | Legacy Approval Ticketing; Search; Judul/Nama Menu/Link URL/Action. Modern absent. |
| Interaction | Legacy empty list, approval/detail outcome UNVERIFIED; target lacks queue/search/approval actions. |
| Data | Legacy queue inclusion/role/branch and history source UNVERIFIED. No target approval model/workflow. |
| Business behavior | Approve/reject rules, actors, transitions, reason/history and side effects UNVERIFIED; never tested by mutation. D-16 owner rule needed if scope reinstated. |
| Export | None exposed by I; uninspected workflow export UNVERIFIED. Target absent. |
| Verification | I empty queue, S/A explicit exclusion, M target surface. No denial/global absence inferred from empty legacy result. |

## 4. RPT page-by-page audit

M sources for this batch: `src/app/(dashboard)/branch-reports/**/page.tsx`, `/courier-reports`, `/financial-reports`, `/customer-reports`, `/dashboard`; `src/features/reports/{transaction-details,operational}/{contracts.ts,filters.ts,server/service.ts,components/report-view.tsx}`; transaction `csv.ts`; `src/features/reports/preview/screens.ts`; `src/components/patterns/{preview-screen,preview-workspace}.tsx`.

**Preview rule:** PreviewScreenPage explicitly states all rows/selections synthetic, no operational load/save. PreviewWorkspace search/sort/paging are local synthetic interactions; export tools disabled. Shared grouping does not consolidate business queries or prove equivalence. All preview data/business/exports are NOT_MIGRATED, with unknown legacy semantics separately UNVERIFIED. Pinned source and I, not the mere existence of a route, determine this conclusion.

**Operational rule:** R1/R2 use fresh independent report grants, bounded inputs and RepeatableRead reads. Ordinary Transaction rows scope to current allowed origin OR destination; manifest/DRS ownership differs. UTC/max31 days is adopted policy, not inferred legacy timezone. Runtime and same-source reconciliation remain UNVERIFIED this pass. Global D-15/D-19/D-22 are not settled by bounded acceptance.

#### Laporan-laporan > Laporan Cabang

### LP-R01 — Laporan-laporan > Laporan Cabang > Detail Transaksi

Legacy `<legacy-origin>/index.php/detail-transaction`; modern `/branch-reports/transaction-details`. **Implementation DONE; parity PARTIAL_PARITY; disposition KEEP.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: AWB No.; tanggal; Moda; Servis; Asal; Tujuan; Pengirim; Penerima Barang; Koli; Kilo; Deskripsi; Status Pengiriman; Komentar; Diterima Oleh Modern: Nine columns AWB No./tanggal (UTC)/Asal/Tujuan/Pengirim/Penerima Barang/Koli/Kilo/Status Pengiriman. Moda, Servis, Deskripsi, Komentar, Diterima Oleh absent by A; no customer/billing/mode filters. Separate endpoint filters and nine-column asc/desc sorting implemented by RPT-03. |
| Interaction | Legacy controls: Periode pair; Asal=Semua Asal; Tujuan=Semua Tujuan; Pelanggan=Semua Pelanggan; Jenis Biaya=Semua Pembayaran; Moda=Semua Moda; Status=Semua Status; Cari; Ekspor; Refresh. Observed: Initial current-day Processing; existing historical query populated, Showing 1 to 16 of 82,201 entries; not reconciled. Modern validated GET filters, deterministic sorting and paging; no legacy customer/billing/mode filters. B verifies only the expressly recorded read-only/empty-state interactions; deeper behavior UNVERIFIED. |
| Data | Transaction.id grain; nondeleted, all stored statuses including Cancelled, transactionDate UTC inclusive max31 days; branch origin OR destination scope plus separate endpoint AND filters; literal AWB50. Null quantities preserved; no financial totals. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Transaction.id grain; nondeleted, all stored statuses including Cancelled, transactionDate UTC inclusive max31 days; branch origin OR destination scope plus separate endpoint AND filters; literal AWB50. Null quantities preserved; no financial totals. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | RPT-04 UTF8 nine-field CSV; max5000 with overflow rejection; full filtered/sorted set independent of pagination; view+export permissions rechecked, private/no-store, CRLF/quoting/formula-prefix protection. Legacy Ekspor file structure unknown; approved CSV is not Excel parity. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | B: Initial nine-column/UTC disclosure, endpoint/sort controls rendered; bounded November query settled to 0 rows and Unduh CSV link with matching dates/order/max5000 text. File, populated headers, sort/paging and denied rights remain unverified. Legacy current tab reconfirmed fourteen headers and populated historical indicator without retaining rows. Initial evidence: I LP-R01, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: adopted R1/R2/A subset; keep existing functionality and separately source omitted fields/filters before parity expansion (D-15/D-19/D-22).

### LP-R02 — Laporan-laporan > Laporan Cabang > Rekap Transaksi

Legacy `<legacy-origin>/index.php/recaps-transactions`; modern `—`. **Implementation MISSING; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Not exposed in parameter-only initial view; output unverified. Modern: No dedicated target. Existing daily-turnover preview is a different LP-R13 identity; no aliases or report service references to recaps-transactions found. Legacy multiple-sheet/month/branch export not implemented. |
| Interaction | Legacy controls: Bulan=November; year=2026; Cabang=JAKARTA; Jenis Lembar=-- Multiple Sheet --; Ekspor Excel. Observed: Parameter-only view. No dedicated modern interaction. Browser behavior UNVERIFIED. |
| Data | Aggregation/date/payment/source semantics unavailable in I; no target dataset or totals to compare. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No dedicated target. Existing daily-turnover preview is a different LP-R13 identity; no aliases or report service references to recaps-transactions found. Legacy multiple-sheet/month/branch export not implemented. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | No target export; legacy Ekspor Excel contents UNVERIFIED. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R02, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R03 — Laporan-laporan > Laporan Cabang > Manifest Outbound

Legacy `<legacy-origin>/index.php/branch-manifest`; modern `/branch-reports/manifest-outbound`. **Implementation DONE; parity PARTIAL_PARITY; disposition KEEP.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Manifes No.; Tanggal; Asal; Tujuan; Penjual; Tot. AWB; Tot. Koli; Tot. Berat; Tot. Volume; Tot. Biaya (Rp.); Kendaraan; Sopir; Status; Aksi Modern: Modern eight columns Manifes No./Tanggal (UTC)/Cabang pemilik/Jenis/Kendaraan/Kurir manifest/Status/Penugasan aktif terlihat. Legacy fourteen include Asal/Tujuan/Penjual and quantity/cost/driver/action columns; these are not migrated by relabeling courier as driver. |
| Interaction | Legacy controls: Tanggal=2026-11-16; Cabang=JAKARTA; Daftar Manifes. Observed: Header-only table; no row detail available. Modern bounded GET period/branch/search and paging; fixed date/ID ordering, no general column sorting. B verifies only the expressly recorded read-only/empty-state interactions; deeper behavior UNVERIFIED. |
| Data | Manifest grain, manifestDate UTC/max31; owning branch, nondeleted; visible active unreleased item count intersecting Transaction access. No vendor/cost/weight aggregate. Real stored type/status, not derived legacy buckets. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Manifest grain, manifestDate UTC/max31; owning branch, nondeleted; visible active unreleased item count intersecting Transaction access. No vendor/cost/weight aggregate. Real stored type/status, not derived legacy buckets. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | No operational export implemented; I exposes no export for this inspected surface. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | B: Bounded November manifest query rendered expected explanation/filters and 0-row result. Populated eight-column table/row actions unavailable. Initial evidence: I LP-R03, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: adopted R1/R2/A subset; keep existing functionality and separately source omitted fields/filters before parity expansion (D-15/D-19/D-22).

### LP-R04 — Laporan-laporan > Laporan Cabang > Rekap Manifest

Legacy `<legacy-origin>/index.php/branch-manifest-recaps`; modern `—`. **Implementation MISSING; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Not exposed in parameter-only initial view; output unverified. Modern: No dedicated manifest recap target or source query; not the manifest inventory list. Legacy month/year/branch export remains distinct. |
| Interaction | Legacy controls: Bulan=November; year=2026; Cabang=JAKARTA; Ekspor Excel. Observed: Parameter-only view. No dedicated modern interaction. Browser behavior UNVERIFIED. |
| Data | Legacy recap grain and totals unverified; grouping ordinary manifest rows is not proof of equivalence. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No dedicated manifest recap target or source query; not the manifest inventory list. Legacy month/year/branch export remains distinct. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | No target export; legacy Ekspor Excel structure UNVERIFIED. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R04, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R05 — Laporan-laporan > Laporan Cabang > Pengantaran

Legacy `<legacy-origin>/index.php/city-courier`; modern `/branch-reports/delivery?view=sheets and ?view=items`. **Implementation DONE; parity PARTIAL_PARITY; disposition KEEP.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Tanggal; DRS No.; Cabang; Kurir; Tot. AWB; Tot. Progress; Tot. Sukses; Tot. Gagal; Tot. Koli; Tot. Berat; Tot. Volume; Tot. Biaya (Rp.); Status; Aksi Modern: Modern sheets columns date UTC/DRS/manifest/owning branch/manifest courier/visible transactions; items view DRS/date UTC/AWB/receiver/stored outcome/deliveredAt/receivedBy/notes. No legacy progress/success/failure/weight/cost/status summary buckets. |
| Interaction | Legacy controls: Select Searching; Search; Refresh; local Search; size 10/25/50/100; Previous/Next. Observed: Showing 0 to 0 of 0 entries; sortable headers. Modern bounded GET period/branch/search and paging; fixed date/ID ordering, no general column sorting. B verifies only the expressly recorded read-only/empty-state interactions; deeper behavior UNVERIFIED. |
| Data | Sheet or DeliverySheetItem grain explicitly selected; deliveryDate UTC/max31, owning-manifest branch AND eligible Transaction scope; sheet must have visible items. Read existing stored sheets; no OPS-03 generation claim. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Sheet or DeliverySheetItem grain explicitly selected; deliveryDate UTC/max31, owning-manifest branch AND eligible Transaction scope; sheet must have visible items. Read existing stored sheets; no OPS-03 generation claim. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | No delivery export. I has no export shown in inspected city-courier view. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | B: Visible Pengantaran link reached initial form; bounded query returned 0 sheets. Per transaksi link retained period, changed heading/search to AWB and returned 0 items. Stored-item/table/grain reconciliation remains unverified. Initial evidence: I LP-R05, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: adopted R1/R2/A subset; keep existing functionality and separately source omitted fields/filters before parity expansion (D-15/D-19/D-22).

### LP-R06 — Laporan-laporan > Laporan Cabang > Gross Profit / Manifest

Legacy `<legacy-origin>/index.php/gross-profit-manifest`; modern `/branch-reports/gross-profit; separate /finance/accounting/reports`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Manifest No.; Tanggal; Tujuan; Tot. AWB; Tot. Koli; Tot. Kg; Tot. Volume; Tot. Biaya (Rp.); kendaraan; Driver; Aksi Modern: Old GP preview reproduces manifest quantity/cost headings without live source (Aksi not functional). FIN GP per transaction is a separate adopted implementation; see grain matrix below. |
| Interaction | Legacy controls: November; 2026; Status initially Select Status ...; expanded Destination/Transit/Vendor; Show; Refresh; result Search; size 10/25/50/100; Previous/Next. Observed: Destination Show query empty; no profit amount/formula established. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | Preview has synthetic rows only. Legacy Destination/Transit/Vendor selectors do not establish revenue/cost recognition. FIN accounting-date transaction grain differs from manifest grain. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Preview has synthetic rows only. Legacy Destination/Transit/Vendor selectors do not establish revenue/cost recognition. FIN accounting-date transaction grain differs from manifest grain. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Old preview tool disabled; FIN report export absent; legacy GP export not exposed in inspected view. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R06, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R07 — Laporan-laporan > Laporan Cabang > Rekap Transaksi Harian

Legacy `<legacy-origin>/index.php/rekap-omzet-harian`; modern `—`. **Implementation MISSING; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Not exposed in parameter-only initial view; output unverified. Modern: No dedicated daily transaction Cetak target. LP-R13 turnover preview cannot replace this date/branch print identity without output evidence. Target search found no rekap-omzet-harian reference. |
| Interaction | Legacy controls: Tanggal=2026-11-16; Cabang=JAKARTA; Cetak. Observed: Parameter-only print view; print skipped. No dedicated modern interaction. Browser behavior UNVERIFIED. |
| Data | Legacy date/branch print result grain/formula unknown; no target report source. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No dedicated daily transaction Cetak target. LP-R13 turnover preview cannot replace this date/branch print identity without output evidence. Target search found no rekap-omzet-harian reference. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Legacy Cetak output UNVERIFIED; no modern print counterpart. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R07, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R08 — Laporan-laporan > Laporan Cabang > Rekap Gross Profit

Legacy `<legacy-origin>/index.php/rekap-gross-profit`; modern `/branch-reports/rekap-gross-profit; separate /finance/accounting/reports`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: No. Polisi; No. Manifests; Tujuan; Driver; Tgl. Manifests; Dibuat Oleh Modern: Preview has No. Polisi/No. Manifests/Tujuan/Driver/Tgl. Manifests/Dibuat Oleh but filters Cabang/Origin differ from live Branch Origin (All Destination)/Nopol. FIN monthly GP is not the same manifest/plate recap. |
| Interaction | Legacy controls: Periode Date Start/End=2026-11-16; Branch Origin displays -- All Destination --; Nopol=-- All Nopol --; Show; Export Excel; Refresh; result Search; size 10/25/50/100; Previous/Next. Observed: Current-day Show empty. Origin/destination label mismatch preserved. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | Synthetic manifest-shaped rows; FIN groups journal accounting month for transaction movements. Legacy six columns expose no verified profit formula. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Synthetic manifest-shaped rows; FIN groups journal accounting month for transaction movements. Legacy six columns expose no verified profit formula. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Preview export disabled; legacy Export Excel structure UNVERIFIED; FIN export absent. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R08, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R09 — Laporan-laporan > Laporan Cabang > Manifest Vendor

Legacy `<legacy-origin>/index.php/manifest-vendor`; modern `/branch-reports/manifest-vendor`. **Implementation MISSING; parity APPROVED_DEVIATION; disposition INTENTIONALLY_DEFERRED.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Not exposed in parameter-only initial view; output unverified. Modern: Guarded vendor-readiness page, not a vendor report. No vendor/user selectors or source-backed list. Direct route explains unavailability; contract calls for unlinked inventory leaf. |
| Interaction | Legacy controls: November; 2026; Penjual=Pilih Penjual...; Pengguna=Pilih Pengguna...; Daftar Manifes. Observed: No result columns or explicit query button exposed. No working vendor query. Browser behavior UNVERIFIED. |
| Data | No Manifest/Vehicle vendor association/capture source; do not join by names, courier or geography. A marks RPT-05 NOT NEEDED. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Guarded vendor-readiness page, not a vendor report. No vendor/user selectors or source-backed list. Direct route explains unavailability; contract calls for unlinked inventory leaf. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | No target export; no export established by I for legacy initial view. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R09, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: A explicitly omits vendor attribution (RPT-05); no implicit reinstatement. Comprehensive parity requires owner scope revision and reviewed capture source.

### LP-R10 — Laporan-laporan > Laporan Cabang > Awb Tertunda

Legacy `<legacy-origin>/index.php/awb-pending`; modern `/branch-reports/awb (pending view)`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: AWB Koli No.; AWB No.; DO No.; Tanggal; Tujuan; Moda; Koli; Berat; Volume; Total Biaya Modern: Shared AWB preview has pending ten headings matching observed structure; matching labels are not pending-membership logic. |
| Interaction | Legacy controls: Semua Tujuan; Cari; Ekspor Excel; Refresh; local Search. Observed: Processing at initial capture; settled membership unverified. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | Synthetic piece/AWB rows; real piece membership, pending definition and date/source joins absent. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Synthetic piece/AWB rows; real piece membership, pending definition and date/source joins absent. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview Excel; legacy file contents UNVERIFIED. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R10, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R11 — Laporan-laporan > Laporan Cabang > Awb Termanifest

Legacy `<legacy-origin>/index.php/awb-termanifest`; modern `/branch-reports/awb (manifested view)`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: AWB No.; DO No.; Manifes No.; Tanggal; Tujuan; Moda; Koli; Berat; Volume; Total Biaya Modern: Second AWB preview view has ten manifested headings; no real manifestation query. Preview month/user/destination controls do not prove backend filters. |
| Interaction | Legacy controls: November; 2026; Semua Pengguna; Semua Tujuan; Cari; Ekspor Excel; Refresh; local Search. Observed: Processing at initial capture; settled membership unverified. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | Synthetic rows; membership/history and assignment-date inclusion unimplemented. Separate from LP-R10 even in same route. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Synthetic rows; membership/history and assignment-date inclusion unimplemented. Separate from LP-R10 even in same route. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview Excel; legacy file contents UNVERIFIED. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R11, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R12 — Laporan-laporan > Laporan Cabang > Rekap Customer Bulanan

Legacy `<legacy-origin>/index.php/rekap-customer-bl`; modern `/branch-reports/customer-monthly-summary`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Not exposed in parameter-only initial view; output unverified. Modern: Preview NO./Nama Pelanggan/Total AWB/Kg/Volume/Total Transaksi and month/year/branch; legacy parameter-only output not established, so these are not verified legacy columns. |
| Interaction | Legacy controls: November; 2026; Cabang=JAKARTA; Ekspor Excel. Observed: Parameter-only view. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | Synthetic monthly customer aggregates; customer attribution/amount/date definition not adopted for a real query. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Synthetic monthly customer aggregates; customer attribution/amount/date definition not adopted for a real query. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview Excel; legacy output workbook unknown. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R12, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R13 — Laporan-laporan > Laporan Cabang > Rekap Omset Harian

Legacy `<legacy-origin>/index.php/rekap-omset-harian`; modern `/branch-reports/daily-turnover-summary`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Not exposed in parameter-only initial view; output unverified. Modern: Preview NO./TANGGAL/TOTAL TUNAI/TOTAL BB/TOTAL BL/TOTAL TRANSFER/TOTAL OMSET/DARAT/LAUT/UDARA; no real turnover calculation. |
| Interaction | Legacy controls: November; 2026; Cabang=JAKARTA; Ekspor Excel. Observed: Parameter-only view. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | No adopted payment/mode classification or amount source. Transaction.biaya not authorized as revenue. Separate from LP-R07. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No adopted payment/mode classification or amount source. Transaction.biaya not authorized as revenue. Separate from LP-R07. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview Excel; legacy exported columns/totals unknown. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R13, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R14 — Laporan-laporan > Laporan Cabang > Detail Transaction Inbound

Legacy `<legacy-origin>/index.php/detail-transaksi-inbound`; modern `/branch-reports/inbound-transaction-details`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: AWB No.; tanggal; Moda; Servis; Asal; Tujuan; Pengirim; Penerima Barang; Koli; Kilo; Deskripsi; Status Pengiriman; Komentar; Diterima Oleh Modern: Preview date/AWB/manifest/sender/receiver/origin/koli/kg/volume/tariff/status differs from actual fourteen legacy headers and month/year plus six selectors/One Sheet controls. Not an RPT-01 inbound implementation. |
| Interaction | Legacy controls: November; 2026; Asal/Tujuan/Pelanggan/Pembayaran/Moda/Status all defaults; Jenis Lembar=-- One Sheet --; Cari; Ekspor; Refresh. Observed: Processing at initial capture; inbound event/date semantics unverified. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | No real inbound-event/date/join selection; synthetic tariff not revenue source. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No real inbound-event/date/join selection; synthetic tariff not revenue source. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview Excel; real inbound export absent, legacy format unverified. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R14, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

#### Laporan-laporan > Laporan Kurir

### LP-R15 — Laporan-laporan > Laporan Kurir > Harian Kurir

Legacy `<legacy-origin>/index.php/daily-report-courier`; modern `/courier-reports (daily view)`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Nama Kurir; Jumlah Terambil; Jumlah Miss Pickup Modern: Shared courier preview has Harian Kurir, three pickup/miss headings and date range; no real pickup event query. |
| Interaction | Legacy controls: Date Start/End=2026-11-16; Export; Search; Refresh; local Search. Observed: Processing at initial capture; no settled result claim. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | Courier daily pickup/miss event source not implemented; unrelated to delivery-success counts. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Courier daily pickup/miss event source not implemented; unrelated to delivery-success counts. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview export; legacy Export format/inclusion unknown. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R15, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R16 — Laporan-laporan > Laporan Kurir > Laporan Detail Kurir

Legacy `<legacy-origin>/index.php/laporan-detail-kurir`; modern `/courier-reports (detail view)`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: DRS No.; AWB No; Kurir; Tanggal; Asal; Tujuan; Pengirim; Layanan; Status; Penerima; Diterima Oleh; Tgl. Diterima; Acc. in; L.Time; SLA Modern: Shared courier preview contains fifteen detail headings and period/branch/courier/status controls. Matching fields do not implement SLA/L.Time/Acc. in. |
| Interaction | Legacy controls: Periode pair; Branch=Semua Asal; Kurir=-- Semua Kurir --; Status=-- All Status --; Cari; Ekspor; Refresh. Observed: Empty table; Tot. Sukses/Pending/Failed each 0; sortable headers. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | No live courier report join/SLA source or calculation; RPT-02 item outcomes cover only a subset at another grain. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No live courier report join/SLA source or calculation; RPT-02 item outcomes cover only a subset at another grain. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview export; legacy format/inclusion unknown. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R16, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

#### Laporan-laporan > Laporan Keuangan

### LP-R17 — Laporan-laporan > Laporan Keuangan > Laporan AR

Legacy `<legacy-origin>/index.php/sales-aging`; modern `/financial-reports (AR); separate /finance/invoices`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Tanggal Invoice; No. KWT/INV; Pelanggan; Ketentuan; Status; [blank]; Penerima Modern: AR preview primary aging columns/amount/buckets and supplemental seller/invoice/date/status/cost tables differ from live seven headers with blank column and Belum Lunas/Lunas. FIN invoices/receipts are real but not AR-aging implementation. |
| Interaction | Legacy controls: Cari textbox; November; 2026; Pelanggan=Semua; Ekspor Excel; Menunjukan; Refresh; Belum Lunas/Lunas tabs. Observed: Menunjukan executed; both tabs empty, same seven headers. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | No live aging query or adopted legacy aging basis/bucket boundaries/receipt-date source. FIN balance is separate policy, not aging proof. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No live aging query or adopted legacy aging basis/bucket boundaries/receipt-date source. FIN balance is separate policy, not aging proof. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview Excel; legacy workbook/aging totals unknown. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R17, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R18 — Laporan-laporan > Laporan Keuangan > Laporan AP

Legacy `<legacy-origin>/index.php/ap-report`; modern `/financial-reports (AP)`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Penjual; No. Faktur; Tanggal; Status; Tot. Biaya Modern: AP preview primary company/invoice/date/ATAS/deadline/amount/aging/notes plus supplemental five headings; live result has Penjual/No. Faktur/Tanggal/Status/Tot. Biaya in two tabs. |
| Interaction | Legacy controls: Cari textbox; November; 2026; Penjual=Semua; Ekspor Excel; Menunjukan; Belum Lunas/Lunas tabs. Observed: Menunjukan executed; both tabs empty, same five headers. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | Synthetic data. FIN supplier accrual/cost does not implement vendor invoice aging or settlement; F2 excludes supplier settlement. Full AP-aging rules independently missing. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | Synthetic data. FIN supplier accrual/cost does not implement vendor invoice aging or settlement; F2 excludes supplier settlement. Full AP-aging rules independently missing. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview Excel; legacy export columns/buckets unverified. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R18, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: F2 excludes supplier settlement, but does not prove AP-aging parity. Preserve approved omission and separately define aging/output requirements before any scope change (D-11/D-14/D-15/D-21).

#### Laporan-laporan > Reports Customer

### LP-R19 — Laporan-laporan > Reports Customer > Pengiriman

Legacy `<legacy-origin>/index.php/pengiriman`; modern `/customer-reports (shipment view)`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: AWB No .; Date; DO No. / Reff; Moda; Service; Origin; Destination; Shipper; Consignee; Koli; Kilo; Description; Shipment Status; Received by; Received Date Modern: Customer preview adds No., Customer, instruction, Leadtime and differs in DO/reference/description/quantity presentation from live fifteen headings; period/customer/destination UI only. |
| Interaction | Legacy controls: Periode pair; Customer=Semua Customer; Destination=ALL DESTINATION; Search; Export; Refresh; local Search. Observed: Empty table, sortable headers. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | No source-backed customer report join/status/date inclusion, leadtime or customer authorization. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No source-backed customer report join/status/date inclusion, leadtime or customer authorization. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview export; legacy format/rows unknown. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R19, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R20 — Laporan-laporan > Reports Customer > POD Kembali

Legacy `<legacy-origin>/index.php/pod-return`; modern `/customer-reports (POD view)`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: AWB; AWB Date; Destination; Consignee; Reff No; Received By; Received Date; Status AWB; Remarks Modern: POD preview adds No. to nine observed legacy headers; filters broadly match period/origin/destination/customer but have no operational service. |
| Interaction | Legacy controls: Periode pair; Semua Asal/Tujuan/Customer; Search; Export; Refresh; local Search. Observed: Empty indicator with Processing also present; settled result unverified. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | No POD-return event source. receivedBy/delivery completion cannot substitute return of POD. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No POD-return event source. receivedBy/delivery completion cannot substitute return of POD. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview export; legacy file/inclusion unknown. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R20, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

### LP-R21 — Laporan-laporan > Reports Customer > Semua Status

Legacy `<legacy-origin>/index.php/all-status`; modern `/customer-reports (status view)`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: AWB; Date; Moda; Service; Origin; Destination; Shipper; Consignee; Koli; Kilo; Description; Shipment Status; Received by; No Manifest Modern: Fourteen primary labels broadly align; total POD/kg/koli remain synthetic/unavailable; filters are presentation. |
| Interaction | Legacy controls: Periode pair; Asal/Tujuan/Customer/Pembayaran/Status all defaults; Search; Export; Refresh; size 10/25/50/100; local Search; Previous/Next. Observed: Empty table; Total POD/AWB, Total Kilo/Kg, Total Koli/Pieces labels, not reconciled totals. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | No backend all-status customer/billing/mode/manifest join; RPT-01 stored status does not establish this scope. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No backend all-status customer/billing/mode/manifest join; RPT-01 stored status does not establish this scope. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview export; legacy format/totals unknown. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R21, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.

#### Laporan-laporan > Report Customer

### LP-R22 — Laporan-laporan > Report Customer

Legacy `<legacy-origin>/index.php/report-customer`; modern `/customer-reports (standalone customer view)`. **Implementation PREVIEW_ONLY; parity NOT_MIGRATED; disposition INVESTIGATE.**

| Dimension | Assessment |
|---|---|
| Navigation | I records this distinct menu/URL; target mapping above. Shared preview views are not distinct backend reports. Fresh rendered routing/access UNVERIFIED (browser limitation). |
| Presentation | Legacy ordered columns: Not exposed in parameter-only initial view; output unverified. Modern: Fourth customer preview has ten invented/unverified output headings; legacy exposes period/origin/destination/customer/billing Export Excel only. Preserve standalone identity. |
| Interaction | Legacy controls: Periode Date Start/End; Origin=-- All Origin --; Destination=-- All Destination --; Customer=-- All Customer --; Billing Type=-- All Billing Type --; Export Excel. Observed: Parameter-only standalone report. Modern interactions operate synthetic rows only. Browser behavior UNVERIFIED. |
| Data | No real source; output, inclusion, grouping and relation to LP-R19/20/21 unknown. Legacy inclusion/branch reconciliation UNVERIFIED. |
| Business behavior | No real source; output, inclusion, grouping and relation to LP-R19/20/21 unknown. I labels and empty output do not establish hidden calculations/transition rules. |
| Export | Disabled preview export; legacy export-only structure unverified. No new download; exact format/row/totals parity UNVERIFIED. |
| Verification | I LP-R22, L same identity; current route/preview/service source inspected. No fresh modern rendering, dataset reconciliation or permissions execution. |

Cause/correction: missing functional report query/output, not a verified duplicate. Capture bounded sanitized legacy output and source/date/branch/formula contract before implementation (D-15/D-19/D-22; financial rows also D-11–D-14/D-21). No page-specific omission approval inferred merely from RPT v1 DONE.



### Dashboard — legacy Dashboard versus `/dashboard`

**Implementation DONE (RPT-02 target); parity PARTIAL_PARITY; disposition KEEP**, wider widgets INVESTIGATE. Evidence I Dashboard, R2, M `/dashboard/page.tsx`, operational service/view.

| Dimension | Assessment |
|---|---|
| Navigation | Legacy dashboard quick actions lead to booking, AWB entry, manifests, delivery, status, invoices/paid, tracking, detail/recap and AR. Modern links to transaction/manifest/delivery reports only with corresponding report permission. Legacy invoice/finance/activity/POD shortcuts not migrated to dashboard; finance remains reachable under Akunting. Fresh rendered discoverability UNVERIFIED. |
| Presentation | Legacy Quick Action, AI Executive Insight/Summary/Recommendations, notifications, KPI Summary, analytics, sales chart, top customers, shipment statuses, recent activity, POD and announcements. Modern four raw count cards: Transactions, Manifests, sheets, eligible items; initial period prompt, no synthetic charts/financial trends. This is deliberate R2 subset, not matching widget parity. |
| Interaction | Legacy initial month/day range/all-branch and refresh sections, configurable favorites; modern validated date pair/branch GET query, max31 inclusive UTC days. No month selector/favorites/AI/section refresh counterpart. Browser outputs UNVERIFIED. |
| Data | Modern independent Transaction.transactionDate; Manifest.manifestDate; sheet/items sheet.deliveryDate, fresh branch scope and consistent snapshot. Transaction endpoint scope differs from owning manifest branch plus eligible-item intersection; counts intentionally need not agree. Legacy metric sources/inclusion UNVERIFIED, not inferred from labels/links. |
| Business behavior | Modern counts are raw records, not successful/pending shipments, sales, invoice aging, receivables, growth or AI advice. R2 explicitly avoids unsupported formulas. FIN report values do not automatically feed dashboard. Monetary and success/POD formulas remain D-15/D-19 and D-11–D-14/D-21 gaps. |
| Export | No dashboard export exposed in I or modern target; universal absence UNVERIFIED. |
| Verification | B: Initial operational disclosure and filters rendered; bounded query produced four 0 cards with Transaction/Manifest/sheet-date labels and permission-visible detail links. Legacy finance/AI widgets remain absent from this target; no count reconciliation. Initial evidence: I live dashboard initially loading then content; M current report source; no fresh rendering/filter/same-dataset reconciliation. No EXACT. |

GP comparison, independently assessed (no equivalence claim):

| Basis | LP-R06 | LP-R08 | FIN-02 reports |
|---|---|---|---|
| Source | Legacy manifest list; backend unknown | Legacy manifest/plate list; backend unknown | FinLine + POSTED FinJournal, frozen classification snapshot, source transaction ID |
| Grain | Manifest | Plate/manifest/driver/creator list; recap semantics unknown | Per Transaction movement; recap sums movements by calendar accounting month for selected branch |
| Date | Month/year selector; actual inclusion date unverified | Date pair; actual date basis unverified | Journal.accountingDate inclusive date-only range; max366 days |
| Filters | Month/year, Destination/Transit/Vendor | Period, Branch Origin/All Destination, Nopol | Explicit branch/start/end; no manifest/vendor/plate variant |
| Formula | Not exposed/reconciled; Tot. Biaya is not proof | No profit amount column observed | Net linked revenue credits less net direct expense debits; P&L all classified net revenue minus expenses; completeness gates definitive GP |
| Branch | Legacy scope unknown | Legacy scope unknown | Current allowed branch, explicit check; no guessed manifest ownership |
| Output | Eleven manifest/quantity/cost/vehicle/action columns | Six plate/manifest/date/driver/creator columns | Transaction key/revenue/cost/profit, monthly recap, ledger/bridge/cashflow/source lines |

## 5. FIN page-by-page audit

F1/F2 adoption remains valid. DONE below is source implementation of that target; ROADMAP FIN-01/02 remain PARTIAL for human/migration/staging acceptance. No new approval question. M sources: `src/features/finance/{contracts.ts,accounting-contracts.ts,components/pages.tsx,components/invoice-form.tsx,components/accounting-pages.tsx,components/command-form.tsx,server/service.ts,server/accounting.ts,server/queries.ts}`; `/finance/invoices/*` and `/finance/accounting/*` page entry points.

### FIN-INVOICE-LIST — Invoice (New) `/index.php/sales` → `/finance/invoices`

**Implementation DONE; parity PARTIAL_PARITY; disposition KEEP**; legacy-only fields/actions INVESTIGATE.

| Dimension | Assessment |
|---|---|
| Navigation | Legacy combines create/list; modern splits list/new/detail, linked through Akunting and finance workspace, not the same legacy AR branch. Source links exist; fresh rendering/access UNVERIFIED. |
| Presentation | Legacy Customer/Invoice No/Tgl. Dibuat/Tgl. Diterima/Termin/Tgl. Pengingat/Status/Tgl. Tutup/Tot. AWB/Action. Modern Invoice/Cabang/Tanggal/Status/Tagihan IDR/Sisa IDR. Receipt/reminder/closing dates, customer column, terms and AWB count not list-parity. Modern amount/balance deliberate target. |
| Interaction | Legacy text/search mode/Refresh/Export/sort affordances; modern optional branch ID, pagination and detail link; no equivalent legacy search/sort/export surface. Source source-backed list is not synthetic. Runtime UNVERIFIED. |
| Data | FinInvoice/items/reservations and payment events, own organization scope; legacy source/customer/date/status inclusion unknown, no historical import. IDs/current stored policy are not provider record correspondence. |
| Business behavior | Adopted draft/issue/void/payment rules, immutable snapshots, no arbitrary legacy state labels. Legacy underlying numbering/financial status/approval unverified. |
| Export | Legacy Export exists, format/columns/row inclusion unknown; modern invoice export not implemented. RPT-04 CSV concerns Transaction reports only. |
| Verification | B: Invoice rendered 0 invoice/halaman1, branch filter, Buat invoice and Akuntansi & laporan links. No populated columns/detail or new invoice form inspected. Initial evidence: I empty sales list; F1/F2 and M. No same-record/current browser reconciliation. |

### FIN-INVOICE-NEW — legacy Tambah Invoice → `/finance/invoices/new`

**Implementation DONE; parity PARTIAL_PARITY (F1 target differences are APPROVED_DEVIATION); disposition KEEP.**

| Dimension | Assessment |
|---|---|
| Navigation | Separate modern new page; legacy form on sales page. Canonical link requires invoice:create. Browser UNVERIFIED. |
| Presentation | Legacy Customers/Invoice No auto + Manual/Tgl. Dibuat/Termin/Deskripsi/Submit. Modern branch/customer source lookup, invoice/due dates, repeated Transaction+amount lines and create draft. Legacy manual-number toggle/description/terms-as-days not reproduced as such. |
| Interaction | Modern source lookup and mounted form tabs, line add/remove, pending/error feedback; no new save tested. Legacy form intentionally never submitted. |
| Data | Direct validated Transaction references reserved even in draft, one customer/branch, max100 unique items; manual IDR charges rather than proposed OPS-04 event bus/tariff. No historical bills imported. |
| Business behavior | F1 explicit choice: positive exact max two-decimal amounts, real calendar dates, duplicate/source ownership checks, UUID idempotency, total overflow safeguards. Legacy validation/defaults/formula UNKNOWN. Number created on issue, not claimed equivalent to legacy Submit behavior. |
| Export | No modern invoice document/export workflow established; legacy invoice generation/output not safely tested. |
| Verification | I form structure + F1/F2 + M validation/form/service. Runtime/source-to-legacy business equivalence UNVERIFIED. |

### FIN-INVOICE-DETAIL — `/finance/invoices/[id]`

Legacy populated detail/payment route not established by I; do not guess. **Implementation DONE; parity LEGACY_UNVERIFIED; disposition KEEP** (adopted target).

| Dimension | Assessment |
|---|---|
| Navigation | Current list-to-detail links and independent entry checks. Legacy direct URL/access not established; runtime UNVERIFIED. |
| Presentation | Modern branch/customer/payment status, invoice/due dates, amounts/balance, source lines, draft editing, issue/void, receipts/reversals and source snapshot. Legacy corresponding panels UNKNOWN. |
| Interaction | Controlled command forms, pending lock, destructive styling, explicit failures/uncertain-result message, retry key. New mutating tests not performed on either system. |
| Data | Immutable issued customer/branch/line snapshot; reserved sources; append-only receipt/reversal events and journals, actor-scoped replay. Legacy counterpart unverified. |
| Business behavior | F1/F2 issue Dr AR/Cr revenue; receipt Dr cash/Cr AR (not extra revenue); no overpay; full compensating receipt reversal before paid void; revision/conflict and closed-period rules; no mandatory second approver by adoption. No legacy lifecycle equivalence established. |
| Export | No modern invoice export; legacy business document format/access unverified. |
| Verification | F1/F2 and M source implementation; prior local verification separate from this audit. Current persistence/rendering UNVERIFIED. |

### FIN-DEBT — Pembayaran Hutang `/index.php/debt-payments`

No current supplier-settlement route. **Implementation MISSING; parity APPROVED_DEVIATION; disposition INTENTIONALLY_DEFERRED** under F2. Legacy-only AP aging remains independently NOT_MIGRATED.

| Dimension | Assessment |
|---|---|
| Navigation | I verified Modul/Keuangan/Hutang Dagang/Pembayaran Hutang; no settlement target. Costs canonical route is a different workflow. |
| Presentation | Legacy Kategori/Created Date/Invoice No/Manual/Submit + invoice list category/vendor/invoice/dates/term/status/AWB/action. None implemented as supplier-payment page. |
| Interaction | Legacy empty search/list; form actions skipped. Modern settlement search/list/actions absent. |
| Data | Legacy vendor invoice/payment allocation source UNKNOWN; target FinCost records actual cost/accrued supplier liability, not a paid balance. |
| Business behavior | F2 explicitly excludes supplier settlement. No amount allocation, pay/settle or paid status inferred from cost posting/reversal. D-11/D-14/D-21 expansion needed if reinstated. |
| Export | No export exposed in I debt surface; outside inspected view UNVERIFIED. Modern settlement export absent. |
| Verification | I empty debt form/list + F2 + M. No provider mutation. |

### FIN-AR / FIN-AP — legacy financial reports

LP-R17 and LP-R18 retain seven-dimension assessments in section 4; these are the same pages, not extra report identities. **Implementation PREVIEW_ONLY**, AR and AP report parity NOT_MIGRATED; supplier settlement exclusion separately APPROVED_DEVIATION. Shared `/financial-reports` does not implement aged open/paid customer/vendor invoices. Modern receipts/balance and supplier accrual are distinct source/business behaviors. Legacy blank AR header, date meaning, aging/bucket inclusion and export remain UNVERIFIED. F1/F2 do not approve invented legacy aging. Related Dashboard invoice/paid/outstanding/AR references remain individually recorded in I; operational `/dashboard` does not implement their financial KPI/navigation behavior (section 4).

### FIN-ACCOUNTING-HOME — `/finance/accounting`

**Implementation DONE; parity LEGACY_UNVERIFIED; disposition KEEP.** No legacy accounting landing URL established.

| Dimension | Assessment |
|---|---|
| Navigation | Added Akunting/Ikhtisar akuntansi; current page wraps authenticated content in Suspense. Legacy equivalent/discoverability UNKNOWN. |
| Presentation | Modern finance overview/workspace links; not evidence of provider COA/ledger page. |
| Interaction | LoadingState boundary and authorized links exist in source; rendered warning/loading behavior UNVERIFIED this pass. |
| Data | Current actor/permissions, no inferred legacy source records. |
| Business behavior | Navigation into adopted F2 tools, no source formula inferred from landing page. |
| Export | No landing export; legacy equivalent unknown. |
| Verification | B: Akuntansi rendered six finance links and new-LMS/IDR/mapping/accounting-date coverage explanation; no loading-warning claim beyond observed content. Initial evidence: M page/AccountingHomePage, F2; current browser UNVERIFIED. |

### FIN-ACCOUNTS — `/finance/accounting/accounts`

**Implementation DONE; parity LEGACY_UNVERIFIED; disposition KEEP.** Older `/perkiraan` and `/akunting/kategori-akun` are previews, not evidence provider pages exist.

| Dimension | Assessment |
|---|---|
| Navigation | Akunting/Akun & kategori and workspace links; legacy source destination unknown. |
| Presentation | Source account/category forms, account code/name/classification/normal balance/cash flags, categories and versioned mapping forms; no legacy column/field parity established. |
| Interaction | Bounded catalogue queries max500, manage commands, branch filter/mapping UI; execution UNVERIFIED. |
| Data | FinAccount/FinCategory/FinMapping; global catalogue and branch mapping, not older DRAFT Account/Ledger/AccountingBranch models. |
| Business behavior | F2 used classification/mapping pinned historically; active/soft-delete restrictions and explicit mapping; missing mapping blocks posting. Legacy COA rules unknown. |
| Export | No target catalogue export; legacy unverified. |
| Verification | B: Account table headers ID/Kode/Nama/Klasifikasi/Saldo normal/Status, empty catalogue notice, account/category/cashflow/mapping forms rendered. No values saved. Initial evidence: M AccountsPage/accounts/mappings and F2; no current save/rendering checks. |

### FIN-JOURNALS — `/finance/accounting/journals`

**Implementation DONE; parity LEGACY_UNVERIFIED; disposition KEEP.** No observed legacy posting/ledger equivalent URL.

| Dimension | Assessment |
|---|---|
| Navigation | Added Akunting/Jurnal; separate view/create/post/reverse rights in source. Legacy access unknown. |
| Presentation | Journal lists/lines, manual journal editor, cash expense/internal transfer forms; account/debit/credit/transaction/source information. No provider field match established. |
| Interaction | Branch/paging, add/remove editor lines, commands and reversal feedback; runtime UNVERIFIED. |
| Data | FinJournal/FinLine source-linked records, current branch scope, 30-row journal list; audit/event history distinct from legacy unknown. |
| Business behavior | Balanced positive one-sided lines, exact Decimal, posted immutability, full linked reversal; manual accounts cannot bypass mapped controls. F2 policy, not provider inference. |
| Export | No target journal export; legacy unverified. |
| Verification | B: Empty journal list, branch filter, cash expense/transfer forms rendered; manual disclosure showed two debit/credit rows, disabled remove buttons, add/save controls. No line changes or posting. Initial evidence: M JournalsPage/accounting helpers/queries + F2; no posting performed. |

### FIN-COSTS — `/finance/accounting/costs`

**Implementation DONE; parity LEGACY_UNVERIFIED; disposition KEEP.** This is not Pembayaran Hutang or Manifest Vendor.

| Dimension | Assessment |
|---|---|
| Navigation | Added Biaya aktual workspace route; no corresponding legacy actual-cost destination established. |
| Presentation | Actual cost form/list, source transaction/supplier-document reference/date/reason, completeness confirmation and reversals. Legacy counterpart unknown. |
| Interaction | Branch/list filtering, create/finalize/reverse command UI; current operation UNVERIFIED. |
| Data | FinCost and FinCostState tied to nondeleted Transaction origin branch; no guessed vendor relationship or copied Transaction.biaya. |
| Business behavior | Dr direct expense/Cr accrued supplier liability; explicit zero-cost completeness; own justified reversal; invoice void does not erase supplier liability. No supplier settlement. F2 target. |
| Export | No cost export; provider counterpart unknown. |
| Verification | B: Actual-cost/completeness forms, explicit unknown-not-zero and invoice-void/liability warning, empty declarations/events rendered. No command submitted. Initial evidence: M CostsPage, accountingWrite, queries + F2. Legacy payment equivalence expressly rejected. |

### FIN-PERIODS — `/finance/accounting/periods`

**Implementation DONE; parity LEGACY_UNVERIFIED; disposition KEEP.** No legacy period-close interface observed.

| Dimension | Assessment |
|---|---|
| Navigation | Akunting/Periode; separate close authority. Legacy destination/access unknown. |
| Presentation | Branch/year/month close controls and closed-period history. No legacy fields established. |
| Interaction | Bounded query/list, close command; no closes tested. |
| Data | FinClosedPeriod per branch/month, immutable history. |
| Business behavior | Closed-period posting/backdate refusal, no reopen v1; pending drafts/incomplete issued-source costs block close; corrections in open period. Explicit F2 adoption, not parity proof. |
| Export | No period export; legacy unverified. |
| Verification | B: Empty period history, branch/month/evidence and close control rendered with no-reopen/open-period-correction text. No close attempted. Initial evidence: M PeriodsPage/openPeriod/accountingWrite + F2; actual close/runtime UNVERIFIED. |

### FIN-REPORTS — `/finance/accounting/reports`

**Implementation DONE; parity LEGACY_UNVERIFIED (manifest GP remains NOT_MIGRATED as LP-R06/08); disposition KEEP.** Shared report implementation serves several adopted modern outputs, not verified consolidation of LP-R06/08/17/18.

| Dimension | Assessment |
|---|---|
| Navigation | Akunting/P&L, GP & arus kas. Older report/accounting preview URLs remain. Legacy accounting destination not established. |
| Presentation | P&L/bridge, per-Transaction GP, monthly recap, cashflow, ledger movements, source-journal drilldown. Revenue/cost/profit headers differ from manifest quantity/vehicle list. Ledger account/debit/credit; source date/journal/source/reference/transaction/account/debit/credit. |
| Interaction | Required branch/start/end max366 days; initial prompt/invalid/empty/incomplete states; source disclosure. No vendor/plate/customer/status/aging variants, no source-level sort/paging parity with legacy. Runtime UNVERIFIED. |
| Data | POSTED journal lines for selected allowed branch and inclusive accounting dates; max10000 lines/refuse overflow; snapshot classification. Ledger sums account debits/credits; GP keyed transaction; recap accounting month. Historical opening balances/import excluded. |
| Business behavior | Revenue credits minus debits; expenses debits minus credits; net profit revenue minus expense. Linked direct revenue minus direct cost is GP; bridge covers other revenue/expenses. Costs can be unbilled, reversals affect their own period. Incomplete cost state suppresses final GP; P&L warns preliminary. Cashflow from cash lines with category; internal transfers excluded under F2. No independent legacy formula equivalence. |
| Export | No implemented financial report export; legacy GP/AR/AP file contents unverified. RPT-04 permissioned transaction CSV cannot substitute. |
| Verification | B: Required branch/start/end filter and max366/new-LMS guidance rendered. Read-only bounded query outcome could not be verified after browser timeouts; report output/formula/completeness states remain source-only. Initial evidence: M report() loop/where and FinancialReportsPage, F2. No fresh output calculation reconciliation or runtime. Prior F2 synthetic reconciliation remains adoption evidence only. |



## 6. Verified equivalent and potentially redundant pages

No EXACT or VERIFIED_EQUIVALENT page demonstrated. All identities remain in the audit; shared URL or label overlap is not removal authority.

| Pages | Assessment | Evidence and consequence |
|---|---|---|
| LP-R02 Rekap Transaksi vs LP-R07 daily transaction recap vs LP-R13 daily turnover | POSSIBLE_DUPLICATE only | Three actual URLs; monthly/multiple-sheet export, daily print and monthly turnover export differ. No matched output/grain/formula. Keep all three and obtain outputs before consolidation. |
| LP-R03 manifest inventory vs LP-R04 manifest recap | POSSIBLE_DUPLICATE only | Date/branch list versus month/branch export; no matching aggregates or membership established. |
| LP-R06 manifest GP vs LP-R08 GP recap vs FIN transaction/month GP | Not demonstrated equivalents | Independent source/grain/date/filter/formula/scope/output matrix in section 4 shows unresolved or concrete differences. No redirect as parity fix. |
| LP-R10/11 shared AWB route | Shared presentation, not verified redundancy | Pending piece list and manifested AWB/manifest list differ in first columns/membership. Keep separate identities. |
| LP-R15/16 shared courier route | Shared presentation, not redundancy | Pickup/miss counts versus delivery/SLA detail require different event sources. |
| LP-R17/18 shared finance preview | Shared presentation, not equivalence | Customer AR and supplier AP are separate liabilities/receivables and output structures. |
| LP-R19/20/21/22 shared customer route | POSSIBLE_DUPLICATE for overlapping shipment/status views only | Shipment, POD-return, all-status and standalone customer export each retained. POD-return cannot be deduced from receipt. No grouping proves backend consolidation. |
| Old /akunting/ledger, /rugi-laba, /kategori-* versus /finance/accounting/* | Canonical modern implementation exists, preview remains | FIN target relocation is proven by source navigation and page components; provider equivalence unverified. No old preview is counted as a second functional ledger. |

## 7. Approved deviations and deferred functionality

| Decision | Exact adopted difference | Parity consequence / comprehensive-target conflict |
|---|---|---|
| S, owner own-ticket option A, 2026-11-15 | Creator/current-branch subset, explicit administrator scope, internal ID/server UTC, bounded create/list/detail | No legacy role/number/lifecycle equivalence. Keep accepted v1; any visibility expansion needs D-16 owner/security rules. |
| A, “A — Setujui paket scope minimum” | SUP-02 workflow/approval/history and SUP-03 attachments NOT NEEDED | Proven intentional omission, not implementation defect. New comprehensive parity objective conflicts; record a scope revision before implementing, D-16/D-25/D-22 as applicable. Do not silently reinstate. |
| R1, “A — Sembilan kolom bersumber nyata”; A extension | Nine sourced columns, explicit UTC/max31 days, separate branch filters/sorts; five fields CLOSED WITH NOTES | Partial legacy fields/filters are accepted target reduction. Full fourteen-field migration needs grain/source capture and adoption, D-15/D-19/D-22. |
| A / RPT-04 | Permissioned bounded UTF8 CSV, max5000, nine fields | Approved modern export format; legacy Excel structure remains unknown. No claim all 22 reports gain export. |
| R2 delegated source-backed target | Operational inventory/sheet/items/raw dashboard counts; no invented financial/status aggregates | Valid implemented subset; comprehensive dashboard/report parity remains wider. No approval of arbitrary missing preview reports inferred. |
| A / RPT-05 | Vendor attribution/report NOT NEEDED | Readiness page not functionality; future comprehensive requirement needs explicit reviewed source/capture and scope change, D-15/D-11/D-22. |
| F1/F2 “Adopt A+B as written”, 2026-11-15 | Manual source-backed IDR billing/accrual, zero historical opening, immutable postings/reversals, explicit actual costs/completeness, no second approver, closed-period target | Valid accounting modernization, not observed provider policy. D-12/13/14 adopted for this target; broader D-11/21 retained. No re-adoption requested. |
| F2 exclusions | No supplier settlement or historical import/opening balances | Debt payment parity/history migration absent intentionally. New requirement conflicts with accepted scope and needs finance owner revision/reconciliation. AP-aging absence is separately a missing report; settlement exclusion is not approval to omit every AP view. |

ROADMAP DONE means accepted bounded scope; FIN PARTIAL release gates remain. This audit neither erases completed tickets nor certifies whole-migration parity. Recorded wider gaps are actionable without retroactively changing the owner's earlier decisions.

## 8. Confirmed implementation gaps

Severity below measures impact on the **comprehensive migration objective**, not a demonstrated production exploit or a regression in accepted v1. No confirmed accepted-target logic defect was established by this limited audit; browser failure is not a product defect.

| Gap | Ticket/pages | Severity | Proven cause | Smallest valid correction |
|---|---|---|---|---|
| G01 no dedicated recaps | RPT, LP-R02/R04/R07 | High | No matching current report route/service/alias found; different preview labels do not supply query/print/export | Preserve three identities, acquire actual bounded outputs, define sources and build each required query/output. |
| G02 synthetic reports not migrated | RPT, 15 preview identities | High | PreviewScreenPage expressly loads/saves no operational records; export disabled | Replace one report at a time after inclusion/date/grain/branch/formula approval; retain stable identity and honest preview state meanwhile. |
| G03 partial real report output | RPT-01/03, LP-R01; RPT-02 LP-R03/05 | High for full parity; accepted subset valid | Five unsourced transaction fields and unsupported customer/billing/mode filters; manifest/DRS legacy aggregates omitted | Source missing relationships at correct grain; retain existing security/snapshot behavior. Do not copy DRS item notes into ambiguous Transaction rows. |
| G04 export coverage mismatch | RPT-04 and FIN/RPT export leaves | High | Only transaction CSV functional; other report exports/previews not wired; legacy workbook content unknown | Record legacy structures first, then add scoped bounded exports per accepted report definition. CSV target remains valid until revised. |
| G05 dashboard reduced | RPT-02, Dashboard | Medium/High | R2 explicitly implements four raw counts; no legacy finance/AI/operational status widgets/shortcuts | Separate low-risk links from metric definitions; source/reconcile widgets individually. No invented AI insight or revenue. |
| G06 debt/attachments/helpdesk/vendor absent | FIN-01/02, SUP-02/03, RPT-05 | High for full parity; approved omission | A/F2 explicitly NOT NEEDED/excluded; vendor source absent | Require explicit scope revision; obtain lifecycle/storage/capture/settlement rules before implementation. |
| G07 preview/canonical navigation ambiguity | RPT/FIN | Medium | Exported navigation special-cases Akunting to real finance; Laporan Keuangan and GP still point to previews; provider inventory metadata unlinked | Add truthful implemented-versus-preview descriptions/canonical finance links while retaining legacy identities. Do not redirect manifest GP as equivalent. |
| G08 invoice legacy controls/output differ | FIN-01 sales/AR/dashboard | Medium/High | Adopted list/new/detail redesign; fewer legacy list columns, no legacy search/sort/export/reminder/closing/term presentation | Keep target issue/receipt rules; separately scope source-backed list columns/search/export after finance-owner definition. |

The inventory's LP-R01 mapping did not spell out the already-implemented RPT-03 separate filters/sorting or RPT-04 CSV. Current source and A supersede that omission for implementation status. Inventory was not overwritten; its “export behavior unverified” remains true for observed legacy export contents and this audit's runtime.

## 9. Unverified behavior

| Missing evidence | Exact limitation | Smallest resolving evidence |
|---|---|---|
| Remaining modern runtime/interactions | B inspected 14 modern surfaces; populated data, invoice new/detail, preview routes, denied roles/export and financial query output remain unverified | Use known authorized populated fixtures/read-only views; complete specific remaining checks when browser reads work. No application-suite rerun needed. |
| Legacy export/print structures, especially parameter-only recaps | I has affordances only; no safe connected page access this pass | Confirm bounded non-mutating action, temporary workbook/print structural inspection, sanitize and discard private rows. |
| Legacy sources/formulas/grains | Labels/empty outputs do not establish SQL joins, revenue/cost recognition, SLA, pending membership, POD return, customer attribution | Existing source/rule evidence plus synthetic input-to-output examples and one known permissible populated report case. No random period scanning. |
| Legacy branch/nonadmin visibility | Only user-supplied Administrator context and one session observed | Named permitted role/branch cases or owner rules; never broaden modern authorization from Administrator visibility. |
| Historical coverage/date boundary | Moving calendar year window; pre-existing historical query not coverage proof | Explicit minimum/coverage metadata or known bounded case; date selector range is not earliest stored record. |
| Legacy invoice/payment/detail/history | sales/debt lists empty in I, lifecycle mutations prohibited | Existing readonly populated detail/history or sanitized documented workflow examples; no production mutation testing. |
| Legacy accounting/COA/period/P&L/cashflow provenance | No established legacy URL in inspected navigation | Authorized visible entry point plus readonly page/rule evidence; no guessed endpoint/API. |
| Current release readiness | Not this task; no new test/staging/business persistence checks | Existing release gates remain with their owners; source audit does not substitute for review/UAT. |

These unknowns are not silently treated as approved omissions, broken pages or global absence. All seven dimensions are recorded for each SUP surface, each LP identity, Dashboard and modern FIN page, with explicit cross-reference for shared AR/AP observations.

## 10. Recommended migration backlog

Priorities are proposed migration work, not automatic scope adoption or a re-opening of already answered approvals. Domain approvers: finance owner for money/settlement/postings; report/domain owner with Dev2 source owner for shipment events/grain; ticket owner and Dev1 authorization owner for visibility/lifecycle; attachment privacy/storage owner for D-25. Wider D-ID statuses remain as recorded.

| Priority / task | Legacy reference / modern route | Ticket / dependency | Acceptance criteria |
|---|---|---|---|
| P0 EVIDENCE — finish runtime comparison | All audited routes; especially real SUP/RPT/FIN | Audit evidence; one working authorized browser | Each route renders in allowed/denied state; one valid bounded GET query and feedback/navigation recorded; pending/unknown dimensions updated without mutating legacy. |
| P1 NAV — clarify canonical finance and preview labels | sales, AR/AP, LP-R06/08; /finance/* and old previews | FIN/RPT; existing route permissions | Implemented finance discoverable; preview badges truthful; every legacy identity retained; no GP-equivalence claim; server permission behavior unchanged. |
| P1 RECAP — implement three distinct missing outputs | LP-R02 /recaps-transactions, LP-R04 /branch-manifest-recaps, LP-R07 /rekap-omzet-harian; modern routes TBD | RPT follow-up; D-15/D-19/D-22 output/source contract | Bounded sanitized export/print structure for each; source/grain/date/branch/filter/totals defined and reconciled; each identity has real route/authorized query/output. Consolidation only after verified equivalence. |
| P1 DETAIL — complete transaction parity if required | LP-R01; /branch-reports/transaction-details | RPT-01/03/04; source fields/filter definitions | All required fourteen fields and customer/billing/mode filters have explicit source/grain; missing values honest; every sort/filter/export reconciles same scoped set; preserve max bounds/security or adopt reviewed replacements. |
| P1 OPS — extend manifest/delivery outputs | LP-R03/05; /manifest-outbound, /delivery | RPT-02 + Dev2 source/OPS-03 dependency only where generation needed | Define driver/courier, quantities, costs, states and event dates separately; no guessed buckets; scoped synthetic reconciliation for sheet/item distinction. |
| P1 FIN-PARITY — invoice lists, AR/AP definitions | sales, LP-R17/18; /finance/invoices, /financial-reports | FIN-01/02 + D-11/14/15/19/21 | Explicit customer/vendor invoice inclusion/date/aging/terms/search/export spec; reproduce readonly outputs; receipts and supplier accrual never substituted for aging/settlement. |
| P1 SCOPE — resolve comprehensive goal versus NOT NEEDED | Ticket approval/attachments, LP-R09 vendor, debt-payments | SUP-02/03, RPT-05, FIN; A/F2 revision required | Owner records keep-omitted versus reinstate for each capability; reinstated items have state/storage/capture/payment/access rules and independent acceptance criteria. Until then omissions remain approved. |
| P2 GP — resolve manifest versus accounting grain | LP-R06/08 vs /finance/accounting/reports | FIN-02/RPT; D-13/14/15/19/21 | Source/aggregation/filter/date/recognition and cost completeness compared on known synthetic examples; implement separate manifest report or approve explicit alternative without erasing identities. |
| P2 AWB — pending and manifested reports | LP-R10/11; /branch-reports/awb | RPT + Dev2 active/released membership/piece source | Two independent query definitions and output columns; historical/current membership clear; counts/filter/sort/export reconciled and scoped. |
| P2 CUSTOMER — replace customer previews | LP-R12/19/20/21/22; monthly/customer routes | RPT + customer attribution/POD event source; D-15/19/22 | Each identity independently defined; date/branch/customer/status/POD source proven; no delivery=POD inference; export structure and totals reconciled. |
| P2 COURIER — replace courier previews | LP-R15/16; /courier-reports | RPT + pickup/miss/SLA event definitions | Pickup summary and delivery detail separately sourced; SLA/Acc. in/L.Time formulas approved; scoped rows/aggregates/export match synthetic examples. |
| P2 TURNOVER — actual daily turnover | LP-R13; /branch-reports/daily-turnover-summary | RPT/FIN + payment/mode definitions, D-11–15/19/21 | Explicit cash/BB/BL/transfer/mode classification; approved monetary source/recognition and date; totals reconcile without using biaya as revenue. |
| P2 DASH — restore independently specified widgets/actions | Dashboard; /dashboard | RPT-02 + finance/operations definitions | Retain existing four counts; define each financial/status/AI/activity/POD widget's source/unit/date/scope; add permitted links; same-input expected outputs and unavailable states documented. |
| P2 HISTORY — deliberate finance migration coverage | Legacy invoices/balances; /finance/* | FIN owner; F2 excludes history, approval required | Coverage start displayed; if required, independently approved balanced opening/historical-import plan with reconciliation/audit, no silent backlog conversion into live financial data. |

No implementation started. Next work is NAV plus bounded output/source evidence; domain-dependent changes wait only on their specific unresolved rule/scope decision. This report does not request blanket re-approval of F1/F2 or bounded SUP/RPT.

Validation: UTF-8/readability and structural assertions PASS: ten numbered sections, four SUP surfaces, exactly 22 distinct ordered LP identities plus Dashboard, seven dimensions in 37 assessed page sections, balanced fences, resolvable local evidence links, no pending assessments and no known private-record-ID/credential or encoding-corruption patterns. Manual review preserves unknowns and explicit approval references. Scoped `git diff --check` reports no whitespace errors; `git diff --no-index --check -- NUL docs/decisions/DEV3-LEGACY-PARITY-AUDIT.md` covers the untracked file and reports no whitespace errors (exit 1 for the new-file difference, only CRLF-to-LF normalization notice). No application lint, typecheck, unit/integration tests, migration, build or extra checkpoint rewrites. Audit remains uncommitted; existing inventory unchanged.

Browser-follow-up validation: B notes added to the corresponding 13 page sections (delivery includes both sheet/item surfaces); original stable headings, statuses and inventory retained. Rendering evidence narrows the earlier browser limitation; it does not prove full legacy parity.

## 11. Comprehensive RPT migration continuation — 2026-11-16

Owner now requests functional migration of all 22 identities, including actual export inspection. This establishes comprehensive RPT inclusion as the current objective, including LP-R09; previous accepted ROADMAP statuses and NOT NEEDED decisions remain historical release acceptance. No repeated approval of report inclusion is requested. Missing attribution/capture, lifecycle or money rules are still not invented or automatically approved. SUP/FIN omissions outside this reporting mission remain separate. No legacy mutations are authorized. Baseline b8829d74c6a714cac74af5e672a9b8cf3ac46ef8; only inventory/audit untracked at preflight. Single agent, Ponytail FULL.

### Current slice contract: LP-R03/LP-R05 visible quantities

Extend the already-authorized nonfinancial manifest/DRS reads with koli, kilo and volume subtotals from **exactly the same eligible transaction-item sets as their existing visible counts**. Manifest: nondeleted, unreleased assignments and visible nondeleted Transactions. DRS: nondeleted items and visible nondeleted Transactions, retaining released manifest history. Keep current owning-branch scope, current grants, UTC period, deterministic paging and RepeatableRead. Each dimension is null if any included source quantity is unknown; known empty set is zero. Decimal arithmetic throughout, no biaya/revenue/cost/status-bucket/driver inference. Subtotals are explicitly labelled visible current-source quantities, not certified legacy aggregates. Fetch at most 10,001 quantity-source rows for the displayed page; refuse above 10,000 with actionable narrowing guidance, never truncate a subtotal. No schema, permissions or posting changes. Cross-domain review remains at final combined review under the existing workflow override.

Legacy LP-R03 retains its fourteen observed columns; targeted 2025-04-22/JAKARTA field inspection exposed no populated manifest result or export control. LP-R05 initial observed per-DRS structure is reused. Export is not invented where these inspected surfaces expose none. Implementation/check results follow below when actually completed.

### New legacy export evidence

**E01 / LP-R01:** Connected authenticated Chrome worked; Lab still ECONNREFUSED port9333. The existing broad loaded result supplied a known date, 2025-04-22. A new **single-day** Cari query with all other filters at defaults settled to 1 row; no private values retained. Ekspor is a submit control with explicit report-only `formaction=/modul/detail_transaction/export.php`; executed once with those same bounds. Download `Detail_Transaksi_2026-11-16.xlsx` is genuine ZIP/OOXML. One sheet `2025-04-22-2025-04-22`, A1:BM9, grouped headers rows5–6, one detail row7, total rows8–9, merged report/group/total headings, zero Excel formulas; totals are stored values. Currency format `Rp #,##0`; exported transaction date is text. UI 14 columns versus export 65, so nine-field modern CSV is a substantial explicitly accepted target deviation, not Excel parity. Header groups include Detail Resi, Pengirim, Penerima Barang, Jenis Tagihan, Marketing, Status Terakhir. Leaf columns cover shipment identifiers/DO/vendor/geography/customer/service/mode, sender/receiver contact/address, goods, quantities/volume, tariffs/discount/tax/insurance/packing/pickup/grand total, CASH/TRF/KREDIT/COD, COD fee, manifest/vehicle/driver/dates, DRS/receipt/comment/status, invoice/payment/bank/closing and marketing/latest status. Current Transaction has no authoritative sources for much of this; Booking.customer alone does not prove legacy attribution. Do not fill missing export fields with invented values or substitute Transaction.biaya for recognized revenue.

**E02 / LP-R02 in progress:** Visible monthly form offers January–December, descending years2026–2017, branch selection, Multiple Sheet/One Sheet. Explicit POST report-export destination `/modul/recaps_transactions/export.php`, no business-record controls. One bounded April2025/JAKARTA/One Sheet export downloaded once as `Recaps_Transaction_2026-11-16.xls`; genuine OLE/BIFF signature. Structural inspection pending; no parity claim yet. Original inventory unchanged. Downloaded private files remain outside repository and are removed after inspection.

**E02 completed:** BIFF workbook, one sheet `01-31-4 2025` (name is not proof April has31 days), used B1:L10. Headers row5 B:K: No., Tanggal, Total AWB, Total Koli, **unlabelled F column**, Total Volume, CASH, KREDIT, COD, Total Penagihan. Three populated daily rows correspond to April22/23/29, followed by totals; date cells text, quantities/money numeric, `Rp #,##0`, no formulas. One-sheet option inspected; multi-sheet output NOT inspected. No matched-source billing reconciliation; do not guess that unlabelled column means weight or equate this monthly export to daily turnover.

**E03 / LP-R04:** April2025/JAKARTA, explicit report-only POST `/modul/branch_manifest_recaps/export.php`; downloaded `Branch_Manifest_Recaps_2026-11-16.xls`. Genuine BIFF, one sheet `-`, B1:R9, merged heading rows, no populated details, Grand Total Omzet footer; no Excel formulas, General formats. Sixteen headers: No., No Manifes, Sopir, No. Polisi, Cabang Tujuan, Nama Penjual, Total AWB, Total Koli, Total Berat, Total Volume, CASH, KREDIT, COD, TRF, FOC, Total Penagihan. Date/scope carry-through beyond submitted parameters UNVERIFIED because empty. This is a manifest/billing output, not verified equivalent to E02 or modern manifest inventory.

**E04 / LP-R07:** Date-picker plain fill did not retain historical selection; no output certified from that attempt. Focused recovery used actual year2025/monthApril/day22 controls, confirmed date2025-04-22/JAKARTA, then clicked report-only GET print form. Opened `/modul/rekap_omzet_harian/print_rekap_omset.php?Date=2025-04-22&Cabang=1`, title `doc.pdf`; browser page-assets supplied its actual `application/pdf` output to temporary storage. One A4 portrait page (595.28×841.89pt), Rekap Transaksi Harian, branch/date heading, PENDAPATAN table: Kategori, Kiriman Via, Total Resi, Tunai-Onhand, Tunai-Transfer, Kredit, Tagih Tujuan, CS, Keterangan; populated category/mode row, SUB TOTAL/REKAP SUB TOTAL/GRAND TOTAL/REKAP GRAND TOTAL and three sign-off captions. No customer/staff values or financial amounts retained here. This is not E02's monthly daily-row workbook: category/mode/CS and payment treatment need independent source contracts. Formula and recognition remain UNVERIFIED; printing does not approve them.

### Source-backed slice outcome (WIP verification)

LP-R03/LP-R05 now return/display scoped quantity totals with exact Decimal sums, unknown propagation and10,000-detail refusal/recovery. Changed `src/features/reports/operational/{contracts.ts,server/service.ts,server/quantities.ts,components/report-view.tsx,components/report-page.tsx}`; corresponding focused unit/UI/integration tests. No financial, lifecycle, auth, schema or legacy changes. At base b8829d7 + current worktree: focused6files/29tests PASS; typecheck PASS; guarded `logistik_web_test` operational integration8tests PASS. Integration covers hidden/deleted/released items, zero/unknown/exact decimal totals, owning/transaction scope, boundaries, paging and snapshot consistency. Existing pg concurrency deprecation warning emitted; no failed test. Final integrated gates and modern rendered quantity checks pending. Neither report promoted to exact parity.

**E05 / LP-R22:** One-day2025-04-22 with default all-origin/destination/customer/billing selectors; report-only POST `/modul/report_customer/export.php`. Calendar controls required year/month/day selection: plain textbox fill did not reliably persist both dates; both dates verified before export. Download `Detail_Transaction_Customer_2026-11-16.xls`, genuine BIFF; one period-named sheet, A1:BL10,64 columns, grouped headers and totals, zero Excel formulas, General and `Rp #,##0` formats. Header structure overlaps E01 but differs: fifth leaf is Customer rather than Vendor; final Closed Date rather than Closed Date2, no Marketing/Status Terakhir pair. No VERIFIED_EQUIVALENT claim. Modern standalone customer preview supplies none of its query/export behavior; customer attribution, mode/service/contact/address, billing breakdown and operational event sources are missing or unadopted.

**E06 / LP-R19:** One-day2025-04-22 Search settled to1row; report-only Export `formaction=//modul/pengiriman/export.php` at same approved origin. Download `Detail_Pengiriman_2026-11-16.xls`, BIFF, one period sheet, A1:R7,17 headers: No., AWB No., AWB Date, Moda, Service, Origin, Destination, Customer, Consignee, Reff No, Shipper Instruction, Weight, Collie, Shipment Status, Received By, Received Date, Leadtime. Zero Excel formulas. UI has15 headers; export includes Customer/Shipper Instruction/Leadtime and different ordering. Leadtime is not proven elapsed-time/SLA semantics. Source capture for mode/service/instruction and receipt selection still unresolved; a Booking join or arbitrary latest DRS must not silently invent attribution/history.

### Owner period steering and full-history evidence

Owner explicitly requested oldest period through today during execution. Earlier one-day/month exports above remain bounded structural evidence, not full-history exports. LP-R19 has no visible input minimum. A single read-only query accepted lower-bound sentinel `0001-01-01` through2026-11-16, default all-customer/destination. This is a technical full-range filter, **not a claim records exist in year1**. Settled result82,201; Date header sorted ascending (`aria-sort=ascending`) exposed earliest returned date2022-06-13, followed by2024-11-01. No customer rows retained. This establishes earliest returned shipment date under this account/query; no cross-report/global historical coverage inferred. One browser read timed out, focused retry succeeded. No82,201-row private export executed. Use2022-06-13 through today for shipment-family observation where supported; other families independently require earliest evidence. Month-only reports offer a month/year, no all-history interval; currently observed year options2017–2026 are selector options, not proof of first stored period. No random month-by-month scan or broad export.

Actual modern1366×768 Chrome: LP-R03 and LP-R05 rendered updated quantity explanations, bounded dates and empty results. Manifest screenshot reviewed, no observed page overflow/clipped controls. No local matching rows; populated quantity columns, null display and numeric alignment verified by synthetic UI test plus real guarded DB results, **not populated runtime proof**. No fixtures inserted into development/legacy data. Temporary viewport reset. User's full-history inspection request does not silently remove modern accepted31-day/security/resource bounds.

**E07 / LP-R15:** Full-range display query `daily-report-courier?startDate=0001-01-01&endDate=2026-11-16&submit=Search` retained both dates and settled15courier-summary rows. Start input readonly; direct navigation used only the observed GET display form's fields. Actual report-only export `/modul/daily_report_courier/export.php` downloaded `DETAIL_REPORT_KURIR_2026-11-16.xls`. BIFF, sheet `Detail Report Kurir`, A1:S9, no formulas, General format. **Export differs from UI:**18 detail headers NO., DRS NO, AWB NO, DATE, ORIGIN, DESTINATION, SHIPPER, CONSIGNEE, COURIER, SERVICE, KOLI, `0BERAT` (literal label), ACC. BY, ACC. DATE, ACC. IN, SLA, REMARK, ACTION; no populated detail rows in this file, subtotal/grand-total structure. It does not reproduce the15pickup/miss summary rows. No claim that this discrepancy is intended, that dates/filters carried through, or that LP-R15/16 are equivalent.

**E08 / LP-R16:** Full-range Cari retained0001-01-01..2026-11-16, default branch/courier/statusX/form1. UI totals Sukses13,844/Pending6,348/Failed347, but table indicator0rows. Totals membership/status rules unverified. Invoked report-only export `/modul/laporan_detail_kurir/export.php` once. Download wait timed out/reset the browser controller; focused recovery plus native current Chrome inspection established **Cloudflare524 origin timeout at the export endpoint, 2026-11-16 06:26:01UTC**. No file observed. This is an observed upstream request failure, not an invented modern defect or a proven permission rejection. No repeated export attempt. Other safe report inspection continued.

**E09 / LP-R10:** No period control: all currently available pending history. All-destination list79,446rows; selected known visible BANDUNG destination(cab5) and Cari settled81rows, retaining all periods. Export opens a **separate dialog** whose destination defaults to all rather than inheriting BANDUNG. Explicitly selected BANDUNG again inside the dialog before submitting report-only POST `/modul/awb_pending/export.php`. Download `REPORT_AWB_PENDING_Manifest_2026-11-16.xls`, BIFF, sheet `2026-11-16`, A1:M91,12 headers No., AWB Koli Number, AWB Number, Date, Destination, Moda By, Colly, Weight, Volume, TUNAI, KREDIT, TAGIHAN TUJUAN; stored totals, no formulas, General/text/@ and `Rp #,##0.00` formats. UI has10columns/Total Biaya rather than three billing columns. Piece-grain source and billing mapping absent from modern schema. Full-period destination subset does not establish whole-report inclusion/permission equivalence.

**E10 / LP-R11 in progress:** Month/year-only selector exposes12months and years2026–2017, no all-period option. Targeted April2025/all-user/all-destination Cari settled0rows; parameter-only monthly limit recorded rather than pretending a full-history query. Export dialog initially November despite April list query; month/year explicitly set again. Actual report-only POST `/modul/awb_termanifest/export.php` downloaded `REPORT_AWB_TERMANIFEST_2026-11-16.xls`; structural inspection pending. Preserve LP-R10 and LP-R11 independently.

### Integrated verification checkpoint

**Second source-ready slice (before implementation):** LP-R03 stored origin/destination branch references. `shipments/server/manifests-service.ts` validates positive source IDs, current branch membership for ordinary creation, and stores `Manifest.originBranchId/destinationBranchId`. Resolve names for only these IDs on already-authorized page rows, in the same snapshot, separately from branch options. Historical soft-deleted branch labels remain references, consistent with existing transaction-report labels; a dangling/null ID yields null. Never substitute the owning branch, transit text or geographic guesses. Display labels explicitly say stored branch; no change to owning-branch predicates/options/grants. Legacy Asal/Tujuan geographic equivalence remains unverified. Tests/verification below will supersede earlier quantity-only checks for affected source.

Current worktree on b8829d7: `npm run check` lint419files PASS, typecheck PASS, unit/UI670PASS/1FAIL (671total). Failure is unchanged SCH01 applied-migration byte-checksum test: all six checked migration files have CRLF working-copy bytes, while `git show HEAD:<migration>` and LF-normalized bytes match their expected baseline hashes exactly. No schema/migration/checksum fixture changed; do not normalize applied files or weaken the test during this report slice. Thus **integrated check is not green**. Full guarded integration15files/138tests PASS (pg concurrency deprecation warning); `npm run build` PASS,78pages generated. Node executable reported26.13.0 during export inspection; pinned24engine conformance not established by these checks. No repeated full gates after documentation-only changes. Scoped diff check PASS. No commit/push/merge/deploy.

### Remaining export structures and period limitations

All downloaded workbook claims below derive from actual parsed output, not extension or label alone. BIFF files have OLE signature; OOXML files are ZIP workbooks. Filenames use observation/download day2026-11-16, not necessarily the report period. Blank formatted padding columns are distinguished from business headers. No business formula is approved merely because an export stores a total; all inspected samples have zero Excel formulas.

| Evidence / identity | Actual output and observed filters | Structural result and limits |
|---|---|---|
| E10 completed / LP-R11 | REPORT_AWB_TERMANIFEST_2026-11-16.xls; April2025/all users/destinations, month-only | BIFF sheet2026-11-16, A1:M10, no detail rows;12 headers No., DO Number, Date, Destination, Moda By, Colly, Weight, Volume, TUNAI-ONHAND, TUNAI-TRANSFER, KREDIT, TAGIHAN TUJUAN. AWB/manifest identifiers exposed by UI are not those leaf headers. General format. No equivalence with pending export. |
| E11 / LP-R12 | Rekap_Customer_BL_2026-11-16.xls; April2025/JAKARTA, parameter-only/month-only | BIFF sheet Rekap Pelanggan Bl, B1:H10; six headers No., Nama Pelanggan, Total AWB, Kg, Volume, Total Transaksi; populated summary/total structure, General format. Total Transaksi unit and customer attribution unproven; not assumed revenue or count from the label. |
| E12 / LP-R13 | Rekap_Omset_Harian_2026-11-16.xls; April2025/JAKARTA, month-only | BIFF sheet Rekap Omset Harian, B1:L9;10 headers NO., TANGGAL, TOTAL TUNAI, TOTAL BB, TOTAL BL, TOTAL TRANSFER, TOTAL OMSET, DARAT, LAUT, UDARA; summary/total rows, General and integer grouping format. BB/BL, recognition and mode classification unresolved. Separate from LP-R07 PDF and LP-R02 recap. |
| E13 / LP-R14 | Detail_Transaksi_2026-11-16.xls; April2025/all filters/One Sheet requested | BIFF A1:BL9,63 leaf headers including Vendor, detailed address/contact, charge breakdown, manifest/DRS/receipt/invoice/payment dates; similar structure does not prove LP-R01 inclusion/date equivalence. Query UI empty and month reset; April explicitly reapplied before export. No authoritative inbound event/date source demonstrated. |
| E14 / LP-R17 | REKAP_SALES_AGING_2026-11-16.xls; April2025/all customers | BIFF sheets BELUM LUNAS(A1:N11), LUNAS(A1:K9), both0serial detail rows. Unpaid headers include invoice date/number, invoice-receipt date/person, company, amount, terms, age and literal buckets 0 S/D21 HARI, >21 HARI=30 HARI, >30 HARI. Paid sheet adds payment date/deduction/remarks. Rp #,##0.00 format. Month reapplied after Menunjukan reset it. Empty output cannot prove aging formula/boundaries/receipt mapping. |
| E15 / LP-R18 | REKAP_DEBT_PAYMENTS_AGING_2026-11-16.xls; April2025/all vendors | BIFF sheets Worksheet(A1:N12), OUT(A1:J9), both0serial details. Unpaid structure company/invoice/date/ATAS/due limit/amount/JADWAL AGING/remarks, second header buckets0-30,31-60,61-90,>90 and literal Sel Keluar1. OUT includes invoice receipt/person/company/remarks/amount/payment date. Rp #,##0.00. No claim OUT equals a verified settlement workflow. |
| E16 / LP-R20 | REPORT_POD_RETURN_2026-11-16.xls; full lower-bound0001-01-01..2026-11-16, destination BANDUNG | All-destination display had82,201rows; scoped display/export each1row. BIFF POD RETURN, A1:K7,10 headers No., AWB, AWB Date, Destination, Consignee, Reff No, Received By, Received Date, Status AWB, Remarks. No inference delivery receipt means returned POD; return inclusion/source remains unresolved. |
| E17 / LP-R21 | Report_All_Status_2026-11-16.xlsx; full lower-bound0001-01-01..2026-11-16, BANDUNG/default other filters | Display1row; actual OOXML sheet0001-01-01-2026-11-16, A1:Y8,25 headers: No., AWB, AWB Date, Reff No, Origin, Origin Name, Destination, Destination Name, Customer Name, Consignee Name, Consignee Address, Moda, Service, Weight, UOM, Colly, Totbi, Status Name, Remarks, Status Received By, Status Received Date, Status Received Time, Lead Time, POD Return Date, Shipper Instruction. General/date d/m/yyyy/currency formats. UI14columns are not the export contract. |
| E18 / LP-R08 | Report_Profit_Manifest_2026-11-16.xls; full lower-bound0001-01-01..2026-11-16, all destinations/plates | UI6manifest rows; dates2025-02-02/05-08/08-16 and2026-04-24. BIFF Worksheet, A1:Z14;25 headers No, plate, manifest, destination, driver, manifest date, creator, CASH/KREDIT/COD/TRF/FOC/TOTAL MANIFEST, VENDOR1..5 each paired with TOTAL VENDOR1..5, TRUCKING COST, GROSS PROFIT. Rp #,##0. Numeric relationships/recognition not adopted or reconciled. Fin transaction-ledger GP cannot supply this manifest/vendor allocation contract. |

**E19 / no export established on four report surfaces:** LP-R03 single-date selector was correctly set via calendar to known manifest date2025-02-02/JAKARTA; fourteen headers, no populated rows/export control. Date selection is observed, backend inclusion still unverified. LP-R05 current list again0rows, fourteen per-DRS headers/search/page-size; no range or export established. LP-R06 known-manifest-month request URL had bulan2/tahun2025/status1(Destination), but form displayed November2025; result empty, eleven headers, no export established. Do not codify the reset as correct date semantics. LP-R09 current month/vendor/user placeholders and Daftar Manifes heading again exposed no explicit query/export or settled rows. These four observations do not prove global absence of detail-level exports. No guessed action/endpoint executed.

**E20 / follow-through on oldest-to-today steering:** LP-R01 full lower-bound0001-01-01..2026-11-16 plus BANDUNG/default other selectors settled1row. Actual second xlsx, period-named sheet/A1:BM9,1serial detail, same65business columns (63leaf plus two merged header columns), no formulas. LP-R22 calendar-selected earliest observed shipment date2022-06-13 through today/BANDUNG/default other selectors produced a second BIFF workbook, period sheet/A1:BL10,1serial detail/63leaf headers, no formulas. Correction to E05:64-column used grid includes formatted padding;63 leaf business headers, not64 proven business fields.

LP-R19 full-period BANDUNG Search displayed0rows. Its export did not download; response showed PHPExcel deprecation warnings and **SQLSTATE42S22/1054 Unknown column D3.branchGroup in WHERE**. This is actual legacy export response evidence for that filtered request, not an invented modern bug, financial rule or proof that the date bound caused it. Earlier unfiltered one-day E06 export succeeded; no failed-export retry. Raw server filesystem paths/private values omitted. Thus oldest-to-today period selection is exercised where supported; no claim every selector supports one all-history interval or every export succeeds.

Aggregate-only membership check: E09 has81serial piece rows spanning74distinct AWB identifiers; LP-R01's full-period BANDUNG subset has1transaction row, and those exported identifier sets do not match. Identifiers compared only in memory and never persisted. This demonstrates that same destination label and similar columns do not prove shared source membership or one-piece-per-transaction grain. Exact cause/filter attribution requires source evidence.

### Comprehensive migration progress (separate from accepted ROADMAP)

Historical sections1–10 remain baseline findings; E01–E20 and the source changes here supersede only expressly updated dimensions. IMPLEMENTED_UNVERIFIED describes a functional accepted subset whose whole legacy parity is not established. BLOCKED_SOURCE/DECISION does not imply a working preview. All22identities remain distinct; no new EXACT/VERIFIED_EQUIVALENT/MIGRATED_EXACT designation.

| ID | Legacy evidence | Export evidence | Current implementation | Migration status | Remaining gap |
|---|---|---|---|---|---|
| LP-R01 | I/E01/E20,14UI columns; full-period scoped1row | Actual65-column xlsx; modern nine-field CSV is accepted subset | Real query/filter/sort/CSV unchanged | IMPLEMENTED_UNVERIFIED | Mode/service/description, unambiguous receipt/comment grain; customer/billing filters and historical contact/charge/event export sources absent. D15/19/22; money rules D11–14/21. |
| LP-R02 | I/E02,month-only | Actual populated daily billing recap; one-sheet inspected | No dedicated query/output | BLOCKED_DECISION | CASH/KREDIT/COD/penagihan attribution/date/formula; unlabelled column; multi-sheet contract. Not silently LP-R07/13. D15/19 plus money owner. |
| LP-R03 | I/E19,single-date/branch; backend population unverified | No export established on inspected surface | Real manifest query + visible quantity totals + stored branch labels | IMPLEMENTED_UNVERIFIED | Legacy item membership/aggregates, seller/driver/cost source, sort/actions and same-source reconciliation. Raw branch references do not prove geography equivalence. |
| LP-R04 | I/E03,month-only | Actual16-column empty manifest/billing workbook | No dedicated query/output | BLOCKED_SOURCE | Driver/vendor attribution and manifest billing source; recognition/date definition. Source capture needed, not label substitution. |
| LP-R05 | I/E19,per-DRS0rows | No export established | Real sheet/item queries + visible sheet quantities | IMPLEMENTED_UNVERIFIED | DRS status absent, progress/success/fail buckets not adopted, costs/driver/event mapping missing; no populated UI parity proof. |
| LP-R06 | I/E19,monthly classification; request/display mismatch | No export established | Synthetic preview | BLOCKED_SOURCE | Manifest driver/vendor/cost associations and recognized GP grain/formula. FIN GP is separate. D13–15/19/21. |
| LP-R07 | I/E04,single-day print | Actual A4 PDF/category/mode/CS/payment totals | No query/print target | BLOCKED_SOURCE | Category/mode/CS source and payment classification/recognition; no safe synthesis from biaya. D11–15/19/22. |
| LP-R08 | I/E18,full-period6manifests | Actual25-column vendor/trucking GP workbook | Synthetic preview; real FIN GP elsewhere | BLOCKED_SOURCE | Five vendor allocations/driver/trucking/manifest financial source, formulas and date rules; no approved transaction-to-manifest recognition bridge. |
| LP-R09 | I/E19,month/vendor/user placeholders | No export established | Guarded readiness only | BLOCKED_SOURCE | No Manifest/Vehicle vendor relation or historical attribution source. Current mission includes this report; prior RPT05 NOT NEEDED retained as old acceptance, not reason to skip source design. |
| LP-R10 | I/E09,all available periods; scoped81rows | Actual12-header/81piece workbook | Synthetic pending view | BLOCKED_SOURCE | Piece identity/membership and pending definition absent; billing classifications and destination semantics unproven. Transaction row is not a piece record. |
| LP-R11 | I/E10,month-only; sampled0rows | Actual12-header empty workbook; modal period independent | Synthetic manifested view | BLOCKED_DECISION | Active/released/history/date grain and meaning of UI identifiers versus export omissions; ManifestItem exists but does not decide these rules. D15/19/22. |
| LP-R12 | I/E11,month/branch parameters | Actual6-header customer recap | Synthetic monthly preview | BLOCKED_DECISION | Customer attribution and Total Transaksi unit/inclusion; Booking.customer not silently adopted as historical report attribution. D15/22. |
| LP-R13 | I/E12,month/branch parameters | Actual10-header turnover/mode workbook | Synthetic turnover preview | BLOCKED_DECISION | BB/BL/transfer/mode categories and monetary recognition; biaya is not automatically recognized revenue. D11–15/19/21. |
| LP-R14 | I/E13,month/filter query; display reset | Actual63-leaf inbound workbook | Synthetic inbound preview | BLOCKED_SOURCE | Authoritative inbound event/date/status and historical joins absent; destination branch alone not proof of inbound arrival. |
| LP-R15 | I/E07,full-period15courier summaries | Actual18-header empty detail output differs from summary | Synthetic courier daily view | BLOCKED_SOURCE | Pickup/miss event source absent; reconcile which export dataset is required without erasing summary identity. |
| LP-R16 | I/E08,full-period totals/table discrepancy | Actual full-period request failed upstream524 | Synthetic courier detail view | BLOCKED_DECISION | SLA/Acc.in/L.Time/date and receipt/courier selection; counts versus table discrepancy, source service mapping and export evidence. D15/19/22. |
| LP-R17 | I/E14,month-only empty aging views | Actual two-sheet AR receipt/aging/payment structure | Synthetic AR; real FIN invoices separate | BLOCKED_DECISION | Invoice receipt versus payment receipt, age basis/buckets/terms/date/source. Accepted modern invoicing is not historical AR equivalence. D11/14/15/19/21. |
| LP-R18 | I/E15,month-only empty AP | Actual two-sheet AP aging/payment-date structure | Synthetic AP; supplier accrual separate | BLOCKED_SOURCE | Supplier invoice/due/settlement allocations absent. FinCost liability is not supplier payment. Accepted settlement exclusion remains explicit; AP view needs source/rule contract. |
| LP-R19 | I/E06/E20,full-history82,201; scoped SQL failure | One-day17-header workbook succeeded; full-period destination request failed | Synthetic shipment view | BLOCKED_SOURCE | Mode/service/instruction, customer attribution, receipt choice and Leadtime rules; legacy D3.branchGroup failure not copied. |
| LP-R20 | I/E16,full-period scoped1row | Actual10-header POD workbook | Synthetic POD preview | BLOCKED_SOURCE | Returned-POD membership/event not established; delivery receipt not proof of POD return. |
| LP-R21 | I/E17,full-period scoped1row | Actual25-header xlsx includes POD date/instruction/UOM | Synthetic all-status view | BLOCKED_SOURCE | Mode/service, status receipt/history selection, customer/billing/source amount and POD-return fields; raw status alone insufficient. |
| LP-R22 | I/E05/E20,standalone export; earliest-observed shipment date through today | Actual63-leaf BIFF/full-period scoped1row | Synthetic standalone customer view | BLOCKED_SOURCE | Historical customer/address/contact/charge/event snapshot sources and billing/filter attribution; no proven consolidation with other customer reports. |

Every export-exposing identity has an actual inspected output or concrete failed-request evidence:16spreadsheet report identities plus LP-R07 PDF succeeded; LP-R16 full-period export failed524. LP-R19 additionally has a filter-specific SQL failure. One-sheet/month samples do not certify full-history coverage, multi-sheet variants, populated aging rules, role permissions or totals reconciliation. Report inclusion is now requested; unknown business rules remain dependencies rather than another blanket scope-approval question.

### Next executable source-contract work

No further complete report slice is source-ready under the inspected models/contracts. Next: define LP-R01 mode/service/description capture at Transaction grain with the operational source owner and D15/D22 business mapping, retaining current nine-field/report security and existing-row nulls. Preferred minimal option: nullable source capture for new operational records, reviewed migration plus historical-unavailable presentation; alternative: separately approved authoritative historical import with field/grain/privacy reconciliation. Never fabricate historical values, assign latest DRS notes to ambiguous transactions, or introduce financial backfill under the report request. Developer review timing remains final combined review; unresolved business semantics are the dependency, not developer availability. Then complete remaining transaction/workbook fields from their real sources; preserve each report identity and independent export contract.

Parallel owner/source decisions documented for next phase: operational manifest/DRS driver and vendor allocation/capture; pickup/POD/inbound events and SLA/receipt selection; finance-owned report recognition/aging/billing categories. SUP/FIN application/posting rules untouched. No new PR/push/merge/deploy or legacy mutation. Existing release acceptance remains separate from comprehensive migration.

### 12. LP-R10 / LP-R11 / LP-R21 source-backed implementation — 2026-11-17

Decisions recorded in `docs/PRD.md` D-22 (2026-11-17). Fresh read-only legacy observation (no data added, changed or exported; no customer values persisted) confirmed the opening states and controls below.

| ID | Legacy (observed 2026-11-17) | Modern implementation | Status | Remaining deviations |
|---|---|---|---|---|
| LP-R10 | `awb-pending`: no period, Semua Tujuan, Cari/Ekspor/Refresh, local search; columns AWB Koli No., AWB No., DO No., Tanggal, Tujuan, Moda, Koli, Berat, Volume, Total Biaya; per-piece rows | `/branch-reports/awb` (default view): every AWB without active assignment, optional transaction-date range, destination filter, AWB search, totals (AWB/koli/kg/volume, unavailable when any source value unknown), CSV | IMPLEMENTED_UNVERIFIED | Per-AWB not per-piece; Tujuan is destination branch, not district/city; Moda and Total Biaya omitted (no source / money rule D-11). |
| LP-R11 | `awb-termanifest`: month + year, Semua Pengguna, Semua Tujuan; columns AWB No., DO No., Manifes No., Tanggal, Tujuan, Moda, Koli, Berat, Volume, Total Biaya | `?view=manifested`: active assignments, manifest-date range defaulting to current UTC month, destination filter, totals, CSV | IMPLEMENTED_UNVERIFIED | Date range instead of month/year selector (same reach); user filter, Moda and Total Biaya omitted. |
| LP-R21 | `all-status`: period (default today), Asal, Tujuan, Customer, Billing, Status Kiriman; totals POD/Kilo/Koli; columns AWB, Date, Moda, Service, Origin, Destination, Shipper, Consignee, Koli, Kilo, Description, Shipment Status, Received by, No Manifest | `/customer-reports/all-status`: default today, Asal/Tujuan/Status filters, totals, latest recorded recipient (newest DRS date, then delivery time) + time, active manifest no., CSV | IMPLEMENTED_UNVERIFIED | Customer/Billing filters, Moda, Service, Description omitted (no approved source); extra "Waktu diterima" column. |

Common: `transaction_report` view (and export for CSV) rights, RPT-01 branch scope (origin or destination in allowed branches), RepeatableRead snapshot, max 5000 export rows, formula-safe CSV. No schema, migration or permission changes. Tests: `tests/integration/awb-status-reports.test.ts` (7), `tests/unit/awb-status-report.test.ts` (4). Parity remains unverified until a same-data reconciliation is possible.


### 13. Dashboard, invoice list and per-feature recheck — 2026-11-18

Fresh read-only legacy observation (Dashboard, Invoice (New) list 2016-01-01..2026-11-18 = 0 invoices, Void AWB list empty; no forms, no exports, no customer values persisted).

| ID | Legacy (observed 2026-11-18) | Modern after this pass | Status | Remaining deviations (owner) |
|---|---|---|---|---|
| Dashboard | Opens on current month to date; month/year/branch filters; Quick Action (13 shortcuts); AI summary/recommendations; alerts (AWB pending, shipment pending, invoice outstanding, failed/return, DRS, piutang); KPI cards; Analytics (total Rp, CASH/KREDIT/COD/TRANSFER, AWB count, avg/AWB, active customers); sales chart by nominal per billing type; top 5 customer; shipment status buckets; recent AWB activity; POD outstanding by destination; announcements | Opens on current UTC month to date; Quick Action limited to implemented permitted routes; raw counts; AWB Pending (LP-R10 definition); invoice outstanding + piutang (FIN-01 derivation, invoice:view); daily AWB count chart with table view; stored status distribution; latest 5 AWB activity (transaction read rights) | PARTIAL_PARITY | Money totals, billing categories, avg/AWB, active/top customer (D-11, D-15, customer attribution — finance/Dev 2); success/failed/on-delivery buckets (status mapping, D-15/D-22); POD outstanding (POD event source, Dev 2); AI recommendations and announcements (no source, not invented); sales chart shows counts not nominal |
| FIN-INVOICE-LIST | Customer, Invoice No, Tgl. Dibuat, Tgl. Diterima, Termin, Tgl. Pengingat, Status, Tgl. Tutup, Tot. AWB, Action | Customer, Invoice No, Tgl. Dibuat, Termin (days), Status, Tot. AWB, Cabang, Tagihan IDR, Sisa IDR | PARTIAL_PARITY | Received/reminder/closing dates have no FIN-01 source (finance owner) |
| LP-R03 | (unchanged) | Asal/Tujuan stored branches and visible quantities already present; earlier presentation row in §LP-R03 is outdated | PARTIAL_PARITY | Penjual, Tot. Biaya, Sopir (Dev 2 driver/vendor, D-11) |

Commits up to 398d11d on dev3/ready-for-review. Verification recorded in agent-state RUN_LOG 2026-11-18.

### 14. Modules and simplified reports — 2026-11-18 (branch feat/modules-parity)

User direction: make every unavailable menu work from database data, simplified where needed and reported. Legacy Entry AWB form observed read-only (fields only, no submit).

| Area | Modern implementation | Simplification vs legacy (needs owner confirmation) |
|---|---|---|
| Manifest | List, create (Draft, vendor), detail, assign AWB by number | No status change, print, driver/cost columns |
| Entry AWB / Booking | Branch, customer, layanan, DOC/PAC, moda, pembayaran dropdowns; isi barang, keterangan | No pricing engine (harga/kg, diskon, PPN); biaya entered manually |
| Pemasaran/Penjualan | Customer and Penerima CRUD, soft delete, new `customer`/`consignee` permissions | Customer revenue page not separate (see Rekap Customer Bulanan) |
| AWB detail | Code 128 barcode, names instead of IDs | No print layout |
| Rekap Customer Bulanan | Per customer: AWB, koli, berat, total biaya input | Biaya = Entry AWB amount, not recognized revenue (D-11/D-14) |
| Rekap Omset Harian | Per day × payment type | Omset = sum of Entry AWB biaya |
| Detail Transaksi Inbound | AWB whose destination is the branch | Inbound = destination branch, no arrival event |
| Laporan Kurir | Per manifest courier from DRS: total, berhasil, gagal, retur, belum ada hasil | No pickup/SLA columns |
| Laporan Keuangan | AR aging per customer from FIN-01 issued invoices (as of today) | AP not included (no supplier settlement) |
| Gross Profit / Manifest, Rekap GP | Pendapatan = AWB biaya; Biaya = FIN-02 net actual cost; GP = difference; per manifest / per vehicle | Missing costs count as 0 and are flagged |
| Manifest Vendor | Per vendor chosen on manifest | Historical manifests have no vendor |
| Pengiriman | AWB list per customer with layanan/moda | — |
| POD Kembali | DELIVERED delivery items with receiver and time | No physical POD-return event |

Schema: migration 20261118000200_transaction_capture_fields (nullable FKs, no backfill). Needs Dev 2 and migration coordinator review. Verification: lint, typecheck, unit 689, integration 157 PASS (Node 24.15.0); desktop browser spot checks on local synthetic data.

#### 14.1 Review pass — 2026-11-18

- Relations: every new column has a RESTRICT foreign key to the intended master (customers, transport_modes, delivery_services, goods_types, cost_types, vendors). Dev DB consistency checks all zero: DRS items outside their manifest, AWB in two active manifests, customer/consignee/invoice branch mismatches. Known gap: legacy `manifests.origin_branch_id`/`destination_branch_id` have no foreign key (Dev 2 schema).
- Report numbers: grouping by id (not name); missing koli/berat/biaya counted in an explicit column instead of silently treated as complete; reconciliation tests tie Rekap Customer and Omset totals to direct counts, GP/Rekap GP/Manifest Vendor AWB totals to active manifest items, and courier outcome buckets to their total.
- Delivery sheets: create one DRS per manifest and record outcomes from the manifest page (Dev 2 outcome service), so Laporan Kurir and POD Kembali have a live source. Outcome DELIVERED still requires AWB status In Transit (Dev 2 transition rule).

### 15. Modul menu parity, printing and UX pass — 2026-11-19

Legacy observed read-only: Pendapatan Pelanggan (`revenue-customer`: No., List Pelanggan, Total Pendapatan, Growth "dari" previous month, month/year filter, all customers incl. zero).

| Modul item (reference) | LMS | Note |
|---|---|---|
| Customer, Penerima | `/marketing` tabs | — |
| Pendapatan Pelanggan | `/marketing/revenue` | Revenue = AWB biaya per month; growth vs previous month |
| Onsite Outbound / Inbound | Entry AWB / Detail Transaksi Inbound | Inbound = destination branch list |
| Print AWB | AWB list → select → print tab (barcode + QR) | — |
| Void AWB, History Delete Resi | `/transactions/void` | Cancelled or deleted AWB; no separate void approval |
| Histori Edit Resi | `/transactions/history` | Status change history only; field edits are not tracked |
| Status Pengantaran, Cek Resi, Booking | delivery items report, lookup, bookings | — |
| Manifest, Cek Transit, Cek Inbound, Print Manifest | `/manifest` (+type filter), print tab | — |
| Kurir Kota, Print DRS | courier report, delivery report / DRS print | — |
| POD Kembali, Proses Vendor, Invoice (new) | POD report, manifest vendor, invoices | — |
| Persetujuan Edit/Delete AWB, Approval POD Kembali | not built | Need approval workflow and approver rules (D-21) |
| Cek Ongkir | not built | No tariff master (D-11) |
| Inbound Booking, Cek Inbound Agen | not built | No booking-destination or agent-manifest source |
| Pembayaran Hutang | not built | Supplier settlement out of scope (owner NOT NEEDED) |

Also: searchable dropdowns (ComboSelect over a native select), branch pickers instead of raw IDs in finance, popover token fix, print route group without shell (auto print dialog, `?preview=1`), QR backup (qrcode 1.5.4), bulk print, row numbers, info tips for long explanations, clearer messages, personnel import accepts branch ID. Gates (Node 24.15.0): lint 479, typecheck, unit 699, integration 163, build PASS.

### 16. Remaining Modul items, Entry AWB parity, tabs — 2026-11-19 (later)

Built at the owner's direction ("kerjakan aja semua, aku setuju"). Legacy pages observed read-only (no form submitted): `approve-modified-awb`, `cek-ongkir`, `inbound-booking`, `cek-inbound-agen`, `stt-kembali-operational`, `approval-pod-kembali`, `debt-payments`, `on-site-add`, `on-site-inbound`, `on-site-add/tambah` (form opened, closed without saving), `destination-branch`.

| Reference item | LMS | Notes / simplification |
|---|---|---|
| Persetujuan Edit/delete AWB | `/transactions/approvals` + panel on AWB detail | Request with reason; approver may not approve own request (admin may). Approved DELETE soft-deletes the AWB, refused while it is on an active manifest, DRS, invoice, journal, POD Kembali or vendor invoice. Approved EDIT opens a one-time edit (names, address, phone, DO, koli, berat, volume, biaya, isi, keterangan); koli/berat/volume/biaya locked once invoiced or journaled. Diff kept and shown in Histori Edit Resi. |
| Cek Ongkir | `/customer-service/cek-ongkir` | New `tariffs` table (route, service, Berat Min., Tarif/Kg, Estimasi). Tarif = max(berat, min) x Tarif/Kg. Legacy origin/destination are area-level (kecamatan); LMS uses branches until the D-27 area hierarchy exists. |
| Inbound Booking | `/bookings?tab=inbound` | Booking destination is free text: matched to a branch name, or via an AWB of the booking. |
| Cek Inbound Agen | `/manifest?view=agent` | Manifests with an agent/vendor, filter Tujuan. Biaya total column not shown. |
| POD Kembali / Approval Pod Kembali | `/pod-returns` (tabs) | New `pod_returns` + items. Only Delivered AWBs; one AWB per non-rejected document; number POD-YYYYMMDD-NNNN; only the destination branch decides. Legacy "Shipment Status" filter in the form not built. |
| Pembayaran Hutang | `/finance/debt-payments` | New `vendor_bills` + items register (Kategori Vendor/Agen/Lainnya, term, reminder, Tandai Lunas). **No journal posting**; accounting treatment remains a finance decision. Owner earlier said NOT NEEDED; built now at owner's direction. |
| On Site Outbound / Inbound | `/transactions` tabs | AWB list by origin / destination branch, search AWB/DO. |
| Tambah AWB | `/transactions/new` | Mirrors legacy inputs: automatic AWB number (branch code + YYMM + 5-digit sequence, "Manual AWB" switch), Pricing Type (Harga/Kg, Harga/Koli, Trucking), Pickup By (courier "Nama \| Kota"), Asal/Tujuan "Kode \| Nama", Marketing, sender/receiver address and phone, Penerima picker, Terberat, Harga/Min KG (prefilled from tariff), Asuransi Y/N (stored only), Biaya Lain/Packing/Pickup, Discount, PPN, Grand Total, Ganti Harga. Server recomputes with Decimal: freight + fees, minus discount, plus PPN on the discounted amount, half-up to 2 dp; Grand Total stored as `biaya`. **Formula is OBSERVED, needs finance confirmation.** Tujuan in legacy is an area (kecamatan, kota) filtered by origin; LMS uses branches (D-27). Per-koli "Detail" dimensions not built. |

Menu: Modul labels now match the reference text (e.g. "Persetujuan Edit/delete AWB", "Void Awb", "Approval Pod Kembali", "Invoice (New)"); identical list pages are merged into one page with tabs (Transaksi, Booking, Manifest, POD Kembali). Header bell shows pending approval counts (refresh on navigation and every 60 s; no websocket).

Migrations: `20261119000100_modul_workflows` (6 tables + CHECKs), `20261119000200_awb_entry_detail` (nullable transaction columns + CHECKs). Verified by deploying all migrations to an empty database and diffing against the schema: only the known Dev 2 `updated_at` default drift remains. New permissions: `awb_change` (view/request/approve), `tariff` (view/manage), `pod_return` (view/create/approve), `debt_payment` (view/create/close).

Follow-ups in the same pass:

- AWB No. is one editable input pre-filled with the origin branch's next number; unchanged = number assigned under a branch lock at save (two users never get the same number), changed = manual number.
- Concurrency (several administrators): decisions lock the request row and require PENDING (second decision gets "sudah diputuskan"); tariff save, POD and vendor-invoice numbering use transaction-scoped advisory locks; AWB rows are locked in id order; manifest assignment and vendor invoices lock the AWB against an approved delete (finance already uses FOR SHARE). Covered by concurrent integration tests.
- AWB detail shows the request and change history (before → after per field, who, when, reason).
- AWB print header: company name/address/phone from the origin branch's company, title "RESI PENGIRIMAN (AWB)" instead of "AIR WAYBILL"; Biaya printed only when the company's "show price on print" flag is on. Legacy print layout not observed (opening it triggers the browser print dialog).

### 17. Proof-of-delivery photo — 2026-11-19 (owner request)

Optional photo, managed on the AWB detail page (section Bukti Terima (POD)) after the outcome is recorded on the manifest DRS; the manifest table only shows a thumbnail. The browser converts it to WebP (EXIF orientation honoured, longest side ≤1600 px, ≤900 KB; JPEG fallback when the browser cannot encode WebP), the server re-checks the content by magic bytes (WebP/JPEG/PNG, ≤1 MB) and uploads it to Cloudinary with a signed request (`format=webp`, folder `lms/pod`; the API secret never reaches the browser). Only the secure URL, public id and time are stored (`20261119000300_delivery_pod_photo`). If saving the outcome fails, the uploaded image is deleted. A photo can be added once to any recorded outcome and is never replaced. Env (server-only, all three required to enable): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`; without them the form works without photos and explains what to fill in.

### 18. Scan AWB (hidden, not yet adopted) — 2026-11-19

Owner request: build now, keep hidden until the business decides. Page `/transactions/scan` exists only when the server env sets `FEATURE_AWB_SCAN="true"`; otherwise it returns "Data tidak ditemukan" and no button or menu entry is shown. It needs the new right `awb_scan` (`use`), so couriers/drivers can scan without full AWB edit rights. The operator picks the target status (In Transit or Delivered) and scans repeatedly with a handheld scanner (keyboard input), the phone camera (browser BarcodeDetector: Chrome on Android; not Safari/iPhone, no extra library) or by typing. Each scan reuses the AWB status service (allowed transitions, row-level concurrency, immutable history with reason "Scan AWB"), is limited to the actor's branches, and reports unknown, ambiguous, already-set or disallowed cases. Removal: delete the page, `scan.ts`, `scan-actions.ts`, `awb-scanner.tsx` and the `awb_scan` resource. The Hak Akses Menu matrix now labels all actions (previously only view/create/update/delete/manage had headers).

### 19. Scan & Konfirmasi (bukti terima, Progi-style) — 2026-11-19

Owner tested the provider courier app Progi with a provider AWB and described it: after a scan the app shows Pengirim (No. DO, Asal, Nama, Alamat), Penerima (Nama, Tujuan, Alamat, jumlah barang, berat, volume, terberat), Tracking details (time, name, note, e.g. "transaksi diinput oleh … di kantor/on site cabang"), receiver photos 1–5 and a signature, then "Update Status" with DITERIMA or RETUR, receiver name, note, photos 1–5 and a signature drawn in a white box. Scanning our booking barcode in Progi was read correctly and refused with "No. Booking tidak sesuai dengan asal kurir!", i.e. a courier may only pick up bookings of their own branch.

Built behind `FEATURE_AWB_SCAN` and the `awb_scan` right: `/transactions/scan` tab "Scan & Konfirmasi" (default) and "Scan Massal". New tables `delivery_proofs` and `delivery_proof_photos` (`20261119000400`). Each image is compressed in the browser and uploaded separately after access checks; the server returns an HMAC token (BETTER_AUTH_SECRET, 1 h) per image and only accepts or deletes images whose token matches the user, AWB and image. DITERIMA moves Open → In Transit → Delivered (history "Scan AWB"); RETUR keeps the AWB status until D-09 decides a returned status; an open DRS line of the AWB gets the same outcome. The AWB detail page lists these proofs with photos and signature. Courier points/withdrawal: out of scope by owner direction.
