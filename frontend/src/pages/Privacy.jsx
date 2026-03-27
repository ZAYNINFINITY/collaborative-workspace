import React from "react";
import MarketingShell from "../components/MarketingShell";

const Privacy = () => {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-16">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-white/70">
            This is a starter template. Replace with your real policy before a public launch.
          </p>
        </header>

        <section className="mt-10 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 backdrop-blur-xl">
          <div>
            <h2 className="text-base font-semibold text-white">What we collect</h2>
            <p className="mt-2">
              Account information you provide (name, email), and content created inside workspaces (messages, tasks, notes, documents).
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">How we use data</h2>
            <p className="mt-2">
              To provide the service, secure accounts, and improve product quality. Optional AI features may process the text you submit.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Your choices</h2>
            <p className="mt-2">
              You can request export or deletion of your account/workspace data once those flows are enabled in settings.
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
};

export default Privacy;

