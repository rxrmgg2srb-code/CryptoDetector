-- Migration: Add Engagement & Retention Features
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════
-- ENGAGEMENT & RETENTION FEATURES
-- ═══════════════════════════════════════════════════════════════

-- 1. Daily Login Streak System
CREATE TABLE IF NOT EXISTS "UserStreak" (
    "walletAddress" TEXT NOT NULL PRIMARY KEY,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastLoginDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalLogins" INTEGER NOT NULL DEFAULT 1,
    "streakPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "UserStreak_currentStreak_idx" ON "UserStreak"("currentStreak");
CREATE INDEX IF NOT EXISTS "UserStreak_lastLoginDate_idx" ON "UserStreak"("lastLoginDate");

-- 2. Daily Challenges System
CREATE TABLE IF NOT EXISTS "DailyChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL,
    "challengeType" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "rewardXP" INTEGER NOT NULL,
    "rewardBadge" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailyChallenge_date_challengeType_key" ON "DailyChallenge"("date", "challengeType");
CREATE INDEX IF NOT EXISTS "DailyChallenge_date_idx" ON "DailyChallenge"("date");

CREATE TABLE IF NOT EXISTS "DailyChallengeCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailyChallengeCompletion_challengeId_walletAddress_key" ON "DailyChallengeCompletion"("challengeId", "walletAddress");
CREATE INDEX IF NOT EXISTS "DailyChallengeCompletion_walletAddress_idx" ON "DailyChallengeCompletion"("walletAddress");
CREATE INDEX IF NOT EXISTS "DailyChallengeCompletion_completed_idx" ON "DailyChallengeCompletion"("completed");

-- 3. Trading Competitions (Daily Duels 1v1)
CREATE TABLE IF NOT EXISTS "TradingDuel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'open',
    "creatorWallet" TEXT NOT NULL,
    "opponentWallet" TEXT,
    "entryFee" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 86400,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "virtualStartBalance" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "winnerWallet" TEXT,
    "creatorROI" DOUBLE PRECISION,
    "opponentROI" DOUBLE PRECISION,
    "creatorTxSignature" TEXT,
    "opponentTxSignature" TEXT,
    "payoutTxSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TradingDuel_status_idx" ON "TradingDuel"("status");
CREATE INDEX IF NOT EXISTS "TradingDuel_creatorWallet_idx" ON "TradingDuel"("creatorWallet");
CREATE INDEX IF NOT EXISTS "TradingDuel_opponentWallet_idx" ON "TradingDuel"("opponentWallet");
CREATE INDEX IF NOT EXISTS "TradingDuel_createdAt_idx" ON "TradingDuel"("createdAt");

CREATE TABLE IF NOT EXISTS "VirtualTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duelId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "amountSOL" DOUBLE PRECISION NOT NULL,
    "tokenPrice" DOUBLE PRECISION NOT NULL,
    "tokenAmount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("duelId") REFERENCES "TradingDuel"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "VirtualTrade_duelId_walletAddress_idx" ON "VirtualTrade"("duelId", "walletAddress");
CREATE INDEX IF NOT EXISTS "VirtualTrade_timestamp_idx" ON "VirtualTrade"("timestamp");

-- 4. User Analytics & Engagement Tracking
CREATE TABLE IF NOT EXISTS "UserAnalytics" (
    "walletAddress" TEXT NOT NULL PRIMARY KEY,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loginCount" INTEGER NOT NULL DEFAULT 1,
    "challengesCompleted" INTEGER NOT NULL DEFAULT 0,
    "duelsPlayed" INTEGER NOT NULL DEFAULT 0,
    "duelsWon" INTEGER NOT NULL DEFAULT 0,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "referralsCount" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "UserAnalytics_totalXP_idx" ON "UserAnalytics"("totalXP");
CREATE INDEX IF NOT EXISTS "UserAnalytics_level_idx" ON "UserAnalytics"("level");
CREATE INDEX IF NOT EXISTS "UserAnalytics_lastLogin_idx" ON "UserAnalytics"("lastLogin");

-- 5. Achievement System
CREATE TABLE IF NOT EXISTS "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "requirementValue" INTEGER NOT NULL,
    "rewardXP" INTEGER NOT NULL DEFAULT 0,
    "rewardBadge" BOOLEAN NOT NULL DEFAULT true,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Achievement_key_idx" ON "Achievement"("key");
CREATE INDEX IF NOT EXISTS "Achievement_rarity_idx" ON "Achievement"("rarity");

CREATE TABLE IF NOT EXISTS "AchievementUnlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "achievementId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AchievementUnlock_achievementId_walletAddress_key" ON "AchievementUnlock"("achievementId", "walletAddress");
CREATE INDEX IF NOT EXISTS "AchievementUnlock_walletAddress_idx" ON "AchievementUnlock"("walletAddress");
CREATE INDEX IF NOT EXISTS "AchievementUnlock_unlockedAt_idx" ON "AchievementUnlock"("unlockedAt");

-- 6. Referral System
CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerWallet" TEXT NOT NULL,
    "referredWallet" TEXT NOT NULL,
    "referredPremium" BOOLEAN NOT NULL DEFAULT false,
    "rewardPaid" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" DOUBLE PRECISION,
    "rewardTxSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredWallet_key" ON "Referral"("referredWallet");
CREATE INDEX IF NOT EXISTS "Referral_referrerWallet_idx" ON "Referral"("referrerWallet");
CREATE INDEX IF NOT EXISTS "Referral_referredPremium_idx" ON "Referral"("referredPremium");

-- Verify tables were created
SELECT
    'UserStreak' as table_name,
    COUNT(*) as row_count
FROM "UserStreak"
UNION ALL
SELECT 'DailyChallenge', COUNT(*) FROM "DailyChallenge"
UNION ALL
SELECT 'DailyChallengeCompletion', COUNT(*) FROM "DailyChallengeCompletion"
UNION ALL
SELECT 'TradingDuel', COUNT(*) FROM "TradingDuel"
UNION ALL
SELECT 'VirtualTrade', COUNT(*) FROM "VirtualTrade"
UNION ALL
SELECT 'UserAnalytics', COUNT(*) FROM "UserAnalytics"
UNION ALL
SELECT 'Achievement', COUNT(*) FROM "Achievement"
UNION ALL
SELECT 'AchievementUnlock', COUNT(*) FROM "AchievementUnlock"
UNION ALL
SELECT 'Referral', COUNT(*) FROM "Referral";
