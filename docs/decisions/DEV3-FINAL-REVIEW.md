# Dev3 final review queue

2026-11-15. Owner instruction: no Dev1/Dev2 pre-implementation approval gates.
Queue their code/source reviews for the final combined PR, opened only after agreed
Dev3 work finishes. No new PR now; no automatic merge/deploy. See
[standing policy](../agent-policies/DEV3-REVIEW-WORKFLOW.md).

## RPT-01A

RPT-01 DONE for owner-accepted v1; code723dce6 nine-column report locally verified. Extra parity/export RPT-03/RPT-04.
Dev1 documentation review5908964791 accepted with corrections; implemented ACTIVE
membership, admin null-null, restriction exemption and AWB50. Final Dev1 permission/
query code review and Dev2 field/date/status/source review are queued, not development
blockers or fabricated approvals. Formal named-owner record PARTIAL; explicit OptionA
selection persists. Staging/final release acceptance remain open. No repeated review ping.

## SUP-01 follow-ups from actual Dev1 review

Source: [PR10 review5908964791](https://github.com/code-craft-id/logistik-web/pull/10#pullrequestreview-5908964791).
SUP-01A local proof retained; SUP-01 DONE for owner-accepted v1; later features SUP-02/SUP-03. Owner requested no SUP return unless
a regression affects following work; queue these for final hardening/review, not silent
discarding or claiming fixed.

Required before merge per reviewer:

- Evaluate replacing ticket create exclusive organization advisory lock with shared lock;
  preserve hierarchy/grant concurrency safety and prove the reviewed scenario.
- Move ticket resource inventory after delivery.

Suggestions to triage together in the final pass:

- Branch FK index (review any additive migration separately).
- Branch/creator names, rows/count snapshot, duplicate action/service permission checks.
- Page login/denial and administrator reading another user's ticket tests.
- Exclude agent execution-plan instructions from final PR packaging while preserving
  durable checkpoint/task records. No history rewriting or deletion now.

Dev1 request for an immediate separate SUP PR is superseded by the owner's later
final-PR instruction. No new PR opened in response.

## Other carry-overs

Previously evidenced Dev2 manifest/delivery-item timestamp default drift and existing
dependency advisories remain technical final-hardening work. This report changes no
schema/dependency/lifecycle/financial posting rule. Full Dev3 completion is not implied:
unknown report/finance rules still need business evidence/decisions, not invention.

DEV3-HARD-01 now tracks this final review queue separately from the DONE v1 tickets. Required before-merge findings stay open. [Scope closure](DEV3-V1-CLOSURE.md).

## RPT-02 source-backed v1

DONE development/local verification at code9b76457: real manifest/DRS/item reports and raw dashboard counts. Final Dev1 report-permission/query code review and Dev2 source/date/intersection semantics review queued here, no development gate. Actual full/scoped agentQA and565unit/119DB/build/local responsive/security proof PASS. Source/cardinality/population for real vendor attribution is RPT-05, not implemented by the readiness page; OPS-03 generation and legacy aggregates remain separate.

Final hardening diagnostic: pg8.23 queued-client.query deprecation observed during integration/local use, no functional failure, isolated trace did not reproduce. Exact producer unproven; investigate adapter/driver compatibility with a reproducible case before any pg9 upgrade, no speculative dependency patch. Current pinned version and sequential report service calls retained. Staging/final human acceptance still required, no merge/deploy claim.
## 2026-11-15 HARD-01 required findings implemented
At7245649 shared ticket-create policy lock and resource order are implemented; independent QA PASS noP0-P2. Worker focused18units/10guardedDB/typecheck/Biome/diffcheck PASS reported, final lead gates to follow RPT03/04. Original review requirements above retained as provenance, now locally addressed, not final human merge approval. Shared lock still waits behind exclusive policy writer (including long imports); it removes creator-to-creator global serialization, not every possible five-second timeout.

## HARD-01 remaining review suggestions triage
Required shared lock/resource ordering locally addressed at7245649 and independent QA PASS. Shared lock still conflicts with exclusive writer; long imports can still hit existing5s timeout. No claim all import contention removed.

Rows/count snapshot is directly relevant now that independent ticket creations coexist: current list uses two independent queries via Promise.all; a committed insert between reads can make metadata disagree. After RPT03/04, reproduce with a real guarded external insert between rows/count, then minimal RepeatableRead list transaction with fresh actor/predicate inside same snapshot; retain current DTO, visible scope, idempotency and page bounds. Add page login/denied/admin-other-detail regression if missing while touching this bounded read path. One worker/QA, no lifecycle expansion. Source-based hypothesis until RED proves it.

Branch FK index is additive migration/performance suggestion without measured regression; no schema change in this patch, retain coordinator review note. Branch/creator display names are UX suggestion outside accepted v1, not needed for this scope. Action-level permission duplication is defensive and correct; do not remove merely to reduce lines. Agent plan packaging remains final combined PR concern, preserve durable scope/checkpoints and no history rewriting. Existing Dev2 timestamp drift/dependency advisories and unproven pg warning remain separate diagnostics; no speculative migration/dependency fix. Staging/human review remain separate release gates.

## 2026-11-15 SUP/RPT follow-up verification complete
Relevant required shared-lock/inventory corrections7245649 and actual ticket-list rows/count race8d25df1 implemented/local verified;7page regressions and admin-other-detail proof added. RPT03 sourced filters/sorting and RPT04 boundedCSV implemented; owner packet A closes SUP02/SUP03/RPT05 NOT NEEDED and unsupported5headers CLOSED WITH NOTES. Independent QA all slices PASS. Full659unit/127DB/lint382/typecheck/build69 at8d; final two-paragraph-copybe1 has5UI/Biome/QA/detector/build69 and native375/768/1440 proof, unchanged service/tests identity documented. [Exact evidence](evidence/dev3-sup-rpt-followups/verification.md).

Original required findings above are now locally addressed, not erased. Shared lock still conflicts with exclusive policy writers. Optional FK index/names, retained defensive permission checks, existing plan packaging and dependency/drift diagnostics are triaged in the durable follow-up scope. Staging, final Dev1/Dev2 combined review and human merge/release remain open. No new PR/merge/deploy.

## 2026-11-17 PR packaging cleanup (draft PR #11)

- "Exclude agent execution-plan instructions from final PR packaging": `docs/agent-prompts/` and `docs/superpowers/plans/` removed from the branch tip; they remain in Git history. Durable checkpoints (`docs/agent-state/dev3/`), policies and decisions are kept. Historical references to those paths in RUN_LOG/DISC-04 are left as history.
- Legacy origin hostname replaced by `<legacy-origin>` in `DEV3-LEGACY-PARITY-AUDIT.md`, `DEV3-LEGACY-NAVIGATION-INVENTORY.md` and `LEGACY-ACCESS-GATE.md`; page paths kept as report identities. Pre-existing screenshot names in `FND-03-iteration-2.md` (already on `main`) are outside this branch's scope.
- Em-dash mojibake (`â€”`) restored to `—` in `AGENTS.md` and the navigation inventory.
