# Dev 1 prerequisite audit for OPS-01

Date: 2026-10-27 (Asia/Jakarta). Scope: Dev 1 only. Branch: `ardiputra`.

## Finding

The reported OPS-01 blocker is an acceptance/dependency gate, not a supplied
runtime exception. PLT-01 and PLT-02 implementations exist. Their bounded local handoff is accepted under the 2026-10-27 exception below;
full release acceptance remains pending under ROADMAP section 4 and the existing
[Dev 1 handoff](DEV1-2026-10-25.md). This audit does not mark them DONE or grant
permission to start OPS-01.

`docs/decisions/DISC-03.md` and `docs/dev2-progress.md` are absent from this
checkout. The pasted Dev 2 report says DISC-03 is complete and D-05 is OBSERVED;
this branch's PRD still records D-05 as TBD. Reconcile that evidence through its
owner before relying on either status. No Dev 2 progress file is created here.

## Dev 1 contract accepted for bounded v1

The following implementation contract was submitted for review and subsequently
accepted by the stakeholder as bounded v1 on 2026-10-27, as recorded below:

| Decision | Current implemented contract | Source |
| --- | --- | --- |
| D-03 | Company -> Office -> Branch -> Agent; organization mutations require administrator access; historical references are protected and deletion is soft deletion. | `prisma/schema/organization.prisma`, `src/features/organization/server/service.ts` |
| D-04 | One group per user; explicit action grants and allowed branches; active user/group required. `system_admin:manage` grants the administrator override. Names and empty branch lists do not grant full access. | `src/features/identity/permissions.ts`, `src/features/identity/server/access.ts` |
| D-04 | Session and current actor are resolved server-side; mutations recheck actor/session, permissions and scope inside the policy transaction. UI visibility is not authorization. | `src/features/identity/server/context.ts`, identity/organization/master-data server services |
| PLT-02 priority references | Organization and master-data CRUD are implemented. Shared master mutations require administrator access; branch-owned personnel/vehicle writes require grants and branch scope. Flat geographic dictionaries remain the approved v1 representation. | `src/features/master-data/server/service.ts`, existing Dev 1 handoff, PRD D-27 |

Consumer entry points are `currentIdentity`/`sessionForHeaders`, `loadAccessActor`,
`assertPermission`, `permits` and `permitsBranch`. `assertPermission` takes
`(actor, action, resource)`. The canonical resource inventory currently covers
Dev 1 only: `validPermission` rejects unknown resources even for administrators.
Do not substitute a reference-data permission for a future booking/AWB permission.
An approved operational permission inventory needs its own reviewed change when
that feature is implemented by its owner.

## Stakeholder acceptance record: 2026-10-27

Approver: the stakeholder/user in this Codex conversation, identifying as Dev 1.
After the explicit D-03/D-04 approval wording was presented, the user replied:
**"Aku setujui"**. This conversation is the approval source; no separate PR
comment or reviewer identity is invented.

Accepted scope: Company -> Office -> Branch -> Agent; one group per user;
explicit action grants and allowed branches; full access only through
`system_admin:manage`. The existing active-actor, server-side permission/branch,
administrator-only organization mutation and historical-reference protections
remain part of the bounded Dev 1 contract above. PRD FR-01 and D-03/D-04 now
record this scoped acceptance.

This does not attest to provider non-admin parity, staging execution, approval
of subsequent code changes, a complete future operational permission inventory,
PLT-02 priority-subset acceptance, or D-05/D-06 booking/AWB rules. It does not
waive the roadmap gates or declare OPS-01 unblocked.

## Temporary staging substitution approved: 2026-10-27

The stakeholder explicitly approved the following in this conversation:

> Saya menyetujui hasil pengujian lokal sebagai pengganti staging sementara untuk serah terima PLT-01/PLT-02 Dev 1. Verifikasi staging sebelum rilis dan pembandingan perilaku non-admin dengan provider tetap dicatat sebagai pekerjaan lanjutan. Persetujuan ini tidak mencakup aturan booking/AWB Dev 2.

Together with the bounded D-03/D-04 approval and existing PR #7 review, this
accepts the local PLT-01/PLT-02 handoff for the implemented Dev 1 scope. Local
check/build, 344 unit/UI tests, 98 integration tests, Prisma validation/no-drift
checks and production-build HTTP smoke are recorded in
[Dev 1 progress](../dev1-progress.md). The user also reports successful laptop
checks; these are user-reported, not independently observed by the agent.

No staging deployment or provider non-admin parity was performed by this
approval. Those checks carry forward before release. This exception does not
close FND-02, change Phase 1 or release requirements globally, accept PLT-03/WA-01
release scope, or approve any Dev 2/3 rule. Staging/provider evidence is no longer
an immediate gate for this bounded PLT-01/PLT-02 handoff. Operational owners must
still identify required reference contracts and satisfy OPS-01's own decisions.

## Remaining acceptance work

Update after inspecting the stakeholder-supplied GitHub PR list: [PR #7](https://github.com/code-craft-id/logistik-web/pull/7)
was approved by z4fL on 2026-10-26 and merged as `62d71b6`, after the `de5073f`
corrections. Independent code review of that delivered change is therefore
verified, superseding the earlier assumption that no review evidence was
available. The PR does not establish staging execution or explicit acceptance
of all D-03/D-04 business rules. See [current progress](../dev1-progress.md).

1. Bounded D-03/D-04 stakeholder acceptance is recorded above. Complete the
   remaining provider evidence and release verification without treating this
   acceptance as proof that those checks ran.
2. PR #7 supplies another developer's code review for the delivered change.
   Record explicit shared-contract acceptance under AGENTS section 3. Verify
   non-admin allowed/denied behavior across two branches against the provider,
   or record an explicitly approved bounded-v1 deviation. Existing administrator
   observations cannot establish non-admin parity.
3. Before release, perform and record actual staging verification. The explicit
   exception above now also allows local verification for the bounded PLT-01/02
   handoff; it does not assert that staging exists.
4. Name the exact PLT-02 priority reference subset needed by OPS-01 and accept
   its contract. Do not infer operational readiness from all master menus being
   visible or from status dictionary CRUD.
5. PRD and ROADMAP record the explicit bounded handoff exception. Keep release
   gates and OPS-01 decisions visible; do not promote this to unrestricted DONE.

## Boundaries that remain with Dev 2

D-05/D-06 (booking/AWB cardinality and numbering), D-21/D-26 where applicable,
OPS-01 schema/server/UI, shipment transitions and Dev 2 discovery reconciliation
are outside this change. Accepting Dev 1 does not resolve them. ETA remains
deferred under D-31; no financial or Dev 3 behavior is introduced.

## Verification

With Node 24.15.0, the following fresh command passed all 56 tests in four files:

```sh
npm run test:integration -- tests/integration/identity.test.ts tests/integration/session.test.ts tests/integration/organization.test.ts tests/integration/master-data.test.ts
```

The first attempt failed because local PostgreSQL was stopped after environment
restore; restarting the existing container resolved the connection failure.
Coverage includes session replay/revocation, live grant changes, branch isolation,
privilege escalation rejection, last-administrator protection, organization
references and master-data persistence. These tests exercise the local contract,
not provider parity.

No application code, schema, migrations or tests are changed by this documentation
audit. Lint/typecheck/build and the full suite were not rerun for this Markdown-only
change. Existing cloud onboarding results are historical, not a new full-suite or
staging acceptance claim.
