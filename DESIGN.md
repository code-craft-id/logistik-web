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

The 2026-10-21 legacy UI inheritance batch updates the shared accent, shell canvas, gutters and dashboard panel presentation described below. The preceding acceptance paragraph records the FND-03 closure; it does not approve this batch. Current routes remain `/` and `/ui-examples`. The dashboard is a presentation preview, PLT-01 has not started, and no independent domain-owner acceptance or runtime comparison with legacy is claimed. See [the scoped audit and verification note](docs/experiments/legacy-ui-parity.md) for this batch's evidence and outstanding gates.

## Colors

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

The desktop sidebar appears from 64rem, occupies 16rem when expanded and 5rem when collapsed, and scrolls vertically within the viewport. Its icon-only state retains accessible route names and the active state. Smaller screens use a focus-managed Sheet. The white header wraps at narrow widths; it and the desktop brand region have a baseline minimum height of 4.25rem.

Filters wrap with their labels and actions. Side-by-side example sections start at the extra-large breakpoint. Tables retain columns within a named, keyboard-focusable horizontal scroll region; page-level horizontal overflow is not the table strategy. The locally exercised viewports are 375px, 768px and 1440px; shared evidence is in the FND-03 note and `docs/decisions/evidence/`. Historical `.impeccable/review/` captures are local, ignored tooling artifacts.

The dashboard's first scoped inheritance batch uses single-column quick-action and metric regions, two columns from the small breakpoint and three from the extra-large breakpoint. Filters grow from one column to two at the small breakpoint and four at the large breakpoint; their action row sits alongside from the extra-large breakpoint. The full-width monthly chart region precedes three chart regions that become columns at the extra-large breakpoint. This is the dashboard composition, not a requirement for other pages. Current screenshots and measurements in `docs/experiments/evidence/legacy-ui-parity/` cover the same three viewports, report no page overflow and show 44px dashboard controls. They do not establish legacy runtime or pixel parity.

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

No Card primitive is implemented. The table work region is a large-cornered bordered container. Its muted filter toolbar, readable rows, caption and count footer form one continuous work area. The DashboardPanel composition uses a white surface, single-pixel border, extra-large corners and 20px padding; its heading and optional description precede content with 16px separation. Dashboard metric containers share that surface and padding. Panels group the observed dashboard sections without decorative elevation.

### Inputs / Fields

Fields use a transparent surface, control-colored border and medium corners. Labels sit above controls with associated hints and inline errors. Focus changes the border and adds a 3px half-opacity green ring; invalid input changes to error red. The original primitive example focuses the invalid required field, and its success output explicitly says nothing was saved. The reusable FormLayout uses three Radix tabs for the vendor-style example, following the observed Vendor Data / NPWP / Accounting split. Arrow keys, Home and End move between tabs. Panels stay mounted and inactive panels are hidden; input values persist across tab changes. Shared actions stay outside panels. Tax and accounting previews establish no business validation or financial behavior. Native selects retain familiar behavior. Disabled fields keep a visible value with reduced opacity.

Dashboard month, date and year fields are a local preview. Show reports the entered selection through a polite live output; Reset clears it. The branch select explicitly remains unavailable pending PLT-01. No data is queried or saved, and native date presentation establishes no locale or timezone policy.

### Navigation

The white sidebar uses compact grouped labels and Lucide domain icons. Implemented links have 44px minimum row height, medium-weight type and selection-green hover/active treatment. Exact-route matching supplies `aria-current`. Unavailable domains are presentation text with an unavailable accessible label. The typed navigation config preserves observed provider top-level order, with Dashboard first, and the 68-leaf provider inventory. Domain inventory displays observed provider labels; the foundation's English copy remains provisional under D-19. No localization policy is established.

The closure pass replaces the rejected flat headers with two disclosure levels: top-level group and section. Folder icons, chevrons, inset borders and nested lists distinguish groups from unavailable leaves. Only one group and one section open at a time. Buttons expose `aria-expanded` and `aria-controls`; active route ancestors open on initial rendering. The current full path appears before the inventory. A labeled local filter searches original provider and existing English leaf labels, showing complete provider paths and unlinked unavailable results. Clear restores the tree and focuses the filter. This extra control addresses the remaining long report scan; no command palette or dependency is introduced. Indentation stops after the second disclosure level. Undocumented groups remain top-level text. The named Expand sidebar control recovers compact mode.

The mobile Sheet uses Radix focus containment, Escape dismissal, a 44px close target and trigger focus restoration. Selecting an available route dismisses the drawer. The shell includes a skip link and breadcrumbs.

The persistent sidebar and its bounded disclosure tree adapt the legacy presentation; horizontal flyout navigation is not inherited. Account status is explicitly unavailable in the header, with no fabricated user or account workflow.

### Dashboard Preview

The current order is filters, six quick-action groups, six branch metrics, five operational metrics, a monthly transaction chart region and three summary chart regions. Quick destinations are unlinked text, metric values say Unavailable, and each chart region explains its missing approved source. No mock counts, money, cache timestamps or plotted data are provided. This records presentation evidence only; workflow, branch scope and financial/reporting definitions require their owner-approved implementations.

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
