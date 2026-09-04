import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  House,
  ChatTeardropText,
  ChatsCircle,
  Image as ImageIcon,
  BookOpenText,
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
import { LanguageSwitcher } from "./LanguageSwitcher";
import { VsCodeChatAnnouncementPopup } from "./VsCodeChatAnnouncementPopup";
import { CommunityJoinModal } from "./CommunityJoinModal";
import { Backdrop } from "./Backdrop";
import { PageEnter } from "./PageEnter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_PAGE_ENABLED } from "../config";

type NavItem = {
  to: string;
  labelKey: string;
  icon: typeof House;
  delay: string;
};

const allNavItems: NavItem[] = [
  { to: "/console", labelKey: "Dashboard", icon: House, delay: "0ms" },
  { to: "/chat", labelKey: "Chat", icon: ChatTeardropText, delay: "40ms" },
  { to: "/images", labelKey: "Image", icon: ImageIcon, delay: "50ms" },
  { to: "/image-guide", labelKey: "Image Guide", icon: BookOpenText, delay: "55ms" },
  { to: "/chat-guide", labelKey: "Web Chat", icon: ChatsCircle, delay: "60ms" },
  { to: "/setup", labelKey: "Setup", icon: Wrench, delay: "80ms" },
  { to: "/sample-api", labelKey: "Sample API", icon: Code, delay: "100ms" },
  { to: "/models", labelKey: "Models", icon: Stack, delay: "140ms" },
  { to: "/usage", labelKey: "Usage", icon: ChartLineUp, delay: "180ms" },
  { to: "/logs", labelKey: "Logs", icon: ListChecks, delay: "220ms" },
  { to: "/subscription", labelKey: "Subscription", icon: Crown, delay: "260ms" },
  { to: "/payments", labelKey: "Top up", icon: CreditCard, delay: "300ms" },
  { to: "/affiliate", labelKey: "Affiliate", icon: UsersThree, delay: "340ms" },
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

function BuilderName({ name }: { name: string }) {
  const { t } = useTranslation();
  return <>{t("Builder · {{name}}", { name })}</>;
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
          <BuilderName name={memberName} />
        </p>
      ) : null}
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
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
                <span className="truncate">{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
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

      <header className="fixed inset-x-0 top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-[rgba(7,8,13,0.85)] px-4 backdrop-blur-xl md:hidden">
        <Link to="/console" className="min-w-0">
          <BrandLockup
            showTagline={false}
            markClassName="size-8"
            nameClassName="text-base"
          />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={menuOpen}
            aria-label={t("Toggle navigation")}
            onClick={() => setMenuOpen((open) => !open)}
            className="h-9 px-3"
          >
            {menuOpen ? (
              <>
                <X weight="bold" className="size-4" />
                <span>{t("Close")}</span>
              </>
            ) : (
              <>
                <List weight="bold" className="size-4" />
                <span>{t("Menu")}</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {menuOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col border-b border-border/60 bg-[rgba(7,8,13,0.96)] backdrop-blur-xl md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("Navigation menu")}
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
            <div className="mt-6 space-y-3 border-t border-border/60 pt-5">
              <LanguageSwitcher className="w-full justify-center" />
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={signOut}
              >
                <SignOut weight="bold" className="size-4" />
                {t("Sign out")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
            <LanguageSwitcher className="w-full justify-center" />
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={signOut}
            >
              <SignOut weight="bold" className="size-4" />
              {t("Sign out")}
            </Button>
          </div>
        </div>
      </aside>

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
