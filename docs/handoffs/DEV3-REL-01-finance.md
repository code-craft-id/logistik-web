# Dev3 REL-01 finance handoff

2026-11-15. Current consolidated branch `codex/dev3-ready-for-review`, working copy
`C:/Development/logistik-web`. The former FIN linked worktree was retired after
its commits and local artifacts were preserved.
Source checkpoint **7997505**; FIN-01 slice **b2808bf**; adopted target documented
following owner's explicit **“Adopt A+B as written”** answer. No push/merge/deploy.
Existing SUP/RPT stack/history and initial untracked material preserved.

## Local Git consolidation — 2026-11-15

Discovery, SUP/RPT/FIN and both equivalent observation-harness histories are now
ancestors of this one Dev3 branch; original commit IDs were retained, not squashed
or rebased. Merge checkpoints: 92098c0 and c6706ca. Seven redundant local Dev3
branch refs and two linked worktrees were retired only after ancestor checks and
verified recovery backups. Main and remote branches were not merged/modified.

Application source, schema, application tests, package/lockfile and Next/Vitest
configuration are byte-identical to c087243. Existing FIN verification below
remains anchored to 7997505. The newly consolidated offline harness passed all
6 Node24 tests; fresh canonical-checkout typecheck and lint416 PASS. Dependencies,
Prisma client and Next route types were regenerated; no DB migration or seed ran.

Backup: `C:/Users/Administrator/.codex/backups/dev3-consolidation-20261115-120804`.
It contains a verified original refs bundle, raw WIP copies/patch/hashes,
untracked handoff packet, local metadata, ignored environment/log files and
residual build caches. Recursive cache deletion was rejected by automatic policy;
non-destructive archival completed cleanup instead. No forced deletion was used.

The six original tracked WIP files remain in stash/backup ref
`refs/backups/dev3-consolidation-wip-20261115` (676ecab). Five relevant
ignore/policy updates are included here; the unrelated raw seed-error change is
preserved privately and excluded from the ready branch. Do not blindly pop that
old stash onto this consolidated branch; recover individual files if needed.
New local bug fixes belong on this branch. Push requires a later explicit request;
all financial acceptance/release gates below still apply.

## Status

- **FIN-01 PARTIAL:** all adopted runtime/UI behavior implemented and locally
  verified; mandatory human/migration/staging acceptance still pending.
- **FIN-02 PARTIAL:** all adopted accounting/report behavior implemented and
  locally verified; same acceptance gates pending. Required, never deferred or
  marked NOT NEEDED.
- **Dev3 REL-01 handoff prepared; release NOT READY.** Local implementation
  completion does not substitute for independent review/UAT/deployment approval.

## Resulting behavior / review summary

Finance actors explicitly declare final IDR customer charges against validated
Transaction references. Drafts reserve sources; issue freezes customer/branch/AWB
snapshots, dates and money. Partial receipts derive balances; retries cannot
duplicate actions, overpayments fail, full compensating reversals retain history,
and void requires receipts reversed. No biaya financial inference or OPS-04 bus.

Finance configures the chart/categories and branch mapping versions. Issue,
receipt, void, actual supplier costs and reversals commit their balanced journal
entries atomically with the originating document. Manual journals respect control
accounts; cash expense/transfer have explicit guarded workflows. Monthly closure
blocks backdating and incomplete costs. Period movement reports reconcile source
GP/recap to P&L and cashflow. Unknown/foreign-branch costs cannot become zero or a
final profit claim; void does not cancel supplier liability. Posted classifications
and mappings remain pinned. Old DRAFT accounting models remain unused.

Primary changed areas:

- `src/features/finance/`: validation, services/queries, Server Actions, UI.
- `src/app/(dashboard)/finance/`: authenticated routes, request boundaries/states.
- `prisma/schema/finance.prisma` plus narrow organization/identity/source backrefs.
- Two additive migrations: `20261115090000_fin01_invoices` and
  `20261115100000_fin02_accounting`.
- Identity permission inventory and permission-filtered Akunting navigation.
- Focused unit/PostgreSQL tests; explicit SCH-01 lifecycle and frozen-preview
  inventory test updates. No new package/test framework or Dev2 business changes.

## Verification on the source tree committed as 7997505

Pinned **Node24.15.0**, existing npm scripts/lockfile. Local env loaded without
printing secrets. All DB access/migrations used the existing target guard and
loopback **logistik_web_test**, distinct from development URL.

| Actual command | Result |
|---|---|
| `npm run lint` | PASS, 412 files |
| `npm run typecheck` | PASS |
| `npm test` | PASS, 65 files / 664 unit+UI tests |
| `npm run test:integration` | PASS, 15 files / 138 tests, including 11 finance tests |
| `npm run build` | PASS, production build |
| `prisma validate` | PASS |
| Guarded `prisma migrate deploy` | PASS for both additive migrations; test DB only |
| `prisma migrate diff --from-config-datasource --to-schema prisma --exit-code` | Exit2: only existing Dev2 defaults below; no finance differences |
| Scoped source/SQL diff whitespace check | PASS at FIN-02 source commit |

Financial tests exercise source uniqueness and duplicate lines, issue/edit/void
races, immutable snapshots/journals, overpayment/reversal races, replay conflicts,
current and in-flight authorization/branch loss, inactive-branch receipt denial,
balanced persistence, account reclassification/deactivation, retained liabilities,
missing/foreign cost completeness, cash transfers and closed-period corrections.
Adopted reconciliation: revenue150000 − direct costs90000 = GP60000; office
expense10000 gives P&L50000; receipt100000 changes cash/AR, never revenue.

Browser: local Chromium fake-data critical invoice/payment/cost flows, error
recovery, keyboard tabs and horizontal table scroll. [Measurements](../decisions/evidence/finance/viewports.json)
verify eight loaded routes at **375/768/1440**, zero page overflow/clipped
controls. [375px](../decisions/evidence/finance/reports-375.png),
[768px](../decisions/evidence/finance/reports-768.png),
[1440px](../decisions/evidence/finance/reports-1440.png) show post-void cost retention.
Browser fixture records/credentials/session were removed; owned server stopped,
tab returned to blank and emulation cleared. Existing PostgreSQL cluster remains
running. No new legacy observation; accepted empty/structural evidence reused.

Initial full checks identified obsolete inventory/lifecycle assertions and global
admin/account count contamination from the temporary browser fixture. Explicit
test exceptions were updated, the owned fixture removed, then final full gates
passed. Nonfatal pg8 deprecation warning remains; no speculative shared fix.

## Human / staging gates and rollout constraints

1. Dev1/Dev2/finance-owner review of focused source, rights, source relations and
   adopted target deviations; self-review is not independent acceptance.
2. Migration coordinator disposition of **existing** `manifest_items.updated_at`
   and `delivery_sheet_items.updated_at` defaults: migration
   `20261031000100_add_timestamps_manifest_delivery_items` installs `DEFAULT
   CURRENT_TIMESTAMP`; baseline schema has `@updatedAt` without that default.
   This task did not edit either source model or old migration to conceal drift.
3. Stop finance writers before applying both reviewed migrations in staging.
   FIN-02 refuses preexisting issued FIN-01/receipt history needing catch-up.
   Do not run a FIN-01-only binary against the activated FIN-02 schema. No
   historical opening balances/import approved; reports disclose new-LMS coverage.
4. Configure actual accounts/categories and valid branch mappings, then explicitly
   grant finance rights to intended groups. No ordinary-group grants were added.
5. Staging end-to-end parity against the adopted target, role/branch-denied flows,
   UAT/reconciliation acceptance, backup/restore and release approvals. Not run.

Known bounded choices: all short finance writes serialize globally; catalogues
cap500 and reports cap10000 lines/366days (refuse overflow). No automatic
cross-branch cost ownership transfer, external bank/vendor settlement, tariff,
tax or historical financial data import. Wider D-11/D-21 rules stay unresolved
outside the adopted subset. Do not reopen accepted DISC-04 or SUP/RPT scope.
