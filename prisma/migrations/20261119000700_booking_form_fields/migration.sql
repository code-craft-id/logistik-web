-- Booking form fields as in the provider's Tambah Booking (OBSERVED
-- 2026-11-19): route, sender/receiver contact, service, moda, payment,
-- goods and the price inputs. All columns nullable; existing rows keep
-- their free-text destination. Rollback: forward-fix (drop columns).


-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "chargeable_weight" DECIMAL(10,2),
ADD COLUMN     "consignee_id" INTEGER,
ADD COLUMN     "cost_type_id" INTEGER,
ADD COLUMN     "delivery_service_id" INTEGER,
ADD COLUMN     "description" VARCHAR(500),
ADD COLUMN     "destination_branch_id" INTEGER,
ADD COLUMN     "goods_type_id" INTEGER,
ADD COLUMN     "min_weight" DECIMAL(10,2),
ADD COLUMN     "price_per_kg" DECIMAL(15,2),
ADD COLUMN     "receiver_address" VARCHAR(500),
ADD COLUMN     "receiver_phone" VARCHAR(30),
ADD COLUMN     "remarks" VARCHAR(500),
ADD COLUMN     "sender_address" VARCHAR(500),
ADD COLUMN     "sender_phone" VARCHAR(30),
ADD COLUMN     "total_cost" DECIMAL(15,2),
ADD COLUMN     "transport_mode_id" INTEGER;

-- CreateIndex
CREATE INDEX "bookings_destination_branch_id_idx" ON "bookings"("destination_branch_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_consignee_id_fkey" FOREIGN KEY ("consignee_id") REFERENCES "consignees"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_delivery_service_id_fkey" FOREIGN KEY ("delivery_service_id") REFERENCES "delivery_services"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_goods_type_id_fkey" FOREIGN KEY ("goods_type_id") REFERENCES "goods_types"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_transport_mode_id_fkey" FOREIGN KEY ("transport_mode_id") REFERENCES "transport_modes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "cost_types"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

