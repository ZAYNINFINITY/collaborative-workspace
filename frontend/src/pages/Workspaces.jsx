import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import API from "../api";
import logoImage from "../assets/collab-logo.png";

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);
  const [joinCodeError, setJoinCodeError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await API.get("/workspaces");
        if (!isMounted) return;
        setWorkspaces(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError("Failed to load workspaces. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWorkspaces();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError("Name is required");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const res = await API.post("/workspaces", {
        name: name.trim(),
        description: description.trim(),
      });

      setWorkspaces((prev) => [res.data, ...prev]);
      setName("");
      setDescription("");
    } catch (err) {
      const msg = err.response?.data?.msg || "Failed to create workspace. Please try again.";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setJoinCodeError("Invitation code is required.");
      return;
    }

    try {
      setJoiningCode(true);
      setJoinCodeError("");
      const res = await API.post("/workspaces/join-by-code", { code });
      const workspaceId = res.data?.workspaceId;
      if (workspaceId) {
        navigate(`/workspaces/${workspaceId}`);
        return;
      }
      setJoinCodeError("Joined, but workspace could not be opened automatically.");
    } catch (err) {
      setJoinCodeError(err.response?.data?.msg || "Failed to join with invitation code.");
    } finally {
      setJoiningCode(false);
    }
  };

  return (
    <main className="min-h-screen px-3 py-6 sm:px-4 md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Collab logo" className="h-10 w-10 rounded-lg" />
            <div>
              <p className="text-xs uppercase tracking-wide text-cyan-300">Collab</p>
              <h1 className="text-2xl font-semibold text-white">Workspaces</h1>
            </div>
          </div>
          <RouterLink
            to="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 sm:w-auto"
          >
            Back to dashboard
          </RouterLink>
        </header>

        <section className="mb-8 grid gap-4 lg:grid-cols-3">
          <form
            onSubmit={handleCreateWorkspace}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5"
          >
            <h2 className="mb-4 text-base font-semibold text-white">Create Workspace</h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="workspace-name" className="mb-1 block text-sm text-white/85">
                  Workspace Name
                </label>
                <input
                  id="workspace-name"
                  type="text"
                  placeholder="Enter workspace name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <label htmlFor="workspace-description" className="mb-1 block text-sm text-white/85">
                  Description (Optional)
                </label>
                <textarea
                  id="workspace-description"
                  placeholder="Short description of your workspace"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              {createError && (
                <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {createError}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <FaPlus />
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-5 lg:col-span-2">
            <h2 className="text-base font-semibold text-white">Collaborate with your team</h2>
            <p className="mt-2 text-sm text-white/70">
              Each workspace brings together repositories, realtime notes, tasks,
              documents, and chat so your team can stay aligned in one place.
            </p>

            <form onSubmit={handleJoinByCode} className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-sm font-semibold text-white">Join with Invitation Code</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code"
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
                <button
                  type="submit"
                  disabled={joiningCode}
                  className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-60"
                >
                  {joiningCode ? "Joining..." : "Join"}
                </button>
              </div>
              {joinCodeError && (
                <p className="mt-2 text-xs text-red-300">{joinCodeError}</p>
              )}
            </form>
          </article>
        </section>

        {loading && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="space-y-3">
              <div className="h-4 w-36 animate-pulse rounded bg-white/15" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-24 animate-pulse rounded-xl bg-white/10" />
                <div className="h-24 animate-pulse rounded-xl bg-white/10" />
              </div>
              <p className="text-sm text-white/65">Loading workspaces...</p>
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
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
          <section className="space-y-3">
            {workspaces.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                You don&apos;t have any workspaces yet. Create one above to get started.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {workspaces.map((ws) => (
                  <RouterLink
                    key={ws._id}
                    to={`/workspaces/${ws._id}`}
                    className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-400/10"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{ws.name}</p>
                        {ws.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-white/60">{ws.description}</p>
                        )}
                      </div>
                      {ws.currentUserRole && (
                        <span className="w-fit rounded-md bg-white/10 px-2 py-1 text-xs uppercase text-white/70">
                          {ws.currentUserRole}
                        </span>
                      )}
                    </div>
                  </RouterLink>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default Workspaces;
