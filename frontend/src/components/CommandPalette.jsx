import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaFolderOpen, FaMagic, FaRegKeyboard, FaRobot, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../api";

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    setQuery("");
    setError(null);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const askAI = async () => {
    if (!query.trim() || isAsking) return;

    const userMessage = query.trim();
    setQuery("");
    setError(null);
    setIsAsking(true);
    setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await API.post("/ai/chat", { message: userMessage });
      const reply = res.data?.reply || "I could not generate a response right now.";
      setChatHistory((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.msg || "AI request failed.";
      setError(message);
      setChatHistory((prev) => [...prev, { role: "assistant", content: `Error: ${message}` }]);
    } finally {
      setIsAsking(false);
    }
  };

  const staticCommands = useMemo(
    () => [
      {
        id: "ai-summarize",
        icon: <FaMagic />,
        title: "Summarize this workspace",
        section: "AI Actions",
        action: () => setQuery("Summarize the current workspace and next actions."),
      },
      {
        id: "ai-draft",
        icon: <FaRobot />,
        title: "Draft project update",
        section: "AI Actions",
        action: () => setQuery("Draft a short project status update for my team."),
      },
      {
        id: "nav-dash",
        icon: <FaFolderOpen />,
        title: "Go to Dashboard",
        section: "Navigation",
        action: () => {
          navigate("/dashboard");
          onClose();
        },
      },
      {
        id: "nav-projects",
        icon: <FaFolderOpen />,
        title: "View all workspaces",
        section: "Navigation",
        action: () => {
          navigate("/workspaces");
          onClose();
        },
      },
    ],
    [navigate, onClose],
  );

  const lowerQuery = query.toLowerCase();
  const currentCommands = query
    ? staticCommands.filter((cmd) => cmd.title.toLowerCase().includes(lowerQuery))
    : staticCommands;

  const groupedCommands = currentCommands.reduce((acc, cmd) => {
    if (!acc[cmd.section]) acc[cmd.section] = [];
    acc[cmd.section].push(cmd);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="mx-auto mt-[12vh] w-[92%] max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <FaSearch className="text-blue-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      askAI();
                    }
                  }}
                  placeholder="Ask AI or type a command..."
                  className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {chatHistory.length > 0 && (
                <div className="mb-4 space-y-3">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={`${msg.role}-${idx}`}
                      className={`rounded-lg px-3 py-2 ${
                        msg.role === "user" ? "bg-blue-500/20" : "bg-white/5"
                      }`}
                    >
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-white/60">
                        {msg.role === "user" ? "You" : "AI"}
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-white/90">{msg.content}</p>
                    </div>
                  ))}
                  {isAsking && <p className="text-sm text-white/60">AI is thinking...</p>}
                </div>
              )}

              {Object.keys(groupedCommands).length === 0 && !chatHistory.length ? (
                <div className="flex flex-col items-center gap-3 py-8 text-white/50">
                  <FaRegKeyboard className="text-3xl" />
                  <p className="text-sm">No commands found for "{query}"</p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([section, commands]) => (
                  <div key={section} className="mb-4">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/45">{section}</p>
                    <div className="space-y-1">
                      {commands.map((cmd) => (
                        <motion.button
                          key={cmd.id}
                          whileHover={{ backgroundColor: "rgba(59,130,246,0.15)" }}
                          onClick={cmd.action}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/85"
                          type="button"
                        >
                          <span className="text-blue-400">{cmd.icon}</span>
                          <span>{cmd.title}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-3 text-xs text-white/60">
                <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px]">Enter</span>
                <span>ask AI</span>
                <button
                  type="button"
                  onClick={askAI}
                  disabled={isAsking}
                  className="rounded-md border border-blue-400/30 bg-blue-500/20 px-2 py-1 text-xs text-blue-200 disabled:opacity-60"
                >
                  {isAsking ? "Asking..." : "Ask"}
                </button>
              </div>
              <p className={`text-xs font-semibold ${error ? "text-red-300" : "text-blue-300"}`}>
                {error || "AI Powered"}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
