BEGIN;
SET LOCAL lock_timeout = '5s';
-- AlterTable
ALTER TABLE "ledgers" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "account_categories" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "profit_loss_categories" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "cashflow_categories" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "account_branches" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "vendor_accounting" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "company_banks" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "company_invoices" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "company_digital_wallets" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "customer_whatsapp_notifications" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "provinces" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "regencies" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "districts" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "villages" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "postal_codes" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "couriers" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "transport_modes" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "service_categories" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "delivery_services" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "goods_types" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "cost_types" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "terms" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vehicle_types" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "trucking_types" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "shipment_statuses" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "vendor_tax_profiles" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "marketing_people" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- Unknown creation times use this migration timestamp, not invented historical dates.
-- Where created_at existed, initialize the new update timestamp from it.
UPDATE "ledgers" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "ledgers" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "account_categories" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "account_categories" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "profit_loss_categories" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "profit_loss_categories" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "cashflow_categories" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "cashflow_categories" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "account_branches" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "account_branches" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "vendor_accounting" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "vendor_accounting" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "customer_whatsapp_notifications" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "customer_whatsapp_notifications" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "provinces" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "provinces" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "regencies" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "regencies" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "districts" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "districts" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "villages" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "villages" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "postal_codes" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "postal_codes" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "drivers" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "drivers" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "couriers" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "couriers" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "transport_modes" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "transport_modes" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "service_categories" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "service_categories" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "delivery_services" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "delivery_services" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "goods_types" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "goods_types" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "cost_types" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "cost_types" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "terms" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "terms" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "vehicles" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "vehicles" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "vehicle_types" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "vehicle_types" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "trucking_types" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "trucking_types" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "shipment_statuses" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "shipment_statuses" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "vendor_tax_profiles" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "vendor_tax_profiles" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "marketing_people" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
ALTER TABLE "marketing_people" ALTER COLUMN "updated_at" SET NOT NULL;
COMMIT;
