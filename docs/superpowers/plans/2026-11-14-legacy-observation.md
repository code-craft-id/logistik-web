# Legacy observation preparation: bounded implementation plan

Spec: user's current PROMPT01 (resolve blocker with feasible local protections, independent authorization preserved). This plan consumes completed DISC04; no repeated product discovery. User explicitly selected autonomous implementation and preferred isolation; local choices below implement feasible preparation without inventing provider equivalence.

Goal: ship a tested immutable synthetic-fixture harness plus one canonical mode-aware access contract and synchronized execution/resume entrypoints. It must not claim live protection or provider discovery. No usable Docker/Podman/WSL/HyperV/Sandbox exists; no reviewed replica/provider source supplied. Prototype backup is not the oracle. Do not install/enable OS infrastructure, launch backup backend or contact live provider.

Approaches: real replica is preferred but unavailable; a forwarding gateway cannot be verified without upstream route/side-effect authority; choose dependency-free local fixture protection now and retain exact external blocker. CSP/GET-only are defense in depth, not browser-wide isolation. This is NOT an approved provider-equivalent replica.

## Global constraints
- Preserve unrelated .gitignore/AGENTS/prisma seed changes and existing dev server. No product feature/schema/migration/DB/integration/live provider access.
- Only independent human/external owner can authorize provider-equivalent access; technical reviewer can verify local tests but cannot grant external permission. Never enter/read credentials or raw private payloads.
- ISOLATED_AUTONOMOUS/PROTECTED_AUTONOMOUS require independently verified protection and exact authorization. SUPERVISED_VISUAL never permits autonomous navigation. Unknown/legacy NOT_VERIFIED -> UNVERIFIED. Current mode remains UNVERIFIED.
- Lead sole writer shared six checkpoint documents. Worker owns only tools/legacy-observation/** in isolated worktree. No worker subagents or shared-policy edits.

## Task 1: immutable offline fixture harness (implementation_worker)
Files: tools/legacy-observation/server.mjs, server.test.mjs, fixture.synthetic.json, README.md. No dependencies/package lock changes. Use Node builtins; run with available C:/Laragon/bin/nodejs/node-v24.15.0-win-x64/node.exe.
API: startObservationServer({ fixturePath, port = 0 }) -> Promise<{ server, origin, digest }>; always bind 127.0.0.1, never configurable upstream/host. CLI: node tools/legacy-observation/server.mjs <fixture-json-path> (ephemeral port; print only loopback origin/hash/synthetic status).
- Read one bounded regular JSON file once at startup, validate strict synthetic schema {provenance:'SYNTHETIC_TEST_ONLY', title:string, columns:string[], rows:string[][]}; reject unknown fields, missing/malformed/oversized data, inconsistent row widths. Bound file<=64KiB, title/each cell<=500chars, columns<=20, rows<=100. No real records/provider HTML or downloaded assets.
- Snapshot validated fixture in memory with SHA256; subsequent file edits cannot change served bytes. No filesystem routes, DB, upstream/redirect/proxy/outbound clients or child processes. Render all labels/cells escaped as inert text. Only exact GET/HEAD / and /fixture.json. No arbitrary URLs, paths, query strings, percent traversal or assets.
- Reject foreign Host/DNS-rebinding headers, request bodies/transfer framing, mutation methods, CONNECT and WebSocket upgrades, malformed/oversized headers. Bound headers/timeouts. CSP deny scripts/connect/forms/base/objects/frames with sandbox, no-store/nosniff/no-referrer. No cookies/CORS/telemetry/raw request logs.
- README states exact guarantees and gaps: local server is immutable/no forwarding; browser egress/OS/filesystem sandbox and provider-equivalent evidence/authorization are NOT established. Fixture tests NEVER prove legacy parity or enable autonomous live mode. Never type live URLs into CLI or reuse auth context.
TDD: write behavioral/negative tests first; record RED command/output then GREEN. Tests exercise real loopback HTTP/raw sockets: deterministic reads/HEAD, provenance/hash/escaping, snapshot immutability, malformed/oversized fixtures, traversal/absolute URL/query/unknown routes, foreign Host, POST/PUT/PATCH/DELETE/OPTIONS, bodies/framing, CONNECT/WebSocket/oversized header rejection; local canary server must receive zero forwarded traffic. No production network. Close all servers/sockets and temp files.
Verify: node --test tools/legacy-observation/server.test.mjs, node --check server.mjs. Test required Node24; optional Node26 compatibility not necessary. Stop when tests pass. Commit only own tools directory; report commit SHA/test evidence/limitations to lead and write .codex report path supplied in dispatch.

## Task 2: canonical modes and execution/resume contracts (lead)
Paths: docs/agent-policies/{LEGACY-ACCESS-GATE,LEGACY-READONLY,DEV3-OPERATING-CONTRACT,DEV3-CHECKPOINT-PROTOCOL}.md; docs/agent-prompts/01..03. Local ignored orchestrator skill synchronized only by reference, never sole authority. External kit prompt entrypoints become thin references to repo canonical copies, avoiding divergent policy copies. Do not alter current approval status/reviewer/scope or claim verification. Distinguish policy metadata from actual enforcement.
Tests: semantic contract checks for all four modes, UNVERIFIED default/alias and non-authorization restore rule; manually inspect changed sections. No new product behavior.

## Task 3: integration/review/readiness (lead + independent qa_reviewer)
Copy/cherry-pick worker's tools-only commit without affecting dirty setup; run focused Node24 tests once on canonical checkout. Independent QA reviews spec compliance/security/code quality and policy changes. Fix in-scope findings through same worker and recheck. Update six checkpoints, access/regression evidence and exact ticket readiness. SUP01 remains blocked unless D16 and DISC04 evidence actually clear; no false next implementation. Commit scoped preparation; no merge/push/deploy.

## Preflight conflict scan
| Pair / task | Produced vs consumed | Ruling |
| --- | --- | --- |
| Task1 vs Task2 | Synthetic harness guarantees vs autonomy eligibility | Local tests cannot qualify external/provider gate; explicit UNVERIFIED retained. |
| Task1 vs Task3 | Tools-only worker commit vs integration/review | Disjoint writes; lead only integration/checkpoints; no worker policy edits. |
| Task2 vs Task3 | Canonical modes vs restored execution state | Restoring facts cannot grant authorization; legacy alias denied. |
| Task1 internal | Synthetic rendering vs actual legacy observation | Fixture labeled synthetic; no fallback upstream; never oracle evidence. |
| Task2 internal | New modes vs human-controlled gate | Amend definitions, preserve NOT_VERIFIED human approval record and NONE scope. |
| Task3 internal | Immediate execution vs business prerequisites | Prepare PROMPT02 now; implement only genuinely READY slice, none inferred from tooling. |
