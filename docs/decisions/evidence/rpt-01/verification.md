# RPT-01A verification —2026-11-15

IMPLEMENTED + LOCAL VERIFIED for the bounded nine-column non-financial report. Full RPT-01 remains PARTIAL for deferred parity. Code SHA723dce61309cc6157d2a374a2fba4220b9181ce1, basea26e8487bbe8d1b332c585e9fce0f66a7f61e169. Final documentation commits do not change this tested source. No new PR, merge or deployment.

## Scope and authority

Owner selected OptionA for scoped D15/D19/D22:9real-source fields, explicit UTC transaction dates,31day period, allstoredstatuses includingCancelled, no money/aggregates/export/billing filters. Formal named-approver record remains PARTIAL; explicit task-local selection persists without another approval question. Actual [Dev1 documentation review](https://github.com/code-craft-id/logistik-web/pull/10#pullrequestreview-5908964791) corrections implemented. Owner explicitly deferred Dev1/Dev2 code approvals to finalcombinedDev3PR for this and allfuturetasks; [standing workflow](../../../agent-policies/DEV3-REVIEW-WORKFLOW.md).

## Actual checks

Pinned Node24.15.0; Prisma7.10.1; Next16.4.2. No schema/migration/dependency changes.

| Command/check | Actual result at723dce6 |
| --- | --- |
| Worker service/filter RED | 8expectedfailures, typednonfunctionalservice +AWB51reviewcorrection |
| Worker UI/navigation RED | 4expectedfailures beforeimplementation |
| Focused npmtest RPT filters/service/navigation/page/UI files | 5files/70PASS6.70s |
| Targeted guarded test:integration report file | 7PASS3.35s |
| Worker installedBiome19ownedfiles | PASS |
| Lead rtk bypass npm run lint | PASS356files |
| Lead npm run typecheck | PASS |
| Lead npm test | 55files/544PASS70.26s |
| Lead npm run test:integration | 13files/111PASS38.47s |
| Lead temporary guardedhelper build (delegates next build) | PASS68routes; testURL validated before childenv, no dev/production DB mutation |
| Independent qa_reviewer a26e848..723dce6 | PASS noP0/P1/P2; readonly code/spec/test review, no testsrerun |
| Impeccable detector6changed reportTSX | [] PASS |
| git diff --check | PASS |

Full suite is RPT regression coverage for shared permission/navigation changes, not a repeated SUP acceptance task. No previous SUP result transfers to this codeSHA.

## Meaningful test evidence

- Fresh actor/report grant; transaction:view alone denied; emptyscope, allowedorigin/destination, permission/membership revocation, ACTIVEhierarchy, mixedinactive/active endpoints, adminhistorical/nullnull and validatedbranchoptions.
- Exact synthetic row/count reconciliation, UTC half-open boundaries, duplicate-date stablepaging, nullversuszero, Decimalstring DTO without financial/private fields.
- Real external writer commits after rows read/beforecount inside RepeatableRead: same response retains consistentoldrows/count, nextrequest seesnewrow. Test-onlyProxy coordinates realDBcalls, no productionhook.
- Literal AWB percent/underscore/backslash regression: actualunderscoreRED matched2rows instead1; escapingfix passesall3 without rawSQL. LibraryfirstContext7 [official versioned Prisma filtering docs](https://github.com/prisma/web/blob/v6/content/200-orm/200-prisma-client/100-queries/050-filtering-and-sorting.mdx) used with installed7 compatibility; latestv8 API deliberately not substituted.

## Actual local browser proof

ChromeDevToolsLab against local productionbuild127.0.0.1:3021, guarded logistik_web_test only, isolatedcontexts/fakecredentials/ownedfixtures. Legacy page1 untouched; no legacy content or images inspected/archived.

- Anonymous report redirectslogin. Fake report-onlyreader signsin and realGETform Nov1..15 returns exactly3of6ownedfixtures: UTCboundary, nullableAWB/quantities, Cancelled/zero. Otherbranch/nextday/nullnull excluded. Ninecolumns, no financialdata/detail links.
- Native images manually viewed1440/768/375touch CSSpixels: no page-level clipping observed; intentional internal table scroll preservesall9columns. Regionfocus+ArrowRight reachesrightmoststatus/quantities on375. TabfocusesNext andEnter loadsdistinctsecondrow/count3.
- Actual no-match AWBquery ->empty0. Invalid32day period ->fixedalert andbothdates preserved aftersettlednavigation. Immediatepre-navigation snapshot notusedasacceptance; no productbug inferredfromracinginputs.
- Separate fakeuser withtransaction:view/no reportgrant gets generic Aksesditolak/no reportdata. Mobile nav correctreportlink; EscapeclosesSheet/restoresfocus.
- Nativeimagesviewed only; no PNGexportattempt/archiveclaim. Ownedpages5/6closed, ownedserverstopped/no3021listenerverified. CapturedIDfixtures deleted (6transactions/2users/groups/branches/office/company), ownedusersabsenceverified. Temporaryhelper/metadataremoved. No pending jobs.

## Diagnostics and remaining limits

Initial RTK npm-lint wrapper expectedESLintJSON andfailed parsingBiomeoutput; documentedRTKbypass exposedactualcleanlint. No repository/configfix. Worker fixture corrections: shortenedtoo-longfakeAWB, selectedexactzero-fixture assertion, correctedmodelnameagainstsource. Ownedimportsorting/nullmarkup lint fixed, thenrelevantchecks passed. Repeats followedactualfailures/fixes, not blindloops.

Staging, physicaldevice/browsermatrix, finalhuman codeapproval/release NOTRUN/DEFERRED. Finalreview is not a developmentapprovalgate. Migrationdiff not rerun for schema-freeRPT; previouslyrecorded Dev2 timestampdrift anddependencyadvisories remainseparatefollowups. Missing-source columns/filters, exports andfinance deferred in [contract](../../RPT-01-contract.md). SUP01A unchanged/fullSUP PARTIAL. See [final review queue](../../DEV3-FINAL-REVIEW.md).
