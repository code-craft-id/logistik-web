# SUP-01 and RPT-01 v1 closure

Owner acceptance2026-11-15: “kalau begitu buat kedua ticket ini DONE.” This explicitly
adopts the delivered scopes below as the complete v1 tickets and supersedes earlier
full-ticket PARTIAL labels. No unimplemented feature is claimed delivered, no unknown
business rule is confirmed, and no test result is transferred to changed runtime code.

| Ticket | DONE scope | Existing evidence |
| --- | --- | --- |
| SUP-01 — Ticketing v1 | Create/list/detail, own-created tickets in current allowed branches, explicit administrator rules, active hierarchy on create, idempotency, validation and responsive UI | [SUP verification](evidence/sup-01-core/verification.md), testedcode5575d12 |
| RPT-01 — Transaction Detail Report v1 | Nine sourced non-financial columns, 31-day period (initial UTC basis superseded to Jakarta), branch/literalAWB50 filters, scoped pagination and consistent snapshot, responsive UI | [RPT verification](evidence/rpt-01/verification.md), testedcode723d6 |

Timezone supersession (2026-11-21): project owner changed the report period and displayed timestamp basis from UTC to Asia/Jakarta under the confirmed system-wide D-19 policy. The original 2026-11-15 acceptance remains historical; current behavior is governed by [RPT-01 contract](RPT-01-contract.md).

DONE means owner-accepted development/local verification for these v1 deliverables.
Final combined-PR review, pre-merge hardening, staging and release remain separate.
No Dev1/Dev2 pre-implementation gate, new PR, merge or deployment is introduced.
Formal D-ID/approver records retain their actual statuses outside this accepted scope.

## Separate follow-up tickets

| ID / owner | Description and boundary | Evidence / implementation recommendation |
| --- | --- | --- |
| SUP-02 / Dev3 | Ticket lifecycle, assignment, comments/history and approved edit/delete behavior | Legacy list/create/detail/approval structures and Checking label observed; exact transitions/roles/reopen rules not established. Recommendation, not approval: small explicit state machine, least-privilege assignment and append-only actor/time history; define transitions from targeted read-only evidence or one business decision. |
| SUP-03 / Dev3 | Ticket attachments and optional category/AWB/customer links | File/picture controls observed; storage/limits/access not proven. Category/AWB/customer are unobserved FR07 extensions, not legacy facts. Recommend private authorized downloads, bounded types/sizes and existing scoped relations only if adopted; no public uploads or invented legacy requirements. |
| RPT-03 / Dev3 | Additional transaction columns/filters and approved sorting | Moda/Servis/Deskripsi/Komentar/Diterima Oleh exist as legacy headers but have no reviewed runtime source. Billing-labelled Status is not shipment-status filtering. Use real Dev2 sources when available; omit unavailable fields rather than fabricate joins or formulas. |
| RPT-04 / Dev3 | Authorized non-financial report export | Legacy export affordance observed; output uninspected under no-download rules. Recommend bounded server-side UTF8 CSV of the same approved columns/predicate with explicit export permission and spreadsheet-formula escaping; CSV is a target recommendation, not claimed legacy Excel parity or an approved implementation. |
| DEV3-HARD-01 / Dev3 | Final integration/hardening before combined PR merge | Preserve actual SUP shared-lock/resource-order findings and review suggestions in [final review queue](DEV3-FINAL-REVIEW.md); verify/fix required findings before merge, plus staging and final human code review. These findings are open, not erased by ticket closure. |

Each follow-up is backlog work, not part of SUP-01/RPT-01 completion or automatically
authorized runtime business behavior. RPT-02 remains the separate manifest/delivery/
dashboard roadmap ticket; these IDs do not replace or silently expand it.

## Evidence policy for later uncertainty

Reuse accepted DISC-04/catalogue first. For a material new gap, inspect only relevant
legacy ordinary views under canonical LEGACY-ACCESS-GATE and read-only query scope;
verify current origin/session, user-only login if needed, no mutations/JS/API/export.
If behavior is absent from the inspected view, record that bounded absence, not global
absence. Provide a suitable recommendation with observed/proposed/approved separated.
No additional legacy visit is needed merely to accept these already-verified v1 scopes.

## Owner follow-up disposition —2026-11-15
Explicit owner packet A closes SUP-02/SUP-03/RPT-05 as NOT NEEDED for current migration scope, and unsupported RPT-03 headers CLOSED WITH NOTES. RPT-03 sourced filters/sorting and RPT-04 capped permissioned CSV are approved pending implementation/verification. This supersedes the earlier backlog recommendations for this scope only, never claims unimplemented behavior delivered or global legacy absence. See [approved packet and evidence](DEV3-SUP-RPT-FOLLOWUPS.md).

Follow-up completion2026-11-15: RPT-03/RPT-04 and relevant HARD-01 runtime are IMPLEMENTED + VERIFIED; explicit NOT NEEDED/CLOSED WITH NOTES dispositions above retained. See [final scope matrix](DEV3-SUP-RPT-FOLLOWUPS.md) and [actual verification](evidence/dev3-sup-rpt-followups/verification.md).
