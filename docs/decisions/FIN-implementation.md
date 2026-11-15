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
