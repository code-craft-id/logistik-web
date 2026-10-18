BEGIN;
SET LOCAL lock_timeout = '5s';
-- CreateIndex
CREATE INDEX "customer_whatsapp_notifications_customer_id_idx" ON "customer_whatsapp_notifications"("customer_id");

-- AddForeignKey
ALTER TABLE "customer_whatsapp_notifications" ADD CONSTRAINT "customer_whatsapp_notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


COMMIT;
