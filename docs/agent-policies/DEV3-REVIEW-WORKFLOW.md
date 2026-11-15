# Dev3 review workflow

## Owner workflow override —2026-11-15: Dev3 rapid development

Explicit project-owner instruction applies to RPT-01 and ALL subsequent Dev3 tasks: Dev1/Dev2 approval is NOT a pre-implementation gate for Dev3 development. Lead prepares and documents bounded technical/source/auth contracts, implements within approved business scope, runs tests and independent agent QA, and queues cross-domain owner review for the final PR after agreed Dev3 work is finished. Do not request repeated per-slice approvals, pause implementation for Dev1/Dev2 availability, or treat pending owner review as a runtime development blocker. Do not create a new PR before the owner's agreed final timing.

Actual Dev1/Dev2 comments already received are technical input: verify and incorporate relevant corrections, record deferred findings and changed contracts for final review. Deferred review is not an approval; human code review and merge authority still occur at the final PR. Agent QA does not impersonate either developer. Existing business/security decisions, truthful legacy evidence, production restrictions, scoped tests, and no automatic merge/deploy remain applicable. This explicit owner instruction supersedes earlier approval-timing rules in this operating contract, local skill and plans.
