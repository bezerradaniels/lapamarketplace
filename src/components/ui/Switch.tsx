"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "role"
  > {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** `md` = 46×28 (comprador), `sm` = 42×26 (tabelas dos painéis). */
  size?: "sm" | "md";
}

/**
 * Switch do sistema (Aura): ligado em preto #0F172A, desligado #CBD5E1, knob animado em 150ms ease-out.
 */
export function Switch({
  checked,
  onCheckedChange,
  size = "md",
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative shrink-0 rounded-full p-0.75 transition-colors duration-150 ease-out cursor-pointer touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2",
        "disabled:opacity-55 disabled:cursor-not-allowed",
        size === "md" ? "w-11.5 h-7" : "w-10.5 h-6.5",
        checked ? "bg-ink" : "bg-slate-300",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block rounded-full bg-white transition-transform duration-150 ease-out",
          size === "md" ? "w-5.5 h-5.5" : "w-5 h-5",
          checked
            ? size === "md"
              ? "translate-x-4.5"
              : "translate-x-4"
            : "translate-x-0"
        )}
      />
    </button>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface SegmentedProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  /** Cor do item ativo: branco (padrão) ou pêssego (plano Premium). */
  tone?: "white" | "brand";
  size?: "sm" | "md";
  className?: string;
}

/**
 * Segmented control: trilho #F1F5F9, item ativo branco com sombra suave.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  tone = "white",
  size = "md",
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className={cn(
        "grid bg-slate-100",
        size === "md" ? "p-1 rounded-2xl" : "p-0.75 rounded-xl",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              "font-display font-bold transition duration-150 ease-out cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light",
              size === "md"
                ? "h-10 px-3 rounded-[13px] text-[13px]"
                : "h-7.5 px-2.5 rounded-[9px] text-xs",
              isActive
                ? tone === "brand"
                  ? "bg-brand text-white"
                  : "bg-white text-slate-900 shadow-seg"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export interface PillOption<T extends string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface PillGroupProps<T extends string> {
  options: Array<PillOption<T>>;
  /** Valor único ou lista (multi). */
  value: T | T[] | null;
  onToggle: (value: T) => void;
  /** Cor do ativo: `ink` (filtros/seleção única) ou `brand` (pêssego). */
  tone?: "ink" | "brand";
  /** Fundo do inativo: branco (sobre #F8FAFC), `soft` #F1F5F9 (sobre card branco) ou `ring` (branco com contorno). */
  surface?: "white" | "soft" | "ring";
  ariaLabel?: string;
  className?: string;
}

/**
 * Pílulas de filtro/opção (raio 999, 13px/600).
 */
export function PillGroup<T extends string>({
  options,
  value,
  onToggle,
  surface = "white",
  ariaLabel,
  className,
}: PillGroupProps<T>) {
  const isOn = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((opt) => {
        const active = isOn(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            disabled={opt.disabled}
            onClick={() => onToggle(opt.value)}
            className={cn(
              "px-3.5 py-2.25 rounded-full text-[13px] font-semibold leading-tight transition-colors duration-150 ease-out cursor-pointer touch-manipulation",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
              active
                ? "bg-brand text-white"
                : surface === "ring"
                ? "bg-white text-slate-900 ring-line hover:bg-slate-50"
                : surface === "white"
                ? "bg-white text-slate-900 hover:bg-slate-100"
                : "bg-slate-100 text-slate-900 hover:bg-slate-200"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
