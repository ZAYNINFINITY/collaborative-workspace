import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGithub, FaPlus, FaUsers, FaChartLine, FaBolt, FaTerminal } from "react-icons/fa";
import API from "../api";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [userRes, wsRes] = await Promise.all([
          API.get("/auth/user"),
          API.get("/workspaces"),
        ]);

        if (!mounted) return;
        setUser(userRes.data);
        setWorkspaces(Array.isArray(wsRes.data) ? wsRes.data : []);
      } catch (err) {
        if (!mounted) return;
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const recentWorkspaces = useMemo(() => workspaces.slice(0, 4), [workspaces]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await API.post("/auth/logout");
      navigate("/login", { replace: true });
    } catch {
      setError("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen px-3 py-5 sm:px-4 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || "https://ui-avatars.com/api/?background=111827&color=67e8f9&name=" + encodeURIComponent(user?.displayName || user?.username || "User")}
                alt="User avatar"
                className="h-10 w-10 rounded-full border border-white/20 object-cover"
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/60">Dashboard</p>
                <h1 className="text-lg font-semibold text-white">
                  {user?.displayName || user?.username || "Collaborator"}
                </h1>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3 sm:items-center md:flex md:flex-wrap">
              <Link
                to="/workspaces"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
              >
                <FaUsers />
                Workspaces
              </Link>
              <Link
                to="/repos"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <FaGithub />
                GitHub
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </header>

        {loading && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            Loading dashboard...
          </section>
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:col-span-2">
                <h2 className="text-xl font-semibold text-white">Collaborate in real-time</h2>
                <p className="mt-2 text-sm text-white/70">
                  Manage workspaces, track tasks, chat with your team, and keep documents in sync.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/workspaces"
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                  >
                    <FaPlus />
                    New workspace
                  </Link>
                  <Link
                    to="/repos"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <FaGithub />
                    Connect repos
                  </Link>
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <FaBolt className="text-purple-300" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button className="rounded-lg border border-white/15 bg-white/5 p-3 text-white/80 transition hover:bg-white/10">Team</button>
                  <button className="rounded-lg border border-white/15 bg-white/5 p-3 text-white/80 transition hover:bg-white/10">Console</button>
                  <button className="rounded-lg border border-white/15 bg-white/5 p-3 text-white/80 transition hover:bg-white/10">Commits</button>
                  <button className="rounded-lg border border-white/15 bg-white/5 p-3 text-white/80 transition hover:bg-white/10">Metrics</button>
                </div>
              </article>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:col-span-2">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <FaUsers className="text-amber-300" />
                  Recent workspaces
                </h3>
                {recentWorkspaces.length === 0 ? (
                  <p className="text-sm text-white/60">You do not have any workspaces yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentWorkspaces.map((ws) => (
                      <Link
                        key={ws._id}
                        to={`/workspaces/${ws._id}`}
                        className="block rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{ws.name}</p>
                            {ws.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-white/60">{ws.description}</p>
                            )}
                          </div>
                          {ws.currentUserRole && (
                            <span className="w-fit rounded-md bg-cyan-500/20 px-2 py-1 text-xs uppercase tracking-wide text-cyan-200">
                              {ws.currentUserRole}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <FaChartLine className="text-cyan-300" />
                  System Status
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-white/70">
                      <span>Socket connection</span>
                      <span className="text-emerald-300">Stable</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 w-full rounded-full bg-emerald-400" /></div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-white/70">
                      <span>Active workspaces</span>
                      <span className="text-purple-300">{workspaces.length}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-purple-400" style={{ width: `${Math.min((workspaces.length / 10) * 100, 100)}%` }} /></div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-white/70">
                      <span>Git provider</span>
                      <span className="text-cyan-300">Connected</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 w-3/4 rounded-full bg-cyan-400" /></div>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Dashboard;
