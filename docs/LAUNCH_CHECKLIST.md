# Launch & Deployment Checklist (Vercel + Railway)

## Domain & SSL
- Custom domain configured on Vercel (frontend).
- Backend domain configured (Railway) and allowed in CORS allowlist.
- HSTS enabled (via platform or headers), verify HTTPS-only.

## Environment Variables (Production)
- `MONGO_URI` (prod cluster), backups enabled
- `SESSION_SECRET` / JWT secrets rotated and stored in platform secrets
- OAuth:
  - `GITHUB_CLIENT_ID/SECRET`
  - `GOOGLE_CLIENT_ID/SECRET`
  - callback URLs verified for production origins
- AI (optional):
  - `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
  - model pinned via `*_MODEL`
- Email (if enabled): SMTP creds + sender domain

## Security
- CORS allowlist contains only production origins.
- CSRF configured and verified in production.
- Rate limits tuned (auth stricter than general API).
- Cookie flags: `Secure`, `HttpOnly`, `SameSite` validated.

## Observability
- Error monitoring (frontend + backend).
- Log drain or centralized logs.
- Uptime checks for `/api/health` and frontend `/`.

## Performance
- Static assets cached (`Cache-Control` immutable).
- Bundle analysis (remove unused deps).
- Verify socket.io path rewrites work in production.

## Legal/Trust
- Publish `/privacy` and `/terms`.
- Add `/security` page with accurate posture.

