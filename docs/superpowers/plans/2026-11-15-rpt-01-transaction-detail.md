# RPT-01A Transaction Detail Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** deliver the business-approved nine-column, non-financial transaction detail report under owner-authorized deferred final Dev1/Dev2 review.

**Architecture:** reports-owned read service, validated GET filters and DTO; Server Component page at the existing report route with accessible shared UI. Query current Transaction records with reviewed report permission and SQL scope, no operational writes, schema or public API changes.

**Tech Stack:** installed Next16.4.2, React19.3, TypeScript, Prisma7.10.1/PostgreSQL, Zod4, Tailwind4, Vitest; no new dependencies.

**Spec:** `docs/decisions/RPT-01-contract.md` (OptionA explicitly selected; formal named-owner record PARTIAL; Dev1 documentation corrections adopted; final Dev1/Dev2 code reviews deferred by owner).

## Global constraints

- One bounded end-to-end slice, one implementation writer; lead alone edits shared checkpoint/design/PRD/ROADMAP files.
- Owner explicitly authorizes implementation now; Dev1/Dev2 approvals consolidated in final combined Dev3 PR. Apply actual Dev1 documentation corrections; no repeated review requests.
- No new PR until all agreed Dev3 work finishes; push focused feature commits, no merge/deploy.
- No legacy/production DB operations, exports, finance, unsupported field inference or schema migration.
- SUP-01A remains implemented/local verified; full SUP PARTIAL, do not reopen its tests/approvals.
- UTC inclusive selected dates, maximum31days; pages1..1000,size1..100 default20, maxoffset99900, searchmax50.
- Branch options: nondeleted branches (inactive retained); ordinary currentACTIVEallowedIDs/adminall. Historical transactions retain referenced labels independently of option eligibility.
- Read installed Next page/searchParams/cache docs and confirm installed Prisma7 generated transaction types. Context7 latest returned v8 API, deliberately rejected; versioned official client docs linked in spec need installed7 confirmation.

## Review focus

- Revoked grants/memberships and forged filters must not leak rows, counts or options; test fresh reload and both denied paths.
- UTC end boundary and null/zero Decimal values must remain exact; test expected fixed source outputs, no numeric conversion.
- Duplicate AWBs/dates and concurrent source changes must not duplicate/skip within fixed dataset or mismatch one response count/rows; stable id and one RepeatableRead snapshot.
- Report grant alone must not grant transaction detail or mutation access; omit row links and explicitly project DTO.
- Nine-column table must remain usable at375/768/1440 with keyboard scroll/focus and initial/invalid/loading/empty/error states.

## Task1 — one complete report vertical slice

**Allowed worker writes under explicit owner timing exception:**
- Create `src/features/reports/transaction-details/{contracts.ts,server/service.ts,components/report-page.tsx}` and minimal local components only if needed.
- Replace `src/app/(dashboard)/branch-reports/transaction-details/page.tsx`; create route-local loading/error files if needed.
- Modify only report resource registration in `src/features/identity/permissions.ts`, exact route mapping in `src/components/shell/accessible-navigation.ts`, and operational footer classification for this exact route in `src/components/shell/app-shell.tsx` under accepted Dev1 documentation corrections. Preserve other preview routes.
- Create `tests/unit/transaction-detail-report-*.test.ts`, `tests/ui/transaction-detail-report.test.ts`, `tests/integration/transaction-detail-report.test.ts`.
- Worker also owns filters.ts + its tests for AWB50, and transaction_report permissionRestriction exemption. No worker edits to checkpoints, schema, dependencies, shared tokens/primitives, other source services or SUP files. Unexpected required paths go to lead first.

**Acceptance:** entire spec acceptance1–6, including genuine scoped denied paths, deterministic source-to-row reconciliation and exact bounds. No separate lifecycle approval required, no inference from test fixtures as legacy evidence.

- [x] Source/requirements investigations completed independently, no repeated legacy discovery.
- [x] One consolidated human decision received: OptionA D15/D19/D22 bounded adoption.
- [x] Independent packetQA PASS; page/branch technical clarifications incorporated.
- [x] Independent preparation: TDD pure `filters.ts` + `tests/unit/transaction-detail-report-filters.test.ts`, no DB/auth/route/DTO imports. Code64d9ea2;57tests/Biome2/typecheckPASS; independentfocusedQA PASS noP0/P1/P2. Lead owns all other paths until owner reviews arrive.
- [x] Actual Dev1 documentation review5908964791 accepted with corrections; implementation code approval remains for final PR.
- [x] Owner explicitly defers Dev2 source/code review to final PR; development uses inspected merged real source, no review signature fabricated.
- [x] Lead updated STATE paths/owner/acceptance and delegated rpt01_connected_implementation in the existing isolated branch/worktree.
- [x] Worker writes RED validation/service/UI tests; records commands and expected failures before minimal implementation.
- [x] Implement independent fresh auth, report permission, scoped option loader, strict query parser, shared scoped where, RepeatableRead rows/count, exact DTO.
- [x] Implement real report page/filter form/pagination and states; no dead exports/unsupported controls or detail links, deliberate internal table scroll, truthful operational footer.
- [x] GREEN focused tests including UTC/null/Decimal/duplicate/date/role/scope/pagination reconciliation.
- [x] Guarded local testDB integration with owned synthetic fixtures only: real query, grants/membership revocation, crossbranch denial, source-write consistency where practical; no migration/reset/seed of dev/prod.
- [x] Worker self-review and focused commit, returns actualSHA/results; lead immediately checkpoints.
- [x] Independent QA on actual diff/spec/security/tests, fixes only in scope using evidence and relevant official docs for API-specific failures.
- [x] Relevant lint/typecheck/unitUI/integration/build at final codeSHA. Avoid blind retries; prior SUP results are not transferred to RPT code. Record any untouched existing drift/advisories separately.
- [x] Local browser non-sensitive fake data proof at375/768/1440 and keyboard; staging/human release acceptance remains separate. Clean owned fixtures/processes/tabs.
- [x] Lead records verification/partial status/remaining parity, pushes branch, persists final checkpoint, confirms no newPR.

## Execution ledger

2026-11-15: baseline9b41f1f, mainc406502 verified ancestor. Branch created in existing isolated worktree, preserves completed SUP01A commits for eventual combined review. Design/business approved; independent packet review PASS. No runtime implementation or tests started while required owner reviews pending.

2026-11-15: independently executable pure filter preparation completed at64d9ea24e38a96338c8ba45ca64724f2e2399e74; RED55expectedfail/2initialpass -> GREEN57PASS; lint2/typecheckPASS; independent codeQA PASS. This unconnected module adds no report authorization/query/DTO/route. Human Dev1/Dev2 contract reviews remain pending; connected steps above deliberately unexecuted. [Evidence](../../decisions/evidence/rpt-01/verification.md).

## Owner override/preflight2026-11-15 (supersedes earlier pending-review stops)
Dev1 documentation review5908964791 accepted with corrections; owner consolidates Dev1/Dev2 code approval at finalDev3PR. Proceed same bounded vertical slice now; no newPR. Formal business approver record PARTIAL, explicit OptionA persists.
| Interface/task | Check | Resolution |
| --- | --- | --- |
| Task1 parser/service/UI | Old AWB100 vs reviewed50 | Worker updates parser/tests/UI consistently50 |
| Task1 identity/query/options | Inactivehistory vs ACTIVE actor | OrdinaryACTIVE membership, adminhistory/nullnull, existingOR preserved |
| Task1 inventory/restriction/navigation/footer | Same writer owns narrow mappings | Add report afterdelivery + restriction exemption; no SUP edits |
| Task1 tests/implementation | Old ownerreview stop vs latest instruction | Owner timing exception; final code/merge acceptance stillmandatory |
Connected implementation723dce6 complete19ownedfiles; worker70focused+7DB/lint19/typecheckPASS. IndependentfullRPTQA PASS noP0/P1/P2. Leadlint356/typecheck/55files544unitUI/13files111integration PASS at723dce6; guardedbuild andactualbrowserproof pending. Ownerreviewtimingruleportablein docs/agent-policies/DEV3-REVIEW-WORKFLOW.md; finalhumanreviewnotclaimed.

2026-11-15 final723dce6: fullleadlint356/typecheck/544unitUI/111DB/build68routesPASS. Nativebrowser375/768/1440 actualGET/scope/empty/invalid/paging/keyboard/NavEscapePASS, fakefixtures/tabs/server/helper cleaned. IndependentQA PASS nofindings. Finalartifactcommit/push/checkpoint next, no further runtimechanges or verificationloops. Finalhumanreview/staging deferred; fullRPTPARTIAL. AllfutureDev3 reviewtiming is finalPR only.
