import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import {
  convertDetectedLanguage,
  LANG_STORAGE_KEY,
  syncDocumentLang,
} from "./languages";
import { applyIpLanguageHint } from "./ipDetector";
import en from "./locales/en.json";
import id from "./locales/id.json";

export const resources = {
  en: { translation: en },
  id: { translation: id },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "id"],
    load: "currentOnly",
    nsSeparator: false,
    keySeparator: false,
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // IP hint runs after init via applyIpLanguageHint (async, non-blocking).
      // Do not auto-cache navigator — only persist explicit/IP choices.
      order: ["localStorage", "navigator"],
      caches: [],
      lookupLocalStorage: LANG_STORAGE_KEY,
      convertDetectedLanguage,
    },
  })
  .then(() => {
    syncDocumentLang(i18n.resolvedLanguage || i18n.language);
    applyIpLanguageHint();
  });

i18n.on("languageChanged", syncDocumentLang);

export function persistLanguage(code: string): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

export default i18n;
