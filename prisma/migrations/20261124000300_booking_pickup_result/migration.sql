-- Courier pickup outcome on bookings (D-39, owner request 2026-11-24):
-- after PROGRESS PICKUP the courier records SUCCESS PICKUP (goods taken)
-- or MISS PICKUP (with a note). Feeds Harian Kurir Jumlah Terambil /
-- Jumlah Miss Pickup like the real web.
-- Additive nullable columns; existing rows keep NULL. No backfill.
-- Rollback: drop the three columns and the foreign key / index.

ALTER TABLE "bookings"
  ADD COLUMN "pickup_result_at" TIMESTAMP(3),
  ADD COLUMN "pickup_result_by_id" INTEGER,
  ADD COLUMN "pickup_note" VARCHAR(500);

CREATE INDEX "bookings_pickup_result_by_id_idx" ON "bookings"("pickup_result_by_id");

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_pickup_result_by_id_fkey" FOREIGN KEY ("pickup_result_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
