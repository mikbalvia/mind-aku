import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Bump this id when shipping a new announcement so returning users see it again. */
const ANNOUNCEMENT_ID = "opus-5-ready-2026-08-01";
const STORAGE_KEY = `new-clients.announcement.dismissed.${ANNOUNCEMENT_ID}`;

export function AnnouncementPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // ignore storage failures — still show once per session
    }
    setOpen(true);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

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
            Claude Opus 5 sudah ready
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Model <strong className="text-foreground">claude-opus-5</strong> sudah tersedia di
            Mind Aku. Silakan ke menu <strong className="text-foreground">Setup</strong> untuk
            auto-config Claude Desktop, Claude Code, Codex, atau OpenClaw.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={dismiss}>
              Nanti saja
            </Button>
            <Button asChild onClick={dismiss}>
              <Link to="/setup">Ke menu Setup</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
