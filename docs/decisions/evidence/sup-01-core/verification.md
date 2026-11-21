Current closure2026-11-15: **SUP-01 DONE for owner-accepted v1**. The following original SHA-specific checks remain unchanged; later lifecycle/extensions are SUP-02/SUP-03 and pre-merge findings DEV3-HARD-01. [Closure](../../DEV3-V1-CLOSURE.md). No tests rerun for this documentation-only acceptance.

# SUP-01 bounded core verification

Date: 2026-11-15 (Asia/Bangkok). Runtime code commit: **5575d1273ca210528f08af1406697b2baac3e752**, following implementation commit 08042c1972e04515cd47d233ec1a23f23ff5b70b. Base contract 4bef2d6239d627a19af55e1014ede860c97e27ed; actual Dev1 contract acceptance [review5908594183](https://github.com/code-craft-id/logistik-web/pull/10#pullrequestreview-5908594183).

## Delivered increment

Real Ticket persistence, create/list/detail, explicit priority, internal ID/UTC creation display, fresh server authorization and creator/current-branch scope, explicit admin behavior, bounded search/pagination, payload-bound replay protection, server actor/time provenance and deliberate read/error/empty/loading states. No finance or provider calls/imports. Later update/delete/status/approval/files/history/assignment/resolution remain deferred; full SUP-01 is not declared accepted.

## Commands and observed outcomes

Node executable pinned to C:/Laragon/bin/nodejs/node-v24.15.0-win-x64/node.exe; no dependency versions changed. All database commands first use the existing testDatabaseUrl guard, separate loopback logistik_web_test only.

| Check | Actual outcome |
| --- | --- |
| npm ci | PASS, 559 locked packages; five preexisting audit advisories retained below |
| Prisma generate / validate; Next typegen | PASS, installed Prisma 7.10.1 / Next 16.4.2 |
| node prisma/migrate-test.mjs | PASS; baseline21migrations reconciled then one additive Ticket migration,22 total; no dev/prod/legacy operation |
| npm run lint | PASS, 341 files, no fixes on final fullcheck |
| npm test | PASS, 50 files / 474 tests at code 5575d12 |
| npm run typecheck | PASS at code 5575d12 |
| npm run test:integration | PASS, 12 files / 104 tests at code 5575d12, final run 34.83s |
| npm run build | PASS at code 5575d12;68generatedroutes, ticket list/new/detail included |
| Impeccable changed-UI detector | PASS,[]; component markup unchanged by later route/footer classification fix |
| Independent code review | PASS, no P0/P1/P2; separate scoped lead route/footer follow-up PASS. No human code/staging/release acceptance inferred. |
| Applied migration checksums | PASS, all 22 applied SQL hashes match committedGit and workingbytes; oldmigrations unchanged |
| Native priority CHECK | Present and invalidpriority rejection proven by actualintegration |
| Guarded Prisma migrate diff | **EXIT2, known preexisting drift** in two Dev2 updated_at defaults; details below. Do not report global diffPASS. |

Tests cover anonymous/inactive/denied/unknown-resource administrator cases, own/current-scope rows/count/detail, multiple branches, missing/inaccessible IDs, fresh grant/scope after organization lock, active hierarchy evenadmin, forbidden actor/status fields, invalidURL/priority/limits, explicitDTOprojection, identical/mismatched/revoked replay, actual four concurrent same-token creates producing one row, priorityCHECK/FKRestrict, UI retry/pending/disabled/no-branch behavior and action-boundary sanitization. No mirror-only source assertions substitute for runtime behavior.

## Local production-build interaction and responsive proof

A production build was served only at 127.0.0.1:3021 against the guarded testDB, using two task-owned fake users and two fake branches. Actual browser interaction established:

- Anonymous ticket URL redirected to login; fakeowner login and permission-filtered Ticketing navigation succeeded.
- Unsafe javascript URL produced a sanitized validation alert, with zero inserted task tickets. Native required-branch validation also blocked incomplete input.
- Valid input with an explicitly selected branch/Normal priority created one actual record via Server Action, navigated to detail, and appeared in the owner's list with count 1. Internal ID/ISO8601UTC and inert relative URL were observed.
- Another creator with the same branch memberships/grants received the generic not-found response for that ID and saw an empty own list; no owner's subject/remarks was disclosed.
- Form/list/detail were manually viewed at exact emulated 375 touch, 768 and 1440 CSS px after waiting for actual content (not loading snapshots). No page-level clipped controls were observed; dense-table horizontal scroll is deliberate. Keyboard Tab reached its detail link from the Scrollable table region at 375.
- Persisted ticket routes show the existing operational footer; UI examples keep their preview disclaimer. No status/approval/upload/action controls invented.

Native screenshots were viewed in-session. File export to the newly attached worktree was denied by MCP configured workspace roots, so no PNG files are claimed or archived; no tool configuration or guard bypass was attempted. Mobile viewport changes reload the document, so fresh snapshots/content waits were used. Only local fake data was inspected; legacy page remained untouched.

Both local proof tabs and the owned server were closed. Only task-owned fake fixture rows were deleted; absence of those users was verified. No production/customer/provider data was involved, and no passwords/session tokens are retained in this artifact.

## Diagnosed failures and limits

Initial production build rejected a dynamic pathname read outside shell Suspense on the new detail route. The route-local instant=false export follows the existing transaction detail and the [official Next 16 guide](https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/migrating-to-cache-components.mdx), verified against installed 16.4.2 docs. Build subsequently passed. No shared prerender policy was changed.

One earlier full integration run during parallel build timed out starting an existing admin-seed transaction (P2028). The unchanged failing file passed 3/3 alone, then the full suite passed 104/104 without parallel build. Resource contention is an inference, not a proven exact mechanism. No unrelated timeout or seed code was changed. Verification repeats were bounded to failure isolation or actual source changes; no blind retry-to-green loop.

Schema diff reports DB default CURRENT_TIMESTAMP versus model @updatedAt / no explicit default for manifest_items.updated_at and delivery_sheet_items.updated_at. Existing migration 20261031000100 sets both defaults; sales.prisma declarations and this migration are unchanged from 4bef2d6. No Ticket managed-schema drift was reported; native CHECK was tested separately. Recommended separate Dev2/coordinator follow-up: preserve current DBbehavior by aligning model defaults after review; alternative is a reviewed forward migration removing defaults, which changes direct-SQL insertion semantics. No old applied migration was edited and no unrelated correction was folded into SUP.

The exact lockfile still reports five dependency advisories: Better Auth 1.6.23 and its transitive adapters, happy-dom 21.0.3 and devOptional fast-uri 3.1.8. Read-only specialist checked official upstream advisories/current auth config: risky OAuth/MagicLink/Proxy/device plugins are not enabled; UI tests use trusted local fixtures without attacker-controlled module evaluation. This is applicability evidence, not exploit testing or release clearance. Separate auth/CI dependency follow-up remains; no forced upgrade in this feature.

Staging, production migration and final human code/merge acceptance remain unexecuted. User instructs **no new PR until all agreed Dev3 work is finished**; code/evidence are saved on the feature branch without opening or repurposing a PR.
