# Dev3 finance state

2026-11-15. Worktree C:/Users/Administrator/.codex/worktrees/fin-01-ready/logistik-web;
branch feat/fin-01-billing-contract. Owner explicitly answered “Adopt A+B as written”.
Bounded FIN-01 P1–P5 and FIN-02 B approved; broader financial rules stay TBD.
No orchestrator/Superpowers/subagents. Existing SUP/RPT and initial untracked
.serena/ and docs/handoffs/ preserved; no push/merge/deploy.

FIN-01 WIP: schema/service/Server Actions/UI and first migration implemented.
Guarded PostgreSQL 4 tests, money/date unit 2 tests, changed-file Biome and
TypeScript PASS. See docs/decisions/FIN-implementation.md for commands and limits.
Migration applied only to loopback logistik_web_test. Local existing PostgreSQL
cluster started after stopped-server diagnosis. Issued financial history is not
soft-deleted. UI/browser checks and integrated accounting posting remain pending.

FIN-02 NEXT: implement adopted chart/mapping/journal/actual cost/period/cashflow/
P&L/GP/recap behavior; no existing DRAFT accounting runtime. Journal integration
must be atomic with invoice/receipt changes. REL-01 not ready. Final full gates
and human review/staging/UAT/backup-restore remain. Resolve actual latest commit
with Git; this snapshot is committed with the FIN-01 slice.