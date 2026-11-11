import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
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
    dark: "bg-slate-900 text-white border-slate-800",
    light: "bg-white text-slate-900 border-slate-100 shadow-sm",
    emerald: "bg-emerald-950 text-white border-emerald-900",
  }[variant];

  const isLight = variant === "light";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all",
        variantStyles,
        className
      )}
    >
      {/* Brilho decorativo sutil */}
      {!isLight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-2xl"
        />
      )}

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                isLight
                  ? "bg-slate-100 text-slate-800"
                  : "bg-white/10 text-white backdrop-blur-xs"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              {tag}
            </span>

            {discountBadge && (
              <Badge variant="discount">{discountBadge}</Badge>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
            {title}
          </h2>

          {subtitle && (
            <p
              className={cn(
                "text-sm sm:text-base leading-relaxed",
                isLight ? "text-slate-600" : "text-slate-300"
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
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
                  isLight
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-white text-slate-900 hover:bg-slate-100"
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
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer",
                  isLight
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-white text-slate-900 hover:bg-slate-100"
                )}
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {imageUrl && (
          <div className="shrink-0 w-full md:w-56 lg:w-64 aspect-[16/10] md:aspect-[4/3] rounded-2xl bg-slate-100/80 overflow-hidden relative">
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

