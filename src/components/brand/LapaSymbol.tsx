import React from "react";
import { cn } from "@/lib/utils";

export interface LapaSymbolProps
  extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  /** Lado do símbolo em px (viewBox 64×64). */
  size?: number;
  /** Cor do corpo da sacola. Use "#FFFFFF" na versão negativa. */
  ink?: string;
  /** Cor do check. */
  check?: string;
  /** Cor da alça (sorriso). Por padrão acompanha `ink`. */
  handle?: string;
  strokeWidth?: number;
  title?: string;
}

/**
 * Símbolo do Lapa Marketplace: sacola + sorriso + check, monoline.
 */
export function LapaSymbol({
  size = 64,
  ink = "#0F172A",
  check = "#FDBA74",
  handle,
  strokeWidth = 3.5,
  title,
  className,
  ...props
}: LapaSymbolProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("block shrink-0 overflow-visible", className)}
      {...props}
    >
      <g transform="rotate(-6 32 33)">
        <path
          d="M30 52 L22 52 C16.5 52 12.7 47.55 13.56 42.12 L16.44 23.88 C17.3 18.45 22.5 14 28 14 L34 14 C39.5 14 44.7 18.45 45.56 23.88 L46.9 32"
          stroke={ink}
        />
        <path d="M25 22 C25.5 29.5 36.5 29.5 37 22" stroke={handle ?? ink} />
        <path
          d="M35 45.5 C37 46.5 39 48.5 40.5 50.5 C43.5 43 47.5 39 53 36.5"
          stroke={check}
        />
      </g>
    </svg>
  );
}

export interface LapaWordmarkProps {
  /** `full` mostra "Lapa Marketplace"; `short` só "Lapa" (navbar mobile). */
  variant?: "full" | "short";
  symbolSize?: number;
  /** Versão negativa, para fundos escuros. */
  inverted?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * Logotipo: símbolo + "Lapa" (Figtree 800) + "Marketplace" (Figtree 600, muted).
 */
export function LapaWordmark({
  variant = "full",
  symbolSize = 30,
  inverted = false,
  className,
  textClassName,
}: LapaWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LapaSymbol size={symbolSize} ink={inverted ? "#FFFFFF" : "#0F172A"} />
      <span
        className={cn(
          "font-display text-[22px] leading-none tracking-[-0.03em]",
          inverted ? "text-white" : "text-slate-900",
          textClassName
        )}
      >
        <span className="font-extrabold">Lapa</span>
        {variant === "full" && (
          <span
            className={cn(
              "font-semibold",
              inverted ? "text-slate-400" : "text-slate-500"
            )}
          >
            {" "}
            Marketplace
          </span>
        )}
      </span>
    </span>
  );
}

export interface VerifiedSealProps {
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Selo de loja verificada: círculo pêssego só com o check do símbolo.
 */
export function VerifiedSeal({
  size = 18,
  className,
  label = "Loja verificada",
}: VerifiedSealProps) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cn(
        "inline-grid place-items-center rounded-full bg-brand shrink-0",
        className
      )}
    >
      <svg
        viewBox="30 32 28 24"
        width={size * 0.61}
        height={size * 0.5}
        fill="none"
        stroke="#0F172A"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M35 45.5 C37 46.5 39 48.5 40.5 50.5 C43.5 43 47.5 39 53 36.5" />
      </svg>
    </span>
  );
}
