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

First candidate: authenticated/authorized branch-scoped ticket list and detail with observed columns, plus explicit empty/error/loading states. This can be reviewed separately from create/approval/lifecycle. It requires an approved minimal model, branch/record visibility and action inventory, and an agreed data-population path; a permanently empty synthetic list is not a completed runtime slice. Do not fabricate fixtures as real migrated records or call a preview operational.

Then create/priority/attachment and lifecycle slices only after their exact D16 scope/rules are accepted. No initial status, approval state, assignment, resolved/reopened transition, automatic ticket number or deletion policy is chosen here. Finance notes do not block this ticket; its own unresolved rules do.

Proposed regression acceptance, NOT IMPLEMENTED/RUN: unauthenticated/denied grant/unauthorized branch/soft-deleted source cases; bounded invalid pagination/search; missing-record denial; observed field/column parity and Low/Normal/High labels; URL/file handling denial cases after their policy exists; responsive375/768/1440 and keyboard/loading/empty/error states. Add transaction/history/concurrency cases only to approved mutations. Required lint/typecheck/targeted tests/build and independent QA apply at implementation, not as DISC04 closure gates.

## Review checklist / exact next action

1. Dev1 reviews proposed ticket grants and branch/record visibility contract.
2. Domain owner resolves legacy-versus-FR07 scope and confirms bounded list/detail field definitions; lifecycle questions remain with their later mutations.
3. Migration coordinator reviews minimal model/relations only after1–2; no migration before review.
4. Dev3 selects the first approved end-to-end slice and uses existing planning/TDD/scoped worker/QA workflow. Until then status is contract-preparation WIP, not READY runtime implementation.
