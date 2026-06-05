-- Migration: Add Advanced Features Tables
-- Run this in Supabase SQL Editor

-- 1. ScoreHistory table
CREATE TABLE IF NOT EXISTS "ScoreHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "rank" INTEGER,
    "totalTrades" INTEGER NOT NULL,
    "totalVolume" DOUBLE PRECISION NOT NULL,
    "profitLoss" DOUBLE PRECISION NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "badges" INTEGER NOT NULL
);

-- Índices para ScoreHistory
CREATE INDEX IF NOT EXISTS "ScoreHistory_walletAddress_timestamp_idx" ON "ScoreHistory"("walletAddress", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "ScoreHistory_timestamp_idx" ON "ScoreHistory"("timestamp");

-- 2. UserFollows table
CREATE TABLE IF NOT EXISTS "UserFollows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "follower" TEXT NOT NULL,
    "following" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices y constraints para UserFollows
CREATE INDEX IF NOT EXISTS "UserFollows_follower_following_idx" ON "UserFollows"("follower", "following");
CREATE INDEX IF NOT EXISTS "UserFollows_following_idx" ON "UserFollows"("following");
CREATE UNIQUE INDEX IF NOT EXISTS "UserFollows_follower_following_key" ON "UserFollows"("follower", "following");

-- 3. NotificationPreferences table
CREATE TABLE IF NOT EXISTS "NotificationPreferences" (
    "walletAddress" TEXT NOT NULL PRIMARY KEY,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discordEnabled" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "telegramChatId" TEXT,
    "discordWebhook" TEXT,
    "followedTrades" BOOLEAN NOT NULL DEFAULT true,
    "milestones" BOOLEAN NOT NULL DEFAULT true,
    "challenges" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Verificar que las tablas se crearon
SELECT
    'ScoreHistory' as table_name,
    COUNT(*) as row_count
FROM "ScoreHistory"
UNION ALL
SELECT
    'UserFollows' as table_name,
    COUNT(*) as row_count
FROM "UserFollows"
UNION ALL
SELECT
    'NotificationPreferences' as table_name,
    COUNT(*) as row_count
FROM "NotificationPreferences";
