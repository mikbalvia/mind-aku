import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

/** Remounts children on route change so entrance animations replay. */
export function PageEnter({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  );
}
