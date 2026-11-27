-- Tariffs per customer (provider Template Import Tarif Customers). New table only.
CREATE TABLE "customer_tariffs" (
    "id" SERIAL NOT NULL,
    "pricing" VARCHAR(4) NOT NULL,
    "unique_no" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "delivery_service_id" INTEGER NOT NULL,
    "transport_mode_id" INTEGER NOT NULL,
    "origin_branch_id" INTEGER NOT NULL,
    "destination_branch_id" INTEGER NOT NULL,
    "min_weight" DECIMAL(10,2),
    "price" DECIMAL(15,2) NOT NULL,
    "next_price" DECIMAL(15,2),
    "lead_time_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_tariffs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_tariffs_pricing_unique_no_key" ON "customer_tariffs"("pricing", "unique_no");
CREATE INDEX "customer_tariffs_customer_id_idx" ON "customer_tariffs"("customer_id");
ALTER TABLE "customer_tariffs" ADD CONSTRAINT "customer_tariffs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "customer_tariffs" ADD CONSTRAINT "customer_tariffs_delivery_service_id_fkey" FOREIGN KEY ("delivery_service_id") REFERENCES "delivery_services"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "customer_tariffs" ADD CONSTRAINT "customer_tariffs_transport_mode_id_fkey" FOREIGN KEY ("transport_mode_id") REFERENCES "transport_modes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "customer_tariffs" ADD CONSTRAINT "customer_tariffs_origin_branch_id_fkey" FOREIGN KEY ("origin_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "customer_tariffs" ADD CONSTRAINT "customer_tariffs_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
