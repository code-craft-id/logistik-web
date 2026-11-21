# FIN-01 / FIN-02 consolidated adoption packet

2026-11-15. **ADOPTED A+B.** Project/finance owner explicitly answered
“Adopt A+B as written” to the consolidated question below. This approves the
bounded business target, not release. FIN-02 remains required. Implementation
and additive migration preparation are authorized; coordination, final human
review and staging gates remain. Wider D-ID rules remain TBD.

## Existing evidence and exact gate

- [FIN-01 P1–P5](FIN-01-contract.md) already defines the reviewed manual-billing
  target and reconciliation; owner adopted it as part A on 2026-11-15.
- [Readiness](FIN-01-readiness.md) records bounded empty invoice views and the
  absence of usable payment examples. Repeating those reads cannot establish
  recognition or costing policy. DISC-04 remains DONE WITH NOTES.
- [OPS-04](OPS-04-contract.md) is a proposed type without an event producer.
- PRD records bounded adoption: D-11/D-21 PARTIAL and D-12/D-13/D-14 CONFIRMED for this target only. The older accounting schema remains explicitly DRAFT;
  `Ledger` is an account grouping, not a journal/posting engine. Existing account
  fields and Customer/VendorAccounting references do not establish mappings.
- Transaction.biaya is not an approved customer charge or vendor cost.

## One adoption question — answered “Adopt A+B as written”

**Adopt A+B below as the bounded target, or specify corrections to A/B (including
any required approver, recognition trigger, or actual costing source)?**

Alternative: supply existing finance rules instead of adopting this target;
implementation of affected behavior waits for those rules. Choosing only a
direction or authorizing implementation generally does not select these policies.

### A. FIN-01 — D-11 / D-12 / D-21

Adopt all existing P1–P5 and its synthetic reconciliation: manually declared IDR
customer charges, two decimals with excess precision rejected, one branch and
customer per invoice, direct validated Transaction references reserved even in
drafts, immutable issue, reasoned void, partial receipts without overpayment,
full compensating reversals, separate rights/current branch scope, and no
mandatory second approver. No automatic grants to ordinary groups. This unlocks
invoice and receipt vertical slices without an OPS-04 pipeline or tariff engine.

### B. FIN-02 — D-13 / D-14 and bounded D-21 extension

Recommended target is **manual source-backed accrual accounting**, IDR only,
opening from zero for newly created LMS finance documents. No historical opening
balances/import, tax engine, inventory, payroll, or vendor settlement is implied.
If historical balances are required for launch, finance must supply a separately
approved balanced opening journal; reports must disclose their coverage start.

1. **Accounts and scope.** Global chart with unique codes, asset/liability/equity/
   revenue/expense classification and explicit normal balance; posting lines own
   an existing organization Branch, not the draft AccountingBranch surrogate.
   Finance configures accounts/categories and an explicit versioned mapping for
   receivable, shipment revenue, cash/bank, direct shipment expense, and accrued
   supplier liability. No inferred Customer/VendorAccounting mappings. Missing
   mappings block posting. Used classification/mappings remain historically
   pinned; deactivation/soft deletion cannot erase or reclassify posted history.
2. **Recognition and triggers.** Invoice issue posts Dr receivable / Cr shipment
   revenue on invoice date. Receipt posts Dr explicitly selected mapped cash/bank
   account / Cr receivable on received date; receipt is not new revenue. Void
   reverses the issue journal, after FIN-01 receipt reversals. Receipt reversal
   reverses its original journal. Once integrated, lifecycle event and journal
   commit atomically, with unique source-event posting identity and retry safety.
3. **Actual direct cost source.** Authorized finance explicitly records a cost
   declaration for an existing nondeleted Transaction in its origin branch,
   with actual amount, supplier/document reference, reason and accounting date.
   Positive costs post Dr direct shipment expense / Cr accrued supplier liability.
   A declaration may comprise multiple separately traceable costs. Finance must
   explicitly finalize cost completeness; a documented, explicit zero-cost
   declaration is allowed, never inferred from missing data. Missing/unfinalized
   costs display INCOMPLETE and suppress definitive profit totals. Costs are
   never copied from biaya. No supplier payment workflow is added. Invoice void
   does not cancel actual supplier liability: costs require their own justified
   compensating reversal. Correct finalized costs by reversal/replacement with
   immutable history and renewed completeness acknowledgement.
4. **Journal and corrections.** Draft manual journals require a bounded source
   document reference, branch, date and reason. Posting requires at least two
   lines, strictly positive one-sided amounts, equal exact Decimal debits/credits,
   compatible active accounts and current authority. Ordinary manual journals
   cannot bypass receivable, cash-control or source-linked shipment revenue/cost
   workflows. Posted entries cannot be edited/deleted. Full reversal references
   the original once; a correction uses a new entry. Balanced posting, source
   uniqueness, period checks and reversals are database-atomic and idempotent.
5. **Periods and dates.** Date-only accounting dates, UTC audit time, inclusive
   date filters; no implicit host/browser timezone. Monthly periods per branch,
   explicit close authority, no posting/backdating to closed periods and no
   reopen in v1. Close refuses incomplete issued-source costs and pending drafts.
   Corrections use an explicit open-period reversal date, preserving the original
   closed history. Reversal/void therefore adds an explicit accounting date to
   the P3/P4 action when FIN-02 is integrated. FIN-01-only events keep their
   original dates; activation must post all existing eligible events exactly once
   under approved mappings or refuse activation, never silently omit them.
6. **P&L and GP.** P&L = net posted revenue credits minus net posted expense
   debits, grouped by approved classification, branch and accounting date.
   Gross Profit = net source-linked shipment revenue minus net source-linked
   direct cost. GP Recap sums the same per-Transaction movement rows by branch
   and calendar month. This is accounting-period movement reporting, not an
   invoice-cohort margin: costs and invoice reversals may fall in different
   periods. Unbilled posted costs remain visible. Missing cost completeness for
   issued sources is explicit and prevents a final GP claim. P&L reports the
   ledger but also discloses incomplete costs and cannot claim finality. A bridge
   reconciles GP to P&L through other revenue/operating expenses; every subtotal
   links to journals and originating invoice/receipt/cost/manual document.
7. **Cashflow and authority.** Explicit operating/investing/financing categories
   on cash/bank movement lines; internal cash transfers excluded from net flow,
   accruals excluded until cash moves. Receipt reversals negate original flow.
   Separate account/category manage, journal view/create/post/reverse, cost
   create/finalize/reverse, period close, and financial-report view rights; no
   ordinary-group defaults. Current active identity/group/branch checks and the
   existing explicit administrator override apply at each server entry and
   critical write/replay. Same authorized actor may post/reverse/close without
   a second approver; adopting dual control requires a concrete correction here.

## Synthetic reconciliation to adopt with B

All amounts are fixed-scale IDR, same open branch/month unless stated otherwise.

| Event | Debit | Credit | Financial result |
|---|---|---|---|
| Issue two-source invoice | Receivable 150000.00 | Revenue 150000.00 | Revenue 150000.00 |
| Actual source costs 60000.00 + 30000.00, both finalized | Direct cost 90000.00 | Accrued liability 90000.00 | GP 60000.00 |
| Receipt 100000.00, operating category | Bank 100000.00 | Receivable 100000.00 | AR 50000.00; cashflow +100000.00; GP unchanged |
| Referenced office expense paid | Operating expense 10000.00 | Bank 10000.00 | P&L 50000.00; bridge GP 60000.00 - expense 10000.00 |
| Reverse receipt then void invoice | Reverse original receipt and issue journals | Equal opposite original lines | AR 0.00; source revenue 0.00; cost 90000.00 remains; GP -90000.00 |

The invoice lines allocate revenue 100000.00 and 50000.00 to their respective
Transactions; per-source GP is 40000.00 and 20000.00 before void, recap 60000.00.
If either cost is unknown/unfinalized, no definitive 60000.00 GP is returned.
After void, costs do not disappear; only an independently justified cost reversal
reduces liability/expense. A next-month reversal changes next-month movement
reports, not a closed prior-month report. All journals balance independently.

## Execution and remaining human gates

After actual adoption, record only the adopted subsets against D-IDs, preserving
broader TBD rules. Implement FIN-01 first, FIN-02 second, then REL-01 handoff.
Use source/service/auth/UI/test patterns already present, additive coordinated
migrations and guarded PostgreSQL concurrency tests; no DRAFT model activation
solely because it exists. Minimal schema design must preserve draft references
and immutable account classifications; no production DB operations.

Owner-directed execution exception for this mission: one implementation agent,
focused self-review, no orchestration skill, Superpowers, or delegation. It
changes execution strategy only. Human final review, migration coordination,
financial adoption, security, staging/UAT and release gates still apply.

Implementation and local verification of both FIN runtimes are complete at
7997505; see [REL-01 handoff](../handoffs/DEV3-REL-01-finance.md). Ticket acceptance
remains PARTIAL and release NOT READY pending human/migration review,
staging/UAT/backup-restore and disposition of existing Dev2 schema-default drift.
