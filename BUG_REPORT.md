# DEBUGGING GUIDE - FIND YOUR BUG

## If you see errors in the browser, check these:

### 1. Network Errors

- Open browser DevTools (F12)
- Go to "Console" tab
- Look for red error messages
- Go to "Network" tab
- Check for failing API requests (red responses)
- **Common issue:** API URL might be wrong

### 2. Component Errors

- Check browser console for "Uncaught Error" or "ReferenceError"
- Look for "Cannot read property" errors
- Check if pages load or show blank screen

### 3. Common Issues & Fixes

#### Issue: "Cannot POST /api/auth/signup"

**Cause:** Backend not running  
**Fix:** Run `cd d:\collaborative-workspace && cmd /c start-dev.bat`

#### Issue: "401 Not Authenticated"

**Cause:** Session not persisting  
**Fix:** Did you log in? Cookies might be blocked

#### Issue: Blank Dashboard

**Cause:** Workspaces not loading  
**Fix:** Check browser console for network errors

#### Issue: "Cannot find module"

**Cause:** Missing frontend files  
**Fix:** Run `cd d:\collaborative-workspace\frontend && npm install`

#### Issue: "Unexpected token in JSON"

**Cause:** API returning HTML error instead of JSON  
**Fix:** Check if backend server crashed

---

## QUICK TESTS TO RUN (Copy/Paste in terminal)

### Test 1: Backend Health

```bash
curl http://localhost:5000/api/health
# Should return: {"status": "ok"}
```

### Test 2: Frontend Accessibility

```bash
curl -s http://localhost:3000 | grep -i "<!DOCTYPE"
# Should return: <!DOCTYPE html>
```

### Test 3: Create Test User

```bash
$body = @{
    displayName="TestUser"
    email="test@test.com"
    password="TestPass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/signup" `
  -Method Post -Body $body -ContentType 'application/json'
```

---

## WHAT SPECIFIC BUG ARE YOU SEEING?

Please tell me:

1. ❌ What page are you on when it breaks? (signup, login, dashboard, workspace)
2. ❌ What error do you see? (exact error message + browser console error)
3. ❌ When you click what button/action does it fail?
4. ❌ Do you see a blank page, error text, or broken layout?

---

## STEP-BY-STEP TEST WORKFLOW

### Step 1: Signup

- [ ] Go to http://localhost:3000/signup
- [ ] Enter Name: "Test User"
- [ ] Enter Email: "test@test.com"
- [ ] Enter Password: "TestPass123!"
- [ ] Confirm Password: "TestPass123!"
- [ ] Click Sign Up
- [ ] Check for any error messages
- [ ] Should redirect to login page

### Step 2: Login

- [ ] Go to already on login page or navigate to http://localhost:3000/login
- [ ] Enter Email: "test@test.com"
- [ ] Enter Password: "TestPass123!"
- [ ] Click Login
- [ ] Check for any error messages
- [ ] Should redirect to dashboard

### Step 3: Create Workspace

- [ ] Should be on dashboard
- [ ] Click "+ New Workspace"
- [ ] Enter Name: "My Workspace"
- [ ] Enter Description (optional)
- [ ] Click Create
- [ ] Check if workspace appears in list

### Step 4: Enter Workspace

- [ ] Click on the workspace you just created
- [ ] Should load workspace with sidebar
- [ ] Try clicking sidebar items (Overview, Chat, Tasks, etc.)
- [ ] Try any action (create note, create task, etc.)

### Step 5: Create Content

- [ ] Create a Note (if there's a button)
- [ ] Create a Task (try Kanban board)
- [ ] Send a Chat Message
- [ ] Check if they appear in workspace

---

## CHECK YOUR SERVERS ARE RUNNING

```bash
# Check if backend is running on 5000
netstat -ano | findstr :5000

# Check if frontend is running on 3000
netstat -ano | findstr :3000
```

Both should show LISTENING status

---

## FULL SERVER DIAGNOSTIC

Run this Node command in `d:\collaborative-workspace\backend`:

```bash
node comprehensive-test.js
```

Should show all ✅ marks if everything works

---

## STILL BUGGY?

Send me:

1. Screenshot of the error
2. Exact error message from browser console (F12 → Console)
3. Which page/action caused it
4. Output of `node comprehensive-test.js`

I'll fix it immediately!
