-- Legacy Entry AWB capture fields on transactions and Manifest Vendor
-- attribution (OBSERVED 2026-11-18). Additive: nullable columns, indexes and
-- RESTRICT foreign keys to existing master tables. Existing rows stay NULL
-- (unknown); no backfill or default. Rollback: forward-fix dropping columns.

-- AlterTable
ALTER TABLE "manifests" ADD COLUMN     "vendor_id" INTEGER;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "cost_type_id" INTEGER,
ADD COLUMN     "customer_id" INTEGER,
ADD COLUMN     "delivery_service_id" INTEGER,
ADD COLUMN     "description" VARCHAR(500),
ADD COLUMN     "goods_type_id" INTEGER,
ADD COLUMN     "remarks" VARCHAR(500),
ADD COLUMN     "transport_mode_id" INTEGER;

-- CreateIndex
CREATE INDEX "manifests_vendor_id_idx" ON "manifests"("vendor_id");

-- CreateIndex
CREATE INDEX "transactions_customer_id_idx" ON "transactions"("customer_id");

-- CreateIndex
CREATE INDEX "transactions_transport_mode_id_idx" ON "transactions"("transport_mode_id");

-- CreateIndex
CREATE INDEX "transactions_delivery_service_id_idx" ON "transactions"("delivery_service_id");

-- CreateIndex
CREATE INDEX "transactions_goods_type_id_idx" ON "transactions"("goods_type_id");

-- CreateIndex
CREATE INDEX "transactions_cost_type_id_idx" ON "transactions"("cost_type_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transport_mode_id_fkey" FOREIGN KEY ("transport_mode_id") REFERENCES "transport_modes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_delivery_service_id_fkey" FOREIGN KEY ("delivery_service_id") REFERENCES "delivery_services"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goods_type_id_fkey" FOREIGN KEY ("goods_type_id") REFERENCES "goods_types"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "cost_types"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

