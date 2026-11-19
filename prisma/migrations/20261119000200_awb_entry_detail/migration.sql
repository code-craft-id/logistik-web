-- Legacy Entry AWB detail fields (OBSERVED on-site-add/tambah, 2026-11-19):
-- Pricing Type, Pickup By, Marketing, sender/receiver address and phone, Penerima,
-- Terberat, Harga/Kg, Min KG, Asuransi, Biaya Lain/Packing/Pickup, Total
-- Biaya, Discount(%) and PPN(%). Additive: nullable columns with RESTRICT
-- foreign keys; existing rows stay NULL. Rollback: forward-fix dropping them.

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "chargeable_weight" DECIMAL(10,2),
ADD COLUMN     "consignee_id" INTEGER,
ADD COLUMN     "discount_percent" DECIMAL(5,2),
ADD COLUMN     "insured" BOOLEAN,
ADD COLUMN     "marketing_person_id" INTEGER,
ADD COLUMN     "min_weight" DECIMAL(10,2),
ADD COLUMN     "other_fee" DECIMAL(15,2),
ADD COLUMN     "packing_fee" DECIMAL(15,2),
ADD COLUMN     "pickup_courier_id" INTEGER,
ADD COLUMN     "pickup_fee" DECIMAL(15,2),
ADD COLUMN     "ppn_percent" DECIMAL(5,2),
ADD COLUMN     "price_per_kg" DECIMAL(15,2),
ADD COLUMN     "receiver_address" VARCHAR(500),
ADD COLUMN     "receiver_phone" VARCHAR(30),
ADD COLUMN     "sender_address" VARCHAR(500),
ADD COLUMN     "sender_phone" VARCHAR(30),
ADD COLUMN     "total_cost" DECIMAL(15,2);

-- CreateIndex
CREATE INDEX "transactions_pickup_courier_id_idx" ON "transactions"("pickup_courier_id");

-- CreateIndex
CREATE INDEX "transactions_marketing_person_id_idx" ON "transactions"("marketing_person_id");

-- CreateIndex
CREATE INDEX "transactions_consignee_id_idx" ON "transactions"("consignee_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pickup_courier_id_fkey" FOREIGN KEY ("pickup_courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_marketing_person_id_fkey" FOREIGN KEY ("marketing_person_id") REFERENCES "marketing_people"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_consignee_id_fkey" FOREIGN KEY ("consignee_id") REFERENCES "consignees"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "pricing_type" VARCHAR(10);

-- Value guards (not modelled by Prisma)
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pricing_type_check" CHECK ("pricing_type" IS NULL OR "pricing_type" IN ('KG', 'KOLI', 'TRUCKING'));
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_entry_amounts_check" CHECK (
  COALESCE("chargeable_weight", 0) >= 0 AND COALESCE("price_per_kg", 0) >= 0 AND
  COALESCE("min_weight", 0) >= 0 AND COALESCE("other_fee", 0) >= 0 AND
  COALESCE("packing_fee", 0) >= 0 AND COALESCE("pickup_fee", 0) >= 0 AND
  COALESCE("total_cost", 0) >= 0 AND
  COALESCE("discount_percent", 0) BETWEEN 0 AND 100 AND
  COALESCE("ppn_percent", 0) BETWEEN 0 AND 100);
