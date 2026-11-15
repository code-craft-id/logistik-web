-- Additive SUP-01 table; no existing-row backfill or lifecycle defaults.
CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "menu_name" VARCHAR(200) NOT NULL,
    "related_page_url" VARCHAR(2048) NOT NULL,
    "remarks" VARCHAR(5000),
    "priority" VARCHAR(10) NOT NULL,
    "idempotency_key" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tickets_priority_check" CHECK ("priority" IN ('Low', 'Normal', 'High')),
    CONSTRAINT "tickets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "tickets_created_by_id_idempotency_key_key" ON "tickets"("created_by_id", "idempotency_key");
CREATE INDEX "tickets_created_by_id_created_at_id_idx" ON "tickets"("created_by_id", "created_at" DESC, "id" DESC);
CREATE INDEX "tickets_created_at_id_idx" ON "tickets"("created_at" DESC, "id" DESC);
