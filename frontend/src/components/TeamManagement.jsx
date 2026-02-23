import React, { useEffect, useMemo, useState } from "react";
import { FaCog, FaPlus, FaRegCopy } from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer (Read-only)" },
  { value: "member", label: "Member (Edit)" },
  { value: "admin", label: "Admin (Full Control)" },
];

function roleClasses(role) {
  switch (role) {
    case "owner":
      return "bg-violet-500/20 text-violet-300 border-violet-400/30";
    case "admin":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-400/30";
    case "member":
      return "bg-blue-500/20 text-blue-300 border-blue-400/30";
    case "viewer":
      return "bg-slate-500/20 text-slate-300 border-slate-400/30";
    default:
      return "bg-white/10 text-white/70 border-white/20";
  }
}

function Avatar({ name, src, online }) {
  const initials = useMemo(() => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [name]);

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/10">
      {src ? (
        <img src={src} alt={name || "User avatar"} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/90">
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
      )}
    </div>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            x
          </button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-white/10 px-4 py-3">{footer}</div>
      </div>
    </div>
  );
}

const TeamManagement = ({ workspaceId, currentUserRole, onUpdate }) => {
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [invitationCode, setInvitationCode] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [selectedMember, setSelectedMember] = useState(null);
  const [newRole, setNewRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isAdmin = currentUserRole === "admin" || currentUserRole === "owner";

  const showNotice = (msg) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get(`/workspaces/${workspaceId}/members`);
      setMembers(Array.isArray(response.data) ? response.data : []);
      onUpdate?.();
    } catch {
      setError("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const response = await API.get(`/workspaces/${workspaceId}/invites`);
      setPendingInvites(Array.isArray(response.data) ? response.data : []);
    } catch {
      setPendingInvites([]);
    }
  };

  const loadInvitationCode = async () => {
    try {
      const response = await API.get(`/workspaces/${workspaceId}/invitation-code`);
      setInvitationCode(response.data?.code || null);
    } catch {
      setInvitationCode(null);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    loadMembers();
    if (isAdmin) {
      loadPendingInvites();
      loadInvitationCode();
    }
  }, [workspaceId, isAdmin]);

  useEffect(() => {
    if (!socket || !workspaceId) return undefined;

    const handleMemberJoined = (data) => {
      if (data.workspaceId !== workspaceId) return;
      loadMembers();
      setOnlineMembers((prev) => new Set([...prev, data.userId]));
      showNotice(`${data.userDisplayName || "A member"} joined the workspace.`);
    };

    const handleMemberLeft = (data) => {
      if (data.workspaceId !== workspaceId) return;
      loadMembers();
      setOnlineMembers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
      showNotice("A member left the workspace.");
    };

    const handleMemberRoleChanged = (data) => {
      if (data.workspaceId !== workspaceId) return;
      loadMembers();
      showNotice(`Member role changed to ${data.newRole}.`);
    };

    const handleMemberOnline = (data) => {
      if (data.workspaceId !== workspaceId) return;
      setOnlineMembers((prev) => new Set([...prev, data.userId]));
    };

    const handleMemberOffline = (data) => {
      if (data.workspaceId !== workspaceId) return;
      setOnlineMembers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on("member:joined", handleMemberJoined);
    socket.on("member:left", handleMemberLeft);
    socket.on("member:roleChanged", handleMemberRoleChanged);
    socket.on("member:online", handleMemberOnline);
    socket.on("member:offline", handleMemberOffline);

    return () => {
      socket.off("member:joined", handleMemberJoined);
      socket.off("member:left", handleMemberLeft);
      socket.off("member:roleChanged", handleMemberRoleChanged);
      socket.off("member:online", handleMemberOnline);
      socket.off("member:offline", handleMemberOffline);
    };
  }, [workspaceId]);

  const handleInviteMember = async () => {
    const email = inviteEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setError("Please enter an email address.");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setInviting(true);
      setError("");
      await API.post(`/workspaces/${workspaceId}/invite`, { email, role: inviteRole });
      setInviteEmail("");
      setInviteRole("member");
      setInviteOpen(false);
      showNotice(`Invitation sent to ${email}.`);
      loadPendingInvites();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !newRole) return;

    try {
      setUpdating(true);
      setError("");
      await API.put(`/workspaces/${workspaceId}/members/${selectedMember.userId}`, { role: newRole });
      setRoleOpen(false);
      setSelectedMember(null);
      showNotice("Member role updated.");
      loadMembers();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update role.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the workspace?`)) return;

    try {
      setError("");
      await API.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      showNotice(`${memberName} removed from workspace.`);
      loadMembers();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to remove member.");
    }
  };

  const copyInvitationCode = async () => {
    if (!invitationCode) return;
    try {
      await navigator.clipboard.writeText(invitationCode);
      showNotice("Invitation code copied.");
    } catch {
      setError("Could not copy invitation code.");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 text-sm text-white/80">
        Loading team...
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
      {notice && <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">{notice}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Team Management</h2>
          <p className="text-sm text-white/60">
            {members.length} members{onlineMembers.size > 0 ? ` • ${onlineMembers.size} online` : ""}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/30"
          >
            <FaPlus /> Invite Member
          </button>
        )}
      </div>

      {isAdmin && invitationCode && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white/90">Invitation Code</p>
              <p className="text-xs text-white/60">Share this code to let members join instantly.</p>
            </div>
            <button
              type="button"
              onClick={copyInvitationCode}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30"
            >
              <FaRegCopy /> Copy
            </button>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-amber-200">{invitationCode}</div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="mb-3 border-b border-white/10 pb-3">
          <h3 className="text-base font-semibold text-white">Team Members</h3>
          <p className="text-xs text-white/60">{members.length} members in this workspace</p>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-white/60">No members yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {members.map((member) => {
              const isOnline = onlineMembers.has(member.userId);
              return (
                <div key={member.userId} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        name={member.displayName || member.username}
                        src={member.avatar}
                        online={isOnline}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{member.displayName || member.username}</p>
                        <p className="truncate text-xs text-white/60">{member.email}</p>
                      </div>
                    </div>

                    {isAdmin && !member.isOwner && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(member);
                            setNewRole(member.role || "member");
                            setRoleOpen(true);
                          }}
                          className="rounded-md border border-white/15 p-2 text-white/80 transition hover:bg-white/10"
                          aria-label="Change role"
                        >
                          <FaCog size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.userId, member.displayName || member.username)}
                          className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-200 transition hover:bg-red-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${roleClasses(member.role)}`}>
                      {member.role}
                      {member.isOwner ? " (Owner)" : ""}
                    </span>
                    {isOnline && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                        Online
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAdmin && pendingInvites.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="mb-3 border-b border-white/10 pb-3">
            <h3 className="text-base font-semibold text-white">Pending Invitations</h3>
            <p className="text-xs text-white/60">
              {pendingInvites.length} invitation{pendingInvites.length > 1 ? "s" : ""} awaiting response
            </p>
          </div>

          <div className="space-y-2">
            {pendingInvites.map((invite, idx) => (
              <div key={`${invite.email}-${idx}`} className="flex items-center justify-between rounded-xl border border-amber-400/20 bg-white/5 p-3">
                <div>
                  <p className="text-sm font-semibold text-white">{invite.email}</p>
                  <p className="text-xs text-white/60">
                    Invited as <span className={`ml-1 rounded-full border px-2 py-0.5 text-xs ${roleClasses(invite.role)}`}>{invite.role}</span>
                  </p>
                </div>
                <span className="rounded-full border border-amber-400/30 bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-200">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={inviteOpen}
        title="Invite Team Member"
        onClose={() => setInviteOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInviteMember}
              disabled={inviting}
              className="rounded-lg border border-blue-400/30 bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-200 disabled:opacity-60"
            >
              {inviting ? "Sending..." : "Send Invitation"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm text-white/80" htmlFor="invite-email">
            Email Address
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviting}
              placeholder="teammate@example.com"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-blue-400/50"
            />
          </label>

          <label className="block text-sm text-white/80" htmlFor="invite-role">
            Role
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              disabled={inviting}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/50"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <p className="text-xs text-white/60">An invitation will be sent to this email address.</p>
        </div>
      </Modal>

      <Modal
        open={roleOpen}
        title="Change Member Role"
        onClose={() => {
          setRoleOpen(false);
          setSelectedMember(null);
        }}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setRoleOpen(false);
                setSelectedMember(null);
              }}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateRole}
              disabled={updating}
              className="rounded-lg border border-blue-400/30 bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-200 disabled:opacity-60"
            >
              {updating ? "Updating..." : "Update Role"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white">{selectedMember?.displayName || selectedMember?.username}</p>

          <label className="block text-sm text-white/80" htmlFor="new-role">
            New Role
            <select
              id="new-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/50"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-xs text-blue-100">
            <strong className="text-white">{newRole}</strong>: users can
            {newRole === "viewer"
              ? " view content but not edit."
              : newRole === "member"
                ? " create and edit content."
                : " manage team members and workspace settings."}
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default TeamManagement;
