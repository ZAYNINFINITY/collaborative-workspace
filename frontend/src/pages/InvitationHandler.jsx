import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../api";
import { useAuth } from "../auth/useAuth";

const InvitationHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [preview, setPreview] = useState(null);       // { workspaceName, inviterName, memberCount }
  const [previewLoading, setPreviewLoading] = useState(true);
  const [csrfReady, setCsrfReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const autoAccepted = useRef(false);

  // Step 1 — load preview (no auth required) and prime CSRF token simultaneously
  useEffect(() => {
    if (!token) return;
    let mounted = true;

    const loadPreviewAndCsrf = async () => {
      setPreviewLoading(true);
      try {
        // Run both in parallel: preview fetch + CSRF prime
        const [previewRes] = await Promise.all([
          API.get(`/workspaces/invites/${token}/preview`).catch(() => null),
          API.get("/health").catch(() => {}),
        ]);

        if (!mounted) return;

        if (previewRes?.data) {
          setPreview(previewRes.data);
        }
        setCsrfReady(true);
      } finally {
        if (mounted) setPreviewLoading(false);
      }
    };

    loadPreviewAndCsrf();
    return () => { mounted = false; };
  }, [token]);

  // Step 2 — if user is already logged in and CSRF is ready, auto-accept
  useEffect(() => {
    if (
      !authLoading &&
      user &&
      csrfReady &&
      !autoAccepted.current &&
      !processing &&
      !error &&
      !success
    ) {
      autoAccepted.current = true;
      handleAcceptInvite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, csrfReady]);

  const handleAcceptInvite = async () => {
    if (!token) return;
    setProcessing(true);
    setError("");
    try {
      const res = await API.post(`/workspaces/invites/${token}/accept`, {});
      setSuccess(true);
      const workspaceId = res?.data?.workspaceId;
      if (workspaceId) {
        navigate(`/workspaces/${workspaceId}`, { replace: true });
      } else {
        navigate("/workspaces", { replace: true });
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Already a member — just go to the workspace
        const workspaceId = err.response?.data?.workspaceId;
        navigate(workspaceId ? `/workspaces/${workspaceId}` : "/workspaces", { replace: true });
        return;
      }
      if (err.response?.status === 401) {
        // Not logged in — redirect to login preserving this page
        navigate("/login", { state: { from: `/invite/${token}` }, replace: true });
        return;
      }
      if (err.response?.status === 404) {
        setError("This invitation has expired or already been used. Ask your teammate to send a new one.");
        return;
      }
      setError(err.response?.data?.msg || "Failed to accept invitation. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!token) return;
    setProcessing(true);
    setError("");
    try {
      await API.delete(`/workspaces/invites/${token}/decline`);
      navigate("/workspaces", { replace: true });
    } catch (err) {
      if (err.response?.status === 404) {
        setError("This invitation is no longer valid.");
        return;
      }
      setError(err.response?.data?.msg || "Failed to decline invitation.");
    } finally {
      setProcessing(false);
    }
  };

  // Loading states
  if (authLoading || previewLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          <p className="text-sm text-white/50">Loading invitation...</p>
        </div>
      </main>
    );
  }

  // Auto-accepting state for logged-in users
  if (user && !error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          <p className="text-sm text-white/50">Joining workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-2xl">
            🤝
          </div>
          <h1 className="text-2xl font-semibold text-white">You're invited!</h1>
          {preview?.workspaceName && (
            <p className="mt-1 text-sm text-white/60">
              {preview.inviterName
                ? <><span className="text-cyan-300">{preview.inviterName}</span> invited you to join</>
                : "You've been invited to join"}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-5">
          {/* Workspace info card */}
          {preview?.workspaceName ? (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Workspace</p>
              <p className="mt-1 text-lg font-semibold text-white">{preview.workspaceName}</p>
              {preview.memberCount > 0 && (
                <p className="mt-1 text-xs text-white/50">
                  {preview.memberCount} {preview.memberCount === 1 ? "member" : "members"} already inside
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
              A teammate has invited you to their workspace.
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Not logged in — show login/signup options */}
          {!user && !error && (
            <>
              <p className="text-center text-sm text-white/60">
                Sign in to accept this invitation and join the workspace.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  to="/login"
                  state={{ from: `/invite/${token}` }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  state={{ from: `/invite/${token}` }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Create Account
                </Link>
              </div>
              <div className="border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={handleDeclineInvite}
                  disabled={processing || !csrfReady}
                  className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm text-white/40 transition hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Decline invitation
                </button>
              </div>
            </>
          )}

          {/* Error with retry */}
          {error && (
            <button
              type="button"
              onClick={() => navigate("/workspaces")}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Go to My Workspaces
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export default InvitationHandler;
