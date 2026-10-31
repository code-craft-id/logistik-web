# AWB numbering - design alternatives (Dev 2)

## Context
- Schema: `prisma/schema/sales.prisma:171` `@@unique([originBranchId, awbNo])` (global)
- Service: `createTransaction` pre-checks for active AWB (`deletedAt: null`) and handles P2002 with recovery lookups that also filter `deletedAt: null`
- Review: AWB used before but soft-deleted can pass pre-check and fail on insert with raw Prisma error

## Domain status
- D-05/D-06: Booking/AWB relationship and numbering rules still TBD per DISC-03/PRD.
- No explicit approval to reuse or forbid reuse after soft delete.

## Alternatives

### Alternative 1: AWB can be reused after soft delete
- Constraint: replace with partial unique index `CREATE UNIQUE INDEX transactions_origin_branch_awb_active_key ON transactions (origin_branch_id, awb_no) WHERE deleted_at IS NULL;`
- Pre-check: only check active records (`deletedAt: null`) as now.
- Recovery: handle P2002 by looking up active record; if none found (reused after delete), treat as new create path or return domain error per policy.
- Pros: allows correcting mistakes / reusing numbers after deletion.
- Cons: breaks strict uniqueness across history; audit trail must show reuse; harder to trace; may conflict with external numbering guarantees.

### Alternative 2: AWB never reused
- Constraint: keep global unique on `(originBranchId, awbNo)`.
- Pre-check: check ALL records including soft-deleted (`deletedAt: null` OR not). If exists (active or deleted), return domain error `AWB_SUDAH_PERNAH_DIPAKAI` / "AWB sudah pernah dipakai".
- Recovery: P2002 -> lookup by key/awb (including deleted) and return safe domain error.
- Pros: strict numbering integrity, clear audit trail.
- Cons: blocks reuse after mistakes; requires careful deletion policy.

## Consequences
- Audit trail: reuse complicates history; non-reuse is cleaner.
- Idempotency: must remain consistent with chosen policy.
- Concurrency: DB constraint + transaction checks required in both cases.
- Migration: cannot edit applied migrations; new migration needed if changing constraint type.

**Status:** BLOCKED - awaiting domain owner decision on D-05/D-06. No constraint changes made.
EOF
echo "done"
