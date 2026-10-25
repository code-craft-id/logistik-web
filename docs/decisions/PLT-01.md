# PLT-01: Dev 1 continuation and security review

## Current handoff: 2026-10-25

Runtime identity, organization and master-data CRUD now exist and have local
verification. See [Dev 1 implementation and handoff](DEV1-2026-10-25.md) for the
current contracts, approved schema refinements, developer seed accounts,
verification results and remaining acceptance gates. ETA is explicitly deferred.
Provider role parity, independent review and staging remain open; no ticket is
marked formally DONE by this update.

The dated review below is historical. Its claims that reference screens are
synthetic-only, provider access is unavailable, no seed/migration was applied,
and build remains blocked do not describe the current working tree.

## Historical review: 2026-10-23–24

Review dates: 2026-10-23–24 (Asia/Jakarta). Owner: Dev 1.
Status: **PARTIAL implementation; acceptance BLOCKED**.
This is a review/handoff note, not approval of D-03/D-04 or permission to deploy.

## Continuation 2026-10-25

The coordinator requested completion of Dev 1 and selected provider parity,
offering test access. This selects the discovery path; it does not confirm the
current organization or permission implementation. Provider URL, test-role and
branch context are pending. D-03/D-04 remain TBD. Preserve existing working-tree
work and continue PLT-01 technical verification while access is supplied.

Security repair proposed for peer review: re-resolve the initiating request's
session after acquiring the identity policy lock, before reloading grants and
writing. Previously only the actor's status/grants were refreshed; a session
revoked during password hashing or lock contention could still reach a write.
Reject missing sessions or changed actor IDs with 401 and no mutation/audit.
This introduces no schema, permission resource, branch rule or session duration.
The regression exercises rejection before group creation and audit insertion.

Provider discovery checklist (record sanitized outcomes, never record values):

- DISC-02 / D-03: company, office, branch and agency parent relationships;
  required fields; allowed reassignment; inactive and deleted-parent behavior.
- DISC-02 / D-04: group cardinality, full action inventory, membership rules,
  allowed and denied list/detail/mutation cases for two branches, administrator
  override and permission changes during an existing session.
- PLT-02: one reviewed reference-data slice at a time; create/update/deactivate/
  delete/search/pagination behavior and expected validation errors. Shipment
  status requires Dev 2's D-07 contract; geography remains gated by D-27.
- PLT-03: vehicle/driver/courier visibility and requiredness under D-25; ETA
  inputs, outputs and storage contract. Do not infer rules from menu labels.

Business-dependent implementation follows recorded observations and the review
required by AGENTS.md. Existing peer-review, staging and responsive acceptance
requirements remain open.

Verification at this continuation: lint and strict typecheck PASS after removing
one blank whitespace line in package.json. Prisma validate, migrate status (15
applied migrations) and read-only schema diff PASS with no drift. Initial tests
under concurrent build load: 247/259 unit/UI and 30/32 integration PASS; all
failures were test/transaction timeouts. Database-free rerun with
`npm test -- --maxWorkers=1`: 257/259 PASS; two legacy-preview tests still exceed
their unchanged five-second timeout. No failing assertion or test was removed,
and these results do not constitute a green full suite. Integration's new
revoked-session regression passed. Build verification is still pending.

## Scope and evidence

The working tree already contains runtime Better Auth, username login, group/user
management, configurable grants, explicit branch memberships, profile/password/
session management, audit storage and three PLT-01 migrations. These are no longer
UI-only previews. Earlier FND/SCH/legacy notes describe their historical snapshots,
not this working tree. No provider session, peer review or organization/permission
approval is supplied by the current request.

**BLOCKED: decision required, D-03, D-04.** Before acceptance or additional
decision-dependent features, either:

1. Observe provider organization, allowed/denied actions and multi-branch behavior
   with approved test identities, and obtain the required peer/domain review; or
2. Have stakeholders explicitly approve a bounded v1 organization/permission
   contract, including any intentional provider deviations.

Existing code implements one group per user, group-owned action grants, explicit
allowed branches and a `system_admin:manage` cross-branch override. Names and empty
branch assignments do not grant access. These are **implementation facts**, not
confirmed business rules. The schema/migration comments calling the slice
“user-approved” are not approval evidence. This pass does not rewrite migrations
or promote those claims to CONFIRMED.

## Bounded technical continuation

Continue PLT-01 only: repair reproducible technical/security errors, preserve
existing user work, add regressions, and report actual verification.

- Replace the unsafe alternate seed implementation with the existing guarded
  `prisma/seed.mjs` entry point: no embedded credentials, separate target checks,
  atomic fake fixtures and sanitized errors. This executes no seed during review.
- Keep cookie exports out of Git; do not read, copy or delete existing cookies.
- Keep server session helpers server-only, not public Server Actions.
- Migrate deprecated `middleware.ts` to the installed Next.js 16 `proxy.ts`
  convention. Retain independent authorization in each existing entry point;
  proxy is not an RBAC contract.
- Ensure all identity HTTP responses, including failures, are explicitly private
  and uncached.
- Bound Vitest to two workers after the baseline exhausted 5-second timeouts
  under unrestricted file concurrency. Keep every test and its existing timeout;
  do not weaken assertions or change Dev 2/3 tests.

The proxy matcher no longer exempts arbitrary image-suffixed dynamic paths or
loose `api/auth` prefixes. Regression tests exercise framework matcher behavior,
public/protected requests, server-only boundaries, uncached/sanitized errors and
canonical seed delegation. The installed experimental matcher helper still uses
the export name `unstable_doesMiddlewareMatch`, despite the renamed proxy convention.

Relevant installed guides: Next.js `01-app/01-getting-started/16-proxy.md`,
`15-route-handlers.md`, `07-mutating-data.md`,
`03-api-reference/03-file-conventions/{middleware,proxy}.md`, and the authentication
guide. Shared auth changes still require another developer's review before merge.

## Dev 1 remaining work

| Ticket | Current state | Required next work |
| --- | --- | --- |
| DISC-02 | BLOCKED D-03/D-04 | Provider evidence, organization tree, action/branch matrix, peer review. D-25 privacy and D-27 geography remain open. |
| PLT-01 | PARTIAL, not accepted | Review existing implementation against approved contract; verify migration history/drift, real login availability rules, authorization denials, cross-branch access, transactional audit, concurrency, UI and provider parity. Confirm session/password/origin policies; staging and peer review remain required. |
| PLT-02 | BLOCKED | Real company/office/branch/agent and essential reference-data CRUD. Current screens remain synthetic. Respect PLT-01/DISC dependencies, D-07 shipment-status contract from Dev 2, D-27 and D-30. Keep bank/wallet/invoice/tax/accounting/notification drafts inactive. |
| PLT-03 | BLOCKED | Vehicle, driver, courier, ETA and remaining operational masters after PLT-02 and D-25. ETA has no approved storage/workflow contract; do not invent one. Marketing personnel belongs to Dev 2. |
| FND-02 | Deferred shared work | CI and self-hosted staging remain Phase 1 exit requirements; this pass does not take over the shared ticket. |
| Later Dev 1 hardening | Not complete | RBAC/audit stabilization, cross-branch security audit, approved maintenance, migration/backup/restore checks and UAT. |

Dev 2 sales/customer/shipment/manifest/delivery and Dev 3 accounting/reports/
ticketing/dashboard implementations are out of scope. Their source and contracts
must remain unchanged by this continuation. No migration deployment, database
reset, commit, push or production action is authorized by this note.

## Current verification

Commands use Node **24.15.0**, explicitly selected from the installed nvm path;
the initial shell default was Node 20. No dependency version was changed.

| Actual command / check | Result |
| --- | --- |
| Baseline `npm run lint` | FAIL: unsafe `scripts/seed-direct.mjs` import ordering/formatting; fixed by canonical delegation, not a suppression. |
| Baseline `npm run typecheck` | PASS. |
| Baseline `npm test -- --reporter=dot` | 221 passed, 12 timed out (233 total); all failures reported the unchanged 5-second timeout. |
| Final `npm run check` | PASS: lint (223 files), strict typecheck, **259 tests across 21 files**. Two-worker limit; no increased test timeouts or removed existing cases. |
| `npx --no-install prisma validate` | PASS. |
| `npx --no-install prisma migrate status` | PASS after approved outside-sandbox retry: development has all 15 working-tree migrations applied. No migration was deployed. |
| `npx --no-install prisma migrate diff --from-config-datasource --to-schema prisma --exit-code` | PASS, no development schema difference. Read-only inspection. |
| `npm run test:integration` | PASS after approved local database access: **31 tests across five files**, guarded `logistik_web_test`. Includes actual provider credentials/sessions, scoped identity management, escalation denial, atomic rollback, audit and concurrent administrator protection. |
| Read-only `_prisma_migrations` checksum audit | PASS on development and test: 15 applied entries each, all 15 SQL SHA-256 values match working-tree files. Uses `BEGIN READ ONLY` then `ROLLBACK`; no business records read. |
| `npm run build` | **BLOCKED by execution environment.** Initial sandbox run could not fetch Google Geist fonts. Two approved retries reached Tailwind/Turbopack CSS processing but failed while creating a process/binding a local port: `Operation not permitted (os error 1)`. No successful build or production smoke is claimed. |
| Post-documentation `npm run lint && npm run typecheck && npx --no-install vitest run tests/unit/legacy-crud-audit.test.ts tests/unit/identity-boundaries.test.ts tests/unit/profile-http.test.ts` | PASS: lint, typecheck and 44 focused regressions, including historical inventory preservation. |
| `git diff --check` | PASS. |
| `git check-ignore cookies.txt` | PASS; existing cookie file was not read or deleted. |
| Dev 2/3 source preservation | No changes made to their feature modules, schemas or domain tests. Pre-existing working-tree changes remain preserved, including earlier dashboard routing/test changes. |

New regression development first exposed a mismatch between the guide's proxy
terminology and the installed helper export, plus a sandbox refusal of subprocess
CLI tests. The helper now uses its installed export; seed delegation is checked
without subprocesses, with existing local-target unit tests retaining actual
guard coverage. These exploratory failures are not counted as final passes.

No migrations/seed/bootstrap were applied, no development records were mutated,
and no commit/push/deploy or service restart was performed. Integration tests
write and clean up their own isolated fake test fixtures; they are not described
as read-only. Build must be rerun in an environment permitting Turbopack's local
process/socket operations. Provider parity, human peer review, staging,
375/768/1440 browser checks of the newer identity forms and screen-reader checks
remain unverified. Existing `id-ID` date rendering is not approval of D-19.
