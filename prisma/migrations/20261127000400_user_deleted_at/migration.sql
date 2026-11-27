-- Nullable column; existing rows stay not deleted.
-- Rollback: ALTER TABLE "auth_users" DROP COLUMN "deleted_at";
ALTER TABLE "auth_users" ADD COLUMN "deleted_at" TIMESTAMP(3);
