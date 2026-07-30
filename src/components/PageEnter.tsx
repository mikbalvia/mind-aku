import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

/** Remounts children on route change so entrance animations replay. */
export function PageEnter({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isChat = location.pathname === "/chat";
  return (
    <div
      key={location.pathname}
      className={isChat ? "page-enter flex min-h-0 flex-1 flex-col" : "page-enter"}
    >
      {children}
    </div>
  );
}
