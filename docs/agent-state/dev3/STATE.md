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
