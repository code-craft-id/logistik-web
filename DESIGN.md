---
name: Logistics Management System
description: Restrained, flat administration UI for frequent internal work.
colors:
  background: "#ffffff"
  foreground: "#172334"
  primary: "#0f5c4c"
  secondary: "#edf2f8"
  secondary-foreground: "#253b57"
  muted: "#f3f5f8"
  muted-foreground: "#526176"
  accent: "#e8f2ef"
  accent-foreground: "#0f5c4c"
  destructive: "#b42332"
  border: "#dce2ea"
  input: "#a6b2c2"
  overlay: "#17233480"
  workspace: "#f8fafc"
  chart-1: "#0f5c4c"
  chart-2: "#d99717"
  chart-3: "#2188a5"
  chart-4: "#526176"
typography:
  headline:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3333333333
    letterSpacing: "-0.025em"
  headline-wide:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5555555556
  panel-title:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4285714286
  label:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
  reference:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.3333333333
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input:
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  navigation-link:
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0px 12px"
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  table-container:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.lg}"
  dashboard-panel:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "20px"
---

# Design System: Logistics Management System

## Overview

**Creative North Star: "The Clear Workbench"**

LMS uses a restrained, flat administration system for frequent internal work. White work surfaces, a pale slate canvas and clear Geist typography keep labels, records and actions easy to scan. Green identifies available actions, selection and keyboard focus; error red carries a specific semantic meaning.

Borders, alignment and spacing organize the interface. Components stay compact with small corners and deliberate touch targets. The current system is light only; visual restraint excludes decorative gradients, invented metrics and filler.

**Key Characteristics:**

- Flat white surfaces with restrained green and slate neutrals.
- Geist headings and body text; Geist Mono for references.
- Visible focus, semantic feedback and accessible overlay behavior.
- Mobile-first spacing with contained horizontal table scrolling.

This records the implemented FND-03 foundation. Its delivery status is **DONE (2026-10-19)** with coordinator-reported acceptance; see the [closure evidence](docs/decisions/FND-03-iteration-2.md#closure-pass). All local automated gates and the authorized production smoke pass. Vendor add-form tabs and visible Data Vendor fields are VERIFIED; hidden tab fields and live behavior parity remain unverified. D-29 records the coordinator-confirmed admin access and non-archival decision. Overall sidebar acceptance is coordinator-reported; no individual checklist review or independent human verification is claimed. The surface brief owns route composition and mode. English follows the starter; D-19 remains TBD and no locale or timezone policy is established.

The 2026-10-21 legacy UI inheritance now covers 43 presentation screen routes (34 declared legacy routes and nine dormant source screens), with 72 leaf view contracts; `/ui-examples` remains the separate foundation catalogue. The preceding acceptance paragraph records the historical FND-03 closure, not acceptance of this migration. The inherited presentation retains the source menu, tab and field order within the incumbent shell. All screens use synthetic fixtures or unavailable values; saving and operational actions remain unavailable pending the owning PLT/domain implementations. Comparison is source-based: legacy runtime comparison is unavailable, and no pixel parity, operational/security acceptance or independent domain-owner acceptance is claimed. See [the scoped audit and verification note](docs/experiments/legacy-ui-parity.md) and [screen inventory](docs/experiments/legacy-ui-screen-map.json).

## Colors

**2026-10-23–24 identity checkpoint:** the all-preview description above is the historical migration snapshot. Existing PLT-01 login, groups, users, rights and profile/session screens now call identity services, with loading/error/empty states and source-owned Card/Select/Checkbox/Separator primitives. The account menu renders server-selected display fields and supports provider sign-out. `/` is public company-information placeholder content; `/dashboard` retains the existing domain preview. This partial identity implementation has no accepted D-03/D-04 contract and does not activate other domains. Earlier responsive/browser evidence does not verify these newer identity forms. See [PLT-01](docs/decisions/PLT-01.md).

A restrained green accent sits against white and cool slate neutrals. Frontmatter color values are extracted from `src/app/globals.css`; that stylesheet remains the implementation source of truth. Repeated aliases share these values: primary foreground and sidebar use background, while ring and accent foreground use primary. Sidecar tonal ramps are derived swatch previews, not additional runtime tokens.

### Primary

- **Work Green** (`primary`): available primary actions, caret and focus; inherited from the inspected legacy presentation.
- **Selection Mist** (`accent`) with **Selection Ink** (`accent-foreground`): active navigation and hovered secondary controls.

### Neutral

- **Work White** (`background`): panels, sidebar, header, dialogs and on-primary text.
- **Workspace Slate** (`workspace`): the shell canvas behind white work regions.
- **Slate Ink** (`foreground`): primary text.
- **Cool Slate Wash** (`secondary`) with **Deep Slate** (`secondary-foreground`): restrained secondary buttons and example badges.
- **Quiet Slate** (`muted`): skeletons and muted states; the example filter toolbar uses this surface at 40% opacity.
- **Slate Caption** (`muted-foreground`): supporting text and unavailable destinations.
- **Divider Slate** (`border`): structural separation.
- **Control Slate** (`input`): field boundary.
- **Slate Veil** (`overlay`): translucent dialog and drawer backdrop.

### Semantic

- **Error Red** (`destructive`): invalid fields, destructive buttons and error icons. No distinct success or warning palette is implemented.

### Chart illustrations

- **Chart Green**, **Chart Amber**, **Chart Teal** and **Chart Slate** (`chart-1` through `chart-4`): the shared four-series illustration palette. Amber and teal distinguish chart segments; they do not introduce warning or status meanings. Legends and accessible descriptions identify the series and their synthetic nature.

**The Meaningful Accent Rule.** Use green for actions, selection and focus, and error red for destructive or invalid states. Color must reinforce a label or state.

## Typography

**Display Font:** No separate display face or display scale is implemented.
**Body Font:** Geist, with Arial, Helvetica and sans-serif fallback.
**Label/Mono Font:** Geist for labels; Geist Mono for synthetic references.

**Character:** Clear, compact and practical. Sentence case and moderate weight establish hierarchy without oversized display treatment.

### Hierarchy

- **Headline** (`headline`, `headline-wide`): page titles grow at the small breakpoint; tight tracking stays consistent.
- **Title** (`title`): section headings. Dialog titles use the same size with a compact line-height of 1.
- **Panel title** (`panel-title`): dashboard panel and metric-group headings use the compact semibold body-sized step.
- **Body** (`body`): tables, descriptions and controls. Longer helper paragraphs use 24px leading; description containers use the existing prose width (65ch).
- **Label** (`label`): medium-weight field labels. Navigation uses the same size and weight with ordinary body leading.
- **Reference** (`reference`): compact monospaced identifiers with tabular numerals.
- **Supporting text:** compact 12px captions supplement the hierarchy. Inputs use 16px text below the medium breakpoint and 14px from that breakpoint.

## Layout

The spacing rhythm comes from Tailwind's installed quarter-rem scale. Frontmatter records reused steps; features consume utilities rather than introducing scales.

The work region is fluid, with no maximum width and minimum-width containment. Main content uses 1rem horizontal padding, increasing to 1.5rem at the small breakpoint and 2rem at the large breakpoint. Vertical padding is 1.5rem, increasing to 2rem at the large breakpoint. Major sections use 1.5rem separation.

The 2026-10-21 shell refinement replaces the persistent desktop sidebar and its reserved width with a single sticky white navbar. The primary row measures 60px at normal text size (61px including its bottom border). It contains a local Truck mark and LMS wordmark linked to Dashboard, the eight inherited primary entries, More, finder and account controls. Full navigation appears from the existing 80rem (`xl`) breakpoint; below it the logo stays at the upper left and a hamburger opens the complete focus-managed Sheet. Fit checks at 1279px and 1280px confirm the switch occurs before controls collide. Breadcrumbs occupy a separate 37px content-context strip at normal text size and wrap independently; only the primary row is sticky. Main content has no sidebar offset. These measured heights are flexible minimums, not clipping rules.

Filters wrap with their labels and actions. Side-by-side example sections start at the extra-large breakpoint. Tables retain columns within a named, keyboard-focusable horizontal scroll region; page-level horizontal overflow is not the table strategy. The locally exercised viewports are 375px, 768px and 1440px; shared evidence is in the FND-03 note and `docs/decisions/evidence/`. Historical `.impeccable/review/` captures are local, ignored tooling artifacts.

The dashboard's first scoped inheritance batch uses single-column quick-action and metric regions, two columns from the small breakpoint and three from the extra-large breakpoint. Filters grow from one column to two at the small breakpoint and four at the large breakpoint; their action row sits alongside from the extra-large breakpoint. The full-width monthly chart region precedes three chart regions that become columns at the extra-large breakpoint. This is the dashboard composition, not a requirement for other pages. Current screenshots and measurements in `docs/experiments/evidence/legacy-ui-parity/` cover the same three viewports, report no page overflow and show 44px dashboard controls. They do not establish legacy runtime or pixel parity.

Legacy workspaces connect navigation to filters and rows, with local dialogs or source-defined inline entry forms. Source-defined tabs wrap on narrow screens. Form fields grow from one column to two at the small breakpoint; their action row wraps below the fields. Presentation headings use a compact 20px step, growing to 24px at the small breakpoint. Dense tables and the monthly chart contain horizontal scrolling within their own regions.

## Elevation & Depth

The intended surface system has no decorative shadows. Border lines, tonal layers, whitespace and the translucent overlay convey separation. Dialog and drawer overlays sit above the work area without adding an elevated card treatment.

**The Flat Surface Rule.** Use borders, spacing and tonal surfaces to establish structure. Do not add decorative shadows or gradients.

Implementation detail, not a reusable elevation policy: the generated Input and Textarea primitives currently retain Tailwind's extra-small shadow (`0 1px 2px 0 rgb(0 0 0 / 0.05)`). This inherited detail is recorded rather than promoted to a surface token. Focus rings remain interaction feedback.

Motion is functional: ordinary control transitions use the installed 150ms standard easing; dialog and Sheet entry/exit use 200ms. Reduced-motion preference shortens animations and transitions to 0.01ms. Do not add decorative motion.

## Shapes

Small control corners distinguish fields and buttons from their containing work regions. The base radius is 8px; the shared small, medium and large aliases resolve to the frontmatter scale. Controls and navigation use medium corners, table containers and dialogs use large corners, and badges use fully rounded ends. Use a single-pixel border for controls and structure.

Dashboard panels, quick-action groups and metric containers use the installed extra-large radius step (12px), with no change to the shared primitive radii.

## Components

Source-owned shadcn/ui primitives live in `src/components/ui/` with Radix behavior where applicable. Shared compositions live in `src/components/patterns/`, navigation in `src/components/shell/`, and synthetic demonstrations in `src/components/examples/`. Domain compositions belong to their feature modules. Next.js pages and layouts remain Server Components; shell state and example interactions occupy Client Components.

### Buttons

Compact, direct and consistently named. Primary, destructive, outline, secondary, ghost and link variants are implemented. The default primitive is 36px tall; the preview's action controls deliberately use a minimum 44px height for touch. Primary and destructive hover colors use 90% opacity; outline and ghost hover use the selection surface. Disabled controls halve opacity and suppress pointer interaction. Focus uses the shared green ring; invalid state uses the semantic error border and ring.

### Chips

The current badge is a status label, not a selectable filter chip. The secondary variant marks synthetic example content with a cool neutral background, compact type and fully rounded corners. Interactive badge variants retain visible focus.

### Cards / Containers

PLT-01 adds a source-owned Card primitive for login/profile composition; this was absent from the earlier presentation-only snapshot. The table work region is a large-cornered bordered container. Its muted filter toolbar, readable rows, caption and count footer form one continuous work area. The DashboardPanel composition uses a white surface, single-pixel border, extra-large corners and 20px padding; its heading and optional description precede content with 16px separation. Dashboard metric containers share that surface and padding. Panels group the observed dashboard sections without decorative elevation.

### Inputs / Fields

Fields use a transparent surface, control-colored border and medium corners. Labels sit above controls with associated hints and inline errors. Focus changes the border and adds a 3px half-opacity green ring; invalid input changes to error red. The original primitive example focuses the invalid required field, and its success output explicitly says nothing was saved. The reusable FormLayout uses three Radix tabs for the vendor-style example, following the observed Vendor Data / NPWP / Accounting split. Arrow keys, Home and End move between tabs. Panels stay mounted and inactive panels are hidden; input values persist across tab changes. Shared actions stay outside panels. Tax and accounting previews establish no business validation or financial behavior. Native selects retain familiar behavior. Disabled fields keep a visible value with reduced opacity.

Dashboard month, date and year fields are a local preview. Show reports the entered selection through a polite live output; Reset clears it. The branch select explicitly remains unavailable pending PLT-01. No data is queried or saved, and native date presentation establishes no locale or timezone policy.

### Navigation

The compact navbar uses source-owned shadcn-style Radix NavigationMenu composition with the installed `activationMode="manual"` API. Click, Enter/Space and ArrowDown open grouped panels; arrow keys and Tab navigate, Escape and outside interaction dismiss. Panels share a left anchor, remain within the viewport and scroll vertically when long; there are no cascading flyouts. Header layering is below Sheet, account and feature-dialog overlays. Exact destinations carry `aria-current="page"`, and their top-level trigger has selection-green styling. Opening a nested primary menu exposes its section and selected link immediately. Pathname changes remount only interactive header state, closing stale surfaces; responsive breakpoint changes also dismiss surfaces and recover visible focus.

The single typed `navigation.ts` config remains shared by desktop, drawer, finder, active state and breadcrumbs. `legacy-menu.ts` remains the source inventory. Primary order stays Dashboard, Sistem Setting, Kantor, Master Data, Akunting, Modul, Laporan, Ticketing, including `/ticketting`. More keeps More previews, all 68 documented Provider inventory leaves, Tutorial System and UI examples distinct from the legacy groups. Unavailable destinations are visibly labeled, unlinked presentation content. Source labels and English foundation labels do not settle D-19.

The compact drawer and supplementary inventory retain two bounded disclosure levels with one group and section open at a time. Active ancestors open when mounted. The finder control opens a labeled Radix Sheet, searching every configured label, parent path and actual URL; results retain full parent paths and destination labels. Empty results explain recovery, and Clear menu search restores the tree and focuses the input. Search includes available previews and unlinked unavailable inventory. Sheets preserve focus containment, Escape dismissal, background scroll locking, 44px close targets and trigger focus restoration. Selecting a route closes them, including selecting the current route. Resizing an open drawer into desktop mode closes it and focuses the visible brand link.

At the 2026-10-21 snapshot, Account unavailable linked to the profile preview and left logout disabled. The PLT-01 checkpoint above supersedes that identity behavior, not the historical navbar acceptance. The skip link and focusable main-content target remain. Pages/layouts stay Server Components with interactive boundaries. Existing green/white/slate tokens and Geist remain authoritative; `globals.css` is unchanged.

New local evidence lives in `docs/experiments/evidence/compact-navbar/`. All 43 migrated routes plus UI examples passed desktop smoke checks. Dashboard, a nested inbound report, vendor table/form and UI examples were inspected at 375/768/1440px; breakpoint probes include 1240/1279/1280/1320px. No page overflow was found. A 720x450 CSS viewport at device scale 2 checks the equivalent reflow of a 1440x900 viewport at 200%; native browser zoom, physical touch and screen-reader acceptance remain unverified. Historical sidebar acceptance above remains historical and does not approve this navbar. See the appended refinement record in `docs/experiments/legacy-ui-parity.md` for actual gates and limitations.

### Dashboard Preview

The current order is filters, six quick-action groups, six branch metrics, five operational metrics, a monthly transaction chart and three summary charts. The source quick-action labels now link to implemented presentation previews. All 11 metric values remain Unavailable. The chart regions show a monthly stacked-bar illustration, sales and paid/unpaid donut illustrations, and a daily area illustration. Drawing dimensions in `dashboard-chart-fixtures.ts` are arbitrary geometry, not reporting values, counts, money or approved proportions. Each chart states that it is synthetic, supplies an accessible description and leaves actual values unavailable. Filters do not recalculate the illustrations. This records presentation evidence only; workflow, branch scope and financial/reporting definitions require their owner-approved implementations.

### Legacy workspace previews

Shared PreviewScreen, PreviewWorkspace, PreviewForm and PreviewField compositions render source-derived labels, columns, field order, tabs and row-action affordances. Search, filters, sorting, pagination and state selectors operate on synthetic local rows. Form tabs retain mounted fields, hide inactive panels and keep actions below the panels. Check preview can highlight a missing presentation field; Simpan remains disabled. Action dialogs and import previews describe unavailable backend behavior explicitly. These presentation contracts do not define database, API, authorization or business-validation rules.

### Table, Feedback and Dialog

Table headings remain visible with semantic column scope; rows use a subtle muted hover and reference IDs use mono text. Keep the scroll region keyboard reachable. Empty and simulated error states pair a concise explanation with recovery; loading skeletons have a live text label and decorative bars are hidden from assistive technology.

Dialogs keep title and description semantics, constrained viewport height, contained vertical scrolling and a footer that stacks on narrow screens. Use Radix for focus containment, Escape and focus restoration rather than recreating those behaviors. Sidecar snippets preview visual primitives only; the application components own interaction behavior.

## Do's and Don'ts

### Do:

- **Do** use the shared semantic colors and radius values from src/app/globals.css.
- **Do** retain Geist, sentence case and a clear heading hierarchy.
- **Do** keep labels, validation messages and visible keyboard focus associated with their controls.
- **Do** preserve every critical table column inside an accessible horizontal scroll region.
- **Do** use the source-owned Radix Dialog and Sheet for overlay focus and dismissal.
- **Do** label synthetic examples and unavailable destinations accurately.

### Don't:

- **Don't** add decorative shadows, gradients, filler cards or invented metrics.
- **Don't** create feature-local palettes, spacing scales or breakpoint tokens.
- **Don't** turn unavailable destinations into placeholder links or permission claims.
- **Don't** use color alone to communicate state or hide essential actions behind hover.
- **Don't** infer a dark theme, financial formatting, localization or timezone policy from these examples.
