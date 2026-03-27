import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaComment,
  FaFileAlt,
  FaHistory,
  FaLock,
  FaRocket,
  FaStickyNote,
  FaTasks,
  FaUsers,
} from "react-icons/fa";
import MarketingShell from "../components/MarketingShell";

const featureSections = [
  {
    title: "Chat that stays connected to the work",
    icon: FaComment,
    description:
      "Keep decisions and progress visible with real-time messaging, mentions, and activity context inside each workspace.",
    bullets: ["Realtime updates", "Mentions & notifications", "Workspace presence"],
  },
  {
    title: "Tasks with ownership and momentum",
    icon: FaTasks,
    description:
      "Plan and execute with a Kanban workflow, assignments, and deadlines—so nothing falls through the cracks.",
    bullets: ["Kanban boards", "Assignees & deadlines", "My Tasks overview"],
  },
  {
    title: "Docs and notes with revision history",
    icon: FaFileAlt,
    description:
      "Capture specs, meeting notes, and decisions next to tasks and chat. Iterate safely with revisions and comments.",
    bullets: ["Documents", "Notes", "Comments & revisions"],
  },
  {
    title: "A team space with roles and invites",
    icon: FaUsers,
    description:
      "Invite teammates by link or code and manage access levels as your team grows.",
    bullets: ["Invites", "Roles", "Member management"],
  },
  {
    title: "Visibility and accountability",
    icon: FaHistory,
    description:
      "See what changed and when, across tasks, docs, notes, and collaboration activity.",
    bullets: ["Activity feed", "Workspace analytics", "History & revisions"],
  },
  {
    title: "Security and performance by default",
    icon: FaLock,
    description:
      "Built with practical security controls and performance optimizations for a fast, modern experience.",
    bullets: ["CSRF protection", "Rate limiting", "Secure cookies"],
  },
];

const Features = () => {
  const navigate = useNavigate();

  return (
    <MarketingShell>
      <main className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Features
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Everything your team needs to collaborate—and ship.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 md:text-lg">
            Collab brings chat, tasks, notes, and documents into a single real-time workspace so teams stay aligned and move faster.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Get started free
            </button>
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              View pricing
            </button>
          </div>
        </header>

        <section className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2">
          {featureSections.map((section) => {
            const Icon = section.icon;
            return (
              <article
                key={section.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-400/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200">
                      <Icon />
                    </span>
                    <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                  </div>
                  <FaRocket className="text-white/25" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm text-white/70">{section.description}</p>
                <ul className="mt-4 space-y-1 text-sm text-white/65">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-300/70" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="mx-auto mt-14 max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-white/5 to-blue-500/10 p-6 text-center backdrop-blur-xl md:mt-16 md:p-10">
          <h2 className="text-2xl font-semibold text-white">
            Ready to build your first workspace?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-white/70">
            Create a workspace, invite your team, and start collaborating with chat, tasks, notes, and docs in minutes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Start free
            </button>
            <button
              type="button"
              onClick={() => navigate("/contact")}
              className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Talk to us
            </button>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
};

export default Features;

