# SCH-01: Prototype model port

Status: implementation follows the user's Phase A approval on 2026-10-18. This approves the technical port, not unresolved business rules. Migration coordinator: Codex. Domain owners still review their groups before shared deployment.

## Approved plan and files

Read all 16 Go files in `docs/reference/prototype-models/`, including `company/` and `logistics/`. Port all 38 persistent models. `BaseModel` and `BranchRef` are helpers, not tables. Source files remain read-only.

| Order | File under `prisma/schema/` | Models | Owner | Migration suffix |
| --- | --- | --- | --- | --- |
| 1 | organization.prisma | Company, Office, Branch, Department, Agent | Dev 1 | sch01_organization |
| 2 | identity.prisma | User, RefreshToken | Dev 1 | sch01_identity |
| 3 | master-data.prisma | Province, Regency, District, Village, PostalCode, Driver, Courier, TransportMode, ServiceCategory, DeliveryService, GoodsType, CostType, Term, Vehicle, VehicleType, TruckingType, ShipmentStatus, Vendor, VendorTaxProfile | Dev 1 | sch01_master_data |
| 4 | sales.prisma | MarketingPerson | Dev 2 | sch01_sales |
| 5 | accounting.prisma | Ledger, AccountCategory, ProfitLossCategory, CashflowCategory, AccountingBranch, Account, VendorAccounting, CompanyBank, CompanyInvoiceSettings, CompanyDigitalWallet | Dev 3 | sch01_accounting |
| 6 | integration.prisma | CustomerWhatsAppNotification | Dev 1; Dev 3/business scope review | sch01_integration |

Core generator, datasource, and shared RecordStatus enum stay in `prisma/schema.prisma`. Config uses `schema: "prisma"` to load the root file and nested domain files, with `migrations.path: "prisma/migrations"`. Installed Prisma 7.10.1 types and directory validation confirm support; no preview feature is needed. Context7 offered no exact 7.10.1 index, so no unversioned documentation was used. Official v7 schema-location/config documentation and installed package behavior take precedence over v8 examples.

## Naming and base strategy

Use singular English PascalCase Prisma models, camelCase fields, and plural snake_case tables with `@@map` and snake_case columns with `@map`. Preserve explicit prototype table names where practical, including `account_branches`, `company_invoices`, and `customer_whatsapp_notifications`. Every source field has a `/// Prototype:` comment; source Go structs remain the field inventory, not behavioral authority.

Repeat BaseModel's `createdAt`, `updatedAt`, and nullable `deletedAt` only on Company, Office, Branch, Agent, and Department. Approved technical defaults are `@default(now())` and `@updatedAt` on these embedded timestamps. Preserve separately declared timestamps elsewhere without adding new lifecycle fields or defaults. No table inheritance or BaseModel table.

## Approved deviations from the prototype

- Normalize all primary and foreign key types to BigInt, with autoincrement IDs. PostgreSQL has no unsigned integer equivalent. Application JSON serialization of BigInt remains future work; this ticket adds no UI or API.
- Pointers are nullable. Other value fields are required, except the approved password deviation. This is a fresh-schema normalization, not a claim that GORM's untagged SQL columns were NOT NULL. Proposed D-30 needs later business/import review.
- Convert activity strings and booleans to one RecordStatus enum. Preserve explicit defaults only. Business toggles remain Boolean. No hard-delete code is introduced; models without source lifecycle fields receive no invented fields.
- Convert Vehicle.STNKDate and InsuranceExpiry to nullable DateTime with `@db.Date`. Audit and token timestamps retain time-of-day.
- Replace BranchRef with actual Branch relations. Keep the separate accounting dropdown Branch as AccountingBranch. Vendor.branch remains free text.
- Explicitly relate company settings/notification CompanyID and vendor-child VendorID to their existing parents. Preserve at-most-one vendor child via source unique tags; Vendor's inverse relations are optional. Agent.department follows nullable DepartmentID. Add inverse relation fields without adding scalar fields.
- All 27 foreign keys explicitly use ON DELETE RESTRICT and ON UPDATE RESTRICT. Preserve source uniqueness/index tags and string limits; add indexes on remaining foreign keys and activity status. Add no business uniqueness or company-settings cardinality constraint.
- English model renames: Mode to TransportMode; Marketing to MarketingPerson; Npwp to VendorTaxProfile; Accounting to VendorAccounting; CompanyInvoice to CompanyInvoiceSettings; accounting Branch to AccountingBranch; normalize WhatsApp capitalization. Field translations are recorded individually in schema comments.
- Replace User.Password with nullable passwordHash (varchar 255), with no plaintext/password import, auth implementation, credentials, or seeded users. RefreshToken retains bounded unique hash storage and expiry/revocation timestamps; the prototype SHA-256 description is provenance, not approved auth design.
- Convert Agent.balance to Decimal(19,2), Agent.commissionRate to Decimal(9,4), and vendor revenue-share/commission percentages to the source Decimal(5,2), preserving explicit zero defaults. Agent precision, currency, units, and rounding remain DRAFT. Add no currency field, financial calculations, or rounding behavior.
- Keep enum-like role/account classifications as strings, preserving observed defaults. Keep numeric-looking Divider and CylinderCapacity strings. Retain unused VehicleType without connecting it to Vehicle.
- No Customer model exists. Notification.customerId remains a nullable scalar without an invented relation. No shipment, manifest, operational delivery, ticket, journal-posting, or issued-invoice model is invented.

## DRAFT and unresolved decisions

Models marked `/// DRAFT: rules TBD, D-xx` remain unused by routes, actions, and UI:

| Models | Decisions |
| --- | --- |
| Department | D-24: department/division overlap |
| User, RefreshToken | D-04: auth provider/roles/session ownership |
| VendorTaxProfile | D-24: tax-ID scope |
| Ledger, AccountCategory, CashflowCategory | D-13: account/posting rules |
| AccountingBranch | D-13, D-24: separate accounting scope |
| ProfitLossCategory | D-14: recognition/reporting rules |
| Account | D-13, D-14 |
| VendorAccounting | D-11, D-13 |
| CompanyBank, CompanyDigitalWallet | D-24 |
| CompanyInvoiceSettings | D-12, D-24 |
| CustomerWhatsAppNotification | D-18, D-24; CustomerID target unresolved |

The five flat region/postal models carry `/// DRAFT: hierarchy TBD, D-27`. TransportMode.divider retains `/// DRAFT: numeric type TBD, D-26`. Agent money/rate fields carry D-11/D-24 flags. No hierarchy, currency, tax, commission formula, accounting enum, or status transition is guessed.

Other open IDs: D-03 organization cardinality; D-10 marketing workflows; D-02 legacy import; D-22 parity/VehicleType retention; D-25 PII requiredness, protection, masking, access, retention. Proposed D-30 covers technical nullability, BigInt normalization, defaults, indexes, and restrictive referential actions. D-30 has not been added to or approved in the PRD. AGENTS.md, PRD.md, and ROADMAP.md are unchanged by SCH-01.

## PII field list

Each field below has `/// PII (D-25)`. This annotation does not implement masking, encryption, retention, or access rules.

| Model | Fields |
| --- | --- |
| Company | address, city, postalCode, phoneNumber, faxNumber, directorName, taxId, email |
| Office | address, city, phoneNumber, email, managerName |
| Branch | address, city, phoneNumber, managerName, managerContact |
| Agent | name, phoneNumber, managerName, mobileNumber |
| User | name, username, email |
| Driver | name, address, nationalIdNumber, driverLicenseNumber, phone |
| Courier, MarketingPerson | name, address, nationalIdNumber, phone |
| Vehicle | licensePlate, registrationHolderName, registrationNumber, chassisNumber, engineNumber |
| Vendor | address1, address2, city, postalCode, phone, fax, email, contactName |
| VendorTaxProfile | taxNumber, registeredName, address1, address2, city, postalCode |
| CompanyBank | description |
| CompanyInvoiceSettings | signatoryName, signatoryPosition |
| CompanyDigitalWallet | accountName, accountNumber, verificationEmail |
| CustomerWhatsAppNotification | customerId |

Password/token hash fields are separately marked secret and must never be returned or logged.

## Local migrations and fake seed

Each group was formatted, validated, diffed offline against its predecessor, generated, typechecked, applied locally, and committed separately. The first diff used `--from-empty`; later diffs used cumulative temporary schema snapshots outside the repository. No shadow database, reset, db push, drop, or delete was used. The existing development database was empty before the port; six additive migrations now create 38 tables. Existing rows required no backfill. Roll forward with reviewed additive fixes; do not modify applied migrations or roll back by dropping tables.

Apply checked-in pending migrations with `node prisma/migrate-local.mjs`. This wrapper resolves the installed Prisma CLI and runs `migrate deploy` only after checking a non-production environment, exact host `127.0.0.1`, exact database `logistik_web`, and no URL query/fragment overrides. It never targets `logistik_web_test`. If a local connection fails, stop database work and run this command locally when available; do not bypass the guard.

`npm run db:seed` invokes `node prisma/seed.mjs` through Prisma's configured seed command. Native Node 24 executes the generated TypeScript using `importFileExtension = "ts"`; no dependency was added. Seed refuses production, requires localhost/127.0.0.1 and logistik_web, and validates before client creation. Errors omit connection credentials and PII.

Seed inserts 18 obviously fake fixtures: Company/Office prerequisites and two each of Branch, GoodsType, Term, ServiceCategory, TruckingType, Vehicle, Driver, Courier. Fixed IDs 9100001–9100002 avoid adding unique business constraints. Explicit IDs do not advance the normal sequences. Matching fixtures remain untouched on reruns; mismatched occupied IDs abort the entire transaction. No updates or deletes. Names start FAKE; phone/ID/license/registration identifiers start INVALID. DRAFT models are not seeded.

## Verification

- For all six groups: `npx --no-install prisma format`, `npx --no-install prisma validate`, schema-only `npx --no-install prisma migrate diff ... --script --output <group>/migration.sql`, `npx --no-install prisma generate`, `npm run typecheck`: passed.
- For all six groups: `node prisma/migrate-local.mjs`: passed against local development only. Generated SQL contains only CREATE statements and ALTER TABLE ADD CONSTRAINT statements.
- Field coverage audit: all 38 persistent Go structs, 239 direct scalar fields, 24 source relation fields, and all 15 expanded embedded-base fields have corresponding schema provenance. Helpers have no tables.
- PostgreSQL read-only catalog audit: 38 domain tables, 254 scalar columns, and 27 foreign keys, all with RESTRICT delete/update behavior.
- `npm run check`: passed lint, TypeScript, and 46 tests, including local target/production/override/credential-redaction guards.
- `npm run build`: Next.js 16.4.2 production build passed, including TypeScript and static prerendering.
- `npm run db:seed`: passed twice. Database snapshots prove all 18 fixtures and timestamps unchanged on rerun; all 15 domain DRAFT models remain empty.
- `npx --no-install prisma migrate diff --from-config-datasource --to-schema prisma --exit-code`: exit 0, no difference.
- `npx --no-install prisma migrate status`: all six migrations applied, database up to date.

Skipped by scope: provider behavioral parity, staging smoke tests, UI changes, authentication behavior, test-database integration runs, and domain-owner PR review. No remote push or PR publication. Pre-existing user changes remain outside SCH-01 commits.
