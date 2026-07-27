import { NavLink, useNavigate } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { COMPANY } from "../lib/company";
import { ApiKeySession } from "./ApiKeySession";
import { Atmosphere } from "./Atmosphere";
import { PageEnter } from "./PageEnter";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/console", label: "Dashboard", delay: "0ms" },
  { to: "/setup", label: "Setup", delay: "50ms" },
  { to: "/models", label: "Models", delay: "100ms" },
  { to: "/usage", label: "Usage", delay: "150ms" },
  { to: "/logs", label: "Logs", delay: "200ms" },
  { to: "/payments", label: "Top up", delay: "250ms" },
] as const;

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    "group relative block rounded-xl px-3 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300",
    isActive
      ? "bg-accent text-foreground translate-x-0.5"
      : "text-muted-foreground hover:bg-card/80 hover:text-foreground hover:translate-x-0.5",
  ].join(" ");

function BrandBlock({
  apiKey,
  memberName,
}: {
  apiKey?: string | null;
  memberName?: string | null;
}) {
  return (
    <div className="px-2">
      <p className="brand-reveal font-display text-3xl font-extrabold leading-none tracking-tight text-foreground">
        {COMPANY.name}
      </p>
      <p className="rise-in rise-in-delay-1 mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
        {COMPANY.tagline}
      </p>
      {apiKey ? <ApiKeySession apiKey={apiKey} memberName={memberName} /> : null}
      {!apiKey && memberName ? (
        <p
          className="rise-in rise-in-delay-2 mt-5 truncate border-t border-border pt-4 text-xs text-muted-foreground"
          title={memberName}
        >
          Builder · {memberName}
        </p>
      ) : null}
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={navClass}
          style={{ animationDelay: item.delay }}
          onClick={onNavigate}
        >
          {({ isActive }) => (
            <span className="nav-item-enter block" style={{ animationDelay: item.delay }}>
              <span
                className={[
                  "absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-primary to-[var(--signal)] transition-all duration-300",
                  isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50 group-hover:opacity-40",
                ].join(" ")}
              />
              <span className="pl-2">{item.label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { apiKey, status, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <Atmosphere />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <header className="flex items-center justify-between border-b border-border bg-card/55 px-5 py-4 backdrop-blur-md md:hidden">
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight">{COMPANY.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {COMPANY.tagline}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </Button>
        </header>

        {menuOpen ? (
          <div className="border-b border-border bg-card/80 px-5 py-5 backdrop-blur-md md:hidden">
            <BrandBlock apiKey={apiKey} memberName={status?.apiKey?.name} />
            <div className="mt-6">
              <NavList onNavigate={() => setMenuOpen(false)} />
            </div>
            <Button type="button" variant="outline" className="mt-6 w-full" onClick={signOut}>
              Sign out
            </Button>
          </div>
        ) : null}

        <aside className="rise-in hidden w-64 shrink-0 flex-col border-r border-border bg-card/35 px-5 py-8 backdrop-blur-md md:flex">
          <div className="mb-10">
            <BrandBlock apiKey={apiKey} memberName={status?.apiKey?.name} />
          </div>
          <NavList />
          <div className="rise-in rise-in-delay-3 mt-8 space-y-3 border-t border-border pt-5">
            <Button type="button" variant="outline" className="w-full" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto px-5 py-7 md:px-10 md:py-10">
          <PageEnter>{children}</PageEnter>
        </main>
      </div>
    </div>
  );
}
