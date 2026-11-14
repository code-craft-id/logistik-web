# DISC-04 report catalogue

Evidence baseline: c40650299674faca3f4d5e6cb92a8675ac6c1ffc. Status: existing repository/offline inventory retained without repeating discovery. Direct legacy behavior coverage remains UNVERIFIED/incomplete because live access is BLOCKED. Formal approval is separately PENDING; missing approval does not mean a legacy behavior is missing. No report is behavior-complete or READY.

Evidence keys: P = src/features/reports/preview/screens.ts (REPO_VERIFIED synthetic metadata, not a runtime query); N = ignored docs/reference/app-provider/laporan-laporan/laporan-menu.md (inherited PROVIDER_OBSERVED menu notes only, not fresh observation). docs/decisions/FND-03-iteration-2.md:21 calls notes OBSERVED pending review; :29-35 explicitly leaves report-image contents UNVERIFIED. N lacks per-entry observer, date, role, actual page path and sample outputs. No private image or row data copied. All 19 primary P views and four rendered AR/AP supplemental views declare Export Excel; declarations are disabled presentation, not functioning export or proof of provider affordances.

## Required semantics for every catalogue row (evidence and approval tracked separately)

For EACH row below: approved source query/joins **TBD**; date basis/TZ/cutoffs **TBD (D-19)**; status inclusion/current-vs-historical/deleted/cancelled/reassigned treatment **TBD**; branch authorization and cross-branch attribution **TBD**; units/currency/precision/rounding **TBD**; totals/formulas and counting distinct documents vs items **TBD**; export format/permission/scope/limits **TBD**; sanitized sample source-to-output reconciliation **MISSING**. Search/pagination behavior lacks direct verified legacy evidence AND formal adoption approval, recorded separately. Local metadata labels do not settle behavior. Once direct evidence is available, sufficient behavior can be proposed for faithful acceptance while approval remains pending. D-15 blocks each row separately. Financial rows also require D-11..D-14 as applicable; export grants need Dev 1 review. Quantity/weight/cost labels below specify no approved formulas.

| Parity ID | Report / inherited N reference | P columns (labels only) | P filters | Totals / export evidence / gaps | P lines |
| --- | --- | --- | --- | --- | --- |
| LP-R01 | Detail Transaksi; N:3 filter/search/export/table | Date, AWB, DO, branch, sender, receiver, destination, koli, kg, volume, tariff, status | From/to date, branch | Transactions/koli/kg/turnover labels. Excel declared; tariff is not approved revenue. | 55-150 |
| LP-R02 | Rekap Transaksi; N:4 filter/Excel | No standalone preview | Unknown | No query or equivalent view established; dashboard link to daily turnover is not equivalence. | None |
| LP-R03 | Manifest Outbound; N:5 branch/table/action | Date, manifest, branch, transit 1-3, destination, driver, plate, AWB/koli/kg/cost totals, status | From/to date, branch | Manifests/AWB/kg/cost labels; no P row action despite N action note. | 152-257 |
| LP-R04 | Rekap Manifest; N:6 filter/Excel | No standalone preview | Unknown | Source/fields/semantics wholly missing. | None |
| LP-R05 | Pengantaran; N:7 Kurir Kota search/table | Date, AWB, receiver, address, destination city, courier, vehicle, sent/received time, status | From/to date | Deliveries/completed/in-progress/failed labels; N does not establish Excel export. | 259-338 |
| LP-R06 | Gross Profit / Manifest; N:8 filter/table/action | Manifest, date, destination, AWB/koli/kg/volume/cost totals, vehicle, driver | Month/year/status (Destination/Transit/Vendor labels) | No actual profit column/formula. Detail Status/Rute/Tujuan labels. Financial definition missing. | 340-425 |
| LP-R07 | Rekap Transaksi Harian; N:9 filter/print | No standalone preview | Unknown | Do not equate with Rekap Omset Harian; print behavior unknown. | None |
| LP-R08 | Rekap Gross Profit; N:10 filter/Excel | Plate, manifest, destination, driver, manifest date, creator | From/to date, branch, origin | No summaries or profit calculation. | 427-500 |
| LP-R09 | Manifest Vendor; N:11 vendor filter/table | Manifest/date/origin/vendor, AWB/koli/weight/volume/cost totals, vehicle, driver, status | Month/year/vendor/user | P title Penjual Manifes: naming equivalence UNVERIFIED. Detail route/user labels. Vendor linkage missing. | 502-601 |
| LP-R10 | AWB Tertunda; N:12 filter/export/table | AWB koli number, AWB, DO, date, destination, mode, koli, weight, volume, cost | Destination | Detail action label; pending definition unknown. | 611-676 |
| LP-R11 | AWB Termanifest; N:13 filter/export/table | AWB, DO, manifest, date, destination, mode, koli, weight, volume, cost | Month/user/destination | Detail action label; assignment/history semantics unknown. | 678-753 |
| LP-R12 | Rekap Customer Bulanan; N:14 filter/Excel | Number, customer, AWB total, kg, volume, transaction total | Month/year/branch | Grouping and financial totals unknown. | 756-820 |
| LP-R13 | Rekap Omset Harian; N:15 filter/Excel | Number/date/cash/BB/BL/transfer/turnover/land/sea/air totals | Month/year/branch | BB/BL meanings and payment classification unknown. | 822-906 |
| LP-R14 | Detail Transaction Inbound; N:16 filter/Excel/table | Date/AWB/manifest/sender/receiver/origin/koli/kg/volume/tariff/status | From/to date | Transactions/koli/kg/cost labels; inbound event/date definition missing. | 908-992 |
| LP-R15 | Harian Kurir; N:18 filter/export/table | Courier name, collected count, missed-pickup count | From/to date | Pickup event source absent. | 1114-1146 |
| LP-R16 | Laporan Detail Kurir; N:19 filter/search/export/table | DRS/AWB/courier/date/origin/destination/sender/service/status/receiver/received-by/date/Acc. in/L.Time/SLA | Period from/to, branch, courier, status | Success/pending/failed labels; SLA/lead-time/accrual semantics missing. | 994-1112 |
| LP-R17 | Laporan AR; N:21 aging/filter/Excel/search | Invoice date/number/receipt date/recipient/company/amount/terms/age | Month/year/customer | Buckets 0 S/D 21 HARI, >21 HARI =30 HARI, >30 HARI are labels, inclusive bounds and aging date unknown. | 1157-1311 |
| LP-R18 | Laporan AP; N:22 AP/filter/search/Excel | Company/invoice/date/ATAS/deadline/amount/0-30/31-60/61-90/>90/notes | Month/year/supplier | Aging formula/date/ATAS meanings unknown. | 1313-1467 |
| LP-R19 | Pengiriman; N:24 customer search/destination/export/table | Number/AWB/date/mode/service/origin/destination/customer/consignee/reference/instruction/weight/collie/status/recipient/date/leadtime | Start/end date, customer, destination | Service/mode/leadtime and customer field linkage unapproved. | 1478-1593 |
| LP-R20 | POD Kembali; N:25 origin/destination/customer/export/table | Number/AWB/date/destination/consignee/reference/recipient/date/AWB status/remarks | Start/end date, origin, destination, customer | POD return event source absent; delivery outcome is not return evidence. | 1595-1680 |
| LP-R21 | Semua Status; N:26 filters/search/table, koli/POD/kilo totals | AWB/date/mode/service/origin/destination/shipper/consignee/koli/kg/description/status/received-by/manifest | Period/origin/destination/customer/billing/shipment status | POD/kg/koli labels; P Excel declaration not mentioned in N. | 1682-1797 |
| LP-R22 | Report Customer; N:27 filter/Excel | Number/AWB/date/destination/consignee/reference/recipient/date/status/remarks | Start/end date, customer, origin, destination, billing type | Customer relation/billing type semantics unknown. | 1799-1889 |

## Supplemental AR/AP views within existing report leaves

AR renders Belum Lunas and Lunas supplemental views (P:1239-1310); AP renders the same two supplemental views (P:1395-1466). Each declares columns PENJUAL, NO FAKTUR, TANGGAL, STATUS, TOTAL BIAYA and disabled Excel tools. preview-workspace.tsx:639-649 renders supplementalViews, so these are part of the visible synthetic catalogue, not dormant metadata. AR/AP primary views also declare HASIL AKHIR footers (P:1219,1375), displayed unavailable. These add four local supplemental views to 19 primary views (23 local views total), without changing the 22 inherited provider report leaves. Paid/unpaid partition, seller identity, amounts, footer formula, dates/status inclusion and export scope all remain TBD under the same D-11..D-15/D-19/D-21 gates; no payment lifecycle or totals approved.

## Accounting and dashboard views outside the 22 report leaves

- Accounting Perkiraan/account metadata: src/features/accounting/preview/screens.ts:5-149; ledger/category/P&L/cashflow :151-278; dormant subpages :280-438. Labels account code/name/display/normal/position/status do not prove chart/posting rules. Ledger/P&L date/filter/source/units/totals/export/reconciliation all TBD, D-13/D-14. No corresponding accounting provider menu note found.
- Dashboard branch KPI labels: monthly cash/credit turnover, receivables, sales, invoiced/uninvoiced AWB; operational labels unmanifested/not-inbound/not-in-DRS/POD destination/origin return. src/features/dashboard/components/dashboard-overview.tsx:62-75,88-109,133-136,177-191 explicitly unavailable data. Charts monthly transactions/sales, invoice paid/unpaid, daily sales. No metric source query, period basis, inclusion, branch rule, unit/formula, export or reconciliation approved. dashboard-filters.tsx:31-87 updates local state only, branch selection disabled. D-15/D-19 and financial D-11..D-14 apply by metric.

## Acceptance evidence to request

For each selected report, provide permitted sanitized textual source records or synthetic examples plus expected rows/totals, date-boundary and status cases, cross-branch allowed/denied results, export scope, and named owner approval. Do not archive private screenshots: PRD D-29:175,243 supersedes ROADMAP:111 archival suggestion. No live legacy access until independent enforcement, reviewed routes and explicit human authorization. No report is READY from labels alone.

## Candidate source mappings (REPO_VERIFIED fields; joins and semantics NOT approved)

Sources: prisma/schema/sales.prisma:115 Booking, :141 Transaction, :200 Manifest, :234 ManifestItem, :253 DeliverySheet, :269 DeliverySheetItem. Proposed mapping is documentation only and does not authorize new Prisma relations or query contracts.

| Catalogue reports | Available source candidates | Missing relations / semantics |
| --- | --- | --- |
| Detail Transaksi | Transaction.transactionDate/awbNo/doNo/senderName/receiverName/originBranchId/destinationBranchId/koli/kilo/volume/status; optional booking | Cabang/Tujuan meaning; tariff vs biaya; customer attribution; approved report grant/date/status filters |
| Manifest Outbound; Rekap Manifest | Manifest.manifestNo/manifestDate/branchId/type/transit1-5/status/vehicleId/courierId, items -> Transaction | No driver relation; destination IDs are scalars; approved joins, aggregation and costs absent |
| Pengantaran | DeliverySheet.sheetNo/deliveryDate/manifestId/deliveredById, item.outcome/deliveredAt/receivedBy/notes, Transaction receiver, Manifest courier/vehicle | Sheet generation absent; transaction address and dispatch timestamp absent; courier attribution/status buckets unapproved |
| Detail Transaction Inbound | Transaction joined through ManifestItem/Manifest | Inbound definition, manifest selection/date and duplication handling |
| AWB Tertunda; AWB Termanifest | Transaction identifiers/quantities and manifest membership | No piece-level AWB identifier or Transaction mode/service; pending/history definitions |
| Rekap Customer Bulanan | Booking.customerId -> Customer, optional Transaction.bookingId | Booking/customer optional, direct customer attribution unapproved; date and monetary totals unknown |
| Rekap Omset Harian; Rekap Transaksi; Rekap Transaksi Harian | Transaction date and operational quantities only | No transaction payment method/transport mode, cash/BB/BL/transfer definitions; recap equivalence unproven |
| Laporan Detail Kurir | Sheet/item -> Manifest/courier/Transaction; outcome/deliveredAt/receivedBy | Service/SLA/leadtime/accIn/classifications unapproved or absent |
| Harian Kurir | Courier reference only | Pickup/missed pickup event source absent |
| Manifest Vendor | Manifest/items operational quantities | No manifest-vendor mapping; seller/user identity and costing unapproved |
| Gross Profit / Manifest; Rekap Gross Profit | Operational manifest/transaction identifiers | No approved costs/revenue/recognition/formula; creator/driver/vehicle mapping incomplete |
| Laporan AR; Laporan AP | Guarded accounting drafts only | No operational invoice/payment models/queries; ageing, term allocation, balances and cutoffs unapproved |
| Pengiriman; Report Customer; Semua Status | Transaction dates/AWB/branch/receiver/status and optional booking/customer plus manifest membership | Mode/service/reference/instructions/billing relations absent or unapproved; status inclusion and attribution unknown |
| POD Kembali | Shared AWB/receiver/branch identifiers | POD-return event source absent; delivery outcome cannot establish POD-return behavior |

Current Transaction queries use origin OR destination scope (src/features/bookings/server/queries.ts:104); that is a current source fact, NOT approval for report branch attribution or totals. List defaults take=50 but accepts unchecked limit and lacks date/status/cursor filters. Existing pages supply action permission checks. Future report queries/exports require their own reviewed grants, independently authorized server entry points, validated bounded filters, scope and reconciliation; do not reuse operational queries as authorization for reports.

## Migration-first evidence ledger for LP-R01 through LP-R22

For EACH of the 22 stable parity IDs above, track these separate axes:

| Axis | Current recorded state | What changes it |
| --- | --- | --- |
| Direct legacy behavior coverage | UNVERIFIED/incomplete; no new LEGACY_VERIFIED observations in this continuation. N provides inherited labels only; P is REPO_VERIFIED preview metadata. Proposed meaning/mapping is INFERRED until corroborated. | Exact safe route/role/time plus actual filter/row/total/source behavior and permitted synthetic reconciliations, not approval signatures alone |
| Safe collection authorization | BLOCKED, human-controlled LEGACY-ACCESS-GATE NOT_VERIFIED, scope NONE | Independently reviewed comprehensive read-only protection/replica, route/privacy scope and explicit human authorization |
| Formal adoption approval | PENDING under unchanged PRD D-15 and related D-IDs; not a statement about whether the legacy report exists | Required domain-owner/stakeholder dated acceptance of an exact evidence-backed rule |
| Proposed parity acceptance | NOT YET BEHAVIOR-COMPLETE | Sufficient direct evidence and source mapping support the stated equality assertions; approval may still be pending separately |

Per-report verification uses DISC-04.md LP-REPORT-STRUCTURE, LP-REPORT-ROWS, LP-DATE-BOUNDARY, LP-TOTALS and LP-EXPORT cases. Each evidence entry must record parity ID, permitted route, date/time, role/branch context, gate/authorization reference, owner-prepared synthetic input/source case, exact observed output and limits. Capture fields/defaults first; safely verified actual filtering/search/paging and report membership next; monetary/counting/date formulas require reconciled source cases. Do not infer filter effects from controls, functioning export from a label, profit from a cost column or visibility from Administrator access.

For example, LP-R01 Detail Transaksi is currently REPO_VERIFIED for preview metadata and candidate Transaction fields only. Its actual legacy date basis, row membership, branch attribution, tariff/total meanings and export contract are UNVERIFIED. D-15/D-19 adoption approval is independently pending. Once safe observation verifies a bounded rule, propose an acceptance assertion against that recorded output; do not choose a new report design just to fill an evidence gap.

The 19 primary and four AR/AP supplemental local views remain synthetic; supplemental views belong to LP-R17 AR and LP-R18 AP, not four additional provider reports. Original labels/order retained. No new provider observation or calculation evidence has been obtained, and no report catalogue gap is declared resolved by this document update.
