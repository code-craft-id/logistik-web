# ROADMAP | Logistics Management System

**Status:** Draft, milestone-based. No calendar dates until scope and capacity are validated.
**Related docs:** `AGENTS.md` (engineering rules, collaboration, definition of done), `docs/PRD.md` (scope, requirements, decision log), `docs/reference/` (provider app and prototype reference, see PRD section 10)

This roadmap defines **sequence, ownership, and dependencies**. Collaboration rules, PR conventions, and the per-feature definition of done live in `AGENTS.md` (sections 3, 7, 8, 9) and are not repeated here. Business decisions are tracked by ID (`D-xx`) in `docs/PRD.md` section 7. This is a standalone rebuild of the provider app on Next.js. The provider app is the oracle for behavior and the Go + React prototype is only a head start (`docs/PRD.md` section 10). Every feature is accepted on a documented side-by-side check against the provider app. Where the provider app is ambiguous, undocumented, or should not be replicated, the decision must be `CONFIRMED` first.

## 1. Workstreams

| Developer | End-to-end ownership | Supplies to others |
|---|---|---|
| Dev 1 | System Settings, Office, Master Data | Authentication/RBAC, branch scope, organizations, vendor/service/vehicle/ETA/status references |
| Dev 2 | Sales, Customer Service, Booking/AWB, Shipment, Manifest, Delivery | Booking and shipment events, operational status, manifest and delivery source data |
| Dev 3 | Accounting, Reports, Ticketing, Dashboard | Billing and finance rules, report metrics, dashboard query requirements |

Dev 3 has the broadest scope and accounting correctness is the biggest risk. Prioritize reports and invoice basics, and defer P&L until costing and posting rules are signed off.

## 2. Phases

Phases are **logical gates**, not equal-length sprints. A developer can start as soon as the contracts and decisions they depend on are stable. Anything still undecided stays blocked, never guessed.

| Phase | Dev 1 | Dev 2 | Dev 3 | Exit condition |
|---|---|---|---|---|
| **0. Discovery and contract** | Observe the provider app for settings, office, master data. Permission matrix from its user and menu rights screens. Review of the ported schema | Observe the provider app for sales, booking/AWB, shipment, manifest, delivery. Numbering and transition rules from observed inputs and outputs (D-05 to D-09) | Observe the provider app for accounting, reports, tickets, dashboard. Report catalogue and formula questions. Accounting stays deferred until D-12 to D-14 | Observed behavior recorded per domain and reviewed by each owner. D-xx marked `OBSERVED` or still `TBD`. Core ERD, permissions, UI patterns, shared contracts, design tokens in `globals.css`. Oracle access secured (D-29) |
| **1. Foundation** | Auth/session, permission and branch-scope helpers, settings UI starter | Shipment/AWB schema and validation skeleton, feature UI skeleton | Dashboard shell and quick actions, accounting/report/ticket skeletons | App runs, Prisma migrations, CI, login and scoping work, staging exists |
| **2. Reference data and booking** | Company, office, branch, agent; essential services, areas, vendors, shipment status definitions (from the ported prototype schema) | Customer, booking, AWB entry, lookup/detail, tracking, status history | Ticket create/list/detail, first transaction-detail report | A branch-scoped user can create and track an AWB. Ticket and report access are scoped |
| **3. Operations** | Vehicle, driver, courier, ETA, remaining operational master data (from the ported prototype schema) | Outbound, transit, inbound manifest; delivery sheet and outcome | Manifest and delivery reports, basic dashboard KPIs | A realistic AWB reaches delivered or exception. Matching reports reconcile |
| **4. Billing and advanced reports** | Stabilize RBAC and audit, configuration edge cases | Fee/vendor reference validation, shipment billing event contract, workflow edge cases | Invoice and payment flow, vendor-manifest report, gross profit draft (only after formula approval) | Invoices reference valid shipments, data is scoped, approved totals reconcile |
| **5. Finance and extended scope** | Permission and security audit, approved data maintenance tools | Approved sales enhancements, cancellation and returns, operational hardening | Account categories, ledger, cashflow categories, P&L, gross profit recap, ticket enhancements (all subject to sign-off) | Approved financial test cases reconcile. No undefined formula ships |
| **6. Hardening and rollout** | Cross-branch security audit, migration and backup checks | Transaction and race-condition tests, operations UAT | Accessibility and responsiveness review, report performance, finance UAT | Release checklist, restore test, performance checks, stakeholder UAT |

## 3. Critical path

```text
Org + permissions approved  >  Auth + branch scope  ----------------+
AWB model approved          >  Booking/AWB > Manifest > Delivery ---+--> Reports, dashboard
Finance rules approved      -----------------------------------------+--> Invoice, ledger, gross profit

Ported schema reviewed by owner  >  Master data (PLT-02, PLT-03)  >  feeds Booking/AWB and Manifest

Ticketing runs in parallel once auth, branch scope, and UI standards exist.
```

The prototype models speed up Dev 1 (master data, organization). Approved Customer/Consignee form additions also prepare Dev 2's reference data; operational models still require D-05 to D-09. Dev 3's accounting models wait for D-12 to D-14. All paths depend on the decision log and on observing the provider app.

Dev 1 unblocks everyone through scoping and master data. Dev 2 is the source of operational truth. Dev 3 can build ticketing and report layouts early using approved contracts and fixtures, never invented data. Finance is gated by business decisions, not by sprint number.

## 4. Ticket backlog

One owner per ticket. Every ticket specifies FE, server, schema impact, authorization, and tests. Split large tickets into small end-to-end slices, never into FE vs BE ownership. Tickets for Phase 4 and 5 items not listed here (Dev 1 audit work, Dev 2 sales enhancements and returns) are written at phase entry. Track status in the issue tracker.

**Gate before PLT-01:** D-03 and D-04 (organization tree, permission matrix, observed in the provider app's user and menu rights screens) must be at least `OBSERVED` and reviewed by one other dev. Better Auth selection is approved in the SCH-01 refinement note; its version, adapter schema, and identity mappings must be verified. Authentication behavior, RBAC, and branch scoping remain PLT-01; provider selection does not approve a permission model.

**Acceptance:** each OPS, PLT, RPT, SUP, and FIN ticket starts from its DISC result and is accepted on a documented side-by-side check against the provider app (`docs/PRD.md` AC-08). A ticket whose behavior is ambiguous, undocumented, or should not be replicated does not start until its decisions are `CONFIRMED`.

**Schema port and refinement:** SCH-01 is **DONE / APPROVED**, accepted by the project coordinator on 2026-10-19 for its completed scope. Its initial 38-model port across six domain groups is historical. The refinement is implemented and locally verified: domain Int keys, Better Auth schema/adapter foundation with ignored legacy storage retained, appropriate lifecycle/soft-delete fields, comment cleanup retaining DRAFT guards, Customer/Consignee with Vendor-pattern child drafts, and 30 deterministic fake records across 22 list entities (662 fixtures). Six forward migrations follow the original six; both local databases were verified current with no drift. See `docs/decisions/SCH-01.md` for commands, grouping, evidence and limitations. Applied migrations remain append-only; no reset or regeneration occurred. Coordinator acceptance does not claim independent domain-owner reviews. DRAFT models remain unused in routes/actions/UI; D-25, D-26, D-27 and financial/integration decisions stay open. Shipment, manifest, delivery, and ticket models are not invented here. Development uses logistik_web; tests use logistik_web_test with separate guards.

**Gate before FND-03:** SCH-01's dependency is **formally unblocked** by the project coordinator's explicit approval of the completed scope on 2026-10-19. Independent domain-owner reviews are not claimed. Unresolved business behavior and nullable/draft semantics retain their D-xx gates; draft tax/accounting and integration models do not become UI scope through this approval. Other FND-03 prerequisites remain applicable. FND-03 and PLT-01 have not started in this refinement.

| ID | Phase | Owner | Deliverable | Requires | Decisions |
|---|---|---|---|---|---|
| DISC-01 | 0 | All | Secure access to the provider app for side-by-side checks, confirm parity scope, data migration, approvals, infrastructure (D-01, D-23, D-28 are `CONFIRMED`) | Stakeholder input | D-02, D-10, D-17, D-18, D-20, D-21, D-22, D-24, D-29 |
| DISC-02 | 0 | Dev 1 | Observed behavior for organization, users, permissions, master data. Permission matrix from the provider app. Review of the ported schema | DISC-01 | D-03, D-04, D-25, D-27 |
| DISC-03 | 0 | Dev 2 | Observed behavior for booking/AWB, shipment, manifest, delivery. Numbering and transition rules from observed inputs and outputs | DISC-01 | D-05 to D-09, D-26 |
| DISC-04 | 0 | Dev 3 | Observed behavior for accounting, reports, tickets, dashboard. Report catalogue and financial formulas. Accounting stays deferred | DISC-01 | D-11 to D-16, D-24 |
| FND-01 | 1 | All (one integrator) | Next.js 16 baseline, Prisma/Postgres setup, migrations, test framework and test database strategy, `globals.css` tokens, UI conventions, Prisma conventions (English names, status enum, `Decimal`, `DateTime`), `docs/reference/` folder. No domain models (they land in SCH-01) | DISC-01 | D-19, D-20 |
| FND-02 | 1 | All (one integrator) | CI pipeline (lint, typecheck, test, build with a Postgres service) and staging environment on self-hosted infrastructure | FND-01 | D-20 |
| FND-03 | 1 | All (one integrator) | UI foundation: component base (shadcn/ui proposed), design tokens in `globals.css`, app shell with navigation from the provider app's menu tree, base patterns (table, form, dialog, filters, empty/loading/error states), verified at 375, 768, and 1440 px | FND-01, SCH-01 | D-19 |
| SCH-01 | 1 | Codex (migration coordinator); project coordinator approval | **DONE / APPROVED (2026-10-19)** by the project coordinator for the completed scope. Domain Int PK/FKs, Better Auth schema/adapter foundation, lifecycle/soft deletion, comment cleanup retaining DRAFT guards, Customer/Consignee with Vendor-pattern child drafts, 30 rows across 22 lists and exact dev/test guards. Six forward migrations applied safely; original six unchanged. SCH-01 dependency for FND-03 formally cleared. No independent domain-owner reviews claimed; unresolved D-xx/DRAFT restrictions remain. Evidence in SCH-01 note | FND-01 | D-24, D-25, D-26, D-27, D-30 |
| PLT-01 | 1 | Dev 1 | Better Auth behavior/session configuration, RBAC, branch isolation, user/group/settings screens, tests; consume SCH-01 identity schema | DISC-02, FND-01, FND-03, SCH-01 | D-03, D-04 |
| PLT-02 | 2 | Dev 1 | Office master data, essential master data, shipment status definitions, from the ported prototype schema | PLT-01, SCH-01, DISC-02, DISC-03 | D-07, D-27 |
| PLT-03 | 3 | Dev 1 | Vehicle, driver, courier, ETA, remaining operational master data, from the ported prototype schema | PLT-02 | D-25 |
| OPS-01 | 2 | Dev 2 | Booking/AWB UI and server, numbering, idempotency tests | DISC-03, PLT-01, PLT-02 | D-05, D-06, D-21, D-26 |
| OPS-02 | 2 | Dev 2 | Shipment status, tracking, history | OPS-01 | D-07 |
| OPS-03 | 3 | Dev 2 | Manifest (transit, inbound, outbound) and delivery flow | OPS-02, PLT-03 | D-08, D-09 |
| OPS-04 | 4 | Dev 2 | Fee/vendor reference validation and shipment billing event contract | OPS-03 | D-11 |
| SUP-01 | 2 | Dev 3 | Ticket CRUD and lifecycle with role/branch authorization | PLT-01, DISC-04 | D-16 |
| RPT-01 | 2 | Dev 3 | Transaction detail and first operational report | OPS-01, stable source contracts | D-15, D-19 |
| RPT-02 | 3 | Dev 3 | Manifest, delivery, vendor, and dashboard reports | OPS-03 | D-15 |
| FIN-01 | 4 | Dev 3 | Invoice and payment workflows | OPS-01, OPS-04, DISC-04 | D-11, D-12, D-21 |
| FIN-02 | 5 | Dev 3 | Ledger, categories, P&L, gross profit and recap with reconciled formulas | FIN-01 | D-13, D-14 |
| REL-01 | 6 | All | Regression, security, UAT, backup/restore, deploy readiness | Release-scope tickets | D-17 |

## 5. Working agreements specific to this roadmap

- Owners are accountable for sign-off. Any dev or coding agent can draft a DISC ticket or a schema port, but the domain owner reviews it before an item moves from `OBSERVED` to `CONFIRMED`.
- Port, do not copy: prototype models follow the port rules in `docs/PRD.md` section 10.
- Demo a realistic user journey at each phase exit, not only isolated CRUD screens.
- Keep blocked decisions and unresolved trade-offs visible in the PRD decision log.
- Do not assign completion dates until scope and capacity are validated.

## 6. Key delivery risks

| Risk | Mitigation |
|---|---|
| Scope ambiguity: menu names do not describe workflows | Stakeholder-reviewed examples and the PRD decision log |
| Migration conflicts from concurrent Prisma schema edits | One migration coordinator per phase and short-lived branches (`AGENTS.md` section 3) |
| Operational coupling: invoices and reports depend on AWB and manifest | Early source contracts and fixtures |
| Financial errors: gross profit and ledger are not simple CRUD | Reconciliation cases and formal sign-off |
| False confidence from the prototype: demo-level CRUD and a UI field inventory, with no constraints or operational rules | Treat as a head start only, verify against the provider app and sample documents, and keep D-05 to D-09 open until confirmed |
| Blind porting of prototype schema habits (string statuses, string dates, unlinked regions, plain personal data) | Port rules in `docs/PRD.md` section 10 and owner review of the schema PR |
| Losing access to the provider app: side-by-side checks need a stable way to run it and archived sample documents | Secure a test account or sandbox and archive screens and sample documents early (D-29) |
| Skipping Phase 0 gates: starting PLT-01 before D-03 and D-04 means guessing the permission model | Gate before PLT-01 (section 4) |
| Uneven workload: Dev 3 scope may exceed one person's capacity | Adjust phase priorities or move bounded features to another dev, keeping one owner per feature |
