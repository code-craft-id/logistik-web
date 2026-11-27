# Finance decisions — current registry

2026-11-15. Owner explicitly answered **Adopt A+B as written** to the consolidated
FIN-02-contract.md question. Earlier proposal preparation was not approval; this
later answer adopts the bounded target. Current source: PRD and FIN contracts.

| ID | Status | Adopted subset / remaining scope |
|---|---|---|
| D-11 | PARTIAL | Manual final IDR billing, direct sources and explicit actual cost declarations adopted; broader tariff/tax/COD/vendor settlement rules remain TBD |
| D-12 | CONFIRMED (bounded) | FIN-01 P1–P5 lifecycle, receipts/reversals and reconciliation adopted |
| D-13 | CONFIRMED (bounded) | FIN-02 B account/mapping, balanced postings, actual costs, cashflow and period target adopted |
| D-14 | CONFIRMED (bounded) | FIN-02 B accounting dates, completeness and P&L/GP/recap reconciliation adopted |
| D-21 | PARTIAL | Explicit finance rights and same-actor issue/post/reverse/close without mandatory second approver adopted; wider operational approval policy TBD |

Both runtimes implemented and locally verified at7997505. Independent human,
migration and staging/UAT acceptance is still mandatory; not business re-adoption.
No source/event pipeline or DRAFT model grants authority. No historical financial
import or automatic cross-branch cost ownership transfer approved. Actual account
mappings and group rights must be explicitly configured before financial use.

Existing Dev2 updated_at default drift requires coordinator disposition. No
applied migration/model was changed to hide it. REL-01 is not release-approved;
no D-17 or broader business/security decision is promoted by local test results.

## 2026-11-15 13:45 UTC - Finance UI scope
Owner requested FIN-01/FIN-02 presentation polish. No D-ID status, adopted rule, source contract or release gate changed. No backend correctness defect identified in this scoped pass. Browser evidence is synthetic local UI only.

## 2026-11-15 13:58 UTC - Remaining Dev3 presentation scope
Owner requested same polish for remaining Dev3 tasks. Applied to implemented SUP-01/RPT-01/RPT-02 UI, including operational dashboard. No deferred behavior implemented, D-ID/status changed or business/source contract adopted. Existing release restrictions retained.

## 2026-11-16 01:29 UTC - Shared micro presentation
Owner authorized shared-component polish. Existing tokens/primitives retained; no D-ID, business/source contract or release status changed. Shared human review pending before merge.

### 2026-11-16 01:49:40 UTC - accounting navigation boundary
Technical fix only: page-local Suspense contains session-dependent AccountingHomePage during sibling navigation. No new business policy, caching of authority, schema or financial change. Existing business/release decisions unchanged.

## 2026-11-16 — comprehensive RPT migration continuation

D15/D19/D22: PARTIAL. Owner explicitly requests all22report identities plus actual export inspection; previous ROADMAP/NOT NEEDED acceptance retained historically. LP-R09 is now part of the comprehensive reporting objective without another inclusion-approval question; vendor capture/attribution remains BLOCKED_SOURCE. No business rule auto-confirmed. Source-ready quantity/branch-reference contracts implemented under this instruction; source/reconciliation limits and17actual inspected export identities are recorded in DEV3-LEGACY-PARITY-AUDIT.md section11. No VERIFIED_EQUIVALENT or exact migration established.

D11–14/D21: existing FIN A+B adoption unchanged. Legacy GP vendor allocations/trucking, cash/credit categories, invoice receipt/aging and supplier settlement are OBSERVED structures or unresolved rules, not newly approved postings. SUP omission decisions unchanged. Cross-domain code review timing remains final combined review; remaining source/business semantics, not developer availability, block19full report migrations.

## 2026-11-19 / 2026-11-20 — Owner decisions in the Dev 3 session
Recorded from chat; business owner approval, not Dev 2 / finance review.
- Bookings stand alone (not linked to AWBs); pickup flow WAITING / PROGRESS / CANCEL PICKUP.
- Required fields on Entry AWB and booking; automatic numbers shown at once, Manual AWB empties the input.
- SLA = Cek Ongkir Estimasi (largest number) vs AWB-to-receipt days: On Time / Late.
- Report AR: remaining balance in 0-21 / >21-30 / >30 day buckets by invoice age; KETENTUAN from customer Termin; Serah Terima Faktur on invoices.
- RETUR sets status Returned (D-09); resend allowed.
- Import status: codes 2 and 1 only.
- Accounting simplified: Induk instead of Ledger + Parent/Child; Posisi and Rugi Laba sign follow kind; Opening Balance as a balanced journal against equity.
- Dimensi (D-26) and koli scan (D-05) approved; Pindah Manifest waits for D-08.
- 2026-11-20: Asia/Jakarta approved for status-import date validation, invoice-handover future-date validation, and AP Aging month-end status cutoff. Broader D-19 timezone policy remains TBD.
- 2026-11-20: AP Aging includes all vendor bills open at the selected month end, with age calculated through month end; ownership scope follows explicit VendorBill.branchId.
- 2026-11-20: Server recalculates kilo, volume, per-piece chargeable weight, packing fee, and price from each koli's dimensions under D-26; Dev 2 review remains pending.
- 2026-11-21: Initial project-owner approval set Asia/Jakarta as the YYMM basis for automatic AWB numbers; Dev 2 agreed. Superseded later the same day by the system-wide timezone direction below, which also applies Jakarta to booking numbers. D-06 remains PARTIAL for other AWB numbering details.
- 2026-11-21: Project owner superseded the prior bounded timezone exceptions and approved Asia/Jakarta system-wide for business-date defaults, date periods/cutoffs, generated identifiers, and user-facing date/time rendering across modules and reports. UTC remains the timestamp persistence/transport representation; date-only values retain their calendar date. Booking numbering now follows Jakarta as well. D-19 is CONFIRMED globally; D-06 remains PARTIAL for non-timezone AWB numbering details.
Open items: BACKLOG.md.

## 2026-11-21 — Dashboard enhancement gates (DASH-01)

The project owner requested a dashboard comparison-driven enhancement. DASH-01
is limited to personal Quick Action selection among server-authorized links,
Asia/Jakarta month/year navigation, and exact links from raw status counts to
the existing scoped all-status AWB report. These are UI/navigation changes and
do not change metric meaning.

The owner selected “KPI tunggu definisi” when asked whether to derive new
financial/outcome metrics now. This explicitly leaves metric implementation
deferred until the required business definitions are supplied.

Revenue amount/payment breakdown/top-customer revenue and average value remain
blocked by D-11/D-15: Transaction has `biaya` but no modeled payment category,
and `biaya` is not approved as omzet. Shipment Success/Failed/Return/POD
outstanding remain blocked by D-07/D-09/D-15: no complete canonical grouping
or POD outstanding formula is approved. Existing statuses/pending metrics stay
as-is. No new business decision is inferred from the user's feature list.


## 2026-11-21 16:49 UTC — REL-01 Vercel Preview staging

- Technical target selected under the user’s Preview deployment authorization. Preserve the verified source backup and existing administrator; require Vercel Authentication when connecting imported identity data. Existing business decision statuses remain unchanged.

## 2026-11-26 — D-44 dashboard like the real web

- User: "kerjakan yang belum, dashboard juga boleh jadi lebih baik". Built the provider dashboard parts (Ringkasan Eksekutif, Rekomendasi, Notifikasi Penting, Analytics nominal, Top 5 Customer, POD Outstanding) with the OBSERVED rules recorded in PRD D-44. Finance confirmation of D-07/D-09/D-11/D-15 is still open.
- User confirmed Feature Update and List Tutorial stay dropped.

## 2026-11-26 — speed: proxy cookie check, per-request identity cache, list indexes

- User asked for a faster web and waived Dev1/Dev2 approval for this push ("SEKARANG TANPA HARUS IZIN DEV1 SAMA DEV2").
- `src/proxy.ts` now checks only session-cookie presence (`getSessionCookie`, no DB). Every page, Server Action and route handler still validates the session and rights itself; the workspace layout redirects a revoked/expired session to `/login`. Better Auth `cookieCache` stays disabled. Dev 1 should still look at this when convenient.
- `currentIdentity()` is wrapped in React `cache()` (one session + actor lookup per request instead of one per caller).
- `src/app/(dashboard)/loading.tsx` gives every workspace page instant navigation feedback.
- Migration `20261126000100_list_sort_indexes`: name / code indexes for paged master lists (regencies, districts, villages, postal_codes, vendors, customers, consignees). Index-only; rollback = DROP INDEX.

- User (2026-11-26): dashboard money figures are acceptable as long as they come from the database; D-44 accepted for release.

## 2026-11-27 — user requests while away

- Unique codes / numbers listed in RUN_LOG; deleted rows keep their value (existing convention, no partial indexes). Production migration stops before any change if duplicates exist.
- Akunting submenus live under /akunting; Master Data no longer lists Perkiraan.
- Menu simplification: proposal only, not applied without the user's approval.

## 2026-11-27 — open backlog items (owner: "keputusan ada di kita")

Owner delegated these to the team after the assistant proposed them. Not a finance or provider confirmation.

- Build: K3 export for Assets and Kasir (done locally); Assets template/import still to build. Kasir stays export only.
- Keep as built: B7 aging buckets, B8 opening balance journal (finance to confirm account and cut-off before production).
- Wait for evidence: B6 (provider export file with non-zero amounts and One Sheet).
- Defer: B2, B5, K1, N7, E1. Not doing: B3, B4.

## 2026-11-27 — AWB import and customer tariffs (provider templates pasted by the owner)

- AWB Template Import / Import Data on the outbound AWB list. Codes are LMS ids. Destination Code is an LMS branch (provider: kecamatan; B3 not doing). No tariff column in the file, so Grand Total stays empty. All rows are validated first; saving is one AWB at a time and reports failed rows.
- Customer tariffs: Tarif/Kg, Tarif/Koli, Trucking (`customer_tariffs`, migrations 000700 + 000800). "Unique" is the row key per kind: existing number = update. Import is all-or-nothing and branch scoped. Trucking `Service ID` = Trucking Type master; Kg and Koli use Delivery Service.
- Tariffs are reference data only. They are NOT applied to AWB pricing: how Tarif Pertama / Tarif Selanjutnya / MinKg compute is not observed (owner or finance to define).
- Customer Export / Template Import / Import (marketing, tab Customer): "Unique" is the customer id as in the provider note. Existing id = update (blank cells keep stored values); new id = create with that id and move the id sequence past it; more than 10000 above the last id is rejected. Address 2 is joined into the LMS address. Soft-deleted ids cannot be reused.

## 2026-11-27 — Penerima, Kendaraan, vendor price list (templates in local TEMPLATE/, never committed)

- Migration 000900 (additive): consignee district/village/postal code/fax/email; vehicle code/body type/brand/plate color/dimensions; `vendor_tariffs`.
- Penerima: "Unique" = consignee id, same rules as the customer file.
- Kendaraan: "Kode" is the key; Jenis ID = Trucking Type; Type and Merk stored as text (no LMS master; Type ID / Merk ID ignored). Name = Merk + No. Polisi.
- Vendor price list: Asal / Tujuan = LMS branches, Service = Delivery Service, flat price = Next Tarif only. Export follows "TARIF - <vendor>.xls". Not applied to vendor bills.
- New columns are import-only; the consignee and vehicle forms do not edit them (saving a form keeps them).
