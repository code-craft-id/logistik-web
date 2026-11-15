# RPT-01A — non-financial transaction detail report

Status: **OPTION A BUSINESS APPROVED / AWAITING OWNER CONTRACT REVIEW**.
2026-11-15. Lead: Dev3. Baseline `9b41f1f6077d29060ceb1c20361359c9b2b832b6`,
including merged Dev2 source at `c40650299674faca3f4d5e6cb92a8675ac6c1ffc`.
Feature branch `feat/rpt-01-transaction-detail`; no new PR until agreed Dev3 work finishes.

## Decision packet — D-15, D-19, D-22

**Decision:** adopt a reduced, accurately sourced first transaction report and an explicit
date policy. This is RPT-01A, not full legacy parity or global D-15/D-19 confirmation.

**Evidence:** accepted DISC-04 / REPORT_CATALOGUE LD001 records fourteen headers;
LD042 confirms a period query and billing-labelled Paid/Unpaid/Invoiced/Uninvoiced
filter. Neither establishes source joins, timezone or ordinary-user report permissions.
Do not repeat discovery to infer those rules. Evidence is on the separate accepted,
unmerged discovery branch (`docs/agent-state/dev3/` in the canonical checkout).
Dev2's merged Transaction source provides the nine candidates below. Its old handoff
OPEN/CHANGES_REQUESTED wording is stale: PR9 is MERGED, verified 2026-11-15.

| Option | Scope | Trade-offs |
| --- | --- | --- |
| **A — Lead recommendation** | Nine sourced columns, selected UTC transaction-date period, restricted report permission and current operational branch scope; no financial amounts, aggregates or export | Useful real report now; expressly reduced parity; smallest maintenance and security surface |
| B | Same data and security, retain all fourteen headers with five explicitly unavailable columns | Closer visual inventory, but wide empty columns give little operational value |
| C | Defer report until Dev2 supplies reviewed sources for all fourteen columns and remaining filters | Closest eventual parity; delays usable existing operational data and needs additional domain work |

**Lead recommendation:** A. It preserves observed fields where real sources exist,
does not manufacture finance or delivery data, and keeps later additions isolated.
Date/source/access adoption below is a proposal, not proof of legacy semantics.

**Required authority:** project owner/migration coordinator approves this bounded
D-15/D-19/D-22 adoption once. Dev2 (`aetheris23`, verified PR9 author) reviews the
Transaction field/date/status/branch mapping. Dev1 (`Ardiputra614`) reviews the new
registered read permission and predicate. Agent QA cannot supply either human review.
No schema/migration or production operation is proposed.

**Execution after approval:** implement validated query + real report page, targeted
security/boundary/reconciliation tests, independent QA and quality gates; commit and
push this feature branch. No new PR, merge or deployment.

**Independent progress:** approved date/AWB/page validation can be implemented and tested
as an unconnected pure module without consuming Dev2 data or changing Dev1 contracts.
No query, permission registration, source DTO or report route is wired before required
reviews. This is preparation within the same vertical slice, not a second ticket.

## Proposed bounded contract

One row per `Transaction.id`, not per AWB text, booking, manifest item or shipment.
No grouping or deduplication of repeated/null AWBs. Exclude `Transaction.deletedAt != null`.
Include all stored current statuses, including Cancelled; display as stored, no history
reconstruction or invented status lifecycle/filter. This is a current-data report, not
an as-of ledger or immutable snapshot.

| Display column, preserving relative legacy order | Source | Representation |
| --- | --- | --- |
| AWB No. | `Transaction.awbNo` | Stored text; null unavailable |
| tanggal (UTC) | `Transaction.transactionDate` | Labelled ISO8601 UTC timestamp; not createdAt/deliveryDate |
| Asal | `originBranch.name` | Explicitly origin branch, not inferred geographic area |
| Tujuan | `destinationBranch.name` | Explicitly destination branch |
| Pengirim | `senderName` | Stored text, escaped |
| Penerima Barang | `receiverName` | Stored text, escaped |
| Koli | `koli` | Stored integer; null unavailable, not zero |
| Kilo | `kilo` | Decimal string preserving stored precision; no conversion or aggregate |
| Status Pengiriman | `status` | Stored current operational status; not billing status |

Missing-source follow-ups: Moda, Servis, Deskripsi, Komentar, Diterima Oleh.
Do not infer these from Booking, partial OPS-03, master-data dictionaries or preview.
No biaya, tariff, volume, revenue, profit, invoice/payment flags or financial totals.
Kilo is a source label, not approval that it means chargeable/actual kilograms.

Date selection: required valid `YYYY-MM-DD` start/end dates, inclusive calendar days
interpreted in UTC as `[start 00:00Z, day after end 00:00Z)`. Do not silently use server
or browser timezone. Show chosen range and UTC on output. No implicit default query:
initial page asks for period. Maximum 31 inclusive days is a Lead query-cost bound,
not a legacy rule; explain it in validation/UI. Reject invalid/reversed/oversized periods.

Filters: period, optional one allowed branch matching origin OR destination, and optional
AWB substring (max100 characters). This branch filter is deliberately reduced from
the legacy origin/destination controls. Billing/status/customer/payment/mode filters,
column sorting, Refresh/Ekspor affordances and exports are deferred; no dead controls.
Fixed ordering `transactionDate DESC, id DESC`; page size20, maximum100; integer page
1..1000 (maximum offset99900), no unbounded export query. Scope/count metadata describe transaction rows,
never financial or AWB aggregates. Nulls render an accessible unavailable marker.

Authorization proposal: registered **`transaction_report:view`**, no automatic ordinary
grants. Do not treat `transaction:view` alone as report authorization. Fresh server-side
identity/actor/permission check for each query, including pagination. Explicit
`system_admin:manage` uses existing registered-resource admin contract; others require
the report grant and a current allowed origin OR destination branch. No allowed branches
means empty scope; a supplied non-member branch is denied even when another endpoint
makes a record generally visible. Use exactly the same scoped/date/search predicate
for rows and count. No client actor, caller-prepared where clause or unguarded reuse of
`listTransactions`. Branch labels at the other endpoint are the existing transaction
read projection, not authority to browse unrelated records. No transaction detail links
because report access does not imply `transaction:view`.

Branch-filter options: nondeleted branches, including inactive branches for historical
queries; ordinary users see only their current allowed IDs, explicit admin sees all.
A supplied branch must exist in that option set. Deletion of a branch reference does
not remove otherwise-visible historical transaction rows from unfiltered results.

Create a reports-owned service/DTO, no new public API, operational mutation or shared
source-service edits. Select only needed fields plus internal id for stable row keys;
never serialize money, creator credentials, idempotency keys or extra relations.
Preserve historical branch references even if inactive; don't delete report rows merely
because a referenced branch is inactive. Membership enforcement follows the reviewed
current actor contract. Rows and count should use one PostgreSQL RepeatableRead snapshot;
each subsequent page is a new snapshot and may reflect legitimate source changes.

## Acceptance and review contract

1. Synthetic source cases reconcile exact row IDs/counts and nine projections: repeated
   AWB, null AWB/quantities/branches, stored zero, decimals, all stored statuses and
   soft-deleted transaction exclusion. No money or unsupported fields in DTO/markup.
2. UTC boundary cases: just before start, exact start, exact next-day cutoff, leap day,
   malformed/reversed/32-day periods; query does not depend on process timezone.
3. Anonymous/denied permission, transaction-only grant, empty branch scope, allowed
   origin/destination, denied other branch, explicit admin, and permission/membership
   revocation between requests. Same predicate for count and rows prevents count leaks.
4. Duplicate transaction dates across pages have stable id tie-breaker; AWB search,
   input bounds and empty/loading/error/invalid-input states work. Read-only queries
   do not create, update or delete operational records; concurrent source writes do not
   mismatch a single response's rows/count.
5. Real UI at375/768/1440 with keyboard-accessible internal table scrolling, labelled
   form, pending/empty/error states, UTC explanation and reduced-scope notice.
6. TDD and independent QA; relevant unit/UI and guarded test-DB integration, lint,
   typecheck/build. No tests or approval for completed SUP-01A repeated as a separate
   task. Full-suite execution, if required for RPT changes, is RPT regression coverage.

## Verification documentation

Pinned project Prisma is7.10.1. Context7 resolution `/prisma/web` returned newer API
material; do not copy its `db.orm`/`db.transaction` v8 calls. Versioned official Prisma
[sequential transaction docs](https://github.com/prisma/web/blob/v6/content/200-orm/200-prisma-client/100-queries/058-transactions.mdx)
describe `$transaction([...], { isolationLevel })`; compatibility confirmed against installed
7.10.1 generated `internal/class.ts:183` and `internal/prismaNamespace.ts:4726` (`RepeatableRead`). Installed Next16.4.2 `page.md` docs govern
route/searchParams/cache behavior. No verification run or test PASS is claimed by this
proposed design. SUP checks remain anchored to their earlier code SHA only.

## Approval record

- Business D-15/D-19/D-22 subset: **APPROVED OPTION A**, user/project owner/migration coordinator explicitly answered the consolidated request on2026-11-15: “A — Sembilan kolom bersumber nyata (rekomendasi)”. The full request included the nine fields, UTC/31-day dates, all stored statuses including Cancelled, deleted exclusion, filters and deferred features. Task-local explicit approval; no additional name/identity approval is requested or inferred. Global decisions remain open outside this subset.
- Dev2 source contract review: **PENDING**, [requested](https://github.com/code-craft-id/logistik-web/pull/9#issuecomment-6888823469) against caefd2c.
- Dev1 permission/scope review: **PENDING**, [requested](https://github.com/code-craft-id/logistik-web/pull/10#issuecomment-6888823788) against caefd2c.
- Independent packet QA: **PASS**, read-only qa_reviewer on2026-11-15, noP0/P1/P2.
  Two technical clarifications (exact page/offset bound and branch option sets) incorporated;
  this is not human approval. No runtime/tests were reviewed or executed.
- Pure filter preparation **IMPLEMENTED / VERIFIED** at64d9ea2:57focusedtests, lint2,
  typecheck and independent focusedQA PASS. [Actual checks/limits](evidence/rpt-01/verification.md).
  Connected report implementation/tests remain **NOT STARTED**, gated on mandatory owner reviews.
- SUP-01A remains IMPLEMENTED + LOCAL VERIFIED; full SUP-01 remains PARTIAL.
