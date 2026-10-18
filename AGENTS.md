# AGENTS.md | Logistics Management System

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 1. Purpose and source of truth

Build a secure, auditable, multi-branch Logistics Management System (LMS). Three-person, **full-stack, feature-owned** team: every feature owner builds UI, server logic, validation and tests.

Read in this order: `AGENTS.md` (engineering rules), `docs/PRD.md` (approved scope), `docs/ROADMAP.md` (sequence and ownership), then relevant source and tests.

A screenshot or navigation label alone is not evidence of a business rule. Behavior observed in the provider app is `OBSERVED` evidence, still pending confirmation. Unresolved rules stay `TBD`, never guesses.

This project rebuilds a provider app as a standalone system on Next.js. The provider app is the oracle: observe it for behavior. The Go + React prototype (outside this repo) and the Go models in `docs/reference/` are a head start, not a spec. The models were reverse-engineered from the provider's frontend tables, so they list visible fields only. Treat what you observe as `OBSERVED` until the domain owner and business confirm it. Where the provider app's behavior is ambiguous, undocumented, or should not be replicated, follow the `BLOCKED` rule. Follow the port rules in `docs/PRD.md` section 10 instead of copying prototype names, types, or structure.

## 2. Stack

Fixed:
- Next.js 16 App Router, React, TypeScript with `strict` enabled.
- Prisma ORM + PostgreSQL. Migrations are versioned and reviewed.
- Tailwind CSS v4 (see section 5).
- Server Components by default. Client Components only for browser-side interactivity.
- Server Actions for controlled mutations. Route Handlers for externally consumed endpoints or explicit client/server API needs. Neither bypasses auth, RBAC, validation, or audit.
- Pin Node.js and Prisma versions in lockfile and CI, and verify they are compatible with the chosen Next.js 16 release.

**Decided:** schema validation with Zod, self-hosted deployment, Better Auth with its Prisma-compatible identity schema (SCH-01 refinement), and the tooling selected in `docs/decisions/FND-01.md` (Prisma, Vitest, Node version, npm) once that note is reviewed. Better Auth replaces prototype User/RefreshToken storage; authentication behavior, RBAC, and branch scoping belong to PLT-01. The SCH-01 refinement supersedes the older auth recommendation and prototype-comment convention in FND-01.

**TBD by team decision** (do not introduce without justification): component library (shadcn/ui proposed). Pin and verify the Better Auth version and adapter schema before implementing the identity refinement; provider selection is already approved.

## 3. Ownership and shared work

| Owner | Feature domains | Full-stack deliverables |
|---|---|---|
| Dev 1 | System Settings, Office, Master Data | User groups, users, permissions, branch/office/company/agency, logistics areas/divisions/services/vehicles, vendors, ETA and status configuration |
| Dev 2 | Sales, Customer Service, Operations | Sales foundations, customers, booking, AWB/transactions, shipment tracking/status, outbound/inbound/transit manifests, delivery sheets |
| Dev 3 | Accounting, Reports, Ticketing, Dashboard | Account categories, ledger, cashflow categories, P&L, invoice/payment UI (with Dev 2), branch reports, tickets, dashboard KPIs |

Ownership defines the default implementer, not exclusive write access.

Contract owners:
- Dev 1: authentication/authorization contracts and shared organization scope.
- Dev 2: shipment lifecycle and AWB identifiers.
- Dev 3: approved reporting definitions and financial postings.

Dev 3's finance scope is large. Prioritize operational reports and ticketing. Do not implement P&L until posting and costing rules are approved.

Shared-work protocol:
- In Phase 0, all three agree on folder layout, auth/session approach, permission matrix, domain entity map, migration policy, UI patterns, design tokens, and error shape.
- Pick a temporary integration owner per milestone. Never have three concurrent edits on the same file.
- Name one **migration coordinator** per sprint/phase. Each dev designs Prisma models for their domain, but schema edits and migration order go through the coordinator. Each domain keeps its models in its own file under `prisma/schema/` (the core stays in `prisma/schema.prisma`).
- Publish contracts to consumers: Dev 1 (user/branch/permission) to everyone, Dev 2 (shipment/AWB) to Dev 3, Dev 3 (metric definitions and required source data) to Dev 2.
- Changes to shared auth, Prisma schema, API shapes, statuses, financial formulas, reusable primitives, or design tokens need a draft PR or short design note and at least one other dev's review.

## 4. Target structure (adapt during Phase 0)

```text
src/
  app/
    globals.css          # single source of truth: @import "tailwindcss" + @theme tokens
    (auth)/
    (dashboard)/
      settings/ office/ master-data/ sales/ customer-service/
      operations/ accounting/ reports/ ticketing/
  features/
    identity/ organization/ master-data/ sales/ shipments/
    manifests/ delivery/ accounting/ reports/ ticketing/
  components/ui/         # shared primitives
  lib/
    auth/ db/ permissions/ validation/
prisma/
  schema.prisma        # core: datasource, generator, shared enums
  schema/              # one .prisma file per domain
  migrations/
docs/
  PRD.md
  ROADMAP.md
```

This is a **modular monolith**, not microservices. Keep domain services, queries, validation, authorization and feature UI inside their feature folder. `app/` mainly defines routes and rendering entry points. No generic repositories or abstraction layers without a real reason.

## 5. UI, styling and responsive rules

Tailwind v4 and tokens:
- Use Tailwind CSS v4 with CSS-first configuration. Do not assume v3 patterns or add `tailwind.config.js` unless explicitly justified.
- `src/app/globals.css` is the **only** place for `@import "tailwindcss"` and shared `@theme` tokens (color, spacing, typography, radius, breakpoints).
- Features must not define their own color, spacing, or breakpoint tokens. If a token is missing, propose it in `globals.css` via PR.
- Prefer tokens and utilities over arbitrary values, one-off colors, or scattered custom CSS. Custom CSS is fine when utilities are insufficient or for shared app-level styles.
- Shared primitives live in `components/ui/`. Domain-specific components stay in their feature module. Extract a component when a pattern repeats.

Responsive:
- Mobile-first. Unprefixed utilities are the default layout, `sm:`, `md:`, `lg:`, `xl:` progressively enhance. Never treat mobile as a later refinement.
- Prefer Grid and Flexbox. Avoid hardcoded widths, fixed positioning, and unnecessary overflow.
- Navigation, forms, filters, tables, cards, dialogs and reports must be usable on mobile.
- Data-heavy tables need a deliberate strategy: horizontal scroll, prioritized columns, or an alternative mobile layout. Never silently hide critical information.

Accessibility and interaction:
- Semantic HTML, accessible labels, keyboard navigation, visible focus states, sufficient contrast.
- Touch-friendly targets. No hover-only interactions for essential functionality.
- `"use client"` is justified by interactivity only, never by styling alone.

## 6. Business invariants and security

Auth and scope:
- Every server-side entry point authenticates and authorizes independently. Hidden navigation is not authorization.
- Define action permissions and **branch-level record scope** centrally.
- Users may have multiple allowed branches. Exact assignment and HQ override rules need approval. Never trust a client-supplied `branchId` without membership checks.

Domain rules:
- Booking, AWB/transaction, shipment, manifest and delivery are distinct concepts until cardinalities are confirmed. AWB numbering and status transitions need approved rules.
- Shipment status changes validate allowed transitions, keep immutable history (actor, date, prior/new status, reason where relevant), and use database transactions when spanning records.
- Manifest assignments reject invalid or conflicting active assignments. Race-prone flows need database constraints plus transactional checks.

Money and accounting:
- Use Prisma `Decimal` / PostgreSQL `numeric` with currency and explicit rounding. Never use JS floating point for authoritative amounts.
- Ledger entries must balance and trace to source documents. After posting, reverse with compensating entries, never silent mutation.
- P&L and gross profit need agreed recognition and costing rules.

Reports:
- Specify time zone, date basis, branch filters, included statuses, revenue/cost definitions, and a sample reconciliation.

Data hygiene:
- Never commit secrets or production customer data. Keep sensitive data out of logs.
- Validate all server inputs, pagination and data exports.

## 7. Implementation workflow

1. Pick **one** ROADMAP ticket with a named owner, dependencies, acceptance criteria, and affected tables/routes.
2. Read impacted source, tests, contracts, and the provider app's behavior for the feature (observe it, do not guess). If business behavior is still unknown, write `BLOCKED: decision required, D-xx` (ID from `docs/PRD.md` section 7; if none exists, add a new row there first) with 1 to 2 alternatives, and stop only the decision-dependent part.
3. For cross-domain changes, propose a minimal model/API design and get review before migration or implementation.
4. Build end to end: Prisma schema if needed, service/query, authorization, validation, UI with loading/empty/error states, and tests.
5. Run relevant lint, typecheck, tests, migration diff and build. Report actual commands and results. Verify UI manually on staging when automation does not cover it.
6. Open a focused PR with ticket ID, behavior, DB changes, screenshots, tests, and known limitations. Another dev reviews before merge.

## 8. Git and migration conventions

- Protected `main`, short-lived `feat/<ticket>-<topic>` branches, PR-based merges, green CI. Until FND-02 delivers CI, the PR description reports the actual results of `lint`, `typecheck`, `test`, and `build`.
- Never edit applied migrations. Never use `db push` as a substitute for checked-in production migrations.
- SCH-01 schema conventions (D-30): domain primary and foreign keys use `Int`, with matching relation types. Better Auth identity types and mappings must match the selected version's adapter contract; do not blindly convert provider identifiers or tokens. Keep English names and existing table/column mappings. Remove `/// Prototype:` and `/// PII` schema comments; retain relevant `/// DRAFT` guards and keep provenance/privacy inventories in documentation. D-25 protection obligations remain.
- Add `createdAt`, `updatedAt`, and nullable `deletedAt` to domain models where technically appropriate. Master-data deletion is soft deletion, distinct from inactive status, and must preserve historical references. Document exceptions for auth lifecycle/cleanup and immutable records; do not impose domain soft-delete behavior on Better Auth tables without compatibility review. Timestamp backfills, uniqueness after soft deletion, and existing-row nullability need explicit review (D-30).
- Development database: `logistik_web`; test database: `logistik_web_test`. Keep target guards separate. Deterministic fake seeds must provide at least 30 records per relevant list-heavy entity, including Vehicle, Driver, Courier, Customer, Consignee, and Vendor, with required parent fixtures. No real personal data, credentials, or unapproved financial behavior.
- Migration PRs state impact on existing rows, defaults, index changes, and rollback or forward-fix strategy. Back up data before destructive production migrations.
- Use stable schema names and indexes for AWB, branch, date and status access. Watch for N+1 queries and unbounded report queries.
- Models for domains whose rules are `TBD` (for example accounting, invoice, wallet, bank) may be ported from the prototype as drafts, marked `/// DRAFT: rules TBD, D-xx` in the relevant domain schema file. A draft model is not used by any route, action, or UI until its decisions are `CONFIRMED`, and its money fields are already `Decimal`. Customer and Consignee are approved SCH-01 additions from provider forms, with tax/accounting structures following Vendor patterns as guarded drafts; this does not approve financial behavior. Do not invent other models without approved evidence (shipment, manifest, delivery, ticket). Port in slices, one migration per slice, each reviewed by the domain owner; a connected cross-domain ID conversion must preserve all foreign keys atomically.
- Never modify unrelated modules as "cleanup". Never invent requirements or treat a stakeholder decision as approved.

## 9. Definition of done (per feature)

Functionality:
- Acceptance criteria met in working BE and FE.
- A documented side-by-side check against the provider app (same inputs, outputs, permissions) in the PR, with intentional deviations listed.
- Auth, RBAC and branch-scope tests cover both success and denied paths.
- Validation, missing-record, and concurrency cases covered where relevant. No partial writes in transactional workflows.
- Permission handling enforced on the server.

Quality gates:
- Prisma migrations reviewed. Tests and build pass, or blockers are stated truthfully.
- Staging smoke test performed.
- Contracts and docs updated. PR accepted by relevant feature owner(s).

UI (rules in section 5):
- Uses Tailwind v4 conventions and tokens from `globals.css`.
- Loading, empty, error, and accessible interaction states exist.
- Verified at 375px (mobile), 768px (tablet), and 1440px (desktop).
- No horizontal page overflow, clipped controls, or inaccessible navigation.
- Forms, tables, dialogs, and navigation work with keyboard and touch.
