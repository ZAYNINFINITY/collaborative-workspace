# 🎯 QUICK REFERENCE GUIDE

## After Cleanup - Where to Find Everything

### ✅ Getting Started

- **README.md** ← Start here (main documentation)
- **start-dev.bat** ← Run this to start both servers
- **docs/SETUP.md** ← Detailed setup instructions (create this when needed)

### 🔧 Development

- **backend/.env** ← Database & OAuth secrets (do NOT commit)
- **frontend/.env** ← Client configuration (do NOT commit)
- **backend/server.js** ← API server entry point
- **frontend/src/App.js** ← React app entry point

### 📚 Documentation Structure

```
Root Level (Clean):
├── README.md              ← Main docs
├── TODO.md                ← Active tasks
├── DIRECTORY_STRUCTURE.md ← What goes where
├── start-dev.bat          ← Launch development
└── cleanup-docs.bat       ← Archive old docs

docs/ (Organized):
├── SETUP.md              ← Getting started
├── API_REFERENCE.md      ← API documentation
├── ARCHITECTURE.md       ← System design
└── archive/              ← Old reference docs

.project/ (Metadata):
└── CLEANUP_SAFE_ANALYSIS.md ← Why cleanup is safe
```

### 🔌 Port Configuration

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **Network IP:** http://192.168.56.1:3000 (team sharing)

### 📦 Backend Structure

```
backend/
├── server.js              ← Express app
├── routes/auth.js         ← Login/signup/OAuth
├── controllers/           ← Business logic
├── models/                ← MongoDB schemas
├── middleware/            ← Express middleware
└── services/              ← Email, helpers
```

### 🎨 Frontend Structure

```
frontend/src/
├── pages/
│   ├── Home.jsx           ← Landing page
│   ├── Login.jsx          ← Login form
│   ├── Signup.jsx         ← Registration
│   ├── Dashboard.jsx      ← Main dashboard
│   └── Workspace.jsx      ← Collaboration space
├── components/
│   ├── DashboardNavbar.jsx ← Top navigation
│   ├── DashboardSidebar.jsx ← Side menu
│   └── dashboard/         ← Dashboard widgets
├── assets/
│   ├── collab-logo.png    ← App logo
│   ├── images/            ← Feature images
│   └── icons/             ← Icon assets
└── api.js                 ← API client wrapper
```

---

## 🚀 Quick Start

### 1️⃣ First Time Setup

```bash
cd backend
npm install
npm start

# In another terminal:
cd frontend
npm install
npm start
```

### 2️⃣ Or Use the Batch Script

```bash
start-dev.bat  # Starts both backend + frontend
```

### 3️⃣ Open in Browser

```
http://localhost:3000
```

---

## 🔐 Authentication

### Email/Password

1. Click "Create Account" on homepage
2. Fill form (displayName, email, password)
3. System hashes password with bcryptjs
4. Auto-login after signup
5. Redirects to dashboard

### OAuth (GitHub/Google)

1. Click "GitHub" or "Google" button
2. Authorize on provider's website
3. System creates user from OAuth data
4. Auto-login
5. Redirects to dashboard

---

## 🗄️ Database

### MongoDB Atlas Connection

- **URI:** `mongodb+srv://...` (in backend/.env)
- **Database:** `collabWorkspace`
- **Collections:** Users, Workspaces, Documents, Messages, Notes, Tasks, Activities

### Collections Structure

```
Users:
  {_id, email, password (hashed), displayName, username, ...}

Workspaces:
  {_id, name, description, members: [userid]}

Documents:
  {_id, workspaceId, title, content, createdBy, ...}

Messages:
  {_id, workspaceId, userId, text, timestamp, ...}

Tasks:
  {_id, workspaceId, title, status: [todo|in_progress|done], ...}
```

---

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/github` - GitHub OAuth
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

### Workspaces

- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace
- `PUT /api/workspaces/:id` - Update workspace

### Real-Time (Socket.io)

- `joinWorkspace` - Join workspace room
- `leaveWorkspace` - Leave workspace room
- `message` - Send message
- `taskUpdate` - Update task

---

## 🐛 Troubleshooting

### Ports Already in Use

```
Use: cleanup-docs.bat (includes port cleanup)
Or manually: taskkill /IM node.exe /F
```

### MongoDB Connection Failed

```
Check: backend/.env has valid MONGO_URI
Check: MongoDB Atlas is accessible
Check: IP whitelist includes your IP
```

### OAuth Not Working

```
Check: GitHub/Google credentials in .env
Check: Callback URLs match exactly in provider settings
Check: CLIENT_URL is correct IP address
```

### Logo Not Showing

```
Save: collab-logo.png to frontend/src/assets/
Restart: Frontend development server
```

---

## 📋 Common Tasks

### Add New Route

1. Create endpoint in `backend/routes/*.js`
2. Export router in `backend/server.js`
3. Call from frontend via `API.get()` or `API.post()`

### Add New Page

1. Create `pages/NewPage.jsx`
2. Add route in `frontend/src/App.js` (React Router)
3. Import lazy with `React.lazy()`

### Add New Component

1. Create `components/NewComponent.jsx`
2. Import in page: `import NewComponent from "../components/NewComponent"`
3. Use in JSX

### Modify Form Validation

1. Edit validation in component state
2. Update error messages
3. Test form submission

---

## ✅ Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend builds without errors
- [ ] Landing page loads
- [ ] Logo displays
- [ ] Email signup works
- [ ] Email login works
- [ ] OAuth buttons redirect correctly
- [ ] Dashboard loads after login
- [ ] Navbar and sidebar display
- [ ] Workspaces list shows
- [ ] Real-time updates work

---

## 📞 Getting Help

1. Check **docs/TROUBLESHOOTING.md** (create if needed)
2. Check **todos/CLEANUP_SAFE_ANALYSIS.md** for why things are organized
3. Check **backend/server.js** for error logs
4. Check browser console for frontend errors
5. Check `.env` files for configuration issues

---

## 🎉 Everything is Safe

The cleanup process:

- ✅ Only moves documentation
- ✅ No code files affected
- ✅ All routes preserved
- ✅ All functionality unchanged
- ✅ Zero breaking changes
- ✅ Can be reversed if needed

Old files are archived in `docs/archive/` - you can always reference them!
