# FND-01: Foundation decisions

Status: proposed for team review. Integrator: Codex, at the user's request.
Scope: foundation only. No UI, CI, authentication, domain models, migrations, or database changes.
DISC-01 business/infrastructure decisions remain owned by the team; this note does not approve them.

## Selected tooling

| Decision | Selection and rationale | Alternatives |
| --- | --- | --- |
| ORM | Pin `prisma`, `@prisma/client`, and `@prisma/adapter-pg` to 7.10.1. Latest stable 7.x verified in npm; Node 24.15.0 and TypeScript 7.0.2 satisfy its declared requirements. | Prisma 6 retains older client/config conventions; Prisma 8 is a release candidate, so neither is selected. |
| PostgreSQL driver | `pg` 8.23.1 with the mandatory Prisma 7 adapter. Pass pool configuration directly; Prisma owns and disposes the pool. | An external `pg.Pool` requires explicit ownership and cleanup; direct SQL would bypass the fixed ORM choice. |
| Client/config | ESM `prisma-client` generator, output in ignored `src/lib/db/generated`; import from `./generated/client`. URL belongs in root `prisma.config.ts`; datasource provider belongs in the schema. `dotenv` 17.4.2 loads `.env` for CLI/tests. Optional URL access permits validation/generation without credentials. | Legacy `prisma-client-js` is deprecated; Node's environment-file CLI flags require wrapping each CLI invocation. |
| Runtime | Pin `.nvmrc` to verified Node 24.15.0; engines `>=24.15.0 <25`. Keep npm and the existing lockfile, TypeScript, Next.js, React, Tailwind, and Biome versions. | Node 22 is compatible but changes the current runtime; unbounded engines admit unverified major versions. |
| Tests | Pin Vitest 4.1.12; Node environment, explicit unit/integration file sets, `vitest run`. No DOM packages, React plugins, aliases, or browser testing needed. | Vitest 5.0.5 conflicts with existing `@types/node` 20; `node:test` would need a separate TypeScript execution strategy. |
| Test database | Separate manually created `logistik_web_test`; opt-in `test:integration` executes only `SELECT 1`. Validate URL before client creation; reject missing/malformed URLs, non-test names, and the development target (including common loopback/encoding aliases). Reject query/fragment overrides. | Per-run databases need database creation privileges; schemas inside the development database weaken isolation. |

The server-only singleton reuses the development global before creating a client or adapter.
Next.js supplies the `server-only` marker internally; its installed guide says installing that package is optional.
The application uses Next.js environment loading. CLI/integration configuration loads only `.env`, with process environment taking precedence.
No database URL is committed beyond the explicitly requested local examples.
URL checks cannot identify arbitrary DNS aliases; operators must keep test and development targets separate.
The running Laragon PostgreSQL executable reports **18.3**; pin major **18**. TCP 5432 is reachable.
No SQL was run to inspect the server or verify database existence/permissions. Integration verification belongs to the user.

## Unresolved team choices

These are recommendations, not approvals; no packages or services are introduced.

| Choice | Two options | Recommendation |
| --- | --- | --- |
| Schema validation | Zod; Valibot | Zod for shared server input schemas and ecosystem familiarity. Review before feature implementation. |
| Component library | shadcn/ui; React Aria Components | shadcn/ui for owned components, subject to accessibility and shared token review. |
| Authentication provider | Auth.js; managed OIDC provider | Managed OIDC if approved infrastructure supports it; branch scope and permissions remain application responsibilities. |
| Deployment provider | Vercel; self-hosted Node.js | Vercel for operational simplicity if data-location and cost requirements permit; otherwise self-host. |

## Future Prisma schema conventions

- Use English field names; retain original prototype names as `///` comments.
- Use one status enum per domain concept where needed; avoid conflicting status representations. Apply the PRD's consistent master-data status convention.
- Use `Decimal` for money, with currency and approved rounding rules.
- Use `DateTime @db.Date` for date-only fields.
- Define relations explicitly, including delete behavior and approved constraints.
- Mark unknown rules `/// DRAFT: rules TBD, D-xx`, referencing a real PRD decision ID. Draft models stay unused until confirmed.
- Use one reviewed migration per domain slice, coordinated by the named migration coordinator. Never modify applied migrations.
- Do not infer business rules or constraints from prototype fields or screenshot labels.

## Documentation and verification limits

Read installed Next.js **16.4.2** guides before implementation: installation, server/client components, environment variables, and Vitest.
They are authoritative for Next.js behavior; the Vitest guide's DOM packages serve UI tests and are unnecessary here.

Context7 resolved `/prisma/web`; no exact 7.10.1 index was offered. Its current results mixed Prisma 7 with Prisma 8 configuration.
Resolved that conflict with the official [Prisma 7 upgrade guide](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
and [version 7 config reference](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference), npm metadata, and installed 7.10.1 types/source.
The [ESM generator documentation](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators) describes the custom output and module format.
Empty schema validation and generation both succeeded; no dummy model is required.

Context7 supplied [Vitest 4.1.6 documentation](https://github.com/vitest-dev/vitest/tree/v4.1.6/docs), the nearest indexed 4.x release. Final selection is 4.1.12: npm audit found GHSA-82fw-gwwq-j7x9 in 4.1.6, fixed in 4.1.11+. Exact 4.1.12 documentation fetches were unavailable; installed types and executed tests verify the minimal configuration. Final installation audit reports zero vulnerabilities.
Initial 5.0.3 indexed documentation was superseded after npm exposed the Vitest 5 peer conflict.
Context7 ran within the available sandbox because this session forbids escalated execution; temporary npm cache avoided permission errors.

Review required: tooling/test strategy, unresolved options above, and future schema conventions.
Initial branch creation and index writes failed because Git metadata was read-only. After permissions changed, the five implementation steps were committed separately on feat/fnd-01-foundation.
Pre-existing user changes in `AGENTS.md`, TypeScript manifest/lock entries, and reference documentation remain outside the FND-01 commits.
