"use client";

import { trackEvent, trackSaveProduct } from "@/lib/analytics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { ProductCardGrid } from "@/components/marketplace/ProductCardGrid";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PillGroup, Switch } from "@/components/ui/Switch";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { toggleSaveProduct } from "@/app/actions/social";
import { getStoreOpenStatus } from "@/lib/store-hours";
import { cn, sanitizeStoreSlug } from "@/lib/utils";
import type {
  GlobalCategory,
  NeighborhoodItem,
  PaymentMethod,
  ProductItem,
} from "@/types/marketplace";

export interface InitialExploreParams {
  q?: string;
  categoria?: string;
  subcategoria?: string;
  bairro?: string;
  tamanho?: string;
  genero?: string;
  voltagem?: string;
  condicao?: string;
  pagamento?: string;
  precoMax?: string;
  abertas?: boolean;
  promocao?: boolean;
}

export interface ExploreMarketplaceClientProps {
  allProducts: ProductItem[];
  categories: GlobalCategory[];
  neighborhoods: NeighborhoodItem[];
  savedProductIds: string[];
  initialParams: InitialExploreParams;
}

const PAYMENT_FILTER_OPTIONS: Array<{ id: PaymentMethod | "all"; label: string }> = [
  { id: "all", label: "Qualquer forma de pagamento" },
  { id: "pix", label: "Pix" },
  { id: "credit_card", label: "Cartão de crédito" },
  { id: "debit_card", label: "Cartão de débito" },
  { id: "crediario", label: "Crediário da loja" },
  { id: "cash", label: "Dinheiro" },
  { id: "payment_link", label: "Link de pagamento" },
];

type SortOption = "relevance" | "price_asc" | "price_desc";

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Relevância",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
};

export function ExploreMarketplaceClient({
  allProducts,
  categories,
  neighborhoods,
  savedProductIds,
  initialParams,
}: ExploreMarketplaceClientProps) {
  const router = useRouter();

  // Estados dos filtros
  const [query, setQuery] = useState(initialParams.q || "");

  // Analytics: registra a busca quando o termo fica parado por 1,2 s
  const lastTrackedSearch = useRef("");
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || term === lastTrackedSearch.current) return;
    const timer = window.setTimeout(() => {
      lastTrackedSearch.current = term;
      trackEvent("search", { search_term: term });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [query]);
  const [categorySlug, setCategorySlug] = useState(
    initialParams.categoria || "all"
  );
  const [subcategorySlug, setSubcategorySlug] = useState(
    initialParams.subcategoria || "all"
  );
  const [neighborhood, setNeighborhood] = useState(
    initialParams.bairro || "all"
  );
  const [onlyOpenNow, setOnlyOpenNow] = useState(
    Boolean(initialParams.abertas)
  );
  const [onlyPromo, setOnlyPromo] = useState(Boolean(initialParams.promocao));
  const [selectedSize, setSelectedSize] = useState(
    initialParams.tamanho || "all"
  );
  const [selectedGender, setSelectedGender] = useState(
    initialParams.genero || "all"
  );
  const [selectedVoltage, setSelectedVoltage] = useState(
    initialParams.voltagem || "all"
  );
  const [selectedCondition, setSelectedCondition] = useState(
    initialParams.condicao || "all"
  );
  const [selectedPayment, setSelectedPayment] = useState(
    initialParams.pagamento || "all"
  );
  const [maxPriceText, setMaxPriceText] = useState(
    initialParams.precoMax || ""
  );

  // Drawer mobile de filtros
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  // Sacola e Favoritos
  const [bagCount, setBagCount] = useState(2);
  const [savedSet, setSavedSet] = useState<Set<string>>(
    () => new Set(savedProductIds)
  );
  const [authModalProduct, setAuthModalProduct] = useState<string | null>(null);

  const mainCategories = useMemo(
    () =>
      categories
        .filter((c) => !c.parent_id && c.is_active)
        .sort((a, b) => a.order_index - b.order_index),
    [categories]
  );

  const activeMainCategory = useMemo(
    () =>
      mainCategories.find(
        (c) => c.slug === categorySlug || c.id === categorySlug
      ) || null,
    [mainCategories, categorySlug]
  );

  const availableSubcategories = useMemo(() => {
    if (!activeMainCategory) return [];
    return categories
      .filter((c) => c.parent_id === activeMainCategory.id && c.is_active)
      .sort((a, b) => a.order_index - b.order_index);
  }, [categories, activeMainCategory]);

  // Configuração de filtros dinâmicos (Tamanho, Gênero, Voltagem)
  const dynamicFilterConfig = useMemo(() => {
    if (activeMainCategory) {
      return activeMainCategory.filter_config || {};
    }
    // Se "Todas as categorias" estiver selecionada, agrega opções comuns
    return {
      has_gender: true,
      has_size: true,
      size_options: [
        "PP",
        "P",
        "M",
        "G",
        "GG",
        "Único",
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
      ],
      has_voltage: true,
    };
  }, [activeMainCategory]);

  // Aplica todos os filtros em memória (incluindo getStoreOpenStatus em tempo real)
  const filteredProducts = useMemo(() => {
    const parsedMaxPrice = maxPriceText ? Number(maxPriceText) : null;

    return allProducts.filter((p) => {
      // 1. Busca textual
      if (query.trim()) {
        const qLower = query.trim().toLowerCase();
        const matchText =
          p.title.toLowerCase().includes(qLower) ||
          (p.description && p.description.toLowerCase().includes(qLower)) ||
          p.store.name.toLowerCase().includes(qLower) ||
          p.store.neighborhood.toLowerCase().includes(qLower);
        if (!matchText) return false;
      }

      // 2. Categoria Principal
      if (categorySlug !== "all") {
        if (
          p.category_slug !== categorySlug &&
          p.category_id !== categorySlug &&
          p.category_id !== activeMainCategory?.id
        ) {
          return false;
        }
      }

      // 3. Subcategoria
      if (subcategorySlug !== "all") {
        if (
          p.subcategory_slug !== subcategorySlug &&
          p.subcategory_id !== subcategorySlug
        ) {
          return false;
        }
      }

      // 4. Bairro da Loja em Lapa
      if (
        neighborhood !== "all" &&
        neighborhood !== "Toda Bom Jesus da Lapa"
      ) {
        const nbClean = sanitizeStoreSlug(neighborhood);
        const storeNbClean = sanitizeStoreSlug(p.store.neighborhood);
        if (
          storeNbClean !== nbClean &&
          p.store.neighborhood_id !== neighborhood &&
          p.store.neighborhood_slug !== nbClean
        ) {
          return false;
        }
      }

      // 5. Apenas Lojas Abertas Agora (usando getStoreOpenStatus em memória)
      if (onlyOpenNow) {
        const status = getStoreOpenStatus({
          businessHours: p.store.business_hours,
          specialHours: p.store.special_hours,
          isOpenOverride: p.store.is_open_override,
        });
        if (!status.isOpen) return false;
      }

      // 6. Apenas Produtos em Promoção
      if (onlyPromo) {
        if (p.promotional_price == null || p.promotional_price >= p.price) {
          return false;
        }
      }

      // 7. Tamanho / Numeração
      if (selectedSize !== "all") {
        const hasSize = (p.sizes || []).some(
          (s) => s.toLowerCase() === selectedSize.toLowerCase()
        );
        if (!hasSize) return false;
      }

      // 8. Gênero
      if (selectedGender !== "all") {
        if (
          (p.gender || "").toLowerCase() !== selectedGender.toLowerCase()
        ) {
          return false;
        }
      }

      // 9. Voltagem
      if (selectedVoltage !== "all") {
        if (
          (p.voltage || "").toLowerCase() !== selectedVoltage.toLowerCase()
        ) {
          return false;
        }
      }

      // 10. Condição (Novo / Seminovo)
      if (selectedCondition !== "all") {
        if ((p.condition || "new") !== selectedCondition) {
          return false;
        }
      }

      // 11. Forma de Pagamento Aceita pela Loja
      if (selectedPayment !== "all") {
        const accepted = p.store.payment_methods || [];
        if (!accepted.includes(selectedPayment as PaymentMethod)) {
          return false;
        }
      }

      // 12. Preço Máximo
      if (
        parsedMaxPrice != null &&
        !Number.isNaN(parsedMaxPrice) &&
        parsedMaxPrice > 0
      ) {
        const effective =
          p.promotional_price != null && p.promotional_price < p.price
            ? p.promotional_price
            : p.price;
        if (effective > parsedMaxPrice) return false;
      }

      return true;
    });
  }, [
    allProducts,
    query,
    categorySlug,
    activeMainCategory,
    subcategorySlug,
    neighborhood,
    onlyOpenNow,
    onlyPromo,
    selectedSize,
    selectedGender,
    selectedVoltage,
    selectedCondition,
    selectedPayment,
    maxPriceText,
  ]);

  const syncUrlParams = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (categorySlug !== "all") params.set("categoria", categorySlug);
    if (subcategorySlug !== "all") params.set("subcategoria", subcategorySlug);
    if (neighborhood !== "all" && neighborhood !== "Toda Bom Jesus da Lapa") {
      params.set("bairro", neighborhood);
    }
    if (onlyOpenNow) params.set("abertas", "true");
    if (onlyPromo) params.set("promocao", "true");
    if (selectedSize !== "all") params.set("tamanho", selectedSize);
    if (selectedGender !== "all") params.set("genero", selectedGender);
    if (selectedVoltage !== "all") params.set("voltagem", selectedVoltage);
    if (selectedCondition !== "all") params.set("condicao", selectedCondition);
    if (selectedPayment !== "all") params.set("pagamento", selectedPayment);
    if (maxPriceText.trim()) params.set("precoMax", maxPriceText.trim());

    const qs = params.toString();
    router.replace(qs ? `/explorar?${qs}` : "/explorar", { scroll: false });
  };

  const handleResetFilters = () => {
    setQuery("");
    setCategorySlug("all");
    setSubcategorySlug("all");
    setNeighborhood("all");
    setOnlyOpenNow(false);
    setOnlyPromo(false);
    setSelectedSize("all");
    setSelectedGender("all");
    setSelectedVoltage("all");
    setSelectedCondition("all");
    setSelectedPayment("all");
    setMaxPriceText("");
    router.replace("/explorar", { scroll: false });
  };

  const handleProductFavorite = async (product: ProductItem, next: boolean) => {
    setSavedSet((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(product.id);
      else copy.delete(product.id);
      return copy;
    });

    const result = await toggleSaveProduct(product.id);
    if (result?.requiresAuth) {
      setAuthModalProduct(product.title);
    } else if (!result?.error) {
      trackSaveProduct(product, next);
    }
  };

  const activeFiltersCount = [
    categorySlug !== "all",
    subcategorySlug !== "all",
    neighborhood !== "all" && neighborhood !== "Toda Bom Jesus da Lapa",
    onlyOpenNow,
    onlyPromo,
    selectedSize !== "all",
    selectedGender !== "all",
    selectedVoltage !== "all",
    selectedCondition !== "all",
    selectedPayment !== "all",
    Boolean(maxPriceText.trim()),
  ].filter(Boolean).length;

  const sortedProducts = useMemo(() => {
    if (sortBy === "relevance") return filteredProducts;
    const effective = (p: ProductItem) =>
      p.promotional_price != null && p.promotional_price < p.price
        ? p.promotional_price
        : p.price;
    return [...filteredProducts].sort((a, b) =>
      sortBy === "price_asc"
        ? effective(a) - effective(b)
        : effective(b) - effective(a)
    );
  }, [filteredProducts, sortBy]);

  // Teto do slider de preço, arredondado para cima em múltiplos de 50
  const priceCeiling = useMemo(() => {
    const max = allProducts.reduce((m, p) => Math.max(m, p.price), 0);
    return Math.max(100, Math.ceil(max / 50) * 50);
  }, [allProducts]);
  const maxPriceValue = Number(maxPriceText);
  const hasMaxPrice = Boolean(maxPriceText.trim()) && maxPriceValue > 0;
  const sliderValue = hasMaxPrice
    ? Math.min(maxPriceValue, priceCeiling)
    : priceCeiling;

  const neighborhoodName =
    neighborhoods.find((nb) => (nb.slug || nb.id) === neighborhood)?.name ??
    neighborhood;

  // Chips de filtros ativos (céu com ×)
  const activeChips: Array<{ key: string; label: string; clear: () => void }> =
    [];
  if (categorySlug !== "all") {
    activeChips.push({
      key: "cat",
      label: activeMainCategory?.name ?? categorySlug,
      clear: () => {
        setCategorySlug("all");
        setSubcategorySlug("all");
        setSelectedSize("all");
      },
    });
  }
  if (subcategorySlug !== "all") {
    activeChips.push({
      key: "sub",
      label:
        availableSubcategories.find((s) => s.slug === subcategorySlug)?.name ??
        subcategorySlug,
      clear: () => setSubcategorySlug("all"),
    });
  }
  if (onlyOpenNow) {
    activeChips.push({
      key: "open",
      label: "Aberta agora",
      clear: () => setOnlyOpenNow(false),
    });
  }
  if (hasMaxPrice) {
    activeChips.push({
      key: "price",
      label: `Até R$ ${maxPriceValue}`,
      clear: () => setMaxPriceText(""),
    });
  }
  if (neighborhood !== "all" && neighborhood !== "Toda Bom Jesus da Lapa") {
    activeChips.push({
      key: "nb",
      label: neighborhoodName,
      clear: () => setNeighborhood("all"),
    });
  }
  if (onlyPromo) {
    activeChips.push({
      key: "promo",
      label: "Em promoção",
      clear: () => setOnlyPromo(false),
    });
  }
  if (selectedSize !== "all") {
    activeChips.push({
      key: "size",
      label: `Tam. ${selectedSize}`,
      clear: () => setSelectedSize("all"),
    });
  }
  if (selectedGender !== "all") {
    activeChips.push({
      key: "gender",
      label: selectedGender,
      clear: () => setSelectedGender("all"),
    });
  }
  if (selectedVoltage !== "all") {
    activeChips.push({
      key: "volt",
      label: selectedVoltage,
      clear: () => setSelectedVoltage("all"),
    });
  }
  if (selectedCondition !== "all") {
    activeChips.push({
      key: "cond",
      label: selectedCondition === "new" ? "Novo" : "Seminovo",
      clear: () => setSelectedCondition("all"),
    });
  }
  if (selectedPayment !== "all") {
    activeChips.push({
      key: "pay",
      label:
        PAYMENT_FILTER_OPTIONS.find((p) => p.id === selectedPayment)?.label ??
        selectedPayment,
      clear: () => setSelectedPayment("all"),
    });
  }

  const filterTitle = (text: string) => (
    <span className="font-display text-[15px] font-bold text-slate-900">
      {text}
    </span>
  );

  /** Controles de filtro, compartilhados pela gaveta mobile e pela sidebar desktop. */
  const renderFilterControls = (surface: "white" | "soft") => (
    <div className="flex flex-col gap-5.5">
      <div className="flex flex-col gap-2.5">
        {filterTitle("Categoria")}
        <PillGroup
          ariaLabel="Categoria"
          surface={surface}
          value={categorySlug === "all" ? null : categorySlug}
          onToggle={(slug) => {
            setCategorySlug(categorySlug === slug ? "all" : slug);
            setSubcategorySlug("all");
            setSelectedSize("all");
          }}
          options={mainCategories.map((c) => ({
            value: c.slug,
            label: c.name,
          }))}
        />
        {availableSubcategories.length > 0 && (
          <Select
            aria-label="Subcategoria"
            inputSize="md"
            value={subcategorySlug}
            onChange={(e) => setSubcategorySlug(e.target.value)}
            className={surface === "white" ? "bg-slate-100" : undefined}
            options={[
              {
                value: "all",
                label: `Tudo em ${activeMainCategory?.name}`,
              },
              ...availableSubcategories.map((sub) => ({
                value: sub.slug,
                label: sub.name,
              })),
            ]}
          />
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {filterTitle("Bairro da loja")}
        <Select
          aria-label="Bairro da loja"
          inputSize="md"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          options={[
            { value: "all", label: "Toda Bom Jesus da Lapa" },
            ...neighborhoods.map((nb) => ({
              value: nb.slug || nb.id,
              label: nb.name,
            })),
          ]}
        />
      </div>

      {dynamicFilterConfig.has_size &&
        (dynamicFilterConfig.size_options?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-2.5">
            {filterTitle("Tamanho")}
            <div className="flex flex-wrap gap-2">
              {(dynamicFilterConfig.size_options || []).map((sz) => {
                const active = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedSize(active ? "all" : sz)}
                    className={cn(
                      "min-w-11.5 h-11 px-3 rounded-[14px] grid place-items-center font-display text-sm font-bold transition-colors duration-150 cursor-pointer",
                      active
                        ? "bg-brand text-white"
                        : "bg-white text-slate-900 ring-line hover:bg-slate-50"
                    )}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {dynamicFilterConfig.has_gender && (
        <div className="flex flex-col gap-2.5">
          {filterTitle("Gênero")}
          <PillGroup
            ariaLabel="Gênero"
            surface={surface}
            value={selectedGender === "all" ? null : selectedGender}
            onToggle={(g) => setSelectedGender(selectedGender === g ? "all" : g)}
            options={["Feminino", "Masculino", "Unissex", "Infantil"].map(
              (g) => ({ value: g, label: g })
            )}
          />
        </div>
      )}

      {dynamicFilterConfig.has_voltage && (
        <div className="flex flex-col gap-2.5">
          {filterTitle("Voltagem")}
          <PillGroup
            ariaLabel="Voltagem"
            surface={surface}
            value={selectedVoltage === "all" ? null : selectedVoltage}
            onToggle={(v) =>
              setSelectedVoltage(selectedVoltage === v ? "all" : v)
            }
            options={["220V", "110V", "Bivolt"].map((v) => ({
              value: v,
              label: v,
            }))}
          />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {filterTitle("Preço máximo")}
        <div className="flex flex-col gap-1">
          <input
            type="range"
            aria-label="Preço máximo"
            min={0}
            max={priceCeiling}
            step={10}
            value={sliderValue}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMaxPriceText(v >= priceCeiling || v <= 0 ? "" : String(v));
            }}
            style={
              {
                "--range-fill": `${(sliderValue / priceCeiling) * 100}%`,
              } as React.CSSProperties
            }
            className="lapa-range"
          />
          <div className="flex justify-between text-[13px] text-slate-500">
            <span>R$ 0</span>
            <span className="font-semibold text-slate-900">
              {hasMaxPrice ? `até R$ ${maxPriceValue}` : "sem limite"}
            </span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col rounded-[20px]",
          surface === "white" ? "bg-white" : "bg-slate-50"
        )}
      >
        {(
          [
            {
              label: "Apenas lojas abertas agora",
              sub: "Usa o horário de cada loja",
              checked: onlyOpenNow,
              set: setOnlyOpenNow,
            },
            {
              label: "Apenas em promoção",
              sub: "Com preço De/Por",
              checked: onlyPromo,
              set: setOnlyPromo,
            },
          ] as const
        ).map((toggle, idx) => (
          <div
            key={toggle.label}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3.5",
              idx > 0 && "border-t border-slate-100"
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-slate-900">
                {toggle.label}
              </span>
              <span className="text-xs text-slate-500">{toggle.sub}</span>
            </div>
            <Switch
              checked={toggle.checked}
              onCheckedChange={toggle.set}
              aria-label={toggle.label}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {filterTitle("Condição")}
        <PillGroup
          ariaLabel="Condição do produto"
          surface={surface}
          value={selectedCondition === "all" ? null : selectedCondition}
          onToggle={(c) =>
            setSelectedCondition(selectedCondition === c ? "all" : c)
          }
          options={[
            { value: "new", label: "Novo" },
            { value: "used", label: "Seminovo" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {filterTitle("Loja aceita")}
        <PillGroup
          ariaLabel="Forma de pagamento aceita pela loja"
          tone="brand"
          surface={surface}
          value={selectedPayment === "all" ? null : selectedPayment}
          onToggle={(p) => setSelectedPayment(selectedPayment === p ? "all" : p)}
          options={PAYMENT_FILTER_OPTIONS.filter((p) => p.id !== "all").map(
            (p) => ({ value: p.id as string, label: p.label })
          )}
        />
      </div>
    </div>
  );

  const resultsLabel = `${sortedProducts.length} ${
    sortedProducts.length === 1 ? "resultado" : "resultados"
  }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader
        mobileVariant="hidden"
        searchQuery={query}
        onSearchChange={setQuery}
        onSearchSubmit={() => syncUrlParams()}
        bagCount={bagCount}
        favoritesCount={savedSet.size}
      />

      <AuthPromptModal
        isOpen={Boolean(authModalProduct)}
        onClose={() => setAuthModalProduct(null)}
        reason="favorite"
        itemName={authModalProduct || undefined}
      />

      {/* Mobile: busca + botão de filtros */}
      <div className="lg:hidden flex items-center gap-2.5 px-5 md:px-6 pt-[max(1.25rem,env(safe-area-inset-top))] md:pt-5 pb-3.5">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            syncUrlParams();
          }}
          className="relative flex-1 flex items-center md:hidden lapa-aurora-glow rounded-full"
        >
          <Search
            className="w-4.5 h-4.5 text-slate-500 absolute left-4.5 pointer-events-none"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar em lojas da Lapa"
            aria-label="Pesquisar produtos ou lojas"
            className="w-full h-12 rounded-full bg-white border border-[#f8fafc] pl-11.5 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#f8fafc] focus:outline-none transition-colors duration-150 [&::-webkit-search-cancel-button]:hidden"
          />
        </form>
        <span className="hidden md:block flex-1" />
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label={
            activeFiltersCount > 0
              ? `Abrir filtros (${activeFiltersCount} ativos)`
              : "Abrir filtros"
          }
          className="relative w-12 h-12 rounded-2xl bg-brand hover:bg-brand-hover grid place-items-center text-white transition duration-150 active:scale-[0.98] cursor-pointer shrink-0"
        >
          <SlidersHorizontal className="w-5 h-5" strokeWidth={1.8} />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand text-white font-display text-[11px] font-bold grid place-items-center ring-2 ring-slate-50">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      <main className="flex-1 mx-auto w-full max-w-7xl md:px-6 lg:px-8 lg:py-7 pb-32 md:pb-10">
        <div className="lg:grid lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:items-start">
          {/* Sidebar de filtros (desktop) */}
          <aside className="hidden lg:block sticky top-24 rounded-[28px] bg-white p-5 max-h-[calc(100dvh-7.5rem)] overflow-y-auto no-scrollbar">
            <div className="flex items-baseline justify-between pb-4">
              <h2 className="text-[19px] font-extrabold text-slate-900">
                Filtros
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[13px] text-slate-500 underline hover:text-slate-900 cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
            {renderFilterControls("soft")}
          </aside>

          <section>
            {/* Chips de filtros ativos */}
            {activeChips.length > 0 && (
              <div className="flex gap-2 px-5 md:px-0 pb-4.5 overflow-x-auto no-scrollbar">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.clear}
                    aria-label={`Remover filtro ${chip.label}`}
                    className="flex-none inline-flex items-center gap-1.5 px-3.5 py-2.25 rounded-full bg-brand text-white text-[13px] font-semibold leading-tight cursor-pointer hover:bg-brand-hover transition-colors duration-150"
                  >
                    {chip.label}
                    <X className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-baseline justify-between gap-3 px-5 md:px-0 pb-3">
              <h1 className="text-[19px] lg:text-[30px] font-extrabold tracking-[-0.02em] lg:tracking-[-0.03em] text-slate-900">
                {resultsLabel}
              </h1>
              <label className="relative inline-flex items-center gap-1 text-[13px] text-slate-500 cursor-pointer">
                <span>{SORT_LABELS[sortBy]}</span>
                <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" />
                <select
                  aria-label="Ordenar resultados"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                    <option key={opt} value={opt}>
                      {SORT_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {sortedProducts.length === 0 ? (
              <div className="mx-3 md:mx-0 rounded-[28px] bg-white p-8 text-center space-y-3">
                <h2 className="text-[19px] font-extrabold text-slate-900 text-balance">
                  Nenhum produto com esses filtros
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-normal">
                  Tente tirar o tamanho, aumentar o preço máximo ou buscar em
                  todos os bairros de Bom Jesus da Lapa.
                </p>
                <Button variant="primary" onClick={handleResetFilters}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 px-5 md:px-0">
                {sortedProducts.map((product) => (
                  <ProductCardGrid
                    key={product.id}
                    product={product}
                    variant="catalogo"
                    isFavorite={savedSet.has(product.id)}
                    onAddToBag={() => setBagCount((c) => c + 1)}
                    onToggleFavorite={handleProductFavorite}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Gaveta de filtros (mobile/tablet) */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          className="fixed inset-0 z-50 lg:hidden bg-slate-900/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileDrawerOpen(false);
          }}
        >
          <div className="absolute inset-x-0 bottom-0 top-24 mx-auto max-w-xl bg-slate-50 rounded-t-[32px] flex flex-col animate-slide-up">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Fechar filtros"
              className="flex justify-center p-2.5 cursor-pointer"
            >
              <span className="w-10 h-1.25 rounded-full bg-slate-300" />
            </button>
            <div className="flex items-baseline justify-between px-5 pt-1 pb-3.5">
              <h2 className="text-[22px] font-extrabold text-slate-900">
                Filtros
              </h2>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-sm text-slate-500 underline cursor-pointer"
              >
                Limpar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-30">
              {renderFilterControls("white")}
            </div>

            <div className="absolute inset-x-0 bottom-0 px-5 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] bg-linear-to-b from-slate-50/0 to-slate-50 to-30%">
              <Button
                size="lg"
                fullWidth
                onClick={() => {
                  syncUrlParams();
                  setMobileDrawerOpen(false);
                }}
              >
                Ver {sortedProducts.length}{" "}
                {sortedProducts.length === 1 ? "produto" : "produtos"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer className="hidden md:block" />
    </div>
  );
}
