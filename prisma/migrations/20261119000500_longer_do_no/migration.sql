-- DO / Reff may hold several delivery order numbers (OBSERVED in the
-- provider's AWB list: four ID-DO-… numbers, about 80 characters).
-- Widening only; existing values are unchanged. Rollback: forward-fix.

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "do_no" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "do_no" SET DATA TYPE VARCHAR(255);
