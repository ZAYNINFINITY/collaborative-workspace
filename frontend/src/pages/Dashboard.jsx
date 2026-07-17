import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaGithub, FaPlus, FaUsers, FaChartLine,
  FaBolt, FaTasks, FaCalendarAlt, FaRocket,
  FaCog, FaCode,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";
import logoImage from "../assets/collab-logo.png";
import { useAuth } from "../auth/useAuth";
import { socket } from "../socket";

// ─── CSS-only star background (replaces Three.js canvas — no WebGL context) ──
const DashboardBackground = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40" aria-hidden="true">
    <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0d0d1f] to-[#0a0a14]" />
    {/* Static noise dots via CSS — zero GPU cost */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDeadlineBadge = (deadline) => {
  if (!deadline) return { label: "No deadline", className: "border-white/20 bg-white/10 text-white/65" };
  const diffMs   = new Date(deadline) - new Date();
  const hoursLeft = Math.ceil(diffMs / 3_600_000);
  const daysLeft  = Math.ceil(diffMs / 86_400_000);
  if (diffMs < 0)       return { label: "Overdue",        className: "border-red-400/30 bg-red-500/20 text-red-200" };
  if (hoursLeft <= 24)  return { label: `${hoursLeft}h left`, className: "border-orange-400/30 bg-orange-500/20 text-orange-200" };
  if (daysLeft  <= 7)   return { label: `${daysLeft}d left`,  className: "border-amber-400/30 bg-amber-500/20 text-amber-200" };
  return { label: `${daysLeft}d left`, className: "border-emerald-400/30 bg-emerald-500/20 text-emerald-200" };
};

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 13 } },
};
const modalVariants = {
  hidden:  { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1,   y: 0,  transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit:    { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.18 } },
};

// ─── Quick Actions definition ─────────────────────────────────────────────────
// Each action has a real destination or handler.
// "Console" and "Metrics" are hidden until built — they were dead placeholders.
const QUICK_ACTIONS = [
  { label: "Team",       icon: FaUsers,    to: "/workspaces",  description: "View all workspaces" },
  { label: "GitHub",     icon: FaGithub,   to: "/repos",       description: "Browse connected repos" },
  { label: "New Space",  icon: FaPlus,     to: "/onboarding",  description: "Create a workspace" },
  { label: "Settings",   icon: FaCog,      to: "/settings",    description: "Account settings" },
];

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout }       = useAuth();
  const navigate               = useNavigate();
  const [workspaces, setWs]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState("");
  const [loggingOut, setLO]    = useState(false);
  const [showWelcome, setSW]   = useState(false);
  const [myTasks, setMyTasks]  = useState([]);
  const [tasksLoading, setTL]  = useState(false);
  const [socketOk, setSocketOk]= useState(socket.connected);

  // ── Real socket status ─────────────────────────────────────────────────────
  useEffect(() => {
    const onConnect    = () => setSocketOk(true);
    const onDisconnect = () => setSocketOk(false);
    socket.on("connect",    onConnect);
    socket.on("disconnect", onDisconnect);
    return () => { socket.off("connect", onConnect); socket.off("disconnect", onDisconnect); };
  }, []);

  // ── Load workspaces ────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get("/workspaces");
        if (mounted) setWs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!mounted) return;
        if (err.response?.status === 401) { await logout(); navigate("/login", { replace: true }); return; }
        setError("Failed to load dashboard. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [logout, navigate]);

  // ── Load my tasks via single endpoint (no N+1) ────────────────────────────
  // Falls back to the old parallel-fetch method if the new endpoint 404s
  // (so the dashboard still works before the backend is updated).
  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    (async () => {
      try {
        setTL(true);
        let tasks = [];
        try {
          const res = await API.get("/workspaces/my-tasks");
          tasks = Array.isArray(res.data) ? res.data : [];
        } catch (e) {
          if (e.response?.status !== 404) throw e;
          // Fallback: old parallel fetch (max 8 workspaces)
          if (workspaces.length > 0) {
            const results = await Promise.allSettled(
              workspaces.slice(0, 8).map((ws) => API.get(`/workspaces/${ws._id}`))
            );
            results.forEach((r, i) => {
              if (r.status !== "fulfilled") return;
              const ws = workspaces[i];
              (r.value.data?.tasks || []).forEach((t) => {
                const aid = typeof t.assignee === "string" ? t.assignee : t.assignee?._id;
                if (aid === user._id) tasks.push({ ...t, workspaceId: ws._id, workspaceName: ws.name });
              });
            });
          }
        }
        tasks.sort((a, b) => {
          const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return ad - bd;
        });
        if (!cancelled) setMyTasks(tasks.slice(0, 8));
      } finally {
        if (!cancelled) setTL(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?._id, workspaces]);

  // ── Welcome modal ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && !localStorage.getItem("collab_welcome_seen_v1")) setSW(true);
  }, [user]);

  const recentWorkspaces = useMemo(() => workspaces.slice(0, 4), [workspaces]);

  const handleLogout = async () => {
    try {
      setLO(true);
      localStorage.removeItem("collab_welcome_seen_v1");
      await logout();
    } finally {
      setLO(false);
    }
  };

  return (
    <main className="relative min-h-screen px-3 py-5 sm:px-4 md:px-6 bg-canvasDark">
      <DashboardBackground />
      <div className="engineering-grid" />

      <motion.div
        className="relative z-10 mx-auto max-w-7xl space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Header ── */}
        <motion.header
          variants={itemVariants}
          className="glass-panel p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3">
            <motion.img
              whileHover={{ rotate: 10, scale: 1.1 }}
              src={logoImage}
              alt="Collab logo"
              className="h-10 w-10 rounded-lg shadow-[0_0_15px_rgba(0,217,255,0.3)]"
            />
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?background=111827&color=67e8f9&name=${encodeURIComponent(
                  user?.displayName || user?.username || "User"
                )}`
              }
              alt="User avatar"
              className="h-10 w-10 rounded-full border border-white/20 object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-wide text-cyan-400">
                Collab Dashboard
              </p>
              <h1 className="text-lg font-semibold text-white">
                {user?.displayName || user?.username || "Collaborator"}
              </h1>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3 sm:items-center md:flex md:flex-wrap">
            <Link to="/workspaces">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
              >
                <FaUsers /> Workspaces
              </motion.button>
            </Link>
            <Link to="/repos">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <FaGithub /> GitHub
              </motion.button>
            </Link>
            <motion.button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-full rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </motion.button>
          </div>
        </motion.header>

        {/* ── Loading skeleton ── */}
        {loading && (
          <motion.section variants={itemVariants} className="glass-panel p-5 space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-white/15" />
            <div className="h-20 w-full animate-pulse rounded-xl bg-white/10" />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-28 animate-pulse rounded-xl bg-white/10" />
              <div className="h-28 animate-pulse rounded-xl bg-white/10" />
            </div>
          </motion.section>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <motion.section
            variants={itemVariants}
            className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
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
          </motion.section>
        )}

        {!loading && !error && (
          <>
            {/* ── Hero + Quick Actions ── */}
            <motion.section variants={containerVariants} className="grid gap-4 lg:grid-cols-3">
              {/* Hero */}
              <motion.article
                variants={itemVariants}
                className="glass-panel p-5 lg:col-span-2 relative overflow-hidden group"
              >
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px] group-hover:bg-cyan-500/20 transition-all duration-700" />
                <h2 className="text-2xl font-semibold text-white">Collaborate in real-time</h2>
                <p className="mt-2 text-sm text-white/70 max-w-md">
                  Manage workspaces, track tasks, chat with your team, and keep
                  documents in sync — all in one place.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/workspaces">
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,217,255,0.3)] transition hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
                    >
                      <FaPlus /> New workspace
                    </motion.button>
                  </Link>
                  <Link to="/repos">
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      <FaGithub /> Connect repos
                    </motion.button>
                  </Link>
                </div>
              </motion.article>

              {/* Quick Actions — all wired, no dead buttons */}
              <motion.article variants={itemVariants} className="glass-panel p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <span className="rounded-md bg-purple-500/20 p-1.5 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                    <FaBolt />
                  </span>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
                    <Link key={label} to={to}>
                      <motion.div
                        whileHover={{ scale: 1.04, backgroundColor: "rgba(0,217,255,0.08)", borderColor: "rgba(0,217,255,0.3)" }}
                        whileTap={{ scale: 0.96 }}
                        className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-center cursor-pointer transition"
                      >
                        <Icon className="text-lg text-cyan-300" />
                        <span className="text-xs font-medium text-white/80">{label}</span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.article>
            </motion.section>

            {/* ── Empty state ── */}
            {workspaces.length === 0 && (
              <motion.section
                variants={itemVariants}
                className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5 backdrop-blur-xl"
              >
                <h3 className="text-lg font-semibold text-white">Set up your first workspace</h3>
                <p className="mt-1 text-sm text-cyan-100/80">
                  Create a workspace, invite your group via a 6-character code,
                  assign tasks, and start collaborating.
                </p>
                <div className="mt-5 grid gap-3 text-sm text-white/90 md:grid-cols-3">
                  {["Create workspace", "Invite your group", "Assign tasks"].map((s, i) => (
                    <div key={s} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                      <span className="mr-2 font-bold text-cyan-400">0{i + 1}</span>{s}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Link to="/onboarding">
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-black transition sm:w-auto"
                    >
                      <FaRocket /> Guided setup
                    </motion.button>
                  </Link>
                  <Link to="/workspaces">
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
                    >
                      <FaPlus /> Create workspace
                    </motion.button>
                  </Link>
                </div>
              </motion.section>
            )}

            {/* ── Workspaces + System Status ── */}
            <motion.section variants={containerVariants} className="grid gap-4 lg:grid-cols-3">
              {/* Recent workspaces */}
              <motion.article variants={itemVariants} className="glass-panel p-5 lg:col-span-2">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <span className="rounded-md bg-amber-500/20 p-1.5 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]">
                    <FaUsers />
                  </span>
                  Recent workspaces
                </h3>
                {recentWorkspaces.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-black/20 p-8 text-center text-sm text-white/50">
                    No workspaces yet. Create one above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentWorkspaces.map((ws) => {
                      const badge = getDeadlineBadge(ws.deadline);
                      return (
                        <Link key={ws._id} to={`/workspaces/${ws._id}`}>
                          <motion.div
                            whileHover={{ scale: 1.01, borderColor: "rgba(0,217,255,0.3)" }}
                            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-black/30 p-4 transition"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-white">{ws.name}</p>
                              {ws.description && (
                                <p className="mt-0.5 line-clamp-1 text-sm text-white/50">{ws.description}</p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {ws.currentUserRole && (
                                <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cyan-300">
                                  {ws.currentUserRole}
                                </span>
                              )}
                              {ws.deadline && (
                                <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                                  {badge.label}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </motion.article>

              {/* System Status — real data only, no fakes */}
              <motion.article variants={itemVariants} className="glass-panel p-5 relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-blue-500/10 blur-[60px] group-hover:bg-blue-500/20 transition-all duration-700" />
                <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <span className="rounded-md bg-blue-500/20 p-1.5 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                    <FaChartLine />
                  </span>
                  System Status
                </h3>
                <div className="space-y-5 text-sm">
                  {/* Real socket status */}
                  <div>
                    <div className="mb-2 flex items-center justify-between font-medium">
                      <span className="text-white/80">Real-time</span>
                      <span className={socketOk ? "text-emerald-400" : "text-amber-300"}>
                        {socketOk ? "Connected" : "Reconnecting…"}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: socketOk ? "100%" : "30%" }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${socketOk ? "bg-emerald-400" : "bg-amber-300"}`}
                      />
                    </div>
                  </div>
                  {/* Real workspace count */}
                  <div>
                    <div className="mb-2 flex items-center justify-between font-medium">
                      <span className="text-white/80">Workspaces</span>
                      <span className="text-purple-400">{workspaces.length}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((workspaces.length / 10) * 100, 100)}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full bg-purple-500"
                      />
                    </div>
                  </div>
                  {/* Real task count */}
                  <div>
                    <div className="mb-2 flex items-center justify-between font-medium">
                      <span className="text-white/80">My tasks</span>
                      <span className="text-cyan-400">{myTasks.length}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((myTasks.length / 10) * 100, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full bg-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              </motion.article>
            </motion.section>

            {/* ── My Tasks ── */}
            <motion.section variants={itemVariants} className="glass-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <span className="rounded-md bg-cyan-500/20 p-1.5 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                    <FaTasks />
                  </span>
                  My Tasks
                </h3>
                {myTasks.length > 0 && (
                  <span className="text-xs text-white/40">{myTasks.length} assigned</span>
                )}
              </div>

              {tasksLoading && (
                <div className="flex items-center gap-3 p-4 text-sm text-cyan-200/60">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
                  Loading tasks…
                </div>
              )}

              {!tasksLoading && myTasks.length === 0 && (
                <div className="rounded-xl border border-white/5 bg-black/20 p-8 text-center text-sm text-white/50">
                  No tasks assigned to you yet.
                </div>
              )}

              {!tasksLoading && myTasks.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myTasks.map((task, i) => {
                    const badge = getDeadlineBadge(task.deadline);
                    return (
                      <Link key={`${task.workspaceId}-${task._id}`} to={`/workspaces/${task.workspaceId}`}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * i }}
                          whileHover={{ scale: 1.02, borderColor: "rgba(0,217,255,0.3)" }}
                          className="flex h-full flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-4"
                        >
                          <div>
                            <p className="truncate text-base font-semibold text-white">{task.title}</p>
                            <p className="mt-0.5 truncate text-xs text-white/50">{task.workspaceName}</p>
                          </div>
                          <div className="mt-2 flex items-center gap-2 border-t border-white/5 pt-2">
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-white/80">
                              {task.status?.replace("_", " ") || "todo"}
                            </span>
                            <span className={`rounded-md border px-2 py-1 text-xs font-medium ${badge.className}`}>
                              <span className="inline-flex items-center gap-1">
                                <FaCalendarAlt />{badge.label}
                              </span>
                            </span>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.section>
          </>
        )}
      </motion.div>

      {/* ── Welcome modal ── */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#1a1a1f] shadow-[0_0_50px_rgba(0,217,255,0.15)]"
              variants={modalVariants} initial="hidden" animate="visible" exit="exit"
            >
              <div className="relative p-6">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-[40px]" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-4">
                    <img src={logoImage} alt="Collab logo" className="h-12 w-12 rounded-xl shadow-[0_0_15px_rgba(0,217,255,0.3)]" />
                    <div>
                      <h2 className="text-xl font-bold text-white">Welcome to Collab</h2>
                      <p className="text-sm text-cyan-200/80">Your team workspace is ready.</p>
                    </div>
                  </div>
                  <ul className="mb-6 space-y-3 text-sm text-white/80">
                    {[
                      "Create a workspace and invite your group via the 6-character code.",
                      "Assign tasks, chat, and upload files — all in one workspace.",
                      "See who contributed what on the workspace home screen.",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-400">
                          {i + 1}
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { localStorage.setItem("collab_welcome_seen_v1", "true"); setSW(false); }}
                      className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
                    >
                      Got it
                    </motion.button>
                    <Link
                      to="/workspaces"
                      onClick={() => { localStorage.setItem("collab_welcome_seen_v1", "true"); setSW(false); }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(0,217,255,0.2)] transition"
                      >
                        Open Workspaces
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Dashboard;
