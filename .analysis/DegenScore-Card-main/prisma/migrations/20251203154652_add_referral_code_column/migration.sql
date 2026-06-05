-- AlterTable
ALTER TABLE "DegenCard" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- Create unique index if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'DegenCard'
        AND indexname = 'DegenCard_referralCode_key'
    ) THEN
        CREATE UNIQUE INDEX "DegenCard_referralCode_key" ON "DegenCard"("referralCode");
    END IF;
END$$;

-- Set default values for existing rows
UPDATE "DegenCard"
SET "referralCode" = gen_random_uuid()::text
WHERE "referralCode" IS NULL;

-- Make column NOT NULL after setting defaults
ALTER TABLE "DegenCard" ALTER COLUMN "referralCode" SET NOT NULL;
ALTER TABLE "DegenCard" ALTER COLUMN "referralCode" SET DEFAULT gen_random_uuid()::text;
