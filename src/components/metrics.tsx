import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function MetricRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={[
          "tabular-nums",
          emphasize ? "font-medium text-foreground" : "text-muted-foreground",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

export function ProgressBar({
  percent,
  className,
}: {
  percent: number | null;
  className?: string;
}) {
  const width = percent == null ? 0 : Math.min(100, Math.max(0, percent));
  return <Progress value={width} className={cn("mt-2 h-2.5", className)} />;
}

export function SummaryCard({
  label,
  value,
  hint,
  children,
  className = "",
}: {
  label: string;
  value: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-sm ${className}`.trim()}>
      <CardContent className="p-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {value}
        </p>
        {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
        {children}
      </CardContent>
    </Card>
  );
}
