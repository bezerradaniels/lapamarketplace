"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Heart,
  User,
  ShoppingBag,
  Store,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBagHydrated, useBagStore } from "@/store/useBagStore";

export const LAPA_NEIGHBORHOODS = [
  "Toda Bom Jesus da Lapa",
  "Centro",
  "São Gotardo",
  "Beira Rio",
  "Maravilha",
  "Primavera",
  "Cavalhada",
  "Amaralina",
  "Shangri-lá",
  "Lagoa Grande",
  "Nova Brasília",
  "João Paulo II",
];

export interface MarketplaceHeaderProps {
  selectedNeighborhood?: string;
  onNeighborhoodChange?: (neighborhood: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  bagCount?: number;
  favoritesCount?: number;
  onOpenBag?: () => void;
  onOpenFavorites?: () => void;
  className?: string;
}

export function MarketplaceHeader({
  selectedNeighborhood: controlledNeighborhood,
  onNeighborhoodChange,
  searchQuery: controlledQuery,
  onSearchChange,
  onSearchSubmit,
  bagCount = 0,
  favoritesCount = 0,
  onOpenBag,
  onOpenFavorites,
  className,
}: MarketplaceHeaderProps) {
  const [internalNeighborhood, setInternalNeighborhood] = useState(
    LAPA_NEIGHBORHOODS[0]
  );
  const [internalQuery, setInternalQuery] = useState("");

  const isMounted = useBagHydrated();
  const bagItems = useBagStore((s) => s.items);
  const storeBagTotalQty = bagItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const displayedBagCount = isMounted ? storeBagTotalQty : bagCount;

  const neighborhood = controlledNeighborhood ?? internalNeighborhood;
  const query = controlledQuery ?? internalQuery;

  const handleNeighborhoodSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setInternalNeighborhood(val);
    onNeighborhoodChange?.(val);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalQuery(val);
    onSearchChange?.(val);
  };

  const handleClearQuery = () => {
    setInternalQuery("");
    onSearchChange?.("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit?.(query);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Linha Principal */}
        <div className="flex items-center justify-between gap-3 h-16 sm:h-18">
          {/* Logo + Seletor Rápido de Bairro/Cidade */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="leading-none">
                <span className="block text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Lapa<span className="text-emerald-600">Shop</span>
                </span>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  Bom Jesus da Lapa
                </span>
              </div>
            </Link>

            {/* Seletor rápido de Bairro/Cidade */}
            <div className="relative hidden md:flex items-center">
              <MapPin
                className="w-4 h-4 text-emerald-600 absolute left-3 pointer-events-none"
                aria-hidden="true"
              />
              <select
                aria-label="Selecionar bairro em Bom Jesus da Lapa"
                value={neighborhood}
                onChange={handleNeighborhoodSelect}
                className={cn(
                  "appearance-none rounded-full bg-slate-100/80 hover:bg-slate-100 pl-8 pr-8 py-2 text-xs font-semibold text-slate-800 border border-transparent outline-none transition-all cursor-pointer",
                  "focus:border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                )}
              >
                {LAPA_NEIGHBORHOODS.map((nb) => (
                  <option key={nb} value={nb}>
                    {nb}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="w-3.5 h-3.5 text-slate-500 absolute right-3 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Barra de Pesquisa Global (Desktop) */}
          <form
            onSubmit={handleFormSubmit}
            role="search"
            className="hidden sm:flex flex-1 max-w-xl relative items-center"
          >
            <Search
              className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={handleQueryChange}
              placeholder="Buscar produtos, roupas, celulares ou lojas em Lapa..."
              aria-label="Pesquisar produtos ou lojas"
              className={cn(
                "w-full rounded-full bg-slate-100/90 hover:bg-slate-100 pl-10 pr-10 py-2.5 text-sm text-slate-900 border border-transparent outline-none transition-all",
                "placeholder:text-slate-400 focus:bg-white focus:border-slate-200 focus:ring-2 focus:ring-slate-900/10"
              )}
            />
            {query && (
              <button
                type="button"
                onClick={handleClearQuery}
                aria-label="Limpar pesquisa"
                className="absolute right-3 w-6 h-6 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </form>

          {/* Ações à Direita: Favoritos, Conta e Sacola com Badge Numérico */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenFavorites ? (
              <button
                type="button"
                onClick={onOpenFavorites}
                aria-label={`Favoritos (${favoritesCount})`}
                className="relative w-10 h-10 rounded-full bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
              >
                <Heart className="w-5 h-5" aria-hidden="true" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                    {favoritesCount > 99 ? "99+" : favoritesCount}
                  </span>
                )}
              </button>
            ) : (
              <Link
                href="/minha-conta?aba=favorites"
                aria-label={`Favoritos (${favoritesCount})`}
                className="relative w-10 h-10 rounded-full bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors touch-manipulation"
              >
                <Heart className="w-5 h-5" aria-hidden="true" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                    {favoritesCount > 99 ? "99+" : favoritesCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              href="/minha-conta"
              aria-label="Minha conta ou Painel do Lojista"
              className="w-10 h-10 sm:w-auto sm:px-3.5 rounded-full bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
            >
              <User className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">Minha Conta</span>
            </Link>

            {onOpenBag ? (
              <button
                type="button"
                onClick={onOpenBag}
                aria-label={`Sacola de compras (${displayedBagCount} itens)`}
                className="relative inline-flex items-center gap-2 h-10 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer touch-manipulation"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Sacola</span>
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold inline-flex items-center justify-center">
                  {displayedBagCount}
                </span>
              </button>
            ) : (
              <Link
                href="/sacola"
                aria-label={`Sacola de compras (${displayedBagCount} itens)`}
                className="relative inline-flex items-center gap-2 h-10 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors touch-manipulation"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Sacola</span>
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold inline-flex items-center justify-center">
                  {displayedBagCount}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Linha Mobile: Pesquisa + Seletor de Bairro */}
        <div className="flex sm:hidden flex-col gap-2 pb-3">
          <form
            onSubmit={handleFormSubmit}
            role="search"
            className="relative flex items-center w-full"
          >
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={handleQueryChange}
              placeholder="Buscar produtos ou lojas em Lapa..."
              aria-label="Pesquisar produtos ou lojas"
              className={cn(
                "w-full rounded-full bg-slate-100 pl-9 pr-9 py-2.5 text-sm text-slate-900 border border-transparent outline-none transition-all",
                "placeholder:text-slate-400 focus:border-slate-200 focus:bg-white"
              )}
            />
            {query && (
              <button
                type="button"
                onClick={handleClearQuery}
                aria-label="Limpar pesquisa"
                className="absolute right-3 w-6 h-6 rounded-full flex items-center justify-center text-slate-500"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </form>

          <div className="flex items-center justify-between md:hidden">
            <div className="relative inline-flex items-center">
              <MapPin
                className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 pointer-events-none"
                aria-hidden="true"
              />
              <select
                aria-label="Selecionar bairro em Bom Jesus da Lapa"
                value={neighborhood}
                onChange={handleNeighborhoodSelect}
                className="appearance-none rounded-full bg-slate-100/80 pl-7 pr-6 py-1 text-[11px] font-semibold text-slate-700 outline-none"
              >
                {LAPA_NEIGHBORHOODS.map((nb) => (
                  <option key={nb} value={nb}>
                    {nb}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none"
                aria-hidden="true"
              />
            </div>

            <span className="text-[11px] text-slate-400 font-medium">
              Entrega rápida & Retirada na loja
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

