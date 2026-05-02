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
- Letter data is stored through the API/database. The browser keeps only draft text and edit tokens for letters created from that browser.

## Database Prep

Database setup files are in [database/](database/):

- `database/001_create_letters.sql`
- `database/002_add_letter_music.sql`
- `database/README.md`

Copy `.env.example` to `.env.local` for local API testing later, or add the same variables in Vercel Dashboard.

## API Backend

Vercel serverless API files live in [api/](api/):

- `GET /api/letters`
- `POST /api/letters`
- `GET /api/letters/:id`
- `PATCH /api/letters/:id`
- `DELETE /api/letters/:id`

`POST` returns an `editToken` once and stores only its hash. Use that token for `PATCH` and `DELETE` through one of these options:

- Header: `X-Edit-Token: <token>`
- Query string: `?token=<token>`
- JSON body: `"editToken": "<token>"`

The frontend now calls these API endpoints directly. `localStorage` is used for draft recovery and locally held edit tokens, not as the source of letter data.

Letter payloads support optional background music fields:

- `musicId`
- `musicTitle`
- `musicUrl`

After creating a letter, the UI shows:

- a public view link
- a private edit link containing the edit token

Keep the private edit link restricted. Anyone with it can edit or delete that letter.

## Music Assets

MP3 background tracks live in [musics/](musics/). The track manifest is:

- `musics/tracks.json`

Each track should have a stable `id`, display `title`, optional `artist`, original `file`, and public `url`. Future letter records can store the selected track by `musicId`/`musicUrl`.
