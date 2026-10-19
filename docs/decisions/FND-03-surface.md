# FND-03 surface brief

Primary targets: src/app/(dashboard)/page.tsx, src/app/(dashboard)/ui-examples/page.tsx, src/components/shell.

Mode: Operate. Audience: internal logistics staff and feature implementers. Task: navigate the foundation and inspect reusable examples. All fixtures are synthetic presentation content; no backend operations are available.

## Direction contract

THESIS: Make the work area readable immediately: persistent domain navigation beside a clear page heading and structured example content.

OWN-WORLD: Retain Geist. Light work surfaces, cool slate navigation, blue selection and focus, subtle borders and small control corners. Restrained semantic color communicates UI state.

STORY: Visitors see which routes exist, understand unavailable domains, then inspect table, filter, field, dialog and feedback patterns.

FIRST VIEWPORT: Desktop sidebar at left; slim header and breadcrumbs above the title. Examples place a labeled filter toolbar directly over a readable table. Mobile uses a focus-managed navigation drawer and contained table scrolling. No metrics or decorative cards.

FORM: Code-led administration shell and example workbench. User brief pins direction; no concept roll required. Signature interaction: sidebar collapses while preserving named route access and active selection. No decorative motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open evidence

Iteration 2 uses the provider dashboard top navigation and the available Master Data, Modul and Reports notes. The closure pass supersedes its rejected flat headers: use two disclosure levels with one open branch per level, plus a local menu filter with full provider paths. Preserve three vendor-style form tabs and static local actions. Final closure inspected the newly added vendor-form-add.webp: Data Vendor / NPWP / Accounting tabs and visible Data Vendor fields match the example (VERIFIED). Hidden NPWP/Accounting fields remain UNVERIFIED. See FND-03-iteration-2.md, Closure pass, for final inventory, browser evidence and open gates. D-19 and all business decision gates stay open. No operational pages are scaffolded.
