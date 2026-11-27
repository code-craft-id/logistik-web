-- Ticket lifecycle (D-35, simplified from the provider): status
-- Open / In Progress / Finish; requester approval Approved (Approve Finish)
-- or Revision (Revisi). Existing tickets become 'Open' with no approval.
-- Rollback: drop the five columns and the two CHECK constraints.

ALTER TABLE "tickets" ADD COLUMN     "approval" VARCHAR(20),
ADD COLUMN     "approval_note" VARCHAR(1000),
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" INTEGER,
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'Open';

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_status_check"
  CHECK ("status" IN ('Open', 'In Progress', 'Finish'));
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_approval_check"
  CHECK ("approval" IS NULL OR "approval" IN ('Approved', 'Revision'));

CREATE INDEX "tickets_status_idx" ON "tickets"("status");

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
