import React from "react";
import { Link } from "react-router-dom";
import MarketingShell from "../components/MarketingShell";

const Help = () => {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Help
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Get unblocked fast
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70 md:text-lg">
            Short answers, key shortcuts, and where to go next.
          </p>
        </header>

        <section className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Shortcuts</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>
                <span className="font-semibold text-white">Ctrl/⌘ + K</span> — open the command palette
              </li>
              <li>
                <span className="font-semibold text-white">Notifications</span> — use the bell button in-app
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Getting started</h2>
            <p className="mt-3 text-sm text-white/70">
              New to Collab? Start with the guided setup to create a workspace, invite your team, and seed your first tasks and notes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/onboarding"
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Guided setup
              </Link>
              <Link
                to="/features"
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                View features
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:col-span-2">
            <h2 className="text-lg font-semibold text-white">Support</h2>
            <p className="mt-3 text-sm text-white/70">
              If you hit an error, capture: the page URL, steps to reproduce, and a screenshot of the console/network errors.
            </p>
            <div className="mt-4">
              <Link
                to="/contact"
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Contact support
              </Link>
            </div>
          </article>
        </section>
      </main>
    </MarketingShell>
  );
};

export default Help;

