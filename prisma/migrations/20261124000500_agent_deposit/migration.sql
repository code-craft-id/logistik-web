-- Agent deposit and commission (D-41, sandbox Transaksi Agent / Laporan
-- Agen): an AWB entered for an agent deducts Grand Total minus commission
-- from agents.balance; a voided AWB refunds it; admins top up. Every change
-- is a row in agent_deposit_movements (History Deposit Agent).
-- Additive: new nullable transactions.agent_id and a new table. Existing
-- agents keep their balance (no opening movement is backfilled).
-- Rollback: drop agent_deposit_movements and transactions.agent_id.

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "agent_id" INTEGER;

-- CreateTable
CREATE TABLE "agent_deposit_movements" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "kind" VARCHAR(10) NOT NULL,
    "transaction_id" INTEGER,
    "balance_before" DECIMAL(19,2) NOT NULL,
    "amount" DECIMAL(19,2) NOT NULL,
    "commission" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "balance_after" DECIMAL(19,2) NOT NULL,
    "note" VARCHAR(255),
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_deposit_movements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agent_deposit_movements_kind_check" CHECK ("kind" IN ('TOPUP', 'AWB', 'VOID'))
);

-- CreateIndex
CREATE INDEX "agent_deposit_movements_agent_id_created_at_idx" ON "agent_deposit_movements"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_deposit_movements_created_by_id_idx" ON "agent_deposit_movements"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_deposit_movements_transaction_id_kind_key" ON "agent_deposit_movements"("transaction_id", "kind");

-- CreateIndex
CREATE INDEX "transactions_agent_id_idx" ON "transactions"("agent_id");

-- AddForeignKey
ALTER TABLE "agent_deposit_movements" ADD CONSTRAINT "agent_deposit_movements_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "agent_deposit_movements" ADD CONSTRAINT "agent_deposit_movements_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "agent_deposit_movements" ADD CONSTRAINT "agent_deposit_movements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


