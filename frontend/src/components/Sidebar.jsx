import React, { useState } from "react";
import {
  FaHome,
  FaComment,
  FaTasks,
  FaFileAlt,
  FaStickyNote,
  FaHistory,
  FaCode,
  FaUsers,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const sections = [
  { key: "overview", label: "Overview", icon: FaHome, tooltip: "Workspace overview and statistics" },
  { key: "chat", label: "Chat", icon: FaComment, tooltip: "Team messaging and discussions" },
  { key: "tasks", label: "Tasks", icon: FaTasks, tooltip: "Kanban board and task management" },
  { key: "files", label: "Files", icon: FaFileAlt, tooltip: "File uploads and document storage" },
  { key: "notes", label: "Notes", icon: FaStickyNote, tooltip: "Quick notes and documentation" },
  { key: "activity", label: "Activity", icon: FaHistory, tooltip: "Recent workspace activity feed" },
  { key: "team", label: "Team", icon: FaUsers, tooltip: "Manage team members and invitations" },
  { key: "code", label: "Code", icon: FaCode, tooltip: "Code repositories and integration" },
];

const Sidebar = ({ activeSection, onSectionChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={`sticky top-5 z-20 max-h-[calc(100vh-40px)] shrink-0 overflow-y-auto rounded-3xl border border-white/10 bg-[rgba(26,26,31,0.8)] p-3 backdrop-blur-xl transition-all duration-300 ${
        isOpen ? "w-[210px]" : "w-[70px]"
      }`}
      aria-label="Workspace navigation"
    >
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <FaTimes size={15} /> : <FaBars size={15} />}
        </button>
      </div>

      <nav className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;

          return (
            <button
              key={section.key}
              type="button"
              title={!isOpen ? section.tooltip : undefined}
              onClick={() => onSectionChange(section.key)}
              className={`group flex h-11 w-full items-center rounded-xl border px-3 text-sm transition ${
                isOpen ? "justify-start" : "justify-center"
              } ${
                isActive
                  ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
                  : "border-transparent text-white/75 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white"
              }`}
              aria-label={section.label}
            >
              <Icon size={17} />
              {isOpen && <span className="ml-3 font-medium">{section.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
