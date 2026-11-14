# SUP-01: legacy-parity contract preparation

Status: **DRAFT / ACTIVE technical preparation**,2026-11-15. Owner Dev3; required reviewers Dev1 identity/branch/permission owner and relevant support/domain owner. DISC04 dependency is satisfied (DONE WITH NOTES); this draft does not approve runtime CRUD/lifecycle, create a schema/model or change a shared contract.

## Evidence-backed target

Sources: docs/agent-state/dev3/DISC-04.md LD017–020/036 and accepted closure; REPORT_CATALOGUE.md regression proposals; docs/PRD.md FR07/D16; docs/ROADMAP.md SUP01. Migrate the observed legacy support structure rather than invent generic ticket behavior. FR07 category/AWB/customer/assignee/history expansions remain a recorded scope conflict for domain review, not silently removed from PRD.

| Proposed field/view contract | Provenance / limits |
| --- | --- |
| created/display date; subject; menuName; relatedPageUrl; remarks | Observed create/detail fields. Date readonly; Subject/Menu/URL required in create UI. Server date generation/TZ/length rules not established. English names are proposed target names, not asserted legacy storage. |
| priority labels Low / Normal / High | LD036; actual default requiredness/backend enum not established. Current synthetic preview uses Medium; record as parity discrepancy, not approved domain enum. |
| attachment affordance; Picture reference + Detail | Observed only. File types/size/storage/access/malware/privacy and Picture semantics unknown. No arbitrary external URL fetch, file opening or upload implementation implied. |
| list columns Date / No. Ticket / Judul / Link URL / Status / Approval / Approve By / Action | LD017. Numbering algorithm and status/approval relations unknown. |
| detail shows readonly date/subject/menu/URL/remarks, priority Normal on observed record | LD020; readonly UI is not proof backend immutability or actor permissions. |
| separate approval list Judul / Nama Menu / Link URL / Action | LD019; actor, sequence, thresholds and outcomes unverified. Do not implement approval mutation from this affordance. |

## Technical review proposal (not activated)

- Keep existing route /ticketting for compatibility until route review; feature folder src/features/ticketing. src/app/(dashboard)/ticketting/page.tsx currently renders synthetic preview. Do not link an unfinished runtime destination or consume financial DRAFT models.
- Proposed standalone domain schema ownership: prisma/schema/ticketing.prisma, reviewed through migration coordinator. Domain keys Int; actor identity keys must match Better Auth schema. No model/column/migration is created by this note. Required branch ownership/visibility must be agreed before schema finalization; never infer global scope from an Administrator screen.
- Proposed permission resource ticket, actions view/create/update; defer action inventory delete/assign/resolve/reopen/approve until actual supported operations are agreed. src/features/identity/permissions.ts currently has no ticket workflow grant; unknown resources deny, so registering inventory and Dev1 review precede runtime exposure. Resource names/actions are proposals only.
- Follow independently authenticated/authorized entry points and allowed-branch checks; client branch IDs never grant access. Existing identity system_admin:manage and active actor/group contract apply; no legacy insecure permission copying.
- Proposed list/detail service boundaries stay inside src/features/ticketing/server with server-validated bounded pagination/search. No direct legacy calls, sensitive data import or financial source dependency. URL fields are inert validated text until link/privacy policy approved; no server fetch to arbitrary URLs.

## Bounded next slice and entry conditions

First candidate: authenticated/authorized branch-scoped ticket list and detail with observed columns, plus explicit empty/error/loading states. This can be reviewed separately from create/approval/lifecycle. It requires an approved bounded D-16 read contract, minimal model, branch/record visibility and read grant, safe presentation rules, and an agreed data-population path; a permanently empty synthetic list is not a completed runtime slice. Do not fabricate fixtures as real migrated records or call a preview operational.

The complete assignment/resolution/reopen transition matrix is not an entry condition for this independently approved read slice. Unknown displayed status/approval fields still need a read meaning/source, or an explicit bounded deferral. Then create/priority/attachment and lifecycle slices only after their exact D16 scope/rules are accepted. No initial status, approval state, assignment, resolved/reopened transition, automatic ticket number or deletion policy is chosen here. Finance notes do not block this ticket; its own unresolved rules do.

Proposed regression acceptance, NOT IMPLEMENTED/RUN: unauthenticated/denied grant/unauthorized branch/soft-deleted source cases; bounded invalid pagination/search; missing-record denial; observed field/column parity and Low/Normal/High labels; URL/file handling denial cases after their policy exists; responsive375/768/1440 and keyboard/loading/empty/error states. Add transaction/history/concurrency cases only to approved mutations. Required lint/typecheck/targeted tests/build and independent QA apply at implementation, not as DISC04 closure gates.

## Review checklist / exact next action

1. Dev1 reviews proposed ticket grants and branch/record visibility contract.
2. Domain owner resolves legacy-versus-FR07 scope and confirms bounded list/detail field definitions; lifecycle questions remain with their later mutations.
3. Migration coordinator reviews minimal model/relations only after1–2; no migration before review.
4. Dev3 selects the first approved end-to-end slice and uses existing planning/TDD/scoped worker/QA workflow. Until then status is contract-preparation WIP, not READY runtime implementation.

## Bounded owner-review packet (2026-11-15; no approvals recorded)

This extends the existing preparation rather than restarting discovery or creating a second implementation plan. DISC-04 is satisfied. **Runtime list/detail remains BLOCKED: decision required, D-16**, limited to the read behavior below. Approving this packet's technical quality is separate from business adoption and Dev1/coordinator approval.

| Required bounded decision | Concrete proposal for review | Required owner / present disposition |
| --- | --- | --- |
| Read fields and FR-07 boundary (D-16) | Adopt the observed list/detail field inventory above for this slice. Confirm source and meaning of date, ticket reference, subject, menu, URL, remarks, priority, displayed status/approval/approver. Explicitly defer unobserved category/AWB/customer/assignee/history expansion for this slice; retain FR-07 as the full ticket requirement. Defer any unsupported displayed field explicitly rather than fabricate its value. | Support/domain owner + Dev3; named business approver and dated acceptance **TBD**. LD017–020/036 support structure only. |
| Record visibility and read grant (D-16; existing D-04 foundation) | Agree branch ownership, allowed-branch visibility, any additional user restriction and direct-detail behavior. Proposed ticket:view must be reviewed/registered by Dev1. Existing system_admin:manage behavior remains governed by the registered inventory; Administrator observations supply no ticket-specific visibility rule. | Dev1 identity/branch/permission owner + support owner; **TBD**. No global scope inferred. |
| Minimal model and legitimate population | Coordinator reviews only approved read fields/relations/indexes and existing-row impact. Two genuine paths: authorize a separate provenance/privacy-reviewed migration/population contract, or postpone runtime read delivery until an approved creation/population slice exists. No import or legacy data transfer is authorized here. | Dev3 + migration coordinator + support/source owner; **TBD**. Permanent synthetic emptiness is not a completed runtime feature. |
| Safe read presentation | Agree the exact date source and display semantics needed; involve foundation owner under D-19 if selecting target timezone/locale conventions. Proposed URL presentation is inert text; no fetch or automatic external link. Exclude Picture/file opening and upload/download until policy exists. Confirm whether remarks/approver identity may be exposed to each approved reader. | Support + Dev1; foundation owner where applicable; **TBD**. No inferred timezone, privacy policy or file access. |

Later create gates cover requiredness/defaults/lengths, numbering/date generation, initial status/approval and priority validation. Later mutation gates cover update/delete/assignment/resolution/reopen/history/concurrency (D-16), approval authority/sequence/outcomes (D-16 and applicable D-21), and attachments/Picture handling/privacy. These must not blanket-block an independently accepted read slice. No later mutation is authorized by read acceptance.

Approval record to complete through the normal owner review: named approver and role; dated traceable reference; exact accepted rows/fields and explicit exclusions; corresponding PRD D-16 bounded rule/FR-07 note (D-19 only if applicable); Dev1 review of grant/scope; coordinator/model/population review. Keep unresolved parts TBD. Agent QA cannot fill the human approval record.

## Conditional execution and verification handoff

Entry is closed until the bounded decisions above are recorded. After acceptance, the lead selects one list/detail vertical slice and records exact allowed paths, owner and model/migration reviewer. Candidate paths are prisma/schema/ticketing.prisma plus its reviewed additive migration, src/features/ticketing/ read queries/validation/components, and the reviewed /ticketting list/detail route entries. Shared identity grant files remain Dev1-owned until separately reviewed; no worker may edit them opportunistically. Tests belong under the repository's existing unit/UI and guarded integration conventions. No implementation_worker or TDD cycle has started for this draft.

| Acceptance class | Required proof after implementation (not executed here) |
| --- | --- |
| Authentication / registered grant / active actor | Independent list and direct-detail entry checks; unauthenticated, inactive/deleted actor/group and denied grant cases. Unknown resources must deny, including admin. |
| Branch and user visibility | Allowed and denied branches; empty membership; forged client branch; guessed out-of-scope record ID; approved additional user rule. Scope predicate must constrain both list rows and direct lookup. |
| Record shape / population / missing records | Approved fields only, legitimate populated happy path, empty data, missing/deleted records and no disclosure through failure responses. Approved date and status display mapping; no synthetic operational claims. |
| Query bounds | Invalid IDs, invalid/over-limit page/search inputs, stable deterministic pagination and no unbounded list. Exact numeric limits/order/search fields are technical proposals to settle in the scoped plan, not legacy facts. |
| Read safety / UI | Inert escaped URL/remarks; no attachment or business mutation; loading/empty/error states, keyboard and touch; 375/768/1440 without page overflow. |
| Quality / ownership | TDD red-green for approved behavior, targeted unit/UI tests, guarded local logistik_web_test integrations, lint/typecheck/build, reviewed migration impact/diff, independent QA, documented provider comparison and staging. Report exact commands and tested SHA; prior results do not transfer. |

This is preparation completion only. SUP-01 CRUD/lifecycle, the other Dev3 runtime tickets and release acceptance remain open.

## Existing source contracts and limitations (verified at 9280276)

Relevant ticket/identity application source and schema remain at the c406502 main baseline. Intervening history also contains local legacy-observation harness tooling; it is not ticket runtime code. These are reuse candidates, not an approved ticket API or schema. Read-only source review ran no tests or database operations.

| Repository evidence | Concrete reuse boundary |
| --- | --- |
| src/features/identity/permissions.ts:223,235,248,259,269 | Grant and AccessActor use numeric actor/group/branch IDs. Active actor/group and registered resource/action checks apply before explicit system_admin:manage override. Unknown ticket resource denies even administrator; registration does not grant ordinary groups access. |
| src/features/identity/server/context.ts:9,17; server/access.ts:31,74 | currentIdentity / sessionForHeaders reload actor via loadAccessActor; assertPermission(actor, action, resource) returns 401/403 through IdentityError. Membership filters active/nondeleted branch and office, nondeleted company. Authenticate/authorize each list/detail entry separately. |
| src/features/identity/permissions.ts:283; src/lib/auth/session.ts:35 | permitsBranch lets an active explicit administrator use any positive safe integer branch ID; it does not itself verify that branch exists/is active. getUserBranchScope returns assigned branches, even for administrators. They are not interchangeable. Dev1 must review ticket admin scope and target-record validity separately. |
| src/features/identity/server/service.ts:309,345; src/features/identity/validation.ts:4,54 | Existing paginated service/ID-validation patterns can inform ticket queries. User-specific visibleUsers predicate is not a ticket predicate. Identity bounds (page1–100000, size1–100/default20, trimmed search<=100) are reference values only; ticket limits/order/search fields need the scoped technical plan. |
| src/features/identity/server/service.ts:82; prisma/schema/identity.prisma:173 | Unexported identity audit helper and immutable IdentityAuditEvent are security-history patterns, not a generic ticket audit/comment API. Do not repurpose them as FR-07 chronological ticket history. |
| src/features/identity/server/action.ts:6 | identityAction sanitizes errors but includes identity-specific duplicate wording. Reuse the boundary pattern only after reviewing ticket error semantics. |
| src/app/(dashboard)/ticketting/page.tsx:7; src/components/patterns/preview-screen.tsx:19; src/features/ticketing/preview/screens.ts:15,47,60,79,87,107,133 | Existing route is synthetic only. Preview differs from observations in columns (missing URL/approval/approver), editable required date, Medium priority, optional menu/URL and synthetic status/actions. No schema model, runtime query/action or ticket lifecycle exists to reuse. Do not activate preview metadata as a domain contract. |

Conditional service proposal (names/types for owner review, not code): listTickets(input: unknown) returns approved TicketListItem records plus pagination {page, pageSize, total, totalPages}; getTicketById(input: unknown) returns an approved TicketDetail. DTO fields remain limited to the explicitly accepted field mapping; do not define inferred status enums or a ticket-number generator here.

Both queries must validate inputs, load a fresh actor, check the reviewed ticket:view grant and derive the same approved branch/user visibility predicate. Apply it to list rows **and count**, and to direct lookup by ID; filtering after fetching cannot protect totals or inaccessible records. Proposed absent/inaccessible behavior is the same not-found response, subject to Dev1 review. Preserve approved deletion visibility without inferring restoration or key-reuse policy.

Coordinator model review must settle: owning branch and exact admin/user scope; stored versus projected fields/nullability; actor relations (User.id is Int at prisma/schema/identity.prisma:26); legitimate population; whether attachment metadata can be excluded; lifecycle timestamps/deletion visibility; branch/date/ID indexes and existing-row impact. No ticket schema file or migration is introduced by this packet.

Existing test references, inspected only: tests/unit/identity-permissions.test.ts:39,73,88,95 (registration, inactive group, membership, admin/unknown denial); tests/unit/identity-boundaries.test.ts:22,58 (server surface and anonymous entry); tests/integration/identity.test.ts:229 (scoped rows and totals, inaccessible ID, empty membership); tests/ui/legacy-preview.test.ts:90 (synthetic interaction/disabled save, never runtime evidence). New ticket tests must prove the approved contract rather than merely assert these source patterns exist.
