-- AlterTable
ALTER TABLE "transaction_status_history" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updated_at" TIMESTAMP(3);

-- Backfill updated_at for existing rows
UPDATE "transaction_status_history" SET "updated_at" = COALESCE("changed_at", "created_at");

-- Make updated_at NOT NULL
ALTER TABLE "transaction_status_history" ALTER COLUMN "updated_at" SET NOT NULL;
