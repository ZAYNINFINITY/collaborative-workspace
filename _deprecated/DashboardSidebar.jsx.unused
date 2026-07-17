import React, { useMemo, useState } from "react";
import {
  FaBriefcase,
  FaChevronDown,
  FaChevronRight,
  FaComment,
  FaFileAlt,
  FaHome,
  FaStickyNote,
  FaTasks,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const DashboardSidebar = ({ activeSection, onSectionChange }) => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({ collaboration: true });

  const menuItems = useMemo(
    () => [
      {
        id: "overview",
        icon: FaHome,
        label: "Overview",
        action: () => navigate("/dashboard"),
      },
      {
        id: "workspaces",
        icon: FaBriefcase,
        label: "Workspaces",
        action: () => navigate("/workspaces"),
      },
      {
        id: "collaboration",
        icon: FaUsers,
        label: "Team",
        submenu: [
          { id: "chat", icon: FaComment, label: "Chat", action: () => onSectionChange?.("chat") },
          { id: "tasks", icon: FaTasks, label: "Tasks", action: () => onSectionChange?.("tasks") },
          {
            id: "documents",
            icon: FaFileAlt,
            label: "Documents",
            action: () => onSectionChange?.("documents"),
          },
          { id: "notes", icon: FaStickyNote, label: "Notes", action: () => onSectionChange?.("notes") },
        ],
      },
      {
        id: "repositories",
        icon: FaBriefcase,
        label: "Repositories",
        action: () => navigate("/repos"),
      },
    ],
    [navigate, onSectionChange],
  );

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-slate-900/70 px-3 py-4 md:block">
      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/50">Navigation</p>

      <nav className="mt-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const isExpanded = !!expandedSections[item.id];

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (item.submenu) {
                    toggleSection(item.id);
                  } else {
                    item.action?.();
                  }
                }}
                className={`group flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-sm transition ${
                  isActive
                    ? "border-blue-400/30 bg-blue-500/20 text-white"
                    : "border-transparent text-white/80 hover:border-white/10 hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="text-xs" />
                  <span>{item.label}</span>
                </span>
                {item.submenu && (isExpanded ? <FaChevronDown className="text-[10px]" /> : <FaChevronRight className="text-[10px]" />)}
              </button>

              {item.submenu && isExpanded && (
                <div className="mt-1 space-y-1 pl-5">
                  {item.submenu.map((subitem) => {
                    const SubIcon = subitem.icon;
                    const isSubActive = activeSection === subitem.id;

                    return (
                      <button
                        key={subitem.id}
                        type="button"
                        onClick={() => {
                          subitem.action?.();
                          onSectionChange?.(subitem.id);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-sm transition ${
                          isSubActive
                            ? "border-blue-400/30 bg-blue-500/20 text-white"
                            : "border-transparent text-white/75 hover:border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <SubIcon className="text-[10px]" />
                        <span>{subitem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="my-4 border-t border-white/10" />

      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/50">Account</p>
      <div className="mt-2 space-y-1">
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="w-full rounded-lg border border-transparent px-2.5 py-2 text-left text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
        >
          Settings
        </button>
        <button
          type="button"
          onClick={() => navigate("/help")}
          className="w-full rounded-lg border border-transparent px-2.5 py-2 text-left text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
        >
          Help
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
