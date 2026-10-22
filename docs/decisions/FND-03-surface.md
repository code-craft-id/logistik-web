# FND-03 surface brief

Primary targets: src/app/(dashboard)/page.tsx, src/app/(dashboard)/ui-examples/page.tsx, src/components/shell.

Mode: Operate. Audience: internal logistics staff and feature implementers. Task: navigate the foundation and inspect reusable examples. All fixtures are synthetic presentation content; no backend operations are available.

## Direction contract

THESIS: Make the work area readable immediately: compact inherited navigation above a full-width workspace, with a separate readable content path.

OWN-WORLD: Retain Geist and the inherited green/white/slate identity, subtle borders and small control corners. Green selection and focus communicate navigation state.

STORY: Visitors see which routes exist, understand unavailable domains, then inspect table, filter, field, dialog and feedback patterns.

FIRST VIEWPORT: One sticky primary row with a local LMS mark at the left, the eight legacy entries and More at desktop widths, compact finder/account controls at the right. A separate slim breadcrumb strip precedes the full-width workspace. Below 80rem, the logo remains visible and a hamburger opens complete navigation with its finder. Tables retain contained scrolling. Existing synthetic dashboard illustrations and unavailable metrics retain their preview labels.

FORM: Code-led administration shell and example workbench. User brief pins direction; no concept roll required. Desktop uses click-operated grouped Radix NavigationMenu panels; compact navigation keeps bounded disclosures in Radix Sheet. Exact active links and primary ancestors remain identifiable. No decorative motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open evidence

Iteration 2 uses the provider dashboard top navigation and the available Master Data, Modul and Reports notes. The closure pass supersedes its rejected flat headers: use two disclosure levels with one open branch per level, plus a local menu filter with full provider paths. Preserve three vendor-style form tabs and static local actions. Final closure inspected the newly added vendor-form-add.webp: Data Vendor / NPWP / Accounting tabs and visible Data Vendor fields match the example (VERIFIED). Hidden NPWP/Accounting fields remain UNVERIFIED. See FND-03-iteration-2.md, Closure pass, for final inventory, browser evidence and open gates. D-19 and all business decision gates stay open. No operational pages are scaffolded.

## 2026-10-21 intentional navbar refinement

This user-authorized refinement supersedes sidebar-specific presentation directions without changing historical FND-03 acceptance or roadmap statuses. Legacy Header/AppLayout source confirms separate 68px and 50px desktop rows, nested flyouts, mobile drawer, and login outside AppLayout. The target adapts that inventory into one measured 60px primary row with a separate breadcrumb strip. Navigation coverage, unavailable content, finder and honest account behavior remain intact. No legacy logo, auth integration or backend behavior was inherited.

The chosen existing `xl` breakpoint fits all primary labels and compact controls at 1280px; 1279px uses the Sheet. Local checks cover 375/768/1440px, boundary widths, grouped dropdowns, exact nested active state, finder, account, drawer focus/scroll/resize and 200% equivalent reflow. Screenshot and measurement evidence: `docs/experiments/evidence/compact-navbar/`. Native zoom, physical touch, screen-reader review, staging and legacy runtime comparison remain unverified. Earlier acceptance records above do not constitute acceptance of this new shell.
