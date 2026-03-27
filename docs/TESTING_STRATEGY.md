# Testing & QA Strategy

## Goals
- Prevent regressions in auth, workspace access, and collaboration flows.
- Validate real-time behavior (socket events) under normal and degraded networks.
- Ensure usability and responsiveness on common devices.

## Test Pyramid

### Backend (Jest + Supertest)
- Keep existing suite and expand:
  - RBAC: owner/admin/member/viewer permissions per endpoint
  - Invite lifecycle: create/revoke/expire/join by code/token
  - File upload validation (size/type)
  - Rate limit behavior + CSRF failure modes

### Frontend (Vitest + React Testing Library)
- Add tests for:
  - Routing + protected routes (`RequireAuth`)
  - Onboarding wizard flows
  - Workspace empty states (no tasks/docs/messages)
  - Notifications panel behavior

### E2E (Playwright recommended)
- Happy paths:
  - Signup/login -> onboarding -> create workspace -> invite -> open workspace
  - Create task -> assign -> move columns
  - Send chat message and see it appear
- Critical negative paths:
  - expired invite token
  - unauthorized -> redirect to login
  - backend down -> graceful UI + retry

## QA Checklist (manual)
- Mobile: iPhone SE/13, Android mid-size
- Desktop: Chrome/Firefox/Safari/Edge
- Accessibility:
  - keyboard nav (tab order, focus rings)
  - contrast checks for glass panels
  - aria labels for icon buttons
- Performance:
  - initial load on 3G/slow 4G
  - websocket connection success rate

