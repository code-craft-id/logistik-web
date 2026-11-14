# PROMPT 02: Execute approved Dev 3 tickets with durable progress

Use `$dev3-orchestrator` and available Superpowers planning, TDD and independent review workflows.
Model preference: GPT-6.1 Sol (Medium default; High for difficult review when supported).
Repository: `code-craft-id/logistik-web`. Verify actual current branch, `main`, HEAD, PRD, ROADMAP and decision log. Never assume a previous session or kit snapshot is current.

MISSION: Consume the existing DISC-04 findings/catalogue/checkpoint, reconciling only missing or stale evidence rather than restarting discovery. Progress SUP-01, RPT-01, RPT-02, FIN-01, FIN-02 **only as far as documented business decisions and source contracts permit**. Do not promise blocked completion. Continue independent READY work while business approvals are pending.

## Restore and persist state FIRST

1. Read `docs/agent-policies/DEV3-CHECKPOINT-PROTOCOL.md`, and actual `docs/agent-state/dev3/{STATE,RUN_LOG,DECISIONS,DISC-04,REPORT_CATALOGUE,HANDOFF}.md` if present.
2. Reconcile saved records with `git status --short`, actual branch/HEAD, current PRs and current files. SHA-specific test results are not transferable to a different code SHA. If state conflicts with repo, record `UNVERIFIED`, investigate narrowly, and correct the checkpoint; never replay stale conclusions.
3. Before delegating, update `STATE.md` with current ticket/slice, owner, branch/commit, allowed paths, acceptance criteria and next action. Append one factual entry to `RUN_LOG.md`.
4. After every meaningful subagent completion, review, patch, test batch or blocker: **write the result to disk immediately**. Refresh `STATE.md` and the short `HANDOFF.md`. Only the lead edits shared checkpoint files; subagents return summaries and can write only their approved isolated working paths.
5. Persist a final checkpoint **before ending each Codex turn or switching contexts**. If a session is nearing compaction, checkpoint proactively. On abrupt interruption, resume from last verified on-disk checkpoint, not chat memory. Do not fake a clean conclusion when an agent/test is still pending.

## Work protocol

- Select one READY roadmap ticket and one bounded end-to-end vertical slice at a time. Record decision approvals and dependencies with exact D-IDs. Define paths, tests, ownership, and required review.
- Delegate read-only investigations only where parallelism helps. Use `implementation_worker` with an isolated branch/worktree and explicit allowed-write paths. Exactly one writer per shared file. Cross-domain API, auth, schema, migration, design-token or financial changes require owner review before implementation.
- Wait for worker result, delegate independent `qa_reviewer`, fix only in-scope findings and rerun relevant checks. Commit/push focused work using the normal repo workflow only where authorized; prepare PR for human approval, never auto-merge, deploy, force push or auto-approve.
- Write a checkpoint with actual command/results and SHA before and after significant changes. Append `RUN_LOG.md` events (start/delegation/result/validation/review/blocker/handoff); keep log concise and provenance-linked. Do not repeatedly reread all files or rerun expensive checks without a reason.

## Non-negotiable legacy safety

The canonical access contract is `docs/agent-policies/LEGACY-ACCESS-GATE.md`; do not duplicate or infer its approval record. Restore the effective mode and exact environment/session/evidence/authorization, then verify current applicability before delegation. `ISOLATED_AUTONOMOUS` and `PROTECTED_AUTONOMOUS` permit only independently verified and explicitly authorized target/scope. `DIRECT_NON_MUTATING_DISCOVERY` separately permits explicitly user-authorized procedural ordinary-page navigation/observation without requiring a replica or claiming PROTECTED_AUTONOMOUS verification; per-control safety classification, no arbitrary JS/API, mutations, forms/workflows or exports/downloads. `SUPERVISED_VISUAL` permits explicitly authorized passive human-controlled viewing only, never autonomous browsing. `UNVERIFIED` denies autonomous legacy access and page-content inspection when no applicable separate grant exists; technical `NOT_VERIFIED` alone does not negate a valid DIRECT_NON_MUTATING_DISCOVERY grant; sanitized offline evidence and dummy local tests may continue. A checkpoint, configured CDP, signed-in tab, fixture test, GET-only proxy or tool allowlist grants no authorization or independent enforcement. No credentials, mutations, raw private payloads or exports; retain D-29. Request manual human login only after the applicable gate/authorization clears. Do not require page-by-page human navigation as the autonomous solution.

## Business and quality gates

D-11..D-16, D-19, D-21 and related D-xx remain blocked for dependent behavior unless explicitly CONFIRMED with traceable approval. RPT-02 requires actual OPS-03 completion or a narrower approved source; OPS-04 billing type is merely proposed until verified otherwise. DRAFT accounting schema is not authorization for runtime finance. Validate auth, RBAC/branch scope, pagination, concurrency, responsive UI, targeted tests, guarded test-DB integration tests, lint/typecheck/build and independent review. No production/legacy DB operations or destructive migrations.

Stop when currently READY work is finished or blocked. Do not claim Dev 3 complete prematurely. Return exact persisted paths, active branch and SHA, completed vs unresolved tests, next executable slice, stakeholder decisions, and PR/review state.
