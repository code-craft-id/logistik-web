## Latest checkpoint: D-19 system-wide Jakarta implementation (2026-11-21 03:53 UTC)

- Branch `dev3/ready-for-review`, HEAD `2866b05e1fe02aa0cd56b605d4c7273c6abd4dab`; working-tree changes remain uncommitted and include earlier readiness fixes plus this timezone slice. Inspect `git status` before future edits.
- Project owner confirmed system-wide Asia/Jakarta policy: business-date defaults/periods/cutoffs, generated identifiers, and user-facing date/time formatting. Persist/transport timestamp instants as UTC; date-only fields retain their calendar dates. D-19 CONFIRMED. D-06 stays PARTIAL for non-timezone AWB details; Dev2 agreed to AWB basis.
- Implemented shared Jakarta calendar/date/time helpers; applied to AWB and booking YYMM, transaction/operational/AWB/simple/recap report ranges and labels, dashboard monthly defaults/day buckets, revenue monthly bounds, status import date parsing, inbound/AWB-change date filters, and date/time views across profile, ticket, shipments, finance and print.
- SQL formatting accounts for PostgreSQL `TIMESTAMP(3)` without timezone: convert stored UTC-naive timestamps to UTC instants, then Asia/Jakarta wall time. Date-only database values are not shifted.
- Validation on current working tree at HEAD: `npm run lint` PASS (560 files); `npm run typecheck` PASS; `npx vitest run --reporter=dot --maxWorkers=2` PASS (83 files/728 tests); focused integration reports PASS (3 files/26 tests plus simple reports 1 file/5 tests); `npx next build --webpack` PASS (compiled in 108s, 109 pages generated).
- Chrome Dashboard exists at localhost:3000, but this session's DOM and screenshot observation APIs fail before page content. Visual/responsive review remains UNVERIFIED.
- Release remains NOT READY: owner/provider parity and staging/UAT, other business decisions and final review remain. No merge, push or deployment.

See `RUN_LOG.md` for event history and `BACKLOG.md` for remaining Dev3 scope.
