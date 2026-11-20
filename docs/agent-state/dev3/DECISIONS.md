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
Open items: BACKLOG.md.

