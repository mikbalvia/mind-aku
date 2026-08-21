import i18n from "i18next";
import { languageFromCountry, LANG_STORAGE_KEY } from "./languages";

const GEO_TIMEOUT_MS = 2000;

async function detectCountryCode(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
  try {
    const res = await fetch("https://ipapi.co/country_code/", {
      signal: controller.signal,
      headers: { Accept: "text/plain" },
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return /^[A-Za-z]{2}$/.test(text) ? text.toUpperCase() : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function hasStoredLanguage(): boolean {
  try {
    return Boolean(typeof localStorage !== "undefined" && localStorage.getItem(LANG_STORAGE_KEY));
  } catch {
    return false;
  }
}

/**
 * First-visit IP hint: only runs when the user has not saved a language.
 * Does not block first paint — applies via changeLanguage after geo resolves.
 */
export function applyIpLanguageHint(): void {
  if (typeof window === "undefined" || hasStoredLanguage()) return;

  void detectCountryCode().then((country) => {
    if (!country || hasStoredLanguage()) return;
    const lng = languageFromCountry(country);
    // Avoid thrashing if navigator already resolved to the same language.
    const current = (i18n.resolvedLanguage || i18n.language || "").split("-")[0];
    if (current === lng) return;
    void i18n.changeLanguage(lng).then(() => {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lng);
      } catch {
        // ignore
      }
    });
  });
}
