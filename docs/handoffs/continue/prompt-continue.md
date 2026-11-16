# Dev 3: Evidence-Driven Legacy Migration & Modernization

Continue the interrupted Dev 3 implementation previously performed by OpenAI Codex.

Repository: `C:\Development\logistik-web`

Historical handoff:
- `docs\handoffs\continue\chatgpt log.md`
- `docs\handoffs\continue\Pasted text.txt`

Follow the repository's `CLAUDE.md` and `AGENTS.md`.

## Mission

Complete and refine Dev 3's implementation by systematically comparing the existing application against the legacy logistics management system.

The objective is **functional and business-semantic parity with the legacy system, selective modernization where justified, and architectural readiness for future mobile integration**.

Do not blindly reproduce legacy implementation details, redundant interfaces, poor UX, or known bugs.

Do not sacrifice established business behavior, data correctness, or authorization for modernization.

This mission starts with RPT reporting migration and continues through the remaining Dev 3 roadmap workstreams. Do not assume that finishing RPT means finishing Dev 3.

## 1. Recover the interrupted work

- Inspect Git HEAD, active branch, working tree and unfinished changes.
- Read the latest Dev 3 checkpoints, ROADMAP, PRD, decisions, RPT audit and implementation contracts.
- Read the final portion of the Codex log first; search earlier sections only when necessary.
- Use the original pasted prompt to recover the migration requirements.
- Treat existing repository evidence as the implementation baseline.
- Do not repeat completed discovery or overwrite previous work.

Verify unfinished tests, builds and persistence checks before continuing.

## 2. Evaluate legacy versus modern behavior

For every Dev 3 feature, especially LP-R01 through LP-R22:

Compare the actual legacy behavior with the current implementation across:

- Navigation and functional identity.
- Source data and record relationships.
- Business rules and workflow transitions.
- Role permissions and branch isolation.
- Filters, date boundaries and statuses.
- Table data, grouping, sorting and totals.
- Financial calculations where applicable.
- Export and print structure.
- Error handling and empty states.
- UI usability and operational workflows.

Use existing evidence first. Perform targeted read-only legacy observation only when necessary.

Do not infer equivalence from matching labels, routes, fields or screenshots.

Maintain explicit distinction between observed behavior, source-backed implementation and verified parity.

## 3. Classify migration decisions

For every meaningful discrepancy, determine whether to:

**PRESERVE:** Legacy behavior is correct and business-critical. The modern implementation must reproduce its semantics.

**REFINE:** The modern implementation is functionally equivalent but can improve maintainability, usability or performance without changing its business meaning.

**CONSOLIDATE:** Multiple legacy features are demonstrably redundant. Preserve required report identities and user-facing workflows while safely sharing internal implementation.

**CORRECT:** The legacy behavior contains a verified defect. Implement the correct behavior and document the intentional deviation.

**DEFER:** Authoritative source data, historical evidence or a genuine business decision is missing. Do not fabricate behavior or claim completion.

Do not silently replace established behavior with assumptions.

Record modernization decisions and their evidence in existing project documentation.

## 4. Complete RPT implementation

Migrate all 22 legacy reporting identities.

Prioritize complete, independently verifiable vertical slices over broad scaffolding.

Each implemented report must have appropriate source-backed queries, validated filters, authorization, operational data presentation, export/print behavior and focused regression tests.

Investigate the missing sources identified by the previous audit.

Where new data capture is genuinely necessary, design the smallest backward-compatible extension consistent with existing domain ownership.

Do not invent historical values, financial formulas, statuses or source relationships.

Do not consider navigation-only or synthetic-preview implementations complete.

Preserve the distinction between functional implementation, verified parity and intentional documented deviations.

Once the RPT workstream is completed to its acceptance criteria, follow the remaining Dev 3 ROADMAP workstreams, including FIN-related work where assigned.

Do not silently expand Dev 3's authority into other developers' owned domains.

## 5. Cross-developer consistency

The project contains work from three development workstreams that will eventually be integrated.

Review relevant shared contracts before modifying functionality that depends on another developer's domain.

Prefer reuse of authoritative shared models, domain services, validation rules and authorization mechanisms.

Do not duplicate financial, transaction, shipment or reporting business logic merely to complete a local feature.

When cross-domain changes are necessary:

- Identify the owning domain.
- Identify the required contract or schema change.
- Evaluate compatibility with existing consumers.
- Implement only changes within authorized ownership.
- Document unresolved integration dependencies.

Avoid unnecessary refactoring of other developers' code.

## 6. Future mobile readiness

The web application is expected to support a future mobile client that may have a different frontend architecture.

Prepare for this without implementing the mobile application now.

Ensure business-critical rules are not dependent on web UI behavior.

Prefer reusable server-side domain services and explicit data contracts.

Evaluate existing API boundaries for:

- Authentication and authorization.
- Branch and role scoping.
- Transaction and shipment workflows.
- Reporting queries and export operations.
- Pagination, filtering and error semantics.
- Stable identifiers and structured data types.

Where an existing application service is web-specific, identify whether an API adapter can expose its functionality without duplicating business rules.

Do not introduce microservices, new infrastructure, speculative APIs or a major architectural rewrite unless a verified requirement justifies them.

Mobile UI parity is not required. Shared business semantics and integration compatibility are the goals.

## 7. Implementation discipline

Apply the established engineering principles:

- Think before coding.
- Minimize assumptions.
- Prefer simple maintainable solutions.
- Make surgical changes.
- Define measurable acceptance criteria.
- Test actual behavior.
- Preserve existing functionality.
- Avoid unnecessary context and tool usage.

Do not repeatedly troubleshoot an unavailable MCP or browser when usable evidence and independent implementation work already exist.

When one report is blocked, continue another source-ready slice.

Escalate genuine business decisions rather than inventing rules.

## 8. Verification

Use focused tests for each implemented feature.

Verify relevant combinations of:

- Data inclusion and exclusion.
- Branch isolation and RBAC.
- Date and status semantics.
- Sorting, pagination and totals.
- Export structure and consistency.
- Financial correctness where applicable.
- Regression against existing functionality.

Use sanitized observations and controlled test fixtures.

Do not modify legacy production data or rewrite applied migrations.

Run final integrated quality gates when meaningful implementation batches are complete.

## 9. Progress and continuity

After each completed implementation slice, persist:

- Completed feature/report IDs.
- Verified legacy evidence.
- Modern implementation status.
- Intentional deviations and reasons.
- Source and decision dependencies.
- Tests actually executed.
- Modified files and Git state.
- Next executable work.

Use existing Dev 3 checkpoints and audit documents rather than creating parallel tracking systems.

Never mark a report as fully migrated solely because it renders successfully.

Do not repeatedly rewrite documentation without implementation progress.

## 10. Completion criteria

The Dev 3 migration is complete only when:

1. Every in-scope legacy function has a verified modern implementation or an explicitly approved deviation.
2. Redundant functionality has been evaluated without losing business behavior.
3. Known legacy defects have been handled intentionally.
4. Operational, reporting and financial semantics remain correct.
5. Existing authorization and regression tests pass.
6. Cross-developer contracts are compatible or have clearly documented unresolved dependencies.
7. Business logic is structured for reuse by future web and mobile clients without unnecessary architectural changes.
8. All acceptance criteria assigned to Dev 3 in the current ROADMAP have been addressed.

If authoritative data or approval is unavailable, clearly identify the remaining blocker. Never claim complete migration without the required evidence.

Do not push, merge, deploy or modify legacy production data.

Begin by recovering the interrupted state, then continue the next executable RPT implementation slice. Prioritize working software and verified parity over planning-only deliverables.