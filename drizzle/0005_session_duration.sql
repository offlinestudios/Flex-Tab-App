-- Migration: add durationSeconds to workout_sessions
-- Nullable so existing rows are unaffected
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS "durationSeconds" integer;
