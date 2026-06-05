-- AlterTable
ALTER TABLE "DegenCard" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DegenCard_deletedAt_idx" ON "DegenCard"("deletedAt");

-- CreateIndex
CREATE INDEX "DegenCard_isPaid_deletedAt_degenScore_idx" ON "DegenCard"("isPaid", "deletedAt", "degenScore" DESC);

-- CreateIndex
CREATE INDEX "DegenCard_deletedAt_isPaid_degenScore_idx" ON "DegenCard"("deletedAt", "isPaid", "degenScore" DESC);
