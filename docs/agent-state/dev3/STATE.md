## Latest checkpoint: 2026-11-24 — D-37 WhatsApp, D-38 Akunting (sandbox)

- Branch `dev3/ready-for-review`, HEAD `799e027`, pushed. Working tree clean except the unrelated untracked `.github/`, `docs/visualisasi-pribadi-logistik.html`, `logistik_web-demo.sql` (never stage).
- `4a64dc2` D-37: four provider WhatsApp messages (Transaksi to sender/receiver, Shipment Status on Delivered, Delivery Sheet on DRS) with on/off, sent only for customers with WA Notif active, via `whatsapp_outbox` dispatched after commit to the paced gateway (`~/lms-wa-gateway`, 10 s per branch number).
- `799e027` D-38: Akunting menu and features like the sandbox (the real web has no Akunting). Migration `20261124000200_akunting_sandbox` (cost centres, asset categories, assets, bank statements, journal cost centre / customer / vendor, line memo). Menu order Modul, Akunting, Laporan; Invoice under Modul > Keuangan.
- Checks: lint and typecheck pass; unit/UI 734/734; integration finance + akunting + sch01 + whatsapp 29/29; `npm run build` passes; pages verified in Chrome on a local production server (port 3001).
- Next: menu parity queue in `BACKLOG.md` section A3 (Group 1 first, then Group 2, then Group 3). User rule: real web first, sandbox for the rest; never change the real web.

## 2026-11-21 17:11 UTC — REL-01 Preview verified

- Branch `dev3/ready-for-review`. Deployed source is `3905f610` plus the checked deployment patch. Preview `https://logistik-web-review-preview-softdev8.vercel.app` is Ready and requires Vercel Authentication. The generated deployment is `logistik-qp90cfsnj-softdev8.vercel.app`; branch metadata matches. No GitHub push since the linked Vercel project treats this Git branch as Production.
- PostgreSQL 18.4 to Neon 18.7. Private custom archive verified and copied outside the repo. Restore matched all 83 tables, 1,068 rows, 259 indexes, 80 sequences, 147 foreign keys, CHECK semantics and 36 migration checksums. Applied the reviewed vendor bill migration on staging. Prisma status up to date with 37 migrations and pooled TLS verified. Two existing updated_at defaults remain drift.
- Existing administrator `dev3_admin` confirmed on localhost and Preview. Chrome login, session refresh and dashboard widths 375/768/1440 passed. HTTPS route and asset checks passed. Live limited user verified denied admin access and branch-filtered AWBs, then the temporary user/group were removed.
- npm ci, lint, typecheck, Prisma validation/generate and local/Vercel build passed. Unit/UI 728/728. Guarded local integration suite 190/192 first run; the two tests that timed out passed on targeted rerun with a 60-second test timeout.
- Preview only. No legacy access or Production deployment/database change. See [deployment guide](../../DEPLOY_VERCEL_NEON.md).

## Latest checkpoint: DASH-01 on requested branch (2026-11-21 05:51 UTC)

- Branch `dev3/ready-for-review`, HEAD `338f33e` (`Use Jakarta time across logistics workflows`). DASH-01 changes are uncommitted on the requested branch; lint/typecheck/build pass.
- Existing unrelated untracked files preserved: `.github/workflows/ci.yml` from the earlier GitHub OAuth-scope-rejected push, and `docs/visualisasi-pribadi-logistik.html` (personal guide; not committed). Do not stage either for DASH-01.
- Project owner confirmed D-19 globally: Asia/Jakarta for business dates, periods/cutoffs, generated identifiers and displayed date/time; timestamps remain UTC instants and date-only fields are not timezone-shifted.
- DASH-01 implements user-local Quick Action preferences (server-filtered destinations remain the only choices), dashboard month/year shortcuts with Jakarta dates, dashboard-only annual ranges up to 366 days, yearly chart aggregation by month, and exact raw-status links to scoped Semua Status. No new metric formulas in this slice.
- Source facts: dashboard service already exposes stored status counts, daily AWB counts, and active-assignment AWB pending; current year/month filtering is constrained to 31 days. `customerRevenue` sums `Transaction.biaya`, but that field is not approved as omzet. Transaction has no payment-category source. Success/fail/return and POD-outstanding definitions are not established.
- Business gates remain unchanged: D-07/D-09 for status/outcome/POD buckets; D-11/D-15 for revenue, customer ranking and payment breakdown. No D-ID is promoted by this work. Formal cross-domain review (Dev 2) and owner adoption remain required for any source/status contract change.
- Project owner selected “KPI tunggu definisi” for financial/outcome metrics. This confirms no new metric formula or payment-category model is authorized in this slice.
- `npm run lint` PASS (562 files); `npm run typecheck` PASS; `npx next build --webpack` PASS (109 pages; compiled in 93s); `git diff --check` PASS. No test suite run (not requested).
- Chrome inventory showed the user's `http://localhost:3000/dashboard` tab. Two documented `cua.getTab` calls failed before exposing page contents (`timeoutMs` undefined); visual/responsive review remains UNVERIFIED.
- No merge, push or deployment.

See `RUN_LOG.md` for event history and `BACKLOG.md` for remaining Dev3 scope.
