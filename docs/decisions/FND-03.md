# FND-03: UI foundation

Status: **DONE (2026-10-19)**; coordinator-reported acceptance, recorded in FND-03-iteration-2.md, Final closure. Historical pending statements below are superseded. Integrator: Codex. Scope approval: project coordinator's FND-03 request, including shadcn/ui. This note supplies the shared primitive/token design for review; it does not claim human reviewer acceptance.

## Iteration 2 supersedes the navigation fallback

The iteration 1 record below is historical. Provider notes now exist, and the PRD fallback has been replaced. Current decisions, complete evidence inventory, per-leaf schema readiness and verification are in [FND-03 iteration 2](FND-03-iteration-2.md). Final closure records FND-03 DONE with coordinator-reported acceptance and fresh local gates; no criterion is waived.

## Scope and evidence

Read AGENTS.md, PRD, ROADMAP, FND-01, existing starter source and installed Next.js 16.4.2 layout/client-boundary documentation. SCH-01's dependency is cleared. PLT-01 owns authentication behavior, RBAC and branch scoping and is untouched.

The provider directory contains no menu reference. The coordinator confirmed during implementation that the reference does not exist yet. Navigation therefore uses the ten documented PRD section 3 domains, grouped for scanning; it does not claim provider menu order, hierarchy or parity. BLOCKED: provider evidence/access required, D-29. Once available, compare menu labels/grouping before acceptance. No operational pages were created for these destinations.

D-19 remains TBD. English UI and `lang="en"` follow the starter and project documentation. No date, currency, timezone or translation policy was introduced. No DRAFT model is imported or queried.

## Acceptance matrix

| Criterion | Result | Evidence |
|---|---|---|
| Approved component base | PASS | shadcn/ui approved by coordinator; `components.json`, source-owned Radix components |
| Shared Tailwind v4 tokens | PASS | Only `src/app/globals.css` owns the Tailwind import, palette, radius and shell dimension tokens |
| Desktop/mobile shell | PASS locally | Collapsible sidebar, mobile Sheet, header, skip link, breadcrumbs, page title and exact active routes |
| Navigation from provider menu tree | UNVERIFIED / BLOCKED D-29 | Reference does not exist; PRD domain fallback only |
| Table, form, dialog, filters | PASS locally | `/ui-examples`; search/category/reset, associated local field errors, disabled controls and dialog |
| Loading/empty/error patterns | PASS locally | State selector, skeletons, simulated error recovery, no-match filtering |
| 375 / 768 / 1440 px | PASS locally | Production-browser captures and measurements below, both implemented routes |
| Keyboard/overlay behavior | PASS for exercised paths | Focus containment in both directions, Escape, trigger restoration, drawer route dismissal, keyboard table scrolling |
| Lint/typecheck/tests/build | PARTIAL | Typecheck, 59 tests and production build pass; whole-repository lint has pre-existing failures |
| Staging and human review | UNVERIFIED / PENDING | No staging target or deployment requested; feature-owner acceptance remains outstanding |

FND-03 is not DONE. Provider menu verification and the required repository-wide lint gate remain outstanding. Local browser checks are not a comprehensive accessibility audit or stakeholder approval.

## Architecture and design

- Server-rendered routes `/` and `/ui-examples` share `(dashboard)/layout.tsx`. The root layout retains Geist, metadata and English markup. Client shell receives server-rendered children; only navigation state and examples require interactivity.
- `components/ui/` contains shadcn primitives. `components/patterns/` contains page headings, filter bar, field composition and content states. `components/shell/` owns navigation. `components/examples/` contains synthetic demonstrations. No feature-specific domain code was moved into shared folders.
- Light work surfaces, slate navigation, blue selection/focus and restrained error color implement the requested flat Operate interface. Explicit class-based dark variant prevents system-dark utility fragments from changing light-only examples; dark theme support is not introduced.
- Radix Dialog/Sheet manages portals, focus containment, Escape and focus restoration. Close controls are 44px. Drawer content scrolls vertically. Reduced-motion CSS overrides layered animation utilities.
- Tables retain all columns inside a named, focusable horizontal scroll region. The narrow Biome override for `table.tsx` permits its keyboard scroll target; other accessibility rules remain enabled.
- Static fixtures describe interface patterns rather than business entities. Local form checks never save. Domain destinations have no links and no permission implications. No API, session, mutation, DB, schema, migration or seed changes.

## Documentation lookup and installation

Current official shadcn documentation was retrieved through Context7:

1. `npx ctx7@latest library "shadcn/ui" "Initialize existing Next.js Tailwind v4 project components.json CLI add components Radix dialog"`
2. `npx ctx7@latest docs /shadcn-ui/ui "Existing Next.js application Tailwind v4 components.json manual installation CLI init add Radix components"`
3. `npx ctx7@latest docs /shadcn-ui/ui "CLI add --yes --no-base-style existing components.json new-york Radix Dialog accessibility focus trap Escape restore focus"`

CLI inspected with `npx shadcn@latest --help` and `npx shadcn@latest add --help`. CLI resolved to 4.22.1. Reconciled configuration manually, preserving the app, then ran `npx shadcn@latest add button input label table dialog sheet badge skeleton textarea --yes`. Corrected CLI-generated `cn` imports to the established `@/lib/utils` alias and removed its unintended `cn` package. Installed only the source components' runtime utilities, icon package and animation CSS. npm reported zero vulnerabilities.

Vitest project/environment configuration was verified through `npx ctx7@latest library "Vitest" "Configure test projects different environments happy-dom existing node unit tests"` and `npx ctx7@latest docs /vitest-dev/vitest/v4.1.6 "test.projects inline config extends true node and happy-dom environments include files resolve alias esbuild jsx automatic"`. Existing Node tests stay in a Node project; four UI regressions run in Happy DOM using the existing Vitest runner and React DOM, without a second testing framework.

Official sources: [shadcn manual installation](https://ui.shadcn.com/docs/installation/manual), [CLI](https://ui.shadcn.com/docs/cli), [Dialog](https://ui.shadcn.com/docs/components/radix/dialog), [Vitest projects](https://vitest.dev/guide/projects).

## Verification

Commands run from `C:\Development\logistik-web`:

| Command | Actual result |
|---|---|
| `npm run lint` | FAIL: existing skill scripts/data, local tool files and existing CRLF-formatted files are included by the repository-wide Biome configuration. No blanket exclusion or unrelated repair was added. |
| `rtk bypass npm run lint -- --max-diagnostics=3` | FAIL: 182 errors, 182 warnings, 417 infos after application fixes; examples include untouched `.agents/skills/impeccable/scripts/data/font-index-failures.json` and `vitest.integration.config.mts`. RTK bypass preserves raw diagnostics. |
| `npm run typecheck` (also through `rtk bypass`) | PASS after production route types regenerated. Initial run saw stale `.next/types` pointing at the moved starter page; build resolved it. |
| `npm test` (through `rtk bypass`) | PASS: four files, 59 tests; four new UI tests cover sidebar state/names, invalid-field focus/association, simulated state recovery, and Escape/focus restoration. |
| `npm run build` (through `rtk bypass`) | PASS: Next.js 16.4.2 production build; static `/`, `/ui-examples`, framework not-found route. |
| `rtk bypass npx @biomejs/biome check --write src/components src/lib/utils.ts src/app components.json biome.json package.json` | Application formatting/import fixes applied. |
| `rtk bypass npx @biomejs/biome check src/app src/components src/lib/utils.ts tests/ui components.json biome.json package.json vitest.config.mts` | PASS: 27 changed/new application/config/test files, no fixes required. |
| `git diff --check` | PASS. |
| `rtk bypass npm run start -- --hostname 127.0.0.1 --port 3002` | PASS: production browser verification at `http://127.0.0.1:3002`. |

No database infrastructure is needed by FND-03. No migration/seed or integration DB commands were run. Development server was stopped after inspection; production preview is available during this session.

### Browser evidence

Chromium in-app browser; full-page JPEGs saved under `.impeccable/review/`. Both `/` and `/ui-examples` inspected at 375×812, 768×1024 and 1440×1000. Measured example document widths were 360, 753 and 1425 respectively (remaining 15px is the vertical scrollbar), with no horizontal page overflow. At 375px the table region is 326px wide and its content 682px wide; focusing the region and pressing ArrowRight moves `scrollLeft` to 40.

- `desktop.jpg`, `tablet.jpg`, `mobile.jpg`: final production example page after fixing automatic dark-style leakage discovered in the first inspection.
- `foundation-desktop.jpg`, `foundation-tablet.jpg`, `foundation-mobile.jpg`: foundation route, readable headings and implemented example links.
- `mobile-navigation.jpg`, `mobile-dialog.jpg`: portal overlays at 375px.
- Production keyboard checks: mobile Close→Tab wraps to Foundation; Foundation→Shift+Tab wraps to Close. Escape restores Open navigation. Dialog Close example→Shift+Tab wraps to Close; Close→Tab wraps to Close example. Escape restores Inspect example dialog. Selecting Foundation inside the drawer navigates to `/` and closes it.
- Search `dialog` returns one row; Feedback category returns two rows. Loading, empty, error and reset recovery exercised. Empty form check focuses the labeled invalid field; nonempty check announces local success without saving. Active route remains named after collapse. Breadcrumbs and disabled destinations inspected.
- Foundation overflow measurements are persisted in `foundation-measurements.json`: client/scroll widths 360/360, 753/753, and 1440/1440. Production sidebar collapse preserves `aria-current="page"`; keyboard activation of Skip to content focuses `main-content`.

### Finish review

The fresh Impeccable finish reviewer opened all eight saved captures and reviewed implementation source, returning `ship` with no material fixes. Its scope is implementation/design review, not independent rerunning of interaction tests, human feature-owner acceptance, provider parity or staging approval. The design documentation handoff records the implemented token system in `DESIGN.md` and `.impeccable/design.json`.

The documenter verified all 13 documented color values against `globals.css`, token references, sidecar schema-v2 structure, component snippets and narrative consistency. `npx @biomejs/biome check .impeccable/design.json` passes. This metadata is documentation; `globals.css` remains the runtime token authority.

## Changed files by purpose

| Purpose | Files |
|---|---|
| Routes and presentation | Removed starter `src/app/page.tsx`; added `src/app/(dashboard)/layout.tsx`, `page.tsx`, `ui-examples/page.tsx`; updated `src/app/layout.tsx` and `globals.css` |
| Shell and shared compositions | `src/components/shell/{app-shell.tsx,navigation.ts}`, `src/components/patterns/{page-heading.tsx,filter-bar.tsx,form-field.tsx,content-state.tsx}`, `src/components/examples/foundation-examples.tsx` |
| Component foundation | `src/components/ui/{button,input,label,table,dialog,sheet,badge,skeleton,textarea}.tsx`, `src/lib/utils.ts`, `components.json`, `package.json`, `package-lock.json` |
| Verification configuration | `tests/ui/foundation.test.ts`, `vitest.config.mts`, narrowly scoped `biome.json` accessibility override |
| Conventions and evidence | `AGENTS.md`, `README.md`, `PRODUCT.md`, `DESIGN.md`, `docs/ROADMAP.md`, this note, `docs/decisions/FND-03-surface.md`, `.impeccable/surfaces/src-app-dashboard-page-tsx.md`, `.impeccable/design.json`, local `.impeccable/review/` captures/measurements |

Existing local `.agents/`, `.codex/`, `.impeccable/config.local.json` and hook artifacts were preserved. No schema, migration or seed file changed.

## Remaining acceptance work

Supply provider menu evidence and verify navigation parity under D-29. Resolve existing repository-wide lint failures in separate maintenance scope. Perform staging smoke test and obtain human feature-owner review. D-19 remains open without blocking these policy-neutral presentation examples. No other roadmap ticket was started; no commit, push or deployment was performed.
