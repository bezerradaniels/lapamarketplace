"use client";

import React from "react";
import {
  LayoutGrid,
  Shirt,
  Footprints,
  Smartphone,
  Sparkles,
  Home,
  Watch,
  Baby,
  Dumbbell,
  Gift,
  Utensils,
  Wrench,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryItem } from "@/types/marketplace";

const ICON_MAP: Record<string, LucideIcon> = {
  all: LayoutGrid,
  moda: Shirt,
  roupas: Shirt,
  calcados: Footprints,
  eletronicos: Smartphone,
  celulares: Smartphone,
  beleza: Sparkles,
  cosmeticos: Sparkles,
  casa: Home,
  decoracao: Home,
  acessorios: Watch,
  infantil: Baby,
  fitness: Dumbbell,
  esportes: Dumbbell,
  presentes: Gift,
  gastronomia: Utensils,
  servicos: Wrench,
};

export const DEFAULT_MARKETPLACE_CATEGORIES: CategoryItem[] = [
  { id: "all", name: "Tudo em Lapa", slug: "all", icon: "all" },
  { id: "moda", name: "Moda & Roupas", slug: "moda", icon: "moda" },
  { id: "calcados", name: "Calçados", slug: "calcados", icon: "calcados" },
  { id: "eletronicos", name: "Celulares & Tech", slug: "eletronicos", icon: "eletronicos" },
  { id: "beleza", name: "Beleza & Perfumes", slug: "beleza", icon: "beleza" },
  { id: "acessorios", name: "Joias & Acessórios", slug: "acessorios", icon: "acessorios" },
  { id: "casa", name: "Casa & Enxoval", slug: "casa", icon: "casa" },
  { id: "infantil", name: "Moda Infantil", slug: "infantil", icon: "infantil" },
  { id: "fitness", name: "Moda Fitness", slug: "fitness", icon: "fitness" },
  { id: "presentes", name: "Presentes", slug: "presentes", icon: "presentes" },
];

export interface CategoryPillsProps {
  categories?: CategoryItem[];
  activeSlug?: string;
  onSelect?: (category: CategoryItem) => void;
  className?: string;
}

export function CategoryPills({
  categories = DEFAULT_MARKETPLACE_CATEGORIES,
  activeSlug = "all",
  onSelect,
  className,
}: CategoryPillsProps) {
  return (
    <nav
      aria-label="Categorias do marketplace"
      className={cn("w-full overflow-x-auto no-scrollbar py-1", className)}
    >
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((cat) => {
          const isActive = cat.slug === activeSlug || cat.id === activeSlug;
          const IconComponent =
            ICON_MAP[cat.icon || cat.slug] || ShoppingBag;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect?.(cat)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none touch-manipulation",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20",
                isActive
                  ? "bg-slate-900 text-white shadow-sm shadow-slate-900/15"
                  : "bg-white text-slate-700 border border-slate-100 hover:bg-slate-100/80 hover:text-slate-900"
              )}
            >
              <IconComponent
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-white" : "text-slate-500"
                )}
                aria-hidden="true"
              />
              <span>{cat.name}</span>
              {typeof cat.count === "number" && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
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

