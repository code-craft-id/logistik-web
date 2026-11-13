# DISC-03: Booking/AWB, Shipment, Manifest, Delivery Observations

**Ticket:** DISC-03  
**Owner:** Dev 2  
**Status:** OBSERVATION COMPLETE (pending domain owner confirmation)  
**Date:** 2026-10-24  
**Type:** Discovery - Observation only, no code changes

## Dependencies
- DISC-01: DONE (provider app access confirmed per D-29)
- PRD Decisions in scope: D-05, D-06, D-07, D-08, D-09, D-26

## Evidence Sources
1. Preview screens in `src/features/shipments/preview/screens.ts` - derived from legacy UI (`src/pages/module/Booking.jsx`, `Transaction.jsx`, `Manifest.jsx`, `Operations.jsx`)
2. Routes: `/bookings`, `/transactions`, `/manifest`, `/operations`
3. PRD requirements (FR-03, FR-04)
4. Legacy CRUD integration audit (`docs/experiments/legacy-crud-integration.md`)
5. Schema: `prisma/schema/master-data.prisma` (TransportMode.divider marked D-26)

**Note:** D-29 states screenshots in ignored `docs/reference/app-provider/` are excluded from repo; admin access confirmed by coordinator. Evidence described in text only as instructed.

## 1. Booking/AWB Flow

### Observed (from /bookings, /transactions)
**Booking page (`/bookings` - "Kelola Booking"):**
- Action: "Tambah Booking" (Add Booking)
- Fields observed: AWB No. (awbNo), Tanggal (date), DO No. (doNo), Tujuan (destination), Pengirim (sender), Penerima (receiver), Koli, Kilo, Volume, Biaya/Tarif (cost/rate), Status, Dibuat Oleh (created by), Kurir (courier)
- Status options: ["Open", "In Transit", "Delivered", "Cancelled"]
- Actions: Edit, Delete

**Transaction page (`/transactions` - "On Site Outbound"):**
- Action: "Tambah AWB" (Add AWB)
- Similar fields to Booking
- Additional fields visible: "Dibuat Oleh" (created by), "Kurir" (courier)
- Has import tools

### D-05: Booking to AWB relationship, AWB to pieces relationship
**Status:** OBSERVED (with uncertainty)  
**Evidence:**
- AWB No. (awbNo) is the prominent identifier in both booking and transaction views
- DO No. (Delivery Order Number) is a separate field
- Pieces/quantity tracked as **Koli** (package count), weight as **Kilo**, volume as **Volume**
- Both `/bookings` and `/transactions` deal with AWB/transaction concepts

**Observations:**
- Booking appears to be an entry point; Transaction/AWB appears related
- AWB seems to be the document/identifier for the shipment
- Pieces map to **Koli** (package count) - one AWB can have multiple packages (Koli > 1)

**Uncertainties requiring confirmation:**
- Is Booking a separate entity from AWB/Transaction, or the same concept viewed differently?
- Is relationship 1:1 (Booking -> AWB) or 1:N?
- How exactly does AWB relate to pieces/packages?
- Are there separate Booking and AWB entities in the data model?

### D-06: AWB numbering scheme
**Status:** TBD  
**Evidence:**
- AWB No. is a text input field in the UI (free-form in preview)
- No visible pattern, prefix, or auto-generation indicators in preview screens
- AC-02 states: "Repeating the same AWB submission cannot create multiple AWBs when an idempotency rule applies" - suggests either auto-generation or idempotency mechanism needed

**Needs confirmation:**
- Format/pattern (prefix, length, check digits)?
- Auto-generated or manually entered?
- Branch-specific numbering?
- Sequence source (global or per-branch)?
- Uniqueness scope?

## 2. Manifest

### Observed (from /manifest - "Daftar Manifest")
**Fields:**
- Manifest No (manifestNo), Tanggal (date)
- Transit 1-5 (transit1-5) - indicates multi-leg routing
- Tujuan (destination), Status
- Tot. AWB, Tot. Koli, Tot. Kg, Tot. Volume, Tot. Biaya (Rp.)
- Kendaraan (vehicle)
- Driver/Nopol (license plate) in form fields
- Search by "Search Manifest No", filter by date range
- Export Excel

### D-08: Manifest types, routes, handover semantics, re-manifest rules
**Status:** OBSERVED (partially)  
**Evidence:**
- Multiple transit fields (Transit 1-5) strongly suggest multi-leg/multi-hop routing
- Aggregates track totals across AWBs in manifest
- Has vehicle and driver assignment
- FR-04 says: "Create outbound, transit, and inbound manifests from eligible shipments, with the appropriate branch, vendor, and vehicle. Track handovers."

**Observations:**
- Multi-transit routing is present (up to 5 transit points observed)
- Manifests aggregate multiple AWBs with totals

**Needs confirmation:**
- Manifest types: outbound, transit, inbound - how are they distinguished?
- Route definition and transit point semantics
- Handover process between legs
- Re-manifest rules (when can shipments be moved between manifests?)
- Branch/vendor/vehicle assignment rules

## 3. Shipment Status & Delivery

### Observed Statuses
**From Booking/Transaction forms:**
- Status options: ["Open", "In Transit", "Delivered", "Cancelled"]

**From Manifest:**
- Status field exists but options not visible in preview (needs definition)

### D-07: Status list and transition matrix
**Status:** OBSERVED (partially)  
**Evidence:**
- Booking/Transaction: Open, In Transit, Delivered, Cancelled observed
- Status appears across booking, transaction, manifest
- FR-04 requires "Apply a reviewed status transition matrix"

**Observations:**
- Basic lifecycle visible: Open → In Transit → Delivered (or Cancelled)
- Manifest has its own status

**Needs confirmation:**
- Complete status list for shipments/AWBs
- Complete status list for manifests
- Valid transitions (which transitions allowed from which states)
- Who can perform transitions (roles/permissions)
- Whether transitions require reasons/approvals
- History tracking requirements (FR-03 says "status history", AGENTS.md says immutable history with actor/date/prior/new/reason)

### D-09: Failed delivery and return flows
**Status:** TBD  
**Evidence:**
- Observed statuses do not include "Failed Delivery", "Attempted", "Return", "Returned to Origin" etc.
- FR-04 mentions "Generate delivery sheets and capture delivery result or exception"

**Needs confirmation:**
- Exception/failure statuses
- Return flow (when shipment fails delivery, how is it handled?)
- Partial delivery handling?
- Re-delivery process?
- Status transitions for failed/returned shipments

## 4. TransportMode.Divider (D-26)

**Location:** `prisma/schema/master-data.prisma:112`  
**Current schema:** `divider String @db.VarChar(100) @map("Divider") /// DRAFT: numeric type TBD, D-26`  
**UI:** Transport mode form has "Divider" field (text input)

**Status:** OBSERVED (partially)  
**Evidence:**
- Stored as String in schema, marked DRAFT with D-26
- PRD states: "Appears to be a volumetric weight divisor, stored as a string in the prototype model." (D-26)
- In logistics, volumetric weight is typically calculated as (Length × Width × Height) / Divisor, with divisors like 5000, 6000 (cm³/kg) varying by carrier/mode

**Observations:**
- Context suggests volumetric weight calculation divisor
- Currently stored as String (odd for numeric calculation)

**Needs confirmation:**
- Exact meaning and calculation formula
- Correct numeric type (Int, Decimal, etc.) - Decimal likely needed for precision
- Can be null?
- Default values?
- Per-transport-mode or global?
- Units/currency implications?

## Summary Table

| Decision | Status | Evidence Level | Notes |
|----------|--------|----------------|-------|
| D-05 | OBSERVED (uncertain) | Medium - seen in UI structure | AWB is key identifier; Booking vs AWB relationship unclear. Pieces = Koli. |
| D-06 | TBD | Low - no pattern visible | AWB numbering scheme unknown. Idempotency mentioned in AC-02. |
| D-07 | OBSERVED (partially) | Medium - statuses visible | Seen: Open, In Transit, Delivered, Cancelled. Full list and transitions need confirmation. |
| D-08 | OBSERVED (partially) | Medium - routing visible | Multi-transit (1-5) observed. Types/routes/handover/re-manifest need confirmation. |
| D-09 | TBD | Low - not visible | Failed delivery/returns not observed in UI. Needs confirmation. |
| D-26 | OBSERVED (partially) | Medium - schema + UI visible | Volumetric weight divisor context. Numeric type and exact semantics need confirmation. |

## Blockers

- **Implementation blocked:** OPS-01 requires DISC-03 (done as observation), PLT-01, PLT-02 all done
- **PLT-01 not started** (blocked on DISC-02 per roadmap)
- **Full confirmation needed:** Some decisions require business/domain owner confirmation from provider app or stakeholder
- **No direct screenshots:** D-29 excludes provider app screenshots from repo; evidence gathered from preview UI and legacy codebase

## Recommendations for OPS-01

When gates are met, OPS-01 should:
1. Start with flexible schema that can accommodate uncertainties (make fields nullable where TBD)
2. Implement idempotency for AWB creation (AC-02) regardless of numbering scheme
3. Build status handling extensibly for transition matrix (D-07)
4. Follow the discovered patterns from preview UI
5. Add BLOCKED markers if implementation hits undecided rules

## Completion

**DISC-03 observation work is complete to the extent possible from available evidence.** All decisions in scope (D-05 through D-09, D-26) have been documented with evidence levels. Items marked OBSERVED have supporting evidence from preview screens/schema; items marked TBD require further confirmation from domain owner/business as per D-29 guidance.
