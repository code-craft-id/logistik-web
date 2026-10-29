-- CreateTable
CREATE TABLE "manifests" (
    "id" SERIAL NOT NULL,
    "manifest_no" VARCHAR(50) NOT NULL,
    "manifest_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(30),
    "branch_id" INTEGER,
    "vehicle_id" INTEGER,
    "courier_id" INTEGER,
    "origin_branch_id" INTEGER,
    "destination_branch_id" INTEGER,
    "status" VARCHAR(30) NOT NULL DEFAULT 'Draft',
    "transit1" VARCHAR(100),
    "transit2" VARCHAR(100),
    "transit3" VARCHAR(100),
    "transit4" VARCHAR(100),
    "transit5" VARCHAR(100),
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifest_items" (
    "id" SERIAL NOT NULL,
    "manifest_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by_id" INTEGER,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "manifest_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_sheets" (
    "id" SERIAL NOT NULL,
    "sheet_no" VARCHAR(50) NOT NULL,
    "manifest_id" INTEGER NOT NULL,
    "delivery_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_sheet_items" (
    "id" SERIAL NOT NULL,
    "delivery_sheet_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "outcome" VARCHAR(30),
    "delivered_at" TIMESTAMP(3),
    "received_by" TEXT,
    "notes" TEXT,

    CONSTRAINT "delivery_sheet_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manifests_manifest_no_key" ON "manifests"("manifest_no");

-- CreateIndex
CREATE INDEX "manifests_branch_id_idx" ON "manifests"("branch_id");

-- CreateIndex
CREATE INDEX "manifests_origin_branch_id_idx" ON "manifests"("origin_branch_id");

-- CreateIndex
CREATE INDEX "manifests_status_idx" ON "manifests"("status");

-- CreateIndex
CREATE INDEX "manifests_manifest_date_idx" ON "manifests"("manifest_date");

-- CreateIndex
CREATE UNIQUE INDEX "manifest_items_transaction_id_key" ON "manifest_items"("transaction_id");

-- CreateIndex
CREATE INDEX "manifest_items_manifest_id_idx" ON "manifest_items"("manifest_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_sheets_sheet_no_key" ON "delivery_sheets"("sheet_no");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_sheets_manifest_id_key" ON "delivery_sheets"("manifest_id");

-- CreateIndex
CREATE INDEX "delivery_sheets_delivery_date_idx" ON "delivery_sheets"("delivery_date");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_sheet_items_delivery_sheet_id_transaction_id_key" ON "delivery_sheet_items"("delivery_sheet_id", "transaction_id");

-- CreateIndex
CREATE INDEX "delivery_sheet_items_transaction_id_idx" ON "delivery_sheet_items"("transaction_id");

-- AddForeignKey
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifest_items" ADD CONSTRAINT "manifest_items_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "manifests"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifest_items" ADD CONSTRAINT "manifest_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "manifest_items" ADD CONSTRAINT "manifest_items_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_sheets" ADD CONSTRAINT "delivery_sheets_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "manifests"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_sheets" ADD CONSTRAINT "delivery_sheets_delivered_by_id_fkey" FOREIGN KEY ("delivered_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_sheet_items" ADD CONSTRAINT "delivery_sheet_items_delivery_sheet_id_fkey" FOREIGN KEY ("delivery_sheet_id") REFERENCES "delivery_sheets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_sheet_items" ADD CONSTRAINT "delivery_sheet_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
