# PROMPT 01: Preflight + DISC-04 with persistent checkpoints

Use `$dev3-orchestrator` and installed Superpowers workflows when applicable.

Project: `code-craft-id/logistik-web` (local checkout). Target baseline: latest verified `main`.
Model preference: GPT-6.1 Sol, Medium; use High for particularly difficult reasoning or review only when supported.

Act as the Dev 3 Lead Engineering Agent. Complete DISC-04 discovery and readiness. Read `AGENTS.md`, `docs/PRD.md`, `docs/ROADMAP.md`, `docs/decisions/DEV2-DEV3-HANDOFF.md`, OPS-04 contract, existing source/tests and the Dev 3 policies. Verify actual HEAD, PR #9 merge, runtime vs preview, naming inconsistencies, and stale docs; do not trust the kit's dated snapshot.

## MANDATORY: repository-backed memory (not just final response)

Read `docs/agent-policies/DEV3-CHECKPOINT-PROTOCOL.md` before delegation. Establish these **real Markdown files on disk** under `docs/agent-state/dev3/`:

- `STATE.md` (authoritative current snapshot: ticket, branch, HEAD, clean/dirty state, DONE/WIP/BLOCKED/UNVERIFIED, safety gate, one next action).
- `RUN_LOG.md` (append-only chronological work/delegation/test record with paths, commands, outcomes and applicable SHA).
- `DECISIONS.md` (D-xx provenance, status, approval evidence, blocker and choices).
- `DISC-04.md` (sourced findings) and `REPORT_CATALOGUE.md` (report-by-report requirements and missing evidence).
- `HANDOFF.md` (short self-contained resume instructions for the next context/session).

**Writing checkpoints is REQUIRED, not optional.** Lead is the sole writer of shared memory files. Create a safe `docs/disc-04-dev3-readiness` branch from an appropriately verified baseline when the working tree allows; never reset/overwrite existing changes or switch branches blindly. Only write to the above Dev 3 documents during discovery. Initial checkpoint before delegation; update after subagent results, significant findings, blocker discoveries, before a context handoff/compaction where possible, and at the end. Use truthful timestamps and actual Git SHAs. Never assert persisted if disk write failed. Stage/commit scoped docs at a logical milestone when permitted, without merge or deploy. Memory artifacts must not contain credentials, cookies, raw provider screenshots or PII.

## Delegation

1. `requirements_analyst`: D-11..D-16/D-19/D-21, roadmap, provider parity gaps, stakeholder decisions.
2. `code_explorer`: source, permissions, Prisma, report/ticket/dashboard routes, actual Dev 2 contracts and tests.
3. `legacy_observer`: use the effective observation mode in the canonical gate. Default UNVERIFIED permits sanitized offline evidence only; authorized direct observation requires the explicit applicable DIRECT_NON_MUTATING_DISCOVERY grant and procedural per-control classification; isolated/protected observation instead requires its independent verification. SUPERVISED_VISUAL never enables autonomous browsing. Technical NOT_VERIFIED does not clear protected modes and does not negate a separate applicable direct grant; observer cannot self-authorize.
4. `qa_reviewer`: independently challenge unsupported findings, scope drift, decision statuses and unsafe assumptions after exploration.

Consume existing DISC-04 checkpoints and preserve completed findings; investigate only missing/stale evidence. The canonical access contract is `docs/agent-policies/LEGACY-ACCESS-GATE.md`; do not duplicate or infer its approval record. Restore the effective mode and exact environment/session/evidence/authorization, then verify current applicability before delegation. `ISOLATED_AUTONOMOUS` and `PROTECTED_AUTONOMOUS` permit only independently verified and explicitly authorized target/scope. `DIRECT_NON_MUTATING_DISCOVERY` separately permits explicitly user-authorized procedural ordinary-page navigation/observation without requiring a replica or claiming PROTECTED_AUTONOMOUS verification; per-control safety classification, no arbitrary JS/API, mutations, forms/workflows or exports/downloads. `SUPERVISED_VISUAL` permits explicitly authorized passive human-controlled viewing only, never autonomous browsing. `UNVERIFIED` denies autonomous legacy access and page-content inspection when no applicable separate grant exists; technical `NOT_VERIFIED` alone does not negate a valid DIRECT_NON_MUTATING_DISCOVERY grant; sanitized offline evidence and dummy local tests may continue. A checkpoint, configured CDP, signed-in tab, fixture test, GET-only proxy or tool allowlist grants no authorization or independent enforcement. No credentials, mutations, raw private payloads or exports; retain D-29. Request manual human login only after the applicable gate/authorization clears. Do not require page-by-page human navigation as the autonomous solution.

Assign read-only subagents bounded questions; collect their findings and citations; do not allow subagents to overwrite lead memory files. Follow `docs/agent-policies/LEGACY-READONLY.md` and `LEGACY-ACCESS-GATE.md`. For isolated/protected modes require independently verified external enforcement and scoped approval. Direct procedural mode instead requires the separately recorded user authorization and per-control classification; no technical guarantee inferred. Read-only Chrome DevTools tooling is **not** itself a safety boundary.

## Required persisted discovery results

- DISC-04 report with `REPO_VERIFIED` / `PROVIDER_OBSERVED` / `TBD` / `BLOCKED` distinction and exact path or evidence source.
- Report catalogue: columns, filters, source rows, date basis, statuses, branch scope, units, exports and reconciliation samples, clearly flagging unknowns.
- Ticket D-16, financial D-11..D-14, approval D-21, locale/timezone D-19 decision matrix.
- Dependency graph and prioritized bounded vertical slices for SUP-01, RPT-01, RPT-02, FIN-01 and FIN-02.
- Two candidates only if proven READY; otherwise explicitly state none and the exact blocker.
- Migration-first decision packet: separate verified existing behavior, missing evidence and formal adoption approval. Escalate only ambiguous/contradictory/missing/unsafe/new behavior; do not redesign known processes. D-xx stays TBD without required approval.

## No unauthorized implementation

Resolve technical questions internally, but NEVER invent or confirm business rules. Do not edit feature/domain code, perform migrations, modify the legacy app, merge PRs or deploy. If local file persistence is blocked, produce copyable artifacts and mark `PERSISTENCE_BLOCKED`; never silently rely on context memory.

End with: exact paths written, branch/HEAD, checkpoint status, next action, and human decisions required. The files, not the chat response, must be sufficient to resume.
