import React, { useMemo, useState } from "react";
import MarketingShell from "../components/MarketingShell";

const Contact = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const mailtoHref = useMemo(() => {
    const to = "support@collab.example";
    const params = new URLSearchParams();
    if (subject.trim()) params.set("subject", subject.trim());
    if (message.trim()) params.set("body", message.trim());
    return `mailto:${to}?${params.toString()}`;
  }, [subject, message]);

  return (
    <MarketingShell>
      <main className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Talk to the Collab team
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70 md:text-lg">
            Questions about the product, deployment, or roadmap? Send a message and we’ll reply as soon as possible.
          </p>
        </header>

        <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="space-y-4">
            <div>
              <label htmlFor="contact-subject" className="mb-1 block text-sm text-white/85">
                Subject
              </label>
              <input
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="How can we help?"
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="mb-1 block text-sm text-white/85">
                Message
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                placeholder="Include your question, desired outcome, and any error details."
                className="w-full resize-none rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              <p className="mt-2 text-xs text-white/50">
                Tip: include your workspace name and your browser/device when reporting bugs.
              </p>
            </div>
            <a
              href={mailtoHref}
              className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Send email
            </a>
            <p className="text-xs text-white/45">
              Replace the placeholder support email with a real address (e.g. a custom domain + inbox) when launching.
            </p>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
};

export default Contact;

