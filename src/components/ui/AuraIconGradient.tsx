import React from "react";

/** Id do degradê aurora para traços de ícones (lucide): `color={AURA_ICON_STROKE}`. */
export const AURA_ICON_GRADIENT_ID = "aura-icon-stroke";
export const AURA_ICON_STROKE = `url(#${AURA_ICON_GRADIENT_ID})`;

/**
 * Define (uma vez por tela) o degradê aurora usado nos traços de ícones ativos.
 * Mesmas cores do `aura-text`: laranja → rosa → céu, na diagonal do ícone 24×24.
 */
export function AuraIconGradient() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      className="absolute"
    >
      <defs>
        <linearGradient
          id={AURA_ICON_GRADIENT_ID}
          gradientUnits="userSpaceOnUse"
          x1="2"
          y1="2"
          x2="22"
          y2="22"
        >
          <stop offset="0" stopColor="#f97316" />
          <stop offset="0.55" stopColor="#ec4899" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
