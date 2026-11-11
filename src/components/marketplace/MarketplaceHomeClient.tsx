"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Compass,
  Crown,
  Flame,
  Loader2,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  Store,
  Users,
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
import { StoreStatusBadge } from "@/components/ui/StoreStatusBadge";
import { ProductCardGrid } from "@/components/marketplace/ProductCardGrid";
import { ProductFeedPost } from "@/components/marketplace/ProductFeedPost";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { Button } from "@/components/ui/Button";
import { getMarketplaceFeed } from "@/app/actions/feed";
import { toggleSaveProduct } from "@/app/actions/social";
import { cn } from "@/lib/utils";
import type {
  CategoryItem,
  GlobalCategory,
  ProductItem,
  StoreSummary,
  StoreWithStories,
} from "@/types/marketplace";

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
}

export function MarketplaceHomeClient({
  stories,
  categories,
  dailyOffers,
  featuredStores,
  recentProducts,
  initialFeed,
  hasMoreFeed: initialHasMore,
  userId,
  savedProductIds,
}: MarketplaceHomeClientProps) {
  const router = useRouter();

  const [selectedNeighborhood, setSelectedNeighborhood] = useState(
    "Toda Bom Jesus da Lapa"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Contadores de Sacola e Favoritos no Header
  const [bagCount, setBagCount] = useState(2);
  const [savedSet, setSavedSet] = useState<Set<string>>(
    () => new Set(savedProductIds)
  );
  const [authModalProduct, setAuthModalProduct] = useState<string | null>(null);

  // Estado do Feed Social Mobile (Abas "Explorar Lapa" | "Seguindo" + Paginação Infinita)
  const [mobileTab, setMobileTab] = useState<"explorar" | "seguindo">(
    "explorar"
  );
  const [feedItems, setFeedItems] = useState<ProductItem[]>(initialFeed);
  const [feedPage, setFeedPage] = useState<number>(1);
  const [hasMoreFeed, setHasMoreFeed] = useState<boolean>(initialHasMore);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);

  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Mapeia categorias globais para as pílulas do topo
  const categoryPillsList: CategoryItem[] = React.useMemo(() => {
    const mainCats = categories.filter((c) => !c.parent_id && c.is_active);
    if (mainCats.length === 0) return DEFAULT_MARKETPLACE_CATEGORIES;

    return [
      { id: "cat-all", name: "Tudo em Lapa", slug: "all" },
      ...mainCats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    ];
  }, [categories]);

  // Recarrega a página 1 do feed quando mudar aba mobile, categoria ou bairro
  const reloadFirstFeedPage = useCallback(
    async (
      nextTab: "explorar" | "seguindo",
      nextCat: string,
      nextNeighborhood: string
    ) => {
      setIsLoadingFeed(true);
      try {
        const res = await getMarketplaceFeed({
          page: 1,
          pageSize: 4,
          tab: nextTab,
          userId,
          categorySlug: nextCat,
          neighborhoodSlug: nextNeighborhood,
        });
        setFeedItems(res.items);
        setFeedPage(1);
        setHasMoreFeed(res.hasMore);
      } finally {
        setIsLoadingFeed(false);
      }
    },
    [userId]
  );

  // Carrega a próxima página ao rolar até o fim da tela (IntersectionObserver)
  const loadNextFeedPage = useCallback(async () => {
    if (isLoadingFeed || !hasMoreFeed) return;
    setIsLoadingFeed(true);
    try {
      const nextPage = feedPage + 1;
      const res = await getMarketplaceFeed({
        page: nextPage,
        pageSize: 4,
        tab: mobileTab,
        userId,
        categorySlug: activeCategory,
        neighborhoodSlug: selectedNeighborhood,
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
    mobileTab,
    userId,
    activeCategory,
    selectedNeighborhood,
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
      { rootMargin: "220px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreFeed, isLoadingFeed, loadNextFeedPage]);

  const handleSelectCategory = (cat: CategoryItem) => {
    setActiveCategory(cat.slug);
    void reloadFirstFeedPage(mobileTab, cat.slug, selectedNeighborhood);
  };

  const handleSelectNeighborhood = (nb: string) => {
    setSelectedNeighborhood(nb);
    void reloadFirstFeedPage(mobileTab, activeCategory, nb);
  };

  const handleSelectMobileTab = (tab: "explorar" | "seguindo") => {
    setMobileTab(tab);
    void reloadFirstFeedPage(tab, activeCategory, selectedNeighborhood);
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
      setAuthModalProduct(product.title);
    }
  };

  // Filtra produtos na visão Desktop conforme categoria e bairro ativos
  const filterDesktopProducts = (list: ProductItem[]) =>
    list.filter((p) => {
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

  const filteredOffers = filterDesktopProducts(dailyOffers);
  const filteredRecent = filterDesktopProducts(recentProducts);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Topo Comum: Header Global */}
      <MarketplaceHeader
        selectedNeighborhood={selectedNeighborhood}
        onNeighborhoodChange={handleSelectNeighborhood}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        bagCount={bagCount}
        favoritesCount={savedSet.size}
      />

      <AuthPromptModal
        isOpen={Boolean(authModalProduct)}
        onClose={() => setAuthModalProduct(null)}
        reason="favorite"
        itemName={authModalProduct || undefined}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 sm:space-y-8">
        {/* Topo Comum: Barra de Stories 24h (Lojas Premium) + Pílulas de Categorias */}
        <div className="space-y-4">
          <StoriesBar items={stories} />

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CategoryPills
                categories={categoryPillsList}
                activeSlug={activeCategory}
                onSelect={handleSelectCategory}
              />
            </div>

            <Link
              href="/explorar"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 px-4 py-2 text-xs font-bold text-slate-800 shrink-0 shadow-2xs transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filtros Avançados</span>
            </Link>
          </div>
        </div>

        {/* =========================================================
            VISÃO MOBILE (md:hidden): FEED SOCIAL ESTILO INSTAGRAM
           ========================================================= */}
        <div className="md:hidden space-y-5">
          {/* Seletor de Abas Fixo: "Explorar Lapa" | "Seguindo" */}
          <div className="sticky top-28 z-30 bg-slate-50/95 backdrop-blur-md py-1.5">
            <div className="grid grid-cols-2 rounded-full bg-white p-1 border border-slate-200/80 shadow-xs">
              <button
                type="button"
                onClick={() => handleSelectMobileTab("explorar")}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-extrabold transition-all cursor-pointer",
                  mobileTab === "explorar"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Explorar Lapa</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMobileTab("seguindo")}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-extrabold transition-all cursor-pointer",
                  mobileTab === "seguindo"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Seguindo</span>
              </button>
            </div>
          </div>

          {/* Lista Vertical de ProductFeedPost com Rolagem Infinita */}
          {feedItems.length === 0 && !isLoadingFeed ? (
            <div className="rounded-3xl bg-white p-8 border border-slate-100 text-center space-y-3">
              <Store className="w-10 h-10 text-slate-300 mx-auto" />
              <h2 className="text-base font-extrabold text-slate-900">
                {mobileTab === "seguindo"
                  ? "Nenhuma publicação das lojas que você segue"
                  : "Nenhum produto encontrado neste filtro"}
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {mobileTab === "seguindo"
                  ? "Siga suas lojas favoritas de Bom Jesus da Lapa para acompanhar os lançamentos delas aqui!"
                  : "Experimente selecionar outra categoria ou buscar em toda Bom Jesus da Lapa."}
              </p>
              {mobileTab === "seguindo" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSelectMobileTab("explorar")}
                >
                  Explorar todas as lojas
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {feedItems.map((product) => (
                <ProductFeedPost
                  key={product.id}
                  product={product}
                  isFavorite={savedSet.has(product.id)}
                  onAddToBag={() => setBagCount((c) => c + 1)}
                  onToggleFavorite={handleProductFavorite}
                />
              ))}
            </div>
          )}

          {/* Sentinela do IntersectionObserver para Paginação Infinita */}
          <div
            ref={loadMoreTriggerRef}
            className="py-4 flex flex-col items-center justify-center gap-2"
          >
            {isLoadingFeed ? (
              <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Carregando mais achadinhos de Lapa...</span>
              </div>
            ) : !hasMoreFeed && feedItems.length > 0 ? (
              <div className="text-center space-y-2">
                <p className="text-xs font-semibold text-slate-400">
                  Você viu todas as novidades recentes ✨
                </p>
                <Link
                  href="/explorar"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-800"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Abrir Busca com Filtros Avançados</span>
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* =========================================================
            VISÃO DESKTOP (hidden md:block): VITRINE ESTILO MERCADO LIVRE
           ========================================================= */}
        <div className="hidden md:block space-y-10">
          {/* 1. PromoBanner no Topo */}
          <PromoBanner
            tag="Especial Comércio de Lapa"
            discountBadge="ATÉ 30% OFF NO PIX"
            title="Vitrine Digital das Lojas de Bom Jesus da Lapa"
            subtitle="Compre das lojas físicas que você já conhece e confia. Escolha no catálogo, tire dúvidas no WhatsApp e receba hoje mesmo em casa."
            ctaLabel="Explorar catálogo completo"
            onCtaClick={() => router.push("/explorar")}
            imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80"
          />

          {/* 2. Seção: 🔥 Ofertas do Dia em Lapa */}
          <SectionContainer
            title="🔥 Ofertas do Dia em Lapa"
            subtitle="Peças e produtos com desconto promocional ativo hoje nas lojas da cidade"
            actionLabel="Ver todas as promoções"
            href="/explorar?promocao=true"
          >
            {filteredOffers.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 border border-slate-100 text-center text-sm text-slate-500">
                Nenhuma oferta promocional encontrada para este filtro.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
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
            )}
          </SectionContainer>

          {/* 3. Seção: ⭐ Lojas em Destaque */}
          <SectionContainer
            title="⭐ Lojas em Destaque"
            subtitle="Comércios verificados de Bom Jesus da Lapa com atendimento direto no WhatsApp"
            actionLabel="Explorar todas as lojas"
            href="/explorar"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredStores.map((store) => (
                <div
                  key={store.id}
                  className="group rounded-3xl bg-white p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/${store.slug}`}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <div className="w-13 h-13 rounded-2xl bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                          {store.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={store.avatar_url}
                              alt={store.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <Store className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h3 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                              {store.name}
                            </h3>
                            {store.is_verified && (
                              <BadgeCheck
                                className="w-4 h-4 text-blue-600 shrink-0"
                                aria-label="Loja Verificada"
                              />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">
                              {store.neighborhood}
                            </span>
                          </p>
                        </div>
                      </Link>

                      {store.plan === "premium" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 shrink-0">
                          <Crown className="w-3 h-3" />
                          <span>Destaque</span>
                        </span>
                      )}
                    </div>

                    {store.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {store.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <StoreStatusBadge
                      compact
                      storeName={store.name}
                      businessHours={store.business_hours}
                      specialHours={store.special_hours}
                      isOpenOverride={store.is_open_override}
                    />

                    <Link
                      href={`/${store.slug}`}
                      className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold transition-colors shrink-0"
                    >
                      Ver Vitrine
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </SectionContainer>

          {/* 4. Seção: 📦 Novidades no Comércio Local (Grid de 4 a 5 colunas) */}
          <SectionContainer
            title="📦 Novidades no Comércio Local"
            subtitle="Lançamentos intercalados das lojas parceiras de Bom Jesus da Lapa"
            actionLabel="Filtrar todos os produtos"
            href="/explorar"
          >
            {filteredRecent.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 border border-slate-100 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  Nenhum produto encontrado para o filtro selecionado.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveCategory("all");
                    setSelectedNeighborhood("Toda Bom Jesus da Lapa");
                  }}
                >
                  Limpar filtros rápidos
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredRecent.map((product) => (
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
          </SectionContainer>

          {/* Banner Inferior de Convite para Busca Avançada */}
          <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Procurando um tamanho, numeração ou bairro específico?
                </h3>
                <p className="text-xs text-slate-500">
                  Use a busca avançada para filtrar por lojas abertas agora,
                  crediário, voltagem 220V ou numeração.
                </p>
              </div>
            </div>

            <Link href="/explorar">
              <Button
                variant="primary"
                leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              >
                Abrir Página Explorar
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
