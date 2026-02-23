import React from "react";
import { motion } from "framer-motion";

const BootLoader = () => {
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => setTimedOut(true), 12000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-8">
        <div className="relative h-20 w-20">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-blue-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{ filter: "drop-shadow(0 0 10px rgba(0, 217, 255, 0.5))" }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(0,217,255,0.8)]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {!timedOut ? (
            <p className="font-mono text-sm uppercase tracking-[0.2em] text-cyan-400">
              Initializing Workspace...
            </p>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-center text-sm text-amber-300">Server unavailable, please retry.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-blue-400/30 bg-blue-500/20 px-3 py-1.5 text-sm text-blue-200 transition hover:bg-blue-500/30"
              >
                Retry
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BootLoader;
