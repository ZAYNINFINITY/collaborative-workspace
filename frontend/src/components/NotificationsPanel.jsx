import React from "react";
import API from "../api";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const panelClass =
  "fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl shadow-black/40 backdrop-blur";

const NotificationsPanel = ({ open, onClose }) => {
  const {
    notifications,
    notificationsLoading,
    refreshNotifications,
  } = useAuth();

  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markAllRead = async () => {
    await API.post("/notifications/read-all");
    await refreshNotifications();
  };

  const markRead = async (id) => {
    await API.post(`/notifications/${id}/read`);
    await refreshNotifications();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={panelClass}
          role="dialog"
          aria-label="Notifications"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-white/50">
                {unreadCount} unread
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>

          {notificationsLoading ? (
            <p className="text-sm text-white/60">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-white/60">No notifications yet.</p>
          ) : (
            <div className="max-h-[70vh] space-y-2 overflow-auto pr-1">
              {notifications.map((n) => {
                const actor =
                  n.actor?.displayName || n.actor?.username || "Someone";
                const workspace = n.workspace?.name;
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={async () => {
                      await markRead(n._id);
                      if (n.link) {
                        if (n.link.startsWith("/")) navigate(n.link);
                        else window.location.assign(n.link);
                      }
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      n.readAt
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/15"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">
                      {n.title || "Notification"}
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      {actor}
                      {workspace ? ` · ${workspace}` : ""}
                    </p>
                    {n.message && (
                      <p className="mt-2 text-sm text-white/80">{n.message}</p>
                    )}
                    <p className="mt-2 text-xs text-white/45">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;

