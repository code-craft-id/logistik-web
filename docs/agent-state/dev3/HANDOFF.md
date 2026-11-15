# Finance handoff — adoption pending

Continue ONLY in this worktree on feat/fin-01-billing-contract. Baseline
92602bf7ff8922ffad3eb784841ad0e76d890fb3; use git to resolve later documentation
commit. Preserve initial untracked .serena/ and docs/handoffs/. Older discovery
checkpoint remains at C:/Development/logistik-web/docs/agent-state/dev3 and is
historical; this worktree's STATE.md is current for this mission.

Owner requires one implementation agent, no orchestrator/Superpowers/delegation.
Financial/security/migration/human-review gates remain. DISC-04 DONE WITH NOTES;
SUP/RPT accepted implementation untouched. Do not rerun its gates absent impact.

Read docs/decisions/FIN-02-contract.md and the user's pending adoption answer.
One consolidated async question asks whether to adopt A (existing FIN-01 P1–P5)
and B (specific accounting target), or correct them. Do not confuse this mission
or earlier target-preparation approval with actual adoption. D-IDs remain TBD.

FIN-01 BLOCKED D-11/D-12/D-21; FIN-02 BLOCKED D-13/D-14 plus authority, required
and unimplemented. No financial code/schema/migration can start under current
guards. No live legacy work, production DB actions, tests or build performed.

After adoption: record exact subsets, resolve minimal technical design and
migration coordination, implement invoice then receipts with money/auth/race
tests, then required FIN-02 scope and REL-01 readiness. A+B recommendations are
proposals, including invoice-date revenue, documented actual costs and immutable
closed periods; confirm the answer covers them before implementation.

REL-01 NOT READY. Current changes are documentation only. No agents/background
jobs pending. No push/merge/deploy authorized.
