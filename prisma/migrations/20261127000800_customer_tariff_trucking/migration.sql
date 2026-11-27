-- Trucking tariffs point to a trucking type instead of a delivery service.
ALTER TABLE "customer_tariffs" ALTER COLUMN "pricing" TYPE VARCHAR(8);
ALTER TABLE "customer_tariffs" ALTER COLUMN "delivery_service_id" DROP NOT NULL;
ALTER TABLE "customer_tariffs" ADD COLUMN "trucking_type_id" INTEGER;
ALTER TABLE "customer_tariffs" ADD CONSTRAINT "customer_tariffs_trucking_type_id_fkey" FOREIGN KEY ("trucking_type_id") REFERENCES "trucking_types"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "customer_tariffs" ADD CONSTRAINT "customer_tariffs_service_check" CHECK (
  ("pricing" = 'TRUCKING' AND "trucking_type_id" IS NOT NULL AND "delivery_service_id" IS NULL)
  OR ("pricing" IN ('KG', 'KOLI') AND "delivery_service_id" IS NOT NULL AND "trucking_type_id" IS NULL)
);
