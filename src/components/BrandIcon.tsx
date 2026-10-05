import { cn } from "@/lib/utils";
import {
  type BrandKey,
  brandKeyForModel,
  brandKeyForTool,
  brandKeyForToolId,
  brandNeedsLightPlate,
  brandSrc,
} from "@/lib/brands";

type BrandIconProps = {
  brand?: BrandKey;
  /** Tool / product label (e.g. "VS Code", "Claude Code"). */
  tool?: string;
  /** Setup tool id (e.g. "vscode", "claude", "opencode"). */
  toolId?: string;
  /** Model id (e.g. "claude-opus-5", "fable-5"). */
  model?: string;
  alt?: string;
  className?: string;
  /** Icon size classes; default size-5. */
  imgClassName?: string;
  /** Skip the rounded plate wrapper. */
  bare?: boolean;
};

export function BrandIcon({
  brand,
  tool,
  toolId,
  model,
  alt,
  className,
  imgClassName,
  bare = false,
}: BrandIconProps) {
  const key: BrandKey =
    brand ??
    (toolId ? brandKeyForToolId(toolId) : undefined) ??
    (tool ? brandKeyForTool(tool) : undefined) ??
    (model ? brandKeyForModel(model) : "default");
  const src = brandSrc(key);
  const label = alt ?? tool ?? toolId ?? model ?? key;
  const lightPlate = brandNeedsLightPlate(key);

  const img = (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={cn("size-5 object-contain", imgClassName)}
    />
  );

  if (bare) {
    return (
      <span className={cn("inline-flex shrink-0 items-center justify-center", className)} title={label}>
        {img}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/50",
        lightPlate ? "bg-white" : "bg-white/[0.06]",
        className
      )}
      title={label}
    >
      {img}
    </span>
  );
}
