import { useState } from "react";
import { ChatCircleDots, X } from "@phosphor-icons/react";
import {
  buildAdminWhatsAppHref,
  getActiveCommunityCampaign,
  WHATSAPP_MESSAGE,
} from "../config";

export function WhatsAppWidget() {
  const [open, setOpen] = useState(true);
  const campaign = getActiveCommunityCampaign();
  const href = buildAdminWhatsAppHref(
    campaign
      ? "Hai admin Mikbalvia Digital, saya ingin klaim promo / bertanya tentang layanan Mind Aku."
      : WHATSAPP_MESSAGE
  );

  return (
    <div className="whatsapp-widget" aria-live="polite">
      {open ? (
        <div className="whatsapp-widget__card">
          <button
            type="button"
            className="whatsapp-widget__close"
            aria-label="Tutup bantuan WhatsApp"
            onClick={() => setOpen(false)}
          >
            <X weight="bold" className="size-4" />
          </button>
          <p className="whatsapp-widget__title">
            {campaign ? "Klaim promo?" : "Butuh bantuan?"}
          </p>
          <p className="whatsapp-widget__text">
            {campaign
              ? "Chat admin untuk klaim promo, order API, atau pertanyaan. Channel pengumuman khusus broadcast admin."
              : "Ada yang ingin ditanyakan, order API, atau perpanjang API? Hubungi admin via WhatsApp."}
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-widget__link"
            aria-label="Hubungi admin melalui WhatsApp"
          >
            <ChatCircleDots weight="fill" className="size-9" />
          </a>
        </div>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-widget__link whatsapp-widget__link--closed"
          aria-label="Buka bantuan WhatsApp"
        >
          <ChatCircleDots weight="fill" className="size-9" />
        </a>
      )}
    </div>
  );
}