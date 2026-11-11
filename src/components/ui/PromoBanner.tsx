import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LapaSymbol } from "@/components/brand/LapaSymbol";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

export interface PromoBannerProps {
  tag?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  discountBadge?: string;
  imageUrl?: string;
  imageAlt?: string;
  variant?: "dark" | "light" | "emerald";
  className?: string;
}

export function PromoBanner({
  tag = "Destaque em Bom Jesus da Lapa",
  title,
  subtitle,
  ctaLabel = "Explorar ofertas",
  ctaHref,
  onCtaClick,
  discountBadge,
  imageUrl,
  imageAlt,
  variant = "dark",
  className,
}: PromoBannerProps) {
  const variantStyles = {
    dark: "bg-slate-900 text-white",
    light: "bg-white text-slate-900",
    emerald: "bg-brand-soft text-slate-900",
  }[variant];

  const isLight = variant !== "dark";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] p-5 sm:p-8",
        variantStyles,
        className
      )}
    >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em]",
                variant === "dark"
                  ? "text-brand"
                  : variant === "emerald"
                  ? "text-brand-ink"
                  : "text-slate-500"
              )}
            >
              <LapaSymbol size={18} ink={variant === "dark" ? "#FFFFFF" : "#0F172A"} />
              {tag}
            </span>

            {discountBadge && (
              <Badge variant="discount">{discountBadge}</Badge>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl md:text-[30px] font-extrabold tracking-[-0.03em] leading-[1.1] text-balance">
            {title}
          </h2>

          {subtitle && (
            <p
              className={cn(
                "text-sm sm:text-base leading-relaxed",
                isLight ? "text-slate-700" : "text-slate-300"
              )}
            >
              {subtitle}
            </p>
          )}

          <div className="pt-2">
            {ctaHref ? (
              <Link
                href={ctaHref}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[15px] h-11.5 px-4.5 font-display text-sm font-bold transition duration-150 active:scale-[0.98]",
                  isLight
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-brand text-slate-900 hover:bg-brand-strong"
                )}
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onCtaClick}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[15px] h-11.5 px-4.5 font-display text-sm font-bold transition duration-150 active:scale-[0.98] cursor-pointer",
                  isLight
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-brand text-slate-900 hover:bg-brand-strong"
                )}
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {imageUrl && (
          <div className="shrink-0 w-full md:w-56 lg:w-64 aspect-16/10 md:aspect-4/3 rounded-[18px] bg-slate-100 overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={imageAlt || title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}

