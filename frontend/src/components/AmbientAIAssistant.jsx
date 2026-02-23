import React, { useState } from "react";
import { FaRobot } from "react-icons/fa";
import { motion } from "framer-motion";

const AmbientAIAssistant = ({ onOpenCommandPalette }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[1000]" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <div className="group relative">
          {!isHovered && <span className="absolute inset-0 -z-10 rounded-full animate-ping bg-blue-500/40" />}
          <div className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 rounded-md border border-blue-400/30 bg-slate-900/95 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
            Ask AI (Cmd+K)
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={onOpenCommandPalette}
            className="grid h-[60px] w-[60px] place-items-center rounded-full border border-white/10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_8px_32px_rgba(59,130,246,0.4)] transition hover:from-blue-600 hover:to-indigo-700"
            aria-label="Open AI command palette"
            type="button"
          >
            <FaRobot size={24} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default AmbientAIAssistant;
