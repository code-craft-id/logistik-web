# OPS-04 — Shipment Billing Event Contract

**Status:** PROPOSED (shape/type contract only; runtime enforcement & event production not implemented in Dev 2 scope)  
**Owner:** Dev 2  
**Consumers:** Dev 3 (Reports & Invoices)  
**Related:** ROADMAP OPS-04, PRD D-11, DISC-03, OPS-01/OPS-02/OPS-03

## Purpose
Define a typed, branch-scoped shipment billing event **shape** to support future Dev 3 integration for reports/invoices without Dev 2 prescribing unapproved financial formulas. This document is a **contract proposal only**; no billing amounts/charges logic, event producer, event validator, persistence, or consumer workflow is implemented in the inspected Dev 2 codebase.

## Current implementation status (as observed)
- **Implemented now:** Type definition only (`src/features/bookings/billing-events.ts` exports `ShipmentBillingEvent`).
- **Not implemented / not enforced in this scope:** event emission/producer, runtime validation/guard layer, duplicate-event prevention mechanism, vendor/service resolution rules, billing consumption pipeline, and any financial calculation/posting.
- **Implication:** Dev 3 must not treat this as an enforced or emitted integration contract until producer, validation, and D-11-dependent rules are explicitly implemented and confirmed.

## Event Type (proposed shape)
```ts
export type ShipmentBillingEvent = {
  eventId: string;           // stable id (e.g., uuid) — generation/uniqueness mechanism TBD
  eventType: "SHIPMENT_BILLABLE";
  occurredAt: string;        // ISO 8601 — source of timestamp TBD
  branchId: number | null;
  originBranchId: number | null;
  destinationBranchId: number | null;
  transactionId: number;     // AWB/Transaction id
  awbNo: string | null;
  bookingId: number | null;
  manifestId: number | null;
  manifestNo: string | null;
  courierId: number | null;
  vendorId: number | null;   // vendor reference (if applicable) — source/mapping TBD
  serviceId: number | null;  // service reference — source/mapping TBD
  status: string;
  koli: number | null;
  kilo: unknown | null;      // format/normalization TBD (currently Decimal/string-like in domain)
  volume: unknown | null;    // format/normalization TBD
  createdById: number | null;
};
```

## Sources (existing domain records, for future mapping)
- `Transaction` (bookings/transactions)
- `Manifest` / `ManifestItem`
- `Booking` (optional)

## Proposed validation/guard rules (NOT enforced yet — BLOCKED/PROPOSED)
The following are intended contract expectations, **not** Dev 2-enforced runtime behavior today:
- Branch scope must be respected (origin/destination/manifest branch) when events are produced/consumed.
- Referenced transaction must exist and not be deleted.
- Manifest assignment must be valid if referenced.
- No duplicate billing events for the same transaction context without explicit approval (dedupe key, idempotency, and mechanism to be defined under D-11).
- Vendor/service references must be validated only if present; no inference of rates/costs.
- Source of `vendorId`/`serviceId`, canonical format/precision for `kilo`/`volume`, and event consumption semantics (at-least-once/exactly-once, retry, storage) remain TBD.

## What is safe for Dev 3 to use now vs pending
- **Safe to reference now:** the field names and general intent of `ShipmentBillingEvent` as a *draft alignment shape* in design discussions; existing operational domain sources listed above remain the source of truth for current reporting work.
- **Not safe / pending (do not implement as final):** any assumption that events are emitted, validated, deduplicated, persisted, or financially meaningful; any mapping for `vendorId`/`serviceId`; any formula/tax/discount/COD/vendor-cost calculation; and any reliance on `kilo`/`volume` wire format beyond current domain representations.
- **Depends on decisions/implementation:** D-11 (rates/discounts/tax/COD/vendor costing), event lifecycle, and producer/consumer ownership.

## Notes
- D-11 remains TBD/BLOCKED for financial behavior. No formulas, tax, discounts, ledger postings, or invoice amounts are included or implied.
- This contract proposal is shared for Dev 2–Dev 3 alignment; no Dev 3 runtime integration is claimed complete.
- Compatible in intent with existing OPS-01/OPS-02/OPS-03 contracts where domains overlap, but cross-contract enforcement is not implemented here.
