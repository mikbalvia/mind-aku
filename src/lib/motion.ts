import type { Transition, Variants } from "motion/react";

export const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeOut } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: easeOut } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.24, ease: easeOut } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.24, ease: easeOut } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

/** Fade-only page transition — no vertical slide to keep route changes cheap. */
export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: easeOut } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: easeOut } },
  exit: { opacity: 0, scale: 0.99, y: 2, transition: { duration: 0.14, ease: easeOut } },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.16, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: easeOut } },
};

export const tap = { scale: 0.97 };
export const hoverLift = { y: -2 };
