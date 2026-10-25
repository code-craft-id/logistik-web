-- Additive Better Auth 1.6.23 username plugin storage.
-- Existing identities retain nullable usernames; no inferred backfill or role changes.
BEGIN;

ALTER TABLE "auth_users"
    ADD COLUMN "username" TEXT,
    ADD COLUMN "display_username" TEXT;

CREATE UNIQUE INDEX "auth_users_username_key" ON "auth_users"("username");

COMMIT;
