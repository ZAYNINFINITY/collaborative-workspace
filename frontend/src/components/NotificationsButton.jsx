import React from "react";
import { FaBell } from "react-icons/fa";
import { useAuth } from "../auth/useAuth";

const NotificationsButton = ({ onClick }) => {
  const { notifications } = useAuth();
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/40 backdrop-blur transition hover:bg-slate-900"
      aria-label="Open notifications"
    >
      <FaBell />
      {unreadCount > 0 && (
        <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-xs font-bold text-black">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationsButton;

