import { useTranslation } from "react-i18next";
import {
  INTERFACE_LANGUAGE_OPTIONS,
  normalizeInterfaceLanguage,
  type InterfaceLanguageCode,
} from "@/i18n/languages";
import { persistLanguage } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type LanguageSwitcherProps = {
  className?: string;
  size?: "sm" | "default";
};

export function LanguageSwitcher({ className, size = "sm" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = normalizeInterfaceLanguage(i18n.resolvedLanguage || i18n.language);

  function setLang(code: InterfaceLanguageCode) {
    persistLanguage(code);
    void i18n.changeLanguage(code);
  }

  return (
    <div
      className={cn("inline-flex items-center gap-0.5 rounded-lg border border-border/60 p-0.5", className)}
      role="group"
      aria-label={t("Language")}
    >
      {INTERFACE_LANGUAGE_OPTIONS.map((opt) => {
        const active = current === opt.code;
        return (
          <Button
            key={opt.code}
            type="button"
            size={size}
            variant={active ? "secondary" : "ghost"}
            aria-pressed={active}
            aria-label={opt.label}
            className={cn(
              "h-7 min-w-9 px-2 text-[11px] font-bold tracking-wide",
              active ? "text-foreground" : "text-muted-foreground"
            )}
            onClick={() => setLang(opt.code)}
          >
            {opt.short}
          </Button>
        );
      })}
    </div>
  );
}
