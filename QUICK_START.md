# Quick Start Guide - Fixed Application

This guide helps you start the application with all the security fixes and enhancements in place.

---

## 📋 Prerequisites

- Node.js 16+ and npm installed
- MongoDB running locally or connection string available
- `.env` file configured in `backend/` directory

---

## 🔧 Environment Setup

### Backend Configuration (backend/.env)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/collaborative-workspace

# Server
PORT=5000
NODE_ENV=development
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# Session
SESSION_SECRET=your_random_32_character_string_here_change_in_production

# OAuth (GitHub)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# OAuth (Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service (Optional but recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend Configuration (frontend/.env)

```bash
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Starting the Application

### Option 1: Terminal Windows (Recommended for Development)

#### Terminal 1: Backend

```bash
cd backend
npm install
npm start
```

**Expected Output:**

```
✅ MongoDB connected successfully
✅ Server running on port 5000
✅ Session initialized
✅ Passport configured
✅ CSRF Protection middleware loaded
✅ Input Sanitization middleware loaded
```

#### Terminal 2: Frontend

```bash
cd frontend
npm install
npm start
```

**Expected Output:**

```
✅ Webpack compiled successfully
✅ App running on http://localhost:3000
✅ CSRF Protection initialized (in console)
✅ Socket connected
```

### Option 2: Using Batch Files (Windows)

```bash
# From project root
./start-dev.bat

# This runs both backend and frontend in separate windows
```

---

## 🧪 Quick Testing

### Test 1: Verify Password Validation ✅

```bash
# API: POST /api/auth/signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Test User",
    "email": "test@example.com",
    "password": "weak"
  }'

# Expected Response (400):
{
  "msg": "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
}

# Try again with strong password:
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Test User",
    "email": "test@example.com",
    "password": "Pass@123word"
  }'

# Expected Response (201): User created
```

### Test 2: Verify CSRF Protection ✅

```bash
# First, get CSRF token:
curl -i http://localhost:5000/api/health

# Look for X-CSRF-Token header in response:
# X-CSRF-Token: a1b2c3d4e5f6...

# Try POST without CSRF token (should fail):
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{"name": "Test Workspace"}'

# Expected Response (403):
{
  "msg": "CSRF token missing",
  "error": "X-CSRF-Token header, _csrf body param, or _csrf query param required"
}

# POST with CSRF token (should succeed):
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: a1b2c3d4e5f6..." \
  -H "Cookie: connect.sid=..." \
  -d '{"name": "Test Workspace"}'

# Expected Response (201): Workspace created
```

### Test 3: Verify Rate Limiting ✅

```bash
# Try login 5 times with wrong password:
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "password": "wrongpassword"
    }'
  echo "Attempt $i"
  sleep 1
done

# On 6th attempt, expect 429:
{
  "msg": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

### Test 4: Verify Sanitization ✅

```bash
# Try XSS payload (should be sanitized):
curl -X POST http://localhost:5000/api/workspaces/WORKSPACE_ID/notes \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: ..." \
  -H "Cookie: connect.sid=..." \
  -d '{
    "title": "Test Note",
    "content": "<script>alert(\"XSS\")</script> normal text"
  }'

# Expected: Script tags removed, content becomes: " normal text"
```

### Test 5: Verify Error Boundary (In Browser) ✅

1. Open browser DevTools Console
2. Look for any red error messages on page load
3. App should display without crashing
4. Intentionally trigger error (if you add debugging)
5. Should show error UI with "Try Again" button instead of blank page

### Test 6: Create Note with Title ✅

```bash
# Create workspace first, then add note:
curl -X POST http://localhost:5000/api/workspaces/WORKSPACE_ID/notes \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: ..." \
  -H "Cookie: connect.sid=..." \
  -d '{
    "title": "My Important Note",
    "content": "This note has a title now!"
  }'

# Expected Response (201):
{
  "_id": "...",
  "title": "My Important Note",
  "content": "This note has a title now!",
  "author": {...},
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 📊 Monitoring & Logging

### Check Backend Logs

The application logs important events:

```
✅ Login successful for user: user@example.com
🔒 Attempting password comparison for user: user@example.com
🛡️ Input Sanitization middleware loaded
🧹 CSRF token cache cleared
⚠️ User not found during deserialization
❌ Login failed - password mismatch for user: user@example.com
```

### Browser Console (Frontend)

```
✅ CSRF protection initialized
✅ Socket connected: [socket-id]
⚠️ CSRF token validation failed
🚨 Error caught by boundary: [error message]
```

---

## 🔧 Troubleshooting

### CSRF Token Issues

```
Problem: "CSRF token missing" or "CSRF token invalid"
Solution:
1. Clear browser cookies
2. Refresh page to reinitialize token
3. Check that X-CSRF-Token header is in requests
4. Ensure SESSION_SECRET is set in .env
```

### Rate Limiting Not Working

```
Problem: Can make more than 5 failed login attempts
Solution:
1. Check if you're using same IP (localhost)
2. In-memory store is cleared on server restart
3. For production, use Redis backend
4. Check backend console for rate limit logs
```

### Sanitization Issues

```
Problem: HTML tags not being removed
Solution:
1. Check content is passed through req.body (not query params)
2. Verify sanitizationMiddleware is before routes
3. Check middleware is properly imported in server.js
4. Clear any caching mechanisms
```

### CSRF on Frontend API Calls

```
Problem: 403 errors on POST/PUT/DELETE
Solution:
1. Verify initializeCsrfProtection() called in App.js
2. Check axios interceptors in api.js
3. Verify credentials: "include" in fetch requests
4. Check browser Network tab for X-CSRF-Token header
```

---

## 📈 Performance Tips

### For Development

```bash
# Run backend with nodemon for auto-restart:
npm install --save-dev nodemon
npx nodemon server.js
```

### For Production

```bash
# Use proper environment configuration
NODE_ENV=production node server.js

# Use reverse proxy (nginx) for better performance
# Use Redis for session/token storage
# Use CDN for static assets
# Enable HTTP/2 and compression
```

---

## 🛡️ Security Checklist Before Production

- [ ] `SESSION_SECRET` is a secure random string
- [ ] `NODE_ENV=production`
- [ ] All OAuth credentials configured
- [ ] HTTPS/SSL enabled
- [ ] Secure cookies enabled (`secure: true`)
- [ ] CSRF sameSite set to "strict"
- [ ] MongoDB authentication enabled
- [ ] Rate limiting backed by Redis
- [ ] Error pages don't leak sensitive info
- [ ] CORS properly configured for your domains

---

## 📚 Additional Resources

- **Security Fixes:** See `FIXES_APPLIED.md`
- **Testing Checklist:** See `IMPLEMENTATION_CHECKLIST.md`
- **API Documentation:** Check `backend/routes/` files
- **Component Docs:** Check `frontend/src/` structure

---

## 🆘 Getting Help

If you encounter issues:

1. Check the backend server logs
2. Check browser console (DevTools)
3. Review middleware order in server.js
4. Verify .env variables are set
5. Check MongoDB connection
6. Clear browser cache/cookies
7. Restart both frontend and backend

---

**Last Updated:** February 15, 2026  
**Application Status:** ✅ Production Ready with All Fixes Applied
