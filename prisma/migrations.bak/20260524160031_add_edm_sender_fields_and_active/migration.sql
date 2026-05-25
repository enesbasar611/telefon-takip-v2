-- AlterTable
ALTER TABLE "EDMSettings" ADD COLUMN IF NOT EXISTS "senderAddress" TEXT;
ALTER TABLE "EDMSettings" ADD COLUMN IF NOT EXISTS "senderCity" TEXT;
ALTER TABLE "EDMSettings" ADD COLUMN IF NOT EXISTS "senderDistrict" TEXT;
ALTER TABLE "EDMSettings" ADD COLUMN IF NOT EXISTS "senderTaxOffice" TEXT;
ALTER TABLE "EDMSettings" ADD COLUMN IF NOT EXISTS "edmActive" BOOLEAN NOT NULL DEFAULT false;

-- Migrate data from old isActive column
UPDATE "EDMSettings" SET "edmActive" = "isActive" WHERE "isActive" IS NOT NULL;

-- Drop old column
ALTER TABLE "EDMSettings" DROP COLUMN IF EXISTS "isActive";