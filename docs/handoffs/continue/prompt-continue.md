# Dev 3: Evidence-Driven Legacy Migration — continuation prompt

Continue Dev 3 work on branch `dev3/ready-for-review` (remote
`origin/dev3/ready-for-review`). Paths below are relative to the repository root;
do not assume any machine-specific checkout location.

Follow `AGENTS.md`. This branch has no `CLAUDE.md`; if your client loads one from
elsewhere, `AGENTS.md` still governs this repository.

Read first:
- `docs/handoffs/continue/condition-summary.md` (short state summary).
- `docs/agent-state/dev3/STATE.md`, `HANDOFF.md`, `DECISIONS.md` (latest entries first).
- `docs/decisions/DEV3-LEGACY-PARITY-AUDIT.md` section 11 (22-identity progress matrix).
- `docs/PRD.md` section 7 (decisions D-xx), `docs/ROADMAP.md`.

## 0. Review stop point — do this before anything else

The branch is unreviewed: 175 files / ~28,000 lines above `origin/main`, including
three migrations (`20261115000100_sup01_tickets`, `20261115090000_fin01_invoices`,
`20261115100000_fin02_accounting`), the new `prisma/schema/finance.prisma`,
changes to `sales.prisma`, `identity.prisma`, `organization.prisma`, and 74 lines
in `src/features/identity/permissions.ts`.

Per `AGENTS.md` §3 and §7.6, this must go through PR review before more work lands.

1. Check whether PR(s) for this branch exist and what review state they are in.
2. If none exist, **stop and ask the user** to open them (or for explicit
   permission to open them). Splitting per ticket (SUP-01, RPT, FIN) is preferred.
   Do not push, open PRs, or merge on your own initiative.
3. Until Dev 1 (auth/RBAC/shared organization contracts) and Dev 2 (shipment/AWB
   sources, `sales.prisma`) have reviewed, **do not continue implementation**.
   Permitted meanwhile: addressing review comments the user forwards, and
   read-only analysis.

## 1. Honest current state

The previous session (Codex, interrupted 2026-11-16 by a usage limit) concluded:

- **No further report slice is source-ready** under the current models and contracts.
- **19 of the 22 legacy report identities (LP-R01..LP-R22) are blocked** on a business
  decision (`BLOCKED_DECISION`) or a missing data source (`BLOCKED_SOURCE`).
- The 3 remaining (LP-R01, LP-R03, LP-R05) are `IMPLEMENTED_UNVERIFIED`: real
  source-backed queries exist, but full legacy parity is not established.
- No report is `VERIFIED_EQUIVALENT` or exactly migrated.
- FIN-01/FIN-02 are implemented and locally verified, but acceptance is PARTIAL
  (human review, migration coordination, staging). REL-01 is NOT READY.

Do not restate this as more progress than it is.

## 2. Mission (after the review stop point clears)

Bring Dev 3 features to functional and business-semantic parity with the legacy
system where evidence and approved decisions allow, with selective modernization
only where justified and approved. Do not reproduce legacy bugs or poor UX, and
do not sacrifice established business behavior, data correctness, or authorization.

For every Dev 3 feature, especially LP-R01..LP-R22, compare legacy and current
behavior across: navigation identity, source data and relationships, business
rules and transitions, permissions and branch isolation, filters/date
boundaries/statuses, table data/grouping/sorting/totals, financial calculations,
export/print structure, error and empty states, and operational usability.

Use existing evidence first. Do not infer equivalence from matching labels,
routes, fields, or screenshots. Keep `OBSERVED`, source-backed, and verified
parity distinct.

## 3. Classifying discrepancies

- **PRESERVE** — legacy behavior is correct and business-critical; reproduce its semantics.
- **REFINE** — same business meaning, better maintainability/usability/performance.
  May be implemented if it changes no business rule and stays within Dev 3 ownership.
- **CONSOLIDATE** — **proposal only.** Record it as a D-22 entry in `docs/PRD.md`
  section 7 (parity scope) with evidence and 1–2 alternatives, and wait for the
  owner's decision. Do not implement before it is CONFIRMED.
- **CORRECT** — **proposal only.** Same as CONSOLIDATE: record the verified legacy
  defect and the proposed behavior under D-22 and wait for the owner's decision.
- **DEFER** — authoritative source, historical evidence, or a business decision is
  missing. Write `BLOCKED: decision required, D-xx` and do not fabricate behavior.

## 4. Change boundaries — proposal only, never implement without written approval

The following require **written approval from the owning domain owner** (and the
migration coordinator for schema) before any edit. Without it, the agent may only
write a proposal (design note or PR comment draft):

- Any Prisma schema file under `prisma/schema/` or `prisma/schema.prisma`.
- Any migration under `prisma/migrations/` (new or existing). Never edit applied migrations.
- `src/features/identity/permissions.ts` and any shared auth/RBAC/branch-scope code (Dev 1).
- Models or services owned by another domain, including **new columns on
  `Transaction`** or other shipment/AWB/manifest/delivery models (Dev 2).
- Test fixtures that pin schema/migration baselines (e.g. `tests/fixtures/sch01-baseline.json`).

This explicitly replaces the earlier suggestion to add "nullable source capture" on
`Transaction` for LP-R01 mode/service/description: that is a Dev 2 proposal, not
Dev 3 implementation work.

## 5. RPT and remaining Dev 3 work

Only implement a report slice when **all** are true: its sources exist in approved
models, its business rules are CONFIRMED or already adopted, and it needs no change
listed in §4. Each implemented slice needs source-backed queries, validated
filters, server-side authorization and branch scope, operational presentation,
export/print where the output contract is established, and focused tests.

Navigation-only or synthetic-preview pages are not complete implementations.

**If no slice is ready, stop and report the decisions required** (per identity:
blocker type, D-xx, owning domain, 1–2 alternatives). Do not pick a blocked report
and work around the blocker.

After RPT, the same rule applies to remaining Dev 3 ROADMAP work (including FIN
items assigned to Dev 3): proceed only where ready and in scope.

## 6. Cross-developer consistency

Review shared contracts before touching anything that depends on another domain.
Reuse authoritative shared models, services, validation, and authorization. Do not
duplicate financial, transaction, shipment, or reporting logic. For any
cross-domain need: name the owning domain, the required contract/schema change,
and the impact on existing consumers — then stop at the proposal (§4).

## 7. Mobile readiness — evaluation and notes only

Evaluate, do not build. Record findings (for example in the Dev 3 checkpoint
`HANDOFF.md`) on whether business rules live in server-side services rather than
web UI, and how auth/branch scoping, reporting queries/exports, pagination,
filtering, error semantics and identifiers would serve a non-web client.

No new APIs, route handlers, adapters, or refactors for mobile purposes.

## 8. Legacy system access rules

The legacy system's address is not stored in the repository; ask the user if needed.

- Read-only only, within the owner's legitimate account permissions: open menus and
  report pages, set filters/dates, run confirmed read-only queries, inspect tables,
  run confirmed non-mutating exports.
- **No legacy mutations**: never create, edit, delete, approve, issue, void, settle,
  post, reverse, import, submit business forms, change permissions or settings,
  bypass authentication, or execute unverified write-capable requests. If an
  action's side effects are ambiguous, skip it; an "Export" label is not proof of
  read-only behavior.
- **Exports are bounded**: narrow periods/filters and safe result sizes. Keep
  downloaded files outside the repository, inspect structure and safe aggregates
  only, and **delete them after inspection**. Do not retry a failed export without
  new evidence.
- **No customer data in the repository**: no raw records, personal identifiers,
  credentials, session IDs, legacy URLs, or private local paths in docs, tests,
  fixtures, or commits. Use small synthetic fixtures for tests.
- Never fabricate browser observations. If browser access fails after one focused
  recovery attempt, record the evidence gap and move on.

## 9. Known test failure — do not "fix" by editing migrations

`tests/unit/sch01-schema.test.ts` hashes the bytes of applied migration files
against `tests/fixtures/sch01-baseline.json`. On a checkout where migration files
have CRLF working-copy bytes (seen on the previous Windows machine), it fails once
(670 pass / 1 fail). The committed blobs and LF-normalized bytes match the
baseline; `.gitattributes` declares `eol=lf`.

Do not edit migrations or the baseline fixture, and do not weaken the test. If it
fails, confirm the working copy has CRLF bytes and restore LF bytes from Git (after
checking there are no local edits). Report it as a working-copy issue, not a pass.

## 10. Verification and continuity

Run focused tests per change, then lint, typecheck, unit, guarded integration
(`logistik_web_test` only) and build when a batch is complete. Report actual
commands and results.

After each slice, update the existing Dev 3 checkpoints (`docs/agent-state/dev3/`)
and audit section 11 — no parallel tracking documents, no documentation rewrites
without implementation progress. Never mark a report migrated because it renders.

Do not push, merge, deploy, or modify legacy or production data without explicit
user instruction.

## 11. Completion criteria

Dev 3 migration is complete only when every in-scope legacy function has a verified
modern implementation or an approved deviation, redundant features and legacy
defects are handled by owner decision, semantics remain correct, authorization and
regression tests pass, cross-developer contracts are compatible or their open
dependencies documented, and the Dev 3 ROADMAP acceptance criteria are addressed.
If data or approval is missing, name the blocker. Never claim completion without evidence.

## Start

1. Recover state (git status, HEAD, checkpoints); verify nothing is half-finished.
2. Apply the review stop point (§0).
3. Only if review is cleared: look for a source-ready, in-scope slice (§5).
   If none exists, stop and report the decisions required.
