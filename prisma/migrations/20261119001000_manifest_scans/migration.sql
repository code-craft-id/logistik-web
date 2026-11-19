-- Koli scans at transit / destination branches (provider Cek Transit and
-- Cek Inbound detail, OBSERVED 2026-11-19), owner-approved (D-05), Dev 2
-- review pending. New table only; existing rows unaffected. A koli is
-- scanned once per manifest and kind (unique index). Rollback: forward-fix
-- (drop the table).

-- CreateTable
CREATE TABLE "manifest_scans" (
    "id" SERIAL NOT NULL,
    "manifest_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "piece" INTEGER NOT NULL,
    "kind" VARCHAR(10) NOT NULL,
    "branch_id" INTEGER,
    "scanned_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manifest_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manifest_scans_transaction_id_kind_idx" ON "manifest_scans"("transaction_id", "kind");

-- CreateIndex
CREATE INDEX "manifest_scans_manifest_id_kind_idx" ON "manifest_scans"("manifest_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "manifest_scans_manifest_id_transaction_id_piece_kind_key" ON "manifest_scans"("manifest_id", "transaction_id", "piece", "kind");

-- AddForeignKey
ALTER TABLE "manifest_scans" ADD CONSTRAINT "manifest_scans_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "manifests"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifest_scans" ADD CONSTRAINT "manifest_scans_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifest_scans" ADD CONSTRAINT "manifest_scans_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifest_scans" ADD CONSTRAINT "manifest_scans_scanned_by_id_fkey" FOREIGN KEY ("scanned_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
