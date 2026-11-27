# SUP/RPT follow-ups — verification and limits

2026-11-15. Owner explicitly selected “A — Setujui paket scope minimum”. SUP-01/RPT-01/RPT-02 accepted v1 remains unchanged in scope. SUP-02/SUP-03/RPT-05 are NOT NEEDED for this migration scope, not implemented. Five unsourced RPT-03 headers close with notes. See [scope and acceptance](../../DEV3-SUP-RPT-FOLLOWUPS.md).

## Code and independent review

Base cf75bb8469a56e8b69a1b32b51c334212653ee5b. Shared ticket-create lock/inventory7245649; RPT-03 baabe58; RPT-04 0130181; ticket-list snapshot8d25df18d900aa4d6459e20c849e0b6be6dba7cd. Final copy-only code **be1d2e60f9287e58e90945343a554c0146b3c0dc** removes migration jargon from two paragraphs in one UI file; no markup/control/query/authorization/schema/test/package change after8d.

One implementation_worker, sequential bounded slices; same independent qa_reviewer reviewed each diff read-only, all PASS/no actionableP0-P2. Final copy-only review PASS, prior conclusions retained for unchanged behavior. Agent QA is not Dev1/Dev2 or human merge approval. No new PR, merge or deployment.

## Actual checks

Pinned `C:/Laragon/bin/nodejs/node-v24.15.0-win-x64/node.exe`, Node24.15.0. Final full batch at **8d25df1**, session54452 exited0:

| Command | Actual result |
|---|---|
| `rtk bypass npm run lint` (PATH pinned Node24) | PASS382files |
| pinned Node npm-cli `run typecheck` | PASS |
| pinned Node npm-cli `test` | PASS63files/659unitUI,67.90s |
| pinned Node npm-cli `run test:integration` | PASS14files/127tests,47.35s; loopback logistik_web_test guarded independently from development target |
| pinned Node temporary helper `build` -> installed `next build` | PASS69routes, compile36.8s/types16.6/static6.3; child DATABASE_URL explicitly set to validated test URL |
| `git diff --check` | PASS |

After the **actual two-paragraph copy change** at **be1d2e6**, only affected checks repeated:

| Check | Actual result |
|---|---|
| pinned Node `node_modules/vitest/vitest.mjs run tests/ui/transaction-detail-report.test.ts` | PASS5tests,4.27s |
| targeted Biome check | PASS; initial line-wrap formatter finding corrected on this one file before commit |
| independent copy diff QA | PASS |
| Impeccable detector on changed report-view | `[]` PASS |
| guarded installed `next build` | PASS69routes, session68559exit0; compile18.8s/types7/static7.3 |

The659/127 results remain anchored to8d, not falsely transferred tobe1. Exact diff proves only those copy paragraphs differ; service/route/parser/permissions/tests/schema/packages are identical. No redundant full-suite repetition for wording.

## Focused RED/GREEN and meaningful source proof

- Shared-lock slice: real creator compatibility RED under exclusive lock, then18focusedunits/10guardedDB GREEN. Independent creator completes while first creator holds shared policy lock; existing exclusive writer forces actual wait, then grant/membership/branch revocation is rechecked and denies without insert. Same-token concurrency remains one-row. Shared lock still conflicts with exclusive policy writers and does not eliminate every5s timeout.
- RPT-03:25unit/UI and2DB RED ->115focusedunits/9DB GREEN. All9sortfields bothdirections, stored Decimal2vs10, nullable relations/scalars, deterministic ID tie paging, endpoint AND filters/current authorized options/hidden-scope exclusions and old URL/default compatibility. Operational reports reject all4transaction-only keys. Invalid queries cannot enable source reads; bounded display echo excludes forged/unknown/array/oversized values.
- RPT-04:16behavior RED plus missing-module/newDB RED ->81focusedunits/10DB GREEN; final serializer/UI24PASS. Fresh view+export/currentscope, noauto-grants; same snapshot/predicate/order/DTO, full result independent ofpage, take5001 and reject>5000 before serialization. Tests cover5000/5001, duplicateparams, revocation and source-to-CSV reconciliation, exact nine fields, trusted numeric strings/nulls/Unicode/quotes/newlines/control+formula prefixes, safe response headers and generic errors.
- List snapshot: actual external INSERT gated between actual row/count reads gave1row/count2 RED;2unitRED ->22unit/page and11guardedDB GREEN. Fixed RepeatableRead returns1/1, subsequent request sees2. Seven page tests prove login redirect/denied UI/admin-other-detail outcomes, not HTTP status-code assertions. Real administrator detail assertion also added.
- Deterministic gates, bounded timeouts, settled promises/finally restoration and exact captured-ID cleanup reviewed. No mocked database result is presented as real database proof.

## Actual local HTTP and native browser proof

Guarded temporary helper created only captured-ID synthetic fixtures in logistik_web_test: three fake users (view+export, view-only, export-only), two branches, four transactions. No real customer data. Production server at127.0.0.1:3021 used validated test URL; helper never printed cookies/password hashes or environment secrets.

Actual authenticated local HTTP proof at8d (export runtime identical atbe1): correct full filtered/sorted CSV despite page3/pageSize1; foreign/endpoint-excluded rows absent; formula prefix protected; content-type/attachment/private no-store/nosniff correct. View-only/export-only403; anonymous rejected by login boundary; forged branch403, duplicate parameter400,32day period400; no-match produces header-only200. 5000/5001 overflow boundary is unit/service proof, not a5001-row manual fixture. CSV protection follows [OWASP guidance](https://community.owasp.org/attacks/CSV_Injection); universal spreadsheet save/reopen safety is not claimed.

Final **be1** native Chrome Lab screenshots viewed in memory at1440,768,375touch: no page-level clipping observed, every control remains visible, wide table scrolling is internal. Native Shift+Tab focuses Next and Enter loads page2/item2 (Kilo12.34 versus2 on page1), preserving all filters and sort. At375touch invalid32day form submit and hard reload retain both dates, origin, search, pageSize1, Kilo and descending direction; error is visible, result/export link absent. Correcting only the end date recovers descending result/page1 without re-entering the other controls. No screenshot files archived; no physical-device/native Excel-save/screen-reader claim.

Owned pages2/3 closed, both server sessions88566/43173 intentionally stopped, exact fixtures deleted and owned-user absence verified. Temporary helper/metadata removed, port3021 has0listeners. Original authorized legacy page1 retained; no business mutation/export/download/JS/API used there.

## Remaining limits

Staging, final Dev1/Dev2 combined-PR review, human acceptance and release are separate NOT RUN/queued gates. No new schema/migration/dependency/operational producer/financial rule. Migration-diff rerun not needed for this schema-free patch; existing drift not repaired. Known pg8.23 queued-query deprecation remains nonfatal with unproven exact producer; no guessed upgrade/fix. Vendor attribution, provider support workflow/files and five unsourced headers remain unimplemented by owner-approved scope reduction, never called IMPLEMENTED.
