import React from "react";
import MarketingShell from "../components/MarketingShell";

const Terms = () => {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-16">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-white/70">
            This is a starter template. Replace with your real terms before a public launch.
          </p>
        </header>

        <section className="mt-10 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 backdrop-blur-xl">
          <div>
            <h2 className="text-base font-semibold text-white">1. Service</h2>
            <p className="mt-2">
              Collab provides a real-time collaborative workspace for teams. Features may change over time.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">2. Accounts</h2>
            <p className="mt-2">
              You are responsible for maintaining account security and for activity that occurs under your account.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">3. Acceptable use</h2>
            <p className="mt-2">
              Do not misuse the service, attempt unauthorized access, or disrupt other users.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">4. Termination</h2>
            <p className="mt-2">
              We may suspend accounts for abuse or security issues. You may stop using the service at any time.
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
};

export default Terms;

