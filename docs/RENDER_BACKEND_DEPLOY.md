# Deploy Backend to Render (Monorepo)

This repo is a monorepo:
- Frontend: `frontend/` (Vercel static site)
- Backend: `backend/` (Express + Socket.io)

Render must be configured to run from `backend/`.

## Render service settings

Create a **Web Service** (not a Static Site).

**Root Directory:** `backend` (Render → Service → Settings → Build & Deploy → Root Directory)

**Runtime:** Node

**Build Command:** `npm ci`

**Start Command:** `node server.js`

Render sets `PORT` automatically (default `10000`).

## Required environment variables (Render)

At minimum:
- `NODE_ENV=production`
- `MONGO_URI=...` (MongoDB connection string)
- `CLIENT_URL=https://<your-vercel-domain>` (example: `https://collaborative-workspace-rosy.vercel.app`)

Recommended:
- `ALLOWED_ORIGINS=https://<your-vercel-domain>`
- `SESSION_SECRET=...` (random long secret)
- `OAUTH_PUBLIC_BASE_URL=https://<your-vercel-domain>` (keeps OAuth callbacks on the browser origin)
- `SERVER_URL=https://<your-render-domain>` (optional, if you want it explicit)

OAuth (if used):
- `GITHUB_CLIENT_ID=...`
- `GITHUB_CLIENT_SECRET=...`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`

Email (optional):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

AI (optional):
- `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY`

## GitHub OAuth callback URLs

If your frontend proxies `/api/*` to the backend (recommended), set callbacks to:
- `https://<your-vercel-domain>/api/auth/github/callback`
- `https://<your-vercel-domain>/api/auth/google/callback`

## After deploy

Verify:
- `https://<your-render-domain>/api/health` returns `{ "status": "ok" }`

Then update Vercel rewrites (repo files):
- `vercel.json`
- `frontend/vercel.json`

Replace the old backend host in both `/api/*` and `/socket.io/*` rewrites with your new Render domain.

## (Optional) Set env vars from your local `.env` via CLI

Render doesn’t currently provide a first-party `render env set` command, but you can set env vars via the Render API.
This repo includes a safe sync script that uploads **only** keys present in `backend/.env.example` (allowlist).

1) Get your Render backend service id (starts with `srv-...`) from the Render dashboard URL or `render services -o json`.
2) Run:

```bash
# Windows PowerShell
$env:RENDER_API_KEY="YOUR_RENDER_API_KEY"
node scripts/render-sync-env.mjs --service srv-XXXXXXXX --env-file backend/.env --dry-run
node scripts/render-sync-env.mjs --service srv-XXXXXXXX --env-file backend/.env --restart
```

The script never prints values—only keys in dry-run mode.
It also skips `PORT` by default (Render sets `PORT` automatically).
