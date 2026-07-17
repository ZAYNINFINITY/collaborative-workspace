import React from "react";
import { motion } from "framer-motion";

export const StaggeredLayout = ({ children, className = "" }) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { y: 15, opacity: 0 },
            show: {
              y: 0,
              opacity: 1,
              transition: {
                type: "spring",
                bounce: 0.4,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StaggeredLayout;
