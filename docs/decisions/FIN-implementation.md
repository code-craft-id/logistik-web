# FIN implementation and verification

Owner adopted A+B as written on 2026-11-15. This is target behavior, not provider
parity or release approval. One implementation agent; focused self-review.

## FIN-01 design / migration coordination packet

New domain records: FinInvoice, items, active source reservations, immutable
receipt/reversal events and actor-scoped FinCommand (atomic audit/idempotency).
Int keys and Restrict references preserve operational/customer/identity history;
new financial history is not soft-deleted. Invoice total/receipt amounts are
numeric(15,2), IDR only. No existing DRAFT accounting model is activated.
No external API: controlled Server Actions and feature-owned service/validation.
All writes acquire existing shared policy lock (71642,1), then finance lock
(71643,1); source rows are locked/revalidated, invoice revisions reject stale
edits/issue/void. Source reservation PK and line uniqueness enforce dedupe.
Finance lock deliberately serializes short writes across branches in this v1.

Migration 20261115090000_fin01_invoices is additive, no existing-row backfills or
defaults on existing tables. New status/positive money checks, snapshot and
receipt-update guards, uniqueness and branch/date index. Applied ONLY to guarded
loopback logistik_web_test. Forward-fix preferred; rollback removes new tables
only before any real finance data. Migration coordinator / human review required
before release or development/staging application. No applied migration edits.

## FIN-01 focused evidence

- Pinned Node 24.15.0 available; worktree npm ci installed lockfile dependencies.
  Initial host Node 26 warning recorded; subsequent guarded runner uses Node24.
- Typecheck: `npx tsc --noEmit --incremental false` PASS.
- `npx vitest run tests/unit/finance.test.ts`: 2 PASS (precision/overflow/date/
  duplicate-line inputs).
- Guarded `vitest run --config vitest.integration.config.mts
  tests/integration/finance.test.ts`: 4 PASS (reservation concurrency,
  edit/issue race, immutable snapshot, payment race/overpay/reversal/void,
  changed grants/membership and scoped replay). Temporary runner loads existing
  local env without printing secrets, then calls testDatabaseUrl before access.
- Changed-file Biome PASS after correcting semantic output and stable line keys.
- Initial database/migrate attempts failed because PostgreSQL was stopped.
  Started existing local cluster; migration deploy subsequently PASS.
- UI implemented; browser acceptance, FIN-02 integration and final full gates
  still pending. No FIN completion or staging acceptance claimed at this point.

## FIN-02 implementation / migration coordination packet

Adopted A+B is implemented in the finance module. New FinCategory/FinAccount
catalogue and append-only FinMapping versions deliberately do not activate the
older DRAFT Account/Ledger/AccountingBranch models. FinJournal/FinLine store
balanced source-linked postings with pinned classifications/mapping versions;
FinCost/FinCostState record actual costs and explicit completeness; FinClosedPeriod
locks accounting dates through the closed month. Receipt, issue/void, cost and
their journal entries commit atomically under the shared finance serialization
lock. Ordinary manual journals cannot bypass mapped control accounts or cash
workflows. Cash expense/transfer require both journal create and post authority.

Migration 20261115100000_fin02_accounting is additive. It refuses activation if
preexisting issued FIN-01 invoices/receipt history needs catch-up; this release
must apply both migrations before first financial use. No historical financial
rows are silently skipped/backfilled. Deferred database balance/reversal checks,
positive one-sided lines, unique source/reversal keys, posted-update guards and
closed-period checks complement transactional services. Applied only to guarded
test DB; coordinator/final human review still required elsewhere. Rollback only
while new financial tables are empty; otherwise forward-fix with audit intact.

Lifecycle exceptions: Invoice/Journal use explicit states and audited updates,
not soft deletion. Receipt/Command/Mapping/Cost/ClosedPeriod are immutable events
or versions. InvoiceItem/Line belong to their audited parent; Reservation is a
temporary unique join, retained in immutable issue snapshots/audit on release.
Reservation and CostState use the existing Int Transaction ID as primary key.
CostState is an audited completeness attestation, not deletable master data.
Only account/category catalogues have independent active and deletedAt fields;
deactivation does not mark deletion. SCH-01 tests name these narrow exceptions.

Reports are accounting-period movements, with exact Decimal arithmetic, branch
scope, maximum 366 days and 10000 posting lines (refuse overflow). Completeness
includes ever-issued sources, including voids, and never accepts another branch's
cost declaration. Missing costs suppress definitive GP and flag preliminary P&L.
Unknown cross-branch cost ownership is not transferred automatically. Chart
catalogues are bounded at 500 entries; finance writes intentionally serialize
globally in this v1. No tariff/event bus, inferred biaya cost, tax, vendor payment,
historical import, or unapproved operational-source ownership transfer added.

Focused self-review fixed: finance navigation rights/active path; landing-page
independent authorization; inactive-branch receipt creation; cash workflow rights;
deactivation versus deletion; voided-source and foreign-branch cost completeness;
immutable snapshot display; reversal audit display; actor/payload retry behavior;
Next.js page-level request boundaries following the existing ticket pattern.

Local browser evidence: real fake-data create/issue/partial receipt, refusal of
paid void, receipt reversal then void, actual cost and completeness, P&L/GP/recap.
24 loaded-route measurements cover eight routes at 375/768/1440 with no page
overflow or clipped controls. Keyboard arrow tabs retain mounted date fields;
keyboard table scroll moves 0→40px at 375. Final report captures show the
post-void supplier cost retained. Evidence is under evidence/finance/.

Production build PASS on Node24.15.0. Final full tests/lint/typecheck are being
collected after updating the frozen legacy inventory and explicit lifecycle
exceptions. Initial full DB tests were contaminated by the owned browser admin;
that fixture was removed before the final run. No existing test was weakened to
permit an extra administrator/account. Final results will be in the REL-01 handoff.

Schema validation PASS. Guarded DB→schema diff exits2 ONLY for preexisting
manifest_items.updated_at and delivery_sheet_items.updated_at default-now versus
no-default definitions. Existing migration 20261031000100 installs those defaults;
baseline sales schema omits them. Finance schema matches. Do not edit applied
migrations or Dev2 models to conceal this separate coordinator review item.
