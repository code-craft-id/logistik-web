-- Proof-of-delivery photo on delivery sheet items (owner request 2026-11-19):
-- the image is converted to WebP and stored on Cloudinary; only its secure
-- URL, public id and upload time are kept. Additive nullable columns;
-- existing rows stay NULL. Rollback: forward-fix dropping the columns.

-- AlterTable
ALTER TABLE "delivery_sheet_items" ADD COLUMN "pod_photo_at" TIMESTAMP(3),
ADD COLUMN "pod_photo_public_id" VARCHAR(255),
ADD COLUMN "pod_photo_url" VARCHAR(500);
