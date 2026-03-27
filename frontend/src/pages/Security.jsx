import React from "react";
import MarketingShell from "../components/MarketingShell";

const items = [
  {
    title: "Session security",
    body: "Cookies are used for authentication and should be configured with Secure/HttpOnly/SameSite in production.",
  },
  {
    title: "CSRF protection",
    body: "State-changing requests are protected via CSRF middleware and token validation.",
  },
  {
    title: "Rate limiting",
    body: "API and auth routes are rate-limited to reduce brute-force and abuse risk.",
  },
  {
    title: "Input sanitization",
    body: "Requests are sanitized server-side to reduce injection and XSS risk.",
  },
];

const Security = () => {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Security
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Practical security, with an honest roadmap
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 md:text-lg">
            Collab includes common web security protections today and keeps a clear path for enterprise-grade controls.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <h2 className="text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm text-white/70">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto mt-12 max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:mt-16 md:p-10">
          <h2 className="text-xl font-semibold text-white">Roadmap</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>Single Sign-On (SSO/SAML) for Business tier</li>
            <li>Audit logs for admin actions</li>
            <li>Backups + restore drills for production data</li>
            <li>Storage hardening for file sharing (S3/R2)</li>
          </ul>
          <p className="mt-5 text-xs text-white/45">
            This page is informational and should match your real production posture and controls.
          </p>
        </section>
      </main>
    </MarketingShell>
  );
};

export default Security;

