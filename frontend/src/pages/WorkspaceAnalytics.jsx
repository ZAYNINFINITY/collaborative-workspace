import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import API from "../api";

const statusStyles = {
  active: "bg-emerald-500/15 text-emerald-200 border-emerald-400/25",
  low: "bg-amber-500/15 text-amber-200 border-amber-400/25",
  inactive: "bg-red-500/15 text-red-200 border-red-400/25",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const WorkspaceAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get(`/workspaces/${id}/analytics`);
        if (!mounted) return;
        setData(res.data);
      } catch (err) {
        if (!mounted) return;
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError(err.response?.data?.msg || "Failed to load analytics.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const members = useMemo(() => {
    const list = Array.isArray(data?.members) ? data.members : [];
    if (filter === "all") return list;
    return list.filter((m) => m.activityStatus === filter);
  }, [data, filter]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Workspace Analytics</h1>
            <p className="mt-1 text-sm text-white/70">
              Contribution score = tasks done × 5 + versions × 2 + messages × 1
            </p>
            {data && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                  Progress: {data.progressPercent}% ({data.doneTasks}/{data.totalTasks} tasks)
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="low">Low activity</option>
              <option value="inactive">Inactive</option>
            </select>
            <RouterLink
              to={`/workspaces/${id}`}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Back to workspace
            </RouterLink>
          </div>
        </header>

        {loading && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            Loading analytics...
          </section>
        )}

        {!loading && error && (
          <section className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </section>
        )}

        {!loading && !error && (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/40 text-xs uppercase tracking-wide text-white/60">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Tasks</th>
                    <th className="px-4 py-3">Versions</th>
                    <th className="px-4 py-3">Messages</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.userId} className="border-t border-white/10">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {m.avatar ? (
                            <img
                              src={m.avatar}
                              alt={m.displayName || m.username || "User"}
                              className="h-9 w-9 rounded-full border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full border border-white/10 bg-white/10" />
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-white/90">
                              {m.displayName || m.username || "Member"}
                            </div>
                            <div className="truncate text-xs text-white/50">
                              {m.label || m.email || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/70">
                          {m.isOwner ? "owner" : m.role || "member"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-cyan-200">{m.score}</td>
                      <td className="px-4 py-3">{m.tasksCompleted}</td>
                      <td className="px-4 py-3">{m.versionCount}</td>
                      <td className="px-4 py-3">{m.messageCount}</td>
                      <td className="px-4 py-3 text-xs text-white/70">{formatDateTime(m.lastActiveAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                            statusStyles[m.activityStatus] ||
                            "bg-white/10 text-white/70 border-white/15"
                          }`}
                        >
                          {m.activityStatus}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {members.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-white/60">
                        No members to show.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default WorkspaceAnalytics;

