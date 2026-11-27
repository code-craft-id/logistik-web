-- Modul workflows observed in the legacy app on 2026-11-19, built at the
-- owner's direction: Persetujuan Edit/Delete AWB, Cek Ongkir tariffs,
-- POD Kembali documents with approval, and the Pembayaran Hutang vendor
-- invoice register. Additive only: six new tables, no change to existing
-- rows. Rollback: forward-fix dropping the new tables (no data elsewhere
-- depends on them).

-- CreateTable
CREATE TABLE "awb_change_requests" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "kind" VARCHAR(10) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "changes" JSONB,
    "requested_by_id" INTEGER,
    "decided_by_id" INTEGER,
    "decided_at" TIMESTAMP(3),
    "decision_note" VARCHAR(500),
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "awb_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariffs" (
    "id" SERIAL NOT NULL,
    "delivery_service_id" INTEGER,
    "origin_branch_id" INTEGER NOT NULL,
    "destination_branch_id" INTEGER NOT NULL,
    "min_weight" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "price_per_kg" DECIMAL(15,2) NOT NULL,
    "eta" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pod_returns" (
    "id" SERIAL NOT NULL,
    "return_no" VARCHAR(50) NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origin_branch_id" INTEGER NOT NULL,
    "destination_branch_id" INTEGER NOT NULL,
    "driver_id" INTEGER,
    "notes" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_by_id" INTEGER,
    "decided_by_id" INTEGER,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pod_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pod_return_items" (
    "id" SERIAL NOT NULL,
    "pod_return_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pod_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bills" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "invoice_no" VARCHAR(50) NOT NULL,
    "bill_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_date" TIMESTAMP(3),
    "term_days" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "closed_at" TIMESTAMP(3),
    "closed_by_id" INTEGER,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vendor_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bill_items" (
    "id" SERIAL NOT NULL,
    "vendor_bill_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vendor_bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "awb_change_requests_transaction_id_idx" ON "awb_change_requests"("transaction_id");

-- CreateIndex
CREATE INDEX "awb_change_requests_status_idx" ON "awb_change_requests"("status");

-- CreateIndex
CREATE INDEX "awb_change_requests_created_at_idx" ON "awb_change_requests"("created_at");

-- CreateIndex
CREATE INDEX "tariffs_origin_branch_id_destination_branch_id_idx" ON "tariffs"("origin_branch_id", "destination_branch_id");

-- CreateIndex
CREATE INDEX "tariffs_delivery_service_id_idx" ON "tariffs"("delivery_service_id");

-- CreateIndex
CREATE UNIQUE INDEX "pod_returns_return_no_key" ON "pod_returns"("return_no");

-- CreateIndex
CREATE INDEX "pod_returns_origin_branch_id_idx" ON "pod_returns"("origin_branch_id");

-- CreateIndex
CREATE INDEX "pod_returns_destination_branch_id_idx" ON "pod_returns"("destination_branch_id");

-- CreateIndex
CREATE INDEX "pod_returns_status_idx" ON "pod_returns"("status");

-- CreateIndex
CREATE INDEX "pod_returns_return_date_idx" ON "pod_returns"("return_date");

-- CreateIndex
CREATE INDEX "pod_return_items_transaction_id_idx" ON "pod_return_items"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "pod_return_items_pod_return_id_transaction_id_key" ON "pod_return_items"("pod_return_id", "transaction_id");

-- CreateIndex
CREATE INDEX "vendor_bills_status_idx" ON "vendor_bills"("status");

-- CreateIndex
CREATE INDEX "vendor_bills_bill_date_idx" ON "vendor_bills"("bill_date");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bills_vendor_id_invoice_no_key" ON "vendor_bills"("vendor_id", "invoice_no");

-- CreateIndex
CREATE INDEX "vendor_bill_items_transaction_id_idx" ON "vendor_bill_items"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bill_items_vendor_bill_id_transaction_id_key" ON "vendor_bill_items"("vendor_bill_id", "transaction_id");

-- AddForeignKey
ALTER TABLE "awb_change_requests" ADD CONSTRAINT "awb_change_requests_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "awb_change_requests" ADD CONSTRAINT "awb_change_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "awb_change_requests" ADD CONSTRAINT "awb_change_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_delivery_service_id_fkey" FOREIGN KEY ("delivery_service_id") REFERENCES "delivery_services"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_origin_branch_id_fkey" FOREIGN KEY ("origin_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pod_returns" ADD CONSTRAINT "pod_returns_origin_branch_id_fkey" FOREIGN KEY ("origin_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pod_returns" ADD CONSTRAINT "pod_returns_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pod_returns" ADD CONSTRAINT "pod_returns_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pod_returns" ADD CONSTRAINT "pod_returns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pod_returns" ADD CONSTRAINT "pod_returns_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pod_return_items" ADD CONSTRAINT "pod_return_items_pod_return_id_fkey" FOREIGN KEY ("pod_return_id") REFERENCES "pod_returns"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pod_return_items" ADD CONSTRAINT "pod_return_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_bill_items" ADD CONSTRAINT "vendor_bill_items_vendor_bill_id_fkey" FOREIGN KEY ("vendor_bill_id") REFERENCES "vendor_bills"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_bill_items" ADD CONSTRAINT "vendor_bill_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Value guards (not modelled by Prisma)
ALTER TABLE "awb_change_requests" ADD CONSTRAINT "awb_change_requests_kind_check" CHECK ("kind" IN ('EDIT', 'DELETE'));
ALTER TABLE "awb_change_requests" ADD CONSTRAINT "awb_change_requests_status_check" CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED', 'USED'));
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_amounts_check" CHECK ("min_weight" >= 0 AND "price_per_kg" >= 0);
ALTER TABLE "pod_returns" ADD CONSTRAINT "pod_returns_status_check" CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED'));
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_status_check" CHECK ("status" IN ('OPEN', 'PAID'));
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_amounts_check" CHECK ("amount" >= 0 AND "term_days" >= 0);
