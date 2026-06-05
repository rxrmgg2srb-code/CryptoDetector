-- CreateTable
CREATE TABLE "TokenAnalysis" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "supply" DOUBLE PRECISION NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "securityScore" INTEGER NOT NULL,
    "authorityScore" INTEGER NOT NULL,
    "holderScore" INTEGER NOT NULL,
    "liquidityScore" INTEGER NOT NULL,
    "tradingScore" INTEGER NOT NULL,
    "metadataScore" INTEGER NOT NULL,
    "marketScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "hasMintAuthority" BOOLEAN NOT NULL,
    "hasFreezeAuthority" BOOLEAN NOT NULL,
    "authoritiesRevoked" BOOLEAN NOT NULL,
    "totalHolders" INTEGER NOT NULL,
    "top10HoldersPercent" DOUBLE PRECISION NOT NULL,
    "creatorPercent" DOUBLE PRECISION NOT NULL,
    "concentrationRisk" TEXT NOT NULL,
    "bundleDetected" BOOLEAN NOT NULL DEFAULT false,
    "bundleWallets" INTEGER NOT NULL DEFAULT 0,
    "totalLiquiditySOL" DOUBLE PRECISION NOT NULL,
    "liquidityUSD" DOUBLE PRECISION NOT NULL,
    "lpBurned" BOOLEAN NOT NULL DEFAULT false,
    "lpLocked" BOOLEAN NOT NULL DEFAULT false,
    "lpLockEnd" TIMESTAMP(3),
    "bundleBots" INTEGER NOT NULL DEFAULT 0,
    "snipers" INTEGER NOT NULL DEFAULT 0,
    "washTrading" BOOLEAN NOT NULL DEFAULT false,
    "honeypotDetected" BOOLEAN NOT NULL DEFAULT false,
    "canSell" BOOLEAN NOT NULL DEFAULT true,
    "ageInDays" DOUBLE PRECISION NOT NULL,
    "volume24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceChange24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPumpAndDump" BOOLEAN NOT NULL DEFAULT false,
    "criticalFlags" INTEGER NOT NULL DEFAULT 0,
    "highFlags" INTEGER NOT NULL DEFAULT 0,
    "totalPenalty" INTEGER NOT NULL DEFAULT 0,
    "redFlagsJson" JSONB,
    "fullAnalysisJson" JSONB,
    "imageUrl" TEXT,
    "description" TEXT,
    "website" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "TokenAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenAnalysis_tokenAddress_key" ON "TokenAnalysis"("tokenAddress");

-- CreateIndex
CREATE INDEX "TokenAnalysis_tokenAddress_idx" ON "TokenAnalysis"("tokenAddress");

-- CreateIndex
CREATE INDEX "TokenAnalysis_securityScore_idx" ON "TokenAnalysis"("securityScore" DESC);

-- CreateIndex
CREATE INDEX "TokenAnalysis_riskLevel_idx" ON "TokenAnalysis"("riskLevel");

-- CreateIndex
CREATE INDEX "TokenAnalysis_analyzedAt_idx" ON "TokenAnalysis"("analyzedAt" DESC);

-- CreateIndex
CREATE INDEX "TokenAnalysis_createdAt_idx" ON "TokenAnalysis"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "TokenAnalysis_verified_securityScore_idx" ON "TokenAnalysis"("verified", "securityScore" DESC);
