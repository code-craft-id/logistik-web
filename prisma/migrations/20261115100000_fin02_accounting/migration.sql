-- Activation refuses preexisting FIN-01 financial events rather than silently
-- omitting them. An approved source-event catch-up is required before retry.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM fin_invoices WHERE number IS NOT NULL) OR EXISTS (SELECT 1 FROM fin_receipts)
 THEN RAISE EXCEPTION 'FIN-02 activation refused: existing FIN-01 history needs reviewed catch-up'; END IF;
END $$;

-- CreateTable
CREATE TABLE "fin_categories" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "kind" VARCHAR(10) NOT NULL,
    "flowClass" VARCHAR(12),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_accounts" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "kind" VARCHAR(10) NOT NULL,
    "normalBalance" VARCHAR(6) NOT NULL,
    "isCash" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_mappings" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "receivableId" INTEGER NOT NULL,
    "revenueId" INTEGER NOT NULL,
    "costId" INTEGER NOT NULL,
    "liabilityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_journals" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "accountingDate" DATE NOT NULL,
    "status" VARCHAR(6) NOT NULL DEFAULT 'DRAFT',
    "reference" VARCHAR(160) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "sourceType" VARCHAR(30) NOT NULL,
    "sourceId" INTEGER,
    "sourceKey" VARCHAR(100),
    "reversalOfId" INTEGER,
    "mappingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_lines" (
    "id" SERIAL NOT NULL,
    "journalId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transactionId" INTEGER,
    "cashflowCategoryId" INTEGER,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "fin_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_cost_states" (
    "transactionId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "evidence" VARCHAR(500) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_cost_states_pkey" PRIMARY KEY ("transactionId")
);

-- CreateTable
CREATE TABLE "fin_costs" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "accountingDate" DATE NOT NULL,
    "supplierReference" VARCHAR(160) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "reversalOfId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_closed_periods" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_closed_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fin_categories_code_key" ON "fin_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "fin_accounts_code_key" ON "fin_accounts"("code");

-- CreateIndex
CREATE INDEX "fin_accounts_kind_active_idx" ON "fin_accounts"("kind", "active");

-- CreateIndex
CREATE INDEX "fin_mappings_branchId_id_idx" ON "fin_mappings"("branchId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "fin_journals_sourceKey_key" ON "fin_journals"("sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "fin_journals_reversalOfId_key" ON "fin_journals"("reversalOfId");

-- CreateIndex
CREATE INDEX "fin_journals_branchId_accountingDate_status_idx" ON "fin_journals"("branchId", "accountingDate", "status");

-- CreateIndex
CREATE INDEX "fin_lines_accountId_idx" ON "fin_lines"("accountId");

-- CreateIndex
CREATE INDEX "fin_lines_transactionId_idx" ON "fin_lines"("transactionId");

-- CreateIndex
CREATE INDEX "fin_cost_states_branchId_finalized_idx" ON "fin_cost_states"("branchId", "finalized");

-- CreateIndex
CREATE UNIQUE INDEX "fin_costs_reversalOfId_key" ON "fin_costs"("reversalOfId");

-- CreateIndex
CREATE INDEX "fin_costs_transactionId_accountingDate_idx" ON "fin_costs"("transactionId", "accountingDate");

-- CreateIndex
CREATE UNIQUE INDEX "fin_closed_periods_branchId_month_key" ON "fin_closed_periods"("branchId", "month");

-- AddForeignKey
ALTER TABLE "fin_accounts" ADD CONSTRAINT "fin_accounts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "fin_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_mappings" ADD CONSTRAINT "fin_mappings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_mappings" ADD CONSTRAINT "fin_mappings_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_mappings" ADD CONSTRAINT "fin_mappings_revenueId_fkey" FOREIGN KEY ("revenueId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_mappings" ADD CONSTRAINT "fin_mappings_costId_fkey" FOREIGN KEY ("costId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_mappings" ADD CONSTRAINT "fin_mappings_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_journals" ADD CONSTRAINT "fin_journals_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_journals" ADD CONSTRAINT "fin_journals_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "fin_journals"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_journals" ADD CONSTRAINT "fin_journals_mappingId_fkey" FOREIGN KEY ("mappingId") REFERENCES "fin_mappings"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_lines" ADD CONSTRAINT "fin_lines_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "fin_journals"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_lines" ADD CONSTRAINT "fin_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "fin_accounts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_lines" ADD CONSTRAINT "fin_lines_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_lines" ADD CONSTRAINT "fin_lines_cashflowCategoryId_fkey" FOREIGN KEY ("cashflowCategoryId") REFERENCES "fin_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_cost_states" ADD CONSTRAINT "fin_cost_states_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_cost_states" ADD CONSTRAINT "fin_cost_states_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_costs" ADD CONSTRAINT "fin_costs_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "fin_cost_states"("transactionId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_costs" ADD CONSTRAINT "fin_costs_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "fin_costs"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_closed_periods" ADD CONSTRAINT "fin_closed_periods_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE fin_categories ADD CONSTRAINT fin_category_valid CHECK
 ((kind = 'ACCOUNT' AND "flowClass" IS NULL) OR (kind = 'CASHFLOW' AND "flowClass" IN ('OPERATING','INVESTING','FINANCING')));
ALTER TABLE fin_accounts ADD CONSTRAINT fin_account_valid CHECK
 (kind IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE') AND
  "normalBalance" = CASE WHEN kind IN ('ASSET','EXPENSE') THEN 'DEBIT' ELSE 'CREDIT' END AND (NOT "isCash" OR kind = 'ASSET'));
ALTER TABLE fin_journals ADD CONSTRAINT fin_journal_status CHECK (status IN ('DRAFT','POSTED') AND "reversalOfId" IS DISTINCT FROM id);
ALTER TABLE fin_lines ADD CONSTRAINT fin_line_one_side CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0));
ALTER TABLE fin_costs ADD CONSTRAINT fin_cost_positive CHECK (amount > 0 AND "reversalOfId" IS DISTINCT FROM id);
ALTER TABLE fin_closed_periods ADD CONSTRAINT fin_period_month CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

CREATE FUNCTION fin_posted_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME = 'fin_journals' AND OLD.status = 'POSTED' THEN RAISE EXCEPTION 'Posted journal is immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER fin_posted_immutable BEFORE UPDATE ON fin_journals FOR EACH ROW EXECUTE FUNCTION fin_posted_immutable();

CREATE FUNCTION fin_line_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM fin_journals WHERE id = OLD."journalId" AND status = 'POSTED')
 THEN RAISE EXCEPTION 'Posted journal line is immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER fin_line_immutable BEFORE UPDATE ON fin_lines FOR EACH ROW EXECUTE FUNCTION fin_line_immutable();

CREATE FUNCTION fin_journal_balance() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE jid integer; j fin_journals; n integer; d numeric; c numeric;
BEGIN
 IF TG_TABLE_NAME = 'fin_lines' THEN jid := COALESCE(NEW."journalId",OLD."journalId"); ELSE jid := COALESCE(NEW.id,OLD.id); END IF;
 SELECT * INTO j FROM fin_journals WHERE id = jid;
 IF NOT FOUND OR j.status <> 'POSTED' THEN RETURN NULL; END IF;
 SELECT count(*),sum(debit),sum(credit) INTO n,d,c FROM fin_lines WHERE "journalId" = jid;
 IF n < 2 OR d IS NULL OR d <= 0 OR d <> c THEN RAISE EXCEPTION 'Posted journal must balance'; END IF;
 IF j."reversalOfId" IS NOT NULL THEN
   IF NOT EXISTS (SELECT 1 FROM fin_journals o WHERE o.id = j."reversalOfId" AND o.status = 'POSTED' AND o."reversalOfId" IS NULL AND o."branchId" = j."branchId")
   THEN RAISE EXCEPTION 'Invalid original journal'; END IF;
   IF EXISTS (
     (SELECT "accountId",debit,credit,"transactionId","cashflowCategoryId",snapshot FROM fin_lines WHERE "journalId" = jid
      EXCEPT ALL SELECT "accountId",credit,debit,"transactionId","cashflowCategoryId",snapshot FROM fin_lines WHERE "journalId" = j."reversalOfId")
     UNION ALL
     (SELECT "accountId",credit,debit,"transactionId","cashflowCategoryId",snapshot FROM fin_lines WHERE "journalId" = j."reversalOfId"
      EXCEPT ALL SELECT "accountId",debit,credit,"transactionId","cashflowCategoryId",snapshot FROM fin_lines WHERE "journalId" = jid)
   ) THEN RAISE EXCEPTION 'Reversal must compensate original lines'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER fin_journal_balance AFTER INSERT OR UPDATE ON fin_journals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fin_journal_balance();
CREATE CONSTRAINT TRIGGER fin_line_balance AFTER INSERT OR UPDATE OR DELETE ON fin_lines DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fin_journal_balance();

CREATE FUNCTION fin_journal_period() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM fin_closed_periods WHERE "branchId" = NEW."branchId" AND month >= to_char(NEW."accountingDate",'YYYY-MM'))
 THEN RAISE EXCEPTION 'Accounting period is closed'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER fin_journal_period BEFORE INSERT OR UPDATE ON fin_journals FOR EACH ROW EXECUTE FUNCTION fin_journal_period();
