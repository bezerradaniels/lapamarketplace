import React from "react";
import { cn } from "@/lib/utils";

/**
 * Símbolo do Lapa — sacola facetada em perspectiva, alças duplas.
 * Desenho fixo (não alterar a forma). Paths de `bag-original.svg`, viewBox recortado.
 * Tema Aura: variante `aurora` (frente azul com luz colorida difusa, alças azul-escuro).
 * Abaixo de 24px a aurora vira a sólida automaticamente.
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

export type LapaBagVariant = "aurora" | "solid" | "white" | "mono";

const BAG_PALETTES: Record<
  Exclude<LapaBagVariant, "aurora">,
  { front: string; side: string; handle: string }
> = {
  solid: { front: "#264E9C", side: "#3B82F6", handle: "#1E3A8A" },
  white: { front: "#FFFFFF", side: "#BFDBFE", handle: "#FFFFFF" },
  mono: { front: "#0F172A", side: "#334155", handle: "#0F172A" },
};

/** Círculos de luz difusa da variante aurora (recortados pela frente da sacola). */
const AURORA_LIGHTS = [
  { cx: 150, cy: 260, r: 180, fill: "#60A5FA" },
  { cx: 520, cy: 210, r: 150, fill: "#EF4444" },
  { cx: 630, cy: 560, r: 160, fill: "#F59E0B" },
  { cx: 230, cy: 700, r: 170, fill: "#10B981" },
  { cx: 400, cy: 460, r: 110, fill: "#264E9C" },
];

export interface LapaBagProps
  extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  /** Lado do símbolo em px. */
  size?: number;
  /**
   * `aurora` (padrão do tema Aura), `solid` (tamanhos pequenos),
   * `white` (sobre preto/deep night) ou `mono` (1 cor).
   */
  variant?: LapaBagVariant;
  title?: string;
}

/** Símbolo do Lapa Marketplace: sacola aurora (ou sólida/branca/mono). */
export function LapaBag({
  size = 64,
  variant = "aurora",
  title,
  className,
  ...props
}: LapaBagProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const resolved: LapaBagVariant =
    variant === "aurora" && size < 24 ? "solid" : variant;

  const svgProps = {
    viewBox: BAG_VIEWBOX,
    width: size,
    height: size,
    fill: "none",
    role: title ? "img" : undefined,
    "aria-label": title,
    "aria-hidden": title ? undefined : true,
    className: cn("block shrink-0 overflow-visible", className),
    ...props,
  } as React.SVGProps<SVGSVGElement>;

  if (resolved === "aurora") {
    const clipId = `lb-c-${uid}`;
    const blurId = `lb-f-${uid}`;
    return (
      <svg {...svgProps}>
        <defs>
          <clipPath id={clipId}>
            <path d={BAG_BODY} />
          </clipPath>
          <filter
            id={blurId}
            filterUnits="userSpaceOnUse"
            x="-200"
            y="-200"
            width="1168"
            height="1168"
          >
            <feGaussianBlur stdDeviation="80" />
          </filter>
        </defs>
        <path d={BAG_BODY} fill="#264E9C" />
        <g clipPath={`url(#${clipId})`}>
          <g filter={`url(#${blurId})`}>
            {AURORA_LIGHTS.map((c) => (
              <circle key={c.fill + c.cx} {...c} />
            ))}
          </g>
        </g>
        {BAG_HANDLES.map((d) => (
          <path key={d.slice(0, 24)} d={d} fill="#1E3A8A" />
        ))}
        <path d={BAG_SIDE} fill="#FFFFFF" fillOpacity={0.26} />
      </svg>
    );
  }

  const pal = BAG_PALETTES[resolved];
  return (
    <svg {...svgProps}>
      <path d={BAG_BODY} fill={pal.front} />
      {BAG_HANDLES.map((d) => (
        <path key={d.slice(0, 24)} d={d} fill={pal.handle} />
      ))}
      <path d={BAG_SIDE} fill={pal.side} />
    </svg>
  );
}

/**
 * Compatibilidade com a v1: `LapaSymbol` renderiza a sacola (aurora por padrão).
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
        : "aurora");
  return <LapaBag variant={resolved} {...props} />;
}

export interface LapaWordmarkProps {
  /** `full` mostra "Lapa Marketplace"; `short` só "Lapa" (assinatura de canto / navbar mobile). */
  variant?: "full" | "short";
  symbolSize?: number;
  symbolVariant?: LapaBagVariant;
  /** Versão negativa (sobre preto ou deep night). */
  inverted?: boolean | "brand" | "slate";
  className?: string;
  textClassName?: string;
}

/**
 * Logotipo horizontal: sacola aurora (ou sólida/branca/mono) + "Lapa" + "Marketplace".
 */
export function LapaWordmark({
  variant = "full",
  symbolSize = 30,
  symbolVariant = "aurora",
  inverted = false,
  className,
  textClassName,
}: LapaWordmarkProps) {
  const negative = Boolean(inverted);
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LapaBag size={symbolSize} variant={symbolVariant} />
      <span
        className={cn(
          "font-display text-[22px] leading-none whitespace-nowrap",
          negative ? "text-white" : "text-ink",
          textClassName
        )}
      >
        <span className="font-semibold tracking-[-0.025em]">Lapa</span>
        {variant === "full" && (
          <span
            className={cn(
              "font-medium tracking-[-0.02em]",
              negative ? "text-slate-300" : "text-muted"
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
 * Selo de loja verificada (Aura): círculo #0F172A com check âmbar #FDBA74.
 */
export function VerifiedSeal({
  size = 18,
  className,
  label = "Loja verificada",
}: VerifiedSealProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      role="img"
      aria-label={label}
      className={cn("inline-block shrink-0", className)}
    >
      <title>{label}</title>
      <circle cx="8" cy="8" r="8" fill="#0F172A" />
      <path
        d="M4.8 8.2l2.1 2.1 4.3-4.5"
        fill="none"
        stroke="#FDBA74"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Pílula "Loja verificada em Lapa": fundo pêssego, texto preto, selo à esquerda.
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
        "inline-flex items-center gap-2 rounded-full bg-brand-soft py-1.5 pl-1.5 pr-3.5 font-display text-[13px] font-semibold text-ink",
        className
      )}
    >
      <VerifiedSeal size={20} label={label} />
      {label}
    </span>
  );
}
