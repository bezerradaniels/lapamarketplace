"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Heart,
  User,
  ShoppingBag,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBagHydrated, useBagStore } from "@/store/useBagStore";
import { LapaWordmark } from "@/components/brand/LapaSymbol";

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
  /**
   * `full` (padrão): no mobile mostra marca, bairro, favoritos e busca.
   * `hidden`: a tela tem cabeçalho mobile próprio; o header só aparece do `md` em diante.
   */
  mobileVariant?: "full" | "hidden";
  searchPlaceholder?: string;
  className?: string;
}

const iconButtonClasses =
  "relative w-10.5 h-10.5 rounded-[14px] grid place-items-center text-slate-900 transition-colors duration-150 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900";

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
  mobileVariant = "full",
  searchPlaceholder = "Buscar em lojas da Lapa",
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
  const neighborhoodLabel =
    neighborhood === LAPA_NEIGHBORHOODS[0] ? "Toda Lapa" : neighborhood;

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

  /** Chip de bairro: ponto pêssego + nome, com <select> nativo por cima. */
  const neighborhoodChip = (surface: "white" | "soft") => (
    <label
      className={cn(
        "relative h-10.5 pl-3 pr-2.5 rounded-[14px] inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-900 cursor-pointer transition-colors duration-150 focus-within:ring-2 focus-within:ring-slate-900",
        surface === "white" ? "bg-white" : "bg-slate-100 hover:bg-slate-200"
      )}
    >
      <span className="w-1.75 h-1.75 rounded-full bg-brand" aria-hidden="true" />
      <span className="max-w-28 truncate">{neighborhoodLabel}</span>
      <ChevronDown
        className="w-3.5 h-3.5 text-slate-500"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <select
        aria-label="Selecionar bairro em Bom Jesus da Lapa"
        value={neighborhood}
        onChange={handleNeighborhoodSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {LAPA_NEIGHBORHOODS.map((nb) => (
          <option key={nb} value={nb}>
            {nb}
          </option>
        ))}
      </select>
    </label>
  );

  const favoritesDot = favoritesCount > 0 && (
    <span
      className="absolute top-2.5 right-2.75 w-2 h-2 rounded-full bg-offer ring-2 ring-white"
      aria-hidden="true"
    />
  );

  const favoritesButton = (surface: "white" | "soft") => {
    const classes = cn(
      iconButtonClasses,
      surface === "white" ? "bg-white" : "bg-slate-100 hover:bg-slate-200"
    );
    const label =
      favoritesCount > 0 ? `Favoritos (${favoritesCount})` : "Favoritos";
    const icon = (
      <>
        <Heart className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
        {favoritesDot}
      </>
    );

    return onOpenFavorites ? (
      <button
        type="button"
        onClick={onOpenFavorites}
        aria-label={label}
        className={classes}
      >
        {icon}
      </button>
    ) : (
      <Link
        href="/minha-conta?aba=favorites"
        aria-label={label}
        className={classes}
      >
        {icon}
      </Link>
    );
  };

  const searchForm = (size: "mobile" | "desktop") => (
    <form
      onSubmit={handleFormSubmit}
      role="search"
      className={cn(
        "relative flex items-center",
        size === "desktop" ? "hidden md:flex flex-1 max-w-xl" : "w-full"
      )}
    >
      <Search
        className="w-4.5 h-4.5 text-slate-500 absolute left-4 pointer-events-none"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={handleQueryChange}
        placeholder={searchPlaceholder}
        aria-label="Pesquisar produtos ou lojas"
        className={cn(
          "w-full rounded-2xl bg-slate-100 pl-11 pr-11 text-sm text-slate-900 outline-none transition-[background-color,box-shadow] duration-150",
          "placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-900 [&::-webkit-search-cancel-button]:hidden",
          size === "desktop" ? "h-11.5" : "h-12"
        )}
      />
      {query && (
        <button
          type="button"
          onClick={handleClearQuery}
          aria-label="Limpar pesquisa"
          className="absolute right-3 w-7 h-7 rounded-lg hover:bg-slate-200 grid place-items-center text-slate-500 cursor-pointer"
        >
          <X className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
        </button>
      )}
    </form>
  );

  const bagClasses =
    "relative inline-flex items-center gap-2 h-10.5 pl-3.5 pr-2.5 rounded-[14px] bg-slate-900 hover:bg-slate-800 text-white font-display text-sm font-bold transition duration-150 active:scale-[0.98] cursor-pointer touch-manipulation";
  const bagContent = (
    <>
      <ShoppingBag className="w-4.5 h-4.5" strokeWidth={1.8} aria-hidden="true" />
      <span>Sacola</span>
      <span className="min-w-5 h-5 px-1.5 rounded-full bg-brand text-slate-900 text-[11px] font-bold inline-grid place-items-center">
        {displayedBagCount}
      </span>
    </>
  );

  return (
    <>
      {/* Desktop: barra fixa branca */}
      <header
        className={cn(
          "hidden md:block sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md",
          className
        )}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-18 flex items-center justify-between gap-5">
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/"
              aria-label="Lapa Marketplace — início"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-lg"
            >
              <LapaWordmark symbolSize={30} />
            </Link>
            {neighborhoodChip("soft")}
          </div>

          {searchForm("desktop")}

          <div className="flex items-center gap-2 shrink-0">
            {favoritesButton("soft")}
            <Link
              href="/minha-conta"
              aria-label="Minha conta ou painel do lojista"
              className="h-10.5 px-3.5 rounded-[14px] bg-slate-100 hover:bg-slate-200 text-slate-900 inline-flex items-center gap-2 font-display text-sm font-bold transition-colors duration-150"
            >
              <User className="w-4.5 h-4.5" strokeWidth={1.8} aria-hidden="true" />
              <span className="hidden lg:inline">Conta</span>
            </Link>
            {onOpenBag ? (
              <button
                type="button"
                onClick={onOpenBag}
                aria-label={`Sacola de compras (${displayedBagCount} itens)`}
                className={bagClasses}
              >
                {bagContent}
              </button>
            ) : (
              <Link
                href="/sacola"
                aria-label={`Sacola de compras (${displayedBagCount} itens)`}
                className={bagClasses}
              >
                {bagContent}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile: marca + bairro + favoritos, busca logo abaixo */}
      {mobileVariant === "full" && (
        <header className="md:hidden w-full">
          <div className="flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3.5">
            <Link href="/" aria-label="Lapa Marketplace — início">
              <LapaWordmark variant="short" symbolSize={30} />
            </Link>
            <div className="flex items-center gap-2">
              {neighborhoodChip("white")}
              {favoritesButton("white")}
            </div>
          </div>
          <div className="px-5 pb-4">{searchForm("mobile")}</div>
        </header>
      )}
    </>
  );
}
