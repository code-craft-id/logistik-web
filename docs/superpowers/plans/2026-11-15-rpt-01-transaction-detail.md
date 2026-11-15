# RPT-01A Transaction Detail Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** deliver the business-approved nine-column, non-financial transaction detail report after mandatory Dev1/Dev2 contract review.

**Architecture:** reports-owned read service, validated GET filters and DTO; Server Component page at the existing report route with accessible shared UI. Query current Transaction records with reviewed report permission and SQL scope, no operational writes, schema or public API changes.

**Tech Stack:** installed Next16.4.2, React19.3, TypeScript, Prisma7.10.1/PostgreSQL, Zod4, Tailwind4, Vitest; no new dependencies.

**Spec:** `docs/decisions/RPT-01-contract.md` (OptionA approved by owner; Dev1/Dev2 reviews PENDING).

## Global constraints

- One bounded end-to-end slice, one implementation writer; lead alone edits shared checkpoint/design/PRD/ROADMAP files.
- No query/permission/DTO/route implementation before actual human Dev1 report-permission/scope and Dev2 source reviews. Independent pure filter validation may proceed under approved OptionA without touching those contracts. Agent review is not their approval.
- No new PR until all agreed Dev3 work finishes; push focused feature commits, no merge/deploy.
- No legacy/production DB operations, exports, finance, unsupported field inference or schema migration.
- SUP-01A remains implemented/local verified; full SUP PARTIAL, do not reopen its tests/approvals.
- UTC inclusive selected dates, maximum31days; pages1..1000,size1..100 default20, maxoffset99900, searchmax100.
- Branch options: nondeleted branches (inactive retained); ordinary currentallowedIDs/adminall. Historical transactions retain referenced labels independently of option eligibility.
- Read installed Next page/searchParams/cache docs and confirm installed Prisma7 generated transaction types. Context7 latest returned v8 API, deliberately rejected; versioned official client docs linked in spec need installed7 confirmation.

## Review focus

- Revoked grants/memberships and forged filters must not leak rows, counts or options; test fresh reload and both denied paths.
- UTC end boundary and null/zero Decimal values must remain exact; test expected fixed source outputs, no numeric conversion.
- Duplicate AWBs/dates and concurrent source changes must not duplicate/skip within fixed dataset or mismatch one response count/rows; stable id and one RepeatableRead snapshot.
- Report grant alone must not grant transaction detail or mutation access; omit row links and explicitly project DTO.
- Nine-column table must remain usable at375/768/1440 with keyboard scroll/focus and initial/invalid/loading/empty/error states.

## Task1 — one complete report vertical slice

**Allowed worker writes after approvals:**
- Create `src/features/reports/transaction-details/{contracts.ts,server/service.ts,components/report-page.tsx}` and minimal local components only if needed.
- Replace `src/app/(dashboard)/branch-reports/transaction-details/page.tsx`; create route-local loading/error files if needed.
- Modify only report resource registration in `src/features/identity/permissions.ts`, exact route mapping in `src/components/shell/accessible-navigation.ts`, and operational footer classification for this exact route in `src/components/shell/app-shell.tsx` after Dev1 review. Preserve other preview routes.
- Create `tests/unit/transaction-detail-report-*.test.ts`, `tests/ui/transaction-detail-report.test.ts`, `tests/integration/transaction-detail-report.test.ts`.
- No worker edits to checkpoints, schema, dependencies, shared tokens/primitives, other source services or SUP files. Unexpected required paths go to lead first.

**Acceptance:** entire spec acceptance1–6, including genuine scoped denied paths, deterministic source-to-row reconciliation and exact bounds. No separate lifecycle approval required, no inference from test fixtures as legacy evidence.

- [x] Source/requirements investigations completed independently, no repeated legacy discovery.
- [x] One consolidated human decision received: OptionA D15/D19/D22 bounded adoption.
- [x] Independent packetQA PASS; page/branch technical clarifications incorporated.
- [x] Independent preparation: TDD pure `filters.ts` + `tests/unit/transaction-detail-report-filters.test.ts`, no DB/auth/route/DTO imports. Code64d9ea2;57tests/Biome2/typecheckPASS; independentfocusedQA PASS noP0/P1/P2. Lead owns all other paths until owner reviews arrive.
- [ ] Actual Dev1 report inventory/navigation/scope review recorded with URL/SHA.
- [ ] Actual Dev2 nine-field/date/currentstatus/branch mapping review recorded with URL/SHA.
- [ ] Lead updates STATE allowed paths/owner/acceptance and delegates implementation_worker in this isolated branch/worktree.
- [ ] Worker writes RED validation/service/UI tests; records commands and expected failures before minimal implementation.
- [ ] Implement independent fresh auth, report permission, scoped option loader, strict query parser, shared scoped where, RepeatableRead rows/count, exact DTO.
- [ ] Implement real report page/filter form/pagination and states; no dead exports/unsupported controls or detail links, deliberate internal table scroll, truthful operational footer.
- [ ] GREEN focused tests including UTC/null/Decimal/duplicate/date/role/scope/pagination reconciliation.
- [ ] Guarded local testDB integration with owned synthetic fixtures only: real query, grants/membership revocation, crossbranch denial, source-write consistency where practical; no migration/reset/seed of dev/prod.
- [ ] Worker self-review and focused commit, returns actualSHA/results; lead immediately checkpoints.
- [ ] Independent QA on actual diff/spec/security/tests, fixes only in scope using evidence and relevant official docs for API-specific failures.
- [ ] Relevant lint/typecheck/unitUI/integration/build at final codeSHA. Avoid blind retries; prior SUP results are not transferred to RPT code. Record any untouched existing drift/advisories separately.
- [ ] Local browser non-sensitive fake data proof at375/768/1440 and keyboard; staging/human release acceptance remains separate. Clean owned fixtures/processes/tabs.
- [ ] Lead records verification/partial status/remaining parity, pushes branch, persists final checkpoint, confirms no newPR.

## Execution ledger

2026-11-15: baseline9b41f1f, mainc406502 verified ancestor. Branch created in existing isolated worktree, preserves completed SUP01A commits for eventual combined review. Design/business approved; independent packet review PASS. No runtime implementation or tests started while required owner reviews pending.

2026-11-15: independently executable pure filter preparation completed at64d9ea24e38a96338c8ba45ca64724f2e2399e74; RED55expectedfail/2initialpass -> GREEN57PASS; lint2/typecheckPASS; independent codeQA PASS. This unconnected module adds no report authorization/query/DTO/route. Human Dev1/Dev2 contract reviews remain pending; connected steps above deliberately unexecuted. [Evidence](../../decisions/evidence/rpt-01/verification.md).
