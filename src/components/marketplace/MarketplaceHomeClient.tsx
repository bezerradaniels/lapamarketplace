"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, SlidersHorizontal } from "lucide-react";
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
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { Button } from "@/components/ui/Button";
import { getMarketplaceFeed } from "@/app/actions/feed";
import { toggleSaveProduct } from "@/app/actions/social";
import { Badge } from "@/components/ui/Badge";
import { VerifiedSeal } from "@/components/brand/LapaSymbol";
import { calculateDiscountPercentage, cn, formatCurrencyBRL } from "@/lib/utils";
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
      { id: "cat-all", name: "Tudo", slug: "all" },
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

      <main className="flex-1 mx-auto w-full max-w-7xl md:px-6 lg:px-8 md:py-6 pb-48 md:pb-10">
        {/* Stories + pílulas de categoria */}
        <StoriesBar items={stories} className="px-5 md:px-0 pb-4.5" />

        <div className="flex items-center gap-3 pb-6">
          <CategoryPills
            categories={categoryPillsList}
            activeSlug={activeCategory}
            onSelect={handleSelectCategory}
            className="flex-1 min-w-0 px-5 md:px-0"
          />
          <Link
            href="/explorar"
            className="hidden md:inline-flex items-center gap-2 h-10.5 px-4 rounded-[14px] bg-white ring-line hover:bg-slate-50 font-display text-sm font-bold text-slate-900 shrink-0 transition-colors duration-150"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={1.8} />
            Filtros
          </Link>
        </div>

        {/* Banner institucional (desktop) */}
        <PromoBanner
          className="hidden md:block mb-10"
          variant="emerald"
          tag="O comércio da Lapa, num só lugar"
          title="Compre das lojas que você já conhece em Bom Jesus da Lapa"
          subtitle="Escolha no catálogo, tire dúvidas no WhatsApp e receba hoje mesmo em casa ou retire na loja."
          ctaLabel="Explorar catálogo"
          onCtaClick={() => router.push("/explorar")}
          imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80"
        />

        {/* Ofertas do dia */}
        {filteredOffers.length > 0 && (
          <SectionContainer
            title="Ofertas do dia"
            actionLabel="Ver tudo"
            href="/explorar?promocao=true"
            headerClassName="px-5 md:px-0"
            className="pb-6.5 md:pb-10"
          >
            {/* Mobile: cards horizontais de 280px */}
            <div className="md:hidden flex gap-3 px-5 overflow-x-auto no-scrollbar">
              {filteredOffers.map((product) => (
                <OfferCard key={product.id} product={product} />
              ))}
            </div>

            {/* Desktop: grid */}
            <div className="hidden md:grid grid-cols-4 gap-4">
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

        {/* Lojas em destaque (desktop) */}
        {featuredStores.length > 0 && (
          <SectionContainer
            title="Lojas em destaque"
            subtitle="Comércios de Bom Jesus da Lapa com atendimento direto no WhatsApp"
            actionLabel="Ver todas"
            href="/explorar"
            className="hidden md:block pb-10"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredStores.map((store) => {
                const isPremium = store.plan === "premium";
                return (
                  <div
                    key={store.id}
                    className="rounded-3xl bg-white p-4 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <Link
                        href={`/${store.slug}`}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <span
                          className={cn(
                            "w-13 h-13 rounded-full p-0.5 shrink-0",
                            isPremium ? "bg-story-premium" : "bg-slate-200"
                          )}
                        >
                          <span className="w-full h-full rounded-full bg-brand-soft ring-2 ring-white overflow-hidden grid place-items-center font-display text-sm font-extrabold text-slate-900">
                            {store.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={store.avatar_url}
                                alt={store.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              store.name.slice(0, 2).toUpperCase()
                            )}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-[15px] font-bold text-slate-900 truncate">
                              {store.name}
                            </h3>
                            {store.is_verified && <VerifiedSeal size={16} />}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {store.neighborhood}
                          </p>
                        </div>
                      </Link>

                      {store.description && (
                        <p className="text-[13px] text-slate-700 line-clamp-2 leading-normal">
                          {store.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <StoreStatusBadge
                        compact
                        storeName={store.name}
                        businessHours={store.business_hours}
                        specialHours={store.special_hours}
                        isOpenOverride={store.is_open_override}
                      />
                      <Link
                        href={`/${store.slug}`}
                        className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2.25 font-display text-xs font-bold text-slate-900 transition-colors duration-150 shrink-0"
                      >
                        Ver loja
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionContainer>
        )}

        {/* Novidades no comércio local */}
        <SectionContainer
          title="Novidades no comércio local"
          actionLabel="Ver tudo"
          href="/explorar"
          headerClassName="px-5 md:px-0"
        >
          {/* Mobile: Explorar | Seguindo + grid de 2 colunas com rolagem infinita */}
          <div className="md:hidden px-5 space-y-3">
            <div
              role="tablist"
              aria-label="Origem das novidades"
              className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100"
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
                  aria-selected={mobileTab === tab}
                  onClick={() => handleSelectMobileTab(tab)}
                  className={cn(
                    "h-10 rounded-[13px] font-display text-[13px] font-bold transition duration-150 cursor-pointer",
                    mobileTab === tab
                      ? "bg-white text-slate-900 shadow-seg"
                      : "text-slate-500"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {feedItems.length === 0 && !isLoadingFeed ? (
              <div className="rounded-[28px] bg-white p-6 text-center space-y-3">
                <h2 className="text-[17px] font-extrabold text-slate-900 text-balance">
                  {mobileTab === "seguindo"
                    ? "Nada novo das lojas que você segue"
                    : "Nenhum produto neste filtro"}
                </h2>
                <p className="text-[13px] text-slate-500 max-w-xs mx-auto leading-normal">
                  {mobileTab === "seguindo"
                    ? "Siga suas lojas favoritas de Bom Jesus da Lapa para acompanhar os lançamentos por aqui."
                    : "Escolha outra categoria ou busque em toda Bom Jesus da Lapa."}
                </p>
                {mobileTab === "seguindo" && (
                  <Button
                    variant="primary"
                    onClick={() => handleSelectMobileTab("explorar")}
                  >
                    Ver toda a Lapa
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
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

            {/* Sentinela do IntersectionObserver para paginação infinita */}
            <div
              ref={loadMoreTriggerRef}
              className="py-3 flex flex-col items-center justify-center gap-2"
            >
              {isLoadingFeed ? (
                <div className="inline-flex items-center gap-2 text-[13px] text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Carregando mais novidades…</span>
                </div>
              ) : !hasMoreFeed && feedItems.length > 0 ? (
                <p className="text-[13px] text-slate-500">
                  Você viu todas as novidades.{" "}
                  <Link
                    href="/explorar"
                    className="font-semibold text-slate-900 underline decoration-brand decoration-2 underline-offset-4"
                  >
                    Explorar com filtros
                  </Link>
                </p>
              ) : null}
            </div>
          </div>

          {/* Desktop: grid de 4–5 colunas */}
          <div className="hidden md:block">
            {filteredRecent.length === 0 ? (
              <div className="rounded-[28px] bg-white p-10 text-center space-y-3">
                <p className="font-display text-[17px] font-extrabold text-slate-900">
                  Nenhum produto para o filtro selecionado.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveCategory("all");
                    setSelectedNeighborhood("Toda Bom Jesus da Lapa");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
          </div>
        </SectionContainer>
      </main>

      <Footer />
    </div>
  );
}

/** Card horizontal de oferta (mobile): foto 96×112 com badge, loja · bairro e preço De/Por. */
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
