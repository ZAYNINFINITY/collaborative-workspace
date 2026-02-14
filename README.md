# 🚀 Collaborative Workspace

A modern, real-time collaborative productivity platform with glasmorphic UI design, featuring real-time messaging, document collaboration, task management, and team collaboration tools.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-active-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20updated-Feb%202026-blue)

## 📚 Quick Navigation

- **📖 [Project Structure Guide](PROJECT_STRUCTURE.md)** - Complete folder organization
- **🎨 [Design System](docs/GEMINI_DESIGN_SYSTEM.md)** - Colors, typography, animations
- **⚡ [Quick Start](docs/GEMINI_QUICKSTART.md)** - Get running in 5 minutes
- **📋 [Active Tasks](TODO.md)** - Current work in progress
- **⚙️ [Quick Reference](docs/QUICK_REFERENCE.md)** - Commands & shortcuts

## 🎯 Features

✨ **Real-Time Collaboration**

- Live chat messaging with Socket.io
- Real-time document editing with cursor tracking
- Live user presence indicators
- Instant task updates across team

🎨 **Modern UI/UX (Gemini Design)**

- Glasmorphic dark theme
- Smooth micro-animations
- Responsive design
- Accessibility-first approach

📊 **Productivity Tools**

- Kanban board with drag-and-drop
- Task management with priorities & deadlines
- Document editor with real-time sync
- Activity feed & notifications
- Team member management

🔐 **Security & Auth**

- OAuth 2.0 (GitHub, Google)
- Session management
- Secure API endpoints
- Password hashing with bcryptjs

## 🛠 Tech Stack

**Frontend:**

- React 17+ with Chakra UI
- Socket.io for real-time updates
- React Router for navigation
- @hello-pangea/dnd for drag-and-drop
- CSS-in-JS with design tokens

**Backend:**

- Node.js + Express
- MongoDB with Mongoose ODM
- Socket.io for WebSocket communication
- Passport.js for authentication
- Nodemailer for email notifications

**DevOps:**

- Git for version control
- npm for package management
- Environment-based configuration (.env)

## ⚡ Getting Started

### Prerequisites

- **Node.js** 18.20.8 or higher
- **npm** 9.6.7 or higher
- **MongoDB** Atlas account (free tier available)
- **GitHub/Google OAuth Apps** (for authentication)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ZAYNINFINITY/collaborative-workspace.git
cd collaborative-workspace
```

2. **Install all dependencies**

```bash
npm run install-all
# Or manually:
npm install && cd backend && npm install && cd ../frontend && npm install
```

3. **Setup environment variables**

**Backend** (`backend/.env`):

```env
MONGO_URI=your-mongodb-connection-string
SESSION_SECRET=your-secret-session-key
GITHUB_CLIENT_ID=your-github-app-id
GITHUB_CLIENT_SECRET=your-github-app-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
GOOGLE_CLIENT_ID=your-google-app-id
GOOGLE_CLIENT_SECRET=your-google-app-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
PORT=5000
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
```

4. **Start the servers**

Using npm:

```bash
npm run dev
# or
npm run start
```

Using batch script (Windows):

```bash
./scripts/start-dev.bat
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

---

## 📂 Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete folder organization and architecture.

**Quick Overview:**

```
collaborative-workspace/
├── backend/           ← Express.js REST API & Socket.io
├── frontend/          ← React SPA with Chakra UI
├── docs/              ← Documentation (design, guides, specs)
├── scripts/           ← Utility scripts
├── README.md          ← This file
├── TODO.md            ← Active task list
└── PROJECT_STRUCTURE.md ← Detailed folder guide
```

---

## 🌐 API Endpoints

### Authentication

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| GET    | `/api/auth/github` | GitHub OAuth login |
| GET    | `/api/auth/google` | Google OAuth login |
| GET    | `/api/auth/logout` | Logout user        |
| GET    | `/api/auth/user`   | Get current user   |

### Workspaces

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| GET    | `/api/workspaces`     | List all workspaces   |
| POST   | `/api/workspaces`     | Create workspace      |
| GET    | `/api/workspaces/:id` | Get workspace details |
| PUT    | `/api/workspaces/:id` | Update workspace      |
| DELETE | `/api/workspaces/:id` | Delete workspace      |

### Activities

| Method | Endpoint                       | Description              |
| ------ | ------------------------------ | ------------------------ |
| GET    | `/api/activities`              | List activities          |
| GET    | `/api/activities/:workspaceId` | Get workspace activities |

### Health Check

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| GET    | `/api/health` | Server status check |

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB connection fails**

```
Error: Operation users.findOne() buffering timed out
```

- ✅ Solution: Ensure MONGO_URI is set correctly in `.env`
- ✅ Check MongoDB Atlas whitelist includes your IP
- ✅ Verify network connectivity to MongoDB

**Port 5000 already in use**

```bash
# Change port in backend/.env
PORT=5001
```

**OAuth secrets not working**

- ✅ Verify GitHub/Google app credentials are correct
- ✅ Check redirect URLs match `GITHUB_CALLBACK_URL` and `GOOGLE_CALLBACK_URL`
- ✅ Ensure apps are properly configured in GitHub/Google Developer Console

### Frontend Issues

**Socket.io connection fails**

```
Socket will auto-reconnect if the connection is lost
```

- ✅ Verify backend is running on port 5000
- ✅ Check `frontend/src/socket.js` connection URL
- ✅ Ensure CORS is enabled in `backend/server.js`

**Styles not loading**

- ✅ Run `npm run build` in frontend directory
- ✅ Check if `src/index.css` is imported in `src/index.js`
- ✅ Verify Chakra UI is installed: `npm ls @chakra-ui/react`

**Build fails**

```bash
cd frontend
npm cache clean --force
rm -rf node_modules
npm install
npm run build
```

---

## 🧪 Testing

**Run all tests:**

```bash
npm test
```

**Backend tests:**

```bash
cd backend
npm test
```

**Frontend tests:**

```bash
cd frontend
npm test
```

---

## 📖 Documentation

For detailed information, see:

- **[GEMINI_DESIGN_SYSTEM.md](docs/GEMINI_DESIGN_SYSTEM.md)** - Complete design system with tokens
- **[GEMINI_IMPLEMENTATION.md](docs/GEMINI_IMPLEMENTATION.md)** - Implementation guidelines
- **[GEMINI_QUICKSTART.md](docs/GEMINI_QUICKSTART.md)** - 5-minute setup guide
- **[UI_UX_IMPLEMENTATION_GUIDE.md](docs/UI_UX_IMPLEMENTATION_GUIDE.md)** - Component code examples
- **[QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Commands & shortcuts
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Folder organization

---

## 📊 Development Status

### Completed Features ✅

- ✅ Gemini UI redesign (Phases 1-6)
- ✅ Real-time chat with Socket.io
- ✅ Document collaboration
- ✅ Kanban board with drag-and-drop
- ✅ Team management & invitations
- ✅ OAuth authentication (GitHub, Google)
- ✅ Activity feeds & notifications
- ✅ Responsive design

### Current Work 🔄

- 🔄 Enhanced dashboard widgets
- 🔄 Typing indicators for messages
- 🔄 Advanced search functionality

### Planned Features 📅

- 📅 Video/voice chat integration
- 📅 Advanced analytics & reporting
- 📅 Mobile app (React Native)
- 📅 Self-hosted deployment guides

See [TODO.md](TODO.md) for detailed task list.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Ensure no console errors/warnings

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙋 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/ZAYNINFINITY/collaborative-workspace/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ZAYNINFINITY/collaborative-workspace/discussions)
- **Email**: support@collaborativeworkspace.io

---

## 📸 Screenshots

### Dashboard

![Dashboard Preview](docs/screenshots/dashboard.png)

### Chat Room

![Chat Preview](docs/screenshots/chat.png)

### Kanban Board

![Kanban Preview](docs/screenshots/kanban.png)

### Team Management

![Team Preview](docs/screenshots/team.png)

---

## 🙏 Acknowledgments

- **Chakra UI** for component library
- **Socket.io** for real-time communication
- **Mongoose** for database ODM
- **Passport.js** for authentication
- All contributors and testers

---

## 📊 Project Statistics

- **Lines of Code**: ~5,000+
- **Components**: 15+ React components
- **API Endpoints**: 20+ REST endpoints
- **Test Coverage**: 75%+
- **Build Size**: 264.84 kB (gzipped)

---

**Last Updated**: February 13, 2026 | **Version**: 1.0.0
