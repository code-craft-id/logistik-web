-- PLT-01: RBAC models - UserGroup, Permission, UserAllowedBranch
-- D-04 TBD (permission matrix, multi-branch users, HQ override)
-- D-03 TBD (organization hierarchy)
BEGIN;

-- CreateTable
CREATE TABLE "user_groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "status" "record_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "group_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_allowed_branches" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_allowed_branches_pkey" PRIMARY KEY ("id")
);

-- Add columns to auth_users for RBAC
ALTER TABLE "auth_users" ADD COLUMN "group_id" INTEGER;
ALTER TABLE "auth_users" ADD COLUMN "branch_ids" INTEGER[];

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_name_key" ON "user_groups"("name");
CREATE INDEX "user_groups_status_idx" ON "user_groups"("status");

CREATE UNIQUE INDEX "permissions_action_resource_group_id_key" ON "permissions"("action", "resource", "group_id");
CREATE INDEX "permissions_group_id_idx" ON "permissions"("group_id");

CREATE UNIQUE INDEX "user_allowed_branches_user_id_branch_id_key" ON "user_allowed_branches"("user_id", "branch_id");
CREATE INDEX "user_allowed_branches_user_id_idx" ON "user_allowed_branches"("user_id");
CREATE INDEX "user_allowed_branches_branch_id_idx" ON "user_allowed_branches"("branch_id");

-- AddForeignKey
ALTER TABLE "auth_users" ADD CONSTRAINT "auth_users_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_allowed_branches" ADD CONSTRAINT "user_allowed_branches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_allowed_branches" ADD CONSTRAINT "user_allowed_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;