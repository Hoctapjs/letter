# Dear Letters

A lightweight static web app for writing, saving, viewing, editing, and exporting letters.

## Run Locally

Static server:

```powershell
npm run dev:static
```

Open:

```text
http://localhost:5173
```

Vercel local server, requires Vercel CLI:

```powershell
npm run dev
```

The `dev`, `deploy`, and `deploy:prod` scripts expect the Vercel CLI to be available.

## Checks

```powershell
npm run check
```

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd run check
```

## Deploy To Vercel

Preview deploy:

```powershell
npm run deploy
```

Production deploy:

```powershell
npm run deploy:prod
```

## Hosting Notes

- The app currently uses hash routes such as `#/compose`, `#/wall`, and `#/letter/:id`, so it works on static hosting and IIS without rewrite rules.
- `web.config` is kept for IIS MIME/default document support.
- `vercel.json` configures static response headers for Vercel.
- Letter data is still local/browser-based until the database/API steps are implemented.

## Database Prep

Database setup files are in [database/](database/):

- `database/001_create_letters.sql`
- `database/README.md`

Copy `.env.example` to `.env.local` for local API testing later, or add the same variables in Vercel Dashboard.

## API Backend

Vercel serverless API files live in [api/](api/):

- `GET /api/letters`
- `POST /api/letters`
- `GET /api/letters/:id`
- `PATCH /api/letters/:id`
- `DELETE /api/letters/:id`

At step 8, `GET` and `POST` are database-backed through the generic `postgres` package and `DATABASE_URL`. `POST` already returns an `editToken` and stores only its hash. `PATCH` and `DELETE` exist but return a clear `501` until token verification is wired in step 9.
