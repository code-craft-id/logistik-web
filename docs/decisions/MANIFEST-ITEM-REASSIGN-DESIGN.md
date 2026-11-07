# ManifestItem reassignment design note (Dev 2)

## Context
- `ManifestItem` has `@@unique([transactionId])` (global). 
- `assignTransactionToManifest` treats items with `releasedAt IS NULL` as active; items with `releasedAt` set are considered released/inactive.
- Review concern: after a transaction is released from a manifest, it cannot be assigned to a new manifest because creating a new `ManifestItem` hits the global unique constraint (P2002).

## Current behavior (observed)
- Schema: `prisma/schema/sales.prisma:245` `@@unique([transactionId])`
- Service: checks for existing active assignment (`releasedAt: null`) and throws `TRANSACTION_ALREADY_ASSIGNED` if found; otherwise creates new `ManifestItem`. 
- History: migration `20261027000200_add_manifest_delivery/migration.sql` adds `manifest_items` with unique on `transaction_id`.

## Question (BLOCKED pending domain confirmation)
Is re-manifesting/reassignment of a released transaction allowed? 
- Evidence: D-08 says "Re-manifest rules (when can shipments be moved between manifests?)" is TBD/needs confirmation (DISC-03). 
- FR-04 describes creating manifests from eligible shipments; no explicit reassign rule confirmed.

## Proposed approach if allowed (not implemented yet)
If reassignment of released transactions is approved:
1. Change constraint to partial unique index: `CREATE UNIQUE INDEX manifest_items_transaction_id_active_key ON manifest_items (transaction_id) WHERE released_at IS NULL;` 
2. Drop/replace the global `@@unique([transactionId])` in schema only after migration is ready and reviewed. Prisma does not fully model partial unique indexes in all cases; keep SQL migration as source of truth.
3. Update service to handle P2002 as domain conflict when an active assignment exists (already partially done), and allow creation when no active assignment exists.
4. Ensure concurrent assignment uses DB constraint + transaction checks (updateMany/count or constraint handling).

## Constraints
- Do **not** edit applied migrations.
- Do **not** change constraints without design approval and a tested migration on `logistik_web_test`.
- If not approved, treat reassignment as BLOCKED and do not relax constraints.

## Impact assessment (if changed)
- Old data: released items remain; only active assignments constrained.
- Queries: need to consider `releasedAt IS NULL` when checking active assignments (current logic already does).
- Concurrency: partial unique index prevents two active assignments; P2002 becomes the enforcement mechanism.

**Status:** BLOCKED - awaiting domain confirmation (D-08 re-manifest rules). No schema/migration changes made in this step.
EOF
echo "done"
