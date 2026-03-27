import React from "react";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaCrown, FaRocket, FaShieldAlt } from "react-icons/fa";
import MarketingShell from "../components/MarketingShell";

const plans = [
  {
    name: "Free",
    price: "$0",
    tagline: "For trying Collab with a small team.",
    icon: FaRocket,
    highlights: ["1 workspace", "Up to 3 members", "Chat, tasks, notes, docs", "Invite links & codes"],
    cta: "Get started",
    accent: "border-white/10 bg-white/5",
  },
  {
    name: "Pro",
    price: "$9",
    per: "per seat / month",
    tagline: "For teams shipping weekly.",
    icon: FaCrown,
    highlights: ["Unlimited workspaces", "Higher member limits", "Workspace analytics", "AI summaries & drafts (optional)"],
    cta: "Start Pro",
    accent: "border-cyan-400/40 bg-cyan-500/10",
  },
  {
    name: "Business",
    price: "Contact",
    tagline: "For organizations that need controls.",
    icon: FaShieldAlt,
    highlights: ["SSO/SAML (roadmap)", "Audit logs (roadmap)", "Advanced permissions", "Priority support"],
    cta: "Contact sales",
    accent: "border-white/10 bg-white/5",
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <MarketingShell>
      <main className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Simple plans that scale with your team
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 md:text-lg">
            Start free. Upgrade when you need more workspaces, more members, and stronger admin controls.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className={`rounded-2xl border p-6 backdrop-blur-xl ${plan.accent}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{plan.name}</p>
                    <p className="mt-1 text-xs text-white/60">{plan.tagline}</p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
                    <Icon />
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-3xl font-bold text-white">{plan.price}</p>
                  {plan.per && <p className="mt-1 text-xs text-white/55">{plan.per}</p>}
                </div>

                <ul className="mt-5 space-y-2 text-sm text-white/70">
                  {plan.highlights.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <FaCheck className="mt-1 text-cyan-300" aria-hidden="true" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    if (plan.name === "Business") navigate("/contact");
                    else navigate("/signup");
                  }}
                  className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    plan.name === "Pro"
                      ? "bg-cyan-400 text-black hover:bg-cyan-300"
                      : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </button>

                {plan.name !== "Free" && (
                  <p className="mt-3 text-xs text-white/45">
                    Billing is a roadmap item; this page communicates intended plans and scope.
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <section className="mx-auto mt-14 max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl md:mt-16 md:p-10">
          <h2 className="text-xl font-semibold text-white">FAQ</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-white">Do you charge per seat?</p>
              <p className="mt-1 text-sm text-white/65">
                Pro is intended to be seat-based so teams can scale predictably. You can start on Free to validate fit.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Can I cancel anytime?</p>
              <p className="mt-1 text-sm text-white/65">
                Yes. When billing is implemented, you’ll be able to downgrade or cancel from workspace settings.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Is my data private?</p>
              <p className="mt-1 text-sm text-white/65">
                Collab uses secure cookies and CSRF protection. See the Security page for the current posture and roadmap.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Do you support SSO?</p>
              <p className="mt-1 text-sm text-white/65">
                Not yet—SSO and audit logs are planned for Business. The roadmap is documented transparently.
              </p>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
};

export default Pricing;

