"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  MessageCircle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Store,
  MapPin,
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
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [settledAnnouncement, setSettledAnnouncement] = useState("");

  const trackRef = useRef<HTMLDivElement>(null);
  const pendingTargetRef = useRef<number | null>(null);
  const settledSlideRef = useRef(0);

  const isFav = controlledFavorite ?? internalFav;

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
        "rounded-3xl bg-white p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3.5",
        className
      )}
    >
      {/* 1. Header do Post */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/loja/${product.store.slug}`}
            className="w-11 h-11 rounded-full bg-slate-100/80 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center text-slate-600 font-bold text-sm"
          >
            {product.store.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.store.avatar_url}
                alt={product.store.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <Store className="w-5 h-5 text-slate-500" aria-hidden="true" />
            )}
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/loja/${product.store.slug}`}
                className="text-sm font-extrabold text-slate-900 hover:underline truncate"
              >
                {product.store.name}
              </Link>
              {product.store.is_verified && (
                <BadgeCheck
                  className="w-4 h-4 text-blue-600 shrink-0"
                  aria-label="Loja Verificada"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-0.5 text-xs text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400" aria-hidden="true" />
                {product.store.neighborhood}
              </span>
              <span className="text-slate-300">•</span>
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
          href={`/loja/${product.store.slug}`}
          className="shrink-0 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 px-3.5 py-1.5 text-xs font-semibold transition-colors"
        >
          Ver Loja
        </Link>
      </header>

      {/* 2. Mídia: Carrossel Horizontal aspect-[4/5] rounded-3xl bg-slate-100 */}
      <section
        aria-roledescription="carousel"
        aria-label={`Fotos de ${product.title}`}
        className="relative group"
      >
        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-y-0 inset-x-2 z-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                scrollToSlide(
                  (pendingTargetRef.current ?? activeSlide) - 1
                )
              }
              aria-label="Foto anterior"
              className="pointer-events-auto w-8 h-8 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() =>
                scrollToSlide(
                  (pendingTargetRef.current ?? activeSlide) + 1
                )
              }
              aria-label="Próxima foto"
              className="pointer-events-auto w-8 h-8 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer touch-manipulation"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div
          ref={trackRef}
          tabIndex={0}
          role="group"
          aria-label="Galeria de fotos do produto"
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar smooth-scroll aspect-[4/5] rounded-3xl bg-slate-100 relative touch-manipulation"
        >
          {images.map((imgUrl, index) => (
            <div
              key={`${imgUrl}-${index}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${images.length}`}
              className="w-full h-full shrink-0 flex-[0_0_100%] snap-center relative overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`${product.title} - Foto ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Badge de Desconto sobre a foto */}
        {discountPercent != null && (
          <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none">
            <Badge
              variant="discount"
              size="md"
              discountPercent={discountPercent}
            />
          </div>
        )}

        {/* Contador / Marcadores de slide */}
        {images.length > 1 && (
          <nav
            aria-label="Escolher foto do produto"
            className="absolute bottom-3.5 inset-x-0 z-10 flex items-center justify-center gap-1.5"
          >
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToSlide(idx)}
                aria-label={`Ir para foto ${idx + 1}`}
                aria-current={activeSlide === idx ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all cursor-pointer touch-manipulation",
                  activeSlide === idx
                    ? "w-5 bg-white shadow-xs"
                    : "w-2 bg-white/60 hover:bg-white/80"
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
      <div className="space-y-3 pt-1">
        {/* Linha: Preço em destaque + Botão de Curtir/Favoritar */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrencyBRL(effectivePrice)}
              </span>
              {hasPromo && (
                <span className="text-xs font-medium text-slate-400 line-through">
                  {formatCurrencyBRL(product.price)}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-800 mt-0.5">
              {product.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleFavorite}
            aria-label={
              isFav ? "Remover dos favoritos" : "Favoritar esta peça"
            }
            aria-pressed={isFav}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer touch-manipulation",
              isFav
                ? "bg-rose-50 text-rose-500 border border-rose-200"
                : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
            )}
          >
            <Heart
              className={cn("w-5 h-5", isFav && "fill-current")}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Descrição curta */}
        {product.description && (
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Tamanhos disponíveis em pílulas */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">
              Tamanhos:
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
                      "px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer touch-manipulation",
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dois botões lado a lado: "Por na Sacola" (secondary) e "Pedir no Zap" (primary ou whatsapp) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ShoppingBag className="w-4 h-4" aria-hidden="true" />}
            onClick={() => onAddToBag?.(product, selectedSize)}
            fullWidth
          >
            Por na Sacola
          </Button>

          <Button
            variant={whatsappVariant}
            size="md"
            leftIcon={<MessageCircle className="w-4 h-4" aria-hidden="true" />}
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

