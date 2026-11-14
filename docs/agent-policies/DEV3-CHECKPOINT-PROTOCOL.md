# Dev 3 Persistent Checkpoint Protocol

## Purpose and authority

Codex chat context can be compacted, restarted or lost. The authoritative continuity record for this project is **files on disk in the active repository/worktree**, not the model's memory or a final chat summary. Use this protocol for DISC-04 and every DEV3 ticket. This protocol authorizes only project documentation writes in `docs/agent-state/dev3/`, not business changes or access to the legacy application.

## Paths and responsibilities

`docs/agent-state/dev3/` is **tracked project documentation**. It must not be stored only inside ignored `.agents/`, `.codex/`, system temp directories or a disposable agent worktree. Verify `git check-ignore` and `git status` before relying on persistence; if ignored, correct location or explicitly report why persistence is blocked. Commit scoped checkpoint files to a safe feature branch when permitted, and make their status visible in PRs. A local-only uncommitted change survives context compaction but is not portable between machines or necessarily between isolated worktrees.

- `STATE.md`: CURRENT snapshot, edited in place, short (ideally <= 800 words). Current repo branch/SHA, active ticket/vertical slice, worktree status, path ownership, progress categories, validation SHA, unresolved blockers, access gate, next action.
- `RUN_LOG.md`: append-only, chronological, compact event log for delegation, implementation, tests, reviews, decisions, incidents and handoffs. Each entry includes real UTC/local time if known; `UNVERIFIED` otherwise; branch/SHA and evidence links as applicable. Do not rewrite previous events to make them look successful.
- `DECISIONS.md`: D-ID registry with source reference, exact status (`CONFIRMED`, `OBSERVED`, `TBD`, `BLOCKED`, `PARTIAL`), required human owner/approval and consequences. Never promote a business decision without real stakeholder evidence.
- `DISC-04.md`: evidence-linked discovery conclusions, separating repo/code facts from provider observations and unknowns.
- `REPORT_CATALOGUE.md`: one entry per report, actual vs missing columns, filters, semantics, data queries and reconciliation evidence.
- `HANDOFF.md`: <= 500 words; current checkpoint summary, pending subagent/test statuses, exact next safe command/task and files to read. Written for a fresh context with no previous chat history.

## Checkpoint triggers (REQUIRED)

Lead writes a checkpoint:
1. At preflight before dispatching subagents.
2. On receipt of meaningful subagent results, including blockers and contradictory evidence.
3. Before starting and after completing an implementation slice, substantial patch, or review.
4. After running tests (record **command, exit/result, environment, exact code SHA**; do not call tests passed when only dispatched).
5. Before substantial context compaction, intentional handoff, chat ending, or branch/worktree switch when possible.
6. Immediately when a safety concern or `BLOCKED` decision is discovered.

Only **lead agent** writes shared memory files. Subagents return findings and evidence, not competing modifications to these paths. If workers have isolated worktrees, lead consolidates verified results into the canonical branch. Use careful write replacement for `STATE.md` / `HANDOFF.md`, append to `RUN_LOG.md`, and do not clobber unrelated edits. Inspect `git diff` / `git status` after writing. Make checkpoint commits atomic and scoped; do not auto-merge or deploy.

## Exactness and safety

For every status, distinguish `DONE`, `WIP`, `BLOCKED`, `UNVERIFIED`, and pending. Never mark asynchronous work finished from intention alone. A test result applies only to the code commit/worktree actually tested. A prior commit SHA is not evidence for new changes. `OBSERVED` provider behavior is not business approval. `LEGACY-ACCESS-GATE.md` is a separate **human/security-controlled** document; the lead must never self-approve or automatically change its `NOT_VERIFIED` status.

Never store credentials, cookies, access tokens, raw private network payloads, customer PII or screenshots forbidden by D-29. Store sanitized route labels or relative paths as evidence, not personal records. In any failure to write, mark `PERSISTENCE_BLOCKED` in the chat response and provide copyable concise checkpoint content; do not claim the file exists.

## Resume order

1. Read `HANDOFF.md` then `STATE.md`.
2. Verify actual `git status --short`, branch and HEAD; confirm any pending PR/review and current PRD/ROADMAP decision state.
3. Use relevant sections of `RUN_LOG.md`, `DECISIONS.md`, `DISC-04.md` and `REPORT_CATALOGUE.md` to reconcile. Old log entries cannot overrule current code.
4. Continue only the smallest READY safe task; note discrepancies as `UNVERIFIED`.
5. Update the checkpoint again before the next context ends.

## Mode-aware restoration

Persist requested and effective observation modes, exact target/session, enforcement code/config/artifact evidence, independent verification, authorization scope/reference/expiry and remaining gaps. Four canonical modes live only in LEGACY-ACCESS-GATE.md; legacy NOT_VERIFIED maps to UNVERIFIED. Restoring STATE/HANDOFF or a previous approval does not grant, extend or resurrect authorization. Recheck identity, enforcement applicability and current scope on resume; missing/stale/contradictory facts fail closed. Local fixture tests cannot activate a provider-equivalent target. Only an independent human can approve the external gate; agent may amend mode definitions within authorized scope without changing the approval record.
