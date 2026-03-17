import React, { useEffect, useState } from "react";
import { FaCircle } from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";

const UserPresence = ({ workspaceId }) => {
  const [members, setMembers] = useState([]);
  const [onlineIds, setOnlineIds] = useState(new Set());

  const onlineUsers = members.filter((m) => onlineIds.has(m.userId));
  const [pings, setPings] = useState({});

  useEffect(() => {
    if (!workspaceId) return;

    const fetchMembers = async () => {
      try {
        const res = await API.get(`/workspaces/${workspaceId}/members`);
        setMembers(Array.isArray(res.data) ? res.data : []);
      } catch {
        setMembers([]);
      }
    };

    fetchMembers();
    const onPresenceState = (payload) => {
      if (payload.workspaceId === workspaceId) {
        const ids = Array.isArray(payload.userIds) ? payload.userIds : [];
        setOnlineIds(new Set(ids.filter(Boolean)));
      }
    };

    const onJoined = (payload) => {
      if (payload.workspaceId === workspaceId) {
        setOnlineIds((prev) => {
          const next = new Set(prev);
          if (payload.userId) next.add(payload.userId);
          return next;
        });
      }
    };

    const onLeft = (payload) => {
      if (payload.workspaceId === workspaceId) {
        setOnlineIds((prev) => {
          const next = new Set(prev);
          if (payload.userId) next.delete(payload.userId);
          return next;
        });
      }
    };

    socket.on("user:joined", onJoined);
    socket.on("user:left", onLeft);
    socket.on("presence:state", onPresenceState);

    socket.emit("joinWorkspace", { workspaceId });

    return () => {
      socket.emit("leaveWorkspace", { workspaceId });
      socket.off("user:joined", onJoined);
      socket.off("user:left", onLeft);
      socket.off("presence:state", onPresenceState);
    };
  }, [workspaceId]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Online Users</h3>
        <span className="rounded-md border border-emerald-400/30 bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200">
          {onlineUsers.length}
        </span>
      </div>

      <div className="space-y-2">
        {onlineUsers.map((user) => (
          <div key={user.userId} className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatar || "https://ui-avatars.com/api/?background=111827&color=67e8f9&name=" + encodeURIComponent(user.displayName || user.username || "U")}
                alt={user.displayName || user.username}
                className="h-8 w-8 rounded-full border border-white/10 object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full border border-[rgba(26,26,31,0.8)] bg-emerald-500">
                <FaCircle className="text-[8px] text-white" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.displayName || user.username}</p>
              <p className="truncate text-xs text-white/50">@{user.username}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  setPings((prev) => ({ ...prev, [user.userId]: true }));
                  await API.post(`/workspaces/${workspaceId}/ping`, {
                    userId: user.userId,
                  });
                } finally {
                  setTimeout(
                    () => setPings((prev) => ({ ...prev, [user.userId]: false })),
                    800,
                  );
                }
              }}
              className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
            >
              {pings[user.userId] ? "Sent" : "Ping"}
            </button>
          </div>
        ))}
      </div>

      {onlineUsers.length === 0 && (
        <p className="text-center text-sm text-white/60">No users online</p>
      )}
    </section>
  );
};

export default UserPresence;
