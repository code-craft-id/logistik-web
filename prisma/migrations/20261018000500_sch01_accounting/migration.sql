-- CreateTable
CREATE TABLE "ledgers" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "account_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profit_loss_categories" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "profit_loss_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashflow_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "cashflow_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_branches" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "account_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" BIGSERIAL NOT NULL,
    "account_code" VARCHAR(20) NOT NULL,
    "initials" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parent_id" BIGINT,
    "ledger_id" BIGINT NOT NULL,
    "account_category_id" BIGINT NOT NULL,
    "position" VARCHAR(20) NOT NULL,
    "normal_balance" VARCHAR(10) NOT NULL,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'Show',
    "category_kind" VARCHAR(20) NOT NULL,
    "profit_loss_category_id" BIGINT,
    "cashflow_category_id" BIGINT,
    "accounting_branch_id" BIGINT,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_accounting" (
    "id" BIGSERIAL NOT NULL,
    "vendor_id" BIGINT NOT NULL,
    "debit_account_id" BIGINT NOT NULL,
    "credit_payable_account_id" BIGINT NOT NULL,
    "credit_revenue_account_id" BIGINT NOT NULL,
    "revenue_share_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "commission_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "vendor_accounting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_banks" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_invoices" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "invoice_format" TEXT,
    "signatory_name" TEXT,
    "signatory_position" TEXT,
    "invoice_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_digital_wallets" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "provider" TEXT,
    "account_name" TEXT,
    "account_number" TEXT,
    "verification_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_digital_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ledgers_code_key" ON "ledgers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "account_branches_code_key" ON "account_branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_code_key" ON "accounts"("account_code");

-- CreateIndex
CREATE INDEX "accounts_parent_id_idx" ON "accounts"("parent_id");

-- CreateIndex
CREATE INDEX "accounts_ledger_id_idx" ON "accounts"("ledger_id");

-- CreateIndex
CREATE INDEX "accounts_account_category_id_idx" ON "accounts"("account_category_id");

-- CreateIndex
CREATE INDEX "accounts_profit_loss_category_id_idx" ON "accounts"("profit_loss_category_id");

-- CreateIndex
CREATE INDEX "accounts_cashflow_category_id_idx" ON "accounts"("cashflow_category_id");

-- CreateIndex
CREATE INDEX "accounts_accounting_branch_id_idx" ON "accounts"("accounting_branch_id");

-- CreateIndex
CREATE INDEX "accounts_status_idx" ON "accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_accounting_vendor_id_key" ON "vendor_accounting"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_accounting_debit_account_id_idx" ON "vendor_accounting"("debit_account_id");

-- CreateIndex
CREATE INDEX "vendor_accounting_credit_payable_account_id_idx" ON "vendor_accounting"("credit_payable_account_id");

-- CreateIndex
CREATE INDEX "vendor_accounting_credit_revenue_account_id_idx" ON "vendor_accounting"("credit_revenue_account_id");

-- CreateIndex
CREATE INDEX "company_banks_company_id_idx" ON "company_banks"("company_id");

-- CreateIndex
CREATE INDEX "company_invoices_company_id_idx" ON "company_invoices"("company_id");

-- CreateIndex
CREATE INDEX "company_digital_wallets_company_id_idx" ON "company_digital_wallets"("company_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "ledgers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_account_category_id_fkey" FOREIGN KEY ("account_category_id") REFERENCES "account_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_profit_loss_category_id_fkey" FOREIGN KEY ("profit_loss_category_id") REFERENCES "profit_loss_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_cashflow_category_id_fkey" FOREIGN KEY ("cashflow_category_id") REFERENCES "cashflow_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_accounting_branch_id_fkey" FOREIGN KEY ("accounting_branch_id") REFERENCES "account_branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_accounting" ADD CONSTRAINT "vendor_accounting_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_accounting" ADD CONSTRAINT "vendor_accounting_debit_account_id_fkey" FOREIGN KEY ("debit_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_accounting" ADD CONSTRAINT "vendor_accounting_credit_payable_account_id_fkey" FOREIGN KEY ("credit_payable_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_accounting" ADD CONSTRAINT "vendor_accounting_credit_revenue_account_id_fkey" FOREIGN KEY ("credit_revenue_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "company_banks" ADD CONSTRAINT "company_banks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "company_invoices" ADD CONSTRAINT "company_invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "company_digital_wallets" ADD CONSTRAINT "company_digital_wallets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
