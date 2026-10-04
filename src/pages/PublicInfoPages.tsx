import { ArrowLeft, ArrowSquareOut, Envelope, ChatCircleDots, Printer } from "@phosphor-icons/react";
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

type PublicPage = "faq" | "refund" | "terms" | "privacy" | "contact";

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
            "Log in to the portal and open Setup. Pick one tool. Most tools need a single curl command (the script installs the CLI if needed, then writes Mind Aku config). Claude Desktop: download the app, enable Developer Mode, and fill in the Mind Aku gateway. Claude/Codex CLI: install → auto-config → (optional) extension in VS Code / Cursor / Antigravity."
          )}
        </p>
        <p>
          <code>{`curl -fsSL "${OMNIROUTE_BASE_URL}/setup/<tool>?token=YOUR_TOKEN" | bash`}</code>
        </p>
        <p>
          {t("Windows PowerShell:")}{" "}
          <code>{`irm "${OMNIROUTE_BASE_URL}/setup/<tool>.ps1?token=YOUR_TOKEN" | iex`}</code>
        </p>
        <p>
          {t(
            "Replace <tool> with one of: claude, codex, openclaw, hermes, opencode, kilocode, cline, vscode, cursor, desktop. Each endpoint configures only that tool — useful when you only need one client. To configure every tool at once, drop the /<tool> path and use the legacy all-in-one endpoint."
          )}
        </p>
        <p>
          {t(
            "The script points Claude Code, Codex, OpenClaw, Hermes, OpenCode, KiloCode, Cline, VS Code, and Cursor at the Mind Aku gateway. Model lists come from the gateway API. Cursor uses state.vscdb (Settings → Models), not chatLanguageModels.json."
          )}
        </p>
        <h3>{t("May I share my API key?")}</h3>
        <p>
          {t(
            "No. Your API key is personal and your responsibility. Do not share it with others."
          )}
        </p>
        <h3>{t("Is data I send to the API kept or misused?")}</h3>
        <p>
          {t(
            "Mind Aku follows a Zero Data Retention approach for request and response content. Prompts, files, and model outputs are not stored for training, marketing, or resale. Only operational metadata (for example tokens, model, status, and time) is kept for billing and abuse prevention. Full details:"
          )}{" "}
          <Link to="/privacy-policy">{t("Privacy & data retention")}</Link>.
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
        <h2>{t("6. Data, privacy, and Zero Data Retention")}</h2>
        <p>
          {t(
            "Customer prompts, files, and model outputs are processed to deliver the API response and are not retained by Mind Aku for training, advertising, or resale. Usage metadata may be retained for billing, security, and service operation. See the full policy:"
          )}{" "}
          <Link to="/privacy-policy">{t("Privacy & data retention")}</Link>.
        </p>
        <h2>{t("7. Limitation of liability")}</h2>
        <p>
          {t(
            "The service is provided “as is”. Mikbalvia Digital is not liable for indirect losses from outages, data loss, or third-party AI tool outputs."
          )}
        </p>
        <h2>{t("8. Changes to terms")}</h2>
        <p>
          {t("These terms may be updated at any time. The latest version is always on this page.")}
        </p>
        <h2>{t("9. Governing law")}</h2>
        <p>{t("These terms are governed by the laws of the Republic of Indonesia.")}</p>
        <h2>{t("10. Contact")}</h2>
        <p>
          {t("Questions about these terms can be sent to {{email}}.", {
            email: COMPANY.adminEmail,
          })}
        </p>
      </>
    );

  if (page === "privacy")
    return (
      <>
        <p>{t("Last updated: 4 October 2026")}</p>
        <p>
          {t(
            "This Privacy & Data Retention Policy explains how Mikbalvia Digital (“we”, “us”) handles data when you use the Mind Aku API and customer portal. It is intended to support company due diligence, security review, and procurement checks."
          )}
        </p>

        <aside className="trust-attestation no-print-hide">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="trust-attestation-label">{t("Company one-pager")}</p>
              <h2 className="!mt-2">{t("Security & data handling summary")}</h2>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="print:hidden"
              onClick={() => window.print()}
            >
              <Printer /> {t("Print / save PDF")}
            </Button>
          </div>
          <ul>
            <li>{t("Zero Data Retention for prompts, files, and model outputs on Mind Aku systems.")}</li>
            <li>{t("No training, fine-tuning, advertising, or resale of customer content.")}</li>
            <li>{t("No routine human review of customer prompts or completions.")}</li>
            <li>{t("Customer retains ownership of inputs and outputs from their use of the service.")}</li>
            <li>{t("Only operational metadata is kept for billing, quotas, security, and support.")}</li>
            <li>{t("HTTPS/TLS in transit · personal API keys · least-privilege internal access.")}</li>
          </ul>
          <p className="trust-attestation-foot">
            {t(
              "Operator: Mikbalvia Digital · Service: Mind Aku · Policy URL: {{url}}/privacy-policy",
              {
                url:
                  PUBLIC_WEB_URL ||
                  (typeof window !== "undefined" ? window.location.origin : ""),
              }
            )}
          </p>
        </aside>

        <h2>{t("1. Zero Data Retention (ZDR) commitment")}</h2>
        <p>
          {t(
            "Mind Aku applies a Zero Data Retention approach to customer request and response content:"
          )}
        </p>
        <ul>
          <li>
            {t(
              "We do not store prompts, messages, uploaded files, images, or model completions for later reuse."
            )}
          </li>
          <li>
            {t(
              "We do not use customer content to train, fine-tune, or improve AI models."
            )}
          </li>
          <li>
            {t(
              "We do not sell, rent, or share customer content for advertising or marketing."
            )}
          </li>
          <li>
            {t(
              "Content is processed in transit to fulfill the API request, then discarded from Mind Aku systems after the response is delivered (subject to transient processing buffers required for normal operation)."
            )}
          </li>
        </ul>

        <h2>{t("2. What is stored vs not stored")}</h2>
        <p>
          {t(
            "Security reviewers usually need a clear store / do-not-store boundary. Use this table in vendor assessments:"
          )}
        </p>
        <div className="trust-compare">
          <table>
            <thead>
              <tr>
                <th>{t("Data type")}</th>
                <th>{t("Mind Aku stores?")}</th>
                <th>{t("Why")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("Prompts, chat messages, code, uploaded files, images")}</td>
                <td className="trust-no">{t("No")}</td>
                <td>{t("Processed to fulfill the request, then discarded (ZDR).")}</td>
              </tr>
              <tr>
                <td>{t("Model completions / outputs")}</td>
                <td className="trust-no">{t("No")}</td>
                <td>{t("Returned to the client; not archived by Mind Aku.")}</td>
              </tr>
              <tr>
                <td>{t("Training / fine-tuning on your content")}</td>
                <td className="trust-no">{t("No")}</td>
                <td>{t("Never used to improve Mind Aku or third-party models via our systems.")}</td>
              </tr>
              <tr>
                <td>{t("Usage metadata (tokens, model, status, latency, spend)")}</td>
                <td className="trust-yes">{t("Yes")}</td>
                <td>{t("Billing, quotas, abuse prevention, customer usage dashboards.")}</td>
              </tr>
              <tr>
                <td>{t("Account / API key / payment records")}</td>
                <td className="trust-yes">{t("Yes")}</td>
                <td>{t("Service delivery, invoicing, and support.")}</td>
              </tr>
              <tr>
                <td>{t("Portal chat draft history")}</td>
                <td className="trust-local">{t("Local only")}</td>
                <td>{t("Kept in the user’s browser storage, not as a Mind Aku content archive.")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>{t("3. Data flow (how a request is handled)")}</h2>
        <ol className="trust-flow">
          <li>{t("Your app / IDE sends an HTTPS request with your API key to Mind Aku.")}</li>
          <li>
            {t(
              "Mind Aku authenticates the key, applies quotas/billing checks, and relays the request to the selected upstream model provider."
            )}
          </li>
          <li>
            {t(
              "The upstream provider generates the response. Mind Aku streams or returns it to your client."
            )}
          </li>
          <li>
            {t(
              "Mind Aku keeps usage metadata for billing and security. Request/response content is not retained under our ZDR approach."
            )}
          </li>
        </ol>

        <h2>{t("4. Ownership, human access, and confidentiality")}</h2>
        <ul>
          <li>
            {t(
              "You retain ownership of the inputs you submit and the outputs you receive, subject to upstream provider terms and applicable law."
            )}
          </li>
          <li>
            {t(
              "We do not perform routine human review of customer prompts or completions. Access to systems that could expose customer content is limited to exceptional cases such as abuse investigation, legal compulsion, or explicit customer-authorized support."
            )}
          </li>
          <li>
            {t(
              "We do not use customer content for product marketing case studies without prior written consent."
            )}
          </li>
        </ul>

        <h2>{t("5. What we do retain (operational metadata only)")}</h2>
        <p>
          {t(
            "To operate billing, quotas, security, and support, we may retain non-content metadata such as:"
          )}
        </p>
        <ul>
          <li>{t("Account identifiers, API key identifiers, and contact details you provide")}</li>
          <li>{t("Timestamps, model name, HTTP status, latency, and token/usage counts")}</li>
          <li>{t("Spend, package, and payment transaction records")}</li>
          <li>{t("Limited error or abuse signals needed to keep the service secure")}</li>
        </ul>
        <p>
          {t(
            "Portal usage logs shown to customers reflect this metadata. They are not a transcript of your prompts or model outputs."
          )}
        </p>

        <h2>{t("6. Portal chat and browser storage")}</h2>
        <p>
          {t(
            "Optional chat history in the Mind Aku portal is stored in your browser (local device storage) so you can continue a conversation. That history is not uploaded to Mind Aku as a long-term content archive. Clearing browser data removes it."
          )}
        </p>

        <h2>{t("7. Upstream model providers")}</h2>
        <p>
          {t(
            "Mind Aku is an API gateway. To generate a response, your request is relayed to the selected upstream AI provider for that model. We do not keep a copy of that content after relay for Mind Aku training or analytics. Upstream providers process the request under their own service terms; enterprise customers should choose models and workflows that match their compliance requirements."
          )}
        </p>

        <h2>{t("8. Security measures")}</h2>
        <ul>
          <li>{t("API and portal traffic are served over HTTPS/TLS in transit.")}</li>
          <li>{t("Access to the service requires a personal API key; keys must be kept confidential.")}</li>
          <li>
            {t(
              "Access to operational systems is limited to authorized Mikbalvia Digital personnel for support, billing, and security."
            )}
          </li>
          <li>
            {t(
              "API keys can be rotated or revoked via admin support if compromised; contact us immediately if a key may be exposed."
            )}
          </li>
        </ul>

        <h2>{t("9. Company security FAQ")}</h2>
        <h3>{t("Do you store our source code or documents?")}</h3>
        <p>
          {t(
            "No. Content sent in API requests is not retained by Mind Aku after the response is delivered under our Zero Data Retention approach."
          )}
        </p>
        <h3>{t("Do you train AI models on our data?")}</h3>
        <p>{t("No. Customer content is not used for training or fine-tuning.")}</p>
        <h3>{t("Can Mind Aku staff read our prompts?")}</h3>
        <p>
          {t(
            "Not as a normal operation. There is no content archive for staff to browse. Access would be exceptional and purpose-limited (for example abuse, legal, or customer-authorized support)."
          )}
        </p>
        <h3>{t("What can our finance / security team audit today?")}</h3>
        <p>
          {t(
            "Usage metadata in the portal (tokens, model, status, spend), this public policy, and on request a written confirmation for procurement."
          )}
        </p>
        <h3>{t("Do you have SOC 2 / ISO 27001?")}</h3>
        <p>
          {t(
            "Formal certification status may change over time. Ask admin for the current attestation package. This page states our operational commitments regardless of certification stage."
          )}
        </p>

        <h2>{t("10. Your responsibilities")}</h2>
        <ul>
          <li>
            {t(
              "Do not send credentials, secrets, or regulated personal data unless you have a lawful basis and internal approval."
            )}
          </li>
          <li>
            {t(
              "Protect your API key. Anyone with the key can send requests billed to your account."
            )}
          </li>
          <li>
            {t(
              "Configure client tools (IDE, CLI, agents) so only intended project files are included in prompts."
            )}
          </li>
        </ul>

        <h2>{t("11. Legal basis and Indonesia compliance")}</h2>
        <p>
          {t(
            "We process account and usage data to provide the contracted service, bill accurately, prevent abuse, and meet legal obligations. Where applicable, we align operational practices with Indonesia’s Personal Data Protection Law (UU No. 27/2022) and related regulations for personal data we control as a service operator."
          )}
        </p>

        <h2>{t("12. Enterprise / company requests")}</h2>
        <p>
          {t(
            "Companies evaluating Mind Aku for internal use may request a written confirmation, security questionnaire support, or a data processing discussion for procurement. Contact us with your company name, use case, and required documents."
          )}
        </p>
        <div className="mt-5 flex flex-wrap gap-3 print:hidden">
          <Button asChild size="sm">
            <a
              href={buildAdminWhatsAppHref(
                t(
                  "Hi Mikbalvia Digital — we need a company security / Zero Data Retention confirmation for Mind Aku procurement. Company:"
                )
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ChatCircleDots /> {t("Request company confirmation")}
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={`mailto:${COMPANY.adminEmail}?subject=${encodeURIComponent("Mind Aku security / ZDR confirmation")}`}>
              <Envelope /> {t("Email security team")}
            </a>
          </Button>
        </div>

        <h2>{t("13. Policy updates")}</h2>
        <p>
          {t(
            "We may update this policy as the service evolves. The latest version is always published on this page with an updated date."
          )}
        </p>

        <h2>{t("14. Contact")}</h2>
        <p>
          {t("Privacy questions can be sent to {{email}}.", {
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
    privacy: {
      eyebrow: t("Policy / 03"),
      title: t("Privacy & data retention"),
      lead: t(
        "Zero Data Retention commitments for prompts, files, and outputs sent through Mind Aku."
      ),
    },
    contact: {
      eyebrow: t("Support channel"),
      title: t("Contact us"),
      lead: t("Official Mikbalvia Digital contact details for Mind Aku."),
    },
  }[page];

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div className="print-hide">
        <Atmosphere />
      </div>
      <header className="print-hide relative z-10 border-b border-border bg-muted/40 backdrop-blur-md">
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
        <footer className="print-hide flex flex-wrap items-center justify-between gap-3 py-8 text-xs text-muted-foreground">
          <span>{t("© 2026 Mikbalvia Digital.")}</span>
          <a href={`mailto:${COMPANY.adminEmail}`} className="inline-flex items-center gap-1">
            {t("Need help?")} <ArrowSquareOut className="size-3" />
          </a>
        </footer>
      </main>
    </div>
  );
}
