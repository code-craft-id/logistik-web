-- Akunting following the sandbox (OBSERVED newapps 2026-11-24, user request):
-- Cost Centre, Kategori Assets, Assets, Rekonsiliasi Bank (bank statement
-- balances), and journal Cost Centre / customer / vendor plus line memo for
-- Kasir Penerimaan / Pembayaran and Bukti Jurnal Umum.
-- Additive only: new nullable columns and new tables; existing rows unchanged.
-- Rollback: drop the four tables and the five new columns.

-- AlterTable
ALTER TABLE "fin_journals" ADD COLUMN     "costCentreId" INTEGER,
ADD COLUMN     "customerId" INTEGER,
ADD COLUMN     "vendorId" INTEGER;

-- AlterTable
ALTER TABLE "fin_lines" ADD COLUMN     "memo" VARCHAR(500);

-- CreateTable
CREATE TABLE "fin_cost_centres" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "branchId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_cost_centres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_asset_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "accountId" INTEGER NOT NULL,
    "counterAccountId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_assets" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "branchId" INTEGER,
    "units" INTEGER NOT NULL DEFAULT 1,
    "acquiredOn" DATE NOT NULL,
    "cost" DECIMAL(15,2) NOT NULL,
    "groupLabel" VARCHAR(30),
    "additions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lifeMonths" INTEGER NOT NULL,
    "note" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_bank_statements" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "statementDate" DATE NOT NULL,
    "bankBalance" DECIMAL(15,2) NOT NULL,
    "note" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fin_cost_centres_code_key" ON "fin_cost_centres"("code");

-- CreateIndex
CREATE INDEX "fin_cost_centres_branchId_idx" ON "fin_cost_centres"("branchId");

-- CreateIndex
CREATE INDEX "fin_assets_categoryId_idx" ON "fin_assets"("categoryId");

-- CreateIndex
CREATE INDEX "fin_assets_branchId_idx" ON "fin_assets"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "fin_bank_statements_accountId_branchId_statementDate_key" ON "fin_bank_statements"("accountId", "branchId", "statementDate");

-- AddForeignKey
ALTER TABLE "fin_journals" ADD CONSTRAINT "fin_journals_costCentreId_fkey" FOREIGN KEY ("costCentreId") REFERENCES "fin_cost_centres"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_journals" ADD CONSTRAINT "fin_journals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_journals" ADD CONSTRAINT "fin_journals_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_cost_centres" ADD CONSTRAINT "fin_cost_centres_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_asset_categories" ADD CONSTRAINT "fin_asset_categories_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_asset_categories" ADD CONSTRAINT "fin_asset_categories_counterAccountId_fkey" FOREIGN KEY ("counterAccountId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_assets" ADD CONSTRAINT "fin_assets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "fin_asset_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_assets" ADD CONSTRAINT "fin_assets_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_bank_statements" ADD CONSTRAINT "fin_bank_statements_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_bank_statements" ADD CONSTRAINT "fin_bank_statements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE fin_assets ADD CONSTRAINT fin_asset_valid CHECK
  (cost >= 0 AND additions >= 0 AND reductions >= 0 AND units > 0 AND "lifeMonths" > 0);
