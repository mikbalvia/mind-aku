export const OMNIROUTE_BASE_URL =
  (import.meta.env.VITE_OMNIROUTE_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:20128";

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

export const SESSION_KEY = "new-clients.apiKey";
