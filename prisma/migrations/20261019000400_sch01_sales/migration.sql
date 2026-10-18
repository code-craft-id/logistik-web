BEGIN;
SET LOCAL lock_timeout = '5s';
-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "regency_id" INTEGER,
    "phone" TEXT,
    "fax" TEXT,
    "contact_person" TEXT,
    "email" TEXT,
    "marketing_person_id" INTEGER,
    "branch_id" INTEGER,
    "term_id" INTEGER,
    "pod_required" BOOLEAN,
    "cost_type_id" INTEGER,
    "whatsapp_notification_enabled" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignees" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT,
    "address2" TEXT,
    "regency_id" INTEGER,
    "phone" TEXT,
    "pic" TEXT,
    "customer_id" INTEGER,
    "branch_id" INTEGER,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "consignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tax_profiles" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "tax_number" TEXT,
    "registered_name" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_regency_id_idx" ON "customers"("regency_id");

-- CreateIndex
CREATE INDEX "customers_marketing_person_id_idx" ON "customers"("marketing_person_id");

-- CreateIndex
CREATE INDEX "customers_branch_id_idx" ON "customers"("branch_id");

-- CreateIndex
CREATE INDEX "customers_term_id_idx" ON "customers"("term_id");

-- CreateIndex
CREATE INDEX "customers_cost_type_id_idx" ON "customers"("cost_type_id");

-- CreateIndex
CREATE INDEX "consignees_regency_id_idx" ON "consignees"("regency_id");

-- CreateIndex
CREATE INDEX "consignees_customer_id_idx" ON "consignees"("customer_id");

-- CreateIndex
CREATE INDEX "consignees_branch_id_idx" ON "consignees"("branch_id");

-- CreateIndex
CREATE INDEX "consignees_status_idx" ON "consignees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_tax_profiles_customer_id_key" ON "customer_tax_profiles"("customer_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "regencies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_marketing_person_id_fkey" FOREIGN KEY ("marketing_person_id") REFERENCES "marketing_people"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "cost_types"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "consignees" ADD CONSTRAINT "consignees_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "regencies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "consignees" ADD CONSTRAINT "consignees_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "consignees" ADD CONSTRAINT "consignees_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "customer_tax_profiles" ADD CONSTRAINT "customer_tax_profiles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

COMMIT;
