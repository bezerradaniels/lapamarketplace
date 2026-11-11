"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Heart, Share } from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VerifiedSeal } from "@/components/brand/LapaSymbol";
import { StoreStatusBadge } from "@/components/ui/StoreStatusBadge";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { ProductCardGrid } from "@/components/marketplace/ProductCardGrid";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { useBagStore } from "@/store/useBagStore";
import {
  incrementProductViewAction,
  incrementProductWhatsappClickAction,
} from "@/app/actions/feed";
import { toggleSaveProduct } from "@/app/actions/social";
import {
  buildWhatsAppUrl,
  calculateDiscountPercentage,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
import type {
  PaymentMethod,
  ProductItem,
  StoreSummary,
} from "@/types/marketplace";

export interface ProductDetailClientProps {
  product: ProductItem;
  store: StoreSummary;
  relatedProducts: ProductItem[];
  initialIsSaved: boolean;
}

export function ProductDetailClient({
  product,
  store,
  relatedProducts,
  initialIsSaved,
}: ProductDetailClientProps) {
  const images = useMemo(() => {
    const list = [product.image_url];
    if (product.gallery_urls && product.gallery_urls.length > 0) {
      for (const u of product.gallery_urls) {
        if (u && !list.includes(u)) list.push(u);
      }
    }
    return list;
  }, [product.image_url, product.gallery_urls]);

  const [activeImage, setActiveImage] = useState(images[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [bagCount, setBagCount] = useState(2);
  const [addedToBagFeedback, setAddedToBagFeedback] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const addProduct = useBagStore((s) => s.addProduct);

  // Incrementa silenciosamente `views_count` ao abrir a página do produto
  useEffect(() => {
    void incrementProductViewAction(product.id);
  }, [product.id]);

  const discountPercent = calculateDiscountPercentage(
    product.price,
    product.promotional_price
  );
  const hasPromo =
    discountPercent != null &&
    product.promotional_price != null &&
    product.promotional_price < product.price;
  const effectivePrice = hasPromo
    ? product.promotional_price!
    : product.price;

  const acceptedPayments: PaymentMethod[] = store.payment_methods?.length
    ? store.payment_methods
    : ["pix", "credit_card", "cash"];

  const handleToggleFavorite = async () => {
    const next = !isSaved;
    setIsSaved(next);
    const res = await toggleSaveProduct(product.id);
    if (res?.requiresAuth) {
      setAuthModalOpen(true);
    }
  };

  const handleAddToBag = () => {
    addProduct(product, selectedSize);
    setBagCount((c) => c + 1);
    setAddedToBagFeedback(true);
    window.setTimeout(() => setAddedToBagFeedback(false), 1800);
  };

  const handleBuyNowWhatsApp = () => {
    void incrementProductWhatsappClickAction(product.id);
    const url = buildWhatsAppUrl({
      phone: store.whatsapp,
      storeName: store.name,
      productTitle: product.title,
      productPrice: effectivePrice,
      selectedSize,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareProduct = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://lapamarketplace.com.br/${store.slug}/${
            product.slug || product.id
          }`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Silencioso
    }
    setCopiedShare(true);
    window.setTimeout(() => setCopiedShare(false), 2000);
  };

  const galleryRef = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(0, images.indexOf(activeImage));

  const goToImage = (idx: number) => {
    setActiveImage(images[idx]);
    const el = galleryRef.current;
    if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  };

  const handleGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (images[idx] && images[idx] !== activeImage) setActiveImage(images[idx]);
  };

  const metaLine = [
    product.condition === "used"
      ? "Seminovo"
      : product.condition === "refurbished"
      ? "Recondicionado"
      : null,
    product.gender,
    product.voltage,
  ]
    .filter(Boolean)
    .join(" · ");

  const paymentText = acceptedPayments
    .map((pm) => PAYMENT_SHORT_LABELS[pm] ?? pm)
    .join(", ");

  const deliveryText = [
    store.has_delivery !== false
      ? store.delivery_fee_type === "free"
        ? "Entrega grátis"
        : store.delivery_fee_type === "fixed" && store.delivery_fee != null
        ? formatCurrencyBRL(store.delivery_fee)
        : "Taxa a combinar"
      : null,
    store.has_pickup !== false ? "retirada" : null,
  ]
    .filter(Boolean)
    .join(" ou ");

  const isPremium = store.plan === "premium" || store.plan === "pro";
  const overlayButtonClasses =
    "w-10.5 h-10.5 rounded-[14px] bg-white grid place-items-center text-slate-900 cursor-pointer transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900";

  const buyButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="flex-1 px-3 text-[15px]"
        onClick={handleAddToBag}
        leftIcon={
          addedToBagFeedback ? (
            <Check className="w-4.5 h-4.5 text-whatsapp" strokeWidth={2.2} />
          ) : undefined
        }
      >
        {addedToBagFeedback ? "Na sacola" : "Pôr na sacola"}
      </Button>
      <Button
        type="button"
        variant="whatsapp"
        size="lg"
        className="flex-[1.3] px-3 text-[15px]"
        onClick={handleBuyNowWhatsApp}
      >
        Pedir no WhatsApp
      </Button>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader
        mobileVariant="hidden"
        bagCount={bagCount}
        favoritesCount={isSaved ? 1 : 0}
      />

      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        reason="favorite"
        itemName={product.title}
      />

      <main className="flex-1 mx-auto w-full max-w-6xl md:px-6 lg:px-8 md:py-7 pb-32 md:pb-12">
        <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-10 md:items-start">
          {/* Galeria */}
          <div className="md:sticky md:top-24 space-y-3">
            <div className="relative h-82.5 md:h-auto md:aspect-square rounded-b-[36px] md:rounded-[28px] bg-slate-100 overflow-hidden">
              <div
                ref={galleryRef}
                onScroll={handleGalleryScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
              >
                {images.map((imgUrl, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${imgUrl}-${idx}`}
                    src={imgUrl}
                    alt={
                      idx === 0
                        ? product.title
                        : `${product.title} — foto ${idx + 1}`
                    }
                    className="flex-none w-full h-full object-cover snap-center"
                  />
                ))}
              </div>

              <div className="absolute top-[max(1rem,env(safe-area-inset-top))] md:top-4.5 inset-x-4.5 flex items-center gap-2.5">
                <Link
                  href={`/${store.slug}`}
                  aria-label={`Voltar para ${store.name}`}
                  className={cn(overlayButtonClasses, "md:hidden")}
                >
                  <ChevronLeft className="w-4.5 h-4.5" strokeWidth={2} />
                </Link>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={handleShareProduct}
                  aria-label={copiedShare ? "Link copiado" : "Compartilhar produto"}
                  className={overlayButtonClasses}
                >
                  {copiedShare ? (
                    <Check className="w-4.5 h-4.5 text-whatsapp" strokeWidth={2} />
                  ) : (
                    <Share className="w-4.5 h-4.5" strokeWidth={1.8} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-label={
                    isSaved ? "Remover dos favoritos" : "Salvar nos favoritos"
                  }
                  aria-pressed={isSaved}
                  className={overlayButtonClasses}
                >
                  <Heart
                    className={cn(
                      "w-5 h-5 transition-colors duration-150",
                      isSaved && "fill-offer text-offer"
                    )}
                    strokeWidth={1.8}
                  />
                </button>
              </div>

              {discountPercent != null && (
                <Badge
                  variant="discount"
                  discountPercent={discountPercent}
                  className="absolute left-4.5 bottom-4.5 px-2.5 py-1.5 text-xs"
                />
              )}

              {images.length > 1 && (
                <div className="absolute bottom-5.5 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
                  {images.map((imgUrl, idx) => (
                    <span
                      key={`dot-${imgUrl}-${idx}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-150",
                        idx === activeIndex
                          ? "w-4.5 bg-brand"
                          : "w-1.5 bg-slate-300"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Miniaturas (desktop) */}
            {images.length > 1 && (
              <div className="hidden md:flex items-center gap-2.5 overflow-x-auto no-scrollbar p-0.5">
                {images.map((imgUrl, idx) => (
                  <button
                    key={`thumb-${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => goToImage(idx)}
                    aria-label={`Ver foto ${idx + 1}`}
                    aria-pressed={idx === activeIndex}
                    className={cn(
                      "w-18 h-18 rounded-2xl overflow-hidden shrink-0 bg-slate-100 cursor-pointer transition-shadow duration-150",
                      idx === activeIndex
                        ? "ring-2 ring-brand ring-offset-2 ring-offset-slate-50"
                        : "opacity-70 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações de compra */}
          <div className="flex flex-col gap-4.5 px-5 md:px-0 pt-4.5 md:pt-0">
            <div className="flex flex-col gap-1.5">
              <Link
                href={`/${store.slug}`}
                className="hidden md:inline-flex items-center gap-1 self-start text-[13px] text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
                {store.name}
              </Link>
              {metaLine && (
                <span className="text-xs text-slate-500">{metaLine}</span>
              )}
              <h1 className="text-[22px] md:text-[30px] font-extrabold tracking-[-0.02em] md:tracking-[-0.03em] leading-[1.15] text-slate-900 text-balance">
                {product.title}
              </h1>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-display text-[26px] md:text-[32px] font-extrabold tracking-[-0.02em] text-slate-900">
                  {formatCurrencyBRL(effectivePrice)}
                </span>
                {hasPromo && (
                  <span className="text-sm text-slate-500 line-through">
                    {formatCurrencyBRL(product.price)}
                  </span>
                )}
                {store.installment_info && (
                  <span className="text-[13px] text-slate-500">
                    {store.installment_info}
                  </span>
                )}
              </div>
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="font-display text-[15px] font-bold text-slate-900">
                  Tamanho
                </span>
                <div
                  role="radiogroup"
                  aria-label="Tamanho"
                  className="flex flex-wrap gap-2"
                >
                  {product.sizes.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "min-w-12 h-12 px-3 rounded-[14px] grid place-items-center font-display text-sm font-bold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
                          active
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-900 ring-line hover:bg-slate-50"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.description && (
              <p className="text-sm md:text-[15px] leading-[1.55] text-slate-500 text-pretty">
                {product.description}
              </p>
            )}

            {/* Compra (desktop) */}
            <div className="hidden md:flex gap-2.5">{buyButtons}</div>

            {/* Card da loja */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-[20px] bg-white">
              <span
                className={cn(
                  "flex-none w-10 h-10 rounded-full p-0.5",
                  isPremium ? "bg-story-premium" : "bg-brand"
                )}
              >
                <span className="w-full h-full rounded-full bg-brand-soft ring-2 ring-white overflow-hidden grid place-items-center font-display text-xs font-extrabold text-slate-900">
                  {store.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    store.name.slice(0, 2).toUpperCase()
                  )}
                </span>
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-display text-sm font-bold text-slate-900">
                  <span className="truncate">{store.name}</span>
                  {store.is_verified && <VerifiedSeal size={16} />}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                  <span className="truncate">{store.neighborhood}</span>
                  <StoreStatusBadge
                    compact
                    className="shrink-0"
                    storeName={store.name}
                    businessHours={store.business_hours}
                    specialHours={store.special_hours}
                    isOpenOverride={store.is_open_override}
                  />
                </span>
              </div>
              <Link
                href={`/${store.slug}`}
                className="shrink-0 px-3 py-2.25 rounded-xl bg-slate-100 hover:bg-slate-200 font-display text-xs font-bold text-slate-900 transition-colors duration-150"
              >
                Ver loja
              </Link>
            </div>

            {/* Pagamento / Entrega */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-[18px] bg-white flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">Pagamento</span>
                <span className="text-[13px] font-semibold text-slate-900">
                  {paymentText}
                </span>
              </div>
              <div className="p-3 rounded-[18px] bg-white flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">Entrega</span>
                <span className="text-[13px] font-semibold text-slate-900 first-letter:uppercase">
                  {deliveryText || "Combine com a loja"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mais produtos desta loja */}
        {relatedProducts.length > 0 && (
          <SectionContainer
            title={`Mais de ${store.name}`}
            actionLabel="Ver loja"
            href={`/${store.slug}`}
            className="px-5 md:px-0 pt-8 md:pt-12"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {relatedProducts.map((rel) => (
                <ProductCardGrid
                  key={rel.id}
                  product={rel}
                  hideStore
                  onAddToBag={() => setBagCount((c) => c + 1)}
                />
              ))}
            </div>
          </SectionContainer>
        )}
      </main>

      {/* Barra fixa de compra (mobile) */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden flex gap-2.5 px-5 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] bg-linear-to-b from-slate-50/0 to-slate-50 to-30%">
        {buyButtons}
      </div>

      <Footer className="hidden md:block" />
    </div>
  );
}

const PAYMENT_SHORT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "crédito",
  debit_card: "débito",
  cash: "dinheiro",
  payment_link: "link de pagamento",
  boleto: "boleto",
  crediario: "crediário",
};
