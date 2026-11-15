-- CreateTable
CREATE TABLE "fin_invoices" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "number" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_invoice_items" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "fin_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_reservations" (
    "transactionId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,

    CONSTRAINT "fin_reservations_pkey" PRIMARY KEY ("transactionId")
);

-- CreateTable
CREATE TABLE "fin_receipts" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "receivedDate" DATE NOT NULL,
    "method" VARCHAR(80) NOT NULL,
    "reference" VARCHAR(160) NOT NULL,
    "note" VARCHAR(500) NOT NULL,
    "reversalOfId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_commands" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "branchId" INTEGER,
    "payload" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_commands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fin_invoices_number_key" ON "fin_invoices"("number");

-- CreateIndex
CREATE INDEX "fin_invoices_branchId_invoiceDate_status_idx" ON "fin_invoices"("branchId", "invoiceDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fin_invoice_items_invoiceId_transactionId_key" ON "fin_invoice_items"("invoiceId", "transactionId");

-- CreateIndex
CREATE INDEX "fin_reservations_invoiceId_idx" ON "fin_reservations"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "fin_receipts_reversalOfId_key" ON "fin_receipts"("reversalOfId");

-- CreateIndex
CREATE INDEX "fin_receipts_invoiceId_idx" ON "fin_receipts"("invoiceId");

-- CreateIndex
CREATE INDEX "fin_commands_branchId_createdAt_idx" ON "fin_commands"("branchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "fin_commands_actorId_key_key" ON "fin_commands"("actorId", "key");

-- AddForeignKey
ALTER TABLE "fin_invoices" ADD CONSTRAINT "fin_invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_invoices" ADD CONSTRAINT "fin_invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_invoice_items" ADD CONSTRAINT "fin_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fin_invoices"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_invoice_items" ADD CONSTRAINT "fin_invoice_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_reservations" ADD CONSTRAINT "fin_reservations_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_reservations" ADD CONSTRAINT "fin_reservations_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fin_invoices"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_receipts" ADD CONSTRAINT "fin_receipts_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fin_invoices"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_receipts" ADD CONSTRAINT "fin_receipts_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "fin_receipts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_commands" ADD CONSTRAINT "fin_commands_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_commands" ADD CONSTRAINT "fin_commands_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE fin_invoices ADD CONSTRAINT fin_invoice_valid CHECK
  (status IN ('DRAFT','ISSUED','VOID') AND currency = 'IDR' AND total > 0 AND "dueDate" >= "invoiceDate" AND revision > 0);
ALTER TABLE fin_invoice_items ADD CONSTRAINT fin_item_positive CHECK (amount > 0);
ALTER TABLE fin_receipts ADD CONSTRAINT fin_receipt_positive CHECK (amount > 0 AND "reversalOfId" IS DISTINCT FROM id);

CREATE FUNCTION fin_invoice_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'DRAFT' AND
    (NEW."branchId",NEW."customerId",NEW."invoiceDate",NEW."dueDate",NEW.total,NEW.number,NEW.snapshot,NEW.currency)
    IS DISTINCT FROM
    (OLD."branchId",OLD."customerId",OLD."invoiceDate",OLD."dueDate",OLD.total,OLD.number,OLD.snapshot,OLD.currency)
  THEN RAISE EXCEPTION 'Issued invoice snapshot is immutable'; END IF;
  IF OLD.status = 'VOID' OR (OLD.status = 'ISSUED' AND NEW.status NOT IN ('ISSUED','VOID'))
  THEN RAISE EXCEPTION 'Invalid invoice transition'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fin_invoice_immutable BEFORE UPDATE ON fin_invoices FOR EACH ROW EXECUTE FUNCTION fin_invoice_immutable();

CREATE FUNCTION fin_receipt_validate() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE original fin_receipts;
BEGIN
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'Receipt events are immutable'; END IF;
  IF NEW."reversalOfId" IS NOT NULL THEN
    SELECT * INTO original FROM fin_receipts WHERE id = NEW."reversalOfId" FOR UPDATE;
    IF NOT FOUND OR original."reversalOfId" IS NOT NULL OR original."invoiceId" <> NEW."invoiceId" OR original.amount <> NEW.amount
    THEN RAISE EXCEPTION 'Invalid receipt reversal'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fin_receipt_validate BEFORE INSERT OR UPDATE ON fin_receipts FOR EACH ROW EXECUTE FUNCTION fin_receipt_validate();

