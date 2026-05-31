# Collaborative Workspace

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

A modern, real-time collaborative workspace platform where teams chat, edit, and build together seamlessly in one place.

---

## ✨ Core Features

- **Real-time Chat** — Instant messaging with Socket.io
- **Live Document Collaboration** — Edit together with live cursors
- **Kanban Boards** — Organize work with drag-and-drop tasks
- **Team Management** — Invite and manage teammates
- **Secure Authentication** — OAuth 2.0 integration (GitHub, Google)

## 🚀 Get Started

### Installation

```bash
git clone https://github.com/ZAYNINFINITY/collaborative-workspace.git
cd collaborative-workspace
npm run install-all
```

### Configuration

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=your-mongodb-connection-string
SESSION_SECRET=your-session-secret
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
SERVER_URL=http://localhost:5000
```

For OAuth setup, register your app callbacks with your GitHub/Google app settings.

### Run Locally

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

---

## 🌐 Deploy to Production

This repo supports split deployment:

- **Frontend** → Vercel (static hosting)
- **Backend** → Railway or similar Node.js host

The included deployment configs automatically proxy API requests, so your frontend can use relative URLs with full cookie support.

**Verify deployment:**
```bash
curl https://your-domain.com/api/health
```

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, Chakra UI, Socket.io, Vite |
| Backend | Node.js, Express, MongoDB, Passport.js |

---

## 📚 Documentation

For in-depth guides on production readiness, testing, and deployment strategies, see the [docs](./docs) folder.

---

## 🔒 Security

Never commit `.env` files. If you expose credentials, rotate them immediately.

---

## 📄 License

MIT