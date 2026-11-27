-- Share Truck (D-43, sandbox menu OBSERVED 2026-11-24): Ready Truck
-- (vehicle_shares), charter orders in/out with trip status history, and
-- charter invoices (Invoice Keluar / Masuk) without journal postings.
-- New tables only; existing rows are untouched.
-- Rollback: drop charter_invoices, charter_status_logs, charter_orders,
-- vehicle_shares.

-- CreateTable
CREATE TABLE "vehicle_shares" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "origin" VARCHAR(100) NOT NULL,
    "destination" VARCHAR(100) NOT NULL,
    "lead_time_days" INTEGER NOT NULL,
    "available_from" DATE NOT NULL,
    "available_to" DATE NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charter_orders" (
    "id" SERIAL NOT NULL,
    "direction" VARCHAR(3) NOT NULL,
    "order_no" VARCHAR(30) NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "load_date" DATE NOT NULL,
    "vehicle_id" INTEGER,
    "plate_number" VARCHAR(20) NOT NULL,
    "truck_type" VARCHAR(100),
    "customer_id" INTEGER,
    "vendor_id" INTEGER,
    "origin" VARCHAR(100) NOT NULL,
    "destination" VARCHAR(100) NOT NULL,
    "weight" DECIMAL(10,2),
    "koli" INTEGER,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "goods" VARCHAR(255),
    "remarks" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "charter_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "charter_orders_direction_check" CHECK ("direction" IN ('IN', 'OUT')),
    CONSTRAINT "charter_orders_total_cost_check" CHECK ("total_cost" >= 0)
);

-- CreateTable
CREATE TABLE "charter_status_logs" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "prior_status" VARCHAR(20),
    "new_status" VARCHAR(20) NOT NULL,
    "note" VARCHAR(255),
    "actor_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charter_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charter_invoices" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "invoice_no" VARCHAR(50) NOT NULL,
    "notes" VARCHAR(255),
    "amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'UNPAID',
    "paid_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "charter_invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "charter_invoices_status_check" CHECK ("status" IN ('UNPAID', 'PAID'))
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_shares_vehicle_id_key" ON "vehicle_shares"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_shares_active_available_to_idx" ON "vehicle_shares"("active", "available_to");

-- CreateIndex
CREATE UNIQUE INDEX "charter_orders_order_no_key" ON "charter_orders"("order_no");

-- CreateIndex
CREATE INDEX "charter_orders_direction_status_idx" ON "charter_orders"("direction", "status");

-- CreateIndex
CREATE INDEX "charter_orders_branch_id_idx" ON "charter_orders"("branch_id");

-- CreateIndex
CREATE INDEX "charter_orders_load_date_idx" ON "charter_orders"("load_date");

-- CreateIndex
CREATE INDEX "charter_orders_vehicle_id_idx" ON "charter_orders"("vehicle_id");

-- CreateIndex
CREATE INDEX "charter_orders_customer_id_idx" ON "charter_orders"("customer_id");

-- CreateIndex
CREATE INDEX "charter_orders_vendor_id_idx" ON "charter_orders"("vendor_id");

-- CreateIndex
CREATE INDEX "charter_orders_created_by_id_idx" ON "charter_orders"("created_by_id");

-- CreateIndex
CREATE INDEX "charter_status_logs_order_id_idx" ON "charter_status_logs"("order_id");

-- CreateIndex
CREATE INDEX "charter_status_logs_actor_id_idx" ON "charter_status_logs"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "charter_invoices_order_id_key" ON "charter_invoices"("order_id");

-- CreateIndex
CREATE INDEX "charter_invoices_status_idx" ON "charter_invoices"("status");

-- CreateIndex
CREATE INDEX "charter_invoices_created_by_id_idx" ON "charter_invoices"("created_by_id");

-- AddForeignKey
ALTER TABLE "vehicle_shares" ADD CONSTRAINT "vehicle_shares_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "charter_orders" ADD CONSTRAINT "charter_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "charter_orders" ADD CONSTRAINT "charter_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "charter_orders" ADD CONSTRAINT "charter_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "charter_orders" ADD CONSTRAINT "charter_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "charter_orders" ADD CONSTRAINT "charter_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "charter_status_logs" ADD CONSTRAINT "charter_status_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "charter_orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "charter_status_logs" ADD CONSTRAINT "charter_status_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "charter_invoices" ADD CONSTRAINT "charter_invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "charter_orders"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "charter_invoices" ADD CONSTRAINT "charter_invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


