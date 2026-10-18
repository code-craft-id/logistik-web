-- CreateTable
CREATE TABLE "marketing_people" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "national_id_number" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "branch_id" BIGINT,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "marketing_people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_people_branch_id_idx" ON "marketing_people"("branch_id");

-- CreateIndex
CREATE INDEX "marketing_people_status_idx" ON "marketing_people"("status");

-- AddForeignKey
ALTER TABLE "marketing_people" ADD CONSTRAINT "marketing_people_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
