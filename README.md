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
  - Frontend: static build (for example Vercel)
  - Backend + Socket.io: separate Node host (for example Render/Railway/Fly)
- `vercel.json` intentionally returns `503` for `/api/*` and `/socket.io/*` on the frontend deployment.
- Point frontend API calls to your backend with `REACT_APP_API_BASE_URL`.

## 📁 Structure

```
├── backend/       # Express API + Socket.io
├── frontend/      # React SPA
└── scripts/       # Utility scripts
```

## 📝 License

MIT License
