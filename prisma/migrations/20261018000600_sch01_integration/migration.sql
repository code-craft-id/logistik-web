-- CreateTable
CREATE TABLE "customer_whatsapp_notifications" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "customer_id" BIGINT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_whatsapp_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_whatsapp_notifications_company_id_idx" ON "customer_whatsapp_notifications"("company_id");

-- AddForeignKey
ALTER TABLE "customer_whatsapp_notifications" ADD CONSTRAINT "customer_whatsapp_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
