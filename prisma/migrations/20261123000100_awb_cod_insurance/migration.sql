-- Entry AWB: Nilai Barang, Biaya Asuransi, Nilai COD, Biaya COD, PIC 1/2,
-- Lead Time and per-AWB "Show Price Print AWB" (provider OBSERVED, D-35).
-- Additive nullable columns: existing rows stay NULL, so their stored
-- Grand Total (biaya) is unchanged and printing follows the company setting.
-- Rollback: drop the eight columns (data entered after deploy is lost).

ALTER TABLE "transactions" ADD COLUMN     "cod_fee" DECIMAL(15,2),
ADD COLUMN     "cod_value" DECIMAL(15,2),
ADD COLUMN     "goods_value" DECIMAL(15,2),
ADD COLUMN     "insurance_fee" DECIMAL(15,2),
ADD COLUMN     "lead_time" VARCHAR(50),
ADD COLUMN     "pic1" VARCHAR(100),
ADD COLUMN     "pic2" VARCHAR(100),
ADD COLUMN     "show_price_on_print" BOOLEAN;
