# RPT-02 v1 verification —2026-11-15

**DONE — source-backed v1 implemented and locally verified** under the owner's explicit
instruction to recommend and implement appropriate RPT-02 behavior through completion.
Scope is the [contract](../../RPT-02-contract.md), not a claim of full legacy parity.

Implementation `d90b993007e8b013b95b8c3bed3ebdd5f7915adf`; navigation-test correction
`2f541603c1971dca96ea39b94bd1a20a88f32829`; final runtime/UI fix and tested HEAD
**`9b76457d804d7fbc385a965144f8c6ae0fb5fe8c`**. Base `e68de09`. No schema,
migration, dependency, operational mutation, SUP or RPT-01 implementation changes.

## Delivered versus explicitly unavailable

- Manifest report: owning-branch scope, actual stored identifiers/date/type/status,
  vehicle/courier references and privacy-filtered active assignment count.
- Delivery: one row per eligible existing DRS, plus an explicit per-transaction outcome
  view; intersection of manifest-owner and transaction scope, released history retained.
- Dashboard: raw scoped transaction/manifest/visible-DRS/item counts with per-card date
  basis and branch meaning. No financial, success/progress or invented legacy formulas.
- Vendor direct route: protected, honest unavailable state; leaf remains unlinked.
  **Vendor attribution/report is NOT implemented.** Actual source has no association;
  RPT-05 defines the separate capture/mapping/report follow-up, not a directory substitute.
- DeliverySheet generation/OPS-03 completion, finance, export and extended legacy totals
  are not claimed. Existing persisted operational data is the selected narrower read source.

## Actual final checks

Pinned Node24.15.0 / Next16.4.2 / Prisma7.10.1. Final lead checks ran sequentially at9b76457,
with test DB operations guarded to loopback `logistik_web_test`; production build child
received the validated test URL only after the guard passed. No production/legacy DB use.

| Actual command/check | Result |
| --- | --- |
| Worker TDD | Filter6, service5, UI/nav6 expected RED failures, plus unavailable-vendor negative regression |
| Initial focused RPT tests | 5files/18PASS,3.96s; guarded integration8PASS,2.82s |
| Stale existing administrator-nav assertion | Root full suite found561PASS/1failure; new Dashboard was incorrectly expected unavailable. Test-only correction asserts3new live routes and preserves unavailable/ordinary-denial assertions; targeted2files/5PASS |
| Real browser invalid-form regression | Discarded valid dates/branch/search/pageSize on invalid period; fresh SSR RED1fail/7pass, display-only fix then UI/page2files/9PASS |
| Final `rtk bypass npm run lint` | PASS377files |
| Final `npm run typecheck` | PASS |
| Final `npm test` | 60files/565PASS,105.00s |
| Final `npm run test:integration` | 14files/119PASS,69.78s |
| Guarded temporary helper delegates installed `next build` | PASS68routes; compile44s/typecheck15.8s/staticgeneration8.0s |
| Independent qa_reviewer full source/test review | PASS noP0/P1/P2 on d90 +2f; subsequently identified the actual browser P2 and scoped9bfix review PASS |
| Impeccable detector | Initial15changedreportTSX `[]`; final2UI-fix components `[]`, PASS |
| `git diff --check` and protected-source comparison | PASS; UI fix leaves parser/adapter/service/auth/RPT01/schema/dependencies unchanged |

Repeats followed actual failures/changes: outdated navigation expectation, then a genuine
browser-discovered SSR error-state bug. No blind framework/dependency fixes or repeated
approval/discovery loop. Broad suite covers shared new permission/navigation/dashboard
regression; it is not a reopening of completed SUP/RPT-01 acceptance.

## Meaningful guarded database cases

Eight report integration cases verify manifest owning branch rather than geographic IDs;
delivery manifest-owner AND transaction intersection; released-history retention; DRS
versus item row units; hidden/deleted sources and admin/null cases; ACTIVE memberships
and permission revocation; literal LIKE wildcard escaping, UTC boundaries and paging.
An actual external writer commits between dashboard count reads; the response remains
one RepeatableRead snapshot. This is coordinated by a test-only wrapper, not a mocked
database result or production hook. No invented outcome/status bucket calculations.

## Actual browser/source reconciliation

ChromeDevToolsLab, local production build127.0.0.1:3021, isolated contexts and owned fake
users/data only. Expected/observed counts: **2 transactions /2 manifests /1 DRS /2 items**.
Foreign owning branch with allowed geographic endpoint stays hidden; active manifest
assignment counts are0/1 after hidden/released exclusions. DRS shows2 eligible items;
DELIVERED released history appears with actual completionNov16 under sheet-dateNov15.

Real GET form, dashboard drill-down links and delivery-view switching work. Native images
manually inspected for dashboard, manifest, DRS, item and vendor-readiness surfaces at
**375touch/768/1440 CSSpixels**: no page-level clipping observed. Deliberate internal table
scroll retains all columns; focused ArrowRight reaches received-by/notes; Tab focuses Next
and Enter loads a different item while preserving count/view. Native images were viewed,
not exported or archived; no PNG evidence is claimed.

No-match AWB yields empty state. Invalid32-day period is rejected. Browser exposed the
original error-state clearing bug; final9bproof repeats real submission, hard reload and
375touch capture: both dates, authorized branch, search and pageSize1 remain intact.
Changing only end date/clearing search recovers a valid report without re-entry.
Unknown/duplicate/oversized/forged display values are excluded by fresh SSR tests; invalid
parsing remains invalid and cannot enable source queries.

An isolated fake user with operational manifest/delivery grants but no report grants gets
generic denial on dashboard/manifest/delivery/vendor routes, no source data, and a working
profile escape. Mobile Sheet exposes only authorized real report links; unavailable vendor
is not linked. Escape closed the Sheet; final focus restoration was not separately captured.
Table/pagination keyboard focus was directly observed. No physical-device/screen-reader claim.

Owned pages7/8 and final10 closed; both local servers stopped and port3021 listener absence
verified. Captured-ID fixtures cleaned twice, owned-user absence verified. Temporary helper
and metadata explicitly removed. No pending agent, test, DB fixture, local server or browser job.

## Targeted legacy evidence and diagnostics

Accepted DISC04/catalogue reused. Only vendor mapping gap revisited under canonical DIRECT
scope,2026-11-15 05:05:14–47UTC, existing authenticated page1 `/index.php/manifest-vendor`:
placeholders/heading only, no exposed result/query button/detail mapping. No selections,
mutations, JS/API, exports, private identities or screenshots. This is a bounded view limit,
not global legacy absence. Original legacy tab remains open; local fake proof was separate.

Pinned pg8.23 emitted a nonfatal queued-client.query deprecation during integration and
local server use; tests/build/queries succeeded. One isolated trace test passed without it;
installed source confirms the warning category, exact producer remains unproven. No guessed
root cause, dependency upgrade or suppression. Track adapter/driver compatibility in final
hardening before a future pg9 upgrade. Current report service calls are sequential.

Staging, physical devices/browser matrix, final human code review and release remain separate
**NOT RUN/queued** work. Dev1/Dev2 review is final-PR review, not a development gate. No new PR,
merge/deploy, migration-diff rerun or old advisory/drift repair is implied by this schema-free ticket.
