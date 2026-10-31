# OPS-04 — Shipment Billing Event Contract

**Status:** PUBLISHED (for integration only, no financial formulas defined)  
**Owner:** Dev 2  
**Consumers:** Dev 3 (Reports & Invoices)  
**Related:** ROADMAP OPS-04, PRD D-11, DISC-03, OPS-01/OPS-02/OPS-03

## Purpose
Define a typed, branch-scoped shipment billing event contract to be consumed by Dev 3 for reports/invoices without Dev 2 prescribing unapproved financial formulas. This document is a contract only; no billing amounts/charges logic is implemented in this change set.

## Event Type
```ts
export type ShipmentBillingEvent = {
  eventId: string;           // stable id (e.g., uuid)
  eventType: "SHIPMENT_BILLABLE";
  occurredAt: string;        // ISO 8601
  branchId: number | null;
  originBranchId: number | null;
  destinationBranchId: number | null;
  transactionId: number;     // AWB/Transaction id
  awbNo: string | null;
  bookingId: number | null;
  manifestId: number | null;
  manifestNo: string | null;
  courierId: number | null;
  vendorId: number | null;   // vendor reference (if applicable)
  serviceId: number | null;
  status: string;
  koli: number | null;
  kilo: unknown | null;
  volume: unknown | null;
  createdById: number | null;
};
```

## Sources (existing)
- `Transaction` (bookings/transactions)
- `Manifest` / `ManifestItem`
- `Booking` (optional)

## Validation Rules (Dev 2 enforced)
- Branch scope must be respected (origin/destination/manifest branch)
- Transaction must exist and not deleted
- Manifest assignment must be valid if referenced
- No duplicate billing events for same transaction context without explicit approval (to be defined under D-11)
- Vendor references validated only if present (no inference of rates/costs)

## Notes
- D-11 (rates/discounts/tax/COD/vendor costing) remains TBD. No formulas, tax, discounts, or ledger postings included.
- This contract is published for Dev 3 integration; no changes to Dev 3 implementation are made.
- Compatible with existing OPS-01/OPS-02/OPS-03 contracts.
