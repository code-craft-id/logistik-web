# Dev 3 backlog: not done, waiting for a decision, waiting for review

Updated 2026-11-24 (branch `dev3/ready-for-review`, HEAD `799e027`). Earlier update 2026-11-20.
Source of each item: comparison with the provider app (read-only), the
earlier Go + React prototype and owner instructions in the Dev 3 session.
Keep this file current: move items to "Done" with the commit when finished.

## A. Not done yet, no decision needed (can be built)

| # | Item | Provider evidence | Notes |
|---|---|---|---|
| A1 | ~~Export Excel on Status Pengantaran~~ DONE 2026-11-27 | `/shipment-status` has search / refresh / export | Same rows and filters as the page |
| A2 | ~~Export Excel on Hitung Rugi Laba~~ DONE 2026-11-27 | `/rugi-laba` has Search / Export / Refresh | Same layout as the page |
| A3 | ~~Perkiraan Export Excel, Template Import, Import Data~~ DONE 2026-11-27 (columns follow the LMS account form; sandbox template not re-observed, session expired) | `/perkiraan` buttons | Import must validate like the account form (Induk loops, Kategori Rugi Laba only on revenue/expense) |
| A4 | ~~Delivery Sheet list page~~ DONE locally 2026-11-23 (uncommitted): `/delivery-sheets` standalone DRS (Kurir Kota) with courier/driver/nopol/agent, Print DRS | `/delivery-sheet` | D-35; needs Dev 2 review |
| A5 | ~~Quick Action "Atur Menu"~~ DONE earlier (DASH-01 browser-local selection) | Provider dashboard | Per-user setting; only links the user may open |
| A6 | ~~Mobile check at 375px of all pages~~ DONE 2026-11-26 (iframe sweep, 0 overflow) | AGENTS.md definition of done | Never done properly (window resize did not work in the browser tool) |
| A7 | ~~Full menu-by-menu re-audit~~ DONE 2026-11-26 at menu level (page fields not compared one by one) | Provider navigation | Only Quick Action and the hidden accounting pages were compared one by one in this session |
| A8 | ~~Dashboard insight cards~~ DONE 2026-11-26 (D-44, rule-based, uncommitted) | Provider dashboard | Pengumuman not built (Feature Update dropped) |
| A9 | Not yet checked: Tutorial System pages | Provider menu "Tutorial System" | We have the in-app help chat (`knowledge.ts`), not tutorial pages |
| A10 | Not yet checked: customer self-service portal (Report Customer Member: shipments, POD return, invoices, all status) | Digitalindo feature list, provider menu "Report Customer" | Staff-side customer reports exist; customer login not decided |

## A2. Added 2026-11-23 (D-35, uncommitted, needs review)

| # | Item | Notes |
|---|---|---|
| N1 | Entry AWB COD / insurance / PIC / Lead Time / Show Price per AWB | Migration 20261123000100; fees join Grand Total (owner) |
| N2 | Standalone DRS (Kurir Kota) + Print DRS | Migration 20261123000200; manifest_id nullable |
| N3 | Proses Vendor | Migration 20261123000300; permission `vendor_process` |
| N4 | Ticket status + Persetujuan Tiketing | Migration 20261123000400; permission `ticket: manage` |
| N5 | Rekap Manifest + Excel, Laporan Detail Kurir | No schema change |
| N6 | Print AWB: provider 3-copy A4 layout, Harga / Non Harga | OBSERVED in provider and reference |
| N7 | Still TBD | COD List / Kas Terima, COD and insurance formulas, SLA / Acc. in in Detail Kurir, ticket rating |

## A3. Menu parity queue (added 2026-11-24, user: "lanjutkan semuanya")

Rule from the user (2026-11-24): follow the real web (redlogistik) first;
what the real web does not have follows the sandbox (newapps). Order below
is the agreed work order. Done so far: D-37 WhatsApp notifications
(`4a64dc2`), D-38 Akunting like the sandbox (`799e027`).

### Group 1: in the real web, missing or different in LMS (first)

| # | Item | Real web | LMS now |
|---|---|---|---|
| M1 | ~~Rekap Transaksi Harian~~ DONE 2026-11-24: `/branch-reports/rekap-transaksi-harian` + print | Laporan Cabang (`rekap-omzet-harian`) | Payment column mapping by name (CASH/TRF/KREDIT/COD) pending finance |
| M2 | ~~AWB Tertunda and AWB Termanifest as two menus~~ DONE 2026-11-24 | `awb-pending`, `awb-termanifest` | Combined into one "AWB" menu |
| M3 | ~~Report Customer~~ DONE 2026-11-24 `/report-customer` Excel (fields LMS stores; no manifest/invoice/closing columns) | Laporan (`report-customer`) | Missing |
| M4 | ~~Harian Kurir by pickup~~ DONE 2026-11-24 with D-39 courier pickup result (Nama Kurir, Jumlah Terambil, Jumlah Miss Pickup) | `daily-report-courier`, OBSERVED as courier 2026-11-24 | Counts deliveries, not pickups |
| M5 | ~~Tutorial System > List Tutorial~~ DROPPED by user | `list-tutorial` | Not in the main menu |
| M6 | ~~Sistem Seting > Feature Update~~ DROPPED by user | `news-update` | Missing. Page / Menu Management are provider admin tools; menu is code in LMS (propose not to copy) |
| M7 | ~~Master Data as one menu per item~~ CLOSED 2026-11-24: user keeps one page per group with tabs ("jadikan satu page halaman beda tab aja") | Leaf menus | Grouped pages with tabs |
| M8 | ~~"Umur Piutang per Customer" is LMS-only~~ KEEP (user 2026-11-24) | Not in real web or sandbox | Decide keep or hide |

### Group 2: not in the real web, in the sandbox (fill)

| # | Item | Sandbox |
|---|---|---|
| S1 | ~~Cod List, Kas Terima~~ DONE 2026-11-24 `/cod` (D-40) | Modul > Layanan Pelanggan > Transaksi |
| S2 | ~~Report Cod~~ DONE 2026-11-24 `/branch-reports/report-cod` | Laporan Cabang |
| S3 | ~~Transaksi Agent~~ DONE 2026-11-24 (D-41) `/agent-awb`, `/agent-deposit`, Manifest Agent = `/manifest?view=agent` | Modul |
| S4 | ~~Laporan Agen~~ DONE 2026-11-24 `/agent-reports` | Laporan |
| S5 | ~~Laporan Keuntungan~~ DONE 2026-11-24 `/financial-reports/profit` (D-42) | Laporan Keuangan |
| S6 | ~~Share Truck~~ DONE 2026-11-24 (D-43) `/share-truck/*`: Dashboard, Charter (Order Masuk, List Order Keluar), Status (Update, Cek), Invoice Keluar / Masuk, Ready Truck | New top menu |

### Group 3: Akunting details not yet like the sandbox

| # | Item | Notes |
|---|---|---|
| K1 | Asset depreciation journal posting | Rule TBD (which account debit / credit); now display only |
| K2 | ~~Lampiran on Kasir vouchers~~ DONE 2026-11-27 (images, max 5 per voucher, migration 20261126000200) | Cloudinary exists for POD photos |
| K3 | Import / Export Excel: Perkiraan done (A3); Assets / Kasir still open | Overlaps A1-A3 above |

### Also open from this session

| # | Item |
|---|---|
| W1 | WhatsApp: restart LMS dev server and gateway; first live send not yet tested (avoid real numbers) |
| W2 | Gateway repo `~/lms-wa-gateway` has no GitHub remote yet |
| W3 | Asset depreciation posting rule and Opening Balance policy need finance confirmation |

## B. Waiting for a business decision

| # | Item | Decision | What is needed |
|---|---|---|---|
| B1 | ~~Pindah Manifest~~ DONE 2026-11-27 (D-08 re-manifest, migration 20261127000200) | D-08 (re-manifest rules) | Whether a released AWB may join another manifest; needs Dev 2 to relax the unique ManifestItem rule with a migration |
| B2 | Customer-specific tariffs (Marketing customer price) | Pricing rules (finance / marketing) | Which price wins (customer vs Cek Ongkir route), validity dates |
| B3 | Area-based destination (province / city instead of branch) | D-27 | Which master the Tujuan uses and how tariffs map to it |
| B4 | "Operator Rugi Laba" field | Simplified by owner (sign follows account kind) | Only if the provider uses it for something else: needs an explanation from finance |
| B5 | Import status codes 003-012 (ENTRY DATA ... FAILED DELIVERY) | Journey states not in our status model | Only codes 2 (DITERIMA) and 1 (RETUR) are supported |
| B6 | Rekap Transaksi money columns and "One Sheet" layout | Sample export had zero amounts; One Sheet not observed | Check against a provider export with non-zero CASH / KREDIT / COD and a One Sheet file |
| B7 | Report AR aging basis | Owner approved: remaining balance by invoice age, buckets 0-21 / >21-30 / >30 | Finance confirmation still useful before release |
| B8 | Opening Balance counter account and date policy | Built as a balanced journal against an equity account | Finance to confirm which equity account and cut-off date |

## C. Built, waiting for review before merge

| # | Item | Reviewer | Reference |
|---|---|---|---|
| C1 | Returned status for RETUR (In Transit -> Returned, resend allowed) | Dev 2 (shipment lifecycle) | D-09, commit 8c8a8ab |
| C2 | Dimensi volume = P x L x T / Moda divider; Terberat = sum of per-koli max | Dev 2 | D-26 (DRAFT guard kept), commits 7f23bee, 701379b, 8ebb283 |
| C3 | Koli scan at transit / inbound (User Transit, Transit Date, Acc. In) | Dev 2 | D-05, commit f9575b7 |
| C4 | Standalone booking flow (WAITING / PROGRESS / CANCEL PICKUP, courier assignment, scan pickup, booking form like the provider) | Dev 2 | D-05 |
| C5 | Required fields on Entry AWB and booking | Dev 2 | Owner decision 2026-11-19 |
| C6 | Migrations 20261119000500 .. 20261119001000 (longer DO, booking pickup and form fields, invoice handover, account structure, manifest scans) | Migration coordinator | Each migration file states impact and rollback |
| C7 | Accounting structure (Induk, Kategori Rugi Laba, Cabang), Opening Balance, Hitung Rugi Laba, Laporan AP | Finance owner / human review | Simplified by owner decision 2026-11-19 |
| C8 | Existing drift: `manifest_items` / `delivery_sheet_items` `updated_at DROP DEFAULT` | Migration coordinator | Pre-existing Dev 2 drift, not changed |

## D. Release and environment

| # | Item | Owner |
|---|---|---|
| D1 | Staging environment and UAT | Team |
| D2 | Cloudinary env (`CLOUDINARY_*`) for proof photos | Server admin |
| D3 | Decide whether to enable `FEATURE_AWB_SCAN` | Owner |
| D4 | Fill real master data (Termin, Moda dividers, accounts, Cek Ongkir Estimasi) instead of FAKE seed rows | Admin |

## E. Deferred on owner request

| # | Item | Instruction |
|---|---|---|
| E1 | Courier points and courier withdraw (Progi "Tukar Poin" / "Withdraw Bank") | "yang poin kurir dan withdraw kurir jangan dulu" |

## F. PR #11 latest review (2026-11-20)

| Finding | Disposition |
|---|---|
| Approved AWB edit could change arbitrary fields after approval | Patched locally: request stores before/after proposal in existing JSON; approval UI shows it; only requester may apply exact approved values; stale AWB values fail; size/weight edits are refused because per-koli detail is not retained by the edit workflow. Needs feature-owner review and verification. |
| UTC “today” / date rendering vs WIB | RESOLVED by project-owner system-wide D-19 approval on 2026-11-21: business dates/defaults, period cutoffs, identifiers, and displayed date/times use Asia/Jakarta; UTC remains storage/transport for instants. Implementation is locally verified; follow-up parity review remains. |
| Vendor bill visible/closable across branches | Explicit owning branch is stored on each bill, checked at create/list/close, and backfilled only from unambiguous same-branch AWBs. Ambiguous legacy bills remain admin-only; migration and verification pending. |
| Client-supplied chargeable weight | Server recalculates from per-koli dimensions under owner approval (2026-11-20); Dev 2 / D-26 review pending. |
| Upload token does not bind outcome | Patched locally: outcome participates in the signed payload and must match when saving proof. |
| AWB code can be both AWB and koli label | Patched locally: ambiguous exact-AWB / parent-piece codes are refused in manifest and proof scans. |
| Import size checked after reading file | Patched locally: reject File.size before arrayBuffer; parser and action share one byte limit. |
| AP aging date/month scope | Owner approved all bills open at selected month end; age through month end, Asia/Jakarta cutoff, owning-branch scope. |
| Agent notes in PR | Retain required Dev3 checkpoint files and governance records per repo instructions. No cleanup or broad PR split performed in this fix. |

Verification status (2026-11-20 12:09 UTC): Prisma validate/generate PASS; test DB migration PASS; full unit suite 723/723 PASS before final narrow follow-up, then focused 23/23 PASS; focused integration 29/29 PASS after latest changes; lint 558 files PASS; typecheck PASS. Full and route-limited Webpack builds failed during compile after 126–140s with only generic webpack error output; Turbopack attempt was interrupted after prolonged no-output compile. Final diff/identity review and commit/push pending. Build blocker must be stated truthfully.
