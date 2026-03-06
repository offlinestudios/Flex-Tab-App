-- Migration: 0003_user_avatar
-- Adds avatarUrl column to users table for storing R2 profile photo URL
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" text;
