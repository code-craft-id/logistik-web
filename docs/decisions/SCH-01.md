# SCH-01: Prototype model port and approved refinement

Status: **DONE / APPROVED** on 2026-10-19. Approval authority: the project coordinator, explicitly approving the completed SCH-01 scope in this session. Migration coordinator: Codex. This coordinator acceptance formally clears SCH-01's dependency for FND-03; it does not assert independent Dev 1/2/3 domain-owner reviews occurred. Approval covers the completed schema, adapter foundation, forward migrations, fixtures and verification only. Unresolved D-xx decisions, DRAFT models and their implementation restrictions remain unchanged. No FND-03 or PLT-01 UI, login/session workflows, RBAC, branch authorization, or auth routes were implemented.

## Approved refinements delivered

| Area | Final implementation |
| --- | --- |
| IDs | All existing domain primary/foreign keys, including nullable/self references and legacy notification customerId, are Int. PostgreSQL has no bigint columns in these tables; all 46 ID sequences are integer. Existing IDs, references, statuses, and unique constraints were preserved. |
| Better Auth | better-auth 1.6.23 pinned in package.json/lockfile, compatible declared peers for Prisma 7, Next.js 16, React 19. User, Session, AuthAccount, Verification use numeric serial IDs in auth_* tables. Financial Account remains accounts. src/lib/auth/schema-options.ts supplies the Prisma adapter, serial ID option, and authAccount mapping only; there is no runtime auth instance or handler. |
| Legacy identity | Original users and refresh_tokens tables retained intact as ignored LegacyUser/LegacyRefreshToken models. They are absent from generated client delegates and never imported as Better Auth identities or credentials. This additive replacement avoids dropping data. Removal/cutover is future reviewed work, subject to D-02/D-04. |
| Lifecycle | All 42 non-provider models, including retained legacy storage, have createdAt, updatedAt, nullable deletedAt. The four provider models have the provider's creation/update/expiry lifecycle and no deletedAt. Existing timestamps survive; newly introduced updatedAt is backfilled from createdAt, and previously unknown creation time uses the migration timestamp. This is a technical backfill, not historical event evidence. |
| Comments | Removed Prototype/PII schema comments without removing baseline scalar fields. Relevant DRAFT/security comments remain. The read-only Go source, historical inventory below, and tests/fixtures/sch01-baseline.json preserve provenance. Privacy obligations remain D-25. |
| Customer/Consignee | Provider-form fields and relations implemented in sales.prisma, with master/branch inverses in organization.prisma and master-data.prisma. CustomerTaxProfile follows VendorTaxProfile structure; CustomerAccounting follows VendorAccounting structure in accounting.prisma. Both children are guarded DRAFTs and are unused/unseeded. |
| Fake fixtures | 662 records: Company/Office prerequisites plus 30 each across 22 list entities, including Vehicle, Driver, Courier, Customer, Consignee, Vendor. Stable IDs 9100001-9100030; varied statuses, long text, nulls, relations and soft-deleted samples. Reruns preserve rows/timestamps; occupied mismatched IDs abort the transaction. No credentials, real PII, financial child settings or integration rows are seeded. |
| Isolation | Development logistik_web; test logistik_web_test. Existing dev guards remain. Test guard now requires the exact test name, loopback host, non-production, no connection overrides, and a distinct development target. prisma/migrate-test.mjs deploys test migrations without changing the development guard. |

### Form storage and unresolved semantics

- Customer: name, address, Regency relation, phone, fax, contactPerson, email, MarketingPerson relation, Branch relation, Term relation, podRequired, CostType relation, nullable whatsAppNotificationEnabled, lifecycle fields, consignee/tax/accounting/notification inverse relations.
- Consignee: name, address1/address2, Regency relation, phone, PIC, Customer relation, Branch relation, RecordStatus, lifecycle fields.
- Apart from name/identity and structural child-parent keys, new form fields are nullable and have no guessed defaults. Consignee uses the existing master RecordStatus convention. Name is the minimal record label; stricter requiredness, validation and defaults remain D-25/D-30. Customer email/phone have no invented business uniqueness.
- CustomerTaxProfile uses nullable tax number, registered name, address1/address2, city and postal code. CustomerAccounting mirrors debit/payable/revenue Account references and Decimal(5,2) share/commission slots, all optional and without financial defaults. A unique customer FK gives each child the existing Vendor pattern's at-most-one shape. These are draft storage slots, not approved account meanings, rates, taxes, postings, receivables or formulas (D-11/D-13/D-24).
- CustomerWhatsAppNotification.customerId now has a real optional Customer FK and index. The raw nullable Customer form preference has no synchronization or sending behavior; the legacy company/customer integration setting remains separate DRAFT storage. D-18/D-24 must settle applicability/cardinality and precedence before either is used in workflows. Seeds leave the preference null and integration storage empty.
- Regency references and flat synthetic region fixtures establish no hierarchy or postal mapping (D-27). TransportMode.divider remains string with its D-26 guard. Vendor.branch remains free text. Organization/permission rules and all other unresolved business decisions are unchanged.

### Soft deletion contract

Domain masters use nullable deletedAt separately from RecordStatus. Downstream lists/lookups must explicitly filter deletedAt = null when showing live records, and apply status/branch predicates independently. Related-record filtering also needs deliberate handling; adding a timestamp does not implement query filtering or authorization.

Soft deletion leaves foreign keys and historical references intact. No cascading domain deletion, restore operation, retention period, or key reuse policy was introduced. Existing unique constraints cover deleted rows as well as live rows; a duplicate remains invalid after soft deletion. Any partial uniqueness or restore semantics need D-30/domain review. Provider session/verification cleanup follows its own lifecycle; do not apply a blanket domain soft-delete filter to auth storage.

## Forward migrations and safety evidence

Original six applied migrations remain byte-for-byte unchanged. tests/fixtures/sch01-baseline.json locks their SHA-256 checksums and original scalar inventory. The new dependency order is:

| Migration suffix (20261019) | Scope / review owner |
| --- | --- |
| 000100_sch01_int_keys | Coordinated cross-domain conversion; all owners |
| 000200_sch01_lifecycle | Coordinated lifecycle backfill/defaults; all owners |
| 000300_sch01_better_auth | Additive auth_* storage; Dev 1 |
| 000400_sch01_sales | Customer/Consignee/CustomerTaxProfile and master FKs; Dev 2 with Dev 1 |
| 000500_sch01_accounting | DRAFT CustomerAccounting and Account FKs; Dev 3 with Dev 2 |
| 000600_sch01_integration | Notification Customer FK/index; Dev 1 with Dev 2 |

Each new migration uses a transaction. Int conversion locks the affected tables, checks every existing ID/FK and sequence position against signed 32-bit bounds before narrowing, preserves sequence positions, and recreates the same restrictive domain constraints atomically. Later slices use a five-second lock timeout where applicable. Int conversion briefly requires exclusive locks; review duration/capacity before shared deployment. There is no DROP TABLE, DROP COLUMN, DELETE, TRUNCATE, reset, or rewritten applied migration.

Live inspection before changes: PostgreSQL 18.3; six successful migrations; 38 tables; exactly the 18 known fake fixtures; prototype users/tokens and financial/integration drafts empty. logistik_web_test existed and had no public tables. A pg_dump 18.3 custom-format development backup was created and its archive listing checked, outside the repository:

C:/Users/Administrator/AppData/Local/Temp/sch01-7691279d0c784fc39f6dc6db88fa0ff5/development-before.dump

Keep this backup before any later destructive work; restoration was not exercised in this scope. Prefer reviewed forward fixes; no destructive down migration is supplied.

Verification order: replayed the original six migrations into the empty test DB, copied the 18 fake baseline fixtures, verified row and sequence overflow rejection with rollback, then deployed the six refinements. The test-copy harness initially converted dates/timestamps as ISO text incorrectly; this was corrected using Date parameters, and all original field values were checked afterward. No development data was involved in that harness correction. After successful test upgrade/drift/integration checks, the same forward migrations were deployed to development through the existing guarded wrapper.

Final development catalog: **46 tables, 43 foreign keys, 46 integer sequences, zero bigint columns**. All 12 recorded migration checksums match disk. All 18 original fixtures retain every original field value/date/timestamp. Development holds 662 fake fixtures after seeding; the complete row/timestamp snapshot is identical on rerun. All auth and financial/tax/integration draft tables remain empty. Flat region DRAFTs contain synthetic dictionaries solely for relation/display fixtures, with no hierarchy.

## Current verification (2026-10-19)

Files changed in this refinement: prisma/schema.prisma and all six prisma/schema/*.prisma files; six new 20261019 migration directories; package.json/package-lock.json; src/lib/auth/schema-options.ts; prisma/seed.mjs, seed-data.mjs, seed-data.d.mts and migrate-test.mjs; tests/support/test-database-url.ts, tests/unit/test-database-url.test.ts, tests/unit/sch01-schema.test.ts, tests/integration/sch01.test.ts, tests/fixtures/sch01-baseline.json; this note, docs/PRD.md and docs/ROADMAP.md. AGENTS.md retains the approved conventions from the prior checkpoint. Unrelated existing changes were not staged or committed.

| Command / check | Actual result |
| --- | --- |
| npx --no-install prisma format | Passed |
| npx --no-install prisma validate | Passed |
| Schema-only prisma migrate diff between staged schema snapshots | Six new reviewed forward SQL slices; corrected Prisma's generated ALTER TYPE SERIAL to INTEGER while preserving existing sequences |
| npx --no-install prisma generate | Passed, Prisma 7.10.1 custom output |
| npm run check | Passed lint, TypeScript strict checks and 55 unit tests |
| npm run build | Passed Next.js 16.4.2 production build |
| Test history replay, then node prisma/migrate-test.mjs | All 12 migrations applied on isolated logistik_web_test; no reset/recreation |
| npm run test:integration (explicit local TEST_DATABASE_URL) | Passed 6 tests: connectivity; fixture counts/variation/idempotency; collision rollback; FK rejection; uniqueness after soft deletion; Better Auth numeric IDs and separate Account storage |
| node prisma/migrate-local.mjs | Applied all six refinements on logistik_web; 12 migrations now applied |
| npm run db:seed, then node prisma/seed.mjs | Both passed; 662 fixtures; full snapshot including timestamps unchanged on rerun |
| prisma migrate diff --from-config-datasource --to-schema prisma --exit-code | Exit 0, no difference on development and test |
| prisma migrate status | Both databases up to date |
| Preservation/catalog audits | Original 38 table/scalar inventories retained; no old migration edits, no bigint, correct FKs/sequences, all 18 original fixture values retained |
| npm install/audit | Better Auth 1.6.23 installed exactly; zero reported vulnerabilities at installation |
| git diff --check | Passed |

Integration tests create only synthetic temporary rows and roll their transactions back. They do not reset either database. Tests do not exercise sign-in, cookies, login endpoints, RBAC, branch access or financial workflows. Provider behavioral parity, staging smoke tests, restore rehearsal, load/lock timing and independent domain-owner review remain unverified.

## References, decisions and handoff

Better Auth implementation was checked with Context7's versioned v1.6.23 results, installed core getAuthTables metadata, installed Prisma adapter behavior, declared package peers, and adapter/database integration tests. No unversioned main-branch schema example was used as authority. See the official versioned [database contract](https://github.com/better-auth/better-auth/blob/v1.6.23/docs/content/docs/concepts/database.mdx) and [Prisma adapter guide](https://github.com/better-auth/better-auth/blob/v1.6.23/docs/content/docs/adapters/prisma.mdx). Serial mode converts between numeric database keys and auth-facing string IDs; external provider identifiers/tokens remain strings.

Prisma/client/pg adapter remain 7.10.1, with installed config/CLI behavior and the [Prisma 7 schema reference](https://www.prisma.io/docs/orm/v7/reference/prisma-schema-reference). Installed Next.js 16.4.2 server/client-boundary and environment guides were read; no frontend conventions or routes were changed. This note supersedes FND-01's older provider recommendation and prototype-comment convention.

D-30's approved technical refinement is implemented; its domain/import semantics remain PROVISIONAL. D-02 import, D-03/D-04 organization/RBAC, D-10 commercial rules, D-11 to D-14 finance, D-18/D-24 integrations and tax scope, D-25 privacy, D-26 divider semantics, D-27 hierarchy, and the remaining unresolved IDs are not promoted to CONFIRMED.

**FND-03:** SCH-01's dependency is **formally unblocked** by the project coordinator's explicit acceptance of the completed scope on 2026-10-19. Independent domain-owner reviews are not claimed. Nullable field semantics and draft accounting slots retain their decision guards; draft tax/accounting/integration behavior remains blocked by the IDs above and must not become UI/workflow scope through this handoff. Other FND-03 prerequisites and decision gates remain applicable. No FND-03 or PLT-01 implementation has begun. The coordinator authorized a focused finalization commit with subject `feat(db): finalize SCH-01 schema refinement`; no push or PR publication is authorized. Unrelated working-tree changes are preserved.

### Final Git acceptance

The finalization checks account for schema files, six forward migrations, Better Auth adapter/dependency changes, fixtures, database guards, preservation/integration tests and synchronized project documents. Only SCH-01 changes are included in the finalization commit; pre-existing TypeScript manifest/lock edits and untracked reference/personal files remain outside it. Applied migration history and all D-xx business statuses remain unchanged. Approval does not imply staging/restore validation or independent domain review beyond the evidence recorded above.


## Historical initial port record (pre-refinement)

The following sections preserve the original Phase A implementation and reported verification on 2026-10-18. They describe the **38-model baseline**, including choices now superseded above. They are not current verification of the approved refinement, nor a fresh database audit in this documentation-only checkpoint.

### Historical approved plan and files

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

### Historical naming and base strategy

Use singular English PascalCase Prisma models, camelCase fields, and plural snake_case tables with `@@map` and snake_case columns with `@map`. Preserve explicit prototype table names where practical, including `account_branches`, `company_invoices`, and `customer_whatsapp_notifications`. Every source field has a `/// Prototype:` comment; source Go structs remain the field inventory, not behavioral authority.

Repeat BaseModel's `createdAt`, `updatedAt`, and nullable `deletedAt` only on Company, Office, Branch, Agent, and Department. Approved technical defaults are `@default(now())` and `@updatedAt` on these embedded timestamps. Preserve separately declared timestamps elsewhere without adding new lifecycle fields or defaults. No table inheritance or BaseModel table.

### Historical approved deviations from the prototype

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

### Historical DRAFT and unresolved decisions

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

Other open IDs at the initial port: D-03 organization cardinality; D-10 marketing workflows; D-02 legacy import; D-22 parity/VehicleType retention; D-25 PII requiredness, protection, masking, access, retention. The initial note proposed D-30 for technical nullability, BigInt normalization, defaults, indexes, and restrictive referential actions. D-30 is now present in the PRD; this refinement updates it and synchronizes AGENTS.md, PRD.md, and ROADMAP.md. The initial claim that it had not been added is superseded.

### Historical PII field list (retain as documentation inventory)

Each field below had `/// PII (D-25)` in the initial port. The refinement removes schema annotations, not masking, encryption, retention, or access obligations. Extend this documentation inventory during implementation to Customer contact/address/tax fields, Consignee contact/address/PIC fields, and Better Auth identity/session/token fields; never expose secrets.

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

### Historical local migrations and fake seed

Each group was formatted, validated, diffed offline against its predecessor, generated, typechecked, applied locally, and committed separately. The first diff used `--from-empty`; later diffs used cumulative temporary schema snapshots outside the repository. No shadow database, reset, db push, drop, or delete was used. The existing development database was empty before the port; six additive migrations now create 38 tables. Existing rows required no backfill. Roll forward with reviewed additive fixes; do not modify applied migrations or roll back by dropping tables.

Apply checked-in pending migrations with `node prisma/migrate-local.mjs`. This wrapper resolves the installed Prisma CLI and runs `migrate deploy` only after checking a non-production environment, exact host `127.0.0.1`, exact database `logistik_web`, and no URL query/fragment overrides. It never targets `logistik_web_test`. If a local connection fails, stop database work and run this command locally when available; do not bypass the guard.

`npm run db:seed` invokes `node prisma/seed.mjs` through Prisma's configured seed command. Native Node 24 executes the generated TypeScript using `importFileExtension = "ts"`; no dependency was added. Seed refuses production, requires localhost/127.0.0.1 and logistik_web, and validates before client creation. Errors omit connection credentials and PII.

Seed inserts 18 obviously fake fixtures: Company/Office prerequisites and two each of Branch, GoodsType, Term, ServiceCategory, TruckingType, Vehicle, Driver, Courier. Fixed IDs 9100001–9100002 avoid adding unique business constraints. Explicit IDs do not advance the normal sequences. Matching fixtures remain untouched on reruns; mismatched occupied IDs abort the entire transaction. No updates or deletes. Names start FAKE; phone/ID/license/registration identifiers start INVALID. DRAFT models are not seeded.

### Historical verification (initial port only; not rerun at this checkpoint)

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
