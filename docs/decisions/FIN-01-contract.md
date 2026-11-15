# FIN-01A — proposed customer invoice and payment contract

**Status: ADOPTED — bounded P1–P5 target and reconciliation.** Project/finance owner explicitly answered “Adopt A+B as written” on 2026-11-15 to the consolidated FIN-02-contract.md adoption question. Runtime implementation is authorized within this scope; migration coordination and final human review remain required. Broader D-11/D-12/D-21 rules remain TBD.

2026-11-15. Owner selected “A — Kontrak target FIN-01” after the bounded legacy check. That selects preparation of this concrete target proposal; it does not approve the policies below. Required adopter: project/finance owner. Dev1/Dev2 code/source reviews remain queued for the final combined PR, not a pre-development availability gate.

## Why this target

[Actual legacy/source evidence](FIN-01-readiness.md): three ordinary invoice list paths (default/Paid/Outstanding) were empty in the inspected current context. No readable invoice/payment example established formulas, grouping or authority. Current Transaction.biaya persists operational input; its meaning/currency are not proven. OPS-04 is only a proposed type; financial schema models remain DRAFT. This proposal does not claim legacy parity or infer a customer charge from biaya.

Recommended approach: **explicit manual customer billing**, with actual transactions as traceable references and authorized finance actors declaring the final charge. This avoids inventing rate formulas or building a nonexistent event pipeline. It is a new target policy requiring adoption.

Alternatives considered:
- Adopt Transaction.biaya automatically as final receivable: less entry, but its financial meaning is unproven; reject unless actual source/business evidence establishes it.
- Implement the proposed billing-event producer first: still needs the same financial rules, adds event normalization/dedupe/transport; defer absent a real additional consumer.
- Defer FIN runtime until actual rules/examples exist: safest parity option, but no functioning billing increment. Still available if the proposed target is unsuitable.

## P1. Scope, customer and source ownership — proposed

One invoice belongs to one existing Branch and one existing Customer; it contains one or more explicitly selected Transaction references. Grouping is manual, not automatically by month/status/delivery. Multiple AWBs per invoice are allowed, with exactly one strictly positive charge line per distinct Transaction. Reject duplicate source IDs inside the same invoice and reject unlinked charge lines; one transaction may belong to at most one non-VOID invoice, including drafts. No splitting a transaction across invoices in v1. Voiding releases the active reservation but retains immutable issued references/history; reissue creates a new document/number.

Creation requires a current active allowed branch with valid office/company hierarchy. Each selected transaction must be nondeleted, have a nonblank AWB, and its **originBranchId must equal the invoice branch**. Destination membership alone does not authorize billing. Cancelled transactions cannot be newly issued; no other shipment status is interpreted as automatic billability. The issuing finance actor explicitly approves billability; source/lifecycle checks run again on issue. Shipment status changes are not implemented here and do not silently change an issued invoice.

The Customer must be nondeleted and have branchId equal to the invoice branch. Null/global/cross-branch customers cannot be billed by this v1 flow. The customer is explicitly selected for billing: if a referenced transaction's Booking already has a customerId, it must match; if that link is absent, the chosen customer is a new explicit association on this invoice, never inferred from names/addresses. No source Transaction/Booking customer field is silently rewritten. This is an intentional target restriction/choice, not an observed legacy rule.

Store source IDs and snapshot AWB, customer display name and branch identity on issue. Do not pull draft customer tax/accounting profiles or unrelated sender/receiver/contact data. Source edits afterward do not rewrite the issued snapshot.

## P2. Money and dates — proposed

Currency is **IDR only** for this increment. An authorized actor enters each line's final customer charge; it is **not copied from biaya** and no tariff/discount/tax/COD/vendor-cost formula is inferred. A line is the declared final amount; no separate tax/discount calculation, exchange rate, vendor payment or accounting recognition. If taxes must be itemized/calculated in LMS, this proposal must be revised before implementation.

Amounts use Decimal/numeric(15,2), strictly positive, maximum13integer digits and at most2fraction digits. Reject excess precision instead of silently rounding; normalize display to2fraction digits. Invoice total is the exact server sum of lines, with overflow rejected. Payment amounts use the same scale/currency. No JS floating point, client total or client payment-status authority. Sum/subtract at fixed2decimal inputs needs no extra rounding rule.

Invoice date, due date and received date are explicit valid calendar dates entered by the authorized actor; due date cannot precede invoice date. Audit timestamps are server UTC. No implicit recognition/cutoff/timezone, automatic term arithmetic or date-based tax rule. Broader D-19 remains open outside this date-only input/audit subset.

## P3. Invoice lifecycle and numbering — proposed

Lifecycle: **DRAFT → ISSUED → VOID**, or DRAFT → VOID. No reopen, hard delete, restore, silent posted edit or direct PAID lifecycle mutation.

Draft lines/customer/date can be corrected while still DRAFT, with actor/time change events and current scope/source validation. Issue requires a positive validated total, all source reservations and explicit invoice:issue authority. The same actor may create and issue: **no mandatory second approver in this v1**. This is the proposed D-21 decision, not a legacy inference.

On issue assign a unique immutable human reference `INV-{database invoice id}`; no annual/monthly reset or gapless promise. Drafts use internal IDs until issue. Existing provider numbering is not replicated. Issued money/customer/source/date/number are immutable. Corrections require reversal of payments as necessary, VOID with a required reason, then a new invoice. This increment is internal customer billing; tax-document generation and external document/print/export workflows are separate, not implied.

VOID of an issued invoice requires zero unreversed receipts, a reason and invoice:void authority. Preserve original amount/number/items/events; VOID is excluded from outstanding receivable totals without setting the stored original total to zero. All paid receipts must first be reversed. No credit note, refund, write-off or netting in this increment.

## P4. Receipts and correction — proposed

Record manual receipts only against an ISSUED invoice. Amount must be positive and no greater than its current outstanding balance. **Partial payment is allowed; overpayment and mixed currency are rejected.** Receipt method/reference/note are descriptive bounded text, not a bank integration or proof of external transfer. No cash/bank/wallet ledger posting or transfer is performed. A reference is not assumed to be a globally unique bank identifier.

Posted receipt events are immutable. A correction is a full compensating REVERSAL linked to one original receipt, with mandatory reason/actor/server time and payment:reverse authority. One receipt may be reversed once; no partial reversal or reversal-of-reversal. Enter a new receipt if needed. Original receipt amount/date/reference never silently change.

Derived payment display for ISSUED invoices: UNPAID when net receipts=0; PARTIAL when0<net receipts<invoice total; PAID when equal. Outstanding=invoice total−net receipts. These are derived, never directly submitted states. VOID displays VOID/outstanding0 while retaining original total/history. Source shipment status never selects payment status.

Network retries use idempotency per action/actor/payload: identical key/payload returns the same authorized result, changed payload conflicts; current permission/scope still applies on replay. This does not claim to identify a human entering the same external payment again with a new key. All draft updates (including amounts/customer/date/source selection), payments, reversals, issue/void and source reservations are serialized transactionally with database constraints. A draft edit acquires the same invoice serialization lock as issue/void, then atomically revalidates still-DRAFT status before applying changes; a racing edit must never alter an issued snapshot. Revalidate current authority/source constraints inside critical writes. Races must not cause overpayment, double reversal, duplicate charge lines/active invoicing or partial writes.

## P5. Permissions, branch reads and audit — proposed

Separate registered rights: invoice:view/create/update/issue/void and payment:view/create/reverse, with no automatic grants to ordinary groups. Names of groups confer no authority. Fresh active user/group/current allowed branches are checked independently at every server entry and inside critical writes; invoice/payment branch scope follows the invoice's owning branch. Current branch loss removes ordinary read/write/replay access; no automatic record transfer. Registered system_admin:manage retains the existing explicit administrator override; active hierarchy still required for new records. Historical inactive-branch records are administrator-only under the existing current-membership policy.

Issue/void/receipt/reversal do not require creator identity if the actor has the relevant right and branch scope; they record the actual actor. This deliberately allows authorized finance colleagues to act on an invoice, unlike creator-only SUP tickets. No separate dual-control approval stage in v1; adopting a four-eyes policy requires changing this proposal before code.

Every financial lifecycle/receipt/reversal event retains actor, server UTC, document/source reference and required reasons. No silent mutation/deletion of posted events, no credentials/PII in application logs. Master deactivation must preserve historical references. No DRAFT ledger/account/tax/customer-accounting model is read by this runtime. No FIN-02 posting/profit/revenue-recognition approval is implied.

## Synthetic reconciliation required by adoption

All values below are proposed IDR fixed-scale strings; no real customer data:

| Step | Invoice lifecycle | Original total | Net receipts | Outstanding | Derived display |
|---|---|---:|---:|---:|---|
| Draft2lines100000.00+50000.00 | DRAFT |150000.00|0.00|not receivable yet|DRAFT|
| Issue | ISSUED |150000.00|0.00|150000.00|UNPAID|
| ReceiptA100000.00 | ISSUED |150000.00|100000.00|50000.00|PARTIAL|
| ReceiptB50000.00 | ISSUED |150000.00|150000.00|0.00|PAID|
| ReverseB50000.00 | ISSUED |150000.00|100000.00|50000.00|PARTIAL|
| ReverseA100000.00 | ISSUED |150000.00|0.00|150000.00|UNPAID|
| Voidwithreason | VOID |150000.00|0.00|0.00|VOID|

Reject receipt60000.00 while only50000.00 outstanding; reject VOID while any unreversed receipt remains. Two racing receipts80000.00 against100000.00 outstanding cannot both succeed. Retried same-key issue/payment does not duplicate records. Two active invoices cannot reserve the same transaction, and one invoice cannot contain duplicate transaction IDs. A draft edit racing issue either commits while still DRAFT before issuance or is rejected afterward; it cannot mutate the issued snapshot. A reversal is an immutable compensating event, not an edit of the original receipt.

## Implementation boundary after actual adoption

Only after P1–P5 and reconciliation are explicitly adopted: document the approved D-11/D-12/D-21 subset in PRD, produce a minimal schema/API design for new Invoice/items/receipt-event/audit records with Int IDs, Decimal/currency and reviewed immutable-record lifecycle exceptions; no existing financial DRAFT runtime. Coordinate additive migration; no production DB action.

First bounded vertical slice: scoped draft create/list/detail + issue/void with source reservation, validation/audit/idempotency and real DB concurrency tests/UI375/768/1440. Then receipt/reversal as the next bounded slice under the same adopted policy. Do not implement a FE-only mock, event bus, tax engine, reconciliation import, bank transfer, vendor settlement, P&L, legacy-data import or export merely to finish FIN-01.

## Decision requested

Adopt this specific **manual-customer-billing v1 target** (P1–P5 and synthetic reconciliation), request concrete corrections, or defer runtime. Approving only “prepare a target contract” is not adoption. This remains PROPOSED until the actual project/finance owner answers; all unselected/global rules remain TBD. Independent agent review assesses safety/consistency only and cannot approve business policy or impersonate Dev1/Dev2.
