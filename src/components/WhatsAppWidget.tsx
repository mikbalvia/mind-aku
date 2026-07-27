import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from "../config";

export function WhatsAppWidget() {
  const [open, setOpen] = useState(true);
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

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
            <X className="size-4" />
          </button>
          <p className="whatsapp-widget__title">Butuh bantuan?</p>
          <p className="whatsapp-widget__text">
            Ada yang ingin ditanyakan, order API, atau perpanjang API? Hubungi admin via WhatsApp.
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-widget__link"
            aria-label="Hubungi admin melalui WhatsApp"
          >
            <MessageCircle className="size-9" strokeWidth={1.8} />
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
          <MessageCircle className="size-9" strokeWidth={1.8} />
        </a>
      )}
    </div>
  );
}
