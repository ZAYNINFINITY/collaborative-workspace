import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import API from "../api";

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

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

  return (
    <main className="min-h-screen px-3 py-6 sm:px-4 md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-white">Workspaces</h1>
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
          </article>
        </section>

        {loading && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            Loading workspaces...
          </section>
        )}

        {!loading && error && (
          <section className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
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
