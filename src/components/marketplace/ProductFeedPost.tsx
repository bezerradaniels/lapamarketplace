"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  buildWhatsAppUrl,
  calculateDiscountPercentage,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StoreStatusBadge } from "@/components/ui/StoreStatusBadge";
import { VerifiedSeal } from "@/components/brand/LapaSymbol";
import { useBagStore } from "@/store/useBagStore";
import { incrementProductWhatsappClickAction } from "@/app/actions/feed";
import { productToItem, trackEvent } from "@/lib/analytics";
import type { ProductItem } from "@/types/marketplace";

export interface ProductFeedPostProps {
  product: ProductItem;
  isFavorite?: boolean;
  onToggleFavorite?: (product: ProductItem, nextState: boolean) => void;
  onAddToBag?: (product: ProductItem, selectedSize?: string | null) => void;
  whatsappVariant?: "whatsapp" | "primary";
  className?: string;
}

export function ProductFeedPost({
  product,
  isFavorite: controlledFavorite,
  onToggleFavorite,
  onAddToBag,
  whatsappVariant = "whatsapp",
  className,
}: ProductFeedPostProps) {
  const [internalFav, setInternalFav] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addProduct = useBagStore((s) => s.addProduct);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [settledAnnouncement, setSettledAnnouncement] = useState("");

  const trackRef = useRef<HTMLDivElement>(null);
  const pendingTargetRef = useRef<number | null>(null);
  const settledSlideRef = useRef(0);

  const isFav = controlledFavorite ?? internalFav;
  const isPremium = product.store.plan === "premium";
  const productUrl = `/${product.store.slug}/${product.slug || product.id}`;

  const images = React.useMemo(() => {
    const list = [product.image_url];
    if (product.gallery_urls && product.gallery_urls.length > 0) {
      for (const url of product.gallery_urls) {
        if (url && !list.includes(url)) {
          list.push(url);
        }
      }
    }
    return list;
  }, [product.image_url, product.gallery_urls]);

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

  // Sincronização de scroll do carrossel seguindo modern-web-guidance
  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length <= 1) return;

    let rafId = 0;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const getNearestIndex = () => {
      const width = track.clientWidth || 1;
      const idx = Math.round(track.scrollLeft / width);
      return Math.max(0, Math.min(images.length - 1, idx));
    };

    const onScroll = () => {
      if (pendingTargetRef.current !== null) return;
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const idx = getNearestIndex();
        setActiveSlide((prev) => (prev !== idx ? idx : prev));
      });
    };

    const onSettled = () => {
      pendingTargetRef.current = null;
      const idx = getNearestIndex();
      setActiveSlide(idx);
      if (settledSlideRef.current !== idx) {
        settledSlideRef.current = idx;
        setSettledAnnouncement(`Foto ${idx + 1} de ${images.length}`);
      }
    };

    const supportsScrollEnd = "onscrollend" in window;
    const onScrollFallback = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(onSettled, 140);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    if (supportsScrollEnd) {
      track.addEventListener("scrollend", onSettled);
    } else {
      track.addEventListener("scroll", onScrollFallback, { passive: true });
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (debounceTimer) clearTimeout(debounceTimer);
      track.removeEventListener("scroll", onScroll);
      if (supportsScrollEnd) {
        track.removeEventListener("scrollend", onSettled);
      } else {
        track.removeEventListener("scroll", onScrollFallback);
      }
    };
  }, [images.length]);

  const scrollToSlide = (targetIndex: number) => {
    const track = trackRef.current;
    if (!track) return;
    const bounded =
      ((targetIndex % images.length) + images.length) % images.length;
    pendingTargetRef.current = bounded;
    setActiveSlide(bounded);

    const slideEl = track.children[bounded] as HTMLElement | undefined;
    if (slideEl) {
      const offset = slideEl.offsetLeft - track.scrollLeft;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      track.scrollBy({
        left: offset,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  };

  const handleFavorite = () => {
    const next = !isFav;
    setInternalFav(next);
    onToggleFavorite?.(product, next);
  };

  const handleWhatsAppOrder = () => {
    void incrementProductWhatsappClickAction(product.id);
    trackEvent("whatsapp_order", {
      lead_source: "feed",
      store_id: product.store.id,
      store_name: product.store.name,
      items: [productToItem(product, { variant: selectedSize })],
    });

    const url = buildWhatsAppUrl({
      phone: product.store.whatsapp,
      storeName: product.store.name,
      productTitle: product.title,
      productPrice: effectivePrice,
      selectedSize,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      className={cn(
        "rounded-[28px] bg-white p-3.5 sm:p-4.5 flex flex-col gap-3.5",
        className
      )}
    >
      {/* 1. Header do Post */}
      <header className="flex items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={`/${product.store.slug}`}
            className={cn(
              "w-11 h-11 rounded-full p-0.5 shrink-0",
              isPremium ? "bg-story-premium" : "bg-slate-200"
            )}
          >
            <span className="w-full h-full rounded-full bg-brand-soft ring-2 ring-white overflow-hidden grid place-items-center font-display text-xs font-extrabold text-slate-900">
              {product.store.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.store.avatar_url}
                  alt={product.store.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                product.store.name.slice(0, 2).toUpperCase()
              )}
            </span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/${product.store.slug}`}
                className="font-display text-[15px] font-bold text-slate-900 hover:underline truncate"
              >
                {product.store.name}
              </Link>
              {product.store.is_verified && <VerifiedSeal size={16} />}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500 truncate">
                {product.store.neighborhood}
              </span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <StoreStatusBadge
                compact
                storeName={product.store.name}
                businessHours={product.store.business_hours}
                specialHours={product.store.special_hours}
                isOpenOverride={product.store.is_open_override}
              />
            </div>
          </div>
        </div>

        <Link
          href={`/${product.store.slug}`}
          className="shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 font-display text-xs font-bold text-slate-900 transition-colors duration-150"
        >
          Ver loja
        </Link>
      </header>

      {/* 2. Mídia: Carrossel Horizontal aspect-[4/5] */}
      <section
        aria-roledescription="carousel"
        aria-label={`Fotos de ${product.title}`}
        className="relative group"
      >
        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-y-0 inset-x-2.5 z-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                scrollToSlide(
                  (pendingTargetRef.current ?? activeSlide) - 1
                )
              }
              aria-label="Foto anterior"
              className={cn(
                "pointer-events-auto w-8.5 h-8.5 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-seg grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer touch-manipulation",
                "focus-visible:opacity-100"
              )}
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() =>
                scrollToSlide(
                  (pendingTargetRef.current ?? activeSlide) + 1
                )
              }
              aria-label="Próxima foto"
              className={cn(
                "pointer-events-auto w-8.5 h-8.5 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-seg grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer touch-manipulation",
                "focus-visible:opacity-100"
              )}
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        )}

        <div
          ref={trackRef}
          tabIndex={0}
          role="group"
          aria-label="Galeria de fotos do produto"
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar smooth-scroll aspect-4/5 rounded-[22px] bg-slate-100 relative touch-manipulation"
        >
          {images.map((imgUrl, index) => (
            <Link
              key={`${imgUrl}-${index}`}
              href={productUrl}
              role="group"
              aria-roledescription="slide"
              aria-label={`${product.title} - foto ${index + 1} de ${images.length}`}
              className="w-full h-full shrink-0 flex-[0_0_100%] snap-center relative overflow-hidden block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`${product.title} - Foto ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover"
              />
            </Link>
          ))}
        </div>

        {/* Badge de Desconto sobre a foto */}
        {discountPercent != null && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <Badge
              variant="discount"
              size="md"
              discountPercent={discountPercent}
            />
          </div>
        )}

        {/* Botão de Favorito flutuante ou indicador de múltiplas fotos */}
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={
            isFav
              ? `Remover ${product.title} dos favoritos`
              : `Adicionar ${product.title} aos favoritos`
          }
          aria-pressed={isFav}
          className="absolute top-3 right-3 z-10 w-9.5 h-9.5 rounded-[13px] bg-white/95 hover:bg-white grid place-items-center shadow-seg transition-transform duration-150 active:scale-90 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
        >
          <Heart
            className={cn(
              "w-4.5 h-4.5 transition-colors duration-150",
              isFav ? "fill-offer text-offer" : "text-slate-900"
            )}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        {/* Contador / Marcadores de slide */}
        {images.length > 1 && (
          <nav
            aria-label="Escolher foto do produto"
            className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-1.5"
          >
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToSlide(idx)}
                aria-label={`Ir para foto ${idx + 1}`}
                aria-current={activeSlide === idx ? "true" : undefined}
                className={cn(
                  "h-1.75 rounded-full transition-all cursor-pointer touch-manipulation",
                  activeSlide === idx
                    ? "w-5 bg-white shadow-seg"
                    : "w-1.75 bg-white/60 hover:bg-white/85"
                )}
              />
            ))}
          </nav>
        )}

        <p className="sr-only" role="status" aria-live="polite">
          {settledAnnouncement}
        </p>
      </section>

      {/* 3. Footer de Conversão */}
      <div className="space-y-3 px-0.5 pt-0.5">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[21px] font-extrabold text-slate-900 tracking-[-0.02em]">
              {formatCurrencyBRL(effectivePrice)}
            </span>
            {hasPromo && (
              <span className="text-xs font-medium text-slate-500 line-through">
                {formatCurrencyBRL(product.price)}
              </span>
            )}
          </div>
          <Link
            href={productUrl}
            className="block font-display text-base font-bold text-slate-900 hover:underline mt-0.5 leading-snug"
          >
            {product.title}
          </Link>
        </div>

        {/* Descrição curta */}
        {product.description && (
          <p className="text-[13px] text-slate-600 line-clamp-2 leading-normal">
            {product.description}
          </p>
        )}

        {/* Tamanhos disponíveis em pílulas */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">
              Tamanho:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={isSelected}
                    className={cn(
                      "min-w-8.5 h-7.5 px-2.5 rounded-[10px] font-display text-xs font-bold transition-colors duration-150 cursor-pointer touch-manipulation",
                      isSelected
                        ? "bg-brand text-white"
                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dois botões lado a lado: "Por na sacola" e "Pedir no Zap" */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <Button
            variant="secondary"
            size="md"
            leftIcon={
              justAdded ? (
                <Check className="w-4 h-4 text-whatsapp" strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <ShoppingBag className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              )
            }
            onClick={() => {
              addProduct(product, selectedSize);
              onAddToBag?.(product, selectedSize);
              setJustAdded(true);
              window.setTimeout(() => setJustAdded(false), 1400);
            }}
            fullWidth
          >
            {justAdded ? "Adicionado!" : "Por na sacola"}
          </Button>

          <Button
            variant={whatsappVariant}
            size="md"
            leftIcon={<MessageCircle className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}
            onClick={handleWhatsAppOrder}
            fullWidth
          >
            Pedir no Zap
          </Button>
        </div>
      </div>
    </article>
  );
}
