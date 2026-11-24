## 2026-11-24 — menu parity handoff

- Resume on `dev3/ready-for-review` (local commits not pushed). Read STATE.md first.
- Before any deploy: apply the four new migrations on Neon staging (`prisma migrate deploy`), then smoke-test Share Truck, COD, Agen, Report Customer, Laporan Keuntungan, booking pickup result.
- Grant new permission `share_truck` (view/manage) to the groups that use it; Akunting/Kasir rights to FINANCE-type groups only.
- Courier pickup result needs `FEATURE_AWB_SCAN` on (D3 still open).

## 2026-11-21 17:11 UTC — REL-01 Preview verified

- Ready and verified protected Preview with Neon staging. Read `STATE.md` and [deployment guide](../../DEPLOY_VERCEL_NEON.md). Preserve the private backup and use only the Vercel Preview target and canonical alias on subsequent releases.
- The GitHub branch currently triggers Production on push. Preserve local validated deployment work until that automatic trigger is changed by the project owner.

## Current handoff — 2026-11-21 05:51 UTC

- Resume branch `dev3/ready-for-review`, HEAD `338f33e`; user requested that dashboard changes stay on this branch. DASH-01 changes are uncommitted.
- Before coding, read AGENTS, PRD, ROADMAP, Dev3 operating/checkpoint and legacy-readonly policies. A new DASH-01 row is in ROADMAP. The working implementation scope is personal local Quick Action configuration (only server-authorized links), Asia/Jakarta month/year shortcuts, and exact stored-status links to scoped Semua Status.
- Keep financial metrics blocked pending D-11/D-15: no Transaction payment method is modeled; `Transaction.biaya` must not be called omzet without approval. Keep Shipment Success/Failed/Return/POD buckets blocked pending D-07/D-09 definitions.
- Preserve unrelated untracked `.github/workflows/ci.yml` and `docs/visualisasi-pribadi-logistik.html`; do not stage them.
- Base facts in source: `parseOperationalFilters` limits periods to 31 days; AWB report `all-status` accepts exact `status` filters. Daily dashboard data is AWB counts and should aggregate by month for year-wide views.
- Implemented DASH-01: browser-local selection of only server-authorized Quick Actions; month/year shortcuts preserving branch; dashboard-only 366-day ranges; yearly AWB-count chart groups by month; exact nonempty stored-status links to scoped Semua Status. Source files are in `src/features/reports/operational/components/`, `operational/filters.ts`, and transaction report filter parser.
- Owner selected “KPI tunggu definisi”; no revenue/payment/outcome/POD metrics or formula changes are authorized. D-07/D-09/D-11/D-15 remain unchanged.
- `npm run lint` PASS (562 files), `npm run typecheck` PASS, `npx next build --webpack` PASS (109 pages; compiled in 93s), and `git diff --check` PASS. No test suite run (not requested).
- Chrome inventory showed the localhost dashboard tab, but both `cua.getTab` attempts failed before page content (`timeoutMs` undefined); visual/responsive review remains UNVERIFIED.
- Preserve unrelated untracked `.github/workflows/ci.yml` and `docs/visualisasi-pribadi-logistik.html`; do not stage them.
