-- Six nullable contact/reference fields approved by the stakeholder on 2026-10-25.
-- Existing rows stay NULL. No backfill, index, FK or financial behavior changes.
-- Forward fixes use a new migration; dropping these columns would discard new data.
BEGIN;
ALTER TABLE "branches"
  ADD COLUMN "postal_code" TEXT,
  ADD COLUMN "fax_number" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "finance_contact_name" TEXT,
  ADD COLUMN "marketing_contact_name" TEXT,
  ADD COLUMN "tax_id" TEXT;
COMMIT;
