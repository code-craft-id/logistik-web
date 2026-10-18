# PRD | Logistics Management System

**Status:** Working draft for stakeholder validation
**Team:** 3 full-stack developers, ownership by feature
**Related docs:** `AGENTS.md` (engineering rules, stack, security, UI standards), `docs/ROADMAP.md` (phases, ownership, ticket backlog), `docs/reference/` (provider app and prototype reference material, see section 10)

This PRD defines **what** to build and which rules still need approval. It does not repeat **how** to build (see `AGENTS.md`).

**Status legend used below:** `CONFIRMED` (approved by business), `OBSERVED` (seen in the provider app, sample documents, or the prototype, but not yet confirmed by the domain owner and the business), `PROVISIONAL` (working assumption), `TBD` (blocked until decided, see section 7).

## 1. Product goal

This is a standalone rebuild of an existing provider app on Next.js. The **provider app** is the original hosted product and the **oracle** for behavior (D-01). The **prototype** is an early Go + React demo with simple CRUD, built by imitating it (D-28). It is a head start (models, screens), not a spec. v1 matches the provider app unless a decision says otherwise (D-22).

One internal, multi-branch web platform to:
- administer logistics entities and permissions,
- run booking-to-delivery operations,
- produce invoices and financial views,
- generate branch reports,
- handle support tickets.

The supplied dashboard screenshot is a **navigation and feature reference only**, not a UI spec or a source of business logic. Observed provider app behavior is evidence (`OBSERVED`), never an approved rule until confirmed (see section 10).

## 2. Personas and permissions (PROVISIONAL)

| Persona | Typical responsibilities |
|---|---|
| System admin | Users, user groups, menu/action rights, system settings |
| HQ / leadership | Cross-branch dashboards and reporting |
| Branch manager | Branch transactions, staff operations, branch reporting |
| Sales / customer service | Customers, sales, booking, AWB entry, tracking |
| Operations staff | Manifest, transit/inbound/outbound, delivery sheet, shipment events |
| Finance | Invoices, payments, ledger, account categories, financial reports |
| Ticket agent | Review, assign and resolve tickets |

Access is defined by a reviewed **permission matrix** with two parts: action permissions (`view`, `create`, `update`, `approve`, `export`, etc.) and allowed branches. Display rules never replace server authorization.

## 3. Scope by domain and owner

| Domain | Features | Owner | Initial priority | Prototype |
|---|---|---|---|---|
| System Settings | User groups, user management, menu/action permissions | Dev 1 | Core | Unknown |
| Office | Company, office, branch office, agent | Dev 1 | Core | Unknown |
| Master Data | Logistics area (province, regency, district, village, postal code), division, services and service categories, transport modes, vehicles and vehicle/trucking types, drivers, couriers, goods types, cost types, terms, settings; vendor; ETA; shipment status definitions | Dev 1 | Core subset first | Unknown |
| Sales / Marketing | Sales references, customers, marketing personnel and workflows | Dev 2 | Foundations first, scope TBD | Unknown |
| Customer Service | Booking, transaction/entry AWB, shipment status, AWB tracking | Dev 2 | Core | Unknown |
| Operations | Manifest (outbound, transit, inbound), delivery sheet, proof/outcome of delivery | Dev 2 | Core | Unknown |
| Accounting | Ledger, account categories, P&L, cashflow categories, invoicing/payments | Dev 3 | Basic billing first, accounting gated | Unknown |
| Reports | Transaction detail, outbound manifest, delivery, gross profit, gross profit recap, vendor manifest | Dev 3 | Operational reports first | Unknown |
| Ticketing | Ticket lifecycle, assignment, links to shipment/customer | Dev 3 | After operational core, unless needed for launch | Unknown |
| Dashboard | Branch/date/period/year filters, quick actions, operational metrics | Dev 3 | Navigation first, KPIs once data sources exist | Unknown |

The **Prototype** column is `Started`, `Missing`, or `Unknown`. DISC tickets fill it in. `Started` means a head start (reuse models and CRUD ideas), not a spec. Behavior for every feature is observed in the provider app, and decisions must be `CONFIRMED` where the provider app is ambiguous, undocumented, or should not be replicated.

Master data items beyond the original list (drivers, couriers, goods types, cost types, terms, modes, trucking and vehicle types, region hierarchy, marketing personnel) are `OBSERVED` in the prototype models and stay subject to D-22.

Contract ownership and cross-domain responsibilities are defined in `AGENTS.md` section 3. Invoice and billing reference contracts need agreement between Dev 2 and Dev 3, with Dev 3 as primary implementer.

## 4. Core business journey (UNCONFIRMED)

```text
Customer > Booking > AWB/transaction > Shipment status history
  > Outbound manifest > Transit/inbound (as needed) > Delivery sheet
  > Delivered or exception > Invoice/payment > Ledger/reporting
```

Every step needs explicit decisions on cancellation, returns, retries, partial deliveries, approval, and cross-branch movement (see D-05 to D-09).

## 5. Functional requirements

### FR-01. Identity, office and scoping
- Manage users, access, and each user's allowed branches.
- Maintain company, office, branch, and agency reference structures.
- Deny both list access and direct record access outside permission and branch scope.
- Prevent unsafe deletion of entities used by transactions.

### FR-02. Logistics master data
- Manage areas, divisions, services, vehicles, vendors, shipment statuses, and ETA reference rules.
- Historical shipment references must survive master-data deactivation.
- Provider master pages support deletion; implement it as soft deletion (`deletedAt`), preserving references. Inactive status and deletion are separate concepts; retention and restoration policies remain subject to approval.
- Mandatory fields and relationships follow domain validation (TBD per entity).
- Use the prototype models as a head start, following the port rules (section 10). Do not copy prototype types or names blindly.
- Personnel records (drivers, couriers, marketing) hold personal data (ID card, license, phone, address). Handling follows D-25.

### FR-03. Booking, AWB and tracking
- Create, edit, and cancel bookings under approved rules.
- Create uniquely numbered AWB/transactions with sender, receiver, service, origin/destination, quantity/weight, agreed rate, and other approved fields.
- Support search, detail view, status history, and tracking by AWB.
- Duplicate submissions must not create duplicate business documents.

### FR-04. Manifest and delivery operations
- Create outbound, transit, and inbound manifests from eligible shipments, with the appropriate branch, vendor, and vehicle. Track handovers.
- Generate delivery sheets and capture delivery result or exception.
- Prevent duplicate active assignment.
- Apply a reviewed status transition matrix.

### FR-05. Accounting and billing
- Issue invoices, record payments and payment status, manage account categories and cashflow categories.
- Ledger postings and P&L start only after approval of: chart of accounts, debit/credit and posting rules, tax/discount conventions, and recognition timing (D-12 to D-14).
- Calculations must be reconcilable to source documents.

### FR-06. Reports and dashboard
- Support branch, period, date, and year filters, with searchable and paginated reports and approved exports.
- Reports: transaction detail, outbound manifest, delivery, gross profit, gross profit recap, vendor manifest.
- Before UI sign-off, each report must define: filters, date basis, units, totals, included statuses, permissions, and source query.
- Dashboard quick actions mirror allowed pages and never grant privileges.

### FR-07. Ticketing
- Create tickets with category, description, linked AWB/customer where applicable, priority, assignee, status, and a chronological event/comment history.
- Visibility by branch and user, plus resolved/reopened rules, must be defined (D-16).

### FR-08. Sales and marketing
- Build only workflows explicitly approved by the business owner.
- Minimum baseline: customer records and sales attribution.
- Approved SCH-01 field scope from provider forms: Customer has name, address, regency, phone, fax, contact person, email, marketing, branch, term, POD requirement, cost type, WhatsApp notification status, and tax/accounting tabs. Consignee has name, two address fields, regency, phone, PIC, customer, branch, and status. Relate to existing Regency, MarketingPerson, Branch, Term, CostType, and Customer as appropriate; requiredness and business semantics are not inferred from labels.
- Customer tax/accounting structures follow VendorTaxProfile/VendorAccounting patterns as guarded schema drafts. Field approval does not settle D-10 commercial workflows, D-11 to D-14 financial behavior, D-18/D-24 notification integration, D-25 privacy, or D-27 region hierarchy.
- Quotations, commissions, pipelines, and campaigns remain undefined until requirements are gathered (D-10).

## 6. Product-level nonfunctional requirements

Engineering implementation details (stack, authorization patterns, migrations, testing, UI standards) live in `AGENTS.md`. This section lists what the product must achieve.

| Area | Requirement |
|---|---|
| Security | Branch isolation and permission enforcement on the server. Important changes are audited. No secrets or PII in logs. Personal data handling follows D-25. Better Auth is selected for identity storage; authentication/session behavior, RBAC, and branch scoping remain PLT-01. |
| Data integrity | Multi-record operations are atomic. Business documents are traceable and history is immutable where specified. |
| Performance | Paginated lists and bounded queries. Concrete latency and volume targets TBD after sizing (D-20). |
| Operations | Separate staging and production. Documented DB backup and restore. Observability, audit trail, and a rollback or forward-fix plan. |
| UX | Consistent, reusable, mobile-first responsive admin UI with clear validation, error, empty, and loading states. Localization and time zone conventions need approval (D-19). |
| Quality | Code review, automated tests, migrations validated on staging, and passing build, typecheck, and lint gates. |

## 7. Decisions requiring business approval

**Resolution order for each D-xx:** (1) observe the provider app (run it with test inputs, collect sample documents), mark `OBSERVED`, and cite the screen or document, (2) use the prototype only for field lists or a head start, never as proof of behavior, (3) ask the stakeholder when the provider app is ambiguous, undocumented, or its behavior should not be replicated.

This table is the decision log. Update its Status (`CONFIRMED`) and add the agreed rule to the relevant FR **before** implementing any dependent feature. Cite the ID when blocked (`BLOCKED: decision required, D-xx`, see `AGENTS.md` section 7). "Resolve via" and "Needed before" refer to `docs/ROADMAP.md` tickets and phases. Add a new row with the next free ID for any new open question.

D-30 records the user's technical SCH-01 approval on 2026-10-18 separately from business approval. Its refinements were implemented and locally verified on 2026-10-19, then accepted as DONE / APPROVED by the project coordinator for the completed SCH-01 scope. That acceptance clears SCH-01's FND-03 dependency without claiming independent domain-owner reviews. D-30 remains `PROVISIONAL` for outstanding domain/import semantics; no unresolved D-xx is closed by this approval.

| ID | Area | Question | Blocks | Resolve via | Needed before | Status |
|---|---|---|---|---|---|---|
| D-01 | Existing system | Is this an extension, a redesign, or a replacement of an existing product? Decision: standalone replacement of the provider app (per the team's understanding of stakeholder input; re-verify in DISC-01). | All | DISC-01 | Phase 1 start | CONFIRMED |
| D-02 | Existing system | Is data migration from the provider app required? If yes: export access and legal right to the data, format, provider ID and AWB number continuity, and history depth. | FR-01 to FR-03 | DISC-01 | Phase 1 start | TBD |
| D-03 | Organization | Exact company, office, and agency hierarchy? | FR-01 | DISC-02 | PLT-01 | TBD |
| D-04 | RBAC | Multi-branch users, HQ override, and the full list of permission actions? | FR-01 | DISC-02 | PLT-01 | TBD |
| D-05 | Shipment | Booking to AWB relationship, and AWB to pieces relationship? | FR-03 | DISC-03 | OPS-01 | TBD |
| D-06 | Shipment | AWB numbering scheme? | FR-03 | DISC-03 | OPS-01 | TBD |
| D-07 | Shipment | Status list and transition matrix? | FR-03, FR-04 | DISC-03 | PLT-02, OPS-02 | TBD |
| D-08 | Operations | Manifest types, routes, and handover semantics? Re-manifest rules? | FR-04 | DISC-03 | OPS-03 | TBD |
| D-09 | Operations | Failed delivery and return flows? | FR-04 | DISC-03 | OPS-03 | TBD |
| D-10 | Commercial | Sales process and customer classification? | FR-08 | DISC-01 | Phase 5 sales work | TBD |
| D-11 | Commercial | Rate, discount, tax, COD, and vendor costing rules? | FR-03, FR-05 | DISC-04 | OPS-04, FIN-01 | TBD |
| D-12 | Financial | Invoice lifecycle and payment handling? | FR-05 | DISC-04 | FIN-01 | TBD |
| D-13 | Financial | Chart of accounts and posting rules? | FR-05 | DISC-04 | FIN-02 | TBD |
| D-14 | Financial | Profit calculation and recognition date? | FR-05, FR-06 | DISC-04 | FIN-02 | TBD |
| D-15 | Reports | Exact columns, formulas, export formats, date/time basis, access scope, and sample outputs per report? | FR-06 | DISC-04 | RPT-01, RPT-02 (per report) | TBD |
| D-16 | Ticketing | Visibility, assignment, and resolved/reopened rules? | FR-07 | DISC-04 | SUP-01 | TBD |
| D-17 | Delivery | Launch scope and date? | All | DISC-01 | Phase 1 start | TBD |
| D-18 | Delivery | Required integrations? | TBD per integration | DISC-01 | Phase 1 start | TBD |
| D-19 | Delivery | Localization and time zone conventions? | FR-06 | FND-01 | FND-01, RPT-01 | TBD |
| D-20 | Delivery | Volumes, infrastructure, and data retention? Decision so far: self-hosted deployment. Backup and restore, TLS, and monitoring are the team's responsibility. | NFR | DISC-01, FND-01 | FND-01 (infra), REL-01 (volume) | TBD |
| D-21 | Delivery | Required approvals and approvers? | FR-03 to FR-05 | DISC-01 | OPS-01, FIN-01 | TBD |
| D-22 | Parity scope | Which provider app features, fields, and report layouts are kept for v1, and which are dropped or redesigned? Decision: v1 matches the provider app. Redesigns need an explicit decision. | All | DISC-01 | Each domain's first ticket | PROVISIONAL |
| D-23 | Prototype models | Provenance of the Go models. Decision: reverse-engineered from the provider's frontend tables, so they are a UI field inventory (visible columns only), not a database schema. | FR-01, FR-02, FR-05 | DISC-01 | PLT-02 | CONFIRMED |
| D-24 | Prototype scope | Are department, wallet, bank accounts, NPWP/tax ID, and WhatsApp notification in v1 scope? Is PRD "division" the same concept as the prototype's department? Prototype contents are reviewed; approved Customer tax/accounting draft storage does not settle broader v1 behavior. | FR-01, FR-05, D-18 | DISC-01 | PLT-01, FIN-01 | TBD |
| D-25 | Personal data | Handling of ID card, license, phone, and address on marketing, driver, and courier records: required fields, protection, masking, who can view, retention. | FR-02, FR-08 | DISC-02 | PLT-03 | TBD |
| D-26 | Master data semantics | What does `Mode.Divider` mean and which numeric type does it need? (Appears to be a volumetric weight divisor, stored as a string in the prototype model.) | FR-02, FR-03 | DISC-03 | OPS-01 | TBD |
| D-27 | Region hierarchy | Prototype region models have no parent links, likely because the source UI tables show only name and status. Which hierarchy, data source, and postal code mapping apply? | FR-02, FR-03 | DISC-02 | PLT-02 | TBD |
| D-28 | Prototype status | Status of the Go + React prototype. Decision: early demo with simple CRUD, not in production use and not validated by stakeholders. It has no behavioral authority. | All | DISC-01 | Phase 1 start | CONFIRMED |
| D-29 | Oracle access | How does the team keep access to the provider app for side-by-side checks (test account, sandbox, read-only access, sample data), and may screens and documents be archived in the repo? | All | DISC-01 | Phase 1 start | TBD |
| D-30 | Schema refinement | Technical scope implemented, locally verified and accepted by the project coordinator as SCH-01 DONE / APPROVED (2026-10-19): domain Int PK/FKs; Better Auth identity with ignored legacy storage retained; lifecycle/soft deletion; comment cleanup retaining DRAFT guards; Customer/Consignee and Vendor-pattern child drafts; 30 fake rows per list entity; separate dev/test targets. Six forward migrations preserve history and rows. SCH-01's FND-03 dependency is cleared; independent domain-owner reviews are not claimed. Field requiredness/import mapping, further defaults/indexes/referential exceptions, and soft-delete key reuse/restoration semantics remain unresolved. Existing uniqueness and RESTRICT domain relations retained. | FR-01, FR-02, FR-05, FR-08; decision-dependent workflows | Domain owner review and business approval for remaining semantics | Before dependent workflows/shared deployment; not a remaining SCH-01 completion gate | PROVISIONAL |

## 8. Release boundaries

**Initial end-to-end release candidate** (see `docs/ROADMAP.md` for tickets)

| Step | Roadmap phase |
|---|---|
| Auth, branches, minimum master data | 1 and 2 |
| Booking and AWB | 2 |
| Tracked shipment status | 2 |
| Manifest and delivery | 3 |
| Basic invoice | 4 |
| Scoped transaction and operational reports | 2 to 4 |

**Later or conditional** (not dropped, priority depends on stakeholder confirmation and capacity)
- Comprehensive sales CRM
- Sophisticated vendor costing and gross profit
- Full P&L and ledger automation
- Advanced ticket workflows
- Optional integrations

## 9. Acceptance

Minimum acceptance scenarios:

| ID | Scenario | Covers |
|---|---|---|
| AC-01 | A user restricted to Branch A cannot access Branch B bookings, AWBs, invoices, or reports, through the UI or direct server requests. | FR-01, FR-03, FR-05, FR-06 |
| AC-02 | Repeating the same AWB submission cannot create multiple AWBs when an idempotency rule applies. | FR-03 |
| AC-03 | An invalid shipment transition is rejected without changing history or shipment state. | FR-03, FR-04 |
| AC-04 | A duplicate active manifest assignment fails safely, even on concurrent requests. | FR-04 |
| AC-05 | Branch reports reconcile to the agreed source records and date/branch filters. | FR-06 |
| AC-06 | Payment posting commits all required records or none. Approved ledger entries balance. | FR-05 |
| AC-07 | Ticket visibility and assignment respect role and branch access. | FR-07 |
| AC-08 | A feature behaves like the provider app for the same inputs, outputs, and permissions, shown in a documented side-by-side check (D-29). Intentional deviations are listed and approved by the domain owner. | FR-01 to FR-08 |

Product acceptance requires:
- Operations and finance representatives validate end-to-end workflows against sample documents and expected outputs, including parity checks against the provider app within the scope set by D-22.
- Role and branch separation passes negative tests.
- High-risk calculations reconcile.
- Staging tests and the backup/restore process are documented.
- No unresolved critical defects.

## 10. Reference sources (provider app and prototype)

**Sources.** The **provider app** is the oracle: observe it for behavior. The **prototype** (Go + React) is an early demo with simple CRUD (D-28). It is a head start, not a spec. The Go models inside it are a field inventory.

**What the Go models are.** They were reverse-engineered from the provider's frontend tables (D-23): visible columns only, not database constraints, hidden relations, defaults, or business rules. Several oddities (regions without parent links, dates as strings) are likely gaps of that method, not provider design.

**Evidence ranking** (higher wins):
1. Approved decisions in this PRD (`CONFIRMED`).
2. Provider app behavior (inputs and outputs observed in the running app) and sample documents (`OBSERVED`).
3. Prototype code and Go models (`OBSERVED`, head start only, no behavioral authority).

If the prototype and the provider app differ, the provider app wins. An `OBSERVED` item becomes a rule only after its domain owner and the business confirm it, and it never overrides a `CONFIRMED` decision.

**Where things live**

| Path | Purpose |
|---|---|
| `docs/reference/prototype-models/` | Read-only copy of the Go models. Not part of the build. |
| Prototype source (Go + React) | Kept outside this repo as a read-only reference. Location: TBD (record the path or repo URL here). |
| `docs/reference/provider/` | Screen captures and sample documents from the provider app (AWB, manifest, delivery sheet, invoice, report exports), subject to D-29. Mask real customer data before committing. |
| `prisma/schema.prisma`, `prisma/schema/` | Target core and domain schemas. SCH-01 removed Prototype/PII comments and retained relevant DRAFT guards. Source mappings/privacy inventory remain in SCH-01 documentation, the read-only Go source and baseline preservation fixture (including future D-02 import needs). List deviations in the PR description. |

**Port status by domain**

| Domain | Status |
|---|---|
| Organization, identity, master data (Dev 1), marketing personnel (Dev 2) | SCH-01 DONE / APPROVED by the project coordinator (2026-10-19); six original plus six forward migrations applied and verified on development/test. Better Auth-compatible active storage replaces prototype identity delegates; ignored legacy tables retained. FND-03 dependency formally cleared without claiming independent domain-owner reviews. Shared deployment and decision-dependent behavior retain their review gates. |
| Customer, Consignee (Dev 2; tax/accounting reviewed by Dev 3) | Provider-form schema additions implemented in SCH-01, with 30 fake records each. Tax/accounting structures follow Vendor patterns as guarded drafts; no financial or notification workflows approved. Nullable form/child contract awaits domain review. |
| Accounting, invoice, wallet, bank (Dev 3) | Ported as `/// DRAFT` models. Unused by any route, action, or UI until D-12 to D-14 are decided (FIN-01, FIN-02). Money fields use `Decimal`. |
| WhatsApp notification | Ported as a `/// DRAFT` model until D-24 decides scope. |
| Booking, AWB, shipment, manifest, delivery, ticket | No prototype model. Derive from observing the provider app and sample documents (D-05 to D-09). |

**Port rules** (what the Prisma schema must not inherit)

| Prototype pattern | Prisma target |
|---|---|
| Integer primary/foreign keys normalized to BigInt in the initial port | Domain PK/FK `Int`, including nullable and self-referencing keys; preserve matching types and existing relationships. Better Auth keys follow the version-verified adapter contract. |
| Prototype User/passwordHash and RefreshToken | Better Auth-compatible identity schema; authentication, RBAC, branch membership, and session policies remain PLT-01. |
| Lifecycle fields absent from most models | Add `createdAt`, `updatedAt`, nullable `deletedAt` where technically appropriate; document exceptions and backfills (D-30). |
| `Status` string (`Active`/`Inactive`) on master data, but `IsActive` bool on `Vehicle` | One status enum used consistently. Keep deactivation separate from soft deletion; no hard deletion of domain masters (FR-02). |
| Dates stored as `*string` (STNK date, insurance expiry) | `DateTime` with `@db.Date` |
| Numeric value stored as `string` (`Mode.Divider`) | Numeric type decided in D-26 |
| `BranchRef` stub struct | Not a model. A real relation to `Branch`. |
| Indonesian and English names mixed (`NoPolisi`, `JenisTrucking`, `Moda`, `Keterangan`) | English field names. Keep source mapping in documentation; remove `/// Prototype:` schema comments. |
| Province, regency, district, village share identical fields with no parent links. Postal code is unlinked. | Hierarchy designed under D-27 |
| `VehicleType` defined but not referenced by `Vehicle` (which uses `TruckingType`) | Verify both are needed before keeping |
| ID card, license, phone, address as plain columns | Handling per D-25 |
| Constraints invisible from the UI (unique keys, required fields, relations, delete behavior, indexes) | Design explicitly: unique constraints, indexes for branch and status filters, delete rules. Confirm with the domain owner. |
| Any amount field | `Decimal` with currency and explicit rounding (`AGENTS.md` section 6) |

**Parity check.** Each feature gets a side-by-side check against the provider app (same inputs, same outputs, same permissions), documented in the PR (D-29). Intentional deviations are listed and approved by the domain owner. If the provider app has a defect or a behavior that should not be replicated, record it as a decision instead of silently copying or fixing it.

**Coverage warning.** The models cover master data visible in the provider UI. Operational rules (AWB numbering, status transitions, manifest and delivery flow) have no model, so D-05 to D-09 must come from observing the provider app and sample documents. A field inventory is not a transition matrix.
