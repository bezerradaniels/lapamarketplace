"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  Search,
  X,
  RotateCcw,
  Sparkles,
  Clock,
  Tag,
  MapPin,
  CreditCard,
  Layers,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { ProductCardGrid } from "@/components/marketplace/ProductCardGrid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
  { id: "credit_card", label: "Cartão de Crédito" },
  { id: "debit_card", label: "Cartão de Débito" },
  { id: "crediario", label: "Crediário da Loja" },
  { id: "cash", label: "Dinheiro" },
  { id: "payment_link", label: "Link de Pagamento" },
];

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

  const renderFilterControls = () => (
    <div className="space-y-5">
      {/* Cabeçalho Lateral */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-extrabold text-slate-900">
            Filtros do Comércio Local
          </h2>
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar ({activeFiltersCount})</span>
          </button>
        )}
      </div>

      {/* Switches Rápidos: Apenas Lojas Abertas Agora & Apenas Promoção */}
      <div className="space-y-2.5">
        <label className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 p-3.5 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <span className="block text-xs font-extrabold text-slate-900">
                Apenas Lojas Abertas Agora
              </span>
              <span className="block text-[10px] text-slate-500">
                Calculado em tempo real em Lapa
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={onlyOpenNow}
            onChange={(e) => setOnlyOpenNow(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50/70 border border-rose-200/70 p-3.5 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <Tag className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="block text-xs font-extrabold text-slate-900">
                Apenas Produtos em Promoção
              </span>
              <span className="block text-[10px] text-slate-500">
                Preços com desconto ativo (`% OFF`)
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={onlyPromo}
            onChange={(e) => setOnlyPromo(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
        </label>
      </div>

      {/* Categoria Principal e Subcategoria */}
      <div className="space-y-3 pt-1">
        <Select
          label="Categoria Principal"
          value={categorySlug}
          onChange={(e) => {
            setCategorySlug(e.target.value);
            setSubcategorySlug("all");
            setSelectedSize("all");
          }}
          leftIcon={<Layers className="w-4 h-4" />}
          options={[
            { value: "all", label: "Todas as Categorias" },
            ...mainCategories.map((c) => ({
              value: c.slug,
              label: c.name,
            })),
          ]}
        />

        {availableSubcategories.length > 0 && (
          <Select
            label="Subcategoria"
            value={subcategorySlug}
            onChange={(e) => setSubcategorySlug(e.target.value)}
            options={[
              {
                value: "all",
                label: `Todas em ${activeMainCategory?.name}`,
              },
              ...availableSubcategories.map((sub) => ({
                value: sub.slug,
                label: sub.name,
              })),
            ]}
          />
        )}
      </div>

      {/* Bairro da Loja em Bom Jesus da Lapa */}
      <Select
        label="Bairro da Loja em Lapa"
        value={neighborhood}
        onChange={(e) => setNeighborhood(e.target.value)}
        leftIcon={<MapPin className="w-4 h-4" />}
        options={[
          { value: "all", label: "Toda Bom Jesus da Lapa" },
          ...neighborhoods.map((nb) => ({
            value: nb.slug || nb.id,
            label: nb.name,
          })),
        ]}
      />

      {/* Filtros Dinâmicos da Categoria */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          Filtros Dinâmicos da Categoria
        </p>

        {/* Tamanho / Numeração */}
        {dynamicFilterConfig.has_size &&
          (dynamicFilterConfig.size_options?.length ?? 0) > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">
                Tamanho / Numeração
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedSize("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    selectedSize === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                  )}
                >
                  Todos
                </button>
                {(dynamicFilterConfig.size_options || []).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() =>
                      setSelectedSize(selectedSize === sz ? "all" : sz)
                    }
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      selectedSize === sz
                        ? "bg-slate-900 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                    )}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Gênero */}
        {dynamicFilterConfig.has_gender && (
          <Select
            label="Gênero"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            options={[
              { value: "all", label: "Todos os gêneros" },
              { value: "Feminino", label: "Feminino" },
              { value: "Masculino", label: "Masculino" },
              { value: "Unissex", label: "Unissex" },
              { value: "Infantil", label: "Infantil" },
            ]}
          />
        )}

        {/* Voltagem */}
        {dynamicFilterConfig.has_voltage && (
          <Select
            label="Voltagem"
            value={selectedVoltage}
            onChange={(e) => setSelectedVoltage(e.target.value)}
            options={[
              { value: "all", label: "Qualquer voltagem" },
              { value: "220V", label: "220V (Padrão Lapa)" },
              { value: "110V", label: "110V" },
              { value: "Bivolt", label: "Bivolt" },
            ]}
          />
        )}

        {/* Condição (Novo / Seminovo) */}
        <Select
          label="Condição do Produto"
          value={selectedCondition}
          onChange={(e) => setSelectedCondition(e.target.value)}
          options={[
            { value: "all", label: "Novo ou Seminovo" },
            { value: "new", label: "Apenas Novo" },
            { value: "used", label: "Seminovo / Usado" },
          ]}
        />
      </div>

      {/* Forma de Pagamento Aceita pela Loja */}
      <Select
        label="Forma de Pagamento Aceita pela Loja"
        value={selectedPayment}
        onChange={(e) => setSelectedPayment(e.target.value)}
        leftIcon={<CreditCard className="w-4 h-4" />}
        options={PAYMENT_FILTER_OPTIONS.map((p) => ({
          value: p.id,
          label: p.label,
        }))}
      />

      {/* Preço Máximo */}
      <Input
        label="Preço Máximo (R$)"
        type="number"
        min={0}
        placeholder="Ex: 200"
        value={maxPriceText}
        onChange={(e) => setMaxPriceText(e.target.value)}
      />

      <Button
        type="button"
        variant="primary"
        fullWidth
        onClick={() => {
          syncUrlParams();
          setMobileDrawerOpen(false);
        }}
      >
        Ver {filteredProducts.length} resultado(s)
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader
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

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Topo da Busca Global */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Explorar Produtos & Lojas em Bom Jesus da Lapa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {filteredProducts.length} produto(s) encontrado(s) no comércio
              local
              {onlyOpenNow ? " • Apenas lojas abertas agora" : ""}
              {onlyPromo ? " • Em promoção" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Mobile para abrir Drawer de Filtros */}
            <Button
              type="button"
              variant="secondary"
              className="lg:hidden"
              onClick={() => setMobileDrawerOpen(true)}
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            >
              Filtros{" "}
              {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Limpar Tudo
              </Button>
            )}
          </div>
        </div>

        {/* Layout Principal: Sidebar Desktop + Grid de Produtos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar de Filtros (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3 rounded-3xl bg-white p-5 border border-slate-100 shadow-xs sticky top-24">
            {renderFilterControls()}
          </aside>

          {/* Resultados da Busca */}
          <section className="lg:col-span-9 space-y-4">
            {/* Barra de busca textual complementar */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Filtrar por nome da peça, marca, loja ou bairro..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  pill
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery("")}
                >
                  Limpar busca
                </Button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl bg-white p-12 border border-slate-100 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
                <h2 className="text-lg font-extrabold text-slate-900">
                  Nenhum produto corresponde a esses filtros
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Tente remover o filtro de tamanho, aumentar o preço máximo ou
                  buscar em todos os bairros de Bom Jesus da Lapa.
                </p>
                <Button variant="primary" onClick={handleResetFilters}>
                  Redefinir todos os filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
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
          </section>
        </div>
      </main>

      {/* Drawer Mobile de Filtros */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros avançados"
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs"
        >
          <div className="w-full max-h-[88dvh] rounded-t-3xl bg-white p-5 overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-base font-extrabold text-slate-900">
                Filtrar Produtos em Lapa
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Fechar filtros"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderFilterControls()}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

