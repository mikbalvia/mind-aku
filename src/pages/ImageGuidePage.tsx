import {
  ArrowRight,
  BookOpenText,
  Code,
  Image as ImageIcon,
  Lightning,
  WarningCircle,
  Wrench,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "../components/page-chrome";
import { AI_BASE_URL } from "../config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  icon: typeof BookOpenText;
  titleKey: string;
  bodyKey: string;
  bullets?: string[];
};

const STEPS: Step[] = [
  {
    id: "model",
    icon: ImageIcon,
    titleKey: "Confirm gpt-image-2 is available",
    bodyKey:
      "Your API key must include the image model (usually gpt-image-2). If Models does not list it, ask admin to attach the image channel to your group.",
    bullets: [
      "Image models are separate from chat models.",
      "Wrong group/channel → “model not found” or empty model list.",
    ],
  },
  {
    id: "endpoint",
    icon: Lightning,
    titleKey: "Use the Images API, not Chat",
    bodyKey:
      "Text-to-image uses POST /v1/images/generations. Image edit uses POST /v1/images/edits. Do not call /v1/chat/completions for gpt-image-2.",
    bullets: [
      "Chat mode ignores size, quality, and output_format for image drawing.",
      "Prefer the Image page in this portal for interactive generation.",
    ],
  },
  {
    id: "params",
    icon: Wrench,
    titleKey: "Set parameters like the docs",
    bodyKey: "Match these fields when you call the API or use the Image page:",
    bullets: [
      "model — start with gpt-image-2",
      "prompt — subject, scene, style, and any text in the image",
      "size — auto, 1024x1024, 1536x1024, 1024x1536, or 3840x2160",
      "quality — low, medium, high, or auto (draft with low, final with high)",
      "response_format — url (recommended) or b64_json",
      "output_format — png or jpeg",
      "n — keep 1; loop if you need multiple images",
    ],
  },
  {
    id: "edit",
    icon: Code,
    titleKey: "Edit with multipart upload",
    bodyKey:
      "POST /v1/images/edits with multipart/form-data. Field image is the source file; prompt describes what to keep and change. Do not set Content-Type manually — the client must send the boundary.",
  },
  {
    id: "timeout",
    icon: WarningCircle,
    titleKey: "Allow a long timeout",
    bodyKey:
      "Image generation often takes longer than chat. If the request dies around 60 seconds, check browser/proxy timeouts. Raise client timeout to at least 2 minutes for high resolution.",
    bullets: [
      "Do not spam retries after a timeout — the upstream job may still be running and billing.",
      "Temporary URLs should be downloaded immediately.",
    ],
  },
];

function StepCard({
  step,
  index,
  total,
}: {
  step: Step;
  index: number;
  total: number;
}) {
  const { t } = useTranslation();
  const Icon = step.icon;
  const isLast = index === total - 1;

  return (
    <div className="relative flex gap-4 md:gap-6">
      <div className="flex flex-col items-center">
        <div className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary shadow-[inset_0_0_0_1px_rgba(249,115,22,0.15)]">
          <Icon weight="duotone" className="size-5" />
        </div>
        {!isLast ? (
          <div
            aria-hidden
            className="mt-2 w-px flex-1 bg-gradient-to-b from-primary/40 via-border to-transparent"
          />
        ) : null}
      </div>

      <Card className="mb-6 flex-1 scale-in border-border/80 bg-card/80">
        <CardContent className="space-y-4 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="font-mono text-[10px] uppercase tracking-wider"
            >
              {t("Step {{n}}", { n: index + 1 })}
            </Badge>
          </div>
          <div>
            <h3 className="font-heading text-lg font-medium text-foreground">
              {t(step.titleKey)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(step.bodyKey)}
            </p>
          </div>
          {step.bullets?.length ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {step.bullets.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70"
                  />
                  <span className="leading-relaxed">{t(item)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function ImageGuidePage() {
  const { t } = useTranslation();
  const v1Url = AI_BASE_URL.replace(/\/$/, "");
  const generationsUrl = `${v1Url}/images/generations`;

  const curlExample = [
    `curl ${JSON.stringify(generationsUrl)} \\`,
    `  -H "Authorization: Bearer YOUR_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{`,
    `    "model": "gpt-image-2",`,
    `    "prompt": "An orange tabby cat wearing an orange scarf, warm illustration style",`,
    `    "size": "1024x1024",`,
    `    "quality": "high",`,
    `    "response_format": "url",`,
    `    "output_format": "png",`,
    `    "n": 1`,
    `  }'`,
  ].join("\n");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={t("Guide")}
        title={t("Image Guide")}
        description={t(
          "How to generate and edit images through Mind Aku using the OpenAI Images API fields."
        )}
        actions={
          <Button asChild>
            <Link to="/images">
              <ImageIcon weight="duotone" className="size-4" />
              {t("Open Image studio")}
              <ArrowRight weight="bold" className="size-3.5" />
            </Link>
          </Button>
        }
      />

      <Card className="mb-8 scale-in border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card/60 to-transparent">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t("Quick start")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Model ready → Images API → set params → generate or edit")}
            </p>
          </div>
          <p className="break-all font-mono text-xs text-primary/90">{v1Url}</p>
        </CardContent>
      </Card>

      <div className="mb-10">
        {STEPS.map((step, index) => (
          <StepCard key={step.id} step={step} index={index} total={STEPS.length} />
        ))}
      </div>

      <section className={cn("scale-in scale-in-delay-2 space-y-4")}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            {t("Example")}
          </p>
          <h3 className="mt-1 font-heading text-xl font-medium text-foreground">
            {t("cURL text-to-image")}
          </h3>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            {t(
              "Replace YOUR_API_KEY with the key from this portal login. Endpoint uses your Mind Aku base URL."
            )}
          </p>
        </div>
        <Card className="border-border/80">
          <CardContent className="p-0">
            <pre className="overflow-x-auto p-4 text-xs leading-5 text-foreground">
              <code>{curlExample}</code>
            </pre>
          </CardContent>
        </Card>
        <Button variant="outline" asChild>
          <Link to="/images">{t("Try it in the Image studio")}</Link>
        </Button>
      </section>
    </div>
  );
}
