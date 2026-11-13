"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { CategoryItem } from "@/types/marketplace";

export const DEFAULT_MARKETPLACE_CATEGORIES: CategoryItem[] = [
  { id: "all", name: "Tudo", slug: "all", icon: "all" },
  { id: "moda", name: "Moda", slug: "moda", icon: "moda" },
  { id: "calcados", name: "Calçados", slug: "calcados", icon: "calcados" },
  { id: "eletronicos", name: "Celulares & Tech", slug: "eletronicos", icon: "eletronicos" },
  { id: "beleza", name: "Beleza", slug: "beleza", icon: "beleza" },
  { id: "acessorios", name: "Acessórios", slug: "acessorios", icon: "acessorios" },
  { id: "casa", name: "Casa", slug: "casa", icon: "casa" },
  { id: "infantil", name: "Infantil", slug: "infantil", icon: "infantil" },
  { id: "fitness", name: "Fitness", slug: "fitness", icon: "fitness" },
  { id: "presentes", name: "Presentes", slug: "presentes", icon: "presentes" },
];

export interface CategoryPillsProps {
  categories?: CategoryItem[];
  activeSlug?: string;
  onSelect?: (category: CategoryItem) => void;
  /** `md` = home (10×16, 14px); `sm` = vitrine da loja (9×14, 13px). */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Pílulas de categoria: seleção única, ativa em céu, inativa branca.
 */
export function CategoryPills({
  categories = DEFAULT_MARKETPLACE_CATEGORIES,
  activeSlug = "all",
  onSelect,
  size = "md",
  className,
}: CategoryPillsProps) {
  return (
    <nav
      aria-label="Categorias do marketplace"
      className={cn("w-full overflow-x-auto no-scrollbar", className)}
    >
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((cat) => {
          const isActive = cat.slug === activeSlug || cat.id === activeSlug;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect?.(cat)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border font-display font-semibold whitespace-nowrap transition-colors duration-150 ease-out cursor-pointer select-none touch-manipulation active:scale-[0.98]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light",
                size === "md"
                  ? "h-9 px-3.5 text-sm"
                  : "h-8.5 px-3.5 text-[13px]",
                isActive
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink hover:bg-slate-50"
              )}
            >
              <span>{cat.name}</span>
              {typeof cat.count === "number" && (
                <span
                  className={cn(
                    "px-1.5 rounded-full text-[10px] font-bold leading-4",
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
