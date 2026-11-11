"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Search, Share } from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { StoreStatusBadge } from "@/components/ui/StoreStatusBadge";
import {
  Button,
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
} from "@/components/ui/Button";
import { CategoryPills } from "@/components/ui/CategoryPills";
import { VerifiedSeal } from "@/components/brand/LapaSymbol";
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

  const isPremium = store.plan === "premium" || store.plan === "pro";
  const paymentSummary = [
    acceptedPayments.includes("pix") ? "Pix" : null,
    acceptedPayments.includes("credit_card") ? "Cartão" : null,
  ]
    .filter(Boolean)
    .join(" · ") ||
    PAYMENT_SHORT_LABELS[acceptedPayments[0]] ||
    "A combinar";

  const deliveryText = [
    store.has_delivery !== false
      ? store.delivery_fee_type === "free"
        ? "Entrega grátis na cidade"
        : store.delivery_fee_type === "fixed" && store.delivery_fee != null
        ? `Entrega no bairro (${formatCurrencyBRL(store.delivery_fee)})`
        : "Entrega com taxa a combinar"
      : null,
    store.has_pickup !== false ? "retirada na loja" : null,
  ]
    .filter(Boolean)
    .join(" ou ");

  const iconButtonClasses =
    "w-10 h-10 rounded-[14px] bg-white grid place-items-center text-slate-900 cursor-pointer transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900";
  const eyebrowClasses =
    "text-xs font-semibold uppercase tracking-[0.08em] text-slate-500";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader
        mobileVariant="hidden"
        bagCount={bagCount}
        favoritesCount={savedSet.size}
      />

      <AuthPromptModal
        isOpen={Boolean(authModalReason)}
        onClose={() => setAuthModalReason(null)}
        reason={authModalReason || "follow"}
        itemName={authModalItemName}
      />

      <main className="flex-1 mx-auto w-full max-w-5xl md:px-6 lg:px-8 md:py-6 pb-28 md:pb-10">
        {/* Banner da loja */}
        <div className="relative h-42.5 md:h-60 w-full bg-brand-soft md:rounded-[28px] overflow-hidden">
          {store.banner_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.banner_url}
              alt={`Capa de ${store.name}`}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-[max(1rem,env(safe-area-inset-top))] inset-x-4 flex justify-between">
            <Link href="/" aria-label="Voltar" className={iconButtonClasses}>
              <ChevronLeft className="w-4.5 h-4.5" strokeWidth={2} />
            </Link>
            <button
              type="button"
              onClick={handleShareCatalog}
              aria-label={copiedLink ? "Link copiado" : "Compartilhar loja"}
              className={iconButtonClasses}
            >
              {copiedLink ? (
                <Check className="w-4.5 h-4.5 text-whatsapp" strokeWidth={2} />
              ) : (
                <Share className="w-4.5 h-4.5" strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>

        {/* Card da loja, sobreposto ao banner */}
        <section className="relative -mt-9 mx-3 md:mx-6 bg-white rounded-[28px] p-4 md:p-6 flex flex-col gap-3.5">
          <div className="flex gap-3 items-center">
            <span
              className={cn(
                "flex-none w-17 h-17 rounded-full p-0.75",
                isPremium ? "bg-story-premium" : "bg-brand"
              )}
            >
              <span className="w-full h-full rounded-full bg-brand-soft ring-[3px] ring-white overflow-hidden grid place-items-center font-display text-xl font-extrabold text-slate-900">
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
            <div className="flex-1 min-w-0 flex flex-col gap-0.75">
              <h1 className="flex items-center gap-1.5 text-xl md:text-[26px] font-extrabold tracking-[-0.02em] text-slate-900 leading-tight">
                <span className="truncate">{store.name}</span>
                {store.is_verified && <VerifiedSeal size={18} />}
              </h1>
              <span className="text-xs md:text-[13px] text-slate-500 truncate">
                {store.neighborhood}
                {store.address ? ` · ${store.address}` : ""}
              </span>
              <StoreStatusBadge
                className="self-start mt-0.5"
                storeName={store.name}
                businessHours={store.business_hours}
                specialHours={store.special_hours}
                isOpenOverride={store.is_open_override}
              />
            </div>
          </div>

          {store.description && (
            <p className="text-sm text-slate-700 leading-normal text-pretty">
              {store.description}
            </p>
          )}

          <div className="grid grid-cols-3 text-center py-2.5 rounded-[18px] bg-slate-50">
            {[
              [String(products.length), "produtos"],
              [formatCompactCount(followersCount), "seguidores"],
              [paymentSummary, "pagamento"],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col min-w-0 px-1">
                <span className="font-display text-[17px] font-extrabold text-slate-900 truncate">
                  {value}
                </span>
                <span className="text-[11px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1"
              variant={isFollowing ? "secondary" : "primary"}
              aria-pressed={isFollowing}
              onClick={handleFollowToggle}
            >
              {isFollowing ? "Seguindo" : "Seguir loja"}
            </Button>
            <a
              href={buildWhatsAppUrl({
                phone: store.whatsapp,
                storeName: store.name,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonBaseClasses,
                buttonVariantClasses.whatsapp,
                buttonSizeClasses.md,
                "flex-1"
              )}
            >
              WhatsApp
            </a>
          </div>
        </section>

        {/* Busca interna + categorias da loja */}
        <div className="px-5 md:px-6 pt-4 pb-3">
          <Input
            inputSize="md"
            type="search"
            aria-label={`Buscar na ${store.name}`}
            placeholder={`Buscar na ${store.name}`}
            value={internalQuery}
            onChange={(e) => setInternalQuery(e.target.value)}
            leftIcon={<Search className="w-4.25 h-4.25" strokeWidth={1.8} />}
          />
        </div>

        <CategoryPills
          size="sm"
          className="px-5 md:px-6 pb-4"
          activeSlug={activeCategorySlug}
          onSelect={(cat) => setActiveCategorySlug(cat.slug)}
          categories={[
            { id: "all", name: "Tudo", slug: "all" },
            ...storeCategories.map((cat) => ({
              id: cat.slug,
              name: cat.name,
              slug: cat.slug,
            })),
          ]}
        />

        {/* Grid de produtos */}
        <section
          aria-label={`Produtos de ${store.name}`}
          className="px-5 md:px-6 pb-5"
        >
          {filteredProducts.length === 0 ? (
            <div className="rounded-[28px] bg-white p-8 text-center space-y-3">
              <p className="font-display text-[17px] font-extrabold text-slate-900">
                Nenhum produto nesta busca
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setInternalQuery("");
                  setActiveCategorySlug("all");
                }}
              >
                Ver todos os produtos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((product) => (
                <ProductCardGrid
                  key={product.id}
                  product={product}
                  hideStore
                  isFavorite={savedSet.has(product.id)}
                  onAddToBag={() => setBagCount((c) => c + 1)}
                  onToggleFavorite={handleProductFavorite}
                />
              ))}
            </div>
          )}
        </section>

        {/* Como comprar */}
        <section className="mx-3 md:mx-6 bg-white rounded-[28px] p-4.5 md:p-6 flex flex-col gap-4">
          <h2 className="text-[17px] font-extrabold text-slate-900">
            Como comprar
          </h2>
          <div className="grid gap-4 md:grid-cols-3 md:gap-8">
            <div className="flex flex-col gap-1.5">
              <span className={eyebrowClasses}>Pagamento</span>
              <div className="flex flex-wrap gap-1.5">
                {acceptedPayments.map((pm) => (
                  <span
                    key={pm}
                    className="px-2.75 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-900"
                  >
                    {PAYMENT_SHORT_LABELS[pm] ?? pm}
                  </span>
                ))}
              </div>
              {store.installment_info && (
                <span className="text-[13px] text-slate-500">
                  {store.installment_info}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={eyebrowClasses}>Entrega</span>
              <span className="text-sm text-slate-900 first-letter:uppercase">
                {deliveryText || "Combine com a loja pelo WhatsApp"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={eyebrowClasses}>Horários</span>
              {openStatus.weeklySchedule.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className={cn(
                    "flex justify-between gap-3 text-sm text-slate-900",
                    day.isToday && "font-semibold"
                  )}
                >
                  <span>
                    {day.dayName}
                    {day.isToday ? " · hoje" : ""}
                  </span>
                  <span className={day.isToday ? "" : "text-slate-500"}>
                    {day.hoursText}
                  </span>
                </div>
              ))}
              {openStatus.specialHours.map((sp, idx) => (
                <span
                  key={sp.id ?? `${sp.date}-${idx}`}
                  className="mt-1 px-3 py-2.5 rounded-[14px] bg-amber-100 text-amber-800 text-xs font-semibold"
                >
                  {sp.date} · {sp.label} —{" "}
                  {sp.isClosed
                    ? "fechada"
                    : `aberto ${sp.openTime} às ${sp.closeTime}`}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer className="hidden md:block" />
    </div>
  );
}

const PAYMENT_SHORT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Crédito",
  debit_card: "Débito",
  cash: "Dinheiro",
  payment_link: "Link de pagamento",
  boleto: "Boleto",
  crediario: "Crediário",
};

function formatCompactCount(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })} mil`;
}
