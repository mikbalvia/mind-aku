import { useState } from "react";
import { ChatCircleDots, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import {
  buildAdminWhatsAppHref,
  getActiveCommunityCampaign,
} from "../config";

export function WhatsAppWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const campaign = getActiveCommunityCampaign();
  const href = buildAdminWhatsAppHref(
    campaign
      ? t("Hi Mikbalvia Digital admin, I want to claim a promo / ask about Mind Aku.")
      : t("Hi Mikbalvia Digital admin, I have a question about Mind Aku.")
  );

  return (
    <div className="whatsapp-widget" aria-live="polite">
      {open ? (
        <div className="whatsapp-widget__card">
          <button
            type="button"
            className="whatsapp-widget__close"
            aria-label={t("Close WhatsApp help")}
            onClick={() => setOpen(false)}
          >
            <X weight="bold" className="size-4" />
          </button>
          <p className="whatsapp-widget__title">
            {campaign ? t("Claim a promo?") : t("Need help?")}
          </p>
          <p className="whatsapp-widget__text">
            {campaign
              ? t(
                  "Chat admin to claim a promo, order an API, or ask a question. The announcement channel is admin broadcast only."
                )
              : t("Questions, API orders, or renewals? Contact admin on WhatsApp.")}
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-widget__link"
            aria-label={t("Contact admin on WhatsApp")}
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
          aria-label={t("Open WhatsApp help")}
        >
          <ChatCircleDots weight="fill" className="size-9" />
        </a>
      )}
    </div>
  );
}
