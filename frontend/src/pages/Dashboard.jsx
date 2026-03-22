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
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";
import logoImage from "../assets/collab-logo.png";
import { useAuth } from "../auth/useAuth";

const DashboardBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars radius={100} depth={50} count={2500} factor={4} saturation={0} fade speed={1.5} />
      </Canvas>
    </div>
  );
};

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

        let wsRes = { data: [] };
        if (user?.isDemo) {
          wsRes.data = [
            {
              _id: "demo-ws-1",
              name: "Alpha Project",
              description: "Main startup repository",
              currentUserRole: "owner",
              deadline: new Date(Date.now() + 86400000 * 5),
            },
            {
              _id: "demo-ws-2",
              name: "Internal Tools",
              description: "Company scripts and utils",
              currentUserRole: "admin",
            },
          ];
          await new Promise((r) => setTimeout(r, 600));
        } else {
          wsRes = await API.get("/workspaces");
        }

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

        if (user?.isDemo) {
          await new Promise((r) => setTimeout(r, 400));
          if (!cancelled) {
            setMyTasks([
              {
                _id: "task-1",
                title: "Fix authentication flow",
                workspaceId: "demo-ws-1",
                workspaceName: "Alpha Project",
                status: "in_progress",
                deadline: new Date(Date.now() + 86400000 * 2),
              },
              {
                _id: "task-2",
                title: "Update landing page copy",
                workspaceId: "demo-ws-1",
                workspaceName: "Alpha Project",
                status: "todo",
                deadline: new Date(Date.now() + 86400000 * 5),
              },
            ]);
            setMyTasksLoading(false);
          }
          return;
        }

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
      localStorage.removeItem("collab_welcome_seen_v1");
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  // Storyboard variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }
  };

  return (
    <main className="relative min-h-screen px-3 py-5 sm:px-4 md:px-6 bg-[#0e0e10]">
      <DashboardBackground />
      
      <motion.div 
        className="relative z-10 mx-auto max-w-7xl space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.header 
          variants={itemVariants} 
          className="glassmorphic-card p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3">
            <motion.img 
              whileHover={{ rotate: 10, scale: 1.1 }}
              src={logoImage} 
              alt="Collab logo" 
              className="h-10 w-10 rounded-lg shadow-[0_0_15px_rgba(0,217,255,0.3)]" 
            />
            <img
              src={user?.avatar || "https://ui-avatars.com/api/?background=111827&color=67e8f9&name=" + encodeURIComponent(user?.displayName || user?.username || "User")}
              alt="User avatar"
              className="h-10 w-10 rounded-full border border-white/20 object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-wide text-cyan-400 drop-shadow-[0_0_5px_rgba(0,217,255,0.5)]">Collab Dashboard</p>
              <h1 className="text-lg font-semibold text-white drop-shadow-md">
                {user?.displayName || user?.username || "Collaborator"}
              </h1>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3 sm:items-center md:flex md:flex-wrap">
            <Link to="/workspaces">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20 hover:shadow-[0_0_15px_rgba(0,217,255,0.2)]"
              >
                <FaUsers /> Workspaces
              </motion.button>
            </Link>
            <Link to="/repos">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                <FaGithub /> GitHub
              </motion.button>
            </Link>
            <motion.button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </motion.button>
          </div>
        </motion.header>

        {loading && (
          <motion.section variants={itemVariants} className="glassmorphic-card p-5">
            <div className="space-y-3">
              <div className="h-4 w-40 animate-pulse rounded bg-white/15" />
              <div className="h-20 w-full animate-pulse rounded-xl bg-white/10" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-28 animate-pulse rounded-xl bg-white/10" />
                <div className="h-28 animate-pulse rounded-xl bg-white/10" />
              </div>
              <p className="text-sm text-white/65">Loading dashboard...</p>
            </div>
          </motion.section>
        )}

        {!loading && error && (
          <motion.section variants={itemVariants} className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
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
            <motion.section variants={containerVariants} className="grid gap-4 lg:grid-cols-3">
              <motion.article variants={itemVariants} className="glassmorphic-card p-5 lg:col-span-2 relative overflow-hidden group">
                {/* Subtle gradient orb for premium feel */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px] group-hover:bg-cyan-500/20 transition-all duration-700" />
                
                <h2 className="text-2xl font-semibold text-white drop-shadow-sm">Collaborate in real-time</h2>
                <p className="mt-2 text-sm text-white/70 max-w-md">
                  Manage workspaces, track tasks, chat with your team, and keep documents in sync seamlessly across the globe.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/workspaces">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,217,255,0.3)] transition hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
                    >
                      <FaPlus /> New workspace
                    </motion.button>
                  </Link>
                  <Link to="/repos">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    >
                      <FaGithub /> Connect repos
                    </motion.button>
                  </Link>
                </div>
              </motion.article>

              <motion.article variants={itemVariants} className="glassmorphic-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                  <span className="p-1.5 rounded-md bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                    <FaBolt />
                  </span>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                  {['Team', 'Console', 'Commits', 'Metrics'].map((action, i) => (
                    <motion.button 
                      key={action}
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-xl border border-white/10 bg-black/40 p-3 text-white/80 transition shadow-inner"
                    >
                      {action}
                    </motion.button>
                  ))}
                </div>
              </motion.article>
            </motion.section>

            {workspaces.length === 0 && (
              <motion.section variants={itemVariants} className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5 backdrop-blur-xl shadow-[0_0_30px_rgba(0,217,255,0.1)]">
                <h3 className="text-lg font-semibold text-white drop-shadow-sm">Set Up Your First Workspace</h3>
                <p className="mt-1 text-sm text-cyan-100/80">
                  Create a workspace, invite your team, assign tasks, and start collaborating in real-time.
                </p>
                <div className="mt-5 grid gap-3 text-sm text-white/90 md:grid-cols-3">
                  <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 shadow-inner">
                    <span className="text-cyan-400 font-bold mr-2">01</span> Create workspace
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 shadow-inner">
                    <span className="text-cyan-400 font-bold mr-2">02</span> Invite members
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 shadow-inner">
                    <span className="text-cyan-400 font-bold mr-2">03</span> Start tasks and chat
                  </motion.div>
                </div>
                <div className="mt-6">
                  <Link to="/workspaces">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(0,217,255,0.5)" }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-black transition"
                    >
                      <FaPlus /> Create First Workspace
                    </motion.button>
                  </Link>
                </div>
              </motion.section>
            )}

            <motion.section variants={containerVariants} className="grid gap-4 lg:grid-cols-3">
              <motion.article variants={itemVariants} className="glassmorphic-card p-5 lg:col-span-2">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                  <span className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]">
                    <FaUsers />
                  </span>
                  Recent workspaces
                </h3>
                {recentWorkspaces.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-black/20 p-8 text-center text-sm text-white/50">
                    You do not have any workspaces yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentWorkspaces.map((ws) => (
                      <Link key={ws._id} to={`/workspaces/${ws._id}`}>
                        <motion.div
                          whileHover={{ scale: 1.01, backgroundColor: "rgba(0, 217, 255, 0.05)", borderColor: "rgba(0, 217, 255, 0.3)" }}
                          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-black/30 p-4 transition-colors shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-white drop-shadow-sm">{ws.name}</p>
                            {ws.description && (
                              <p className="mt-1 line-clamp-1 text-sm text-white/50">{ws.description}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {ws.currentUserRole && (
                              <span className="w-fit rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cyan-300 shadow-[0_0_10px_rgba(0,217,255,0.1)]">
                                {ws.currentUserRole}
                              </span>
                            )}
                            {ws.deadline && (
                              <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${getDeadlineBadge(ws.deadline).className}`}>
                                {getDeadlineBadge(ws.deadline).label}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.article>

              <motion.article variants={itemVariants} className="glassmorphic-card p-5 relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-blue-500/10 blur-[60px] group-hover:bg-blue-500/20 transition-all duration-700" />
                <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                  <span className="p-1.5 rounded-md bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                    <FaChartLine />
                  </span>
                  System Status
                </h3>
                <div className="space-y-5 text-sm">
                  <div>
                    <div className="mb-2 flex items-center justify-between font-medium">
                      <span className="text-white/80">Socket</span>
                      <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">Stable</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between font-medium">
                      <span className="text-white/80">Workspaces</span>
                      <span className="text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">{workspaces.length}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((workspaces.length / 10) * 100, 100)}%` }}
                        transition={{ duration: 1, delay: 0.7 }}
                        className="h-full rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between font-medium">
                      <span className="text-white/80">Git Provider</span>
                      <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">Connected</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        transition={{ duration: 1, delay: 0.9 }}
                        className="h-full rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
                      />
                    </div>
                  </div>
                </div>
              </motion.article>
            </motion.section>

            <motion.section variants={itemVariants} className="glassmorphic-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <span className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                  <FaTasks />
                </span>
                My Tasks
              </h3>

              {myTasksLoading && (
                <div className="flex items-center gap-3 text-sm text-cyan-200/60 p-4">
                  <div className="h-4 w-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                  Loading assigned tasks...
                </div>
              )}

              {!myTasksLoading && myTasks.length === 0 && (
                <div className="rounded-xl border border-white/5 bg-black/20 p-8 text-center text-sm text-white/50">
                  No tasks assigned to you yet.
                </div>
              )}

              {!myTasksLoading && myTasks.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myTasks.map((task, i) => {
                    const deadlineBadge = getDeadlineBadge(task.deadline);
                    return (
                      <Link key={`${task.workspaceId}-${task._id}`} to={`/workspaces/${task.workspaceId}`}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * i }}
                          whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 217, 255, 0.05)", borderColor: "rgba(0, 217, 255, 0.3)" }}
                          className="flex h-full flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-4 shadow-sm"
                        >
                          <div>
                            <p className="truncate text-base font-semibold text-white">{task.title}</p>
                            <p className="mt-1 truncate text-xs text-white/50">{task.workspaceName}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-white/80">
                              {task.status?.replace("_", " ") || "todo"}
                            </span>
                            <span className={`rounded-md border px-2 py-1 text-xs font-medium ${deadlineBadge.className}`}>
                              <span className="inline-flex items-center gap-1">
                                <FaCalendarAlt />
                                {deadlineBadge.label}
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

      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#1a1a1f] shadow-[0_0_50px_rgba(0,217,255,0.15)]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="relative p-6">
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-[40px]" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-4">
                    <img src={logoImage} alt="Collab logo" className="h-12 w-12 rounded-xl shadow-[0_0_15px_rgba(0,217,255,0.3)]" />
                    <div>
                      <h2 className="text-xl font-bold text-white drop-shadow-sm">Welcome to Collab</h2>
                      <p className="text-sm text-cyan-200/80">Your team workspace is ready.</p>
                    </div>
                  </div>
                  <ul className="mb-6 space-y-3 text-sm text-white/80">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-400">1</span>
                      <span>Open a workspace and invite your teammates.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-400">2</span>
                      <span>Use chat, tasks, docs, and notes in one flow.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-400">3</span>
                      <span>Press Cmd/Ctrl + K or click Ask AI for instant help.</span>
                    </li>
                  </ul>
                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        localStorage.setItem("collab_welcome_seen_v1", "true");
                        setShowWelcome(false);
                      }}
                      className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
                    >
                      Got it
                    </motion.button>
                    <Link
                      to="/workspaces"
                      onClick={() => {
                        localStorage.setItem("collab_welcome_seen_v1", "true");
                        setShowWelcome(false);
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0,217,255,0.4)" }}
                        whileTap={{ scale: 0.95 }}
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
