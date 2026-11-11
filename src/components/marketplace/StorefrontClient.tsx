"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { StoreStatusBadge } from "@/components/ui/StoreStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductCardGrid } from "@/components/marketplace/ProductCardGrid";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { toggleFollowStore, toggleSaveProduct } from "@/app/actions/social";
import { getStoreOpenStatus } from "@/lib/store-hours";
import {
  buildWhatsAppUrl,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
import type {
  PaymentMethod,
  ProductItem,
  StoreSummary,
} from "@/types/marketplace";

export interface StoreCategoryPill {
  slug: string;
  name: string;
  count: number;
}

export interface StorefrontClientProps {
  store: StoreSummary;
  products: ProductItem[];
  storeCategories: StoreCategoryPill[];
  initialIsFollowing: boolean;
  savedProductIds: string[];
}

export function StorefrontClient({
  store,
  products,
  storeCategories,
  initialIsFollowing,
  savedProductIds,
}: StorefrontClientProps) {
  const [internalQuery, setInternalQuery] = useState("");
  const [activeCategorySlug, setActiveCategorySlug] = useState("all");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(
    store.followers_count ?? 85
  );
  const [bagCount, setBagCount] = useState(2);
  const [savedSet, setSavedSet] = useState<Set<string>>(
    () => new Set(savedProductIds)
  );
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal de autenticação (para Seguir Loja ou Favoritar Produto)
  const [authModalReason, setAuthModalReason] = useState<
    "follow" | "favorite" | null
  >(null);
  const [authModalItemName, setAuthModalItemName] = useState<string>("");

  const openStatus = useMemo(
    () =>
      getStoreOpenStatus({
        businessHours: store.business_hours,
        specialHours: store.special_hours,
        isOpenOverride: store.is_open_override,
      }),
    [store.business_hours, store.special_hours, store.is_open_override]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (
        activeCategorySlug !== "all" &&
        p.category_slug !== activeCategorySlug
      ) {
        return false;
      }
      if (internalQuery.trim()) {
        const q = internalQuery.trim().toLowerCase();
        const match =
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [products, activeCategorySlug, internalQuery]);

  const handleFollowToggle = async () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));

    const res = await toggleFollowStore(store.id);
    if (res?.requiresAuth) {
      setAuthModalReason("follow");
      setAuthModalItemName(store.name);
    }
  };

  const handleProductFavorite = async (product: ProductItem, next: boolean) => {
    setSavedSet((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(product.id);
      else copy.delete(product.id);
      return copy;
    });

    const res = await toggleSaveProduct(product.id);
    if (res?.requiresAuth) {
      setAuthModalReason("favorite");
      setAuthModalItemName(product.title);
    }
  };

  const handleShareCatalog = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://lapamarketplace.com.br/${store.slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Silencioso
    }
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2200);
  };

  const acceptedPayments: PaymentMethod[] = store.payment_methods?.length
    ? store.payment_methods
    : ["pix", "credit_card", "cash"];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader
        bagCount={bagCount}
        favoritesCount={savedSet.size}
      />

      <AuthPromptModal
        isOpen={Boolean(authModalReason)}
        onClose={() => setAuthModalReason(null)}
        reason={authModalReason || "follow"}
        itemName={authModalItemName}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* =========================================================
            1. CABEÇALHO COMPLETO DA LOJA (BANNER, AVATAR, STATUS, SEGUIR)
           ========================================================= */}
        <section className="rounded-3xl bg-white border border-slate-100 shadow-xs overflow-hidden">
          {/* Banner de Capa */}
          <div className="relative h-40 sm:h-56 w-full bg-slate-900 overflow-hidden">
            {store.banner_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.banner_url}
                alt={`Capa de ${store.name}`}
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
                <span className="text-white/20 text-2xl font-extrabold tracking-widest uppercase">
                  {store.name} • Bom Jesus da Lapa
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Bloco Principal de Identidade da Loja */}
          <div className="px-5 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-10 sm:-mt-12 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Avatar Redondo com Borda */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-1.5 shadow-md border border-slate-100 shrink-0">
                  <div className="w-full h-full rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">
                    {store.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={store.avatar_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {store.name}
                    </h1>
                    {store.is_verified && <Badge variant="verified" />}
                  </div>

                  {/* Bairro + Endereço em texto + StoreStatusBadge */}
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                      <MapPin
                        className="w-4 h-4 text-emerald-600 shrink-0"
                        aria-hidden="true"
                      />
                      {store.neighborhood}, Bom Jesus da Lapa
                    </span>
                    {store.address && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{store.address}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <StoreStatusBadge
                      storeName={store.name}
                      businessHours={store.business_hours}
                      specialHours={store.special_hours}
                      isOpenOverride={store.is_open_override}
                    />

                    {/* Contadores da Loja */}
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                      {products.length} peças ativas
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {followersCount} seguidores
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões: Seguir Loja, Compartilhar Link e Chamar no WhatsApp */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant={isFollowing ? "secondary" : "primary"}
                  onClick={handleFollowToggle}
                  leftIcon={
                    isFollowing ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )
                  }
                >
                  {isFollowing ? "Seguindo Loja" : "Seguir Loja"}
                </Button>

                <a
                  href={buildWhatsAppUrl({
                    phone: store.whatsapp,
                    storeName: store.name,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    type="button"
                    variant="whatsapp"
                    leftIcon={<MessageCircle className="w-4 h-4" />}
                  >
                    Falar no WhatsApp
                  </Button>
                </a>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleShareCatalog}
                  leftIcon={
                    copiedLink ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )
                  }
                >
                  {copiedLink ? "Link Copiado!" : "Compartilhar"}
                </Button>
              </div>
            </div>

            {store.description && (
              <p className="mt-4 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                {store.description}
              </p>
            )}
          </div>
        </section>

        {/* =========================================================
            2. BARRA DE BUSCA INTERNA DA LOJA + PÍLULAS DE CATEGORIAS
           ========================================================= */}
        <section className="rounded-3xl bg-white p-4 sm:p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Pílulas de Categorias da Loja */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setActiveCategorySlug("all")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer",
                  activeCategorySlug === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
                )}
              >
                Todos ({products.length})
              </button>

              {storeCategories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveCategorySlug(cat.slug)}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer",
                    activeCategorySlug === cat.slug
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
                  )}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>

            {/* Busca Interna da Loja */}
            <div className="w-full sm:w-80 shrink-0">
              <Input
                placeholder={`Buscar em ${store.name}...`}
                value={internalQuery}
                onChange={(e) => setInternalQuery(e.target.value)}
                pill
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            3. GRID DE PRODUTOS DA LOJA (grid-cols-2 md:grid-cols-4 gap-4)
           ========================================================= */}
        <section aria-label={`Produtos de ${store.name}`}>
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 border border-slate-100 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-base font-extrabold text-slate-900">
                Nenhum produto encontrado nesta busca
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInternalQuery("");
                  setActiveCategorySlug("all");
                }}
              >
                Ver todos os produtos da loja
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* =========================================================
            4. RODAPÉ INFORMATIVO DA LOJA (PAGAMENTOS, ENTREGA & HORÁRIOS)
           ========================================================= */}
        <section className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bloco 1: Formas de Pagamento Aceitas + Parcelamento */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Formas de Pagamento Aceitas</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {acceptedPayments.map((pm) => (
                  <Badge
                    key={pm}
                    variant="payment"
                    paymentMethod={pm}
                    size="md"
                  />
                ))}
              </div>

              {store.installment_info && (
                <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 rounded-2xl px-3.5 py-2.5">
                  💳 {store.installment_info}
                </p>
              )}
            </div>

            {/* Bloco 2: Opções de Entrega & Retirada em Bom Jesus da Lapa */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Entrega & Retirada na Loja</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                {store.has_delivery !== false && (
                  <li className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <span className="font-bold text-slate-900 block">
                      🛵 Entrega por Motoboy em Bom Jesus da Lapa
                    </span>
                    <span>
                      {store.delivery_fee_type === "free"
                        ? "Frete Grátis para a cidade"
                        : store.delivery_fee_type === "fixed" &&
                          store.delivery_fee != null
                        ? `Taxa fixa de ${formatCurrencyBRL(
                            store.delivery_fee
                          )}`
                        : "Taxa a combinar pelo bairro no WhatsApp"}
                    </span>
                  </li>
                )}

                {store.has_pickup !== false && (
                  <li className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <span className="font-bold text-slate-900 block">
                      🏪 Retirada Grátis no Balcão
                    </span>
                    <span>
                      {store.address || store.neighborhood} — Bom Jesus da Lapa
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Bloco 3: Horários de Funcionamento Completos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Horários de Funcionamento</span>
              </div>

              <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-1 text-xs">
                {openStatus.weeklySchedule.map((day) => (
                  <li
                    key={day.dayOfWeek}
                    className={cn(
                      "py-1.5 flex items-center justify-between gap-2",
                      day.isToday
                        ? "font-extrabold text-slate-900"
                        : "text-slate-600"
                    )}
                  >
                    <span>
                      {day.shortName} {day.isToday ? "(Hoje)" : ""}
                    </span>
                    <span className={day.isClosed ? "text-rose-500" : ""}>
                      {day.hoursText}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
