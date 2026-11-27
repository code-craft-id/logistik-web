## 2026-11-27 — release handoff (HEAD 69697b8, deployed)

- Live on Vercel production with all migrations through 20261127000200_pindah_manifest (log confirmed). Build script retries prisma migrate deploy while Neon wakes (P1001).
- fitur1 = full provider menu (branch fitur1 / tag fitur1-snapshot, b218022); current branch = fitur2 merged menu with in-page tabs.
- Done since 2026-11-26: D-44 dashboard, speed work (proxy cookie check, cached identity, one-query actor, list indexes), exports (Status Pengantaran, Rugi Laba, Perkiraan import/export/template), Kasir Lampiran, unique business codes (incl. AWB across branches), rupiah inputs, skeletons, Akunting under /akunting, Pindah Manifest (D-08).
- Open: B2-B8, N7, K1, K3 (Assets / Kasir Excel), E1 (deferred). Vercel function region not checked (Neon is ap-southeast-1; prefer sin1). Cloudinary env needed for Kasir Lampiran. Rupiah inputs / lampiran / dashboard period fix not yet clicked through in a browser on a fresh server.

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

## 2026-11-27 — release batch 2 (local, not pushed)

- Done: user delete = soft delete (migration 20261127000400), confirm dialog label flash, Assets template/import, AWB list Kilo/Volume/Biaya. Excel export (Assets, Kasir) and ticket rating were REMOVED: not in the provider (owner rule 2026-11-27: build only what the provider has).
- Still to build (seen in provider): B5 import status codes 003-012 (M.Shipment Status lists them), B2 customer tariffs (real web Customer: Export/Template/Import Tarif, Harga/Koli, Trucking), AWB template/import (Kelola On Site), Kasir Pembayaran template/import (sandbox), ticket chat reply (real web ticket detail). K1 depreciation: not in provider, do not build.
- Not browser-tested: the new export/import, rating and columns.

## 2026-11-27 ~22:15 WIB — checkpoint (owner: release only when ALL done)

- Branch dev3/ready-for-review, HEAD 406fee1 (pushed). Everything after it is LOCAL and uncommitted. Commit/push needs a fresh owner OK, without Claude attribution lines.
- Done locally: user soft delete (migration 20261127000400), confirm dialog label, import status codes 003-012 as tracking notes, Assets template/import, AWB list Kilo/Volume/Biaya, ticket chat (migration 20261127000600).
- Verified: before ticket chat, unit 760/760, integration 221/221, build OK. After ticket chat only typecheck, ticketing integration 12/12 and ticket UI/unit tests; full run and build still needed.
- Remaining, in order: (1) Kasir Pembayaran Template Import / Import Data (sandbox; line columns Kode Rekening, Keterangan, Jumlah, Posisi), (2) AWB Template Import / Import Data (real web Kelola On Site), (3) customer tariffs (real web Customer: Export/Template/Import Tarif, Harga/Koli, Trucking), (4) check Customer export/template/import, (5) page-by-page comparison of the other pages.
- Rule: build only what the provider has. Real web is strictly read-only; downloading a provider template needs the owner's OK.

## 2026-11-27 ~22:55 WIB — Kasir import, AWB import, customer tariffs (local, uncommitted)

- Done after the 22:15 checkpoint: Kasir Pembayaran template/import, AWB template/import, customer tariffs (Kg, Koli, Trucking) at /marketing/tarif.
- Production would run migrations 20261127000400, 000600, 000700, 000800 (additive; 000800 also relaxes delivery_service_id on the new table).
- Remaining: Customer Export / Template Import / Import (needs the provider's template columns), page-by-page comparison of the other pages, browser check of the new screens.
- Data needed before use: Koli sizes as Delivery Service rows and truck types as Trucking Type rows.
- 2026-11-27 later: Customer export/template/import built. Remaining: page-by-page comparison, full checks, browser check; then commit and push (owner approved once all is done).
- 2026-11-27 real web button check (read-only): Driver/Kurir/Marketing import exist in LMS. Missing: Penerima (Template Import / Import Data), Vendor (Template Import / Import Data, Export Tarif vendor), Kendaraan (Template Import / Import Vehicle). Needs provider templates. Not committed/pushed yet.
- 2026-11-27 ~23:25: Penerima, Kendaraan, vendor tariff import/export built. Migrations to run in production: 000400, 000600-000900. Next: full checks, then commit + push (owner approved), no Claude attribution.
- AFTER this release (owner approved 2026-11-27): merge Akunting menu into one entry with in-page tabs each: Master Akunting (7 master items), Kasir Penerimaan (Lainnya + Invoice), Kasir Pembayaran (Lainnya + Vendor), Penyesuaian (4), Laporan Akunting (6). Same routes and rights (see src/components/shell/).
