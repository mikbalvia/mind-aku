import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, useReducedMotion } from "motion/react";
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
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-3.5 last:border-b-0">
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "tabular-nums text-sm",
          emphasize ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
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
  return <Progress value={width} className={cn("h-2", className)} />;
}

export function SummaryCard({
  label,
  value,
  hint,
  trend,
  children,
  className = "",
  hoverLift = true,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  children?: ReactNode;
  className?: string;
  hoverLift?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      whileHover={hoverLift && !reduced ? { y: -2 } : undefined}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn("transition-shadow hover:shadow-md", className)}>
        <CardContent className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {value}
            </p>
            {trend ? (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.direction === "up" && "text-success",
                  trend.direction === "down" && "text-destructive",
                  trend.direction === "flat" && "text-muted-foreground"
                )}
              >
                {trend.value}
              </span>
            ) : null}
          </div>
          {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}