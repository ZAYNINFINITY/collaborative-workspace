# 🎯 Project Directory Structure

## Root Level Files (Essential)

```
README.md                    ← Main project documentation
package.json                 ← Root workspace config
.gitignore                   ← Git exclusions
start-dev.bat               ← Development startup script (Windows)
```

## Core Directories

### `/backend` - Express API Server

```
backend/
├── server.js               ← Main server entry
├── package.json            ← Dependencies
├── .env                    ← Environment variables
├── config/
│   └── passport.js         ← OAuth strategies
├── controllers/
│   ├── authController.js   ← Auth logic
│   ├── workspaceController.js
│   └── activityController.js
├── models/                 ← MongoDB schemas
│   ├── User.js
│   ├── Workspace.js
│   ├── Document.js
│   ├── Message.js
│   ├── Note.js
│   ├── Task.js
│   └── Activity.js
├── routes/                 ← API endpoints
│   ├── auth.js
│   ├── workspaces.js
│   └── activities.js
├── middleware/
│   └── authMiddleware.js   ← Authentication checks
├── services/
│   └── emailService.js
└── tests/
    └── health.test.js
```

### `/frontend` - React Application

```
frontend/
├── package.json            ← React dependencies
├── public/
│   └── index.html          ← Entry HTML
├── src/
│   ├── App.js              ← Main component
│   ├── index.js            ← React entry
│   ├── api.js              ← API client wrapper
│   ├── socket.js           ← Socket.io config
│   ├── pages/              ← Page components
│   │   ├── Home.jsx        ← Landing page
│   │   ├── Login.jsx       ← Login form
│   │   ├── Signup.jsx      ← Registration
│   │   ├── Dashboard.jsx   ← Main dashboard
│   │   ├── Workspace.jsx   ← Workspace detail
│   │   ├── Workspaces.jsx  ← All workspaces
│   │   └── Repositories.jsx
│   ├── components/         ← Reusable components
│   │   ├── DashboardNavbar.jsx
│   │   ├── DashboardSidebar.jsx
│   │   ├── ChatRoom.jsx
│   │   ├── DocumentEditor.jsx
│   │   ├── KanbanBoard.jsx
│   │   ├── TeamManagement.jsx
│   │   ├── UserPresence.jsx
│   │   ├── Sidebar.jsx
│   │   └── dashboard/
│   │       ├── ActivityFeed.jsx
│   │       ├── ChatPreviewWidget.jsx
│   │       ├── DeadlineWidget.jsx
│   │       ├── FileUploadsWidget.jsx
│   │       ├── MembersWidget.jsx
│   │       └── ProgressWidget.jsx
│   └── assets/             ← Static files
│       ├── collab-logo.png ← App logo
│       ├── images/         ← Feature images
│       ├── icons/          ← Custom icons
│       └── screenshots/    ← Demo images
├── build/                  ← Production build
└── .env                    ← Environment variables
```

### `/docs` - Documentation

```
docs/
├── SETUP.md                    ← Getting started guide
├── API_REFERENCE.md            ← API documentation
├── ARCHITECTURE.md             ← System design
├── FEATURES.md                 ← Feature list
├── TROUBLESHOOTING.md          ← Common issues
└── archive/                    ← Old docs (reference only)
    ├── GEMINI_IMPLEMENTATION.md
    ├── GEMINI_QUICKSTART.md
    ├── GEMINI_DESIGN_SYSTEM.md
    ├── UI_UX_IMPLEMENTATION_GUIDE.md
    └── ...
```

### `/.project` - Project Metadata

```
.project/
├── DEVELOPMENT_PLAN.md     ← Active development plan
├── ENVIRONMENT_SETUP.md    ← Env config reference
└── PORT_CONFIGURATION.md   ← Port management info
```

## Key Points

### 🔒 Safe to Archive (No Code Dependencies)

- `API_ENDPOINTS_VERIFICATION.md` → docs/archive/
- `FILE_REORGANIZATION_COMPLETE.md` → docs/archive/
- `PERFORMANCE_OPTIMIZATION.md` → docs/archive/
- `PROJECT_STRUCTURE.md` → docs/archive/
- Old gemini files in docs/ → docs/archive/

### ✅ Must Keep in Root (Referenced by workflows)

- `README.md` - Main documentation
- `package.json` - Root config
- `start-dev.bat` - Startup script
- `.gitignore` - Git config

### ✅ No Code Imports Found

✅ Verified: No JavaScript/JSX files import documentation files
✅ Verified: All routes use relative imports (safe to reorganize structure)
✅ Verified: Environment variables loaded from .env files (already configured)
✅ Verified: Asset imports use relative paths (all working)

## Routes & Paths Status

- ✅ Backend API: `/api/*` routes (hardcoded in code - safe)
- ✅ Frontend Routes: `/`, `/login`, `/signup`, `/dashboard`, etc. (React Router - safe)
- ✅ Asset Paths: `../assets/*` relative imports (safe)
- ✅ Socket.io: Connected via `process.env` (safe)
- ✅ OAuth Callbacks: Using environment URLs (safe)

## After Reorganization

All functionality remains identical:

- ✅ Server starts normally
- ✅ Frontend builds without errors
- ✅ Database connections unchanged
- ✅ All routes work the same
- ✅ Socket.io connections unchanged
- ✅ OAuth flows unchanged
- ✅ API endpoints unchanged
