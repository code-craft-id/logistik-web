-- Kasir Lampiran (sandbox voucher attachment): images of receipts / notes
-- on Cloudinary, kept beside fin_journals so posted journals stay immutable.
-- New table only; existing rows are untouched.
-- Rollback: DROP TABLE "fin_journal_attachments";

-- CreateTable
CREATE TABLE "fin_journal_attachments" (
    "id" SERIAL NOT NULL,
    "journalId" INTEGER NOT NULL,
    "url" VARCHAR(1024) NOT NULL,
    "publicId" VARCHAR(255) NOT NULL,
    "fileName" VARCHAR(200) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fin_journal_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fin_journal_attachments_journalId_idx" ON "fin_journal_attachments"("journalId");

-- AddForeignKey
ALTER TABLE "fin_journal_attachments" ADD CONSTRAINT "fin_journal_attachments_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "fin_journals"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fin_journal_attachments" ADD CONSTRAINT "fin_journal_attachments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

