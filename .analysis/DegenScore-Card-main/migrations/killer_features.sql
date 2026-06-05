-- Migration: Add Killer Features (AI Coach, Whale Tracker, Telegram)
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════
-- KILLER FEATURES - UNIQUE TO THIS PLATFORM
-- ═══════════════════════════════════════════════════════════════

-- 1. AI Trading Coach Analysis
CREATE TABLE IF NOT EXISTS "AICoachAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tradesAnalyzed" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "patterns" TEXT NOT NULL,
    "riskProfile" TEXT NOT NULL,
    "emotionalTrading" INTEGER NOT NULL,
    "predictedROI" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "fullAnalysis" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "AICoachAnalysis_walletAddress_idx" ON "AICoachAnalysis"("walletAddress");
CREATE INDEX IF NOT EXISTS "AICoachAnalysis_analyzedAt_idx" ON "AICoachAnalysis"("analyzedAt");
CREATE INDEX IF NOT EXISTS "AICoachAnalysis_overallScore_idx" ON "AICoachAnalysis"("overallScore");

-- 2. Whale Tracking System
CREATE TABLE IF NOT EXISTS "WhaleWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL UNIQUE,
    "nickname" TEXT,
    "totalVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgPositionSize" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topTokens" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER,
    "firstDetected" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "totalProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "WhaleWallet_totalVolume_idx" ON "WhaleWallet"("totalVolume");
CREATE INDEX IF NOT EXISTS "WhaleWallet_winRate_idx" ON "WhaleWallet"("winRate");
CREATE INDEX IF NOT EXISTS "WhaleWallet_rank_idx" ON "WhaleWallet"("rank");
CREATE INDEX IF NOT EXISTS "WhaleWallet_lastActive_idx" ON "WhaleWallet"("lastActive");
CREATE INDEX IF NOT EXISTS "WhaleWallet_followersCount_idx" ON "WhaleWallet"("followersCount");

CREATE TABLE IF NOT EXISTS "WhaleAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whaleWalletId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amountSOL" DOUBLE PRECISION NOT NULL,
    "priceImpact" DOUBLE PRECISION,
    "signature" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedUsers" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("whaleWalletId") REFERENCES "WhaleWallet"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "WhaleAlert_whaleWalletId_idx" ON "WhaleAlert"("whaleWalletId");
CREATE INDEX IF NOT EXISTS "WhaleAlert_timestamp_idx" ON "WhaleAlert"("timestamp");
CREATE INDEX IF NOT EXISTS "WhaleAlert_alertType_idx" ON "WhaleAlert"("alertType");
CREATE INDEX IF NOT EXISTS "WhaleAlert_tokenMint_idx" ON "WhaleAlert"("tokenMint");

CREATE TABLE IF NOT EXISTS "WhaleFollower" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "whaleWalletId" TEXT NOT NULL,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("whaleWalletId") REFERENCES "WhaleWallet"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WhaleFollower_walletAddress_whaleWalletId_key" ON "WhaleFollower"("walletAddress", "whaleWalletId");
CREATE INDEX IF NOT EXISTS "WhaleFollower_walletAddress_idx" ON "WhaleFollower"("walletAddress");
CREATE INDEX IF NOT EXISTS "WhaleFollower_whaleWalletId_idx" ON "WhaleFollower"("whaleWalletId");

-- 3. Telegram Integration
CREATE TABLE IF NOT EXISTS "TelegramUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" BIGINT NOT NULL UNIQUE,
    "username" TEXT,
    "walletAddress" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'es',
    "firstInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalInteractions" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TelegramUser_telegramId_idx" ON "TelegramUser"("telegramId");
CREATE INDEX IF NOT EXISTS "TelegramUser_walletAddress_idx" ON "TelegramUser"("walletAddress");
CREATE INDEX IF NOT EXISTS "TelegramUser_lastInteraction_idx" ON "TelegramUser"("lastInteraction");

-- Verify tables were created
SELECT
    'AICoachAnalysis' as table_name,
    COUNT(*) as row_count
FROM "AICoachAnalysis"
UNION ALL
SELECT 'WhaleWallet', COUNT(*) FROM "WhaleWallet"
UNION ALL
SELECT 'WhaleAlert', COUNT(*) FROM "WhaleAlert"
UNION ALL
SELECT 'WhaleFollower', COUNT(*) FROM "WhaleFollower"
UNION ALL
SELECT 'TelegramUser', COUNT(*) FROM "TelegramUser";
