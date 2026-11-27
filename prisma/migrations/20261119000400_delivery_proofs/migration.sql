-- Bukti terima per AWB from Scan AWB (owner request 2026-11-19, modelled on
-- the provider's courier app): outcome, receiver name, note, up to five
-- photos and a drawn signature stored on Cloudinary (URL and id only).
-- Additive: two new tables. Rollback: forward-fix dropping them.

CREATE TABLE "delivery_proofs" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "outcome" VARCHAR(20) NOT NULL,
    "receiver_name" VARCHAR(150),
    "notes" VARCHAR(500),
    "signature_url" VARCHAR(500),
    "signature_public_id" VARCHAR(255),
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "delivery_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_proof_photos" (
    "id" SERIAL NOT NULL,
    "proof_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "public_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "delivery_proof_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_proofs_transaction_id_idx" ON "delivery_proofs"("transaction_id");

-- CreateIndex
CREATE INDEX "delivery_proofs_created_at_idx" ON "delivery_proofs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_proof_photos_proof_id_position_key" ON "delivery_proof_photos"("proof_id", "position");

-- AddForeignKey
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "delivery_proof_photos" ADD CONSTRAINT "delivery_proof_photos_proof_id_fkey" FOREIGN KEY ("proof_id") REFERENCES "delivery_proofs"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Value guards (not modelled by Prisma)
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_outcome_check" CHECK ("outcome" IN ('DELIVERED', 'RETURNED'));
ALTER TABLE "delivery_proof_photos" ADD CONSTRAINT "delivery_proof_photos_position_check" CHECK ("position" BETWEEN 1 AND 5);
