-- CreateTable
CREATE TABLE "provinces" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regencies" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "regencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villages" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postal_codes" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "postal_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "national_id_number" VARCHAR(20) NOT NULL,
    "driver_license_number" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "branch_id" BIGINT,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couriers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "national_id_number" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "branch_id" BIGINT,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_modes" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "divider" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "transport_modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_services" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "service_category_id" BIGINT,
    "transport_mode_id" BIGINT,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "delivery_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_types" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "goods_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_types" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "cost_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "trucking_type_id" BIGINT,
    "year" INTEGER NOT NULL,
    "license_plate" VARCHAR(20) NOT NULL,
    "registration_holder_name" VARCHAR(100) NOT NULL,
    "registration_number" VARCHAR(50) NOT NULL,
    "registration_date" DATE,
    "cylinder_capacity" VARCHAR(50) NOT NULL,
    "color" VARCHAR(50) NOT NULL,
    "insurance_name" VARCHAR(100) NOT NULL,
    "insurance_expiry" DATE,
    "description" TEXT NOT NULL,
    "chassis_number" VARCHAR(100) NOT NULL,
    "engine_number" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',
    "service_trucking" BOOLEAN NOT NULL DEFAULT false,
    "branch_id" BIGINT,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trucking_types" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "trucking_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_statuses" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "shipment_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fax" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_tax_profiles" (
    "id" BIGSERIAL NOT NULL,
    "vendor_id" BIGINT NOT NULL,
    "tax_number" TEXT NOT NULL,
    "registered_name" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,

    CONSTRAINT "vendor_tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provinces_status_idx" ON "provinces"("status");

-- CreateIndex
CREATE INDEX "regencies_status_idx" ON "regencies"("status");

-- CreateIndex
CREATE INDEX "districts_status_idx" ON "districts"("status");

-- CreateIndex
CREATE INDEX "villages_status_idx" ON "villages"("status");

-- CreateIndex
CREATE INDEX "postal_codes_status_idx" ON "postal_codes"("status");

-- CreateIndex
CREATE INDEX "drivers_branch_id_idx" ON "drivers"("branch_id");

-- CreateIndex
CREATE INDEX "drivers_status_idx" ON "drivers"("status");

-- CreateIndex
CREATE INDEX "couriers_branch_id_idx" ON "couriers"("branch_id");

-- CreateIndex
CREATE INDEX "couriers_status_idx" ON "couriers"("status");

-- CreateIndex
CREATE INDEX "transport_modes_status_idx" ON "transport_modes"("status");

-- CreateIndex
CREATE INDEX "service_categories_status_idx" ON "service_categories"("status");

-- CreateIndex
CREATE INDEX "delivery_services_service_category_id_idx" ON "delivery_services"("service_category_id");

-- CreateIndex
CREATE INDEX "delivery_services_transport_mode_id_idx" ON "delivery_services"("transport_mode_id");

-- CreateIndex
CREATE INDEX "delivery_services_status_idx" ON "delivery_services"("status");

-- CreateIndex
CREATE INDEX "goods_types_status_idx" ON "goods_types"("status");

-- CreateIndex
CREATE INDEX "cost_types_status_idx" ON "cost_types"("status");

-- CreateIndex
CREATE INDEX "terms_status_idx" ON "terms"("status");

-- CreateIndex
CREATE INDEX "vehicles_trucking_type_id_idx" ON "vehicles"("trucking_type_id");

-- CreateIndex
CREATE INDEX "vehicles_branch_id_idx" ON "vehicles"("branch_id");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicle_types_status_idx" ON "vehicle_types"("status");

-- CreateIndex
CREATE INDEX "trucking_types_status_idx" ON "trucking_types"("status");

-- CreateIndex
CREATE INDEX "shipment_statuses_status_idx" ON "shipment_statuses"("status");

-- CreateIndex
CREATE INDEX "vendors_status_idx" ON "vendors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_tax_profiles_vendor_id_key" ON "vendor_tax_profiles"("vendor_id");

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_services" ADD CONSTRAINT "delivery_services_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_services" ADD CONSTRAINT "delivery_services_transport_mode_id_fkey" FOREIGN KEY ("transport_mode_id") REFERENCES "transport_modes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_trucking_type_id_fkey" FOREIGN KEY ("trucking_type_id") REFERENCES "trucking_types"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vendor_tax_profiles" ADD CONSTRAINT "vendor_tax_profiles_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
