Current ticket status: **SUP-01 DONE — owner-accepted v1 on2026-11-15**. Final review/hardening/release remain separate. [Closure and follow-ups](DEV3-V1-CLOSURE.md).

# SUP-01: bounded create, list and detail contract

Status: **bounded authorization/provenance contract accepted by Dev1; core implemented and locally verified**. Formal project-owner identity record remains PARTIAL; selected user scope/model direction is retained. Updated 2026-11-15. Dev3 owns the slice; Dev1 owns the shared authorization contract. Owner explicitly accepted SUP-01 as DONE for this v1 scope on2026-11-15; lifecycle/extensions are separate SUP-02/SUP-03, not unfinished SUP-01. See DEV3-V1-CLOSURE.md.

## Decision and approval record

| Decision | Approver / evidence | Current disposition |
| --- | --- | --- |
| Option A: create/list/detail of own-created tickets in currently allowed branches | Project owner, self-identified user in the current task; name/GitHub identity not supplied. On 2026-11-15 answered “A — Tiket sendiri dalam cabang yang diizinkan (rekomendasi)” to the consolidated scope request. | Direction accepted in the task. Formal PRD record **PARTIAL** pending named, traceable approval; this does not invent a different scope or require the user to choose A again. |
| One additive Ticket table and protected User/Branch relations | Same user, explicitly self-identified as migration coordinator; answered “Setuju usulan model dan migrasi additive tersebut” on 2026-11-15. | Model direction accepted; named formal approval record incomplete. No production migration execution authorized. |
| Dev1 permission/branch contract | [Ardiputra614 explicit contract confirmation, 2026-11-15 02:25:35 UTC](https://github.com/code-craft-id/logistik-web/pull/10#pullrequestreview-5908594183) | Accepted registered view/create, SQL scope, active hierarchy/admin, scope-loss replay denial and record actor/time provenance at 4bef2d6. Code/permission/predicate/tests still require review in the implementation PR; no merge/deploy authority. |

The owner confirmed being the approver when asked for identity, but supplied no name or handle. Use the reviewer's PARTIAL alternative; do not infer that the publishing GitHub account is the business approver. Recommendations, repository administrator rights and agent QA never substitute for owner approval.

## Scope and evidence

First increment: create, list and detail using observed subject, menu, related URL, remarks and explicit Low/Normal/High priority. Subject/Menu/URL are required in observed create UI; backend limits/defaults were not established. Internal database ID and labelled ISO8601 UTC creation display are bounded target differences in the selected scope, not claims about legacy numbering or timezone.

DISC-04 is owner-accepted **DONE WITH NOTES**. Its evidence files are on the separately published, **not yet merged** discovery branch, not paths available in main: [closure and LD017–020/036](https://github.com/code-craft-id/logistik-web/blob/4b26315749b593ba261cb825ceae2c2ba6171e9a/docs/agent-state/dev3/DISC-04.md), [catalogue](https://github.com/code-craft-id/logistik-web/blob/4b26315749b593ba261cb825ceae2c2ba6171e9a/docs/agent-state/dev3/REPORT_CATALOGUE.md). No discovery-branch PR is currently open. This is an unmerged documentation dependency, not a reopened discovery ticket. ROADMAP records both accepted closure and its publication status.

Relevant observations: ticket list has Date/No. Ticket/Judul/Link URL/Status/Approval/Approve By/Action; detail exposes readonly basic fields; priorities Low/Normal/High; a separate approval list exists. A bounded follow-up on 2026-11-15 inspected list, one ordinary readonly detail and the empty approval list: no visible creator, owning branch, history or permission oracle was established. Administrator observations cannot establish other users' access. No lifecycle or backend numbering/default is inferred.

Defer status/approval/approver values, edit/delete, assignment/resolve/reopen, comments/history, attachments/Picture and unobserved category/AWB/customer/assignee expansions. Full FR-07 remains; unsupported controls are omitted rather than assigned invented values. Only the administrator can read other users' tickets in this proposal; there is **no support-agent follow-up workflow** in this increment.

Alternatives already considered: branch-shared visibility increases collaboration and disclosure; read-only first needs a legitimate separate population source. Owner selected creator-only create/read, which provides local populated records with less disclosure and no legacy import. Those alternatives are not pending questions.

## Authorization contract explicitly accepted by Dev1

- Register ticket:view and ticket:create through the existing inventory; registration gives ordinary groups no grant. Grant assignment remains an authorized identity operation. Unknown resource/action must deny even administrator.
- Every create/list/detail entry loads a fresh active actor/group and authorizes independently. Creator comes only from the server. No client actor, number, timestamps, status or approval fields are accepted.
- Ordinary creation requires ticket:create and an existing active target branch within current allowed scope, with active/nondeleted office and nondeleted company. Explicit system_admin:manage creation also validates that target hierarchy; a positive integer branch ID alone is insufficient.
- Ordinary reads require ticket:view and one SQL predicate: nondeleted Ticket, createdById equals current actor, branchId is in current allowed memberships. Apply it to rows, count and direct lookup. No membership means no rows. Missing and inaccessible IDs return the same not-found result.
- Accepted explicit administrator read scope is all nondeleted tickets; administrator identity derives from system_admin:manage, never group name. Dev1 explicitly confirmed this and accepted record actor/server time as sufficient provenance for this increment; no separate audit event is required. Existing assigned-branch and administrator branch helpers are not interchangeable.
- **Branch-loss consequence:** when the owning branch leaves a creator's current scope, list/detail and same-token replay of that ticket are denied. Moving to another branch does not transfer the ticket. There is no reassignment, exception access or migration of ownership in this increment.

Source baseline: main commit c40650299674faca3f4d5e6cb92a8675ac6c1ffc. Reuse src/features/identity/permissions.ts (AccessActor, activeActor, permits, permitsBranch), server/context.ts (currentIdentity), server/access.ts (loadAccessActor/assertPermission) and the existing scoped query/error patterns. Identity's unexported audit helper is not a generic ticket-history API. src/app/(dashboard)/ticketting/page.tsx is synthetic only; its preview statuses/Medium priority are not domain contracts.

## Model and technical decisions

Proposed new model Ticket, mapped with established English/snake_case conventions; Int PK/FKs, restrictive User/Branch relations, no edits to applied migrations. Reverse-relation writes are explicitly coordinated with the schema owner.

| Field | Proposed storage / invariant |
| --- | --- |
| id | Generated Int; UI label internal ID, not legacy ticket number |
| branchId / createdById | Required Int references; server-derived creator and validated owning branch |
| subject / menuName | Required strings, trimmed nonblank, each at most 200 characters |
| relatedPageUrl | Required string, at most 2048; absolute http/https URL without credentials, or a single-slash origin-relative path. Reject javascript/data and other schemes, protocol-relative // paths, backslashes and control characters. Store/display escaped inert text; no fetch or automatic navigation. |
| remarks | Nullable string, empty normalized to null, at most 5000 characters, escaped display |
| priority | Required string; server allowlist Low/Normal/High and a named database CHECK enforcing the same three values. No Prisma enum or inferred default. Constraint is versioned in the eventual additive migration and tested directly. |
| idempotencyKey | Required validated UUID, bounded VarChar(64); unique together with createdById. Not a ticket number; never returned in public DTOs. |
| createdAt / updatedAt / deletedAt | Server timestamps; deletedAt nullable/unset. No update/delete/restore API. Label creation display ISO8601 UTC for this increment only. |

Index decisions: unique (createdById, idempotencyKey); (createdById, createdAt, id) for creator equality plus createdAt/id descending order across allowed branches; (createdAt, id) for administrator global ordering. branchId is a residual authorized filter for Option A, not the leading sort key. A branch-leading composite cannot serve the requested cross-branch global order without sorting. Final query plans and the minimal index set are verified on representative local test data during implementation.

A new table is additive; existing rows need no backfill. The eventual migration PR must show relation/index/CHECK impact, immutable old migration hashes and forward-fix strategy. No production operation or destructive rollback is authorized by this design.

Create/list/detail remain internal feature services under src/features/ticketing, with compatible /ticketting routes. Positive PostgreSQL Int IDs; page default 1/max 100000, page size default 20/max 100, trimmed search at most 100 characters; stable createdAt DESC, id DESC ordering. Search fields are subject/menuName only for the bounded slice. DTOs expose accepted fields and creation metadata, no auth/session or replay token.

After fresh create authorization and current branch validation, same creator/token plus identical canonical fields returns the original authorized record. Same token with changed canonical fields returns sanitized conflict. A database unique constraint plus a scoped reread resolves concurrent duplicates to one row. Revoked scope denies replay. Different tokens do not merge same-title tickets. Creation actor/time persist atomically; no generic comment/history subsystem is introduced.

## Acceptance and execution gate

Required tests after contract acceptance: active/denied/inactive actor/group/grant; unknown-resource admin denial; allowed/forged/inactive branch and creator; empty membership; SQL-scoped rows/count/direct ID; branch loss and denied replay; invalid IDs/query bounds/URL schemes/priority/lengths; database CHECK rejection; identical/mismatched/concurrent same-token submission; transactional failure without partial creation; populated create-to-list/detail; missing/deleted records; no private logs/token disclosure; keyboard/touch/loading/empty/error and 375/768/1440 UI.

Run TDD and targeted unit/UI tests, guarded local logistik_web_test integration tests, lint/typecheck/build, additive migration/schema review and responsive proof. Document provider comparison and eventual staging. None of these app/migration gates has been run for this documentation PR.

Execution: the user directs completion of the selected bounded scope, the additive model direction is retained, and Dev1 explicitly accepted the revised authorization/provenance contract on 2026-11-15. One isolated end-to-end worker implemented create/list/detail with TDD; independent code review and scoped lead-fix review passed. Runtime code commit5575d12 is locally verified; [actual verification results](evidence/sup-01-core/verification.md) distinguish passed checks from preexisting migration drift and release gates. Full D16/lifecycle and the named owner-record remain PARTIAL; do not promote unrelated rules or repeat answered scope/model questions. Implementation permission/predicate/tests and migrations still receive actual owner PR review before human merge; no automatic merge/deploy.

Publication constraint: the user instructs no new PR until all agreed Dev3 work is finished. Save this increment on feat/sup-01-core; do not open a per-slice PR, merge PR10 or infer final human/staging acceptance. Full later SUP-01 lifecycle remains deferred.
