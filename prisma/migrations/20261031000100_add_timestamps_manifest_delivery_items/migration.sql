-- Add SCH-01 timestamps/deletion for manifest/delivery items
ALTER TABLE "manifest_items" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "manifest_items" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "manifest_items" ADD COLUMN "deleted_at" TIMESTAMP(3);

ALTER TABLE "delivery_sheet_items" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "delivery_sheet_items" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "delivery_sheet_items" ADD COLUMN "deleted_at" TIMESTAMP(3);
