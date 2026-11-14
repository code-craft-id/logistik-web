# Legacy observation infrastructure and regression evidence

Implementation plan: docs/superpowers/plans/2026-11-14-legacy-observation.md. Canonical access modes/approval record: LEGACY-ACCESS-GATE.md. This run implements feasible local protection, not provider equivalence or external authorization.

## Fresh infrastructure facts

Read-only infrastructure audit on 2026-11-14: Docker/Podman unavailable; WSL2 kernel missing and no distributions; Microsoft-Hyper-V-All and Containers-DisposableClientVM disabled; WindowsSandbox.exe/Get-VM unavailable; hns running/vmcompute stopped. Chrome/Edge exist, but that is not browser/process/network isolation. Playwright cache has no browser runtime. Do not enable/reboot OS features or disrupt existing development server to imply a verified environment.

A Node24.15.0 executable is available at C:/Laragon/bin/nodejs/node-v24.15.0-win-x64/node.exe; use it for the standalone harness. Default PATH Node26 differs from application engines, so standalone test results must name the executable. No dependency/package changes are needed.

The explicitly documented backup C:/Development/backup/logistik-web contains a prototype frontend/backend, not an independently verified provider replica. Backend .env was not inspected; do not launch it or copy it wholesale. Existing presentation metadata and synthetic previews cannot establish legacy behavior. No provider-equivalent sanitized data/app image or external owner authorization was established.

## Implemented local boundary

`tools/legacy-observation/` hosts one bounded, schema-validated synthetic JSON fixture as immutable in-memory content. It has no upstream URL/proxy/DB/application integration or legacy credentials. The fixture is read once; routes cannot select other files. It binds loopback, validates Host, accepts only exact GET/HEAD views, escapes all fixture text and denies script/connect/form/frame behavior using response headers. It rejects mutation methods, request bodies/framing, unknown/traversal/query/absolute paths, CONNECT and WebSocket upgrades, and oversized/malformed inputs. Refer to tools README/tests for actual limits and commands.

This enforces the harness's own response/data surface only. It does NOT provide browser-wide egress isolation, an OS/filesystem sandbox around arbitrary tools, a real legacy application/DB replica, non-admin permission parity, external side-effect protection or an approved observation gate. The test fixture is explicitly SYNTHETIC_TEST_ONLY; no output is LEGACY_VERIFIED or OBSERVED provider behavior. Header/method/path restrictions are defense in depth, not sufficient live protection.

## Nonproduction proof procedure

1. Run the focused Node24 built-in test suite; it creates temporary synthetic data and real loopback HTTP/raw socket requests, including a local canary that must receive no forwarded traffic. Never substitute the provider URL.
2. Verify immutable deterministic reads/HEAD and content digest, escaping and schema bounds; verify mutation/body/Host/path/CONNECT/upgrade/header denial. Servers/sockets/temporary data must be cleaned up by tests.
3. Independent reviewer examines spec compliance, protocol handling, implementation limits and actual recorded results. Local QA is not external owner authorization.
4. Do not connect the configured legacy Chrome session to the harness or launch authenticated provider pages as a negative test. CLI accepts a fixture file, not a URL. No cookies/auth are needed for synthetic proof.

## Minimum external intervention to make autonomous provider discovery possible

Provide ONE owner-authorized, provider-equivalent environment with independently reviewed protection. Preferred: a sanitized read-only replica on an already usable VM/container/remote isolation host, with provider-equivalent app/rules and prepopulated synthetic cases, no production data/credentials, isolated integrations/queues, app/DB/filesystem protection, and browser network/bypass enforcement. An equivalent verified server-side read-only role/protected environment may qualify only with comprehensive all-path evidence; GET-only gateways do not.

The independent owner/security reviewer supplies exact environment/origin, provider-equivalence limitations, dedicated Chrome/profile/CDP identity, allowed read-only routes/interactions, privacy scope, nonproduction negative tests covering redirects/background requests/service workers/WebSockets/integrations/alternate access, configuration/artifact digests, reviewer/date and current explicit authorization/expiry/revocation terms. All required enforcement and legacy-owner authority remain external blockers here. A ready protected environment avoids asking the user to navigate pages manually or share credentials.

Then update the HUMAN approval record, re-evaluate effective mode, initialize the dedicated restricted browser/MCP binding, and request manual authentication only if required. Agent never reads/types credentials. Delegate approved observation to legacy_observer in D-15 report priority order, D-16 ticketing, then accounting/dashboard. No forms, mutations, exports or unreviewed interactions.

## Execution transition

PROMPT02 is synchronized and can immediately evaluate ready work without restarting DISC04. Product implementation cannot begin merely because preparation passes. SUP01 requires actual DISC04/D16 approval; RPT01 requires D15/D19 and stable source; RPT02 needs complete OPS03 or approved narrower source; FIN01/02 retain their financial/OPS04 gates. Current decisions remain TBD; no product slice is proven READY. PROMPT03 restores current target/mode/evidence/authorization facts and independently rechecks applicability, never auto-resurrecting permission.

## Actual regression/review results

Worker commit8c1a735e64b634ecf07a74d5c218adc41121bb58 imported as canonical commitb84e43bfc111ebf3d4c3faf77d4f078d81bc8bb4. Node C:/Laragon/bin/nodejs/node-v24.15.0-win-x64/node.exe --test tools/legacy-observation/server.test.mjs: PASS 5/5 real loopback groups, 0 failures, 452.3168ms on canonical checkout. Same executable --check tools/legacy-observation/server.mjs: exit0. Same executable node_modules/@biomejs/biome/bin/biome check tools/legacy-observation: exit0, 3 files clean. Worker recorded RED 1pass/4fail before implementing guards, then GREEN; initial test cleanup corrected a dummy server left open during RED. No legacy/DB/browser actions. Initial QA requested UNC/device-path correction; final result below records its resolution. These results do not qualify external autonomy or prove provider behavior.

UNC correction integrated as35ddaa47b473c67e0f253bd1a3297aa706b1c0aa (worker6aaa8dd). Canonical Node24 suite6/6,0fail,454.0125ms; syntax/scoped Biome PASS. Intercepted filesystem regression verifies rejected inputs cause zero I/O; no actual remote/device path tested. Scope explicitly excludes mapped-drive/junction/symlink trust and OS/browser egress enforcement. Independent scoped recheck at35ddaa47 RESOLVED the original sole P2; no remaining actionable spec/quality findings. No external approval claimed.
