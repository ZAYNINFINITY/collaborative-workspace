# PROJECT HANDOFF — Collaborative Workspace
### Status: DEV PHASE (not production) | Last updated: 2025

---

## 0. DECISION LOG — Why We Reset to Dev Phase

The project was previously running in production on Vercel + Railway while active development was happening simultaneously. This is the wrong approach for a real product. Bugs were shipped live, fixes were deployed directly, and no staging environment existed. From this point forward:

- **All development happens locally in dev mode**
- **Nothing ships to production until it passes local testing**
- **Production = Railway backend + Vercel frontend, touched only for deliberate releases**
- **The stale `frontend/dist/` was committed to git** — this caused Vercel to serve old code without running the Vite build. This must never happen again. `dist/` is gitignored.

---

## 1. WHAT THIS PRODUCT IS

**Name:** Collaborative Workspace (working title — needs a real product name)

**One-line:** A real-time project workspace built for university students in Pakistan who collaborate by sharing zip files on WhatsApp.

**The real problem being solved:**
Pakistani CS/IT students in 3-person groups face:
1. No version control knowledge (don't know Git, don't use GitHub)
2. Code shared as WhatsApp zip files → nobody knows what's latest
3. One person ends up doing all the work, others don't know what changed
4. Submission day chaos — "whose version do we submit?"
5. No visibility into who contributed what

**What tools exist and why they fail this audience:**
- Jira/Linear — too complex, enterprise-focused, intimidating
- GitHub — requires Git knowledge they don't have
- Notion — collaborative but no task accountability or contribution tracking
- WhatsApp — what they actually use, zero structure
- Google Docs — no code, no tasks, no contribution tracking

**What this product does differently:**
- Git-like version tracking WITHOUT knowing Git commands
- Task assignment with visible accountability (who has what, who did what)
- Real-time chat inside the project (not WhatsApp)
- Document/file version history — always know what's latest
- Contribution tracking — shows exactly what each person contributed
- Join via 6-character code shared on WhatsApp (no email required)
- Simple enough for someone who has never used a collaboration tool

**Positioning:** "The collaboration tool built for students who've never used a real collaboration tool."

---

## 2. CURRENT TECH STACK

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.2 |
| Build tool | Vite | 5.4 |
| Routing | React Router DOM | 6.8 |
| Styling | Tailwind CSS | 3.4 |
| Animations | Framer Motion | 11.18 |
| 3D / Background | Three.js + @react-three/fiber + @react-three/drei | 0.183 / 8.18 / 9.122 |
| Real-time | socket.io-client | 4.8 |
| HTTP client | Axios | 1.13 |
| Drag and drop | @hello-pangea/dnd | 18.0 |
| Icons | react-icons, lucide-react | 5.3, 0.575 |
| Testing | Vitest + @testing-library/react | 3.2 / 16.3 |

### Backend
| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | (Railway default) |
| Framework | Express | 5.2 |
| Database | MongoDB + Mongoose | 9.2 |
| Real-time | Socket.io | 4.8 |
| Auth | JWT (jsonwebtoken) + Passport.js | 9.0 / 0.7 |
| OAuth | passport-github2, passport-google-oauth20 | - |
| Password hash | bcryptjs | 3.0 |
| Security | helmet, cors, express-rate-limit | 8.1 / 2.8 / 8.2 |
| Cookies | cookie-parser | 1.4 |
| File upload | multer | 2.0 |
| Email | nodemailer | 8.0 |
| Compression | compression | 1.8 |
| Testing | Jest + Supertest | 29.7 / 7.1 |

### Infrastructure
| Service | Purpose | URL |
|---|---|---|
| Vercel | Frontend hosting | https://collaborative-workspace-rosy.vercel.app |
| Railway | Backend + Socket.io | https://collaborative-workspace-production-344b.up.railway.app |
| MongoDB Atlas | Database | (in backend/.env — never commit) |
| GitHub | Source control | https://github.com/ZAYNINFINITY/collaborative-workspace |

---

## 3. REPOSITORY STRUCTURE

```
collaborative-workspace/
├── frontend/                    # React SPA (Vite)
│   ├── src/
│   │   ├── api.js               # Axios instance + CSRF interceptor
│   │   ├── config.js            # API_BASE_URL + SOCKET_URL (env-aware)
│   │   ├── socket.js            # Socket.io singleton (polling in prod)
│   │   ├── App.jsx              # Router + route definitions
│   │   ├── main.jsx             # React entry point
│   │   ├── auth/
│   │   │   ├── AuthProvider.jsx # Global auth state, 401 handler, logout
│   │   │   ├── RequireAuth.jsx  # Route guard (preserves full path for invites)
│   │   │   └── useAuth.js       # useContext hook
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Marketing landing page
│   │   │   ├── Login.jsx        # Email + OAuth login
│   │   │   ├── Signup.jsx       # Email signup + password strength meter
│   │   │   ├── Onboarding.jsx   # 4-step guided workspace setup
│   │   │   ├── Dashboard.jsx    # User dashboard (tasks, workspaces)
│   │   │   ├── Workspaces.jsx   # Workspace list
│   │   │   ├── Workspace.jsx    # Single workspace view (tabs)
│   │   │   ├── WorkspaceAnalytics.jsx  # Contribution charts (pro only)
│   │   │   ├── WorkspaceSettings.jsx   # Workspace config
│   │   │   ├── InvitationHandler.jsx   # /invite/:token page
│   │   │   ├── Settings.jsx     # User settings
│   │   │   ├── Repositories.jsx # GitHub repo browser
│   │   │   └── [marketing pages] Home/Features/Pricing/Contact/etc
│   │   └── components/
│   │       ├── AuthBackground.jsx      # Shared Three.js canvas (Login+Signup)
│   │       ├── ChatRoom.jsx            # Real-time chat UI
│   │       ├── KanbanBoard.jsx         # Drag-drop task board
│   │       ├── DocumentEditor.jsx      # Spreadsheet-style doc editor
│   │       ├── TeamManagement.jsx      # Member invite/manage
│   │       ├── NotificationsPanel.jsx  # Notification drawer
│   │       ├── CommandPalette.jsx      # Cmd+K quick actions
│   │       └── AmbientAIAssistant.jsx  # AI floating assistant
│   ├── index.html               # Vite entry HTML
│   ├── vite.config.js           # Vite build config
│   ├── tailwind.config.js       # Tailwind config
│   ├── vercel.json              # Frontend-specific Vercel config
│   └── package.json
├── backend/
│   ├── server.js                # Express + Socket.io server entry
│   ├── models/
│   │   ├── User.js              # User schema + plan fields + PLAN_LIMITS
│   │   ├── Workspace.js         # Workspace + members + invites
│   │   ├── Task.js              # Tasks + comments + attachments
│   │   ├── Document.js          # Spreadsheet/CSV/PDF docs (stored as 2D array)
│   │   ├── Note.js              # Rich text notes
│   │   ├── ProjectFile.js       # Code files with path + language
│   │   ├── Message.js           # Chat messages
│   │   ├── Activity.js          # Audit log of all workspace actions
│   │   ├── UserContribution.js  # Per-user contribution counters
│   │   ├── Notification.js      # User notifications
│   │   ├── TaskRevision.js      # Task version history
│   │   ├── DocumentRevision.js  # Document version history
│   │   ├── NoteRevision.js      # Note version history
│   │   └── ProjectFileRevision.js # Code file version history
│   ├── routes/
│   │   ├── auth.js              # /api/auth/* (signup, login, OAuth, logout)
│   │   ├── workspaces.js        # /api/workspaces/* (all workspace ops)
│   │   ├── activities.js        # /api/activities/*
│   │   ├── notifications.js     # /api/notifications/*
│   │   ├── comments.js          # /api/comments/*
│   │   └── ai.js                # /api/ai/* (AI assistant)
│   ├── controllers/
│   │   ├── authController.js    # getCurrentUser, logout, getRepos
│   │   └── workspaceController.js # All workspace CRUD operations
│   ├── middleware/
│   │   ├── authMiddleware.js    # ensureAuth (JWT cookie + bearer)
│   │   ├── csrfMiddleware.js    # CSRF double-submit cookie protection
│   │   ├── planMiddleware.js    # SaaS plan enforcement gates
│   │   ├── rateLimitMiddleware.js # Per-route rate limiters
│   │   └── sanitizationMiddleware.js # Input sanitization
│   ├── services/
│   │   ├── activityService.js   # Activity log writes
│   │   ├── contributionService.js # Contribution counter updates
│   │   └── emailService.js      # Email sending (nodemailer — NOT YET WIRED)
│   ├── config/
│   │   └── passport.js          # GitHub + Google OAuth strategies
│   ├── utils/
│   │   ├── jwt.js               # Token generate/verify/revoke
│   │   └── oauthState.js        # CSRF state for OAuth flows
│   └── package.json
├── vercel.json                  # Root Vercel config (build + rewrites)
├── .gitignore                   # frontend/dist MUST be excluded
└── package.json                 # Root scripts (install-all, dev)
```

---

## 4. DATABASE SCHEMA OVERVIEW

### User
```
_id, githubId*, googleId*, username (unique), displayName, email*,
password (select:false), avatar, githubUrl, accessToken*, refreshToken*,
plan (free|pro|business), planExpiresAt, stripeCustomerId, stripeSubscriptionId,
usage.aiRequestsToday, usage.aiRequestsReset, isBanned, timestamps
* = sparse (can be null)
```

### Workspace
```
_id, name, description, deadline, owner→User,
members[{user→User, role(owner|admin|member|viewer), label, joinedAt, lastActiveAt}],
repos[{githubId, name, fullName, htmlUrl}],
invites[{email, codeOnly, role, token, code, createdAt}],
timestamps
Indexes: owner+updatedAt, members.user+updatedAt, invites.token, invites.code
```

### Task
```
_id, workspace→Workspace, title, description,
status(todo|in_progress|done), priority(low|medium|high),
deadline, assignee→User, attachments[→Document],
comments[{author→User, content, createdAt}], order, timestamps
Indexes: workspace+status+order, workspace+updatedAt
```

### Document (spreadsheet/CSV/PDF)
```
_id, workspace→Workspace, name, type(csv|xlsx|xls|pdf),
data([[String]] — 2D array for spreadsheets), fileData(Buffer — for PDFs),
mimeType, createdBy→User, lastModifiedBy→User, timestamps
```

### Note
```
_id, workspace→Workspace, author→User, title, content, timestamps
```

### ProjectFile (code files)
```
_id, workspace→Workspace, path (unique per workspace), content,
language, createdBy→User, lastModifiedBy→User, timestamps
```

### Message
```
_id, workspace→Workspace, author→User, content, timestamps
Index: workspace+createdAt
```

### Activity (audit log)
```
_id, workspace→Workspace, user→User, type(enum of 22 actions),
description, metadata(Mixed), timestamps
```

### UserContribution
```
_id, workspace→Workspace (unique pair), user→User,
tasksCompleted, versionCount, messageCount, filesUploaded,
lastCalculatedAt, timestamps
```

### Revision models (Task/Document/Note/ProjectFile each have one):
```
Stores snapshots of content before each edit — enables "view history" and restore
```

### PLAN_LIMITS (exported from User.js)
```
free:     { workspaces:1, membersPerWs:3, fileSizeMb:5, analyticsHistory:7, aiRequests:10 }
pro:      { workspaces:10, membersPerWs:20, fileSizeMb:50, analyticsHistory:90, aiRequests:200 }
business: { workspaces:∞, membersPerWs:∞, fileSizeMb:200, analyticsHistory:365, aiRequests:∞ }
```

---

## 5. AUTH & SESSION SYSTEM

### How it works
1. User signs up or logs in → Express sets httpOnly JWT cookie (`token`, 7d TTL)
2. Cookie sent automatically on every request (withCredentials:true in Axios)
3. `ensureAuth` middleware verifies JWT on every protected route
4. CSRF: double-submit cookie pattern — `csrf_token` cookie (readable by JS) echoed as `X-CSRF-Token` response header, required on all POST/PUT/DELETE
5. `api.js` reads CSRF token from response headers (memory) OR cookie (fallback on hard refresh)
6. On 401: `AUTH_UNAUTHORIZED_EVENT` dispatched → `AuthProvider` redirects to `/login?session_expired=1#from=ENCODED_PATH`
7. After re-login: user is sent back to exactly where they were

### OAuth (GitHub/Google)
- State cookie prevents CSRF on OAuth flow
- Callback checks state, issues JWT cookie, redirects to `/onboarding` (new user) or `/dashboard` (returning)
- New user detected by: `Workspace.countDocuments({ owner OR member })` === 0

### Session storage
- JWT in httpOnly cookie (XSS-safe)
- Revoked tokens stored in in-memory Map (lost on server restart — acceptable for current scale)
- Cookie: `secure:true, sameSite:'none'` in production (required for cross-origin Vercel→Railway)

### Invite flow (FIXED)
```
WhatsApp link → /invite/:token (PUBLIC route, no RequireAuth)
  → InvitationHandler loads preview via GET /api/workspaces/invites/:token/preview (no auth)
  → Shows workspace name + inviter + member count
  → If logged in: auto-accepts, redirects to workspace
  → If not logged in: shows Sign In / Create Account buttons with from state preserved
  → Login/Signup → redirected back to /invite/:token → auto-accepts → workspace
```

### Username collision fix
- Two students with `ali@gmail.com` and `ali@fast.edu.pk` previously both got username `ali` → MongoDB duplicate key 500 error
- Now: `generateUniqueUsername()` auto-appends 4-char random suffix if taken

---

## 6. SOCKET.IO SYSTEM

### Architecture
- Single Socket.io server on Railway
- Frontend connects via `window.location.origin` (Vercel) → Vercel proxies `/socket.io/*` → Railway
- **Transport: polling ONLY in production** (Vercel cannot upgrade HTTP→WebSocket)
- `transports: ["polling"]`, `upgrade: false` in production
- WebSocket used in development (direct connection to localhost:5000)

### Auth
- JWT verified in Socket.io middleware (reads cookie or Authorization header)
- User object attached to socket on connect

### Presence system
- In-memory Map: `presenceByWorkspace: Map<workspaceId, Map<userId, {count, user}>>`
- Connection count per user (multi-tab safe — going from 2 tabs to 1 doesn't mark user offline)
- On disconnect: cleanup all joined workspaces
- **Known limitation:** In-memory → doesn't work across multiple Railway instances. Fix: Redis adapter (future)

### Events emitted by server
- `presence:state` — full member list on join
- `member:online` / `member:offline` — presence changes
- `document:cellUpdated` — spreadsheet cell edit
- `document:cursorMoved` — cursor position
- `message:new` — new chat message
- `user:typing` — typing indicator
- `notify:new` — triggers notification refresh

---

## 7. API ROUTES SUMMARY

### Auth (`/api/auth/`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /signup | ✗ | Email signup, auto-dedup username |
| POST | /login | ✗ | Email login |
| GET | /user | ✓ | Current user |
| POST | /logout | ✓ | Revoke token, clear cookie |
| GET | /github | ✗ | Start GitHub OAuth |
| GET | /github/callback | ✗ | GitHub OAuth callback |
| GET | /google | ✗ | Start Google OAuth |
| GET | /google/callback | ✗ | Google OAuth callback |
| GET | /repos | ✓ | List user's GitHub repos |

### Workspaces (`/api/workspaces/`)
| Method | Path | Auth | Plan gate | Description |
|---|---|---|---|---|
| GET | /invites/:token/preview | ✗ | — | Invite preview (public) |
| GET | / | ✓ | — | List user's workspaces |
| POST | / | ✓ | workspace limit | Create workspace |
| POST | /join-by-code | ✓ | — | Join by 6-char code |
| POST | /invites/:token/accept | ✓ | — | Accept token invite |
| DELETE | /invites/:token/decline | ✓ | — | Decline token invite |
| GET | /:id | ✓ | — | Get workspace |
| PUT | /:id | ✓ | — | Update workspace |
| DELETE | /:id | ✓ | — | Delete workspace |
| POST | /:id/invite | ✓ | member limit | Invite member |
| GET | /:id/analytics | ✓ | **pro+** | Contribution analytics |
| POST | /:id/documents | ✓ | file size | Upload document |
| ... | (tasks, notes, messages, files, members, etc.) | ✓ | — | Full CRUD |

---

## 8. PLAN MIDDLEWARE (SAAS GATES)

Located at `backend/middleware/planMiddleware.js`. Drop onto any route:

```js
const { requirePlan, checkWorkspaceLimit, checkMemberLimit, checkAiLimit, checkFileSizeLimit } = require("../middleware/planMiddleware");

router.post("/workspaces", ensureAuth, checkWorkspaceLimit, createWorkspace);
router.post("/:id/invite", ensureAuth, checkMemberLimit, inviteMember);
router.get("/:id/analytics", ensureAuth, requirePlan("pro"), getAnalytics);
router.post("/ai/ask", ensureAuth, checkAiLimit, handleAi);
```

Returns: `{ msg, upgrade: true, limit, current }` — frontend shows upgrade prompt.

---

## 9. WHAT'S GOOD (DON'T BREAK)

- ✅ JWT in httpOnly cookie — XSS-safe
- ✅ CSRF double-submit pattern with HMAC-signed tokens
- ✅ Rate limiting on all auth routes
- ✅ Input sanitization middleware
- ✅ OAuth state cookie CSRF protection
- ✅ Socket.io auth middleware (validates JWT before any event)
- ✅ Multi-tab presence (connection count, not boolean)
- ✅ Full revision history on Tasks, Documents, Notes, ProjectFiles
- ✅ Activity audit log (22 action types)
- ✅ Contribution tracking model (UserContribution)
- ✅ Username collision auto-resolution
- ✅ Invite preview endpoint (public, no auth) — students see workspace name before logging in
- ✅ Invite token preserved through login redirect (RequireAuth fix)
- ✅ New OAuth users → /onboarding (not empty /dashboard)
- ✅ Session expired → redirect with message + return path
- ✅ CSRF cookie fallback on hard refresh (api.js reads cookie before health check responds)
- ✅ Shared AuthBackground component (single WebGL canvas — no context loss)
- ✅ Socket polling-only in production (Vercel WebSocket limitation handled)
- ✅ Plan limits model (PLAN_LIMITS single source of truth in User.js)
- ✅ Plan middleware ready to enforce on any route

---

## 10. WHAT'S BROKEN / NOT YET BUILT (CRITICAL)

### Deployment blocker (fix before anything else)
- ❌ `frontend/dist/` was committed to git → Vercel serves old build without running Vite
  - **Fix:** `git rm -r --cached frontend/dist && git commit && git push`

### Auth & session
- ❌ Email service (nodemailer) exists but is NOT wired — invite emails, welcome emails, password reset all send nothing
- ❌ Password reset flow does not exist (no route, no UI, no token)
- ❌ Email verification after signup does not exist
- ❌ JWT revocation is in-memory only — server restart makes all revoked tokens valid again

### Core product gaps
- ❌ "Who changed what" is not visible on the workspace home — buried in /analytics
- ❌ Latest version badge not shown on files/docs/notes — students don't know what's latest
- ❌ Workspace home has no overview screen (member count, task completion %, recent activity)
- ✅ ~~Quick Actions buttons on Dashboard are dead~~ FIXED — all 4 actions now real `<Link>`s (Team/GitHub/New Space/Settings)
- ✅ ~~Dashboard system status shows hardcoded fake data~~ FIXED — now shows real socket connection state, real workspace count, real task count
- ❌ KanbanBoard has no empty state guidance for new workspaces
- ❌ DocumentEditor stores files as Buffer in MongoDB — wrong for scale (should be object storage)
- ❌ No file size enforced on Document uploads in multer (only in planMiddleware after the fact)

### SaaS gaps
- ❌ No billing (Stripe not integrated) — pricing page exists but "Start Pro" → /signup only
- ❌ No Stripe webhook handler
- ❌ No customer portal
- ❌ AI route exists (/api/ai) but implementation unknown — needs audit
- ❌ No admin dashboard (can't see user counts, MRR, active workspaces)
- ❌ No usage analytics (what features users actually use)

### Frontend quality
- ❌ Layout shift between Dashboard and Workspace views (different shells)
- ❌ Home.jsx landing page is thin — no demo, no screenshots, no social proof
- ❌ "Loading page..." text used as route fallback in old code (fixed in App.jsx — verify)

### Infrastructure
- ❌ No Redis — presence system breaks at 2+ Railway instances
- ❌ No error monitoring (Sentry not set up)
- ❌ npm audit vulnerabilities unfixed (xlsx package)
- ❌ No CI/CD pipeline (GitHub Actions) — everything deployed manually
- ❌ No staging environment — dev goes straight to production

---

## 11. WHAT "AI SLOP" WAS INTRODUCED (AUDIT THIS)

These are areas where code was generated without fully understanding the product problem:

1. **AmbientAIAssistant.jsx** — Floating AI orb that has no clear purpose in a student collaboration tool. Students won't know what it does. Needs either a clear use case (explain this task, summarize the doc) or removal.

2. **Three.js star background on Login/Signup** — Beautiful but causes WebGL context loss on low-end Android phones which is your primary audience. Now extracted to shared component with `powerPreference:'low-power'` — but still risks GPU issues. Consider a CSS-only fallback.

3. **CommandPalette.jsx** — Power-user feature. Students won't discover or use Cmd+K. Low priority, may cause confusion.

4. **WorkspaceAnalytics.jsx** — Put behind `requirePlan("pro")`. The contribution data EXISTS and is valuable for students — but it's hidden behind a paywall in a tool that targets free-tier student users. Reconsider: basic contribution view should be free, detailed analytics pro.

5. **DocumentEditor** storing files as MongoDB Buffer — This is architecturally wrong. Storing binary blobs in MongoDB is an anti-pattern at any real scale. Should use S3/R2/Cloudflare storage and store only the URL.

6. **~~Dual sidebar components~~ RESOLVED** — Confirmed by grepping every page/route: `DashboardSidebar.jsx` was never imported anywhere (not in App.jsx, Workspace.jsx, Workspaces.jsx, Dashboard.jsx, or any other page). It was pure orphaned code, not an actual duplicate-UI bug. `Sidebar.jsx` is the only sidebar that ever renders (in-workspace tab nav in Workspace.jsx) and is correct as-is. Moved `DashboardSidebar.jsx` to `_deprecated/DashboardSidebar.jsx.unused` (not hard-deleted, since Claude's filesystem tool here has no delete — safe to hard-delete manually once confirmed unneeded).

7. **"Git Provider: Connected"** — Hardcoded fake status on dashboard. Creates false trust signal. Either wire it or remove it.

8. **System status panel with fake data** — Same issue. These mislead users into thinking things are working that aren't.

---

## 12. CORRECT DEV WORKFLOW (FROM NOW ON)

### Local setup
```bash
# Backend
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev            # runs on :5000

# Frontend (separate terminal)
cd frontend
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev            # runs on :3000 (Vite proxies /api to :5000)
```

### Environment variables needed

**Backend (`backend/.env`):**
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<random 64 char string>
CSRF_SECRET=<random 64 char string>
CLIENT_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Frontend (`frontend/.env`):**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Railway (production — set in dashboard, NOT in .env file):**
```
NODE_ENV=production
PORT=5000
MONGO_URI=<atlas uri>
JWT_SECRET=<same as dev or different>
CSRF_SECRET=<same as dev or different>
CLIENT_URL=https://collaborative-workspace-rosy.vercel.app
ALLOWED_ORIGINS=https://collaborative-workspace-rosy.vercel.app
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Git workflow
```bash
# Never push directly to main for feature work
git checkout -b feature/workspace-home-screen
# ... make changes, test locally ...
git add .
git commit -m "feat: add workspace home overview screen"
git push origin feature/workspace-home-screen
# merge to main only when working locally
```

### NEVER do this again
- ❌ Editing files directly and pushing to `main` while production is live
- ❌ Committing `frontend/dist/` to git
- ❌ Deploying untested code to Railway/Vercel
- ❌ Having `NODE_ENV=development` on Railway

---

## 13. IMMEDIATE NEXT STEPS (IN ORDER)

### Step 1 — Fix deployment (1 command, 5 minutes)
```bash
git rm -r --cached frontend/dist
git add .
git commit -m "fix: remove stale dist, force fresh Vite build"
git push
```
Then in Railway dashboard: set `NODE_ENV=production`.

### Step 2 — Verify the live site actually works (30 minutes)
- [ ] https://collaborative-workspace-rosy.vercel.app loads (not "You need JS")
- [ ] https://collaborative-workspace-production-344b.up.railway.app/api/health returns `{"status":"ok"}`
- [ ] Login works (check Network tab for POST /api/auth/login → 200)
- [ ] Socket connects (check console — no WebSocket errors, polling should work silently)
- [ ] Create workspace, invite, accept invite flow end-to-end

### Step 3 — Clean up AI slop (1-2 days)
- [ ] Remove or wire AmbientAIAssistant
- [x] Remove fake system status from Dashboard — DONE (real socket/workspace/task data)
- [x] Wire dead Quick Actions buttons — DONE (Team, GitHub, New Space, Settings all link out)
- [x] Replace 3rd Three.js canvas on Dashboard with CSS-only background — DONE (`DashboardBackground` component, zero WebGL)
- [x] Fix N+1 my-tasks fetch — DONE, both sides:
      - Backend: `GET /api/workspaces/my-tasks` added (`getMyTasks` controller in workspaceController.js, single query via `Task.find({workspace:{$in:...}, assignee})` instead of one `/workspaces/:id` call per workspace). Route registered in workspaces.js **before** `/:id` to avoid being swallowed by the param route.
      - Frontend: Dashboard.jsx calls the new endpoint first, falls back to the old parallel-fetch-per-workspace method only on 404 (so it never breaks if the deploy order is backend-after-frontend).
- [x] Sidebar "duplication" resolved — DONE (it was dead code, not a real duplicate; moved to `_deprecated/`, see section 11)
- [x] Remove Chakra UI dependency — DONE (`@chakra-ui/react`, `@chakra-ui/icons`, `@emotion/react`, `@emotion/styled` removed from `frontend/package.json`; zero usages found anywhere in `src/`). **Run `npm install` in `frontend/` once to sync `node_modules` and `package-lock.json`.**

### Step 4 — Build the core student-facing features (1-2 weeks)
- [ ] Workspace home screen: member list with contribution badges, task completion %, recent activity
- [ ] "Latest version" badge on every file/doc/note
- [ ] Contribution summary visible without going to analytics (basic is free)
- [ ] Empty states with clear guidance on every empty view
- [ ] Fix onboarding: invite code as hero element, WhatsApp share link

### Step 5 — Fix email (3-4 days)
- [ ] Switch nodemailer to Resend or Postmark (reliable, free tier)
- [ ] Wire invite email (workspace name, inviter, join link)
- [ ] Wire welcome email after signup
- [ ] Build password reset flow (token → email → reset page)

### Step 6 — Set up proper CI/CD (2 days)
- [ ] GitHub Actions: on push to main → run tests → deploy to Railway + trigger Vercel
- [ ] Staging environment (separate Railway service + Vercel preview)
- [ ] Add Sentry (30 min, free tier, invaluable)

---

## 14. PRODUCT VISION (WHERE THIS GOES)

The current feature set is the foundation. The product differentiator is **contribution visibility** — making it impossible for one student to do all the work invisibly. Future roadmap:

**Near term (student v1.0):**
- Contribution graph (GitHub-style, per workspace)
- "What changed" diff view between versions
- Submission export (zip of latest versions + contribution report PDF)
- Teacher/supervisor view (read-only workspace access link)

**Medium term:**
- Mobile app (React Native — same backend)
- Offline mode (IndexedDB sync)
- GitHub integration that shows commits alongside task completion
- University LMS integration (submit directly from workspace)

**Long term / monetization:**
- Free: 1 workspace, 3 members, 5MB files
- Pro (student): unlimited workspaces, 20 members, 50MB — PKR 500/month
- Institution: university-wide license, teacher dashboards, LMS integration

---

## 15. KNOWN ENVIRONMENT GOTCHAS

1. **Vite vs CRA env vars:** Vite reads `VITE_` prefix only. Old `REACT_APP_` vars are ignored unless `envPrefix` is set in `vite.config.js` (now set).

2. **Vercel WebSocket:** Vercel cannot upgrade HTTP to WebSocket. Socket.io MUST use polling transport in production. `transports: ["polling"]` in `socket.js`.

3. **Railway cold starts:** Free/hobby tier sleeps after inactivity. First request takes 10-30 seconds. Auth rate limiter must not be too aggressive during wake-up.

4. **SameSite cookie:** Production cookie uses `sameSite:'none', secure:true`. This requires HTTPS on both frontend and backend. Works on Vercel+Railway, breaks on HTTP localhost unless `sameSite:'lax'` is used in dev (already handled in `jwt.js`).

5. **MongoDB sparse indexes:** `githubId` and `googleId` fields use sparse unique indexes so multiple users can have `null` without colliding.

6. **Socket.io polling path:** Vercel rewrite for `/socket.io/:path*` must forward query strings (`:path*` syntax). The old `/(.*) ` pattern dropped `?EIO=4&transport=polling&sid=xxx`.

7. **dist/ in git:** The biggest deployment footgun. `frontend/.gitignore` has `/dist` — but if `dist/` was ever committed before the gitignore rule, `git rm -r --cached frontend/dist` must be run once to un-track it.

---

*This document is the ground truth for the project. Update it whenever architecture changes, decisions are made, or new bugs are discovered.*
