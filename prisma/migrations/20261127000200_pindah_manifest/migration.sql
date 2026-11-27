-- Pindah Manifest (OBSERVED sandbox and real web Cek Transit, 2026-11-27):
-- at a transit branch, scanned AWBs move to another manifest with the same
-- destination. The source row is released and keeps the target; the new
-- row keeps the source, so tracking shows "berpindah ke manifest ...".
-- One AWB may have many manifest rows over time, but only one active row
-- (partial unique index below replaces the global unique transaction_id).
-- Existing rows are untouched (each AWB has at most one row today).
-- Rollback: drop the partial index and columns, recreate
-- manifest_items_transaction_id_key (only if no AWB has two rows).

DROP INDEX "manifest_items_transaction_id_key";

ALTER TABLE "manifest_items" ADD COLUMN "moved_from_manifest_id" INTEGER,
ADD COLUMN "moved_to_manifest_id" INTEGER;

CREATE INDEX "manifest_items_transaction_id_idx" ON "manifest_items"("transaction_id");

CREATE UNIQUE INDEX "manifest_items_active_transaction_key" ON "manifest_items"("transaction_id")
  WHERE "released_at" IS NULL AND "deleted_at" IS NULL;

ALTER TABLE "manifest_items" ADD CONSTRAINT "manifest_items_moved_to_manifest_id_fkey" FOREIGN KEY ("moved_to_manifest_id") REFERENCES "manifests"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "manifest_items" ADD CONSTRAINT "manifest_items_moved_from_manifest_id_fkey" FOREIGN KEY ("moved_from_manifest_id") REFERENCES "manifests"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
