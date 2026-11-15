# FIN-01 readiness and next bounded contract

**Current checkpoint, 2026-11-15:** owner explicitly adopted A+B as written.
FIN-01/FIN-02 implementation and local verification are complete at 7997505;
ticket acceptance remains PARTIAL pending mandatory human/migration/staging gates.
See [REL-01 handoff](../handoffs/DEV3-REL-01-finance.md). The sections below are
historical preparation/source evidence at the pre-implementation base, not current
runtime readiness. They do not revoke the later adoption or reopen DISC-04.

2026-11-15. SUP/RPT prerequisite work is reconciled and complete for the explicitly approved migration scope. [Current disposition](DEV3-SUP-RPT-FOLLOWUPS.md), [exact verification](evidence/dev3-sup-rpt-followups/verification.md). FIN worktree C:/Users/Administrator/.codex/worktrees/fin-01-ready/logistik-web, branch feat/fin-01-billing-contract, base a5b779cee0ff144a25d2f5e5ea4c4bdfdc658cb2 preserves all unmerged SUP/RPT. Main remains c406502. No merge/rebase to main, no new PR/deploy.

## Historical source facts (verified on the pre-implementation base)

- `src/features/bookings/billing-contract.ts` is the only src/tests reference to ShipmentBillingEvent/SHIPMENT_BILLABLE. It defines a proposed shape; no producer, validator, persistence, dedupe or consumer exists. The historical OPS-04 note named billing-events.ts; that documentation path is now corrected to actual billing-contract.ts without changing the proposed contract or runtime.
- Transaction provides operational identifiers, date, branches, stored current shipment status and nullable biaya Decimal(15,2). A numeric field does not prove customer receivable, final charge, currency, tax treatment or billability. Do not reinterpret shipment status as invoice/payment status.
- No Invoice or Payment model declaration exists in the current domain schema files. `src/features/accounting/preview/screens.ts` is presentation; accounting.prisma Ledger/Account/categories remain DRAFT under D-13/D-14, not runtime authorization.
- PRD D-11 (rates/discount/tax/COD/vendor costing), D-12 (invoice/payment lifecycle) and D-21 (approvals/approvers) remain TBD. FIN-01 explicitly depends on OPS-01/OPS-04/accepted DISC-04. DISC-04 closure is satisfied and is not reopened; actual finance/source gates remain.
- FIN-02 additionally requires D-13/D-14, no ledger/profit/recognition runtime now. The RPT minimum-scope choice does not adopt any finance rule or require vendor costing.

## Recommendation and alternatives

**Recommended next slice: a source-backed FIN-01 billing contract before any model/migration/runtime.** Resolve the smallest customer-invoice/payment subset with the project/finance owner and a reconciled synthetic example. Use existing operational records only after their amount/billability meaning is explicitly adopted. Document exact allowed actors/current owning-branch rule, money/currency/rounding, document cardinality and correction behavior. Do not introduce a generic billing engine or event infrastructure just because an unused type exists.

Two technical alternatives for that concrete approval packet:

1. **Direct transaction source (smallest implementation if adopted):** read existing Transaction records under an approved billing criterion; no dependency on a nonexistent event producer. Requires explicit approval to refine the older OPS-04 event expectation plus confirmed amount/branch/date/dedupe semantics. No automatic assumption that biaya is the invoice total.
2. **Implement the OPS-04 producer first:** requires the same billability/amount/source decisions, plus event transport, normalization, dedupe/retry and ownership. Appropriate only if another real consumer requires an event stream; larger scope. Current type alone is not a working contract.

This recommends technical simplicity, not a financial business policy. Dev1/Dev2 code review remains final combined-PR review under the standing owner override, not a pre-implementation availability gate. Actual business/security adoption is still required.

## One consolidated business packet still needed

The project/finance owner must adopt a concrete rule packet covering:
- Authoritative customer amount and currency, including whether stored Transaction.biaya is final; any included/excluded tax/discount/COD components and explicit rounding.
- What makes a record billable, invoice grouping/number/date and cancellation/correction handling; one source-to-invoice reconciliation.
- Payment application (including partial/duplicate/overpayment and reversal/correction behavior) and immutable provenance.
- Allowed actors/approval authority and owning-branch scope for invoice/payment writes and reads.

Request the real existing rule/example or prepare an explicitly proposed target policy for owner adoption; never silently select answers. Once the packet is approved, update applicable PRD decisions/contract, choose ONE bounded vertical slice and normal worker/QA/targeted verification. No draft financial model, formula, invoice or payment is implemented by this readiness note. No additional legacy discovery is repeated merely to rediscover already qualified empty/structural evidence.

## Status and handoff

FIN-01 source/decision preparation started; runtime **BLOCKED: decision required D-11/D-12/D-21**, plus a real approved billing-source contract. This is not a new Dev1/Dev2 gate or a generic DISC-04 blocker. FIN-02 is required and **BLOCKED: D-13/D-14**, not deferred or NOT NEEDED. The [consolidated adoption packet](FIN-02-contract.md) covers both tickets. No runtime/test/schema/package modifications in this worktree; no tests rerun for documentation-only changes. Current mission checkpoints live in this worktree's docs/agent-state/dev3; older canonical records remain historical context and are not overwritten.

## Owner-directed legacy follow-up in progress

Owner answered the initial finance-rule request: **“cek pada web legacy terlebih dahulu”**. Lead revalidated authenticated approved Chrome Lab page1 and assigned one bounded observer under canonical DIRECT_NON_MUTATING_DISCOVERY. Reuse accepted LD004/021/040/041/045; inspect only new safe invoice detail/items/payment/history paths, no business-form/workflow submit, export/download, credentials or arbitrary JS/API. No financial policy is adopted by this instruction. The user-rule request is superseded by this evidence check; do not repeat it before the result.

Additional repo fact on this exact source base: bookings/server/service.ts persists supplied nullable biaya (`data.biaya`/`rest.biaya`); scoped contracts/service/form searches found no currency/tax/discount derivation. It is a stored operational input, not proof of customer final charge. No code is changed by this source check.

Initial bounded live result reported by observer: current sales invoice list has0entries, hence no populated ordinary invoice/item/payment detail link in that inspected list. This is not global absence; distinct safe finance navigation/history candidates still being checked. Final sanitized evidence and any genuine remaining decision follow after that check.

## FIN-01 targeted legacy result —2026-11-15 07:29:02–07:30:38 UTC

One legacy_observer completed the owner-directed bounded gap check through current authenticated Chrome Lab page1 at the approved origin, applicable DIRECT_NON_MUTATING_DISCOVERY. Protected-technical NOT_VERIFIED unchanged; role/non-admin/branch parity outside this session unverified.

OBSERVED:
- /index.php/sales default invoice list explicitly0entries.
- Actual Dashboard Invoice Paid link opens /sales with status=paid and invoice_status=Closed in current dashboard November date context; list0entries.
- Actual Dashboard Invoice Outstanding/Unpaid link opens /sales with status=unpaid and invoice_status=Open in the same context; list0entries.
- Modul > Keuangan > Piutang Dagang exposes Invoice(New)->sales in that navigation branch. Search selector offers InvoiceNo/PeriodeDate; no query submitted without a specific record/period hypothesis.

Parameter strings prove visible link mapping only, not backend filtering, status semantics or completeness. No populated row/detail/item/payment/history link was available in those three inspected lists; no global data absence claimed. Accepted LD004/021/040/041/045 reused, no repeated AR/AP or random period scans. No businessform/workflow/status/payment/approval/generate/print/export/download/credentials/JS/API action, no files/private data archived.

UNVERIFIED: authoritative customer amount/currency/components, source grouping, invoice number/date rules, payment allocation/correction history, approval authority/posting rules. No rule has been confirmed by this observation and no dependent runtime becomes READY.

Next consolidated choice: (A) establish an explicit target FIN01 billing/payment contract with the project/finance owner and reconciled synthetic examples, then implement one approved slice; or (B) defer runtime until actual business definitions/example become available. Recommend A to advance without fabricating parity. Choosing that direction alone would NOT approve an amount/formula/state machine/permission; the concrete contract still needs actual adoption. No repeated request for the user to locate pages or a populated legacy period.

## Target-contract direction selected

Owner answered **“A — Kontrak target FIN-01”** to the bounded target-contract-vs-defer question. This authorizes a concrete proposal, not financial rules/runtime. The reviewable P1–P5 candidate and synthetic reconciliation are in [FIN-01-contract.md](FIN-01-contract.md), status PROPOSED. It uses manual declared final customer charges instead of asserting the meaning of Transaction.biaya, direct source references instead of a nonexistent event producer, explicit ownership and immutable receipt corrections. Independent consistency QA and one actual adoption/correction decision precede runtime.
