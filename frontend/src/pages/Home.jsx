import React from "react";
import { FaClock, FaLock, FaRocket, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import MarketingShell from "../components/MarketingShell";

const features = [
  {
    icon: FaUsers,
    title: "Team Collaboration",
    desc: "Work together with your team in real-time",
  },
  {
    icon: FaLock,
    title: "Secure & Private",
    desc: "Your data is encrypted and secure",
  },
  {
    icon: FaClock,
    title: "Real-time Sync",
    desc: "Changes sync instantly across all devices",
  },
  {
    icon: FaRocket,
    title: "Lightning Fast",
    desc: "Optimized for speed and performance",
  },
];

const Home = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  // No refreshUser() call here — AuthProvider already loads the user on boot.
  // Calling refreshUser() on every Home visit caused the loading screen to
  // appear on every page visit even when the user was already authenticated.

  return (
    <MarketingShell>
      <main>
        <section className="mx-auto max-w-4xl px-4 py-16 text-center md:px-6 md:py-20">
          <h2 className="text-4xl font-bold leading-tight text-white md:text-5xl">
            Collaborate in Real-Time
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 md:text-lg">
            A shared workspace for teams to chat, manage tasks, edit documents,
            and ship faster — all in one place.
          </p>

          {!user && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Get Started Free
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Sign In
              </button>
            </div>
          )}

          {user && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6 md:pb-20">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-semibold text-white">Why Choose Collab?</h3>
            <p className="mt-2 text-sm text-white/70">
              Everything you need for seamless team collaboration
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-400/40"
                >
                  <Icon className="text-2xl text-cyan-300" aria-hidden="true" />
                  <h4 className="mt-4 text-lg font-semibold text-white">{feature.title}</h4>
                  <p className="mt-2 text-sm text-white/70">{feature.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        {!user && (
          <section className="mx-auto max-w-4xl px-4 pb-20 text-center md:px-6">
            <h3 className="text-2xl font-semibold text-white">Ready to get started?</h3>
            <p className="mt-2 text-white/70">
              Built for students who are tired of sharing zip files on WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="mt-6 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Create Free Account
            </button>
          </section>
        )}
      </main>
    </MarketingShell>
  );
};

export default Home;
