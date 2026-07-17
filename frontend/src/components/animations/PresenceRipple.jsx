import React from "react";
import { motion } from "framer-motion";

export const PresenceRipple = ({ color = "#00f0ff", size = 40, className = "" }) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.5, 2],
        opacity: [0.8, 0.2, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeOut",
      }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        filter: "blur(10px)",
        zIndex: 0,
        pointerEvents: "none",
      }}
      className={className}
    />
  );
};

export default PresenceRipple;
