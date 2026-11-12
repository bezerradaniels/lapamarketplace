import React from "react";
import { cn } from "@/lib/utils";

/**
 * Identidade v3 — sacola facetada em perspectiva, alças duplas, cores chapadas.
 * Desenho fixo (não alterar a forma). Paths de `bag-original.svg`, viewBox recortado.
 */
const BAG_VIEWBOX = "39 51 690 690";

const BAG_BODY =
  "M 617.511719 282.503906 L 660.601562 666.136719 L 307.546875 731.464844 L 207.46875 677.285156 L 107.390625 686.984375 L 185.230469 218.566406 L 231.097656 218.566406 L 279.746094 176.867188 Z";
const BAG_HANDLES = [
  "M 540.988281 249.144531 L 520.199219 242.453125 C 520.199219 242.453125 490.558594 93.46875 417.355469 94.859375 C 417.355469 94.859375 374.542969 93.46875 353.695312 190.765625 L 335.398438 185.941406 C 335.398438 185.941406 347.855469 99.027344 396.503906 79.570312 C 396.503906 79.570312 495.121094 36.480469 540.988281 249.144531 Z",
  "M 396.042969 109.222656 C 396.042969 109.222656 386.777344 119.878906 383.996094 123.585938 C 383.996094 123.585938 417.804688 181.992188 422.902344 213.5 L 447.472656 221.8125 C 447.472656 221.808594 429.402344 137.949219 396.042969 109.222656 Z",
  "M 367.78125 91.617188 C 367.78125 91.617188 358.511719 98.101562 353.417969 109.222656 C 353.417969 109.222656 290.402344 82.8125 277.894531 168.527344 L 251.484375 190.765625 C 251.484375 190.765625 259.363281 104.125 309.632812 86.519531 C 309.632812 86.519531 339.515625 74.011719 367.78125 91.617188 Z",
];
const BAG_SIDE =
  "M 279.746094 176.867188 L 307.546875 731.464844 L 207.46875 677.285156 L 107.390625 686.984375 L 185.230469 218.566406 L 231.097656 218.566406 Z";

export type LapaBagVariant = "solid" | "white" | "mono";

const BAG_PALETTES: Record<
  LapaBagVariant,
  { front: string; side: string; handle: string }
> = {
  solid: { front: "#264E9C", side: "#3B82F6", handle: "#1E3A8A" },
  white: { front: "#FFFFFF", side: "#BFDBFE", handle: "#FFFFFF" },
  mono: { front: "#0F172A", side: "#334155", handle: "#0F172A" },
};

export interface LapaBagProps
  extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  /** Lado do símbolo em px. */
  size?: number;
  /** `solid` (fundos claros), `white` (sobre azul/slate) ou `mono` (1 cor). */
  variant?: LapaBagVariant;
  title?: string;
}

/** Símbolo do Lapa Marketplace: sacola sólida em cores chapadas. */
export function LapaBag({
  size = 64,
  variant = "solid",
  title,
  className,
  ...props
}: LapaBagProps) {
  const pal = BAG_PALETTES[variant];
  return (
    <svg
      viewBox={BAG_VIEWBOX}
      width={size}
      height={size}
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("block shrink-0 overflow-visible", className)}
      {...props}
    >
      <path d={BAG_BODY} fill={pal.front} />
      {BAG_HANDLES.map((d) => (
        <path key={d.slice(0, 24)} d={d} fill={pal.handle} />
      ))}
      <path d={BAG_SIDE} fill={pal.side} />
    </svg>
  );
}

/**
 * Compatibilidade com a v1: `LapaSymbol` agora renderiza a sacola sólida.
 * `ink="#FFFFFF"` mapeia para a versão branca.
 */
export interface LapaSymbolProps extends LapaBagProps {
  ink?: string;
}

export function LapaSymbol({ ink, variant, ...props }: LapaSymbolProps) {
  const resolved: LapaBagVariant =
    variant ??
    (ink?.toUpperCase() === "#FFFFFF"
      ? "white"
      : ink?.toUpperCase() === "#0F172A"
        ? "mono"
        : "solid");
  return <LapaBag variant={resolved} {...props} />;
}

export interface LapaWordmarkProps {
  /** `full` mostra "Lapa Marketplace"; `short` só "Lapa" (assinatura de canto / navbar mobile). */
  variant?: "full" | "short";
  symbolSize?: number;
  /** Versão negativa: `true`/`"brand"` sobre #264E9C, `"slate"` sobre #0F172A. */
  inverted?: boolean | "brand" | "slate";
  className?: string;
  textClassName?: string;
}

/**
 * Logotipo horizontal: sacola + "Lapa" (Figtree 600, -0.025em) + "Marketplace" (Figtree 500, muted).
 */
export function LapaWordmark({
  variant = "full",
  symbolSize = 30,
  inverted = false,
  className,
  textClassName,
}: LapaWordmarkProps) {
  const negative = Boolean(inverted);
  const onSlate = inverted === "slate";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LapaBag size={symbolSize} variant={negative ? "white" : "solid"} />
      <span
        className={cn(
          "font-display text-[22px] leading-none",
          negative ? "text-white" : "text-slate-900",
          textClassName
        )}
      >
        <span className="font-semibold tracking-[-0.025em]">Lapa</span>
        {variant === "full" && (
          <span
            className={cn(
              "font-medium tracking-[-0.02em]",
              negative
                ? onSlate
                  ? "text-slate-400"
                  : "text-blue-200"
                : "text-slate-500"
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
 * Selo de loja verificada: círculo Azul Lapa com check branco.
 */
export function VerifiedSeal({
  size = 18,
  className,
  label = "Loja verificada em Lapa",
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
        viewBox="0 0 24 24"
        width={size * 0.62}
        height={size * 0.62}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

/**
 * Pílula "Loja verificada em Lapa": fundo #EFF6FF, texto Azul Lapa, selo à esquerda.
 */
export function VerifiedPill({
  label = "Loja verificada em Lapa",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-brand-soft py-1.5 pl-1.5 pr-3.5 font-display text-[13px] font-semibold text-brand",
        className
      )}
    >
      <VerifiedSeal size={20} label={label} />
      {label}
    </span>
  );
}
