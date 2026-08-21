import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="accent-line mb-4" />
        {eyebrow ? (
          <p className="rise-in mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="rise-in font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="rise-in rise-in-delay-1 mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="rise-in rise-in-delay-2 flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="scale-in py-16 text-center">
      <CardContent className="px-6">
        <p className="font-heading text-xl font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function LoadingBlock({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <Card className="fade-in py-16 text-center text-sm text-muted-foreground">
      <CardContent className="px-6">
        <span className="loading-dot" aria-hidden="true" />
        {label ?? t("Loading…")}
      </CardContent>
    </Card>
  );
}