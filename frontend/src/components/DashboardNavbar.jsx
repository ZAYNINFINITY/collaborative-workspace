import React, { useState } from "react";
import {
  FaArrowLeft,
  FaEdit,
  FaHome,
  FaPlus,
  FaSignOutAlt,
  FaTrash,
  FaUserCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

function UserAvatar({ user }) {
  const name = user?.displayName || user?.username || "User";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (user?.avatar) {
    return <img src={user.avatar} alt={name} className="h-8 w-8 rounded-full border border-white/20 object-cover" />;
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-white">
      {initials || <FaUserCircle />}
    </div>
  );
}

const DashboardNavbar = ({
  title = "Dashboard",
  user,
  onBack,
  onCreate,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } finally {
      setLoggingOut(false);
      localStorage.removeItem("collab_welcome_seen_v1");
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10"
            >
              <FaArrowLeft className="text-xs" /> Back
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10"
          >
            <FaHome className="text-xs" /> Home
          </button>

          <h1 className="text-base font-semibold text-white md:text-lg">{title}</h1>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/30"
              >
                <FaPlus className="text-xs" /> Create
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/30"
              >
                <FaEdit className="text-xs" /> Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/20 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/30"
              >
                <FaTrash className="text-xs" /> Delete
              </button>
            )}
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-2 py-1.5 text-sm text-white/90 transition hover:bg-white/10"
          >
            <UserAvatar user={user} />
            <span className="hidden max-w-36 truncate text-left md:inline">{user?.displayName || user?.username || "Account"}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-lg border border-white/10 bg-slate-900/95 shadow-xl shadow-black/40">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/dashboard");
                }}
                className="block w-full px-3 py-2 text-left text-sm text-white/90 transition hover:bg-white/10"
              >
                My dashboard
              </button>
              <div className="border-t border-white/10" />
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/20"
              >
                <FaSignOutAlt className="text-xs" /> {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
