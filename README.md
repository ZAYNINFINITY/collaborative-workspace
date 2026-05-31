# 🚀 Collaborative Workspace

<p align="center">
  <a href="https://github.com/ZAYNINFINITY/collaborative-workspace">
    <img src="https://img.shields.io/github/stars/ZAYNINFINITY/collaborative-workspace?style=flat&color=00D9FF" alt="Stars">
  </a>
  <a href="https://github.com/ZAYNINFINITY/collaborative-workspace">
    <img src="https://img.shields.io/github/forks/ZAYNINFINITY/collaborative-workspace?style=flat&color=FF6B6B" alt="Forks">
  </a>
  <a href="https://github.com/ZAYNINFINITY/collaborative-workspace/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/ZAYNINFINITY/collaborative-workspace?style=flat&color=4ADE80" alt="License">
  </a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=180&section=header&text=Collaborative%20Workspace&fontSize=50&animation=fadeIn&fontAlignY=28" />
</p>

A modern, real-time collaborative productivity platform with glassmorphic UI design.

---

## ✨ Features

- 💬 Real-time chat with Socket.io
- 📄 Document collaboration with live cursor
- 📋 Kanban board with drag-and-drop
- 👥 Team management & invitations
- 🔐 OAuth 2.0 authentication (GitHub, Google)

## 🛠 Tech Stack

| Frontend     | Backend     |
| ------------ | ----------- |
| React 18     | Node.js     |
| Chakra UI    | Express     |
| Socket.io    | MongoDB     |
| React Router | Passport.js |

## 🚦 Quick Start

```
bash
# Clone
git clone https://github.com/ZAYNINFINITY/collaborative-workspace.git
cd collaborative-workspace

# Install
npm run install-all

# Setup .env (backend/.env)
MONGO_URI=your-mongodb-uri
SESSION_SECRET=your-secret
CLIENT_URL=http://localhost:5173
# Frontend (Vite): set either VITE_API_BASE_URL or REACT_APP_API_BASE_URL
VITE_API_BASE_URL=http://localhost:5000/api
REACT_APP_API_BASE_URL=http://localhost:5000/api

# OAuth callbacks (recommended)
# Set SERVER_URL to your backend public URL (Railway/Render/etc.)
# Then register callbacks like: https://your-backend.example.com/api/auth/github/callback
# If you reverse-proxy `/api/*` on your frontend domain, set OAUTH_PUBLIC_BASE_URL to that origin.
SERVER_URL=http://localhost:5000
OAUTH_PUBLIC_BASE_URL=http://localhost:5000

# Run
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Security note

Never commit or share `.env` files. If you accidentally exposed any secrets (MongoDB URI, OAuth client secrets, SMTP passwords), rotate them immediately.

## 🚀 Deployment Notes

- This repo is configured for split deployment:
  - **Frontend:** static build (e.g. [Vercel](https://vercel.com)) — see root `vercel.json` and `frontend/vercel.json`
  - **Backend + Socket.io:** Node host (e.g. [Railway](https://railway.app))
- **API proxy:** Both `vercel.json` files rewrite `/api/*` and `/socket.io/*` to the Railway backend so the browser can use **same-origin** `/api` (cookies + CSRF). The production app uses relativ[...]
- **Vercel Root Directory:** If the project's root is set to `frontend`, only `frontend/vercel.json` is applied — that file is included so rewrites still work. If the root is the repo root, th[...]
- After deploy, verify: `https://<your-vercel-domain>/api/health` should return `{"status":"ok"}` (proxied to the backend).

## 📁 Structure

```
├── backend/       # Express API + Socket.io
├── frontend/      # React SPA
└── scripts/       # Utility scripts
```

## 🧭 Product Audit & Roadmap (new)

If you're improving completeness/UX and getting to production readiness, start here:

- `docs/PRODUCT_AUDIT.md`
- `docs/ROADMAP.md`
- `docs/WIREFRAMES.md`
- `docs/TESTING_STRATEGY.md`
- `docs/LAUNCH_CHECKLIST.md`
- `docs/RENDER_BACKEND_DEPLOY.md`

## 📝 License

MIT License
