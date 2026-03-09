-- Migration: 0004_social_graph
-- Adds user_follows, user_blocks, and user_mutes tables for the social graph

CREATE TABLE IF NOT EXISTS "user_follows" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "followerId" integer NOT NULL,
  "followeeId" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  UNIQUE ("followerId", "followeeId")
);

CREATE TABLE IF NOT EXISTS "user_blocks" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "blockerId" integer NOT NULL,
  "blockedId" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  UNIQUE ("blockerId", "blockedId")
);

CREATE TABLE IF NOT EXISTS "user_mutes" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "muterId" integer NOT NULL,
  "mutedId" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  UNIQUE ("muterId", "mutedId")
);

-- Indexes for efficient social graph lookups
CREATE INDEX IF NOT EXISTS "user_follows_followerId_idx" ON "user_follows" ("followerId");
CREATE INDEX IF NOT EXISTS "user_follows_followeeId_idx" ON "user_follows" ("followeeId");
CREATE INDEX IF NOT EXISTS "user_blocks_blockerId_idx" ON "user_blocks" ("blockerId");
CREATE INDEX IF NOT EXISTS "user_mutes_muterId_idx" ON "user_mutes" ("muterId");
