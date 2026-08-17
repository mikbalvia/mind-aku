import { useEffect, useState } from "react";
import { Megaphone,
  ChatCircleDots,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildAdminWhatsAppHref,
  buildWhatsAppGroupHref,
  COMMUNITY_CLAIM_WHATSAPP_MESSAGE,
  getActiveCommunityCampaign,
} from "../config";
import {
  dismissCommunityModal,
  markCommunityJoined,
  shouldShowCommunityModal,
} from "../lib/communityWhatsApp";

export function CommunityJoinModal() {
  const groupHref = buildWhatsAppGroupHref();
  const campaign = getActiveCommunityCampaign();
  const [open, setOpen] = useState(false);
  const adminHref = buildAdminWhatsAppHref(COMMUNITY_CLAIM_WHATSAPP_MESSAGE);

  useEffect(() => {
    if (!groupHref) return;

    function evaluate() {
      setOpen(shouldShowCommunityModal(campaign?.id ?? null));
    }

    evaluate();
    window.addEventListener("new-clients:announcement-dismissed", evaluate);
    return () => {
      window.removeEventListener("new-clients:announcement-dismissed", evaluate);
    };
  }, [groupHref, campaign?.id]);

  if (!groupHref || !open) return null;

  function dismiss() {
    dismissCommunityModal(campaign?.id ?? null);
    setOpen(false);
  }

  function markJoined() {
    markCommunityJoined();
    setOpen(false);
    window.dispatchEvent(new Event("new-clients:community-joined"));
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-join-title"
    >
      <Card className="scale-in relative w-full max-w-lg overflow-hidden max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Tutup"
        >
          <X weight="bold" className="size-4" />
        </button>

        <CardContent className="relative p-6 sm:p-7">
          {campaign ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              <Sparkle weight="fill" className="size-3.5" />
              Promo aktif
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <Megaphone weight="duotone" className="size-3.5" />
              Channel resmi
            </div>
          )}

          <div className="mt-4 flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Megaphone weight="duotone" className="size-5" />
            </span>
            <div>
              <h2
                id="community-join-title"
                className="font-heading text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl"
              >
                Ikuti channel pengumuman Mind Aku
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Update model, status layanan, dan promo resmi — tanpa spam chat member.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">·</span>
              Update model &amp; fitur resmi lebih dulu
            </li>
            <li className="flex gap-2">
              <span className="text-primary">·</span>
              Promo &amp; event (diskon, free credit/key) diumumkan di sini
            </li>
            <li className="flex gap-2">
              <span className="text-primary">·</span>
              Info status layanan / maintenance
            </li>
            <li className="flex gap-2">
              <span className="text-primary">·</span>
              Hanya pengumuman admin — member tidak bisa kirim pesan
            </li>
          </ul>

          {campaign ? (
            <p className="mt-4 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2.5 text-sm text-foreground">
              <strong className="font-semibold">Sedang berlangsung:</strong> {campaign.teaser} — detail di
              grup, klaim via admin.
            </p>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Grup khusus pengumuman. Tanya jawab &amp; klaim promo lewat chat admin.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:mt-6">
            <Button asChild className="w-full" onClick={markJoined}>
              <a href={groupHref} target="_blank" rel="noopener noreferrer">
                Join channel WhatsApp
              </a>
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={dismiss} className="flex-1">
                Nanti saja
              </Button>
              <Button type="button" variant="ghost" onClick={markJoined} className="flex-1">
                Sudah join
              </Button>
            </div>
            <a
              href={adminHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 pt-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ChatCircleDots weight="bold" className="size-3.5" />
              Chat admin
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}