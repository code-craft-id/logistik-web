# Dev 1 operational permission inventory

Date: 2026-10-30 (Asia/Jakarta). Scope: shared D-04 authorization contract for OPS-01 and OPS-03. Dev 1 requested access for the resources reported missing by Dev 2.

## Contract for review

| Resource | Label | Actions |
| --- | --- | --- |
| `booking` | Booking | `view`, `create`, `update` |
| `transaction` | Transaksi / AWB | `view`, `create`, `update` |
| `manifest` | Manifest | `view`, `create`, `update` |
| `delivery` | Delivery Sheet | `view`, `create`, `update` |

The `delivery` key matches `deliveryOutcomeAction` in PR #9 and is distinct from master-data `delivery_service`. No `delete`, `approve`, or `export` action is registered without a reviewed workflow. `validPermission` continues to reject unknown resource/action pairs, including for administrators. Existing groups receive no new grants automatically; `system_admin:manage` can use the configured actions, and other groups require explicit grants. Every operational record still requires server-side branch scope checks.

The permission matrix lists these resources and accepts its complete inventory by deriving the input limit from the configured action count. No schema change or migration is needed because grants already store resource/action strings.

This checkout currently contains preview pages for Booking, Transaction, and Manifest, not the Dev 2 server actions described in the handoff message. Dev 2 must use these exact keys in its runtime, enforce branch scope on reads and writes, and verify the action set against its provider observations. D-05/D-06/D-08/D-09 and operational parity remain open. Another developer's review of this shared contract is required before merge under AGENTS.md section 3.
