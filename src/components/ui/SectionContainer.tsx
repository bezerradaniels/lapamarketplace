import React from "react";
import Link from "next/link";
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
    <section className={cn("w-full space-y-3", className)} {...props}>
      <div
        className={cn(
          "flex items-baseline justify-between gap-4",
          headerClassName
        )}
      >
        <div className="space-y-0.5">
          <h2 className="text-[19px] sm:text-xl font-extrabold text-slate-900 tracking-[-0.02em]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[13px] text-slate-500">{subtitle}</p>
          )}
        </div>

        {rightSlot ? (
          rightSlot
        ) : href ? (
          <Link
            href={href}
            className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors shrink-0"
          >
            {actionLabel}
          </Link>
        ) : onActionClick ? (
          <button
            type="button"
            onClick={onActionClick}
            className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div>{children}</div>
    </section>
  );
}

