import {
  ArrowSquareOut,
  ChatsCircle,
  Globe,
  PlayCircle,
  SignIn,
  UserPlus,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "../components/page-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CHAT_URL = "https://chat.mindaku.com/";
const VIDEO_VIEW_URL =
  "https://drive.google.com/file/d/1QwN5EiQ10tHELxg_xgT9ZPAZPYJ0jVtE/view?usp=sharing";
const VIDEO_EMBED_URL =
  "https://drive.google.com/file/d/1QwN5EiQ10tHELxg_xgT9ZPAZPYJ0jVtE/preview";

type Step = {
  id: string;
  icon: typeof Globe;
  titleKey: string;
  bodyKey: string;
  bullets?: string[];
  action?: { href: string; labelKey: string };
};

const STEPS: Step[] = [
  {
    id: "visit",
    icon: Globe,
    titleKey: "Open chat.mindaku.com",
    bodyKey:
      "Mind Aku Web Chat is a full chat interface in your browser — similar to ChatGPT, powered by your Mind Aku account.",
    action: { href: CHAT_URL, labelKey: "Open Web Chat" },
  },
  {
    id: "register",
    icon: UserPlus,
    titleKey: "Create an account",
    bodyKey: "If you do not have an account yet, register first:",
    bullets: [
      "Click Sign up on the login page.",
      "Enter your email and choose a secure password.",
      "Complete registration and verify your email if prompted.",
    ],
  },
  {
    id: "login",
    icon: SignIn,
    titleKey: "Sign in",
    bodyKey: "After registration — or if you already have an account:",
    bullets: [
      "Go back to chat.mindaku.com.",
      "Enter your email and password, then click Sign in.",
      "You will land on the main chat screen and can start a new conversation.",
    ],
    action: { href: CHAT_URL, labelKey: "Go to login" },
  },
  {
    id: "tutorial",
    icon: PlayCircle,
    titleKey: "Follow the video tutorial",
    bodyKey:
      "Watch the step-by-step video below for a visual walkthrough — from first visit to sending your first message.",
    action: { href: VIDEO_VIEW_URL, labelKey: "Open video in new tab" },
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
        <div
          className={cn(
            "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary shadow-[inset_0_0_0_1px_rgba(249,115,22,0.15)]"
          )}
        >
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
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
              {t("Step {{n}}", { n: index + 1 })}
            </Badge>
          </div>
          <div>
            <h3 className="font-heading text-lg font-medium text-foreground">{t(step.titleKey)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(step.bodyKey)}</p>
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
          {step.action ? (
            <Button variant="outline" size="sm" asChild className="mt-1">
              <a href={step.action.href} target="_blank" rel="noopener noreferrer">
                {t(step.action.labelKey)}
                <ArrowSquareOut weight="bold" className="size-3.5" />
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function ChatGuidePage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={t("Guide")}
        title={t("Web Chat")}
        description={t(
          "Use Mind Aku chat in your browser — register, sign in, and start chatting. Follow the steps below, then watch the video tutorial."
        )}
        actions={
          <Button asChild>
            <a href={CHAT_URL} target="_blank" rel="noopener noreferrer">
              <ChatsCircle weight="duotone" className="size-4" />
              {t("Open chat.mindaku.com")}
              <ArrowSquareOut weight="bold" className="size-3.5" />
            </a>
          </Button>
        }
      />

      <Card className="mb-8 scale-in border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card/60 to-transparent">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t("Quick start")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Visit → Register → Login → Watch the tutorial video")}
            </p>
          </div>
          <p className="font-mono text-xs text-primary/90">chat.mindaku.com</p>
        </CardContent>
      </Card>

      <div className="mb-10">
        {STEPS.map((step, index) => (
          <StepCard key={step.id} step={step} index={index} total={STEPS.length} />
        ))}
      </div>

      <section className="scale-in scale-in-delay-2">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              {t("Video tutorial")}
            </p>
            <h3 className="mt-1 font-heading text-xl font-medium text-foreground">
              {t("Full walkthrough")}
            </h3>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {t("Follow along with the recording below. You can also open it in Google Drive for fullscreen.")}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <a href={VIDEO_VIEW_URL} target="_blank" rel="noopener noreferrer">
              {t("Open in Google Drive")}
              <ArrowSquareOut weight="bold" className="size-3.5" />
            </a>
          </Button>
        </div>

        <Card className="overflow-hidden border-border/80 p-0">
          <div className="relative aspect-video w-full bg-black/40">
            <iframe
              title={t("Mind Aku Web Chat tutorial")}
              src={VIDEO_EMBED_URL}
              className="absolute inset-0 size-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
