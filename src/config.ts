export const OMNIROUTE_BASE_URL =
  (import.meta.env.VITE_OMNIROUTE_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const AI_BASE_URL =
  (import.meta.env.VITE_AI_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  `${OMNIROUTE_BASE_URL}/v1`;

export const PUBLIC_WEB_URL =
  (import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window === "undefined" ? "" : window.location.origin);

export const WHATSAPP_NUMBER =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.replace(/\D/g, "") ||
  "6281990609939";

export const WHATSAPP_MESSAGE =
  (import.meta.env.VITE_WHATSAPP_MESSAGE as string | undefined) ||
  "Hai admin Mikbalvia Digital, saya ingin bertanya tentang layanan Mind Aku.";

/** Announcement-only WhatsApp group invite (`https://chat.whatsapp.com/...`). Empty = hide join UI. */
export const WHATSAPP_GROUP_URL = (() => {
  const raw = (import.meta.env.VITE_WHATSAPP_GROUP_URL as string | undefined)?.trim() || "";
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return "";
    const host = parsed.hostname.toLowerCase();
    if (host !== "chat.whatsapp.com") return "";
    return raw;
  } catch {
    return "";
  }
})();

export type CommunityCampaign = {
  id: string;
  teaser: string;
  endsAt?: string;
  claimViaAdmin: true;
};

/**
 * Optional promo teaser for the announcement channel.
 * Set via env; leave unset for no active campaign.
 */
function readCommunityCampaign(): CommunityCampaign | null {
  const id = (import.meta.env.VITE_COMMUNITY_CAMPAIGN_ID as string | undefined)?.trim();
  const teaser = (import.meta.env.VITE_COMMUNITY_CAMPAIGN_TEASER as string | undefined)?.trim();
  if (!id || !teaser) return null;
  const endsAt = (import.meta.env.VITE_COMMUNITY_CAMPAIGN_ENDS_AT as string | undefined)?.trim();
  return {
    id,
    teaser,
    endsAt: endsAt || undefined,
    claimViaAdmin: true,
  };
}

/** Active campaign, or null if unset / expired. */
export function getActiveCommunityCampaign(): CommunityCampaign | null {
  const campaign = readCommunityCampaign();
  if (!campaign) return null;
  if (campaign.endsAt) {
    const end = Date.parse(campaign.endsAt);
    if (!Number.isNaN(end) && Date.now() > end) return null;
  }
  return campaign;
}

export function buildWhatsAppGroupHref(): string | null {
  return WHATSAPP_GROUP_URL || null;
}

export function buildAdminWhatsAppHref(message?: string): string {
  const text = message?.trim() || WHATSAPP_MESSAGE;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const COMMUNITY_CLAIM_WHATSAPP_MESSAGE =
  "Hai admin Mikbalvia Digital, saya ingin klaim promo dari channel pengumuman Mind Aku.";

/** Manual bank transfer for subscription plans (not SumoPod). */
export const BCA_TRANSFER = {
  bank: "BCA",
  accountNumber: "6611281631",
  accountName: "Muhammad Ikbal",
} as const;

export type SubscriptionPackage = {
  id: string;
  label: string;
  durationLabel: string;
  amountIdr: number;
};

export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: "sub-2w",
    label: "2 minggu",
    durationLabel: "2 minggu",
    amountIdr: 800_000,
  },
  {
    id: "sub-1m",
    label: "1 bulan",
    durationLabel: "1 bulan",
    amountIdr: 1_500_000,
  },
];

export const SUBSCRIPTION_PLAN_META = {
  fiveHourLimitUsd: 200,
  dailyLimitUsd: 300,
  weeklyLimitUsd: 700,
  requestsPerMinute: 20,
} as const;

export function buildSubscriptionWhatsAppHref(pkg?: SubscriptionPackage): string {
  const parts = [
    "Hai admin Mikbalvia Digital, saya sudah transfer subscription Mind Aku.",
    pkg ? `Paket: ${pkg.label} (${formatIdrPlain(pkg.amountIdr)}).` : null,
    `Rekening tujuan: ${BCA_TRANSFER.bank} ${BCA_TRANSFER.accountNumber} a.n ${BCA_TRANSFER.accountName}.`,
    "Mohon aktivasi limit. Saya lampirkan bukti transfer.",
  ].filter(Boolean);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts.join(" "))}`;
}

function formatIdrPlain(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export const SESSION_KEY = "new-clients.apiKey";
/** Persisted API key when "Remember me" is checked (localStorage). */
export const REMEMBER_KEY = "new-clients.apiKey.remember";
/**
 * sessionStorage flag set on explicit logout so a remembered key is kept for
 * the login form but does not auto-restore the session in this tab.
 */
export const LOGGED_OUT_KEY = "new-clients.loggedOut";
/** sessionStorage key prefix for guest checkout claim secrets: `${prefix}${orderId}` */
export const GUEST_CLAIM_SECRET_PREFIX = "new-clients.guestClaim.";

/**
 * Fallback starter credit product when `/api/v1/shop/config` is unavailable.
 * Live home/beli values come from shop config (amount, USD credit, FX rate).
 */
export const STARTER_CREDIT = {
  amountIdr: 100_000,
  usdCredit: 100,
  idrPerUsd: 1_000,
  requestsPerMinute: 20,
} as const;
