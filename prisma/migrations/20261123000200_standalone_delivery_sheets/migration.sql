-- Standalone DRS (Kurir Kota, D-35): a delivery sheet may exist without a
-- manifest and records its branch, courier, driver, vehicle, agent, remarks,
-- creator and soft deletion. manifest_id stays UNIQUE (one DRS per manifest);
-- PostgreSQL allows many NULLs. Existing DRS rows are backfilled with their
-- manifest's branch; all other new columns stay NULL.
-- Rollback: only safe while no standalone DRS exists (manifest_id IS NULL);
-- otherwise forward-fix.

ALTER TABLE "delivery_sheets" ADD COLUMN     "agent_id" INTEGER,
ADD COLUMN     "branch_id" INTEGER,
ADD COLUMN     "courier_id" INTEGER,
ADD COLUMN     "created_by_id" INTEGER,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "driver_id" INTEGER,
ADD COLUMN     "remarks" VARCHAR(500),
ADD COLUMN     "vehicle_id" INTEGER,
ALTER COLUMN "manifest_id" DROP NOT NULL;

UPDATE "delivery_sheets" AS sheet
SET "branch_id" = manifest."branch_id"
FROM "manifests" AS manifest
WHERE manifest."id" = sheet."manifest_id";

CREATE INDEX "delivery_sheets_branch_id_idx" ON "delivery_sheets"("branch_id");
CREATE INDEX "delivery_sheets_courier_id_idx" ON "delivery_sheets"("courier_id");

ALTER TABLE "delivery_sheets" ADD CONSTRAINT "delivery_sheets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "delivery_sheets" ADD CONSTRAINT "delivery_sheets_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "delivery_sheets" ADD CONSTRAINT "delivery_sheets_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "delivery_sheets" ADD CONSTRAINT "delivery_sheets_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "delivery_sheets" ADD CONSTRAINT "delivery_sheets_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "delivery_sheets" ADD CONSTRAINT "delivery_sheets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
