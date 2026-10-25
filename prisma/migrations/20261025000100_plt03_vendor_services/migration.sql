-- Additive Dev 1 reference master, approved by coordinator 2026-10-25.
-- Existing vendor rows unchanged; no backfill/default service is inferred.
-- Forward fix: retain history and soft-delete unwanted services.
BEGIN;
CREATE TABLE "vendor_services" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "vendor_id" INTEGER NOT NULL,
  "status" "record_status" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "vendor_services_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vendor_services_vendor_id_idx" ON "vendor_services"("vendor_id");
CREATE INDEX "vendor_services_status_idx" ON "vendor_services"("status");
ALTER TABLE "vendor_services" ADD CONSTRAINT "vendor_services_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;
