import { useEffect, useState } from "react";
import { Megaphone, ChatCircleDots, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildAdminWhatsAppHref,
  buildWhatsAppGroupHref,
  COMMUNITY_CLAIM_WHATSAPP_MESSAGE,
  getActiveCommunityCampaign,
} from "../config";
import { isCommunityJoined, markCommunityJoined } from "../lib/communityWhatsApp";
import { cn } from "@/lib/utils";

export function CommunityBanner({ className }: { className?: string }) {
  const groupHref = buildWhatsAppGroupHref();
  const campaign = getActiveCommunityCampaign();
  const [joined, setJoined] = useState(false);
  const adminHref = buildAdminWhatsAppHref(
    campaign ? COMMUNITY_CLAIM_WHATSAPP_MESSAGE : undefined
  );

  useEffect(() => {
    function sync() {
      setJoined(isCommunityJoined());
    }
    sync();
    window.addEventListener("new-clients:community-joined", sync);
    return () => window.removeEventListener("new-clients:community-joined", sync);
  }, []);

  if (!groupHref) return null;

  function onJoinClick() {
    markCommunityJoined();
    setJoined(true);
    window.dispatchEvent(new Event("new-clients:community-joined"));
  }

  if (joined) {
    return (
      <Card
        className={cn(
          campaign && "border-accent/30",
          className
        )}
      >
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {campaign ? "Cek pengumuman / promo di channel" : "Kamu di channel pengumuman"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {campaign
                ? campaign.teaser
                : "Hanya admin yang kirim pesan. Tanya atau klaim lewat chat admin."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={groupHref} target="_blank" rel="noopener noreferrer">
                Buka channel
              </a>
            </Button>
            <Button asChild size="sm" variant={campaign ? "default" : "outline"}>
              <a href={adminHref} target="_blank" rel="noopener noreferrer">
                <ChatCircleDots weight="bold" className="size-3.5" />
                Chat admin
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-primary/30",
        campaign && "border-accent/40",
        className
      )}
    >
      <CardContent className="relative p-5 sm:p-6">
        <div className="relative">
          {campaign ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
              <Sparkle weight="fill" className="size-3" />
              Promo aktif
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              <Megaphone weight="duotone" className="size-3" />
              Channel resmi
            </div>
          )}

          <h3 className="mt-3 font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Ikuti channel pengumuman Mind Aku
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Update model, status layanan, dan promo — hanya pengumuman admin, tanpa spam chat member.
          </p>
          {campaign ? (
            <p className="mt-3 text-sm text-foreground">
              <strong className="font-semibold">Sedang berlangsung:</strong> {campaign.teaser}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild onClick={onJoinClick}>
              <a href={groupHref} target="_blank" rel="noopener noreferrer">
                Join channel WhatsApp
              </a>
            </Button>
            <Button type="button" variant="outline" onClick={onJoinClick}>
              Sudah join
            </Button>
            <Button asChild variant="ghost">
              <a href={adminHref} target="_blank" rel="noopener noreferrer">
                <ChatCircleDots weight="bold" className="size-3.5" />
                Chat admin
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Soft CTA for payment / buy success pages. */
export function CommunityJoinSoftCta({ className }: { className?: string }) {
  const groupHref = buildWhatsAppGroupHref();
  if (!groupHref) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/40 px-4 py-3 text-left text-sm text-muted-foreground",
        className
      )}
    >
      <p>
        Gabung channel pengumuman biar tidak ketinggalan promo credit &amp; update model.
      </p>
      <a
        href={groupHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex font-semibold text-primary hover:underline"
        onClick={() => {
          markCommunityJoined();
          window.dispatchEvent(new Event("new-clients:community-joined"));
        }}
      >
        Join channel WhatsApp
      </a>
    </div>
  );
}