import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { pageVariants } from "../lib/motion";

/** Remounts children on route change so entrance animations replay. */
export function PageEnter({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isChat = location.pathname === "/chat";
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={isChat ? "flex min-h-0 flex-1 flex-col" : ""}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}