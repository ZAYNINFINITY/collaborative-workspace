import React, { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import API from "../api";

const Repositories = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get("/auth/repos");
        if (!isMounted) return;
        setRepos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError("Failed to load repositories from GitHub.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRepos();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <main className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
              <FaGithub />
            </span>
            <h1 className="text-2xl font-semibold text-white">GitHub repositories</h1>
          </div>
          <RouterLink
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Back to dashboard
          </RouterLink>
        </header>

        {loading && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            Loading repositories...
          </section>
        )}

        {!loading && error && (
          <section className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </section>
        )}

        {!loading && !error && (
          <section className="space-y-3">
            {repos.length === 0 ? (
              <p className="text-sm text-white/60">
                No repositories found. Ensure your GitHub account has repositories and
                repo access was granted during authorization.
              </p>
            ) : (
              repos.map((repo) => (
                <article
                  key={repo.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-base font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        {repo.full_name}
                      </a>
                      {repo.description && (
                        <p className="mt-1 text-sm text-white/70">{repo.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {repo.language && (
                          <span className="rounded-md bg-purple-500/20 px-2 py-1 text-purple-200">
                            {repo.language}
                          </span>
                        )}
                        <span className="rounded-md bg-white/10 px-2 py-1 text-white/80">
                          ★ {repo.stargazers_count}
                        </span>
                        <span className="rounded-md bg-white/10 px-2 py-1 text-white/80">
                          Updated {new Date(repo.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`rounded-md px-2 py-1 text-xs ${
                        repo.private
                          ? "bg-red-500/20 text-red-200"
                          : "bg-emerald-500/20 text-emerald-200"
                      }`}
                    >
                      {repo.private ? "Private" : "Public"}
                    </span>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default Repositories;
