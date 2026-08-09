import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MessageSquareCode, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ANNOUNCEMENT_ID = "vscode-chat-2026-08-10";

function storageKey(id: string) {
  return `new-clients.announcement.dismissed.${id}`;
}

export function VsCodeChatAnnouncementPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey(ANNOUNCEMENT_ID)) === "1") return;
    } catch {
      // ignore
    }
    setOpen(true);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey(ANNOUNCEMENT_ID), "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vscode-chat-announcement-title"
    >
      <Card className="scale-in relative w-full max-w-lg overflow-hidden border-primary/40 bg-card shadow-2xl shadow-primary/20 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-sky-500/10" />
        <div className="pointer-events-none absolute -left-20 -top-20 size-56 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -bottom-24 size-64 rounded-full bg-sky-500/20 blur-3xl" />

        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Tutup"
        >
          <X className="size-4" />
        </button>

        <CardContent className="relative p-5 sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="size-3.5" />
            Fitur Baru
          </div>

          <div className="mt-4 flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary">
              <MessageSquareCode className="size-5" />
            </span>
            <div>
              <h2
                id="vscode-chat-announcement-title"
                className="font-display text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl"
              >
                Sudah support VS Code Chat
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pakai model Mind Aku langsung dari Chat di VS Code. Silakan buka menu{" "}
                <strong className="text-foreground">Setup</strong> untuk langkah-langkahnya.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="outline" onClick={dismiss} className="flex-1 sm:flex-none">
              Nanti saja
            </Button>
            <Button asChild onClick={dismiss} className="flex-1 sm:flex-none">
              <Link to="/setup?tool=vscode" className="inline-flex items-center">
                Buka Setup
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
