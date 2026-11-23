-- Proses Vendor (D-35): AWB forwarded to a vendor with the vendor's AWB
-- number and remarks. New table only; no existing rows change.
-- One active row per AWB is checked transactionally in the service.
-- Rollback: drop table "vendor_processes".

CREATE TABLE "vendor_processes" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "vendor_awb_no" VARCHAR(100),
    "process_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" VARCHAR(500),
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vendor_processes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vendor_processes_transaction_id_idx" ON "vendor_processes"("transaction_id");
CREATE INDEX "vendor_processes_vendor_id_idx" ON "vendor_processes"("vendor_id");
CREATE INDEX "vendor_processes_branch_id_idx" ON "vendor_processes"("branch_id");
CREATE INDEX "vendor_processes_process_date_idx" ON "vendor_processes"("process_date");

ALTER TABLE "vendor_processes" ADD CONSTRAINT "vendor_processes_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "vendor_processes" ADD CONSTRAINT "vendor_processes_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "vendor_processes" ADD CONSTRAINT "vendor_processes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "vendor_processes" ADD CONSTRAINT "vendor_processes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
