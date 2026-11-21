-- Add explicit branch ownership to vendor bills.
-- Existing bills are backfilled only when all linked AWBs have the same
-- non-null origin branch. Bills without AWBs or with mixed/unknown branches
-- remain NULL and are administrator-only until an owner is assigned.
-- Rollback would discard the ownership contract and is not data-safe; use a
-- forward fix to correct a backfill instead.

ALTER TABLE "vendor_bills"
ADD COLUMN "branch_id" INTEGER;

WITH "single_branch_bills" AS (
  SELECT
    item."vendor_bill_id",
    MIN(transaction."origin_branch_id") AS "branch_id"
  FROM "vendor_bill_items" AS item
  JOIN "transactions" AS transaction
    ON transaction."id" = item."transaction_id"
  GROUP BY item."vendor_bill_id"
  HAVING COUNT(*) = COUNT(transaction."origin_branch_id")
     AND COUNT(DISTINCT transaction."origin_branch_id") = 1
)
UPDATE "vendor_bills" AS bill
SET "branch_id" = single."branch_id"
FROM "single_branch_bills" AS single
WHERE bill."id" = single."vendor_bill_id";

CREATE INDEX "vendor_bills_branch_id_idx" ON "vendor_bills"("branch_id");

ALTER TABLE "vendor_bills"
ADD CONSTRAINT "vendor_bills_branch_id_fkey"
FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
ON DELETE RESTRICT ON UPDATE RESTRICT;
