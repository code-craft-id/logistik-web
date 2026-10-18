BEGIN;
SET LOCAL lock_timeout = '5s';
-- CreateTable
CREATE TABLE "customer_accounting" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "debit_account_id" INTEGER,
    "credit_payable_account_id" INTEGER,
    "credit_revenue_account_id" INTEGER,
    "revenue_share_percent" DECIMAL(5,2),
    "commission_percent" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_accounting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_accounting_customer_id_key" ON "customer_accounting"("customer_id");

-- CreateIndex
CREATE INDEX "customer_accounting_debit_account_id_idx" ON "customer_accounting"("debit_account_id");

-- CreateIndex
CREATE INDEX "customer_accounting_credit_payable_account_id_idx" ON "customer_accounting"("credit_payable_account_id");

-- CreateIndex
CREATE INDEX "customer_accounting_credit_revenue_account_id_idx" ON "customer_accounting"("credit_revenue_account_id");

-- AddForeignKey
ALTER TABLE "customer_accounting" ADD CONSTRAINT "customer_accounting_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customer_accounting" ADD CONSTRAINT "customer_accounting_debit_account_id_fkey" FOREIGN KEY ("debit_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customer_accounting" ADD CONSTRAINT "customer_accounting_credit_payable_account_id_fkey" FOREIGN KEY ("credit_payable_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customer_accounting" ADD CONSTRAINT "customer_accounting_credit_revenue_account_id_fkey" FOREIGN KEY ("credit_revenue_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


COMMIT;
