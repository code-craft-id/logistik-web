-- PLT-01 user-approved identity slice: user -> group -> configurable permissions.
-- Additive migration, no previous SQL rewritten or identity/credential deleted.
-- Existing users remain ACTIVE. No implicit role or branch grants are backfilled.
-- Forward-fix policy: retain columns/audit history, revert application behavior if needed.
-- Security grants/membership are current associations; revocations retain immutable audit.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "auth_users" ADD COLUMN "status" "record_status" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "permissions" ADD COLUMN "updated_at" TIMESTAMP(3);
UPDATE "permissions" SET "updated_at" = "created_at";
ALTER TABLE "permissions" ALTER COLUMN "updated_at" SET NOT NULL;

ALTER TABLE "user_allowed_branches" ADD COLUMN "updated_at" TIMESTAMP(3);
UPDATE "user_allowed_branches" SET "updated_at" = "created_at";
ALTER TABLE "user_allowed_branches" ALTER COLUMN "updated_at" SET NOT NULL;

CREATE TABLE "identity_audit_events" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "subject_type" VARCHAR(30) NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "identity_audit_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "identity_audit_events_actor_id_fkey"
        FOREIGN KEY ("actor_id") REFERENCES "auth_users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "identity_audit_events_actor_id_created_at_idx"
    ON "identity_audit_events"("actor_id", "created_at");
CREATE INDEX "identity_audit_events_subject_type_subject_id_created_at_idx"
    ON "identity_audit_events"("subject_type", "subject_id", "created_at");

COMMIT;
