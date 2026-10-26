# Logistics Management System

Next.js 16 App Router, strict TypeScript, Prisma/PostgreSQL, Better Auth and
Tailwind v4. Read `AGENTS.md`, `docs/PRD.md`, then `docs/ROADMAP.md`.
Deployment is self-hosted; CI/staging remain shared FND-02 work.

## Local setup

1. Use Node.js **24.15.0** (`.nvmrc`), not the shell's older default:

   ```sh
   nvm use
   npm ci
   ```

2. Copy `.env.example` to `.env` only if you do not already have local settings.
   Set development/test database URLs, `BETTER_AUTH_URL`, and a random
   `BETTER_AUTH_SECRET` of at least 32 characters (for example,
   `openssl rand -hex 32`). Never commit local credentials or session cookies.
3. Start local PostgreSQL major **18**. Development uses `logistik_web`; integration
   tests require the separate `logistik_web_test`. Do not reset existing databases.
4. Validate and generate without applying migrations:

   ```sh
   npx --no-install prisma validate
   npx --no-install prisma generate
   npm run check
   npm run build
   ```

Generated Prisma files are ignored; regenerate after installation/schema changes.
Read-only migration checks:

```sh
npx --no-install prisma migrate status
npx --no-install prisma migrate diff --from-config-datasource --to-schema prisma --exit-code
```

Apply only reviewed migrations, through `node prisma/migrate-local.mjs` for
development or `node prisma/migrate-test.mjs` for tests. These commands **change
their target database**; they are not setup verification. No `db push`, reset or
rewriting applied SQL. Existing PLT-01 migrations and business rules still need
review; see `docs/decisions/PLT-01.md`.

## Tests and fake fixtures

- `npm run check`: lint, typecheck and database-free unit/UI tests.
- `npm run test:integration`: explicitly opt into PostgreSQL tests. They create,
  mutate and clean up their own fake identity fixtures and run schema/seed checks;
  this is **not read-only** and no longer only `SELECT 1`. Target guards require
  exact `logistik_web_test`, loopback, non-production and a target distinct from
  development. Never point this at shared or real data.
- `npm run db:seed`: guarded, development-only fake fixtures. Existing matching
  fixtures are preserved; collisions roll back. It does not provision credentials.
  `scripts/seed-direct.mjs` delegates to the same guarded seed.

CLI/integration configuration loads `.env`; process variables take precedence.
Local admin bootstrap scripts require an explicit local target/password and
separate privilege initialization. They are not production provisioning and
are never run automatically.

## Application routes and scope

Run `npm run dev`, then visit `http://localhost:3000`.

| Route | Current purpose |
| --- | --- |
| `/` | Public company-information placeholder; no fabricated company records |
| `/login` | Username/password login |
| `/dashboard` | Protected existing dashboard preview; no live KPIs |
| `/group-user`, `/user-management`, `/hak-akses-menu` | Partial PLT-01 identity management with server permission checks |
| `/profile` | Own profile/password and session management |
| `/ui-examples` | Protected, explicitly synthetic shared UI examples |

The old presentation inventory retains `/` as its source dashboard identifier;
runtime navigation maps that destination to `/dashboard`. Other office/master
data and Dev 2/3 domain screens remain previews. Do not treat menu availability or
schema storage as approved workflows.

PLT-01 is **PARTIAL, acceptance BLOCKED**: D-03/D-04 organization/permission
evidence and review remain missing. Remaining Dev 1 work and verification are in
`docs/decisions/PLT-01.md`. No deployment or production readiness is claimed.

Pages/layouts remain Server Components; interactive boundaries are isolated.
Primitives live in `src/components/ui/`, shared compositions in
`src/components/patterns/`, and shared tokens only in `src/app/globals.css`.
Follow `DESIGN.md`; read the installed Next.js guides in
`node_modules/next/dist/docs/` before implementation.

## Branch WhatsApp gateway

Office > Perusahaan > WA Notifikasi now includes a branch setup inventory after
selecting a company. It requires `whatsapp_configuration:view` and applies the
current server branch scope. With a configured gateway, select a branch to view
live status. Administrators may connect, display QR and confirm logout.

The optional server-only `WHATSAPP_GATEWAY_URL` and `WHATSAPP_GATEWAY_API_KEY`
settings are documented in `.env.example`. Both can remain empty until the
separate Baileys project is available. Entering them enables gateway requests;
pairing requires explicit connection and a device scan. No message is sent by
the setup panel. No schema migration or Baileys package is required in LMS.
The Baileys project implements [gateway API v1](docs/decisions/WA-01-gateway-api.md).
