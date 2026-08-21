import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Eye, EyeSlash } from "@phosphor-icons/react";
import { maskApiKey } from "../lib/apiKeyDisplay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ApiKeySessionProps = {
  apiKey: string;
  memberName?: string | null;
  className?: string;
};

/**
 * Persistent sidebar session chip: masked key by default, reveal + copy.
 * Lives in the shell so the key is available on every page without repeating it.
 */
export function ApiKeySession({ apiKey, memberName, className }: ApiKeySessionProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(() => setRevealed(false), 20_000);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
    } catch {
      const input = document.createElement("textarea");
      input.value = apiKey;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      setCopied(true);
    }
  }

  const display = revealed ? apiKey : maskApiKey(apiKey);

  return (
    <div
      className={cn(
        "rise-in rise-in-delay-2 mt-5 space-y-3 border-t border-border pt-4",
        className
      )}
    >
      {memberName ? (
        <p className="truncate text-xs text-muted-foreground" title={memberName}>
          {t("Builder · {{name}}", { name: memberName })}
        </p>
      ) : null}

      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          API key
        </p>
        <p
          className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-foreground"
          title={revealed ? apiKey : t("Hidden — reveal to view full key")}
        >
          {display}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? <EyeSlash weight="bold" /> : <Eye weight="bold" />}
            {revealed ? t("Hide") : t("Reveal")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="text-primary"
            onClick={() => void onCopy()}
          >
            {copied ? <Check weight="bold" /> : <Copy weight="bold" />}
            {copied ? t("Copied") : t("Copy")}
          </Button>
        </div>
      </div>
    </div>
  );
}