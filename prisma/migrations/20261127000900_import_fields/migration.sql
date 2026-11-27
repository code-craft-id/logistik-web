-- Fields of the provider's consignee and vehicle import files, and vendor price lists.
ALTER TABLE "consignees" ADD COLUMN "district_id" INTEGER,
  ADD COLUMN "village_id" INTEGER,
  ADD COLUMN "postal_code" VARCHAR(10),
  ADD COLUMN "fax" VARCHAR(30),
  ADD COLUMN "email" VARCHAR(150);
ALTER TABLE "consignees" ADD CONSTRAINT "consignees_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "consignees" ADD CONSTRAINT "consignees_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "vehicles" ADD COLUMN "code" VARCHAR(50),
  ADD COLUMN "body_type" VARCHAR(100),
  ADD COLUMN "brand" VARCHAR(100),
  ADD COLUMN "plate_color" VARCHAR(50),
  ADD COLUMN "length" DECIMAL(10,2),
  ADD COLUMN "width" DECIMAL(10,2),
  ADD COLUMN "height" DECIMAL(10,2);
CREATE UNIQUE INDEX "vehicles_code_key" ON "vehicles"("code");

CREATE TABLE "vendor_tariffs" (
    "id" SERIAL NOT NULL,
    "unique_no" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "delivery_service_id" INTEGER NOT NULL,
    "transport_mode_id" INTEGER NOT NULL,
    "origin_branch_id" INTEGER NOT NULL,
    "destination_branch_id" INTEGER NOT NULL,
    "min_weight" DECIMAL(10,2),
    "first_price" DECIMAL(15,2),
    "next_price" DECIMAL(15,2) NOT NULL,
    "lead_time_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "vendor_tariffs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vendor_tariffs_unique_no_key" ON "vendor_tariffs"("unique_no");
CREATE INDEX "vendor_tariffs_vendor_id_idx" ON "vendor_tariffs"("vendor_id");
ALTER TABLE "vendor_tariffs" ADD CONSTRAINT "vendor_tariffs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "vendor_tariffs" ADD CONSTRAINT "vendor_tariffs_delivery_service_id_fkey" FOREIGN KEY ("delivery_service_id") REFERENCES "delivery_services"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "vendor_tariffs" ADD CONSTRAINT "vendor_tariffs_transport_mode_id_fkey" FOREIGN KEY ("transport_mode_id") REFERENCES "transport_modes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "vendor_tariffs" ADD CONSTRAINT "vendor_tariffs_origin_branch_id_fkey" FOREIGN KEY ("origin_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "vendor_tariffs" ADD CONSTRAINT "vendor_tariffs_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
