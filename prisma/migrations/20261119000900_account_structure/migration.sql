-- Perkiraan structure (provider hidden Edit Perkiraan form, OBSERVED
-- 2026-11-19), simplified by owner decision: Induk (parentId) instead of
-- Ledger + Parent/Child; Posisi and Operator Rugi Laba follow the account
-- kind. Adds initial, visible (Tampil), Kategori Rugi Laba and cost centre
-- branch (null = Nasional). Existing accounts: no parent, visible, no
-- category, Nasional. Rollback: forward-fix (drop columns and table).

-- AlterTable
ALTER TABLE "fin_accounts" ADD COLUMN     "branchId" INTEGER,
ADD COLUMN     "initial" VARCHAR(20),
ADD COLUMN     "parentId" INTEGER,
ADD COLUMN     "plCategoryId" INTEGER,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "fin_pl_categories" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fin_pl_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fin_pl_categories_code_key" ON "fin_pl_categories"("code");

-- CreateIndex
CREATE INDEX "fin_accounts_parentId_idx" ON "fin_accounts"("parentId");

-- CreateIndex
CREATE INDEX "fin_accounts_plCategoryId_idx" ON "fin_accounts"("plCategoryId");

-- AddForeignKey
ALTER TABLE "fin_accounts" ADD CONSTRAINT "fin_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_accounts" ADD CONSTRAINT "fin_accounts_plCategoryId_fkey" FOREIGN KEY ("plCategoryId") REFERENCES "fin_pl_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_accounts" ADD CONSTRAINT "fin_accounts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
