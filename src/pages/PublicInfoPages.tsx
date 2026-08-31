import { ArrowLeft, ArrowSquareOut, Envelope, ChatCircleDots } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Atmosphere } from "../components/Atmosphere";
import { BrandLockup } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { COMPANY } from "../lib/company";
import {
  AI_BASE_URL,
  OMNIROUTE_BASE_URL,
  PUBLIC_WEB_URL,
  WHATSAPP_GROUP_URL,
  WHATSAPP_NUMBER,
  buildAdminWhatsAppHref,
  buildWhatsAppGroupHref,
} from "../config";

type PublicPage = "faq" | "refund" | "terms" | "contact";

function ContactLinks() {
  const { t } = useTranslation();
  const groupHref = buildWhatsAppGroupHref();
  const adminHref = buildAdminWhatsAppHref();
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <Button asChild size="sm">
        <a href={`mailto:${COMPANY.adminEmail}`}>
          <Envelope /> {t("Email support")}
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={adminHref} target="_blank" rel="noopener noreferrer">
          <ChatCircleDots /> {t("Chat admin")}
        </a>
      </Button>
      {groupHref ? (
        <Button asChild size="sm" variant="outline">
          <a href={groupHref} target="_blank" rel="noopener noreferrer">
            <ChatCircleDots /> {t("Announcement channel")}
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function Content({ page }: { page: PublicPage }) {
  const { t } = useTranslation();

  if (page === "faq")
    return (
      <>
        <h2>{t("About the service")}</h2>
        <h3>{t("What is Mind Aku?")}</h3>
        <p>
          {t(
            "Mind Aku is an API service that lets you connect AI tools such as Claude Code, Codex, OpenClaw, KiloCode, and others to a single API endpoint with your personal API key."
          )}
        </p>
        <h3>{t("How do I get an API key?")}</h3>
        <p>
          {t(
            "An API key is issued after you order or activate the service through Mikbalvia Digital admin. Contact us if you do not have an API key yet."
          )}
        </p>
        <h3>{t("Where can I check remaining quota?")}</h3>
        <p>
          {t(
            "Sign in to the Mind Aku portal, enter your API key, then open the dashboard to see balance, usage, and requests."
          )}
        </p>
        <h2>{t("API usage")}</h2>
        <h3>{t("What Base URL should I use?")}</h3>
        <p>
          <code>{AI_BASE_URL}</code>
        </p>
        <h3>{t("How do I auto-setup Claude Code / Codex / OpenClaw / Hermes / OpenCode / KiloCode / Cline / Cursor / Claude Desktop?")}</h3>
        <p>
          {t(
            "Log in to the portal and open Setup. Pick one tool. Most tools need a single curl command (the script installs the CLI if needed, then writes Mind Aku config). Claude Desktop: download the app, enable Developer Mode, and fill in the Mind Aku gateway. Claude/Codex CLI: install → auto-config → (optional) extension in VS Code / Cursor / Antigravity. Or run (the script will ask for your API key):"
          )}
        </p>
        <p>
          <code>{`curl -fsSL "${OMNIROUTE_BASE_URL}/setup" | bash`}</code>
        </p>
        <p>
          {t("Windows PowerShell:")}{" "}
          <code>{`irm "${OMNIROUTE_BASE_URL}/setup" | iex`}</code>
        </p>
        <p>
          {t(
            "The script points Claude Code, Codex, OpenClaw, Hermes, OpenCode, KiloCode, Cline, VS Code, and Cursor at the Mind Aku gateway. Model lists come from the gateway API."
          )}
        </p>
        <h3>{t("May I share my API key?")}</h3>
        <p>
          {t(
            "No. Your API key is personal and your responsibility. Do not share it with others."
          )}
        </p>
        <h3>{t("What if my quota runs out?")}</h3>
        <p>
          {t(
            "You can buy more limit via Top up in the console or contact admin to renew your package."
          )}
        </p>
        <h2>{t("Payments and support")}</h2>
        <h3>{t("What payment methods are available?")}</h3>
        <p>
          {t(
            "Payment is via QRIS or other digital methods shown on the purchase page at checkout."
          )}
        </p>
        <h3>{t("How long until limits are added after payment?")}</h3>
        <p>
          {t(
            "Usually within a few minutes after payment is confirmed. If it has not arrived after 30 minutes, contact support with your transaction ID."
          )}
        </p>
        <h3>{t("How do I contact admin?")}</h3>
        <p>
          {t(
            "Email: {{email}}, WhatsApp admin: +{{phone}}. For questions, orders, transfer proof, or promo claims — use admin chat (not the group).",
            { email: COMPANY.adminEmail, phone: WHATSAPP_NUMBER }
          )}
        </p>
        <h3>{t("What is the WhatsApp announcement channel?")}</h3>
        <p>
          {t(
            "The official Mind Aku channel for model updates, service status, and promos. Only admins can post. Members cannot reply in the group."
          )}
        </p>
        <h3>{t("Why can't I chat in the group?")}</h3>
        <p>
          {t(
            "The group is announcement-only to stay free of spam. For help or promo claims, contact admin on private WhatsApp."
          )}
        </p>
        {WHATSAPP_GROUP_URL ? (
          <p>
            {t("Join channel:")}{" "}
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">
              {WHATSAPP_GROUP_URL}
            </a>
          </p>
        ) : null}
      </>
    );

  if (page === "refund")
    return (
      <>
        <p>{t("Last updated: 23 June 2026")}</p>
        <h2>{t("1. Scope")}</h2>
        <p>
          {t(
            "This policy applies to purchases of additional request limits, package renewals, and other paid transactions made through Mind Aku operated by Mikbalvia Digital."
          )}
        </p>
        <h2>{t("2. Digital product")}</h2>
        <p>
          {t(
            "Mind Aku provides API access and digital request quota. Once quota is added to your API key, the service is considered delivered."
          )}
        </p>
        <h2>{t("3. Refund conditions")}</h2>
        <p>{t("A refund may be requested when:")}</p>
        <ul>
          <li>
            {t(
              "Payment succeeded but quota was not added within 24 hours after confirmation, and support has not resolved the issue."
            )}
          </li>
          <li>{t("A duplicate charge occurred for the same transaction.")}</li>
          <li>
            {t(
              "The service is unusable due to a system outage on our side lasting more than 48 consecutive hours."
            )}
          </li>
        </ul>
        <h2>{t("4. Non-refundable cases")}</h2>
        <ul>
          <li>{t("Quota has already been added and/or partially or fully used.")}</li>
          <li>{t("Misuse of the API key, tool misconfiguration, or user error.")}</li>
          <li>
            {t(
              "Refund requests more than 7 days after the transaction date without evidence of a technical issue."
            )}
          </li>
        </ul>
        <h2>{t("5. How to request a refund")}</h2>
        <p>
          {t(
            "Send the transaction ID or payment proof, an API key that may be partially masked, and the reason via support channels. Our team reviews within 1–3 business days."
          )}
        </p>
        <ContactLinks />
        <h2>{t("6. Refund method")}</h2>
        <p>
          {t(
            "Refunds go back to the same account or payment method per the payment provider's policy, or via bank transfer when required."
          )}
        </p>
      </>
    );

  if (page === "terms")
    return (
      <>
        <p>{t("By using Mind Aku, you agree to the following terms and conditions.")}</p>
        <h2>{t("1. Definitions")}</h2>
        <ul>
          <li>
            <strong>{t("Service — the Mind Aku API plus portal, documentation, and related features.")}</strong>
          </li>
          <li>
            <strong>{t("User — an individual or business with an active API key.")}</strong>
          </li>
          <li>
            <strong>{t("API Key — personal access credentials issued by Mikbalvia Digital.")}</strong>
          </li>
        </ul>
        <h2>{t("2. Service use")}</h2>
        <ul>
          <li>{t("API keys are only for personal use or authorized internal team use.")}</li>
          <li>
            {t("Misusing the service for illegal activity, spam, or harmful content is prohibited.")}
          </li>
          <li>
            {t(
              "Attempting to access, modify, or disrupt server infrastructure without permission is prohibited."
            )}
          </li>
          <li>
            {t(
              "Request quota follows the purchased package; exceeding quota may temporarily block usage."
            )}
          </li>
        </ul>
        <h2>{t("3. Account and security")}</h2>
        <p>
          {t(
            "Users must keep API keys confidential. Mikbalvia Digital is not liable for misuse caused by user negligence."
          )}
        </p>
        <h2>{t("4. Payments")}</h2>
        <p>
          {t(
            "Prices, packages, and payment methods are shown on the purchase page. Payment is valid once confirmed by the payment system."
          )}
        </p>
        <h2>{t("5. Availability")}</h2>
        <p>
          {t(
            "We strive to keep the service available but do not guarantee 100% uptime. Scheduled maintenance may occur with notice as needed."
          )}
        </p>
        <h2>{t("6. Limitation of liability")}</h2>
        <p>
          {t(
            "The service is provided “as is”. Mikbalvia Digital is not liable for indirect losses from outages, data loss, or third-party AI tool outputs."
          )}
        </p>
        <h2>{t("7. Changes to terms")}</h2>
        <p>
          {t("These terms may be updated at any time. The latest version is always on this page.")}
        </p>
        <h2>{t("8. Governing law")}</h2>
        <p>{t("These terms are governed by the laws of the Republic of Indonesia.")}</p>
        <h2>{t("9. Contact")}</h2>
        <p>
          {t("Questions about these terms can be sent to {{email}}.", {
            email: COMPANY.adminEmail,
          })}
        </p>
      </>
    );

  return (
    <>
      <p>
        {t(
          "For questions, technical help, API key orders, renewals, or refunds, contact us through the channels below."
        )}
      </p>
      <div className="my-6 rounded-xl border border-border bg-muted/50 p-5 sm:p-6">
        <h2 className="!mt-0">Mikbalvia Digital</h2>
        <dl className="space-y-4">
          <div>
            <dt>{t("Email")}</dt>
            <dd>
              <a href={`mailto:${COMPANY.adminEmail}`}>{COMPANY.adminEmail}</a>
            </dd>
          </div>
          <div>
            <dt>{t("Chat admin (WhatsApp)")}</dt>
            <dd>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`}>+{WHATSAPP_NUMBER}</a> —{" "}
              {t("questions, orders, transfer proof, promo claims")}
            </dd>
          </div>
          {WHATSAPP_GROUP_URL ? (
            <div>
              <dt>{t("Announcement channel")}</dt>
              <dd>
                <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">
                  {t("Join WhatsApp group")}
                </a>{" "}
                — {t("admins only post (updates & promos)")}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>{t("Business address")}</dt>
            <dd>
              {t(
                "Jl. Haji Kocen No. 19, RT/RW 001/006, Kel. Kalimulya, Kec. Cilodong, Depok, Jawa Barat, Indonesia"
              )}
            </dd>
          </div>
          <div>
            <dt>{t("Service website")}</dt>
            <dd>
              <a href={PUBLIC_WEB_URL}>{PUBLIC_WEB_URL}</a>
            </dd>
          </div>
        </dl>
      </div>
      <h2>{t("Response hours")}</h2>
      <p>
        {t(
          "WhatsApp and email messages are usually answered within 1–24 hours on business days."
        )}
      </p>
      <h2>{t("Before contacting us")}</h2>
      <p>
        {t(
          "Have your API key ready (may be masked), transaction ID if payment-related, and an error screenshot so we can help faster."
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button asChild>
          <a href={buildAdminWhatsAppHref()} target="_blank" rel="noopener noreferrer">
            <ChatCircleDots /> {t("Chat via WhatsApp")}
          </a>
        </Button>
        {WHATSAPP_GROUP_URL ? (
          <Button asChild variant="outline">
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">
              <ChatCircleDots /> {t("Join announcement channel")}
            </a>
          </Button>
        ) : null}
      </div>
    </>
  );
}

export function PublicInfoPage({ page }: { page: PublicPage }) {
  const { t } = useTranslation();
  const copy = {
    faq: {
      eyebrow: "Mikbalvia Digital",
      title: t("Frequently asked questions"),
      lead: t("Short answers about the Mind Aku API service from Mikbalvia Digital."),
    },
    refund: {
      eyebrow: t("Policy / 01"),
      title: t("Refund policy title"),
      lead: t("Terms for refunds on Mind Aku service purchases."),
    },
    terms: {
      eyebrow: t("Policy / 02"),
      title: t("Terms and conditions"),
      lead: t("Terms of use for the Mind Aku API service."),
    },
    contact: {
      eyebrow: t("Support channel"),
      title: t("Contact us"),
      lead: t("Official Mikbalvia Digital contact details for Mind Aku."),
    },
  }[page];

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <Atmosphere />
      <header className="relative z-10 border-b border-border bg-muted/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-5 sm:px-6">
          <Link to="/">
            <BrandLockup showTagline={false} markClassName="size-8" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft weight="bold" /> {t("Back home")}
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-16 sm:px-6">
        <header className="py-12 sm:py-16">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-2xl font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{copy.lead}</p>
        </header>
        <article className="public-content rounded-xl border border-border bg-card p-5 shadow-md backdrop-blur-sm sm:p-8">
          <Content page={page} />
        </article>
        <footer className="flex flex-wrap items-center justify-between gap-3 py-8 text-xs text-muted-foreground">
          <span>{t("© 2026 Mikbalvia Digital.")}</span>
          <a href={`mailto:${COMPANY.adminEmail}`} className="inline-flex items-center gap-1">
            {t("Need help?")} <ArrowSquareOut className="size-3" />
          </a>
        </footer>
      </main>
    </div>
  );
}
