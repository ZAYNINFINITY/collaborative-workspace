import React, { useEffect, useState } from "react";
import { FaCircle } from "react-icons/fa";
import { socket } from "../socket";

const UserPresence = ({ workspaceId }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!workspaceId) return;

    socket.emit("joinWorkspace", { workspaceId });

    const onJoined = (payload) => {
      if (payload.workspaceId === workspaceId) {
        setOnlineUsers((prev) => {
          const exists = prev.find((u) => u._id === payload.user._id);
          if (!exists) return [...prev, payload.user];
          return prev;
        });
      }
    };

    const onLeft = (payload) => {
      if (payload.workspaceId === workspaceId) {
        setOnlineUsers((prev) => prev.filter((u) => u._id !== payload.userId));
      }
    };

    socket.on("workspace:userJoined", onJoined);
    socket.on("workspace:userLeft", onLeft);

    setOnlineUsers([
      { _id: "1", username: "john_doe", displayName: "John Doe", avatarUrl: null },
      { _id: "2", username: "jane_smith", displayName: "Jane Smith", avatarUrl: null },
    ]);

    return () => {
      socket.off("workspace:userJoined", onJoined);
      socket.off("workspace:userLeft", onLeft);
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
          <div key={user._id} className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatarUrl || "https://ui-avatars.com/api/?background=111827&color=67e8f9&name=" + encodeURIComponent(user.displayName || user.username || "U")}
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
