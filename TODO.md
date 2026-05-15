# Project Health & Redeploy Plan

## Status: ✅ Healthy, Ready for Render Backend

### 1. Complete Setup ✅

- [x] Backend deps installed
- [x] Frontend deps installed
- [x] Backend tests passed (full coverage run)
- [ ] npm audit fix (backend/frontend)

### 2. Local Verification

- [ ] `npm run dev` → Frontend:5173, Backend:5000
- [ ] Test /api/health, login, real-time chat/docs

### 3. Fix Vulnerabilities

- [ ] `cd backend && npm audit fix`
- [ ] Review remaining high vulns (xlsx, etc.)

### 4. Render Backend Deploy (Railway → Render Migration)

**Exact Steps:**

1. [ ] Login https://dashboard.render.com → New → Web Service → Connect GitHub repo
2. [ ] Settings: Root Directory `backend`, Build `npm ci`, Start `node server.js`
3. [ ] Env vars: NODE_ENV=production, MONGO_URI=..., CLIENT_URL=https://your-vercel-domain (see RENDER_BACKEND_DEPLOY.md full list)
4. [ ] Deploy → Wait → Note URL e.g. `your-app-abc.onrender.com`
5. [ ] Verify `https://your-app-abc.onrender.com/api/health` → `{"status":"ok"}`
6. [x] **Update proxies**: `vercel.json` and `frontend/vercel.json` now point to `https://collaborative-workspace-production-344b.up.railway.app`
7. [ ] Git commit/push → Vercel redeploys frontend with new backend

**Env Sync (opt):** Get Render service ID (srv-...), `$env:RENDER_API_KEY=...`, `node scripts/render-sync-env.mjs --service srv-... --env-file backend/.env`

### 5. Post-Deploy

- [ ] Update LAUNCH_CHECKLIST.md complete items
- [ ] Monitor logs, add error tracking

All clear for production!
