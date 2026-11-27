# RPT-02 operational reports implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development with TDD and independent QA.

**Goal:** complete source-backed RPT02 v1 under explicit owner implementation delegation.
**Architecture:** reports-owned read service/DTO/commonfilteradapter and source-specific
manifest/DRS/item/dashboard views; one writer, no operational/schema mutation.
**Tech Stack:** installed Next16.4.2/React19.3/Prisma7.10.1/PostgreSQL/Zod4/Tailwind4/Vitest.
**Spec:** `docs/decisions/RPT-02-contract.md`.

## Global constraints

No Dev1/Dev2 preimplementation gate/newPR/merge/deploy. Actual source/evidence only;
no financial/statusbucket/vendorjoin invention, no schema/deps/sharedtokens/SUP changes.
UTC31days, literalsearch50, pages1..1000/size<=100; freshACTIVEactor/reportpermissions,
ownerbranch manifest scope and intersection delivery scope; RepeatableRead consistent
rows/count. Vendor state is explicitly unavailable, real attribution RPT05follow-up.

## Review focus

Manifest scope must not accept origin/destination in place of owner branch. Delivery
must enforce both scopes and preserve released history. DRS grouping must not count
hidden/deleted items. Dashboard counts/datebasis must match report definitions without
derived legacy KPI claims. Permissions, navigation, footer and no-grant escape must
be correct; tables/filters/states usable on375/768/1440 andkeyboard.

## Task1 — complete RPT02 read-only vertical slice

Worker allowed writes:
- `src/features/reports/operational/**` for contracts/filteradapter/context/service/UI.
- exact existing manifest-outbound/delivery/manifest-vendor route directories under
  `src/app/(dashboard)/branch-reports/` (page/loading/error only; no newdetailroute needed).
- `src/app/(dashboard)/dashboard/page.tsx` and route-local loading/error if needed.
- narrow inventory/restriction additions in `src/features/identity/permissions.ts`;
  exact route mapping `src/components/shell/accessible-navigation.ts`; exact operational
  footer classification `src/components/shell/app-shell.tsx`.
- `tests/unit/operational-report-*.test.ts`, `tests/ui/operational-reports.test.ts`,
  `tests/integration/operational-reports.test.ts`.
Lead owns all documentation/checkpoints. Do not edit RPT01 parser/module; reuse it.
No other files unless lead approves exact extension. No concurrent writers.

- [x] Verify branch/main/state and persist before delegation.
- [x] Independent source/evidence and targeted vendor-only legacy observation complete.
- [x] Lead selects recommended A under explicit user delegation; defines vendor limitation.
- [x] Worker RED service/filter/UI/security tests, then minimal actual implementation.
- [x] GREEN focused tests and guardedDB source/scope/snapshot reconciliation, ownedcleanup.
- [x] Worker self-review/commit exactownedpaths; leadcheckpoint immediately.
- [x] Independent full RPT02QA, one scoped fixwave if needed, relevant testsrerun.
- [x] Lead final sequential lint/typecheck/unitUI/DBintegration/build at actualcodeSHA.
- [x] Real local fake browser375/768/1440/keyboard/permitted/denied/empty proof; cleanup.
- [x] Record accurate v1 DONE, RPT05/extendedparity followups, push/checkpoint; no newPR.

## Preflight/ledger

| Shared interface/task | Check | Ruling |
| --- | --- | --- |
| Task1 filters/RPT01 reuse | Delivery view discriminator vs strict parser | Strip/validate only explicitview then reuse common parser, no acceptedRPT01 changes |
| Task1 manifest/delivery source | Owner scope versus item intersection | Distinct predicates, no guessed common entityscope |
| Task1 DRS/items/dashboard | Count row units/datebasis | Explicitdefs and same source scope/snapshot, no statusderivedformulas |
| Task1 vendor | Existing page but missing attribution | Honestreadinessstate+RPT05; not claimed workingvendorreport |
| Task1 auth/UI/tests | One writer shared mappings | Narrow3resources/restrictions and exact4routes, no automaticgrants |

Baselinee68de09; freshmainc406502. Existing isolatedworktree reused on new
feat/rpt-02-operational-reports branch. Prior testresults not transferred to new code.
Impeccable context already ran once; PRODUCT historicalfacts yieldcurrentPRD/source,
worker reads DESIGN.md/full craft-floor beforeUI. No hook/config repair or new design.
`nPreflight source correction: actual DeliverySheet has NO status field; omit status, no derived lifecycle. Courier shown is manifest.courier, labelled Kurir manifest, not deliveredBy(User) or Driver. Verified sales.prisma253-285 before dispatch; contract corrected.

Implementationd90b99328ownedfiles, focused18/DB8/lint28/typecheckPASS. Actualfullsuite exposedoldadminnavnegative/dashboard; narrowextraallowedpath tests/unit/accessible-navigation.test.ts correctedpositive3liveroutes/preservedunavailable/denials in2f5416, targeted5PASS. No runtimechange. IndependentfullQA+scopedtestreviewPASS noP0/P1/P2. Detector15TSX[]PASS. Leadfinalqualitysession44819inprogress, no completedbuild/browserclaimyet. Vendorleafunlinked/directguardedreadiness, notworkingvendorattribution; RPT05retained.

Final9b76457 actual565unitUI/119DB/lint377/typecheck/build68routesPASS; independentfullQA+scopedP2fixreviewPASS. Real localsourcecounts2/2/1/2 and15nativeviews3757681440/keyboard/denied4routes/emptyPASS. BrowserP2invalidinputclearing reproducedfreshSSR, fixedonlydisplaywhitelist3files, SSR9PASS andactualsubmit+hardreload+375proofpreservedall5fields, validrecoveryPASS. Bothownedfixturecycles/tabs/servers/helpermetadata cleaned. Finaldocs/push/checkpoint captureDONEv1scope/vendorRPT05 andknownpgdiagnostic; no further source change/retests/approvalgate. FinalSheetfocusrestorationnotseparatelycaptured; escapeclose+tablekeyboarddirectlyobserved.
