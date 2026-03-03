-- Migration: 0002_community_tables
-- Adds posts, post_media, post_likes, and post_comments tables for the community feed

CREATE TABLE IF NOT EXISTS "posts" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" integer NOT NULL,
  "caption" text,
  "workoutSessionId" integer,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "post_media" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "postId" integer NOT NULL,
  "userId" integer NOT NULL,
  "r2Key" text NOT NULL,
  "mediaType" varchar(10) NOT NULL,
  "mimeType" varchar(64) NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "post_likes" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "postId" integer NOT NULL,
  "userId" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  UNIQUE ("postId", "userId")
);

CREATE TABLE IF NOT EXISTS "post_comments" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "postId" integer NOT NULL,
  "userId" integer NOT NULL,
  "body" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Indexes for efficient feed and comment queries
CREATE INDEX IF NOT EXISTS "posts_userId_idx" ON "posts" ("userId");
CREATE INDEX IF NOT EXISTS "posts_createdAt_idx" ON "posts" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "post_media_postId_idx" ON "post_media" ("postId");
CREATE INDEX IF NOT EXISTS "post_likes_postId_idx" ON "post_likes" ("postId");
CREATE INDEX IF NOT EXISTS "post_comments_postId_idx" ON "post_comments" ("postId");
