export const INTERFACE_LANGUAGE_OPTIONS = [
  { code: "en", label: "English", short: "EN" },
  { code: "id", label: "Indonesia", short: "ID" },
] as const;

export type InterfaceLanguageCode =
  (typeof INTERFACE_LANGUAGE_OPTIONS)[number]["code"];

export const LANG_STORAGE_KEY = "new-clients.lang";

export function normalizeInterfaceLanguage(value?: string | null): InterfaceLanguageCode {
  if (typeof value !== "string" || !value) return "en";
  const normalized = value.trim().replaceAll("_", "-").toLowerCase();
  if (normalized === "id" || normalized.startsWith("id-")) return "id";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  return "en";
}

/** Map browser / IP-detected tags onto supported interface codes. */
export function convertDetectedLanguage(value: string): string {
  if (typeof value !== "string") return "en";
  return normalizeInterfaceLanguage(value);
}

/** Country code (ISO 3166-1 alpha-2) → interface language. */
export function languageFromCountry(country?: string | null): InterfaceLanguageCode {
  if (!country) return "en";
  return country.trim().toUpperCase() === "ID" ? "id" : "en";
}

/**
 * Convert interface language to a BCP-47 tag for `Intl.*` APIs.
 */
export function toIntlLocale(value?: string | null): string {
  const code = normalizeInterfaceLanguage(value);
  return code === "id" ? "id-ID" : "en-US";
}

export function syncDocumentLang(lng?: string | null): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = normalizeInterfaceLanguage(lng);
}
