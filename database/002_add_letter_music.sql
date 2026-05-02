-- Add optional background music fields for each letter.
-- Safe to run more than once on Postgres/Neon.

ALTER TABLE letters
  ADD COLUMN IF NOT EXISTS music_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS music_title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS music_url TEXT NOT NULL DEFAULT '';
