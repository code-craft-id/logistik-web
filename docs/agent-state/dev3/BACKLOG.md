# Dev 3 backlog: not done, waiting for a decision, waiting for review

Updated 2026-11-20 (branch `dev3/ready-for-review`, PR #11, HEAD 8ebb283).
Source of each item: comparison with the provider app (read-only), the
earlier Go + React prototype and owner instructions in the Dev 3 session.
Keep this file current: move items to "Done" with the commit when finished.

## A. Not done yet, no decision needed (can be built)

| # | Item | Provider evidence | Notes |
|---|---|---|---|
| A1 | Export Excel on Status Pengantaran | `/shipment-status` has search / refresh / export | Same rows and filters as the page |
| A2 | Export Excel on Hitung Rugi Laba | `/rugi-laba` has Search / Export / Refresh | Same layout as the page |
| A3 | Perkiraan Export Excel, Template Import, Import Data | `/perkiraan` buttons | Import must validate like the account form (Induk loops, Kategori Rugi Laba only on revenue/expense) |
| A4 | Delivery Sheet list page: DRS No., Tanggal, Branch, Agent, Kurir, Tot. Koli / Kg / Volume, Status, Create DRS, Action | `/delivery-sheet` | Today DRS lives only on the manifest detail; Kurir/driver/nopol on DRS is part of this |
| A5 | Quick Action "Atur Menu" (per-user favourite menu) and "Refresh Quick Action" | Provider dashboard | Per-user setting; only links the user may open |
| A6 | Mobile check at 375px of all pages | AGENTS.md definition of done | Never done properly (window resize did not work in the browser tool) |
| A7 | Full menu-by-menu re-audit (Sistem Setting, Kantor, Master Data, Modul, Laporan) | Provider navigation | Only Quick Action and the hidden accounting pages were compared one by one in this session |
| A8 | Not yet checked: dashboard "AI Executive Summary", "Rekomendasi AI", "Notifikasi Pending" cards | Provider dashboard | Inspect first; AI content may be out of scope |
| A9 | Not yet checked: Tutorial System pages | Provider menu "Tutorial System" | We have the in-app help chat (`knowledge.ts`), not tutorial pages |
| A10 | Not yet checked: customer self-service portal (Report Customer Member: shipments, POD return, invoices, all status) | Digitalindo feature list, provider menu "Report Customer" | Staff-side customer reports exist; customer login not decided |

## B. Waiting for a business decision

| # | Item | Decision | What is needed |
|---|---|---|---|
| B1 | Pindah Manifest on the transit / inbound scan page | D-08 (re-manifest rules) | Whether a released AWB may join another manifest; needs Dev 2 to relax the unique ManifestItem rule with a migration |
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
