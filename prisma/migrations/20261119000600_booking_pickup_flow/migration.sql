-- Booking pickup lifecycle as in the provider app (OBSERVED 2026-11-19):
-- WAITING TO PICKUP -> courier assigned -> PROGRESS PICKUP (courier scans the
-- booking), or CANCEL PICKUP. Bookings stay separate from AWBs.
-- Existing rows: status 'Open' (the previous default, never shown as a
-- workflow) becomes 'WAITING TO PICKUP'; other values are left as they are.
-- New columns are nullable. Rollback: forward-fix (drop columns, restore
-- the 'Open' default and value).

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "assigned_at" TIMESTAMP(3),
ADD COLUMN     "assigned_by_id" INTEGER,
ADD COLUMN     "cancel_reason" VARCHAR(500),
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by_id" INTEGER,
ADD COLUMN     "courier_id" INTEGER,
ADD COLUMN     "picked_up_at" TIMESTAMP(3),
ADD COLUMN     "picked_up_by_id" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'WAITING TO PICKUP';

-- Data: previous default
UPDATE "bookings" SET "status" = 'WAITING TO PICKUP' WHERE "status" = 'Open';

-- CreateIndex
CREATE INDEX "bookings_courier_id_idx" ON "bookings"("courier_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_picked_up_by_id_fkey" FOREIGN KEY ("picked_up_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
