import { useReducedMotion } from "motion/react";

/**
 * Returns safe animation props that respect prefers-reduced-motion.
 * When the user prefers reduced motion, `whileHover`/`whileTap`/`transition`
 * are stripped so the UI updates instantly without movement.
 */
export function useReducedMotionProps() {
  const reduced = useReducedMotion();
  return {
    reduced,
    hover: reduced ? undefined : { y: -2 },
    tap: reduced ? undefined : { scale: 0.97 },
    transition: reduced ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  };
}