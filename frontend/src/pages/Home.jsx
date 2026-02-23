import React, { useEffect, useState } from "react";
import { FaClock, FaLock, FaRocket, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../api";
import logoImage from "../assets/collab-logo.png";

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
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await API.get("/auth/user");
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white/70">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Collab" className="h-10 w-10 rounded-lg" />
            <h1 className="text-xl font-semibold text-cyan-300">Collab</h1>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm text-white/80 sm:inline">
                  Welcome, {user.displayName || user.username}!
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:px-6 md:py-20">
        <h2 className="text-4xl font-bold leading-tight text-white md:text-5xl">
          Collaborate in Real-Time
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 md:text-lg">
          Build amazing things together. Chat, share documents, manage tasks,
          and track progress all in one place.
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
            Join thousands of teams already collaborating on Collab.
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
  );
};

export default Home;
