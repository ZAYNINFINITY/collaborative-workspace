# Collaborative Workspace — Production Roadmap

This roadmap assumes the current stack (Vite SPA + Express/MongoDB + Vercel/Railway) and focuses on removing the “incomplete” feel by improving product framing, onboarding, and SaaS fundamentals.

## Milestone 0 — Clarify Product (1–2 days)

- Decide primary audience wedge + top 3 use cases.
- Define KPIs: activation, invite rate, weekly active workspaces, retention.
- Add marketing sitemap pages (Features/Pricing/Contact/Security/Terms/Privacy).
- Add screenshots or a short demo clip to landing.

**Exit criteria**
- A first-time visitor can answer: *who is this for, what problem does it solve, why trust it, what to do next*.

## Milestone 1 — Activation & Onboarding (2–5 days)

- Add `/onboarding` wizard:
  - Step 1: create workspace (name + template)
  - Step 2: invite teammates (email or code)
  - Step 3: create first task/doc/note
  - Step 4: “done” + go to workspace
- Add a “Setup checklist” widget on `/dashboard` for new users.
- Improve empty states in workspaces to guide first actions.

**Exit criteria**
- New signup → first collaborative action in < 10 minutes.

## Milestone 2 — Settings & Administration (3–7 days)

- Account settings:
  - profile, password, sessions/devices, notification prefs
- Workspace settings:
  - rename workspace, description, deadline
  - member roles (owner/admin/member/viewer), remove member
  - invite management (resend, revoke, expire)
- Activity log / audit feed for admin actions.

**Exit criteria**
- A workspace can be managed without touching the database.

## Milestone 3 — Reliability & Observability (2–5 days)

- Add error monitoring (Sentry or similar) frontend + backend.
- Add request correlation IDs and structured logs on backend.
- Add basic performance monitoring:
  - API latency percentiles
  - socket connect success rate
- Add backup strategy for MongoDB + log retention.

**Exit criteria**
- Production incidents are diagnosable within minutes.

## Milestone 4 — Billing (5–14 days)

- Implement Stripe:
  - plans per workspace (Free/Pro/Business)
  - seat-based billing or usage-based (messages/tasks/docs)
  - trials, invoices, proration, cancel/reactivate
- Enforce limits in backend (max members/workspaces/storage).
- Add `/pricing` that matches real plans.

**Exit criteria**
- A workspace can upgrade/downgrade, and limits are enforced.

## Milestone 5 — Integrations & Differentiators (ongoing)

- GitHub repo linking per workspace (beyond listing):
  - connect repo to workspace
  - PR/issue sync, commit feed
- Full-text search across chat/tasks/docs/notes.
- Templates marketplace (project types).
- Better AI: summarize workspace, propose tasks, draft updates.

