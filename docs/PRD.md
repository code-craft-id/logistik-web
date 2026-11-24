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
- Maintain company, office, branch, and agency reference structures. Approved Branch refinement D-33 adds nullable postal code, fax, email, Finance/Marketing contact names and NPWP, without changing parent relationships.
- Deny both list access and direct record access outside permission and branch scope.
- D-03/D-04 bounded v1 approved by the stakeholder on 2026-10-27: Company -> Office -> Branch -> Agent; one group per user; explicit action grants and allowed branches; full access only through `system_admin:manage`. Organization mutations require administrator access. Active user/group and server-side branch enforcement remain required. This accepts the existing Dev 1 contract, not future booking/AWB permissions, provider parity or staging results.
- Prevent unsafe deletion of entities used by transactions.
- WhatsApp setup (D-34): integrate with a separate Baileys project using one number/session per branch. Stakeholder delegated the API contract to LMS: scoped status checks and administrator-only QR/connect/logout are implemented. The gateway follows the documented v1 contract. Automatic notification triggers and sending remain separate decisions.
- Implementation checkpoint, 2026-10-25: runtime PLT-01 identity and PLT-02/03 organization/master CRUD are implemented and locally checked; see [Dev 1 contracts and handoff](decisions/DEV1-2026-10-25.md). This supersedes the older partial-code snapshot. This checkpoint is historical: D-03/D-04 bounded-v1 stakeholder acceptance was recorded on 2026-10-27 and PR #7 supplies independent code review. Complete provider role parity, staging and review of subsequent changes remain open; implementation is not full release acceptance.

- Temporary handoff exception, 2026-10-27: stakeholder explicitly accepts local test/build/smoke results instead of staging for PLT-01/PLT-02 Dev 1 handoff only. Actual staging and provider non-admin comparison remain required before release. See [approval record](decisions/DEV1-OPS01-HANDOFF.md#temporary-staging-substitution-approved-2026-10-27). No booking/AWB approval or global release waiver is implied.

### FR-02. Logistics master data
- Manage areas, divisions, services, vehicles, vendors and shipment-status definitions. ETA reference rules are explicitly deferred until Dev 2 defines the operational requirement (D-31).
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

RPT-01A implementation checkpoint2026-11-15: the selected nine-column non-financial Transaction Detail Report is implemented and locally verified with explicit 31-day dates, separate report permission/currentACTIVEbranch scope and snapshot-consistent paging/count. Its former UTC basis was superseded by the owner-wide Asia/Jakarta policy on 2026-11-21. Full report parity remains PARTIAL. Owner consolidates Dev1/Dev2 code reviews in finalDev3PR; no development approval gate. Formal named-owner approval record remains PARTIAL; explicit task-local OptionA persists. See [contract](decisions/RPT-01-contract.md) and [verification](decisions/evidence/rpt-01/verification.md).

### FR-07. Ticketing
- Create tickets with category, description, linked AWB/customer where applicable, priority, assignee, status, and a chronological event/comment history.
- Visibility by branch and user, plus resolved/reopened rules, must be defined (D-16).
- Bounded SUP-01 direction selected on 2026-11-15: create/list/detail with observed subject/menu/URL/remarks and explicit Low/Normal/High. Ordinary readers see only tickets they created in currently allowed owning branches; creation validates active branch and server creator.
- Losing the owning branch from current scope removes list/detail and replay access; tickets do not transfer automatically. Only the explicit administrator may read others' tickets in the proposed scope. This increment has no support-agent follow-up, assignment or resolution workflow.
- Internal ID and labelled ISO8601 UTC creation transport are bounded target differences; user-facing creation time is formatted in Asia/Jakarta per the 2026-11-21 owner-wide policy. Status/approval, files, edit/delete, assignment/resolve/reopen, comments/history and unobserved FR-07 extensions remain deferred, not removed from the full requirement.
- The self-identified project owner/migration coordinator selected Option A and accepted one additive Ticket model in the current task. Name/GitHub approver identity is not supplied, so the formal record is PARTIAL under PR #10 review; this does not undo the stated direction or supply Dev1 approval. See [current contract and dated approval record](decisions/SUP-01-contract.md#decision-and-approval-record). No production migration execution is authorized.
- Dev1 explicitly accepted the revised permission/branch/admin/provenance contract on 2026-11-15 in [PR #10](https://github.com/code-craft-id/logistik-web/pull/10#pullrequestreview-5908594183). Record actor/server time is sufficient provenance for this increment; no extra audit event. Implementation permission/predicate/tests and migrations still require owner PR review before human merge.

- Implementation checkpoint, 2026-11-15: bounded SUP-01 create/list/detail is implemented and locally verified with creator/current-branch security, admin rules and idempotent creation. [Verification](decisions/evidence/sup-01-core/verification.md) records exact code SHA, checks and known preexisting migration drift. This is not full FR-07 lifecycle, staging, production migration or final human code acceptance. New PR creation is deferred by the owner until all agreed Dev3 work is finished.

Owner-approved migration scope reduction, 2026-11-15 (explicit packet A): SUP-02 provider helpdesk lifecycle/approval/assignment/comments/history/edit/delete and SUP-03 attachments are NOT NEEDED for this migration scope; category/AWB/customer ticket extensions are not adopted. These are omissions accepted by the owner, never claims that legacy behavior does not exist or features were implemented. SUP-01 v1 remains accepted. RPT-03 retains the existing nine source-backed fields with separate origin/destination filters and sorting; five unsupported headers close with notes, receivedBy/notes remain DRS-item output. RPT-03 sourced filters/sorting and RPT-04 bounded CSV export (view+export grants, same predicate, max5000/overflow refusal, formula safety) are implemented and locally verified; exact code/checks are in the follow-up verification record. RPT-05 vendor attribution is NOT NEEDED for this scope and remains unimplemented; future capture/source requires an explicit requirement. Wider D-15/D-16/D-19/D-22/D-25 statuses outside this bounded choice remain unchanged. See [follow-up scope and authority](decisions/DEV3-SUP-RPT-FOLLOWUPS.md).

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
| D-03 | Organization | Bounded v1: Company -> Office -> Branch -> Agent; organization mutations require administrator access; historical references remain protected with soft deletion. Stakeholder approval recorded in DEV1-OPS01-HANDOFF. | FR-01 | DISC-02 | PLT-01 | CONFIRMED bounded v1, 2026-10-27 |
| D-04 | RBAC | Bounded Dev 1 v1: one group/user; explicit action grants and allowed branches; full access only through system_admin:manage. Active user/group and server-side scope checks remain required. Future operational permissions need separate review; provider parity and staging are not claimed. | FR-01 | DISC-02 | PLT-01 | CONFIRMED bounded v1, 2026-10-27 |
| D-05 | Shipment | Booking to AWB relationship, and AWB to pieces relationship? 2026-11-19 OBSERVED: bookings stand alone; pieces are scanned per koli (AWB-n labels) at transit/inbound (Cek Transit detail: Scan Koli / Sisa Koli / Pindah Manifest). Owner approved koli scan tracking (needs Dev 2 review). | FR-03 | DISC-03 | OPS-01 | OBSERVED, owner-approved |
| D-06 | Shipment | AWB numbering scheme? | FR-03 | DISC-03 | OPS-01 | PARTIAL — On 2026-11-21, the project owner approved Asia/Jakarta as the YYMM basis for automatic AWB and booking numbers; Dev 2 agreed to the AWB basis. The remaining AWB format, sequence, manual-entry and uniqueness policy remains TBD. |
| D-07 | Shipment | Status list and transition matrix? | FR-03, FR-04 | DISC-03 | PLT-02, OPS-02 | TBD |
| D-08 | Operations | Manifest types, routes, and handover semantics? Re-manifest rules? | FR-04 | DISC-03 | OPS-03 | TBD |
| D-09 | Operations | Failed delivery and return flows? | FR-04 | DISC-03 | OPS-03 | TBD |
| D-10 | Commercial | Sales process and customer classification? | FR-08 | DISC-01 | Phase 5 sales work | TBD |
| D-11 | Commercial | Rate, discount, tax, COD, and vendor costing rules? | FR-03, FR-05 | DISC-04 | OPS-04, FIN-01 | PARTIAL — owner adopted manual final IDR charges/direct Transaction sources and explicit actual-cost declarations in FIN-01/FIN-02 contracts, 2026-11-15; broader tariff/tax/COD/vendor settlement TBD |
| D-12 | Financial | Invoice lifecycle and payment handling? | FR-05 | DISC-04 | FIN-01 | CONFIRMED for bounded FIN-01 P1–P5 and reconciliation, owner adopted A+B 2026-11-15; broader workflows outside scope |
| D-13 | Financial | Chart of accounts and posting rules? | FR-05 | DISC-04 | FIN-02 | CONFIRMED for bounded FIN-02 B account/mapping/posting/period rules, owner adopted A+B 2026-11-15 |
| D-14 | Financial | Profit calculation and recognition date? | FR-05, FR-06 | DISC-04 | FIN-02 | CONFIRMED for FIN-02 B accounting-period movement, completeness and reconciliation rules, owner adopted A+B 2026-11-15 |
| D-15 | Reports | Exact columns, formulas, export formats, date/time basis, access scope, and sample outputs per report? | FR-06 | DISC-04 | RPT-01, RPT-02 (per report) | PARTIAL: RPT-01A nine-column non-financial Option A approved by project owner on 2026-11-15; Formal approver identity record PARTIAL; explicit owner Option A direction persists. Owner defers Dev1/Dev2 code/merge reviews to final combined Dev3 PR; actual Dev1 documentation corrections adopted. Other reports/rules remain TBD; see RPT-01-contract.md |
| D-16 | Ticketing | Visibility, assignment, and resolved/reopened rules? | FR-07 | DISC-04 | SUP-01 | PARTIAL: Option A create/read direction selected 2026-11-15; named formal approval record incomplete; later lifecycle rules TBD; Dev1 bounded contract accepted 2026-11-15; implementation code review remains required |
| D-17 | Delivery | Launch scope and date? | All | DISC-01 | Phase 1 start | TBD |
| D-18 | Delivery | Required integrations? Baileys in a separate stakeholder-supplied project is selected for branch WhatsApp; preparatory setup is approved under D-34. Transport and sending rules, plus other integrations, remain TBD. | TBD per integration | DISC-01, WA-01 | Before each live integration | PARTIAL |
| D-19 | Delivery | Localization and time zone conventions? | FR-06 | FND-01 | FND-01, RPT-01 | CONFIRMED — On 2026-11-21, the project owner set Asia/Jakarta as the system-wide business timezone for date defaults, date-only business periods/cutoffs, generated business identifiers, and user-facing date/time displays across modules and reports. Persist/transport timestamps as UTC instants; format them in Asia/Jakarta for users. This supersedes the bounded UTC display/range convention in RPT-01A and SUP-01. Date-only fields remain calendar dates without timezone conversion. |
| D-20 | Delivery | Volumes, infrastructure, and data retention? Decision so far: self-hosted deployment. Backup and restore, TLS, and monitoring are the team's responsibility. | NFR | DISC-01, FND-01 | FND-01 (infra), REL-01 (volume) | TBD |
| D-21 | Delivery | Required approvals and approvers? | FR-03 to FR-05 | DISC-01 | OPS-01, FIN-01 | PARTIAL — owner adopted FIN-01/FIN-02 explicit rights and same-actor issue/post/reverse/close without mandatory second approver, 2026-11-15; wider operational approvals TBD |
| D-22 | Parity scope | Which provider app features, fields, and report layouts are kept for v1, and which are dropped or redesigned? Decision: v1 matches the provider app. Redesigns need an explicit decision. | All | DISC-01 | Each domain's first ticket | PROVISIONAL globally; RPT-01A reduced nine-column non-financial Option A explicitly approved by project owner on 2026-11-15; other parity gaps deferred. Bounded SUP-01 record remains separate/PARTIAL 2026-11-17 decision by the requesting user (Ardiputra614) in the Dev 3 session, for LP-R10/R11/R21 only: LP-R11 AWB Termanifest = active assignments only (ManifestItem and Manifest not deleted, releasedAt empty), period by Manifest.manifestDate; LP-R10 AWB Tertunda = Transaction without an active assignment (never manifested or released), one row per AWB as a documented deviation from legacy per-piece rows; LP-R21 Semua Status 'Received by' = latest DeliverySheetItem with a recorded recipient (newest DRS date, then deliveredAt desc nulls last; refined after self-review so an undated newer attempt is not skipped). Implementation follows legacy opening state (LP-R10 all dates, LP-R11 current month, LP-R21 today). Owner confirmation of authority still recommended. |
| D-23 | Prototype models | Provenance of the Go models. Decision: reverse-engineered from the provider's frontend tables, so they are a UI field inventory (visible columns only), not a database schema. | FR-01, FR-02, FR-05 | DISC-01 | PLT-02 | CONFIRMED |
| D-24 | Prototype scope | Are department, wallet, bank accounts, NPWP/tax ID, and WhatsApp notification in v1 scope? Is PRD "division" the same concept as the prototype's department? 2026-10-25 stakeholder approval: existing company invoice/bank/wallet/WhatsApp configuration and vendor NPWP storage only; new agent balance/commission zero and not editable; no payments, postings or external integrations. WhatsApp template persistence declined; Department remains unresolved. Prototype contents are reviewed; approved Customer tax/accounting draft storage does not settle broader v1 behavior. | FR-01, FR-05, D-18 | DISC-01 | PLT-01, FIN-01 | PARTIAL |
| D-25 | Personal data | Handling of ID card, license, phone, and address on marketing, driver, and courier records: required fields, protection, masking, who can view, retention. | FR-02, FR-08 | DISC-02 | PLT-03 | TBD |
| D-26 | Master data semantics | 2026-10-25 stakeholder approved preserving Divider as text. 2026-11-19 OBSERVED in the provider Dimensi popup and Master Moda (DARAT 4000, UDARA 6000, LAUT 1000000): volume weight = P x L x T (cm) / Divider (confirmed on the provider Entry AWB: 100x50x40 DARAT = 50); per koli Berat diambil = max(volume, berat) and Terberat = their sum. On 2026-11-20 the project owner approved recalculating kilo, volume, chargeable weight and price server-side from each koli dimensions using this observed formula; Dev 2 review remains pending. Divider stays text; a non-numeric or zero value disables the calculation. | FR-02, FR-03 | DISC-03 | OPS-01 | OBSERVED, owner-approved; Dev 2 review pending |
| D-27 | Region hierarchy | Prototype region models have no parent links, likely because the source UI tables show only name and status. 2026-10-25 stakeholder approved retaining the existing flat dictionaries without adding relations for v1. A future authoritative dataset/hierarchy requires a separate decision. | FR-02, FR-03 | DISC-02 | PLT-02 | CONFIRMED for flat v1 |
| D-28 | Prototype status | Status of the Go + React prototype. Decision: early demo with simple CRUD, not in production use and not validated by stakeholders. It has no behavioral authority. | All | DISC-01 | Phase 1 start | CONFIRMED |
| D-29 | Oracle access | Coordinator-reported decision, 2026-10-19: provider access uses an admin account. Screenshots in ignored `docs/reference/app-provider/` are excluded from the repo and are not archived. Describe side-by-side evidence in PR text, not archived images. Admin access alone cannot establish role-level permission parity (D-04, AC-08); live feature parity remains to be checked. | All | DISC-01 | Phase 1 start | CONFIRMED by coordinator, 2026-10-19 |
| D-30 | Schema refinement | Technical scope implemented, locally verified and accepted by the project coordinator as SCH-01 DONE / APPROVED (2026-10-19): domain Int PK/FKs; Better Auth identity with ignored legacy storage retained; lifecycle/soft deletion; comment cleanup retaining DRAFT guards; Customer/Consignee and Vendor-pattern child drafts; 30 fake rows per list entity; separate dev/test targets. Six forward migrations preserve history and rows. SCH-01's FND-03 dependency is cleared; independent domain-owner reviews are not claimed. Field requiredness/import mapping, further defaults/indexes/referential exceptions, and soft-delete key reuse/restoration semantics remain unresolved. Existing uniqueness and RESTRICT domain relations retained. | FR-01, FR-02, FR-05, FR-08; decision-dependent workflows | Domain owner review and business approval for remaining semantics | Before dependent workflows/shared deployment; not a remaining SCH-01 completion gate | PROVISIONAL |
| D-31 | ETA scope | Stakeholder explicitly deferred ETA until Dev 2 makes the operational requirement clear. Do not invent a model, calculation or form. | Future ETA only | Dev 2 / PLT-03 | Before ETA implementation | CONFIRMED, 2026-10-25 |
| D-32 | Vendor services | Stakeholder explicitly approved VendorService (name, vendor relation, status, timestamps, soft deletion) and one additive migration. No vendor pricing/financial behavior approved. | PLT-03 vendor service CRUD | Dev 1; peer review before merge | Shared rollout | CONFIRMED technical scope, 2026-10-25 |
| D-33 | Branch reference fields | Stakeholder explicitly approved six nullable Branch columns and one additive migration: postal code, fax, email, Finance contact name, Marketing contact name and NPWP. Existing rows remain NULL, parent relationships unchanged; no financial behavior. Design and verification in the Dev 1 handoff. | PLT-02 Branch parity | Dev 1; peer review before merge | Shared rollout | CONFIRMED technical scope, 2026-10-25 |
| D-34 | Branch WhatsApp | Stakeholder confirmed separate Baileys number/session per branch and subsequently delegated route/contract design to LMS. Two server environment settings, bearer-authenticated gateway v1, branch-scoped status, administrator-only QR/connect/logout and audit are implemented; Baileys must follow [the contract](decisions/WA-01-gateway-api.md). Live interoperability, gateway durable session implementation and operational sending rules remain pending. Existing company preferences are not session ownership. | Live interoperability and operational sending | WA-01; gateway owner; Dev 1, operational owners for triggers | Before release or sending | PARTIAL, 2026-10-26 |
| D-35 | Simplified provider workflows | Project owner (requesting user, Dev 3 session 2026-11-23) approved simplified versions of provider features observed read-only in the provider app and the reference demo: (1) Entry AWB Nilai Barang, Biaya Asuransi, Nilai COD, Biaya COD, PIC 1/2, Lead Time and per-AWB Show Price Print AWB; Biaya Asuransi and Biaya COD join Total Biaya like Biaya Lain (owner decision), Nilai Barang and Nilai COD are stored only, no automatic COD/insurance formula; (2) standalone DRS (Kurir Kota) without a manifest: courier required, AWB added one by one, outcomes reuse the manifest DRS outcome rules, admin/branch staff may delete a DRS without outcomes; (3) Proses Vendor: AWB, vendor, vendor AWB number, remarks, one active row per AWB; (4) ticket status Open/In Progress/Finish set by `ticket: manage`, creator Approve Finish or Revisi (note required), rating/comment not included; (5) Rekap Manifest monthly table and Excel (provider workbook layout not observed; rows follow the manifest list); (6) Laporan Detail Kurir without Acc. in and SLA. COD collection (COD List, Kas Terima), insurance/COD fee formulas, vendor pricing and SLA remain TBD. | FR-02, FR-03, FR-04, FR-06 | Dev 2 review of shipment/DRS changes; finance review before COD money flows | Before release | PARTIAL, owner-approved simplification 2026-11-23 |
| D-37 | WhatsApp notification | Requesting user (2026-11-24): follow the provider. "WA Notif" Aktif/Nonaktif per customer (OBSERVED customer form/table; default Nonaktif for new saves) gates sending. Provider Perusahaan > WA Notifikasi > Pesan Whatsapp (OBSERVED 2026-11-24): four editable messages with on/off and fixed recipients: Transaksi to Pengirim and to Penerima (AWB saved), Shipment Status to Pengirim (AWB Delivered), Delivery Sheet to Penerima (AWB put on a DRS). Default texts copy the provider; the provider brand "Tracks-app" became `{namaPerusahaan}`. Events write `whatsapp_outbox` in their own transaction; dispatch after commit, sending branch = acting branch then AWB branches; gateway spaces sends ≥10 s per branch number (`MESSAGE_DELAY_MS`); retry up to 5 times within 24 h. | D-24, D-34 | Requesting user | Done | DECIDED |
| D-38 | Akunting menu and features | Requesting user (2026-11-24): "samakan web asli; yang tidak ada di web asli samakan lewat web sandbox". The real provider app has no Akunting menu, so Akunting follows the sandbox (newapps, OBSERVED 2026-11-24): Data Akun, Assets, Master (General Ledger, Kategori Akun, Kategori Rugi Laba, Master Arus Kas, Master Rugi Laba, Cost Centre, Kategori Assets), Kas Bank (Buku Bank, Kasir Penerimaan Lainnya / Invoice, Kasir Pembayaran Lainnya / Vendor, Bukti Jurnal Umum, Rekonsiliasi Bank), Penyesuaian (Kasir, Memorial, Penyesuaian Penjualan), Laporan (Neraca, Buku Besar, Rugi Laba, Neraca Saldo, Cover). Built on FIN-02 journals: vouchers are drafts posted separately; Kas/Bank takes the line balance; control accounts stay source-document only. Asset depreciation is straight-line and displayed only (no posting) until a posting rule is approved. Menu order Modul, Akunting, Laporan; Invoice moved to Modul > Keuangan. | D-13, D-14, D-37 | Requesting user | Done | DECIDED, asset depreciation posting TBD |
| D-39 | Booking pickup outcome by courier | Requesting user (2026-11-24): "booking bisa di pickup sama kurir dan bisa diupdate status sama kurir". After Konfirmasi Jemput (PROGRESS PICKUP) the courier records SUCCESS PICKUP (Barang Terambil) or MISS PICKUP (note required); a missed booking can be re-assigned (back to WAITING TO PICKUP) or cancelled. Real web Harian Kurir (OBSERVED 2026-11-24) shows Nama Kurir, Jumlah Terambil, Jumlah Miss Pickup per courier; the exact provider status names are not observed (no booking data). Migration `20261124000300_booking_pickup_result`. | D-05 | Requesting user | Done | DECIDED, provider status names UNVERIFIED |
| D-40 | COD cash receipt (Cod List / Kas Terima / Report Cod) | Requesting user (2026-11-24): fill what the real web lacks from the sandbox. Sandbox (OBSERVED newapps 2026-11-24, empty tables) shows Cod List, Kas Terima (adds User / Tgl. Pembayaran) and Report COD by month. LMS: destination branch receives COD cash once per Delivered AWB with a payment note (`cod_received_*`, migration `20261124000400_cod_kas_terima`). No journal posting and no COD fee formula. | D-11, D-13 | Requesting user | Done | DECIDED for tracking; COD accounting TBD |
| D-41 | Agent deposit and commission (sandbox Transaksi Agent / Laporan Agen) | Requesting user (2026-11-24) chose the simple rule: an AWB entered for an agent deducts its Grand Total from the agent deposit (refused when the balance is too low), commission = Agent commission % x Grand Total, admins top up the deposit, every movement is kept in History Deposit Agent. Lifts the DRAFT guard on `agents.balance` / `commission_rate` for this use. Commission rounds half up to whole rupiah; a voided AWB refunds the charge; biaya edits on agent AWBs are refused. Migration `20261124000500_agent_deposit`. | D-11, D-24 | Requesting user | Done | DECIDED |
| D-42 | Laporan Keuntungan (sandbox profit-report) | Requesting user (2026-11-24): per vendor bill, Biaya = sum of AWB Grand Totals on the bill, Biaya Vendor = bill amount, Laba = Biaya - Biaya Vendor. Not a ledger P&L. | D-14 | Requesting user | Done | DECIDED |
| D-43 | Share Truck module and menu | Requesting user (2026-11-24): build every Share Truck menu from the sandbox; combine real web and sandbox menus into one clear menu. Keep Umur Piutang per Customer (LMS-only). The sandbox is a marketplace between companies; LMS has one company, so Order Masuk = customer charters our shared truck, Order Keluar = we charter a vendor truck. Status flow WAITING/ACCEPTED/LOADING/ON THE WAY/ARRIVED/DONE/REJECTED is an LMS choice (sandbox tables were empty). Invoices post no journal. New permission `share_truck` (view, manage). Migration `20261124000600_share_truck`. | — | Requesting user | Done | DECIDED |

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
| `docs/reference/app-provider/` | Private, ignored provider screenshots and reference material. Coordinator-reported D-29 decision, 2026-10-19: excluded from the repo and not archived. Never commit provider images or real customer, employee or AWB data; describe side-by-side evidence in PR text. |
| `prisma/schema.prisma`, `prisma/schema/` | Target core and domain schemas. SCH-01 removed Prototype/PII comments and retained relevant DRAFT guards. Source mappings/privacy inventory remain in SCH-01 documentation, the read-only Go source and baseline preservation fixture (including future D-02 import needs). List deviations in the PR description. |

**Port status by domain**

| Domain | Status |
|---|---|
| Organization, identity, master data (Dev 1), marketing personnel (Dev 2) | SCH-01 DONE / APPROVED by the project coordinator (2026-10-19); six original plus six forward migrations applied and verified on development/test. Better Auth-compatible active storage replaces prototype identity delegates; ignored legacy tables retained. FND-03 dependency formally cleared without claiming independent domain-owner reviews. Shared deployment and decision-dependent behavior retain their review gates. |
| Customer, Consignee (Dev 2; tax/accounting reviewed by Dev 3) | Provider-form schema additions implemented in SCH-01, with 30 fake records each. Tax/accounting structures follow Vendor patterns as guarded drafts; no financial or notification workflows approved. Nullable form/child contract awaits domain review. |
| Accounting and transactional invoice/payment/wallet/bank behavior (Dev 3) | Remains guarded by D-12 to D-14 (FIN-01, FIN-02), with Decimal money. Separately approved company configuration storage under D-24 does not approve transactional financial behavior. |
| WhatsApp notification | Existing configuration storage approved (D-24 partial); branch WhatsApp preparation approved in D-34 with a separate future Baileys project. No external sending; template persistence declined pending separate schema approval. |
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

## Owner-accepted Dev3 v1 closure —2026-11-15

Owner explicitly closes SUP-01 and RPT-01 as DONE for their delivered, locally verified v1 scopes. This supersedes earlier full-ticket PARTIAL wording in this document: ticket create/list/detail and nine-column non-financial Transaction Detail Report are the accepted v1 deliverables. FR07 enhancements move to SUP-02/SUP-03; extra report parity/export to RPT-03/RPT-04. Required final review/hardening/staging remains DEV3-HARD-01; this is not merge/deployment acceptance. Global D-IDs and formal named-approver records retain their actual status without reopening accepted v1 or requesting the same approval again. [Closure/evidence/follow-ups](decisions/DEV3-V1-CLOSURE.md).
### RPT-02 delegated v1 completion —2026-11-15

Owner instructed RPT-02 through DONE and delegated appropriate implementation recommendations. Delivered/local-verified target: manifest inventory by owning branch; existing DRS and per-transaction delivery outcomes under intersection scope; raw operational dashboard counts with explicit date/branch definitions. The selected narrower persisted read source does not claim complete OPS-03 generation. A guarded vendor-unavailable page is not a vendor-attribution report; actual association/capture/report follows RPT-05, with no guessed joins or historical backfill. Financial totals, derived status buckets and exports remain future scope. Scoped D15/D19/D22 target choices are documented, not global legacy confirmation. [Contract](decisions/RPT-02-contract.md), [verification](decisions/evidence/rpt-02/verification.md). Final Dev1/Dev2 review/staging/release remain separate from development DONE; no new PR now.
