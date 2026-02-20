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
CLIENT_URL=http://localhost:3000

# Run
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📁 Structure

```
├── backend/       # Express API + Socket.io
├── frontend/      # React SPA
├── docs/          # Documentation
└── scripts/      # Utility scripts
```

## 📝 License

MIT License
