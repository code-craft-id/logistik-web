-- WhatsApp notifications (D-37), following the provider's
-- Perusahaan > WA Notifikasi > Pesan Whatsapp: four messages with on/off,
-- sent only for customers whose WA Notif is active.
-- New tables only; existing rows are untouched. A kind without a row uses
-- the built-in default text (the provider's observed text) and is enabled.
-- Rollback: drop whatsapp_outbox and whatsapp_templates.

CREATE TABLE "whatsapp_templates" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "whatsapp_templates_kind_check"
      CHECK ("kind" IN ('TRX_SENDER', 'TRX_RECEIVER', 'SHIPMENT_STATUS', 'DELIVERY_SHEET'))
);
CREATE UNIQUE INDEX "whatsapp_templates_company_id_kind_key" ON "whatsapp_templates"("company_id", "kind");
ALTER TABLE "whatsapp_templates" ADD CONSTRAINT "whatsapp_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "whatsapp_outbox" (
    "id" SERIAL NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "branch_id" INTEGER,
    "payload" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" VARCHAR(100),
    "sent_branch_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "whatsapp_outbox_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "whatsapp_outbox_kind_check"
      CHECK ("kind" IN ('TRX_SENDER', 'TRX_RECEIVER', 'SHIPMENT_STATUS', 'DELIVERY_SHEET')),
    CONSTRAINT "whatsapp_outbox_status_check"
      CHECK ("status" IN ('PENDING', 'SENDING', 'SENT', 'SKIPPED', 'FAILED'))
);
CREATE INDEX "whatsapp_outbox_status_created_at_idx" ON "whatsapp_outbox"("status", "created_at");
CREATE INDEX "whatsapp_outbox_transaction_id_idx" ON "whatsapp_outbox"("transaction_id");
ALTER TABLE "whatsapp_outbox" ADD CONSTRAINT "whatsapp_outbox_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
