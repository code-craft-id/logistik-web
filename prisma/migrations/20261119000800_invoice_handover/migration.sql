-- Serah terima faktur (owner decision 2026-11-19): date and receiver of the
-- invoice at the customer, shown in Report AR (TANGGAL TERIMA FAKTUR, NAMA
-- PENERIMA FAKTUR). Nullable; existing invoices stay empty.
-- Rollback: forward-fix (drop the two columns).

-- AlterTable
ALTER TABLE "fin_invoices" ADD COLUMN     "handoverDate" DATE,
ADD COLUMN     "handoverTo" VARCHAR(150);
