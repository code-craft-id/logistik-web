# Dev3 SUP/RPT follow-up disposition

2026-11-15. Explicit project-owner response to the consolidated scope packet: **“A — Setujui paket scope minimum”**. This is task-local migration scope adoption; no named Dev1/Dev2 approval or global D-ID confirmation is invented. It supersedes broader backlog recommendations for the bounded scope below. Accepted DISC-04 DONE WITH NOTES and SUP-01/RPT-01/RPT-02 DONE v1 remain accepted.

## Final matrix

| Ticket | Legacy need / evidence | Actual gap | Owner disposition / delivery | Acceptance / evidence |
|---|---|---|---|---|
| SUP-02 | LD017–020: provider support list/detail/approval; current targeted detail readonly, approval empty | Transitions/assignment/comments/history/edit-delete rules not established | **NOT NEEDED** for current migration; provider helpdesk workflow omitted, not implemented | Owner packet A explicitly accepts omission; no global claim legacy lacks it |
| SUP-03 | File/picture controls LD018/020; category/AWB/customer not visible on inspected form | Storage/access/limits and adoption of generic FR07 extensions | **NOT NEEDED** for current migration; attachments omitted and category/AWB/customer extensions not adopted | Owner packet A; observed attachments still acknowledged, no fake implementation |
| RPT-03 | LD001/042 transaction headers/filter affordances; nine approved real sources | Five headers lack adopted transaction-grain mapping | **IMPLEMENTED + VERIFIED** separate origin/destination filters and nine-column sorting; Moda/Servis/Deskripsi/Komentar/Diterima Oleh **CLOSED WITH NOTES** | Current authorized options/scope, old URLs/defaults, all9sorts/Decimal/null/tie paging, invalid safe echo and real DB reconciliation |
| RPT-04 | Export affordance observed, no output downloaded | Target format/permission/cap needed explicit selection | **IMPLEMENTED + VERIFIED** UTF8 CSV for nine fields, max5000/overflow refusal, fresh view+export/currentscope | Full filtered/sorted data independent of page; formula/quote safety, private headers, actual local HTTP allowed/denied proof |
| RPT-05 | Vendor parameters observed; prior bounded vendor view did not prove mapping | No Manifest/Vehicle→Vendor attribution/capture source | **NOT NEEDED** for current migration; attribution/report NOT implemented | Owner packet A; guarded readiness remains unlinked, future actual need requires explicit capture/cardinality/source |
| DEV3-HARD-01 relevant runtime | Actual Dev1 review5908964791 + source-proven list race | Exclusive creator lock, inventory position, rows/count disagreement | **IMPLEMENTED + VERIFIED** shared creator lock/inventory order and consistent list snapshot/page regressions | Real concurrent creators/exclusive-writer revocations and actual insert-between-reads RED/GREEN; independent QA PASS |

Actual commands, SHAs, reviews, source proof, browser and cleanup: [verification](evidence/dev3-sup-rpt-followups/verification.md). Staging/final human review are separate; this is development/local verification, not merge or deployment acceptance.

## Evidence and choice

Accepted DISC-04/catalogue reused. On current authenticated Chrome Lab page1 at the approved legacy origin, lead inspected only ticket list -> explicit eye detail -> approval list. Readonly date/subject/menu/URL/remarks and file/picture controls were visible; no assignment/history/comment/transitions established and approval list empty. No business action/form/upload/download/export/JS/API, private record text or screenshot artifact retained. This is a bounded observation, not global absence. Protected-technical status remains NOT_VERIFIED; independently applicable direct grant was revalidated.

Actual Booking/Transaction sources lack mode/service/description fields; ShipmentBillingEvent remains a proposed type with nullable service/vendor and no runtime producer. DeliverySheetItem.receivedBy/notes already appear at DRS-item grain in RPT-02; they are not guessed into a single transaction row. Manifest/Vehicle has no vendor relation. New capture/joins/formulas were rejected as speculative scope expansion.

Recommended A, explicitly selected by owner: retain useful operational v1, omit provider helpdesk/file/vendor extensions for this migration, add sourced filters/sorting and bounded CSV. Alternative B retained all legacy workflow/file/vendor parity and would need actual rules/capture before dependent implementation. Closure is an owner-approved scope reduction, never a factual claim those features do not exist in legacy. Wider D-15/D-16/D-19/D-22/D-25 statuses outside this choice remain unchanged.

## Implemented technical contract

RPT-03 adds originBranchId/destinationBranchId, each canonical Int and present in current authorized options (administrator included). They intersect with AND and any legacy branchId origin-OR-destination filter; ordinary row scope remains current allowed origin OR destination. No authorization widening. All nine source fields can sort asc/desc with deterministic same-direction ID ties; default transactionDateDESC/idDESC and old URLs remain valid. Numeric Decimal ordering uses actual numeric data; nullable scalars sort nulls last, nullable branch relations retain PostgreSQL native placement. Operational endpoints reject all four transaction-only filter/sort parameters.

RPT-04 requires fresh registered transaction_report:view **and** transaction_report:export, no auto-grants; explicit administrator semantics unchanged. Export/read share current actor/options, validated UTC31-day/filter predicate, ordering, select and DTO in RepeatableRead. Export ignores pagination, takes5001 and rejects>5000 before serialization; empty is header-only. Nine fields only, CRLF/quoted cells/doubled quotes, protected untrusted formula/control prefixes and trusted exact numeric strings. Private no-store/nosniff/static attachment filename and generic errors; repeated query parameters remain arrays and are rejected. CSV is the approved target format, no legacy Excel-parity or universal save/reopen-safety claim.

Ticket creation shares the existing policy advisory key71642,1 while identity/organization writers remain exclusive. This removes creator-to-creator serialization while retaining post-lock fresh checks and uniqueness recovery. It still waits behind an exclusive writer and can hit the existing5s lock timeout. Ticket inventory follows delivery/report resources; grants unchanged. Ticket list fresh actor, rows and count now share one RepeatableRead snapshot, same DTO/order/pagination. No lifecycle change.

## Review suggestions and remaining gates

Required shared-lock/inventory findings and directly relevant rows/count race locally addressed. Missing page login/denied/admin-other-detail regressions added. Branch FK index is an additive migration/performance suggestion without measured regression; retain coordinator review rather than invent a migration. Branch/creator display names are optional UX outside accepted v1. Action-level permission checks are defensively correct, retained. No speculative pg/dependency upgrade or Dev2 timestamp-drift repair. Agent execution instructions from this session were removed from the final durable scope document; committed history and canonical RUN_LOG remain. Existing older plan packaging stays with final combined-PR review, no history rewrite.

No new PR until all agreed Dev3 work is complete; final Dev1/Dev2 review, staging and human release authority remain required before merge/deploy. Finance DRAFT models remain unavailable to runtime.

## Worktree preservation

Pre-cleanup audit: harness codex/dev3-observation-harness@6aaa8dd has four local commits beyond main, preserved by local ref and verified complete-history bundle. Contract-review@4bef2d6 is contained in the feature/remote stack. Both tracked trees clean; untracked/ignored .serena and harness .codex metadata copied and hash-compared before cleanup. Canonical inherited .gitignore/AGENTS/three policy/prisma seed changes excluded from commits and backed up as a patch. Backup root: C:/Users/Administrator/.codex/backups/dev3-sup-rpt-20261115. No branch remote deletion, reset, clean, force push or automatic merge. Final cleanup and FIN worktree/base are recorded in canonical STATE/HANDOFF/RUN_LOG.
