import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaGithub,
  FaPlus,
  FaUsers,
  FaChartLine,
  FaBolt,
  FaTasks,
  FaCalendarAlt,
} from "react-icons/fa";
import API from "../api";
import logoImage from "../assets/collab-logo.png";
import { useAuth } from "../auth/useAuth";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [myTasks, setMyTasks] = useState([]);
  const [myTasksLoading, setMyTasksLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const wsRes = await API.get("/workspaces");

        if (!mounted) return;
        setWorkspaces(Array.isArray(wsRes.data) ? wsRes.data : []);
      } catch (err) {
        if (!mounted) return;
        if (err.response?.status === 401) {
          await logout();
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
  }, [navigate, logout]);

  const recentWorkspaces = useMemo(() => workspaces.slice(0, 4), [workspaces]);

  const getDeadlineBadge = (deadline) => {
    if (!deadline) {
      return {
        label: "No deadline",
        className: "border-white/20 bg-white/10 text-white/65",
      };
    }

    const now = new Date();
    const dueDate = new Date(deadline);
    const diffMs = dueDate - now;
    const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return {
        label: "Overdue",
        className: "border-red-400/30 bg-red-500/20 text-red-200",
      };
    }

    if (hoursLeft <= 24) {
      return {
        label: `${hoursLeft}h left`,
        className: "border-orange-400/30 bg-orange-500/20 text-orange-200",
      };
    }

    if (daysLeft <= 7) {
      return {
        label: `${daysLeft}d left`,
        className: "border-amber-400/30 bg-amber-500/20 text-amber-200",
      };
    }

    return {
      label: `${daysLeft}d left`,
      className: "border-emerald-400/30 bg-emerald-500/20 text-emerald-200",
    };
  };

  useEffect(() => {
    if (!user) return;
    const welcomeSeen = localStorage.getItem("collab_welcome_seen_v1");
    if (!welcomeSeen) {
      setShowWelcome(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user?._id || workspaces.length === 0) {
      setMyTasks([]);
      return;
    }

    let cancelled = false;

    const fetchMyTasks = async () => {
      try {
        setMyTasksLoading(true);
        const sourceWorkspaces = workspaces.slice(0, 8);

        const detailResults = await Promise.allSettled(
          sourceWorkspaces.map((ws) => API.get(`/workspaces/${ws._id}`)),
        );

        if (cancelled) return;

        const assignedTasks = [];
        detailResults.forEach((result, index) => {
          if (result.status !== "fulfilled") return;
          const workspace = sourceWorkspaces[index];
          const wsTasks = Array.isArray(result.value.data?.tasks)
            ? result.value.data.tasks
            : [];

          wsTasks.forEach((task) => {
            const assigneeId =
              typeof task.assignee === "string"
                ? task.assignee
                : task.assignee?._id;
            if (assigneeId && assigneeId === user._id) {
              assignedTasks.push({
                ...task,
                workspaceId: workspace._id,
                workspaceName: workspace.name,
              });
            }
          });
        });

        assignedTasks.sort((a, b) => {
          const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          return aDeadline - bDeadline;
        });

        setMyTasks(assignedTasks.slice(0, 8));
      } finally {
        if (!cancelled) setMyTasksLoading(false);
      }
    };

    fetchMyTasks();

    return () => {
      cancelled = true;
    };
  }, [user, workspaces]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } finally {
      setLoggingOut(false);
      localStorage.removeItem("collab_welcome_seen_v1");
      window.location.assign("/");
    }
  };

  return (
    <main className="min-h-screen px-3 py-5 sm:px-4 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Collab logo" className="h-10 w-10 rounded-lg" />
              <img
                src={user?.avatar || "https://ui-avatars.com/api/?background=111827&color=67e8f9&name=" + encodeURIComponent(user?.displayName || user?.username || "User")}
                alt="User avatar"
                className="h-10 w-10 rounded-full border border-white/20 object-cover"
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-cyan-300">Collab Dashboard</p>
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
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="space-y-3">
              <div className="h-4 w-40 animate-pulse rounded bg-white/15" />
              <div className="h-20 w-full animate-pulse rounded-xl bg-white/10" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-28 animate-pulse rounded-xl bg-white/10" />
                <div className="h-28 animate-pulse rounded-xl bg-white/10" />
              </div>
              <p className="text-sm text-white/65">Loading dashboard...</p>
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md border border-red-300/30 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/20"
              >
                Retry
              </button>
            </div>
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

            {workspaces.length === 0 && (
              <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 backdrop-blur-xl">
                <h3 className="text-base font-semibold text-white">Set Up Your First Workspace</h3>
                <p className="mt-1 text-sm text-white/70">
                  Create a workspace, invite your team, assign tasks, and start collaborating in real-time.
                </p>
                <div className="mt-4 grid gap-2 text-sm text-white/80 md:grid-cols-3">
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">1. Create workspace</p>
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">2. Invite members</p>
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">3. Start tasks and chat</p>
                </div>
                <div className="mt-4">
                  <Link
                    to="/workspaces"
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                  >
                    <FaPlus />
                    Create First Workspace
                  </Link>
                </div>
              </section>
            )}

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
                          <div className="flex flex-wrap items-center gap-2">
                            {ws.currentUserRole && (
                              <span className="w-fit rounded-md bg-cyan-500/20 px-2 py-1 text-xs uppercase tracking-wide text-cyan-200">
                                {ws.currentUserRole}
                              </span>
                            )}
                            {ws.deadline && (
                              <span
                                className={`rounded-md border px-2 py-1 text-xs ${getDeadlineBadge(ws.deadline).className}`}
                              >
                                {getDeadlineBadge(ws.deadline).label}
                              </span>
                            )}
                          </div>
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

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <FaTasks className="text-cyan-300" />
                My Tasks
              </h3>

              {myTasksLoading && <p className="text-sm text-white/60">Loading assigned tasks...</p>}

              {!myTasksLoading && myTasks.length === 0 && (
                <p className="text-sm text-white/60">
                  No tasks assigned to you yet.
                </p>
              )}

              {!myTasksLoading && myTasks.length > 0 && (
                <div className="space-y-2">
                  {myTasks.map((task) => {
                    const deadlineBadge = getDeadlineBadge(task.deadline);
                    return (
                      <Link
                        key={`${task.workspaceId}-${task._id}`}
                        to={`/workspaces/${task.workspaceId}`}
                        className="block rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{task.title}</p>
                            <p className="truncate text-xs text-white/60">{task.workspaceName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/70">
                              {task.status?.replace("_", " ") || "todo"}
                            </span>
                            <span className={`rounded-md border px-2 py-1 text-xs ${deadlineBadge.className}`}>
                              <span className="inline-flex items-center gap-1">
                                <FaCalendarAlt />
                                {deadlineBadge.label}
                              </span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/50">
            <div className="mb-3 flex items-center gap-3">
              <img src={logoImage} alt="Collab logo" className="h-10 w-10 rounded-lg" />
              <div>
                <h2 className="text-lg font-semibold text-white">Welcome to Collab</h2>
                <p className="text-xs text-white/60">Your team workspace is ready.</p>
              </div>
            </div>
            <ul className="mb-5 space-y-2 text-sm text-white/75">
              <li>Open a workspace and invite your teammates.</li>
              <li>Use chat, tasks, docs, and notes in one flow.</li>
              <li>Press Cmd/Ctrl + K or click Ask AI for instant help.</li>
            </ul>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("collab_welcome_seen_v1", "true");
                  setShowWelcome(false);
                }}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Got it
              </button>
              <Link
                to="/workspaces"
                onClick={() => {
                  localStorage.setItem("collab_welcome_seen_v1", "true");
                  setShowWelcome(false);
                }}
                className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Open Workspaces
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
