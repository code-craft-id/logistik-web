-- New table only; existing rows are not touched.
-- Rollback: DROP TABLE "help_ai_settings";
CREATE TABLE "help_ai_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "url" VARCHAR(300) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "key_cipher" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_ai_settings_pkey" PRIMARY KEY ("id")
);
