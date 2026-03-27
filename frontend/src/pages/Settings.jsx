import React, { useMemo, useState } from "react";
import { FaBell, FaKey, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const tabs = [
  { id: "profile", label: "Profile", icon: FaUserCircle },
  { id: "security", label: "Security", icon: FaKey },
  { id: "notifications", label: "Notifications", icon: FaBell },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const active = useMemo(() => tabs.find((t) => t.id === activeTab) || tabs[0], [activeTab]);

  return (
    <main className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Account</p>
            <h1 className="text-2xl font-semibold text-white">Settings</h1>
            <p className="mt-1 text-sm text-white/60">
              Manage your account preferences. Some settings are roadmap items.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Back to dashboard
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-[260px,1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
            <nav className="space-y-1" aria-label="Settings tabs">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = t.id === activeTab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                        : "border-transparent text-white/75 hover:border-white/10 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="text-xs" />
                    <span className="font-medium">{t.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="my-3 border-t border-white/10" />

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
            >
              <FaSignOutAlt />
              Sign out
            </button>
          </aside>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">{active.label}</h2>
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/60">
                Roadmap-aware
              </span>
            </div>

            {activeTab === "profile" && (
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <p>
                  Signed in as{" "}
                  <span className="font-semibold text-white">
                    {user?.displayName || user?.username || "Unknown user"}
                  </span>
                </p>
                <p className="text-xs text-white/55">
                  Profile editing can be added as part of Milestone 2 in `docs/ROADMAP.md`.
                </p>
              </div>
            )}

            {activeTab === "security" && (
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <p>Recommended next steps:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-white/65">
                  <li>Add password reset and email verification flows.</li>
                  <li>Show active sessions/devices and allow revocation.</li>
                  <li>Enable optional 2FA for paid tiers.</li>
                </ul>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <p>
                  Notifications exist in-app today. Email/push preferences can be implemented alongside outbound email setup.
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-white/65">
                  <li>Mentions and invite emails</li>
                  <li>Weekly activity digest</li>
                  <li>Do-not-disturb hours</li>
                </ul>
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
};

export default Settings;

