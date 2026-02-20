# 🚀 Collaborative Workspace

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=30&color=00D9FF&center=true&vCenter=true&width=450&lines=Real-Time+Collaboration;Document+Editing;Task+Management;Team+Productivity" alt="Typing SVG" />
</p>

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
  <img src="https://img.shields.io/badge/MongoDB-4.33A94?style=flat&logo=mongodb&color=47A248" alt="MongoDB">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react&color=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&color=339933" alt="Node.js">
</p>

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=300&section=header&text=Collaborative%20Workspace&fontSize=80&animation=fadeIn&fontAlignY=35" />
</p>

<div align="center">

![Hero Animation](https://raw.githubusercontent.com/ZAYNINFINITY/collaborative-workspace/main/docs/assets/hero.gif)

**A modern, real-time collaborative productivity platform with stunning glassmorphic UI design**

[🚀 Live Demo](#) · [📖 Documentation](#) · [🐛 Report Bug](#) · [💡 Request Feature](#)

</div>

---

## ✨ Features

<div align="center">

|            Feature            | Description                                                        |
| :---------------------------: | :----------------------------------------------------------------- |
|     💬 **Real-Time Chat**     | Instant messaging with Socket.io, typing indicators, read receipts |
| 📄 **Document Collaboration** | Live document editing with cursor tracking & presence              |
|      📋 **Kanban Board**      | Drag-and-drop task management with priorities & deadlines          |
|    👥 **Team Management**     | Invite members, roles & permissions, activity tracking             |
|     🔔 **Notifications**      | Real-time alerts for messages, tasks, and updates                  |
|      🔐 **Secure Auth**       | OAuth 2.0 (GitHub, Google) + session management                    |

</div>

---

## 🛠 Tech Stack

<div align="center">

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Chakra UI](https://img.shields.io/badge/Chakra_UI-319795?style=for-the-badge&logo=chakra-ui&logoColor=319795)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=CA4245)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=339933)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=47A248)
![Passport.js](https://img.shields.io/badge/Passport.js-34E27E?style=for-the-badge&logo=passport&logoColor=34E27E)

### DevOps

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=F05032)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=CB3837)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---

## 🚦 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- **MongoDB Atlas** account (free tier)
- **GitHub/Google OAuth Apps**

### Installation

```
bash
# Clone the repository
git clone https://github.com/ZAYNINFINITY/collaborative-workspace.git
cd collaborative-workspace

# Install all dependencies
npm run install-all
```

### Environment Setup

Create `backend/.env`:

```
env
MONGO_URI=your-mongodb-connection-string
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
GITHUB_CLIENT_ID=your-github-app-id
GITHUB_CLIENT_SECRET=your-github-app-secret
GOOGLE_CLIENT_ID=your-google-app-id
GOOGLE_CLIENT_SECRET=your-google-app-secret
CLIENT_URL=http://localhost:3000
```

### Run Development Server

```
bash
npm run dev
```

| Service         | URL                              |
| :-------------- | :------------------------------- |
| 🌐 Frontend     | http://localhost:3000            |
| ⚙️ Backend API  | http://localhost:5000            |
| 💚 Health Check | http://localhost:5000/api/health |

---

## 📁 Project Structure

```
collaborative-workspace/
├── 📂 backend/              # Express.js API + Socket.io
│   ├── 📂 config/          # Passport config
│   ├── 📂 controllers/     # Route controllers
│   ├── 📂 middleware/      # Auth, CSRF, rate limiting
│   ├── 📂 models/          # Mongoose schemas
│   ├── 📂 routes/          # API routes
│   ├── 📂 services/        # Email, utilities
│   └── 📂 tests/           # Jest tests
├── 📂 frontend/            # React SPA
│   ├── 📂 src/
│   │   ├── 📂 components/  # Reusable components
│   │   ├── 📂 pages/      # Route pages
│   │   ├── 📂 assets/     # Images, icons
│   │   ├── api.js         # Axios instance
│   │   └── socket.js      # Socket.io client
│   └── public/            # Static assets
├── 📂 docs/                # Documentation
├── 📂 scripts/             # Utility scripts
└── 📄 README.md           # This file
```

---

## 📊 API Endpoints

### Authentication

| Method | Endpoint           | Description      |
| :----: | :----------------- | :--------------- |
|  GET   | `/api/auth/github` | GitHub OAuth     |
|  GET   | `/api/auth/google` | Google OAuth     |
|  GET   | `/api/auth/user`   | Get current user |
|  GET   | `/api/auth/logout` | Logout           |

### Workspaces

| Method | Endpoint              | Description      |
| :----: | :-------------------- | :--------------- |
|  GET   | `/api/workspaces`     | List workspaces  |
|  POST  | `/api/workspaces`     | Create workspace |
|  GET   | `/api/workspaces/:id` | Get details      |
|  PUT   | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |

### Activities

| Method | Endpoint                       | Description          |
| :----: | :----------------------------- | :------------------- |
|  GET   | `/api/activities`              | List activities      |
|  GET   | `/api/activities/:workspaceId` | Workspace activities |

---

## 🎨 Design System

<div align="center">

### Color Palette

| Color        | Hex       | Usage               |
| :----------- | :-------- | :------------------ |
| 🔵 Primary   | `#00D9FF` | Accents, links      |
| 🟣 Secondary | `#8B5CF6` | Buttons, highlights |
| 🟢 Success   | `#4ADE80` | Success states      |
| 🔴 Error     | `#FF6B6B` | Error states        |
| ⚫ Dark      | `#0F0F23` | Background          |
| 🔘 Surface   | `#1A1A2E` | Cards, panels       |

### Typography

| Element  | Font      | Size    |
| :------- | :-------- | :------ |
| Headings | Inter     | 24-48px |
| Body     | Inter     | 14-16px |
| Code     | Fira Code | 13px    |

</div>

---

## 🧪 Testing

```
bash
# All tests
npm test

# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## 📈 Development Status

### ✅ Completed

- [x] Real-time chat with Socket.io
- [x] Document collaboration
- [x] Kanban board with drag-and-drop
- [x] Team management & invitations
- [x] OAuth authentication
- [x] Activity feeds
- [x] Responsive design
- [x] Glassmorphic UI

### 🔄 In Progress

- [ ] Enhanced dashboard widgets
- [ ] Advanced search

### 📅 Planned

- [ ] Video/voice chat
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard

---

## 🤝 Contributing

```
bash
# Fork the repo
# Create your branch
git checkout -b feature/amazing-feature

# Commit and push
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature

# Open Pull Request
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙋 Support

- 📬 Issues: [GitHub Issues](https://github.com/ZAYNINFINITY/collaborative-workspace/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/ZAYNINFINITY/collaborative-workspace/discussions)

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=footer)

**Built with ❤️ by [ZAYNINFINITY](https://github.com/ZAYNINFINITY)**

⭐ Star us on [GitHub](https://github.com/ZAYNINFINITY/collaborative-workspace) | 🐦 Follow us on [Twitter](#)

</div>

---

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=ZAYNINFINITY&repo=collaborative-workspace&label=Profile%20Views&color=00D9FF&style=flat" alt="Profile Views">
</p>
