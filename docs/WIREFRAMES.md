# Text Wireframes (Ready for Implementation)

Notation:
- `[]` blocks are UI sections
- `()` are controls
- `->` indicates navigation

## Public Marketing

### `/` Landing

[Top Nav]
- Logo | (Features) (Pricing) (Security) (Contact) | (Sign in) (Get started)

[Hero]
- H1: “One workspace for chat, tasks, notes, and docs.”
- Subtext: 1–2 lines with audience wedge.
- CTAs: (Get started free) (Watch demo)
- Trust row: “SOC2-ready roadmap” “Encrypted cookies” “Invite links expire”

[Proof / Screenshots]
- 2–3 annotated screenshots (Dashboard, Workspace, Kanban)

[How it works]
- Step 1 Create workspace
- Step 2 Invite team
- Step 3 Plan + ship

[Feature Highlights]
- Cards: Chat, Kanban, Docs, Notes, Activity, Roles, Integrations, AI

[Testimonials] (can be placeholder)

[FAQ]

[Footer]
- (Privacy) (Terms) (Contact) (Status)

### `/features`

[Header]
- H1: “Everything your team needs to ship together”
- Subtitle: outcome-driven

[Feature sections]
- Real-time Chat + Threads
- Kanban + Assignments + Deadlines
- Docs + Revisions + Comments
- Notes + Quick capture
- Team + Roles + Invites
- Integrations (GitHub)
- AI assistance (summaries, drafts)

[CTA]
- (Start free) (View pricing)

### `/pricing`

[Plan cards]
- Free: 1 workspace, 3 members, basic features
- Pro: unlimited workspaces, more members, AI features
- Business: SSO, audit log, advanced controls (future)

[FAQ]
- “Do you charge per seat?”
- “Can I cancel anytime?”

### `/contact`

[Contact]
- Email field, Message textarea, (Send)
- Alternative: support@, social links

### `/security`

[Security posture]
- Authentication + sessions
- CSRF + rate limiting
- Data handling (what is stored)
- Roadmap: SSO, audit logs, backups, encryption at rest (be honest)

## App

### `/onboarding`

[Progress header]
- Step indicators: Workspace -> Invite -> First project -> Done

[Step 1: Create workspace]
- (Workspace name) (Description) (Template select)
- (Create & continue)

[Step 2: Invite teammates]
- (Invite by email) list
- (Create invite code) copy button
- (Continue)

[Step 3: First actions]
- Quick actions:
  - (Create first task)
  - (Create doc)
  - (Post message)
- (Continue)

[Step 4: Finish]
- “You’re ready” + (Go to workspace)

### `/settings` (Account)

[Tabs]
- Profile (name, avatar)
- Security (change password, sessions)
- Notifications (email/push preferences)
- Data (export, delete account)

### `/workspaces/:id/settings`

[Tabs]
- General (name, description, deadline)
- Members (list + role dropdown + remove)
- Invites (pending invites + resend/revoke)
- Data (export workspace, delete workspace)

