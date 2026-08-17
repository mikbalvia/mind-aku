import { useId } from "react";
import { COMPANY } from "../lib/company";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  title?: string;
};

/** Mind Aku mark — a crystal comet. Thought in motion, not a letter. */
export function BrandLogo({ className, title = COMPANY.name }: BrandLogoProps) {
  const uid = useId().replace(/:/g, "");
  const head = `${uid}-head`;
  const facet = `${uid}-facet`;
  const trail = `${uid}-trail`;
  const glow = `${uid}-glow`;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-9 shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <defs>
        <radialGradient id={glow} cx="50%" cy="42%" r="48%">
          <stop stopColor="#f97316" stopOpacity="0.38" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={head} x1="18" y1="8" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7ed" />
          <stop offset="0.4" stopColor="#fdba74" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id={facet} x1="28" y1="10" x2="38" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id={trail} x1="16" y1="22" x2="28" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" />
          <stop offset="1" stopColor="#9a3412" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="23" r="20" fill={`url(#${glow})`} />
      <g transform="translate(25.4 20.6) rotate(34)">
        <path d="M0 20.8 L2.05 24.4 L0 28.1 L-2.05 24.4Z" fill={`url(#${trail})`} opacity="0.55" />
        <path d="M0 11.4 L3.05 16.35 L0 21.4 L-3.05 16.35Z" fill="#f97316" opacity="0.88" />
        <path d="M0 -12.2 L5.15 1.6 L0 6.4Z" fill={`url(#${facet})`} />
        <path d="M0 -12.2 L-5.15 1.6 L0 6.4Z" fill={`url(#${head})`} />
        <circle cx="-1.05" cy="-5.4" r="1.2" fill="#fff7ed" fillOpacity="0.92" />
      </g>
    </svg>
  );
}

type BrandLockupProps = {
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
  markClassName?: string;
  nameClassName?: string;
};

export function BrandLockup({
  compact = false,
  showTagline = !compact,
  className,
  markClassName,
  nameClassName,
}: BrandLockupProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandLogo
        className={cn(
          "size-9 drop-shadow-[0_0_18px_rgba(249,115,22,0.42)]",
          markClassName
        )}
      />
      {compact ? null : (
        <div className="min-w-0">
          <p
            className={cn(
              "font-heading text-lg font-bold leading-none tracking-tight text-foreground",
              nameClassName
            )}
          >
            {COMPANY.name}
            <span className="text-gradient">.</span>
          </p>
          {showTagline ? (
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-primary">
              {COMPANY.tagline}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
