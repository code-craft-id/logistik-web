-- Cod List / Kas Terima (sandbox Modul > Layanan Pelanggan > Transaksi,
-- OBSERVED 2026-11-24): the branch records when COD cash for a delivered
-- AWB is handed in, by whom and with a payment note.
-- Additive nullable columns; existing rows keep NULL (not yet received).
-- No journal posting: COD accounting rules remain TBD.
-- Rollback: drop the foreign key, index and three columns.

ALTER TABLE "transactions"
  ADD COLUMN "cod_received_at" TIMESTAMP(3),
  ADD COLUMN "cod_received_by_id" INTEGER,
  ADD COLUMN "cod_received_note" VARCHAR(255);

CREATE INDEX "transactions_cod_received_by_id_idx" ON "transactions"("cod_received_by_id");

ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_cod_received_by_id_fkey" FOREIGN KEY ("cod_received_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
