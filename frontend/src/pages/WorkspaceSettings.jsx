import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  FaClipboard,
  FaDownload,
  FaExclamationTriangle,
  FaRedoAlt,
  FaSave,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import API from "../api";

const tabs = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
  { id: "invites", label: "Invites" },
  { id: "data", label: "Data" },
  { id: "danger", label: "Danger" },
];

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const formatDateInputValue = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const WorkspaceSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [workspace, setWorkspace] = useState(null);
  const currentUserRole = workspace?.currentUserRole || "";
  const canAdmin = currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalStatus, setGeneralStatus] = useState("");

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersStatus, setMembersStatus] = useState("");

  const [inviteCode, setInviteCode] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesStatus, setInvitesStatus] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const inviteLinkOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get(`/workspaces/${id}`);
        const ws = res.data?.workspace || null;
        if (!mounted) return;
        setWorkspace(ws);
        setName(ws?.name || "");
        setDescription(ws?.description || "");
        setDeadline(formatDateInputValue(ws?.deadline));
      } catch (err) {
        if (!mounted) return;
        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError(err.response?.data?.msg || "Failed to load workspace settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const activeTabLabel = useMemo(
    () => tabs.find((t) => t.id === activeTab)?.label || "General",
    [activeTab],
  );

  const refreshMembers = async () => {
    try {
      setMembersLoading(true);
      setMembersStatus("");
      const res = await API.get(`/workspaces/${id}/members`);
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMembers([]);
      setMembersStatus(err.response?.data?.msg || "Failed to load members.");
    } finally {
      setMembersLoading(false);
    }
  };

  const refreshInvites = async () => {
    if (!canAdmin) return;
    try {
      setInvitesLoading(true);
      setInvitesStatus("");
      const [codeRes, invitesRes] = await Promise.all([
        API.get(`/workspaces/${id}/invitation-code`),
        API.get(`/workspaces/${id}/invites`),
      ]);
      setInviteCode(codeRes.data?.code || "");
      setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : []);
    } catch (err) {
      setInviteCode("");
      setInvites([]);
      setInvitesStatus(err.response?.data?.msg || "Failed to load invites.");
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    if (!workspace?._id) return;
    if (activeTab === "members") refreshMembers();
    if (activeTab === "invites") refreshInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?._id, activeTab]);

  const copyText = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setInvitesStatus("Copied.");
      setTimeout(() => setInvitesStatus(""), 900);
    } catch {
      setInvitesStatus("Copy failed. Please copy manually.");
    }
  };

  const saveGeneral = async (e) => {
    e.preventDefault();
    if (!canAdmin) {
      setGeneralStatus("Only admins can update workspace settings.");
      return;
    }
    if (!name.trim()) {
      setGeneralStatus("Workspace name is required.");
      return;
    }

    try {
      setSavingGeneral(true);
      setGeneralStatus("");
      const payload = {
        name: name.trim(),
        description: description.trim(),
        deadline: deadline ? new Date(`${deadline}T00:00:00.000Z`).toISOString() : "",
      };
      const res = await API.put(`/workspaces/${id}`, payload);
      setWorkspace((prev) => (prev ? { ...prev, ...res.data } : res.data));
      setGeneralStatus("Saved.");
    } catch (err) {
      setGeneralStatus(err.response?.data?.msg || "Failed to save.");
    } finally {
      setSavingGeneral(false);
    }
  };

  const updateRole = async (userId, role) => {
    if (!canAdmin) return;
    try {
      setMembersStatus("");
      await API.put(`/workspaces/${id}/members/${userId}`, { role });
      await refreshMembers();
      setMembersStatus("Role updated.");
      setTimeout(() => setMembersStatus(""), 900);
    } catch (err) {
      setMembersStatus(err.response?.data?.msg || "Failed to update role.");
    }
  };

  const removeMember = async (userId) => {
    if (!canAdmin) return;
    const ok = window.confirm("Remove this member from the workspace?");
    if (!ok) return;
    try {
      setMembersStatus("");
      await API.delete(`/workspaces/${id}/members/${userId}`);
      await refreshMembers();
      setMembersStatus("Member removed.");
      setTimeout(() => setMembersStatus(""), 900);
    } catch (err) {
      setMembersStatus(err.response?.data?.msg || "Failed to remove member.");
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!canAdmin) {
      setInvitesStatus("Only admins can invite members.");
      return;
    }
    if (!inviteEmail.trim()) return;
    try {
      setInvitesStatus("");
      await API.post(`/workspaces/${id}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail("");
      setInvitesStatus("Invite created.");
      await refreshInvites();
    } catch (err) {
      setInvitesStatus(err.response?.data?.msg || "Failed to create invite.");
    }
  };

  const revokeInvite = async (token) => {
    if (!canAdmin) return;
    const ok = window.confirm("Revoke this invite?");
    if (!ok) return;
    try {
      setInvitesStatus("");
      await API.delete(`/workspaces/${id}/invites/${token}`);
      await refreshInvites();
      setInvitesStatus("Invite revoked.");
      setTimeout(() => setInvitesStatus(""), 900);
    } catch (err) {
      setInvitesStatus(err.response?.data?.msg || "Failed to revoke invite.");
    }
  };

  const resendInvite = async (token) => {
    if (!canAdmin) return;
    try {
      setInvitesStatus("");
      const res = await API.post(`/workspaces/${id}/invites/${token}/resend`);
      setInvitesStatus(res.data?.msg || "Invite resent.");
      setTimeout(() => setInvitesStatus(""), 1400);
    } catch (err) {
      setInvitesStatus(err.response?.data?.msg || "Failed to resend invite.");
    }
  };

  const exportWorkspaceJson = async () => {
    try {
      const res = await API.get(`/workspaces/${id}`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workspace-${id}-export.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.msg || "Export failed.");
    }
  };

  const deleteWorkspace = async () => {
    if (!isOwner) return;
    if ((workspace?.name || "").trim() !== deleteConfirm.trim()) {
      setError("Type the workspace name to confirm deletion.");
      return;
    }
    const ok = window.confirm("This will permanently delete the workspace and its data. Continue?");
    if (!ok) return;

    try {
      setDeleting(true);
      setError("");
      await API.delete(`/workspaces/${id}`);
      navigate("/workspaces", { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete workspace.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                Workspace
              </p>
              <h1 className="text-2xl font-semibold text-white">
                {workspace?.name || "Settings"}
              </h1>
              <p className="mt-1 text-sm text-white/60">{activeTabLabel} settings</p>
              {currentUserRole && (
                <span className="mt-2 inline-flex items-center gap-2 rounded-md bg-white/10 px-2 py-1 text-xs text-white/70">
                  <FaUserShield />
                  {currentUserRole}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RouterLink
                to={`/workspaces/${id}`}
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Back to workspace
              </RouterLink>
              <RouterLink
                to="/workspaces"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              >
                All workspaces
              </RouterLink>
            </div>
          </div>
        </header>

        {loading && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            Loading settings...
          </section>
        )}

        {!loading && error && (
          <section className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </section>
        )}

        {!loading && workspace && (
          <section className="grid gap-4 md:grid-cols-[240px,1fr]">
            <aside className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
              <nav className="space-y-1" aria-label="Workspace settings">
                {tabs.map((t) => {
                  const isActive = t.id === activeTab;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                          : "border-transparent text-white/75 hover:border-white/10 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              {activeTab === "general" && (
                <div>
                  <h2 className="text-base font-semibold text-white">General</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Update workspace name, description, and deadline.
                  </p>

                  {!canAdmin && (
                    <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                      Only workspace admins can edit settings.
                    </div>
                  )}

                  <form onSubmit={saveGeneral} className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="ws-name" className="mb-1 block text-sm text-white/85">
                        Workspace name
                      </label>
                      <input
                        id="ws-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!canAdmin}
                        maxLength={100}
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label htmlFor="ws-desc" className="mb-1 block text-sm text-white/85">
                        Description
                      </label>
                      <input
                        id="ws-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={!canAdmin}
                        maxLength={220}
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label htmlFor="ws-deadline" className="mb-1 block text-sm text-white/85">
                        Deadline (optional)
                      </label>
                      <input
                        id="ws-deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        disabled={!canAdmin}
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-60"
                      />
                    </div>

                    {generalStatus && (
                      <p className={`text-sm ${generalStatus === "Saved." ? "text-emerald-200" : "text-amber-200"}`}>
                        {generalStatus}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={!canAdmin || savingGeneral}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaSave />
                      {savingGeneral ? "Saving..." : "Save changes"}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "members" && (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-white">Members</h2>
                      <p className="mt-1 text-sm text-white/65">
                        View members and manage roles (admin only).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={refreshMembers}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      <FaRedoAlt />
                      Refresh
                    </button>
                  </div>

                  {membersStatus && (
                    <p className="mt-3 text-sm text-amber-200">{membersStatus}</p>
                  )}

                  {membersLoading ? (
                    <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                      Loading members...
                    </div>
                  ) : (
                    <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                      {members.length === 0 ? (
                        <div className="p-4 text-sm text-white/60">No members found.</div>
                      ) : (
                        members.map((m) => (
                          <div
                            key={m.userId}
                            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {m.displayName || m.username || "Member"}
                              </p>
                              <p className="truncate text-xs text-white/55">
                                {m.email || m.username || m.userId}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {m.isOwner && (
                                <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                                  Owner
                                </span>
                              )}
                              {canAdmin && !m.isOwner ? (
                                <select
                                  value={m.role}
                                  onChange={(e) => updateRole(m.userId, e.target.value)}
                                  className="rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white outline-none"
                                >
                                  {roleOptions.map((r) => (
                                    <option key={r.value} value={r.value}>
                                      {r.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="rounded-md bg-white/10 px-2 py-1 text-xs uppercase text-white/70">
                                  {m.role}
                                </span>
                              )}

                              {canAdmin && !m.isOwner && (
                                <button
                                  type="button"
                                  onClick={() => removeMember(m.userId)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                                >
                                  <FaTrash />
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "invites" && (
                <div>
                  <h2 className="text-base font-semibold text-white">Invites</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Invite teammates by email or share a join code (admins only).
                  </p>

                  {!canAdmin && (
                    <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                      Only workspace admins can view and manage invites.
                    </div>
                  )}

                  {canAdmin && (
                    <>
                      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-semibold text-white">Invitation code</p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <input
                            value={invitesLoading ? "Loading..." : inviteCode}
                            readOnly
                            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => copyText(inviteCode)}
                            disabled={!inviteCode}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                          >
                            <FaClipboard />
                            Copy
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-white/55">
                          Teammates can join from the Workspaces page using this code.
                        </p>
                      </div>

                      <form
                        onSubmit={sendInvite}
                        className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <p className="text-sm font-semibold text-white">Invite by email</p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <input
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="teammate@example.com"
                            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                          />
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white outline-none"
                          >
                            {roleOptions.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                          >
                            Send
                          </button>
                        </div>
                      </form>

                      {invitesStatus && (
                        <p className="mt-3 text-sm text-amber-200">{invitesStatus}</p>
                      )}

                      <div className="mt-5 rounded-xl border border-white/10 bg-black/20">
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
                          <p className="text-sm font-semibold text-white">Pending invites</p>
                          <button
                            type="button"
                            onClick={refreshInvites}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                          >
                            <FaRedoAlt />
                            Refresh
                          </button>
                        </div>
                        {invitesLoading ? (
                          <div className="p-4 text-sm text-white/60">Loading invites...</div>
                        ) : invites.length === 0 ? (
                          <div className="p-4 text-sm text-white/60">No pending email invites.</div>
                        ) : (
                          <div className="divide-y divide-white/10">
                            {invites.map((inv) => {
                              const inviteLink = `${inviteLinkOrigin}/invite/${inv.token}`;
                              return (
                                <div
                                  key={inv.token}
                                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">
                                      {inv.email}
                                    </p>
                                    <p className="mt-1 text-xs text-white/55">
                                      Role: {inv.role} · Created{" "}
                                      {inv.createdAt
                                        ? new Date(inv.createdAt).toLocaleDateString()
                                        : "—"}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => copyText(inviteLink)}
                                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                                    >
                                      <FaClipboard />
                                      Copy link
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => resendInvite(inv.token)}
                                      className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
                                    >
                                      <FaRedoAlt />
                                      Resend
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => revokeInvite(inv.token)}
                                      className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                                    >
                                      <FaTrash />
                                      Revoke
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "data" && (
                <div>
                  <h2 className="text-base font-semibold text-white">Data</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Export a JSON snapshot of the workspace content.
                  </p>
                  <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                    <button
                      type="button"
                      onClick={exportWorkspaceJson}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <FaDownload />
                      Download JSON export
                    </button>
                    <p className="mt-2 text-xs text-white/50">
                      This is a client-side export using the existing API response.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "danger" && (
                <div>
                  <h2 className="text-base font-semibold text-white">Danger zone</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Destructive actions. Owner only.
                  </p>

                  {!isOwner ? (
                    <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                      Only the workspace owner can delete this workspace.
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <FaExclamationTriangle className="mt-0.5 text-red-200" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-100">Delete workspace</p>
                          <p className="mt-1 text-sm text-red-200/80">
                            This permanently deletes the workspace and related content.
                          </p>
                          <div className="mt-4">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-red-200/80">
                              Type workspace name to confirm
                            </label>
                            <input
                              value={deleteConfirm}
                              onChange={(e) => setDeleteConfirm(e.target.value)}
                              className="w-full rounded-lg border border-red-300/30 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                              placeholder={workspace?.name || "Workspace name"}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={deleteWorkspace}
                            disabled={deleting}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
                          >
                            <FaTrash />
                            {deleting ? "Deleting..." : "Delete workspace"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          </section>
        )}
      </div>
    </main>
  );
};

export default WorkspaceSettings;
