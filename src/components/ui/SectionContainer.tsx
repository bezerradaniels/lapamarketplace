import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionContainerProps
  extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  href?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  rightSlot?: React.ReactNode;
  headerClassName?: string;
}

export function SectionContainer({
  title,
  subtitle,
  href,
  actionLabel = "Ver tudo",
  onActionClick,
  rightSlot,
  className,
  headerClassName,
  children,
  ...props
}: SectionContainerProps) {
  return (
    <section className={cn("w-full space-y-4", className)} {...props}>
      <div
        className={cn(
          "flex items-end justify-between gap-4",
          headerClassName
        )}
      >
        <div className="space-y-0.5">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        {rightSlot ? (
          rightSlot
        ) : href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors shrink-0 py-1 px-2.5 rounded-full hover:bg-slate-100"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        ) : onActionClick ? (
          <button
            type="button"
            onClick={onActionClick}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors shrink-0 py-1 px-2.5 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div>{children}</div>
    </section>
  );
}

