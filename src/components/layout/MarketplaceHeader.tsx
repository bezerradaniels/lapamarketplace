"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  MapPin,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { cn, formatCurrencyBRL } from "@/lib/utils";
import { useBagHydrated, useBagStore } from "@/store/useBagStore";
import { useViewer } from "@/lib/use-viewer";
import { LapaBag } from "@/components/brand/LapaSymbol";

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
  /** Bairros do menu (o primeiro é "toda a cidade"). Padrão: `LAPA_NEIGHBORHOODS`. */
  neighborhoods?: string[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  /** @deprecated A sacola lê o `useBagStore`. Mantido por compatibilidade. */
  bagCount?: number;
  favoritesCount?: number;
  onOpenBag?: () => void;
  onOpenFavorites?: () => void;
  /**
   * `full` (padrão): no mobile mostra logo, bairro, favoritos e busca.
   * `hidden`: a tela tem cabeçalho mobile próprio; o header só aparece do `md` em diante.
   */
  mobileVariant?: "full" | "hidden";
  searchPlaceholder?: string;
  className?: string;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light";

/**
 * Estado compacto do header desktop com histerese: compacta acima de `enter` e só
 * volta ao normal abaixo de `exit`. A diferença (maior que os 12px que o header
 * encolhe) evita o liga/desliga em volta do limite.
 */
function useScrolled(enter = 80, exit = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > exit : y > enter));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enter, exit]);
  return scrolled;
}

/* ---------- Bairro ---------- */

function NeighborhoodMenu({
  value,
  options,
  onChange,
  compact,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const label = value === options[0] ? "Toda Lapa" : value;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    listRef.current?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[active]);
    }
  };

  return (
    <div ref={rootRef} className="relative flex-none">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Bairro: ${label}. Trocar bairro`}
        onClick={() => {
          setActive(Math.max(0, options.indexOf(value)));
          setOpen((o) => !o);
        }}
        className={cn(
          "flex cursor-pointer items-center rounded-full bg-media text-left transition-colors hover:bg-line",
          focusRing,
          compact
            ? "h-10 gap-1.5 pl-2.5 pr-3 font-display text-sm font-semibold text-ink"
            : "h-12 gap-2.5 pl-3 pr-3.5"
        )}
      >
        {compact ? (
          <MapPin className="size-3.75 text-ink" strokeWidth={2} aria-hidden="true" />
        ) : (
          <span className="grid size-7 flex-none place-items-center rounded-full bg-white">
            <MapPin className="size-3.75 text-ink" strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        {compact ? (
          <span className="max-w-26 truncate">{label}</span>
        ) : (
          <span className="flex flex-col leading-[1.15]">
            <span className="text-[11px] font-medium text-muted">Entregar em</span>
            <span className="max-w-36 truncate font-display text-sm font-semibold text-ink">
              {label}
            </span>
          </span>
        )}
        <ChevronDown
          className={cn("text-muted", compact ? "size-3.25" : "size-3.5")}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className={cn(
            "z-50 rounded-3xl border border-media bg-white p-3 shadow-menu",
            compact
              ? "fixed inset-x-2 bottom-2 max-h-[70vh] overflow-y-auto md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+10px)] md:w-85"
              : "absolute left-0 top-[calc(100%+10px)] w-85"
          )}
        >
          <p className="px-3 pb-1 pt-2 font-display text-[15px] font-semibold text-ink">
            Onde você está?
          </p>
          <p className="px-3 pb-2 text-[13px] leading-normal text-muted">
            Mostramos primeiro as lojas do seu bairro.
          </p>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label="Escolha o bairro"
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onKeyDown}
            className="flex max-h-80 flex-col gap-1 overflow-y-auto outline-none"
          >
            {options.map((opt, i) => {
              const sel = opt === value;
              return (
                <li
                  key={opt}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={sel}
                  onClick={() => choose(opt)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex h-11 flex-none cursor-pointer items-center rounded-[14px] px-3 text-[15px]",
                    sel ? "bg-brand-soft font-semibold text-brand-deep" : "text-ink",
                    !sel && i === active && "bg-media"
                  )}
                >
                  {i === 0 ? "Toda Bom Jesus da Lapa" : opt}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Header ---------- */

/**
 * Header v2 (tema Aura). Desktop: uma linha (logo, bairro, busca com halo, favoritos,
 * conta, sacola), com estado compacto após 80px de rolagem. Mobile: logo + bairro +
 * favoritos, e a busca fica fixa; a linha do logo some ao rolar para baixo.
 */
export function MarketplaceHeader({
  selectedNeighborhood: controlledNeighborhood,
  onNeighborhoodChange,
  neighborhoods = LAPA_NEIGHBORHOODS,
  searchQuery: controlledQuery,
  onSearchChange,
  onSearchSubmit,
  bagCount = 0,
  favoritesCount = 0,
  onOpenBag,
  onOpenFavorites,
  mobileVariant = "full",
  searchPlaceholder = "O que você procura em Lapa hoje?",
  className,
}: MarketplaceHeaderProps) {
  const [internalNeighborhood, setInternalNeighborhood] = useState(neighborhoods[0]);
  const [internalQuery, setInternalQuery] = useState("");
  const router = useRouter();
  const scrolled = useScrolled(80);
  const viewer = useViewer();

  const isMounted = useBagHydrated();
  const bagItems = useBagStore((s) => s.items);
  const count = isMounted ? bagItems.reduce((sum, i) => sum + i.quantity, 0) : bagCount;
  const total = isMounted ? bagItems.reduce((sum, i) => sum + i.price * i.quantity, 0) : 0;
  const hasItems = count > 0;
  const totalLabel = formatCurrencyBRL(total);

  const neighborhood = controlledNeighborhood ?? internalNeighborhood;
  const query = controlledQuery ?? internalQuery;

  const setNeighborhood = (v: string) => {
    setInternalNeighborhood(v);
    onNeighborhoodChange?.(v);
  };

  const setQuery = (v: string) => {
    setInternalQuery(v);
    onSearchChange?.(v);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(query);
    } else if (query.trim()) {
      router.push(`/explorar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const searchForm = (size: "lg" | "md") => (
    <form
      role="search"
      onSubmit={submit}
      className={cn("aura-glow rounded-full", size === "lg" ? "min-w-55 max-w-160 flex-1" : "w-full")}
    >
      <label
        className={cn(
          "flex items-center gap-2.5 rounded-full border border-line bg-white",
          size === "lg" ? "h-13 pl-4.5 pr-1.5" : "h-12 pl-4 pr-1"
        )}
      >
        <Search
          className={cn("flex-none text-muted", size === "lg" ? "size-4.75" : "size-4.5")}
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <span className="sr-only">Buscar produtos e lojas</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={size === "lg" ? searchPlaceholder : "O que você procura hoje?"}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpar busca"
            className={cn(
              "grid size-8 flex-none cursor-pointer place-items-center rounded-full text-slate-400 hover:bg-media hover:text-slate-700",
              focusRing
            )}
          >
            <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Buscar"
          className={cn(
            "grid size-10 flex-none cursor-pointer place-items-center rounded-full bg-ink text-white transition-colors hover:bg-ink-hover active:scale-95",
            focusRing
          )}
        >
          <ArrowRight className={size === "lg" ? "size-4.25" : "size-4"} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </label>
    </form>
  );

  const favoritesLabel = favoritesCount > 0 ? `Favoritos (${favoritesCount})` : "Favoritos";
  const favoritesClasses = (sizeCls: string) =>
    cn(
      "relative grid flex-none cursor-pointer place-items-center rounded-full bg-media transition-colors hover:bg-line",
      sizeCls,
      focusRing
    );
  const favoritesInner = (iconCls: string) => (
    <>
      <Heart className={cn("text-ink", iconCls)} strokeWidth={1.8} aria-hidden="true" />
      {favoritesCount > 0 && (
        <span
          className="absolute right-2.5 top-2.25 size-2 rounded-full bg-offer ring-2 ring-media"
          aria-hidden="true"
        />
      )}
    </>
  );
  const favorites = (sizeCls: string, iconCls: string) =>
    onOpenFavorites ? (
      <button type="button" onClick={onOpenFavorites} aria-label={favoritesLabel} className={favoritesClasses(sizeCls)}>
        {favoritesInner(iconCls)}
      </button>
    ) : (
      <Link href="/minha-conta?aba=favorites" aria-label={favoritesLabel} className={favoritesClasses(sizeCls)}>
        {favoritesInner(iconCls)}
      </Link>
    );

  const bagLabel = hasItems
    ? `Sacola, ${count} ${count === 1 ? "item" : "itens"}, ${totalLabel}`
    : "Sacola vazia";
  const bagClasses = cn(
    "flex h-10 flex-none cursor-pointer items-center gap-2 rounded-full bg-brand pl-3 pr-1.5 text-white transition-colors hover:bg-brand-hover active:scale-[0.98]",
    focusRing
  );
  const bagInner = (
    <>
      <ShoppingBag className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
      <span
        className={cn(
          "grid h-6.5 min-w-6.5 place-items-center rounded-full px-1.5 font-display text-[12px] font-bold",
          hasItems ? "bg-white text-ink" : "bg-white/16 text-slate-300"
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <header
        className={cn(
          "sticky top-0 z-40 hidden w-full border-b border-seg backdrop-blur-[16px] transition-shadow duration-200 md:block",
          scrolled ? "bg-white/86 shadow-[0_8px_30px_rgba(15,23,42,0.06)]" : "bg-white/72",
          className
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center gap-4 px-6 transition-[height] duration-200 lg:px-8",
            scrolled ? "h-17" : "h-20"
          )}
        >
          <Link
            href="/"
            aria-label="Lapa Marketplace, página inicial"
            className={cn("flex flex-none items-center gap-2.5 rounded-lg", focusRing)}
          >
            <LapaBag variant="solid" size={scrolled ? 28 : 34} />
            <span
              className={cn(
                "whitespace-nowrap font-display tracking-[-0.025em] transition-[font-size] duration-200",
                scrolled ? "text-[21px]" : "text-2xl"
              )}
            >
              <span className="font-semibold text-ink">Lapa</span>
              <span className="hidden font-medium tracking-[-0.02em] text-muted xl:inline"> Marketplace</span>
            </span>
          </Link>

          <div className="hidden lg:block">
            <NeighborhoodMenu value={neighborhood} options={neighborhoods} onChange={setNeighborhood} />
          </div>
          {searchForm("lg")}

          <nav aria-label="Atalhos da conta" className="ml-auto flex flex-none items-center gap-2">
            {favorites("size-12", "size-5")}

            {viewer ? (
              <Link
                href={viewer.store ? "/painel" : "/minha-conta"}
                className={cn(
                  "flex h-12 items-center gap-2.5 rounded-full bg-media pl-1.5 pr-4 transition-colors hover:bg-line",
                  focusRing
                )}
              >
                <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-brand-soft font-display text-[13px] font-bold text-brand-deep">
                  {viewer.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={viewer.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    viewer.initials
                  )}
                </span>
                <span className="hidden flex-col leading-[1.15] lg:flex">
                  <span className="max-w-28 truncate text-[11px] font-medium text-muted">
                    Olá, {viewer.firstName}
                  </span>
                  <span className="whitespace-nowrap font-display text-sm font-semibold text-ink">
                    {viewer.store ? "Meu painel" : "Minha conta"}
                  </span>
                </span>
              </Link>
            ) : (
              <Link
                href="/minha-conta"
                className={cn(
                  "flex h-12 items-center gap-2 rounded-full bg-media pl-3.5 pr-4.5 font-display text-[15px] font-semibold text-ink transition-colors hover:bg-line",
                  focusRing
                )}
              >
                <User className="size-4.75" strokeWidth={1.8} aria-hidden="true" />
                <span className="hidden lg:inline">Entrar</span>
              </Link>
            )}

            {onOpenBag ? (
              <button type="button" onClick={onOpenBag} aria-label={bagLabel} className={bagClasses}>
                {bagInner}
              </button>
            ) : (
              <Link href="/sacola" aria-label={bagLabel} className={bagClasses}>
                {bagInner}
              </Link>
            )}
            <span className="sr-only" aria-live="polite">
              {hasItems ? `${count} itens na sacola` : ""}
            </span>
          </nav>
        </div>
      </header>

      {/* Mobile */}
      {mobileVariant === "full" && (
        <header
          className={cn(
            "sticky top-0 z-40 w-full border-b border-seg bg-white/86 backdrop-blur-[16px] transition-shadow duration-200 md:hidden",
            scrolled && "shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
          )}
        >
          <div className="flex items-center gap-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Link
              href="/"
              aria-label="Lapa Marketplace, página inicial"
              className={cn("mr-auto flex flex-none items-center gap-2 rounded-lg", focusRing)}
            >
              <LapaBag variant="solid" size={28} />
              <span className="font-display text-xl font-semibold tracking-[-0.025em] text-ink">Lapa</span>
            </Link>
            <NeighborhoodMenu value={neighborhood} options={neighborhoods} onChange={setNeighborhood} compact />
            {favorites("size-10", "size-4.75")}
          </div>
        </header>
      )}
    </>
  );
}
