import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Announcement = {
  id: string;
  title: string;
  body: ReactNode;
  primaryTo: string;
  primaryLabel: string;
};

/** Bump an announcement id when shipping a new one so returning users see it again. */
const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "opus-5-ready-2026-08-01",
    title: "Claude Opus 5 sudah ready",
    body: (
      <>
        Model <strong className="text-foreground">claude-opus-5</strong> sudah tersedia di Mind
        Aku. Silakan ke menu <strong className="text-foreground">Setup</strong> untuk auto-config
        Claude Desktop, Claude Code, Codex, atau OpenClaw.
      </>
    ),
    primaryTo: "/setup",
    primaryLabel: "Ke menu Setup",
  },
  {
    id: "subscription-plan-2026-08-02-menu",
    title: "New plan subscription",
    body: (
      <>
        Paket baru: <strong className="text-foreground">2 minggu Rp 800rb</strong> atau{" "}
        <strong className="text-foreground">1 bulan Rp 1,5 jt</strong>. Limit harian{" "}
        <strong className="text-foreground">$100</strong>, total sebulan{" "}
        <strong className="text-foreground">$3.000</strong> (~Rp 50 jt), RPM{" "}
        <strong className="text-foreground">20</strong>. Transfer BCA lalu WA admin — lihat menu{" "}
        <strong className="text-foreground">Subscription</strong>.
      </>
    ),
    primaryTo: "/subscription",
    primaryLabel: "Ke menu Subscription",
  },
];

function storageKey(id: string) {
  return `new-clients.announcement.dismissed.${id}`;
}

function firstVisibleAnnouncement(): Announcement | null {
  for (const item of ANNOUNCEMENTS) {
    try {
      if (window.localStorage.getItem(storageKey(item.id)) === "1") continue;
    } catch {
      // ignore storage failures — still show once per session
    }
    return item;
  }
  return null;
}

export function AnnouncementPopup() {
  const [current, setCurrent] = useState<Announcement | null>(null);

  useEffect(() => {
    setCurrent(firstVisibleAnnouncement());
  }, []);

  function dismiss() {
    if (!current) return;
    try {
      window.localStorage.setItem(storageKey(current.id), "1");
    } catch {
      // ignore
    }
    setCurrent(firstVisibleAnnouncement());
  }

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <Card className="scale-in relative w-full max-w-md border-primary/40 bg-card shadow-2xl shadow-primary/10">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Tutup"
        >
          <X className="size-4" />
        </button>
        <CardContent className="p-6 pt-8 sm:p-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="size-3.5" />
            Pengumuman
          </div>
          <h2
            id="announcement-title"
            className="font-display text-2xl font-medium tracking-tight text-foreground"
          >
            {current.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{current.body}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={dismiss}>
              Nanti saja
            </Button>
            <Button asChild onClick={dismiss}>
              <Link to={current.primaryTo}>{current.primaryLabel}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
