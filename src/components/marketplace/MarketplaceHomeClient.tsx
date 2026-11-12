"use client";

import { trackSaveProduct } from "@/lib/analytics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Loader2,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Rows3,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { StoriesBar } from "@/components/marketplace/StoriesBar";
import {
  CategoryPills,
  DEFAULT_MARKETPLACE_CATEGORIES,
} from "@/components/ui/CategoryPills";
import { PromoBanner } from "@/components/ui/PromoBanner";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { ProductCardGrid } from "@/components/marketplace/ProductCardGrid";
import { ProductFeedPost } from "@/components/marketplace/ProductFeedPost";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import { getMarketplaceFeed } from "@/app/actions/feed";
import { toggleFollowStore, toggleSaveProduct } from "@/app/actions/social";
import { trackEvent } from "@/lib/analytics";
import {
  FeaturedStoresSection,
  type StoreShowcase,
} from "@/components/marketplace/FeaturedStores";
import { Badge } from "@/components/ui/Badge";
import {
  calculateDiscountPercentage,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
import type {
  CategoryItem,
  GlobalCategory,
  NeighborhoodItem,
  ProductItem,
  StoreSummary,
  StoreWithStories,
} from "@/types/marketplace";

const DEFAULT_HOME_NEIGHBORHOODS: NeighborhoodItem[] = [
  { id: "centro", name: "Centro", slug: "centro", is_active: true },
  { id: "sao-joao", name: "São João", slug: "sao-joao", is_active: true },
  {
    id: "parque-verde",
    name: "Parque Verde",
    slug: "parque-verde",
    is_active: true,
  },
  {
    id: "sao-gotardo",
    name: "São Gotardo",
    slug: "sao-gotardo",
    is_active: true,
  },
  { id: "beira-rio", name: "Beira Rio", slug: "beira-rio", is_active: true },
];

const FEED_PAGE_SIZE = 6;

export interface MarketplaceHomeClientProps {
  stories: StoreWithStories[];
  categories: GlobalCategory[];
  dailyOffers: ProductItem[];
  featuredStores: StoreSummary[];
  recentProducts: ProductItem[];
  initialFeed: ProductItem[];
  hasMoreFeed: boolean;
  userId: string | null;
  savedProductIds: string[];
  neighborhoods?: NeighborhoodItem[];
  storeShowcases?: Record<string, StoreShowcase>;
  followedStoreIds?: string[];
}

export function MarketplaceHomeClient({
  stories,
  categories,
  dailyOffers,
  featuredStores,
  initialFeed,
  hasMoreFeed: initialHasMore,
  userId,
  savedProductIds,
  neighborhoods,
  storeShowcases,
  followedStoreIds = [],
}: MarketplaceHomeClientProps) {
  const router = useRouter();

  const [selectedNeighborhood, setSelectedNeighborhood] = useState(
    "Toda Bom Jesus da Lapa"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Sidebar Desktop de Filtros (Colapsável) e Filtros Rápidos
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem("lapa_home_sidebar_open");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [onlyPromo, setOnlyPromo] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("lapa_home_sidebar_open", String(next));
      } catch {
        // Ignora erro
      }
      return next;
    });
  };

  // Contadores de Sacola e Favoritos no Header
  const [bagCount, setBagCount] = useState(2);
  const [savedSet, setSavedSet] = useState<Set<string>>(
    () => new Set(savedProductIds)
  );
  const [authModalProduct, setAuthModalProduct] = useState<string | null>(null);
  const [authReason, setAuthReason] = useState<"favorite" | "follow">("favorite");
  const [followingIds, setFollowingIds] = useState<Set<string>>(
    () => new Set(followedStoreIds)
  );
  const storyStoreIds = React.useMemo(
    () =>
      new Set(
        stories.filter((s) => s.stories.length > 0).map((s) => s.store.id)
      ),
    [stories]
  );

  const handleToggleFollow = async (store: StoreSummary) => {
    const next = !followingIds.has(store.id);
    setFollowingIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(store.id);
      else copy.delete(store.id);
      return copy;
    });
    const res = await toggleFollowStore(store.id);
    if (res?.requiresAuth || res?.error) {
      // Desfaz a troca otimista
      setFollowingIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(store.id);
        else copy.add(store.id);
        return copy;
      });
      if (res?.requiresAuth) {
        setAuthReason("follow");
        setAuthModalProduct(store.name);
      }
    } else {
      trackEvent(next ? "follow_store" : "unfollow_store", {
        store_id: store.id,
        store_name: store.name,
      });
    }
  };

  // Estado do Feed Infinito (Abas "Toda a Lapa" | "Seguindo" + Modo "Feed" | "Grade")
  const [feedTab, setFeedTab] = useState<"explorar" | "seguindo">("explorar");
  const [viewMode, setViewMode] = useState<"feed" | "grid">(() => {
    if (typeof window === "undefined") return "feed";
    try {
      return localStorage.getItem("lapa_home_view_mode") === "grid" ? "grid" : "feed";
    } catch {
      return "feed";
    }
  });

  // Visualização do feed persistida (feed | grade)
  const handleChangeViewMode = (mode: "feed" | "grid") => {
    setViewMode(mode);
    try {
      localStorage.setItem("lapa_home_view_mode", mode);
    } catch {
      // Ignora erro
    }
  };

  const [feedItems, setFeedItems] = useState<ProductItem[]>(initialFeed);
  const [feedPage, setFeedPage] = useState<number>(1);
  const [hasMoreFeed, setHasMoreFeed] = useState<boolean>(initialHasMore);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);

  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Lista de bairros disponíveis
  const availableNeighborhoods = React.useMemo(() => {
    if (neighborhoods && neighborhoods.length > 0) {
      return neighborhoods.filter((nb) => nb.is_active !== false);
    }
    return DEFAULT_HOME_NEIGHBORHOODS;
  }, [neighborhoods]);

  // Lista de categorias principais ordenadas
  const mainCategoriesList = React.useMemo(() => {
    return categories
      .filter((c) => !c.parent_id && c.is_active)
      .sort((a, b) => a.order_index - b.order_index);
  }, [categories]);

  // Contagem de filtros ativos
  const activeFiltersCount =
    (activeCategory !== "all" ? 1 : 0) +
    (selectedNeighborhood !== "Toda Bom Jesus da Lapa" ? 1 : 0) +
    (onlyOpenNow ? 1 : 0) +
    (onlyPromo ? 1 : 0);

  // Mapeia categorias globais para as pílulas do topo (mobile e fallback)
  const categoryPillsList: CategoryItem[] = React.useMemo(() => {
    if (mainCategoriesList.length === 0) return DEFAULT_MARKETPLACE_CATEGORIES;

    return [
      { id: "cat-all", name: "Tudo", slug: "all" },
      ...mainCategoriesList.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    ];
  }, [mainCategoriesList]);

  // Recarrega a página 1 do feed quando mudar aba, categoria, bairro ou toggles
  const reloadFirstFeedPage = useCallback(
    async (
      nextTab: "explorar" | "seguindo",
      nextCat: string,
      nextNeighborhood: string,
      nextOnlyOpenNow?: boolean,
      nextOnlyPromo?: boolean
    ) => {
      setIsLoadingFeed(true);
      try {
        const res = await getMarketplaceFeed({
          page: 1,
          pageSize: FEED_PAGE_SIZE,
          tab: nextTab,
          userId,
          categorySlug: nextCat,
          neighborhoodSlug: nextNeighborhood,
          onlyOpenNow: nextOnlyOpenNow ?? onlyOpenNow,
          onlyPromo: nextOnlyPromo ?? onlyPromo,
        });
        setFeedItems(res.items);
        setFeedPage(1);
        setHasMoreFeed(res.hasMore);
      } finally {
        setIsLoadingFeed(false);
      }
    },
    [userId, onlyOpenNow, onlyPromo]
  );

  // Carrega a próxima página ao rolar até o fim da lista (IntersectionObserver)
  const loadNextFeedPage = useCallback(async () => {
    if (isLoadingFeed || !hasMoreFeed) return;
    setIsLoadingFeed(true);
    try {
      const nextPage = feedPage + 1;
      const res = await getMarketplaceFeed({
        page: nextPage,
        pageSize: FEED_PAGE_SIZE,
        tab: feedTab,
        userId,
        categorySlug: activeCategory,
        neighborhoodSlug: selectedNeighborhood,
        onlyOpenNow,
        onlyPromo,
      });
      setFeedItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const uniqueNew = res.items.filter((i) => !existingIds.has(i.id));
        return [...prev, ...uniqueNew];
      });
      setFeedPage(nextPage);
      setHasMoreFeed(res.hasMore);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [
    isLoadingFeed,
    hasMoreFeed,
    feedPage,
    feedTab,
    userId,
    activeCategory,
    selectedNeighborhood,
    onlyOpenNow,
    onlyPromo,
  ]);

  useEffect(() => {
    const target = loadMoreTriggerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasMoreFeed && !isLoadingFeed) {
          void loadNextFeedPage();
        }
      },
      { rootMargin: "320px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreFeed, isLoadingFeed, loadNextFeedPage]);

  const handleSelectCategory = (cat: CategoryItem) => {
    setActiveCategory(cat.slug);
    void reloadFirstFeedPage(feedTab, cat.slug, selectedNeighborhood);
  };

  const handleSelectNeighborhood = (nb: string) => {
    setSelectedNeighborhood(nb);
    void reloadFirstFeedPage(feedTab, activeCategory, nb);
  };

  const handleSelectFeedTab = (tab: "explorar" | "seguindo") => {
    setFeedTab(tab);
    void reloadFirstFeedPage(tab, activeCategory, selectedNeighborhood);
  };

  const handleToggleOpenNow = (val: boolean) => {
    setOnlyOpenNow(val);
    void reloadFirstFeedPage(
      feedTab,
      activeCategory,
      selectedNeighborhood,
      val,
      onlyPromo
    );
  };

  const handleTogglePromo = (val: boolean) => {
    setOnlyPromo(val);
    void reloadFirstFeedPage(
      feedTab,
      activeCategory,
      selectedNeighborhood,
      onlyOpenNow,
      val
    );
  };

  const handleResetFilters = () => {
    setActiveCategory("all");
    setSelectedNeighborhood("Toda Bom Jesus da Lapa");
    setOnlyOpenNow(false);
    setOnlyPromo(false);
    void reloadFirstFeedPage(
      feedTab,
      "all",
      "Toda Bom Jesus da Lapa",
      false,
      false
    );
  };

  const handleSearchSubmit = (q: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (activeCategory !== "all") params.set("categoria", activeCategory);
    if (selectedNeighborhood !== "Toda Bom Jesus da Lapa") {
      params.set("bairro", selectedNeighborhood);
    }
    router.push(`/explorar?${params.toString()}`);
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
      setAuthReason("favorite");
      setAuthModalProduct(product.title);
    } else if (!result?.error) {
      trackSaveProduct(product, next);
    }
  };

  // Filtra produtos de ofertas conforme categoria e bairro ativos
  const filteredOffers = dailyOffers.filter((p) => {
    if (
      activeCategory !== "all" &&
      p.category_slug !== activeCategory &&
      p.category_id !== activeCategory
    ) {
      return false;
    }
    if (
      selectedNeighborhood !== "Toda Bom Jesus da Lapa" &&
      p.store.neighborhood.toLowerCase() !==
        selectedNeighborhood.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col atmosfera">
      <MarketplaceHeader
        selectedNeighborhood={selectedNeighborhood}
        onNeighborhoodChange={handleSelectNeighborhood}
        neighborhoods={[
          "Toda Bom Jesus da Lapa",
          ...availableNeighborhoods.map((nb) => nb.name),
        ]}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        bagCount={bagCount}
        favoritesCount={savedSet.size}
      />

      <AuthPromptModal
        isOpen={Boolean(authModalProduct)}
        onClose={() => setAuthModalProduct(null)}
        reason={authReason}
        itemName={authModalProduct || undefined}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl md:px-6 lg:px-8 pt-5 md:py-6 pb-48 md:pb-10">
        {/* Estrutura Desktop: Sidebar Lateral à Esquerda (Colapsável) + Feed */}
        <div
          className={cn(
            "w-full items-start",
            isSidebarOpen
              ? "lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8"
              : "block"
          )}
        >
          {/* SIDEBAR DE FILTROS (DESKTOP) - Começa no topo da página */}
          {isSidebarOpen && (
            <aside
              aria-label="Filtros do comércio"
              className="hidden lg:block sticky top-26 rounded-[28px] bg-white border border-media p-5 shadow-card space-y-6"
            >
              {/* Topo da Sidebar: Título, Contador, Limpar e Botão de Recolher */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal
                    className="w-4.5 h-4.5 text-brand"
                    strokeWidth={2}
                  />
                  <h2 className="font-display text-[17px] font-semibold text-ink tracking-[-0.01em]">
                    Filtros
                  </h2>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink font-display text-xs font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-slate-500 hover:text-slate-900 underline font-semibold px-1.5 py-1 cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleSidebar}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 grid place-items-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Recolher filtros"
                    aria-label="Recolher barra lateral de filtros"
                  >
                    <PanelLeftClose className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Categorias */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                  <Tag className="w-3.5 h-3.5 text-brand" />
                  <span>Categorias</span>
                </div>
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto no-scrollbar pr-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectCategory({
                        id: "cat-all",
                        name: "Tudo",
                        slug: "all",
                      })
                    }
                    className={cn(
                      "flex items-center justify-between h-10.5 shrink-0 px-3.5 rounded-full text-[14px] font-semibold transition-colors duration-150 cursor-pointer text-left",
                      activeCategory === "all"
                        ? "bg-brand text-white"
                        : "text-muted hover:bg-media hover:text-ink"
                    )}
                  >
                    <span>Todas as categorias</span>
                    {activeCategory === "all" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                  {mainCategoriesList.map((cat) => {
                    const active = activeCategory === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          handleSelectCategory({
                            id: cat.id,
                            name: cat.name,
                            slug: cat.slug,
                          })
                        }
                        className={cn(
                          "flex items-center justify-between h-10.5 shrink-0 px-3.5 rounded-full text-[14px] font-semibold transition-colors duration-150 cursor-pointer text-left",
                          active
                            ? "bg-brand text-white"
                            : "text-muted hover:bg-media hover:text-ink"
                        )}
                      >
                        <span className="truncate">{cat.name}</span>
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bairro da Loja */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  <span>Bairro da Loja</span>
                </div>
                <Select
                  aria-label="Filtrar por bairro de Bom Jesus da Lapa"
                  inputSize="md"
                  value={selectedNeighborhood}
                  onChange={(e) => handleSelectNeighborhood(e.target.value)}
                  options={[
                    {
                      value: "Toda Bom Jesus da Lapa",
                      label: "Toda Bom Jesus da Lapa",
                    },
                    ...availableNeighborhoods.map((nb) => ({
                      value: nb.name,
                      label: nb.name,
                    })),
                  ]}
                />
              </div>

              {/* Toggles Rápidos (Switches) */}
              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-ink">
                      Lojas abertas agora
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Em atendimento no momento
                    </span>
                  </div>
                  <Switch
                    checked={onlyOpenNow}
                    onCheckedChange={handleToggleOpenNow}
                    aria-label="Filtrar apenas lojas abertas agora"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-ink">
                      Apenas em promoção
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Preços especiais ativos
                    </span>
                  </div>
                  <Switch
                    checked={onlyPromo}
                    onCheckedChange={handleTogglePromo}
                    aria-label="Filtrar apenas produtos em promoção"
                  />
                </div>
              </div>
            </aside>
          )}

          {/* COLUNA PRINCIPAL DE CONTEÚDO */}
          <div className="min-w-0 space-y-6 md:space-y-8">
            {/* Stories: posicionado na coluna de conteúdo (alinhado com o banner e o feed) */}
            <StoriesBar items={stories} className="px-5 md:px-0 pb-1" />

            {/* Pílulas de categoria horizontais (sempre no mobile, e no desktop apenas se a sidebar estiver colapsada) */}
            <div
              className={cn(
                "items-center gap-2.5 pb-2",
                isSidebarOpen ? "flex lg:hidden" : "flex"
              )}
            >
              {/* Botão de Filtros à ESQUERDA (antes de 'Tudo'), visível no desktop quando a sidebar estiver colapsada */}
              {!isSidebarOpen && (
                <button
                  type="button"
                  onClick={handleToggleSidebar}
                  className="hidden lg:inline-flex items-center gap-2 h-10.5 px-4 rounded-full bg-white border border-slate-200 hover:bg-slate-50 font-display text-sm font-bold text-slate-900 shrink-0 transition-colors duration-150 cursor-pointer shadow-xs"
                >
                  <PanelLeftOpen className="w-4 h-4 text-brand" strokeWidth={2} />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-brand text-white font-display text-[11px] font-bold grid place-items-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              )}

              <CategoryPills
                categories={categoryPillsList}
                activeSlug={activeCategory}
                onSelect={handleSelectCategory}
                className="flex-1 min-w-0 px-5 md:px-0"
              />
            </div>
            {/* Banner institucional (somente desktop — no mobile o feed é prioritário) */}
            <PromoBanner
              className="hidden md:block"
              variant="emerald"
              tag="O comércio da Lapa, num só lugar"
              title="Compre das lojas que você já conhece em Bom Jesus da Lapa"
              subtitle="Escolha no catálogo, tire dúvidas no WhatsApp e receba hoje mesmo em casa ou retire na loja."
              ctaLabel="Explorar catálogo"
              onCtaClick={() => router.push("/explorar")}
              imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80"
            />

            {/* Ofertas do dia no topo (somente desktop — no mobile entram intercaladas no feed) */}
            {filteredOffers.length > 0 && (
              <SectionContainer
                title="Ofertas do dia"
                actionLabel="Ver tudo"
                href="/explorar?promocao=true"
                className="hidden md:block pb-2"
              >
                <div
                  className={cn(
                    "grid gap-4",
                    isSidebarOpen
                      ? "grid-cols-2 xl:grid-cols-4"
                      : "grid-cols-2 lg:grid-cols-4"
                  )}
                >
                  {filteredOffers.slice(0, 4).map((product) => (
                    <ProductCardGrid
                      key={product.id}
                      product={product}
                      isFavorite={savedSet.has(product.id)}
                      onAddToBag={() => setBagCount((c) => c + 1)}
                      onToggleFavorite={handleProductFavorite}
                    />
                  ))}
                </div>
              </SectionContainer>
            )}

            {/* Lojas em destaque (mobile: carrossel; desktop: abas + setas) */}
            {featuredStores.length > 0 && (
              <FeaturedStoresSection
                stores={featuredStores}
                showcases={storeShowcases}
                storyStoreIds={storyStoreIds}
                followingIds={followingIds}
                onToggleFollow={handleToggleFollow}
                neighborhood={
                  selectedNeighborhood !== "Toda Bom Jesus da Lapa"
                    ? selectedNeighborhood
                    : null
                }
                className="pb-2"
              />
            )}

            {/* =================================================================
                FEED INFINITO DO COMÉRCIO LOCAL (PRIORITÁRIO NO MOBILE + DESKTOP)
               ================================================================= */}
            <section aria-label="Feed do comércio local" className="space-y-4">
              {/* Barra de Controle: Abas (Toda a Lapa | Seguindo) + Alternador (Feed | Grade) */}
              <div className="px-5 md:px-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {!isSidebarOpen && (
                    <button
                      type="button"
                      onClick={handleToggleSidebar}
                      className="hidden lg:inline-flex items-center gap-2 h-9.5 px-3.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                      title="Abrir barra lateral de filtros"
                    >
                      <PanelLeftOpen className="w-4 h-4 text-brand" strokeWidth={2} />
                      <span>Filtros</span>
                      {activeFiltersCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-brand text-white font-display text-[11px] font-bold grid place-items-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                  )}
                  <div className="hidden md:block">
                    <h2 className="font-display text-[26px] font-semibold text-ink tracking-[-0.02em]">
                      Feed do comércio <span className="aura-text">local</span>
                    </h2>
                    <p className="text-sm text-slate-500">
                      Novidades intercaladas das lojas de Bom Jesus da Lapa
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Abas: Toda a Lapa | Seguindo */}
                  <div
                    role="tablist"
                    aria-label="Origem das publicações"
                    className="flex-1 sm:flex-initial grid h-11 grid-cols-2 p-1 rounded-full bg-seg sm:min-w-64"
                  >
                    {(
                      [
                        ["explorar", "Toda a Lapa"],
                        ["seguindo", "Seguindo"],
                      ] as const
                    ).map(([tab, label]) => (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={feedTab === tab}
                        onClick={() => handleSelectFeedTab(tab)}
                        className={cn(
                          "whitespace-nowrap rounded-full px-4 font-display text-sm font-semibold transition duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light",
                          feedTab === tab
                            ? "bg-white text-ink shadow-seg"
                            : "text-slate-600 hover:text-ink"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Alternador de Visualização: Feed Social vs Grade */}
                  <div
                    role="radiogroup"
                    aria-label="Visualização"
                    className="flex h-11 flex-none gap-0.5 rounded-full bg-seg p-1"
                  >
                    {(
                      [
                        ["feed", "Ver em feed", Rows3],
                        ["grid", "Ver em grade", LayoutGrid],
                      ] as const
                    ).map(([mode, label, Icon]) => (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={viewMode === mode}
                        aria-label={label}
                        title={label}
                        onClick={() => handleChangeViewMode(mode)}
                        className={cn(
                          "grid w-10 cursor-pointer place-items-center rounded-full transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light",
                          viewMode === mode
                            ? "bg-white text-ink shadow-seg"
                            : "text-slate-600 hover:text-ink"
                        )}
                      >
                        <Icon className="size-4.5" strokeWidth={1.9} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lista / Grade de Publicações */}
              {feedItems.length === 0 && !isLoadingFeed ? (
                <div className="mx-5 md:mx-0 rounded-[28px] bg-white p-8 text-center space-y-3">
                  <h3 className="text-[17px] font-extrabold text-slate-900 text-balance">
                    {feedTab === "seguindo"
                      ? "Nada novo das lojas que você segue"
                      : "Nenhum produto neste filtro"}
                  </h3>
                  <p className="text-[13px] text-slate-500 max-w-xs mx-auto leading-normal">
                    {feedTab === "seguindo"
                      ? "Siga suas lojas favoritas de Bom Jesus da Lapa para acompanhar os lançamentos por aqui."
                      : "Escolha outra categoria ou busque em toda Bom Jesus da Lapa."}
                  </p>
                  {feedTab === "seguindo" ? (
                    <Button
                      variant="primary"
                      onClick={() => handleSelectFeedTab("explorar")}
                    >
                      Ver toda a Lapa
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleResetFilters}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : viewMode === "feed" ? (
                <div
                  className={cn(
                    "px-4 sm:px-5 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5",
                    isSidebarOpen ? "xl:grid-cols-3" : "lg:grid-cols-3"
                  )}
                >
                  {feedItems.map((product, index) => (
                    <React.Fragment key={product.id}>
                      <ProductFeedPost
                        product={product}
                        isFavorite={savedSet.has(product.id)}
                        onAddToBag={() => setBagCount((c) => c + 1)}
                        onToggleFavorite={handleProductFavorite}
                        isFollowing={followingIds.has(product.store.id)}
                        onToggleFollow={(p) => void handleToggleFollow(p.store)}
                        hasStory={storyStoreIds.has(product.store.id)}
                      />

                      {/* Ofertas do dia in-feed no mobile: entra após o 2º post sem quebrar o grid desktop */}
                      {index === 1 && filteredOffers.length > 0 && (
                        <div className="md:hidden -mx-4 sm:-mx-5 py-1">
                          <div className="flex items-baseline justify-between px-5 pb-2.5">
                            <h3 className="font-display text-[17px] font-extrabold text-slate-900">
                              Ofertas do dia
                            </h3>
                            <Link
                              href="/explorar?promocao=true"
                              className="text-xs font-bold text-slate-600 hover:text-slate-900"
                            >
                              Ver tudo
                            </Link>
                          </div>
                          <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar">
                            {filteredOffers.map((offer) => (
                              <OfferCard key={offer.id} product={offer} />
                            ))}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    "px-5 md:px-0 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4",
                    isSidebarOpen
                      ? "xl:grid-cols-4"
                      : "lg:grid-cols-4 xl:grid-cols-5"
                  )}
                >
                  {feedItems.map((product) => (
                    <ProductCardGrid
                      key={product.id}
                      product={product}
                      isFavorite={savedSet.has(product.id)}
                      onAddToBag={() => setBagCount((c) => c + 1)}
                      onToggleFavorite={handleProductFavorite}
                    />
                  ))}
                </div>
              )}

              {/* Sentinela única do IntersectionObserver para paginação infinita (Mobile + Desktop) */}
              <div
                ref={loadMoreTriggerRef}
                className="py-5 px-5 flex flex-col items-center justify-center gap-2"
              >
                {isLoadingFeed ? (
                  <div className="inline-flex items-center gap-2 text-[13px] text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Carregando mais publicações…</span>
                  </div>
                ) : !hasMoreFeed && feedItems.length > 0 ? (
                  <p className="text-[13px] text-slate-500 text-center">
                    Você viu todas as publicações recentes.{" "}
                    <Link
                      href="/explorar"
                      className="font-semibold text-slate-900 underline decoration-brand decoration-2 underline-offset-4"
                    >
                      Explorar catálogo com filtros
                    </Link>
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/** Card horizontal de oferta (mobile in-feed): foto 96×112 com badge, loja · bairro e preço De/Por. */
function OfferCard({ product }: { product: ProductItem }) {
  const discountPercent = calculateDiscountPercentage(
    product.price,
    product.promotional_price
  );
  const hasPromo = discountPercent != null && product.promotional_price != null;

  return (
    <Link
      href={`/${product.store.slug}/${product.slug || product.id}`}
      className="flex-none w-70 flex gap-3 p-2.5 rounded-3xl bg-white"
    >
      <div className="relative flex-none w-24 h-28 rounded-[18px] bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {discountPercent != null && (
          <Badge
            variant="discount"
            discountPercent={discountPercent}
            className="absolute top-1.5 left-1.5"
          />
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-0 py-1">
        <span className="font-display text-[15px] font-bold leading-tight text-slate-900 line-clamp-2">
          {product.title}
        </span>
        <span className="text-xs text-slate-500 truncate">
          {product.store.name}
          {product.store.neighborhood ? ` · ${product.store.neighborhood}` : ""}
        </span>
        <div className="flex-1" />
        <div className="flex items-baseline gap-2">
          {hasPromo && (
            <span className="text-xs text-slate-500 line-through">
              {formatCurrencyBRL(product.price)}
            </span>
          )}
          <span className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-slate-900">
            {formatCurrencyBRL(
              hasPromo ? product.promotional_price! : product.price
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
