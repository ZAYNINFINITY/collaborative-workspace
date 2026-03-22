import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";

const InvitationHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Prime CSRF token (App also does this, but this makes invite handling resilient).
        await API.get("/health").catch(() => {});
      } catch {
        // Best-effort only; actual invite action will show a user-facing error.
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!token) return;

    setProcessing(true);
    setError("");
    try {
      const response = await API.post(`/workspaces/invites/${token}/accept`, {});
      if (response?.data?.workspaceId) {
        navigate(`/workspaces/${response.data.workspaceId}`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError("This invitation is no longer valid or has already been used");
        return;
      }
      setError(
        err.response?.data?.msg ||
          "Failed to accept invitation. Please log in first.",
      );
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
      navigate("/workspaces");
    } catch (err) {
      if (err.response?.status === 404) {
        setError("This invitation is no longer valid");
        return;
      }
      setError(err.response?.data?.msg || "Failed to decline invitation");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white/70">
        Loading invitation...
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">Workspace Invitation</h1>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          {error ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-200">
                You&apos;ve been invited to join a workspace. Click below to accept or decline.
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAcceptInvite}
                  disabled={processing}
                  className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processing ? "Processing..." : "Accept Invitation"}
                </button>

                <button
                  type="button"
                  onClick={handleDeclineInvite}
                  disabled={processing}
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Decline
                </button>
              </div>

              <p className="text-center text-xs text-white/60">
                After accepting, you&apos;ll be added to the workspace and can start collaborating
                immediately.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default InvitationHandler;
