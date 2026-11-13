# DISC-03 Findings: Booking/AWB, Shipment, Manifest, Delivery Observations

**Ticket:** DISC-03  
**Owner:** Dev 2  
**Status:** IN PROGRESS  
**Date:** 2026-10-24  

## Dependencies
- DISC-01: DONE (provider app access confirmed per D-29)
- PRD Decisions in scope: D-05, D-06, D-07, D-08, D-09, D-26

## Evidence Sources
1. Preview screens in `src/features/shipments/preview/screens.ts` - derived from legacy UI (`src/pages/module/Booking.jsx`, `Transaction.jsx`, `Manifest.jsx`, `Operations.jsx`)
2. Routes: `/bookings`, `/transactions`, `/manifest`, `/operations`
3. PRD requirements (FR-03, FR-04)
4. Legacy CRUD integration audit

**Note:** D-29 states screenshots in ignored `docs/reference/app-provider/` are excluded; admin access confirmed but role-level parity still TBD. Described evidence in text only.

## Observations

### Booking/AWB (from /bookings, /transactions)
**From preview screens:**
- Booking creation: "Tambah Booking" action
- Fields observed: AWB No. (awbNo), Tanggal (date), DO No. (doNo), Tujuan (destination), Pengirim (sender), Penerima (receiver), Koli, Kilo, Volume, Biaya/Tarif, Status, Dibuat Oleh (madeBy), Kurir
- Status options in form: ["Open", "In Transit", "Delivered", "Cancelled"] (seen in bookings view)
- Both `/bookings` and `/transactions` appear to deal with AWB/transactions - "On Site Outbound" is title for /transactions

**D-05 (Booking to AWB relationship, AWB to pieces relationship):**
- OBSERVED: AWB (Air Waybill) appears to be the primary identifier (awbNo field prominent in both booking and transaction views)
- OBSERVED: DO No. (Delivery Order Number) is a separate field
- OBSERVED: Pieces/quantity tracked as Koli (package count), weight as Kilo, volume as Volume
- RELATIONSHIP: From UI structure, Booking appears to be the entry point that creates an AWB/transaction. AWB seems to be the document identifier.
- QUESTION: Is booking a separate entity from AWB/transaction, or same thing viewed differently? Need clarification.
- PROPOSAL: Need to confirm 1:1 or 1:N relationship between Booking and AWB. From field names, looks like they may be the same concept or closely related.

**D-06 (AWB numbering scheme):**
- OBSERVED: AWB No. is a text field (free-form in UI preview). No visible pattern from preview.
- NEEDS CONFIRMATION: Prefix, format, sequence, branch-specific, auto-generated vs manual?
- From AC-02: "Repeating the same AWB submission cannot create multiple AWBs when an idempotency rule applies" - suggests auto-generation or idempotency key mechanism.

### Manifest (/manifest)
**From preview screens:**
- Title: "Daftar Manifest"
- Fields: Manifest No (manifestNo), Tanggal, Transit 1-5 (transit1-5), Tujuan, Status, Tot. AWB, Tot. Koli, Tot. Kg, Tot. Volume, Tot. Biaya (Rp.), Kendaraan
- Driver/Nopol in form fields
- Actions: limited (inline form style)
- Tools: "Export Excel"
- Search by "Search Manifest No"
- Filters by date range

**D-08 (Manifest types, routes, handover semantics, re-manifest rules):**
- OBSERVED: Multiple transit fields suggest multi-leg routing (Transit 1-5). This implies manifest can go through multiple transit points.
- OBSERVED: Has Tot. AWB, Tot. Koli, Tot. Kg, Tot. Volume aggregates
- OBSERVED: Has Kendaraan (vehicle) and Driver
- MANIFEST TYPES: Could be outbound/inbound/transit as per FR-04 - "Create outbound, transit, and inbound manifests"
- NEEDS CONFIRMATION: How manifest types are distinguished, what constitutes re-manifest, handover process

### Operations/Delivery
**From preview screens:**
- /operations is marked as "heading" kind with "Dormant legacy page preview; no operational integration exists."
- /customer-service also dormant
- FR-04 mentions "Generate delivery sheets and capture delivery result or exception" and "Prevent duplicate active assignment"
- **D-09 (Failed delivery and return flows):**
- OBSERVED from status options in bookings: ["Open", "In Transit", "Delivered", "Cancelled"] - no explicit "Failed Delivery", "Return", "Attempted" visible in preview
- NEEDS CONFIRMATION: Full status list including exceptions/returns

### Shipment Status (D-07)
- Status appears in multiple places
- Bookings/transactions have status select with options ["Open", "In Transit", "Delivered", "Cancelled"]
- Manifest has status (select in form, empty options array in preview - needs definition)
- NEEDS CONFIRMATION: Complete status list and valid transitions per FR-04 "Apply a reviewed status transition matrix"

## D-26: TransportMode.Divider (Volumetric weight divisor)
- **Location:** `prisma/schema/master-data.prisma:112` - `divider String @db.VarChar(100)` marked `/// DRAFT: numeric type TBD, D-26`
- **UI:** Transport mode form has "Divider" field (text input). In logistics, volumetric weight often uses divisor like 6000 (for cm/kg) or different values by courier/mode.
- **OBSERVED:** Stored as String in schema and as text in UI. PRD says "Appears to be a volumetric weight divisor, stored as a string in the prototype model."
- **PROPOSAL:** Likely needs to be Decimal/Numeric for calculation. But stored as string currently. Need to determine correct numeric type. For volumetric weight calculation (L*W*H/divider), divider is usually an integer like 5000, 6000 etc. But could be decimal? Or carrier-specific.
- **NEEDS CONFIRMATION:** Exact meaning, units, if it's per-mode/carrier specific, and numeric type (Decimal vs Int). Also whether it can be null/0.

## Analysis of AWB/Booking Flow
From UI patterns in legacy preview:
- **Booking** (`/bookings`): "Kelola Booking", has fields for AWB No, date, DO No, destination, sender, receiver, koli/kilo/volume, biaya/tarif, status. Create label "Tambah Booking". Actions Edit/Delete.
- **Transaction** (`/transactions`): "On Site Outbound", similar fields but shows "Dibuat Oleh" (created by) and "Kurir" (courier). Create label "Tambah AWB". Has import tools.

This suggests booking might be entry point and transaction/AWB creation might be related. Or they might be different views of same concept. Need to confirm relationship (D-05).

## Status Patterns
- Booking/Transaction status options: Open, In Transit, Delivered, Cancelled
- Manifest has status field (select) but options empty in preview - needs definition
- This aligns partially with FR-03/FR-04 needing reviewed status transition matrix

## Open Questions for D-05 to D-09
**D-05:** Is there a separate Booking entity vs AWB/Transaction? Are they 1:1 or different concepts? How do pieces map to AWB?
**D-06:** What is the AWB numbering format/pattern? Is it auto-generated? Branch-specific? Any prefix/suffix?
**D-07:** Complete status list for shipments/AWBs and manifests? What are valid transitions? Who can transition?
**D-08:** Manifest types (outbound/inbound/transit)? How are transit points tracked (Transit 1-5 suggest multi-hop)? Re-manifest rules?
**D-09:** Failed delivery, return flows - what statuses, what process?

## Recommendations
Since we don't have direct access to provider app screenshots in repo and need to follow D-29 guidance ("describe side-by-side evidence in PR text, not archived images"), and admin access confirmed by coordinator:
1. Document all observable patterns from preview/UI metadata
2. Mark things as OBSERVED where clearly seen, PROPOSED where inferred, TBD where unclear
3. Create a comprehensive discovery document that can guide OPS-01 implementation once gates are met
4. Note all dependencies on PLT-01/PLT-02

## Next Steps for DISC-03
- [ ] Complete comprehensive findings doc
- [ ] Map findings to each decision (D-05-D-09, D-26) with evidence level
- [ ] Identify what needs confirmation from business/domain owner
- [ ] Create discovery summary for review
