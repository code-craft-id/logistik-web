# RPT-02 — source-backed operational reports v1

**DONE — delegated source-backed v1, implemented and locally verified2026-11-15.** Final tested code9b76457d804d7fbc385a965144f8c6ae0fb5fe8c (implementationD90, navtest2f, UIrecovery9b). Independent full/scopedQA, lint/typecheck,565unitUI/119DB/build and actual local browser proof PASS. [Exact verification/limits](evidence/rpt-02/verification.md).

2026-11-15. Lead selection under explicit user instruction to recommend and implement
appropriate RPT-02 behavior through DONE. Basee68de09, mainc406502 freshly verified.
This is an explicit target definition, not confirmation of unknown legacy business rules.
Dev1/Dev2 code/source reviews occur at the final combined PR, not development gates.

## Evidence and selected approach

Accepted DISC04/catalogue: LD012 ManifesCabang14headers (date/branch, vendor,
AWB/quantity/weight/volume/cost/vehicle/driver/status); LD013 city-courier is perDRS,
not the local per-AWB preview; LD016/035 vendor parameters without proved output;
LD006 dashboard financial/status KPI formulas unknown. Do not rediscover these labels.

Targeted authorized DIRECT observation2026-11-15 05:05:14–47UTC on existing labpage1,
approvedorigin `/index.php/manifest-vendor`: authenticated, titlePenjualManifes,
November2026/vendor/user placeholders/DaftarManifes heading. Settled UI exposed no
resultheaders, rows, detail link or explicit querybutton. No selectors/submissions,
private identities, JS/API/export/screenshots or mutations. This proves the inspected
surface limit, NOT global absence or an inferred vendor association.

Actual source Manifest has no vendor field/relation; Vehicle has none; Vendor.branch
is free text, not BranchFK. OPS04 billing is proposed type-only. Do not join by names,
vehicle, courier, creator or guessed geography. DeliverySheet generation remains absent;
read existing stored sheets/items only, without claiming OPS03 complete.

**A selected/recommended:** real non-financial manifest inventory, existing DRS plus
item-outcome reports, raw operational dashboard counts, and an honest unavailable
vendor-report state with separately named RPT-05 source/population follow-up.
**B:** full aggregate/vendor/finance parity needs absent sources/formulas and risks
invention. **C:** manifest-only ignores useful existing delivery data. A maximizes
usable real data while preserving privacy and avoiding unsupported lifecycle/finance.

The user delegated appropriate implementation recommendations and execution through DONE in the
current task. No extra approval question is required for this bounded technical target.
D15/D19/D22 scoped recommendations/adoption are recorded here; global decisions and
finance D11–14 remain unchanged, not silently CONFIRMED.

## Common read contract

Separate registered `manifest_report:view`, `delivery_report:view`, `dashboard_report:view`,
no automatic ordinary grants; explicit registered-resource administrator override only.
Add inventory AND permissionRestriction exemptions. Operational manifest/delivery/view
permissions alone do not authorize reports. Fresh currentidentity and loadAccessActor
for every service entry inside one RepeatableRead snapshot with options/rows/counts.
Ordinary membership includes only ACTIVE branches/offices/nondeletedcompany.

Required real YYYY-MM-DD dates, inclusive Asia/Jakarta business-day period represented
as [start-date 00:00 Asia/Jakarta (= previous UTC date 17:00Z), day-after-end 00:00 Asia/Jakarta (= end UTC date 17:00Z)); maximum31inclusive days; explicit initial no-data-query state. Reuse the proven RPT01 filter parser under the owner-approved D-19 timezone policy. Optional currentlyallowedbranch and
literal identifier substring<=50, page1..1000,size1..100/default20,maxoffset99900.
Reject duplicate arrays/unknown keys/invalid dates; escape LIKE specialcharacters.
Branchoptions: ordinary activecurrentIDs; admin allnondeletedbranches inclinactive.
Supplied branch must exist in options even for admin. Same predicate rows/count;
stable dateDESC,idDESC. No financial fields, exports, operational mutations, schema,
dependency, token or unrelated source changes. Null unavailable, not zero.

## Manifest report

Route `/branch-reports/manifest-outbound`, title **Manifes Cabang** to match observed
surface without falsely treating all stored types as Outbound. One nondeleted Manifest
per row, owningbranch membership for ordinary users, nullowningbranch adminonly.
Optional branchfilter applies to owningbranch, not scalar origin/destination IDs.

Columns: ManifesNo, manifestDate rendered in Asia/Jakarta, owningbranchname, storedtype, vehicleplate,
**Kurir** (actual Courier relation, never relabel Driver), storedstatus, active assigned
transaction count. Count only nondeleted/unreleased ManifestItems with nondeleted
Transactions within current originORdestination scope. Count unit is active assigned
transaction rows, not proved legacy TotAWB or financial/weight aggregation. Manifest
header may remain visible with0eligibleitems. No guessed origin/destination relations.

## Delivery report

Route `/branch-reports/delivery`, default **perDRS** to preserve observed row grain.
Alternate explicitly labelled **pertransaksi/outcome** view, e.g. validated `view=items`;
this one optional discriminator is allowed in addition to common filters.
Period basis always DeliverySheet.deliveryDate, not deliveredAt; use stable sheetdate/id.
Sheet has no deletedAt; exclude deleted manifest, deliveryitem and transaction sources.

Ordinary visible items require BOTH owning manifest.branch in currentallowed and
transaction.originORdestination in currentallowed. Admin sees all otherwise-eligible
rows. Historical reads do NOT require a currently active ManifestItem: a released
assignment must not erase recorded delivery history.

PerDRS rows: one sheet with at least one eligible visible item; DRSNo, deliveryDate rendered in Asia/Jakarta,
manifestNo, owningbranch, manifestcourier (labelled as such) and eligible visible itemcount. DeliverySheet has no status field; do not invent a sheetstatus or derived progress column.
Label count as transactions in the reader's scope, not unknown Progress/Sukses/Gagal.
Peritem rows: DRSNo/date (Asia/Jakarta), AWB, receiver, storedoutcome, actualdeliveredAt (Asia/Jakarta),
receivedBy, notes; explicit projection and nullable outputs, no derivedstatus/formulas.
Search perDRS by sheetNo; peritem by AWB, labelled clearly. Count/rows/paging use
the exact corresponding visibility/date/search predicate, no unbounded nested lists.

## Dashboard

Route `/dashboard`, real **Ringkasan Operasional** under dashboard_report:view.
Raw scoped counts only: Transactions by transactionDate, Manifests by manifestDate,
visible DRS and eligible deliveryitems by sheet.deliveryDate. Same period/branch filter;
label each card's row unit/date basis. Explain that transaction branchfilter matches origin/destination, while manifest/DRS/items use the owning manifest branch and delivery intersection; these counts need not be equal. Do not call these finance, success, pending,
SLA, profit or legacy-calculated KPIs. Snapshot-consistent count reads. Initial state
asks for period; no synthetic charts, financial fixtures or fabricated trendlines.
Links to detailed reports only when actor also has corresponding report permission.
Users without dashboard grant get graceful denial with existing safe profile/navigation
escape, not credentials/data leakage or automatic grants.

## Vendor state and follow-up

Route `/branch-reports/manifest-vendor` under manifest_report:view may present a truthful
unavailable state: operational data does not yet attribute manifests to vendors, plus
authorized link back to ManifesCabang. Keep the unavailable vendor leaf unlinked in operational navigation; direct bookmarked route may explain readiness. No fake vendor rows/filters/totals or directory
substitution. It is a readiness state, NOT an implemented vendor-attribution report.

RPT-05 recommendation: explicit nullable Manifest.vendorId or reviewed association,
operational population contract and no guessed historical backfill; then real scoped
vendor report. This is future work, no schema/capture mutation in RPT02. Extended
legacy totals/statusbuckets/export/finance remain distinct future scope. RPT02 v1
completion will accurately list three real operational surfaces plus vendor limitation,
not pretend all legacy vendor functionality exists.

## Acceptance

TDD RED/GREEN; real guarded testDB reconciliation for all source grains, owning versus
transaction scope/intersection, null/admin/inactive/revocation/deleted/released history,
Jakarta-day boundaries/zero/null/duplicate dates/literal search/paging; no DTO money/PII extras.
Actual external concurrent write between rows/count or dashboard counts proves snapshot.
Independent QA; finallint/typecheck/unitUI/integration/build, then local fake browser
permitted/denied/empty/invalid/paging and375/768/1440/keyboard; clean owned fixtures.
No repeated SUP/RPT01 acceptance/discovery. Commit/push feature branch, no newPR.

## Completion boundary
This DONE v1 delivers three real operational surfaces (with two delivery views) plus an honest guarded vendor-readiness state, not vendor attribution. RPT-05 retains actual vendor source/capture/report work; extended legacy totals/buckets/export/finance remain future scope. OPS-03 generation is not complete. Final combined-PR review, staging and release stay separate; no Dev1/Dev2 development gate/new PR. Actual P2 browser form-preservation regression was fixed and rechecked on submit/reload; owned test fixtures/tabs/servers/helper removed. No runtime change after final verification.

## Comprehensive migration source extensions — 2026-11-16

Owner requested all22legacy reporting identities; historical v1 acceptance remains intact. LP-R03/05 now include scoped koli/kilo/volume subtotals from the exact eligible-item sets used by their existing counts, preserving unknowns per dimension and Decimal arithmetic. One bounded detail query per page, maximum10000/refuse overflow with filter recovery; no partial totals. LP-R03 additionally resolves only stored origin/destination branch IDs on authorized page rows (maximum200reference IDs) in the same snapshot, with null/dangling references unavailable and historical branch labels retained. These names do not populate allowed branch options or alter owning-branch scope. Creation-source evidence: shipments/server/manifests-service.ts validates/stores origin/destination branch references. Courier never becomes driver, and no vendor/finance/status formula is invented.

These are explicitly labelled source-backed extensions, not verified legacy aggregation/geography equivalence. Quantity/branch contracts, source files, actual export evidence, SHA/worktree-specific checks and remaining business/source blockers are maintained in [audit section11](DEV3-LEGACY-PARITY-AUDIT.md#11-comprehensive-rpt-migration-continuation--2026-11-16). Original no-extended-totals wording above describes historical v1; unsupported finance/status/export/capture behavior remains outside the implemented subset. No schema/migration/permission/posting changes; final owner review and staging remain separate.
