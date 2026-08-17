import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import {
  House,
  ChatTeardropText,
  Wrench,
  Code,
  Stack,
  ChartLineUp,
  ListChecks,
  Crown,
  CreditCard,
  UsersThree,
  SignOut,
  X,
  List,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext";
import { ApiKeySession } from "./ApiKeySession";
import { BrandLockup } from "./BrandLogo";
import { VsCodeChatAnnouncementPopup } from "./VsCodeChatAnnouncementPopup";
import { CommunityJoinModal } from "./CommunityJoinModal";
import { Backdrop } from "./Backdrop";
import { PageEnter } from "./PageEnter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_PAGE_ENABLED } from "../config";

type NavItem = {
  to: string;
  label: string;
  icon: typeof House;
  delay: string;
};

const allNavItems: NavItem[] = [
  { to: "/console", label: "Dashboard", icon: House, delay: "0ms" },
  { to: "/chat", label: "Chat", icon: ChatTeardropText, delay: "40ms" },
  { to: "/setup", label: "Setup", icon: Wrench, delay: "80ms" },
  { to: "/sample-api", label: "Sample API", icon: Code, delay: "100ms" },
  { to: "/models", label: "Models", icon: Stack, delay: "140ms" },
  { to: "/usage", label: "Usage", icon: ChartLineUp, delay: "180ms" },
  { to: "/logs", label: "Logs", icon: ListChecks, delay: "220ms" },
  { to: "/subscription", label: "Subscription", icon: Crown, delay: "260ms" },
  { to: "/payments", label: "Top up", icon: CreditCard, delay: "300ms" },
  { to: "/affiliate", label: "Affiliate", icon: UsersThree, delay: "340ms" },
];

const navItems: NavItem[] = SUBSCRIPTION_PAGE_ENABLED
  ? allNavItems
  : allNavItems.filter((item) => item.to !== "/subscription");

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-foreground shadow-[inset_0_0_0_1px_rgba(249,115,22,0.3)]"
      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
  );
}

function BrandBlock({
  apiKey,
  memberName,
  showLockup = true,
}: {
  apiKey?: string | null;
  memberName?: string | null;
  showLockup?: boolean;
}) {
  return (
    <div className="px-2">
      {showLockup ? <BrandLockup /> : null}
      {apiKey ? (
        <ApiKeySession
          apiKey={apiKey}
          memberName={memberName}
          className={showLockup ? undefined : "mt-0 border-t-0 pt-0"}
        />
      ) : null}
      {!apiKey && memberName ? (
        <p
          className={cn(
            "truncate text-xs text-muted-foreground",
            showLockup && "mt-5 border-t border-border pt-4"
          )}
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
    <nav className="flex flex-1 flex-col gap-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={navClass}
            style={{ animationDelay: item.delay }}
            onClick={onNavigate}
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary via-accent to-[var(--aurora-3)]"
                  />
                ) : null}
                <Icon
                  weight={isActive ? "fill" : "duotone"}
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { apiKey, status, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isChat = location.pathname === "/chat";

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  function signOut() {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className={cn(
        "relative text-foreground",
        isChat ? "h-dvh overflow-hidden" : "min-h-screen"
      )}
    >
      <Backdrop />

      {/* Mobile top bar — brand name + menu toggle */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-[rgba(7,8,13,0.85)] px-4 backdrop-blur-xl md:hidden">
        <Link to="/console" className="min-w-0">
          <BrandLockup
            showTagline={false}
            markClassName="size-8"
            nameClassName="text-base"
          />
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="h-9 px-3"
        >
          {menuOpen ? (
            <>
              <X weight="bold" className="size-4" />
              <span>Close</span>
            </>
          ) : (
            <>
              <List weight="bold" className="size-4" />
              <span>Menu</span>
            </>
          )}
        </Button>
      </header>

      {/* Mobile menu drawer — overlay from below header, full-height scroll */}
      {menuOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col border-b border-border/60 bg-[rgba(7,8,13,0.96)] backdrop-blur-xl md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6 pt-5">
            <div className="mb-6">
              <BrandBlock
                apiKey={apiKey}
                memberName={status?.apiKey?.name}
                showLockup={false}
              />
            </div>
            <NavList onNavigate={() => setMenuOpen(false)} />
            <div className="mt-6 border-t border-border/60 pt-5">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={signOut}
              >
                <SignOut weight="bold" className="size-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop sidebar — fixed left, full height, does NOT scroll with content */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/60 bg-[rgba(10,11,18,0.78)] backdrop-blur-xl md:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />
        <div className="flex h-full flex-col overflow-y-auto px-5 pb-6 pt-7">
          <div className="mb-8">
            <BrandBlock apiKey={apiKey} memberName={status?.apiKey?.name} />
          </div>
          <NavList />
          <div className="mt-8 space-y-3 border-t border-border/60 pt-5">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={signOut}
            >
              <SignOut weight="bold" className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main — offset by sidebar width on desktop; scroll container on its own */}
      <main
        className={cn(
          "relative z-10 min-w-0 flex-1 md:ml-64",
          isChat
            ? "flex h-dvh flex-col overflow-hidden md:h-screen"
            : "min-h-screen overflow-x-hidden",
          "pt-14 md:pt-0"
        )}
      >
        <div
          className={cn(
            isChat
              ? "flex h-full flex-col px-4 py-5 md:px-10 md:py-10"
              : "px-5 py-7 md:px-10 md:py-10"
          )}
        >
          <PageEnter>{children}</PageEnter>
        </div>
      </main>
      <VsCodeChatAnnouncementPopup />
      <CommunityJoinModal />
    </div>
  );
}