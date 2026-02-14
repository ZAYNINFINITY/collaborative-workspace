# 🔧 AUTOMATED BUG FINDER & REPORTER

## Quick Start

```bash
cd d:\collaborative-workspace\backend
node find-bugs.js
```

Or test manually - follow the steps below and report any errors you see.

---

## MANUAL TESTING CHECKLIST

### ENVIRONMENT SETUP

- [ ] Servers running: `cmd /c start-dev.bat` in `d:\collaborative-workspace`
- [ ] Backend should show: "Backend: http://localhost:5000"
- [ ] Frontend should show: "Frontend: http://localhost:3000"
- [ ] Browser console open (F12 → Console tab)

---

## TEST 1: HOME PAGE

**URL:** http://localhost:3000

**Expected:**

- Page loads with logo/title
- Two buttons visible: "Sign Up" and "Login"
- No red errors in console

**If broken:**

- Blank page? → Backend might not be running
- Error in console? → Screenshot and note the exact error
- Buttons don't work? → Check browser console

---

## TEST 2: SIGNUP PAGE

**URL:** http://localhost:3000/signup

**Actions:**

1. Enter Name: `TestUser`
2. Enter Email: `test${Date.now()}@example.com` (use this to make unique email)
3. Enter Password: `TestPass123!`
4. Confirm Password: `TestPass123!`
5. Click SignUp button
6. Wait 2 seconds

**Expected:**

- Success toast at top: "Account created!"
- Page redirects to login page
- No red errors in console

**If broken:**

- Error in console? → Tell me exact error
- Toast shows error? → Tell me the message
- Page doesn't redirect? → Check console

---

## TEST 3: LOGIN PAGE

**URL:** http://localhost:3000/login

**Actions:**

1. Enter Email: (same email you just created in TEST 2)
2. Enter Password: `TestPass123!`
3. Click the "Email/Password Login" button
4. Wait 2 seconds

**Expected:**

- Toast shows: "Welcome back!"
- Page redirects to dashboard
- No red errors

**If broken:**

- Error message in toast? → Tell me what it says
- Doesn't redirect to dashboard? → Check console
- Form shows validation errors? → Screenshot it

---

## TEST 4: DASHBOARD PAGE

**URL:** Should auto-navigate to http://localhost:3000/dashboard

**Expected:**

- Header with username visible
- Sidebar on left with options
- Main content area with workspace cards
- All buttons clickable
- No red errors

**If broken:**

- Blank or loading forever? → Check console
- Sidebar missing? → Describe what you see
- Buttons don't work? → Which button?

---

## TEST 5: CREATE WORKSPACE

**From Dashboard:**

**Actions:**

1. Click "+ New Workspace" button
2. It should navigate to workspaces page
3. You should see a form to create
4. Enter Name: `TestWorkspace`
5. Enter Description: `Testing`
6. Click Create button

**Expected:**

- Workspace created successfully
- Toast appears: "Workspace created!"
- You're redirected or can see the new workspace in list
- No red errors

**If broken:**

- Form doesn't appear? → Describe layout
- Button doesn't work? → Check console
- Error message? → Tell me what it says

---

## TEST 6: ENTER WORKSPACE

**From Workspace List:**

**Actions:**

1. Click on the workspace you created
2. Should enter workspace with full interface
3. Should see sidebar with sections

**Expected:**

- Workspace loads with:
  - Left sidebar with sections (Overview, Chat, etc.)
  - Main content area
  - No loading spinner stuck
  - No red errors

**If broken:**

- Blank page? → Check console for fetch errors
- Sidebar missing? → Describe layout
- Components don't load? → Tell me which section

---

## TEST 7: CREATE CONTENT

**While in Workspace:**

**If you see a "Create Note" button:**

- [ ] Click it
- [ ] Fill in title and content
- [ ] Click Save/Submit
- [ ] Note should appear in list

**If you see a "Create Task" button:**

- [ ] Click it
- [ ] Fill in task details
- [ ] Click Save/Submit
- [ ] Task should appear in Kanban board

**If you see a Chat input:**

- [ ] Type a message
- [ ] Click Send
- [ ] Message should appear above

**Expected:** No errors, content appears

---

## REPORT TEMPLATE

If you find a bug, provide:

```
BUG: [Short description]
PAGE: [Which page/URL]
STEPS TO REPRODUCE:
  1.
  2.
  3.
EXPECTED:
ACTUAL:
ERROR MESSAGE:
BROWSER CONSOLE ERROR: [exact error text]
SCREENSHOT: [describe or attach]
```

---

## COMMON ERRORS & SOLUTIONS

| Error                                  | Solution                      |
| -------------------------------------- | ----------------------------- |
| `Cannot POST /api/auth/signup`         | Backend not running           |
| `Cannot GET http://localhost:5000/...` | Backend crashed or port wrong |
| `Blank page`                           | Check console for errors      |
| `401 Unauthorized`                     | Need to login first           |
| `403 Forbidden`                        | Not workspace member          |
| `404 Not Found`                        | Route doesn't exist           |
| `Socket connection failed`             | Backend Socket.io issue       |

---

## IF EVERYTHING BELOW PASSES, TEST THESE:

- [ ] OAuth buttons exist (GitHub, Google) - click them (don't complete flow)
- [ ] Settings button in navbar - click it
- [ ] Help button in navbar - click it
- [ ] Logout button - click it (should return to home)
- [ ] Try inviting a member to workspace
- [ ] Try deleting a workspace

---

## NEED HELP?

Tell me:

1. **ANY red errors in browser console?** (copy exact text)
2. **What page does it break on?**
3. **What button/action causes it?**
4. **What do you see instead of what's expected?**

I'll fix it immediately!
