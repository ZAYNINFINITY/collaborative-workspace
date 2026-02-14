# 📁 Project Structure Guide

**Date Created:** February 13, 2026  
**Last Updated:** February 13, 2026

## 🎯 Overview

The Collaborative Workspace project follows a clean, organized folder structure that separates concerns and improves maintainability.

```
collaborative-workspace/
├── 📂 backend/                          ← Express.js backend server
│   ├── config/                          ← Configuration files (Passport.js, etc.)
│   ├── controllers/                     ← Request handlers
│   ├── middleware/                      ← Custom middleware
│   ├── models/                          ← MongoDB Mongoose models
│   ├── routes/                          ← API endpoint definitions
│   ├── services/                        ← Business logic (Email, etc.)
│   ├── tests/                           ← Backend test files
│   ├── .env                             ← Local environment variables (gitignored)
│   ├── .env.example                     ← Environment template
│   ├── server.js                        ← Express server entry point
│   ├── package.json                     ← Backend dependencies
│   └── test-realtime.js                 ← Real-time tests
│
├── 📂 frontend/                         ← React.js frontend application
│   ├── public/                          ← Static files (favicon, robots.txt)
│   ├── src/
│   │   ├── api.js                       ← API client & HTTP utilities
│   │   ├── socket.js                    ← Socket.io client
│   │   ├── App.js                       ← Root React component
│   │   ├── App.css                      ← App-level styles
│   │   ├── index.js                     ← React entry point
│   │   ├── index.css                    ← Global styles (design tokens, animations)
│   │   ├── assets/                      ← Images, icons, static media
│   │   ├── components/                  ← Reusable React components
│   │   │   ├── ChatRoom.jsx
│   │   │   ├── DocumentEditor.jsx
│   │   │   ├── KanbanBoard.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TeamManagement.jsx
│   │   │   ├── UserPresence.jsx
│   │   │   └── dashboard/               ← Dashboard widget components
│   │   │       ├── ActivityFeed.jsx
│   │   │       ├── ChatPreviewWidget.jsx
│   │   │       ├── DeadlineWidget.jsx
│   │   │       ├── FileUploadsWidget.jsx
│   │   │       ├── MembersWidget.jsx
│   │   │       └── ProgressWidget.jsx
│   │   └── pages/                       ← Full page components (routes)
│   │       ├── Dashboard.jsx
│   │       ├── InvitationHandler.jsx
│   │       ├── Login.jsx
│   │       ├── Repositories.jsx
│   │       ├── Workspace.jsx
│   │       └── Workspaces.jsx
│   ├── build/                           ← Production build output (generated)
│   ├── package.json                     ← Frontend dependencies
│   └── README.md                        ← Frontend setup guide
│
├── 📂 docs/                             ← Project documentation (setup: Feb 13, 2026)
│   ├── GEMINI_DESIGN_SYSTEM.md          ← Design tokens & system specs
│   ├── GEMINI_IMPLEMENTATION.md         ← Implementation guidelines
│   ├── GEMINI_QUICKSTART.md             ← Quick start guide
│   ├── GEMINI_COMPLETION_STATUS.md      ← Phases 1-6 completion status
│   ├── UI_ENHANCEMENT_PLAN.md           ← Current enhancements roadmap
│   ├── UI_UX_IMPLEMENTATION_GUIDE.md    ← Detailed component changes
│   ├── UI_UX_PACKAGE_SUMMARY.md         ← Package & feature summary
│   ├── QUICK_REFERENCE.md               ← Quick commands & shortcuts
│   └── WORKSPACE_CLEANUP_SUMMARY.md     ← Cleanup changes (30 files removed)
│
├── 📂 scripts/                          ← Utility scripts (setup: Feb 13, 2026)
│   └── start-dev.bat                    ← Batch script to start servers
│
├── 📂 .git/                             ← Git repository files
│
├── 📂 node_modules/                     ← Root dependencies (concurrently, wait-on)
│
├── .gitignore                           ← Git ignore rules
├── .gitattributes                       ← Git attributes
├── package.json                         ← Root package manager (mono-repo orchestration)
├── package-lock.json                    ← Locked dependency versions
├── README.md                            ← Main project documentation
└── TODO.md                              ← Active task list
```

---

## 📚 Folder Purposes

### `backend/` - Node.js/Express Server

**Purpose:** RESTful API server and real-time WebSocket server

**Key Files:**

- `server.js` - Express app, Socket.io setup, MongoDB connection
- `config/passport.js` - OAuth strategies (GitHub, Google)
- `controllers/` - Request/response handlers (auth, workspaces, activities)
- `models/` - Mongoose schemas (User, Workspace, Task, Document, etc.)
- `routes/` - API endpoint definitions (`/api/auth`, `/api/workspaces`, etc.)
- `services/` - Email service, business logic
- `middleware/` - Custom auth middleware

**Key Technologies:**

- Express.js - Web framework
- MongoDB - Database (via Mongoose ODM)
- Socket.io - Real-time messaging
- Passport.js - Authentication
- Nodemailer - Email service

---

### `frontend/` - React Web Application

**Purpose:** Single Page Application (SPA) with real-time collaboration

**Key Files:**

- `src/index.js` - React root entry point
- `src/App.js` - Root component with routing
- `src/api.js` - API client (axios instance)
- `src/socket.js` - Socket.io client setup
- `src/index.css` - Global design system (CSS variables, animations)
- `src/components/` - Reusable UI components
- `src/pages/` - Full-page components (routed views)
- `build/` - Production build output (generated by `npm run build`)

**Key Technologies:**

- React - UI library
- Chakra UI - Component library
- React Router - Client-side routing
- Socket.io - Real-time communication
- @hello-pangea/dnd - Drag-and-drop
- react-icons - Icon library

---

### `docs/` - Documentation (NEW)

**Purpose:** All project documentation, guides, and technical specifications

**Contents:**

- Design system & implementation guides
- Quick start & reference guides
- Component specifications
- Enhancement roadmap
- Cleanup change log

**Note:** All files in `docs/` are reference documentation. The actual implementation is in `backend/` and `frontend/`.

---

### `scripts/` - Utility Scripts (NEW)

**Purpose:** Helper scripts for development and deployment

**Contents:**

- `start-dev.bat` - Starts both backend (port 5000) and frontend (port 3000)

---

## 🔒 Sensitive Data Locations

**DO NOT commit these files to git:**

- `backend/.env` - Contains MongoDB URI, OAuth secrets, API keys
- `.env` (root level, if present) - Environment variables
- `credentials.json` - OAuth credentials (if present)

**These are protected by `.gitignore`** ✅

---

## 🚀 Development Workflow

### Prerequisites

```bash
Node.js 18+
MongoDB Atlas account (or local MongoDB)
GitHub/Google OAuth apps (for authentication)
```

### Installation

```bash
# Install all dependencies (root + backend + frontend)
npm run install-all

# Or manually:
npm install                    # Root dependencies
cd backend && npm install      # Backend dependencies
cd ../frontend && npm install  # Frontend dependencies
```

### Running Locally

**Option 1: Using root script**

```bash
npm run dev
# or
npm run start
```

**Option 2: Using batch script (Windows)**

```bash
./scripts/start-dev.bat
```

**Option 3: Manually**

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend (waits for backend health check)
cd frontend
npm start
```

### Build for Production

```bash
# Frontend build
cd frontend
npm run build

# Backend: Copy everything to deployment environment
# No build needed (Node.js runs JS directly)
```

### Run Tests

```bash
# Root level: would test both if configured
npm test

# Frontend only
cd frontend
npm test

# Backend only
cd backend
npm test
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌──────────────────────────────────────────────────────────┐
│              frontend/ (React SPA)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ React Components (pages/, components/)           │   │
│  │ - Dashboard, ChatRoom, KanbanBoard, etc.         │   │
│  └──────────────────────────────────────────────────┘   │
│         │ API calls      │ Real-time events            │
│         ▼                ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ api.js (axios)  │ socket.js (Socket.io)        │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                │                    │
────────────────┼────────────────────┼──────────────────────
                │ REST API           │ WebSocket
                ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│             backend/ (Express Server)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ routes/ (API endpoints)                          │   │
│  │ - /api/auth, /api/workspaces, /api/activities   │   │
│  └──────────────────────────────────────────────────┘   │
│         │ Authenticate & Authorize                      │
│         ▼                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ controllers/ (Request handlers)                  │   │
│  │ middleware/ (Auth, CORS, etc.)                  │   │
│  │ services/ (Email, business logic)               │   │
│  └──────────────────────────────────────────────────┘   │
│         │ CRUD operations                              │
│         ▼                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ models/ (Mongoose schemas)                       │   │
│  │ - User, Workspace, Task, Document, etc.         │   │
│  └──────────────────────────────────────────────────┘   │
│         │ Database queries                             │
│         ▼                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Socket.io Server (Real-time sync)               │   │
│  │ - Chat messages, document edits, cursors, etc.  │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                          │
                          │ Database queries
                          ▼
┌──────────────────────────────────────────────────────────┐
│            MongoDB Atlas (Cloud Database)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Collections: users, workspaces, tasks, etc.     │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 🔗 Path & Import Guidelines

### Relative Paths (Safe to Move)

- Markdown documentation files in `docs/` have no code dependencies ✅
- These can be reorganized without breaking anything

### Hardcoded Paths (Don't Change)

- Environment variables in `backend/.env` reference absolute MongoDB URI
- Socket.io namespace paths in code: `socket.to('workspace:${id}')`
- API base URL in `frontend/src/api.js`: `http://localhost:5000`

### Sensitive Files (Don't Move)

- `.env` files must stay in their respective folders (backend/)
- These contain secrets that shouldn't be exposed

---

## ✅ Post-Reorganization Checklist

- ✅ Documentation moved to `docs/`
- ✅ Scripts moved to `scripts/`
- ✅ Backend folder unchanged (no path breaks)
- ✅ Frontend folder unchanged (no path breaks)
- ✅ Environment files remain in `backend/`
- ✅ README.md stays at root for visibility
- ✅ TODO.md stays at root for active task tracking
- ✅ Frontend build succeeds (264.84 kB gzipped)
- ✅ No code imports broken
- ✅ No database connection affected
- ✅ No API paths changed

---

## 📝 Documentation Index

**Quick Navigation:**

1. **Getting Started** → `docs/GEMINI_QUICKSTART.md`
2. **Design System** → `docs/GEMINI_DESIGN_SYSTEM.md`
3. **Implementation** → `docs/GEMINI_IMPLEMENTATION.md`
4. **Quick Commands** → `docs/QUICK_REFERENCE.md`
5. **Current Tasks** → Top-level `TODO.md`

---

## 🎓 Learning the Codebase

**For Frontend Developers:**

1. Start in `frontend/src/App.js`
2. Read `frontend/src/index.css` (design system)
3. Explore `frontend/src/pages/` (routed components)
4. Study `frontend/src/components/` (reusable UI)
5. Check `frontend/src/api.js` (backend communication)

**For Backend Developers:**

1. Start in `backend/server.js`
2. Read `backend/routes/` (API endpoints)
3. Study `backend/controllers/` (business logic)
4. Explore `backend/models/` (data structures)
5. Check Socket.io events in `server.js`

**For DevOps/Deployment:**

1. Review `docs/` for architecture overview
2. Check `backend/.env.example` for required variables
3. Run `scripts/start-dev.bat` or `npm run dev` locally
4. Follow `docs/QUICK_REFERENCE.md` for deployment steps

---

## 🆘 Troubleshooting Structure Issues

| Issue                    | Path                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| "Module not found" error | Check `backend/package.json` or `frontend/package.json` dependencies |
| API connection fails     | Verify `backend/server.js` port 5000 is running                      |
| Socket.io events missing | Check Socket.io namespace in `backend/server.js`                     |
| Build fails              | Run `npm run install-all` to fresh install all deps                  |
| Styles not loading       | Check `/frontend/src/index.css` and component CSS imports            |

---

## 📈 Future Improvements

Potential structure enhancements:

- Add `.github/workflows/` for CI/CD pipelines
- Add `config/` folder for shared configuration
- Add `utils/` folder for shared utilities across backend/frontend
- Add `tests/integration/` for integration tests
- Add `docker/` folder for Docker configurations

---

**Last Verified:** February 13, 2026 | Build: ✅ Success
