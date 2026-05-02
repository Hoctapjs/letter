# Database Setup

This project is prepared for any Postgres-compatible provider. Recommended options for Vercel hosting:

- Neon Postgres
- Vercel-managed Postgres
- Supabase Postgres

Use `DATABASE_URL` as the single connection string so the later API layer can stay provider-neutral.

## Required Environment Variables

```text
DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require
TOKEN_SECRET=replace-with-a-long-random-secret
```

Generate a local `TOKEN_SECRET`:

```powershell
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
```

## Run The Migration

Open your database provider's SQL editor and run:

```text
database/001_create_letters.sql
database/002_add_letter_music.sql
```

The migration creates:

- `letters`
- `idx_letters_created_at`
- `idx_letters_updated_at`
- optional music columns on `letters`

## Table Shape

```text
letters
- id
- to_name
- message
- closing
- author_name
- meta
- music_id
- music_title
- music_url
- edit_token_hash
- created_at
- updated_at
```

`edit_token_hash` is required because the raw edit token should only be shown to the creator once. Later API steps will compare token hashes for edit/delete permission.

Music fields are optional and default to empty strings so existing letters continue to work without a selected MP3 track.

## Vercel Configuration

In Vercel Dashboard:

1. Open the project.
2. Go to Settings -> Environment Variables.
3. Add `DATABASE_URL`.
4. Add `TOKEN_SECRET`.
5. Redeploy the project after saving the variables.

For local development with Vercel CLI, create `.env.local` from `.env.example`. Do not commit `.env.local`.
