# RPT-01A — non-financial Transaction Detail Report

IMPLEMENTED + LOCAL VERIFIED on2026-11-15 at code723dce61309cc6157d2a374a2fba4220b9181ce1. RPT-01 DONE by explicit owner v1 acceptance on2026-11-15; deferred parity/export now RPT-03/RPT-04. [Actual checks/limits](evidence/rpt-01/verification.md).

## Decision and authority

Owner/project coordinator explicitly selected OptionA in the consolidated D15/D19/D22 question: “A — Sembilan kolom bersumber nyata (rekomendasi)”. It covers9real-source non-financial fields, transactionDate with a maximum31day range, allstoredstatuses includingCancelled, nondeletedrecords, period/branch/AWBfilters, noaggregates/export/billingfilters/unsupportedcolumns. On 2026-11-21 the owner superseded the former UTC date basis: periods and displayed timestamps now use Asia/Jakarta. Formal named-approver record PARTIAL. Global D15/D22 remain open outside this subset.

Alternatives reviewed: B preserves14headers with5explicitlyunavailable columns (closer layout but empty width); C defers until allsources exist (fullparity later but delays usable data). Lead recommendationA selected: real useful operational output, smallest security/maintenance surface, no invented finance/deliverydata.

Owner subsequently instructed that ALL Dev3 tasks proceed without Dev1/Dev2 pre-implementation approval gates; their reviews are consolidated at final combinedDev3PR after agreedwork finishes. [Standing policy](../agent-policies/DEV3-REVIEW-WORKFLOW.md). No repeated review requests/newPR/automaticmerge/deploy. Final code review deferred, not falsely approved.

Actual [Dev1 documentation review5908964791](https://github.com/code-craft-id/logistik-web/pull/10#pullrequestreview-5908964791) oncaefd2c accepted contract with corrections now implemented: currentACTIVE memberships, admin historical/null-null, permissionRestriction exemption, AWB50, PARTIAL formalownerrecord. [PR9 review5908967906](https://github.com/code-craft-id/logistik-web/pull/9#pullrequestreview-5908967906) says Approve by Dev1, not a Dev2 signature. Dev2 source/code and Dev1 final code reviews queued at finalPR. [Review queue](DEV3-FINAL-REVIEW.md) retains SUP findings without reopening SUP in this slice.

## Evidence and real source mapping

Accepted DISC04/REPORT_CATALOGUE LD001:14legacyheaders. LD042: workingperiodquery and billing-labelled Paid/Unpaid/Invoiced/Uninvoiced filter, notshipment-statusfilter. Neither establishes sourcejoins/timezone/nonadminreportpermissions. Reused accepted evidence on separateunmerged discoverybranch, no rediscovery. Merged Dev2 baselinec406502 (PR9 actuallyMERGED; oldhandoff OPEN/CHANGES_REQUESTED wordinghistorical) supplies current Transaction model/query semantics.

| Observed column in relative order | Actual source | Adopted representation |
| --- | --- | --- |
| AWB No. | Transaction.awbNo | Storedtext/nullunavailable; no AWBgrouping/dedup |
| tanggal (Asia/Jakarta) | transactionDate | ISO8601 UTC instant in transport; rendered in Asia/Jakarta; notcreatedAt/deliverydate |
| Asal | originBranch.name | Explicit sourcebranch, not inferred geographicarea |
| Tujuan | destinationBranch.name | Explicit destinationbranch |
| Pengirim | senderName | Storedescapedtext |
| Penerima Barang | receiverName | Storedescapedtext |
| Koli | koli | Storedinteger; nullnotzero |
| Kilo | kilo | Exact Decimalstringvalue, noconversion/rounding/aggregate |
| Status Pengiriman | status | Storedcurrentstatus, notbilling/historyreconstruction |

One row per Transaction.id, exclude deletedAt != null; include allstoredstatuses includingCancelled. Current-data report, not an immutable as-of snapshot. Kilo label establishes no actual/chargeable-weight formula.

## Implemented bounded behavior

Required real calendar YYYY-MM-DD start/end interpreted as inclusive Asia/Jakarta business days, with UTC instants [previous-day 17:00Z, day-after-end 17:00Z). No browser/servertimezone fallback, initialpage asksforperiod withouttransactionquery. Maximum31inclusive days is an explicit query-cost bound. Reject malformed/reversed/oversizedperiods.

Optional onebranchfilter (origin OR destination) and literal AWBsubstring max50. Escape SQL LIKE specialcharacters in Prisma contains, no rawSQL. Fixed ordering transactionDateDESC,idDESC; page1..1000, pageSize1..100/default20, maximumoffset99900. Countmetadata describes scopedtransactionrows only, nofinancial/AWBaggregate.

Registered transaction_report:view afterdelivery; noordinaryautogrants. transaction:view alone denies report. permissionRestriction exemptsreport frommisleadingadmin-onlylabel. Every service entry resolves currentidentity/reloadsactor and requiresreportpermission; UI/nav neverauthorization. Explicit system_admin:manage uses existing registered-resource contract.

Ordinary row scope: nondeleted AND(originID IN currentallowedIDs OR destinationID IN currentallowedIDs). Fresh loadAccessActor excludes inactive/deletedbranches, inactive/deletedoffices and deletedcompanies; emptyordinaryscopeempty. Bothendpointsnull onlyadmin. Inactiveendpoint doesnotgrantmembership, but anothercurrentallowedACTIVEendpoint may stillmatch existingOR. Admin sees allnondeletedtransactions including historical/null-null.

Branchoptions ordinary=currentACTIVEallowedIDs; admin=allnondeletedbranches includinginactive. Suppliedbranchmustbe inoptions evenadmin; nonmemberfilterdenied. Historicalrowlabels remainreferences, not authority to browse unrelateddata.

One PostgreSQL RepeatableRead transaction covers freshactor/options/rows/count; rows/count useidenticalscope/date/searchpredicate. Subsequentpages new snapshots and mayreflectlegitimatewrites. ExplicitDTO selects9fields +internalrowid only, nofinancial/credential/idempotency/privateextras. No rowdetail links because reportgrant doesnotimplytransaction:view.

Real ServerComponent route /branch-reports/transaction-details with validatedGETfilters/pagination, labelledinputs, pending/loading/empty/invalid/denied/error states and internal keyboard-accessible table scroll. Narrow navigation/footer mapping; no other previewroute promoted. No schema/migration/newpublicAPI/operationalmutation/dependency/tokenchange.

## Verification and deferred scope

TDD worker70focused/7guardedDB tests, lint/typechecks; independent QA PASS noP0/P1/P2. Lead356filelint/typecheck/544unitUI/111integration/productionbuild68routesPASS at723dce6. Actual fake local browser375/768/1440, permitted/denied/empty/invalid/paging/keyboard/navigationproofPASS; ownedfixtures/tabs/server cleaned. Full evidence hasactualcommands/sourceSHA/diagnostics andlimits. Official versioned Prisma docs +installed7 declarations and installedNext16 guides used, not newer incompatibleAPI assumptions.

Deferredmissing-source columns: Moda, Servis, Deskripsi, Komentar, Diterima Oleh. Do not inferfromBooking/partialOPS03/masterdata/preview. Deferred filters: separatelegacyorigin/destination, customer/payment/mode/billing-labelledstatus; columnsorting/Refresh/export andfinance/aggregates. These are followups, not global DISC04 reopening. No biaya/tariff/volume/revenue/profit/invoice data introduced.

Staging, physicaldevice/browsermatrix and finalhuman code/release acceptance remain pending; finalownerreview is not a developmentblocker. SUP-01 DONE for owner-accepted v1; SUP01A code untouched. FullDev3 notDONE. See [closure](DEV3-V1-CLOSURE.md).

## RPT-03/RPT-04 extension —2026-11-15
Owner packet A adopted separate endpoint filters, nine-column sorting and capped5000 permissioned UTF8CSV. Implemented/local verified at core8d25df1/finalcopybe1d2e6; fixed-order/export-deferred paragraphs above describe original accepted v1. New authoritative [extension contract/disposition](DEV3-SUP-RPT-FOLLOWUPS.md) and [SHA-specific verification](evidence/dev3-sup-rpt-followups/verification.md). Nine fields/current scope retained; date basis superseded to Asia/Jakarta by the owner on 2026-11-21. Five unsourced headers CLOSED WITH NOTES, no finance/vendor join invented.
