-- Dear Letters database schema.
-- Run this SQL in your Postgres provider's SQL editor or migration tool.

CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  to_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  closing TEXT NOT NULL DEFAULT 'With love',
  author_name TEXT NOT NULL DEFAULT '',
  meta TEXT NOT NULL DEFAULT '',
  music_id TEXT NOT NULL DEFAULT '',
  music_title TEXT NOT NULL DEFAULT '',
  music_url TEXT NOT NULL DEFAULT '',
  edit_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_letters_created_at
  ON letters (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_letters_updated_at
  ON letters (updated_at DESC)
  WHERE updated_at IS NOT NULL;
