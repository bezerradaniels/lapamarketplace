"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Store,
  UserMinus,
} from "lucide-react";
import {
  buildWhatsAppUrl,
  calculateDiscountPercentage,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
import { initialsOf, installmentsFor, priceOf } from "@/lib/aura-display";
import { VerifiedSeal } from "@/components/brand/LapaSymbol";
import { trackEvent } from "@/lib/analytics";
import type { ProductItem } from "@/types/marketplace";

export interface ProductFeedPostProps {
  product: ProductItem;
  isFavorite?: boolean;
  onToggleFavorite?: (product: ProductItem, nextState: boolean) => void;
  onAddToBag?: (product: ProductItem, selectedSize?: string | null) => void;
  /** Seguir a loja (sem o handler, o botão não aparece). */
  isFollowing?: boolean;
  onToggleFollow?: (product: ProductItem, nextState: boolean) => void;
  /** Loja com story ativo (anel prismático no avatar). */
  hasStory?: boolean;
  onOpenStory?: () => void;
  className?: string;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light";

/**
 * Post do feed v2 (tema Aura): cabeçalho da loja com Seguir, carrossel 4:5,
 * apenas título e valores (sem botões de compra direta no feed).
 */
export function ProductFeedPost({
  product,
  isFavorite: controlledFavorite,
  onToggleFavorite,
  isFollowing = false,
  onToggleFollow,
  hasStory = false,
  onOpenStory,
  className,
}: ProductFeedPostProps) {
  const [internalFav, setInternalFav] = useState(false);
  const [slide, setSlide] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  const store = product.store;
  const isFav = controlledFavorite ?? internalFav;
  const productUrl = `/${store.slug}/${product.slug || product.id}`;

  const images = useMemo(() => {
    const list = [product.image_url];
    for (const url of product.gallery_urls ?? []) {
      if (url && !list.includes(url)) list.push(url);
    }
    return list;
  }, [product.image_url, product.gallery_urls]);

  const { final, compareAt } = priceOf(product);
  const discountPct = calculateDiscountPercentage(product.price, product.promotional_price);
  const installments = installmentsFor(store, final);
  const hasPix = store.payment_methods?.includes("pix") ?? false;

  const handleFavorite = () => {
    const next = !isFav;
    setInternalFav(next);
    onToggleFavorite?.(product, next);
  };

  const scrollToSlide = (i: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: i * rail.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  const getStoreUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${store.slug}`;
    }
    return `/${store.slug}`;
  };

  const handleShareStore = async () => {
    setIsMenuOpen(false);
    const url = getStoreUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: store.name,
          text: `Conheça a loja ${store.name} no Lapa Marketplace:`,
          url,
        });
        return;
      } catch {
        // Ignora cancelamento do share nativo
      }
    }
    await handleCopyLink();
  };

  const handleCopyLink = async () => {
    const url = getStoreUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsMenuOpen(false);
      }, 1200);
    } catch {
      // Ignora erro
    }
  };

  const storeWhatsAppUrl = useMemo(() => {
    return buildWhatsAppUrl({
      phone: store.whatsapp,
      storeName: store.name,
    });
  }, [store.whatsapp, store.name]);

  const avatar = (
    <span
      className={cn(
        "block size-11 rounded-full",
        hasStory ? "aura-ring p-[2.5px]" : "bg-line p-px"
      )}
    >
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-brand-soft font-display text-[13px] font-bold text-brand-deep shadow-[0_0_0_2px_#fff]">
        {store.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.avatar_url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          initialsOf(store.name)
        )}
      </span>
    </span>
  );

  return (
    <article
      className={cn(
        "flex flex-col rounded-[28px] border border-media bg-white px-3 pb-4 pt-3",
        className
      )}
    >
      {/* Cabeçalho da loja (Instagram-style: Logo + Nome + Seguir + 3 Pontos) */}
      <div className="flex items-center gap-2.5 px-0.5 pb-3 pt-0.5">
        {hasStory && onOpenStory ? (
          <button
            type="button"
            onClick={onOpenStory}
            aria-label={`Ver story de ${store.name}`}
            className={cn("flex-none cursor-pointer rounded-full", focusRing)}
          >
            {avatar}
          </button>
        ) : (
          <Link
            href={`/${store.slug}`}
            aria-label={`Ver loja ${store.name}`}
            className={cn("flex-none rounded-full", focusRing)}
          >
            {avatar}
          </Link>
        )}

        <Link
          href={`/${store.slug}`}
          className={cn("flex min-w-0 flex-1 flex-col justify-center rounded-lg", focusRing)}
        >
          <span className="flex min-w-0 items-center gap-1.25">
            <span className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {store.name}
            </span>
            {store.is_verified && <VerifiedSeal size={14} className="flex-none" />}
          </span>
          {store.neighborhood && (
            <span className="truncate text-xs font-medium text-muted">
              {store.neighborhood}
            </span>
          )}
        </Link>

        {onToggleFollow && (
          <button
            type="button"
            onClick={() => onToggleFollow(product, !isFollowing)}
            aria-pressed={isFollowing}
            aria-label={
              isFollowing ? `Seguindo ${store.name}. Deixar de seguir` : `Seguir ${store.name}`
            }
            className={cn(
              "h-8 min-w-18 flex-none cursor-pointer whitespace-nowrap rounded-full px-3 font-display text-xs font-semibold transition-colors duration-150 touch-manipulation active:scale-95",
              focusRing,
              isFollowing
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-slate-100 text-ink hover:bg-slate-200 font-bold"
            )}
          >
            {isFollowing ? "Seguindo" : "Seguir"}
          </button>
        )}

        {/* 3 pontos para abrir mais opções da loja */}
        <div className="relative flex-none">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label={`Mais opções de ${store.name}`}
            className={cn(
              "grid size-8 cursor-pointer place-items-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 hover:text-ink touch-manipulation",
              focusRing,
              isMenuOpen && "bg-slate-100 text-ink"
            )}
          >
            <MoreHorizontal className="size-5" strokeWidth={2} aria-hidden="true" />
          </button>

          {isMenuOpen && (
            <>
              {/* Backdrop para fechar ao clicar fora */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />

              {/* Menu flutuante estilo Instagram */}
              <div
                role="menu"
                aria-orientation="vertical"
                aria-label={`Opções da loja ${store.name}`}
                className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-float transition-all animate-in fade-in zoom-in-95 duration-150"
              >
                <Link
                  href={`/${store.slug}`}
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-slate-800 transition-colors hover:bg-slate-100 hover:text-ink"
                >
                  <Store className="size-4 text-slate-500" strokeWidth={1.9} />
                  <span>Ver loja</span>
                </Link>

                {store.whatsapp && (
                  <a
                    href={storeWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      trackEvent("click_whatsapp_profile", { store_id: store.id });
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-slate-800 transition-colors hover:bg-slate-100 hover:text-ink"
                  >
                    <MessageCircle className="size-4 text-whatsapp" strokeWidth={1.9} />
                    <span>Falar no WhatsApp</span>
                  </a>
                )}

                {store.instagram && (
                  <a
                    href={
                      store.instagram.startsWith("http")
                        ? store.instagram
                        : `https://instagram.com/${store.instagram.replace(/^@/, "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-slate-800 transition-colors hover:bg-slate-100 hover:text-ink"
                  >
                    <InstagramIcon className="size-4 text-pink-600" />
                    <span>Instagram da loja</span>
                  </a>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleShareStore}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-slate-800 transition-colors hover:bg-slate-100 hover:text-ink"
                >
                  <Share2 className="size-4 text-slate-500" strokeWidth={1.9} />
                  <span>Compartilhar loja</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCopyLink}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-slate-800 transition-colors hover:bg-slate-100 hover:text-ink"
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-mint-ink" strokeWidth={2.2} />
                      <span className="text-mint-ink">Link copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4 text-slate-500" strokeWidth={1.9} />
                      <span>Copiar link</span>
                    </>
                  )}
                </button>

                {onToggleFollow && isFollowing && (
                  <div className="mt-1 border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onToggleFollow(product, false);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-error-ink transition-colors hover:bg-red-50"
                    >
                      <UserMinus className="size-4 text-error-ink" strokeWidth={1.9} />
                      <span>Deixar de seguir</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fotos com carrossel 4:5 e botão de favoritar */}
      <div className="relative aspect-4/5 overflow-hidden rounded-[20px] bg-media">
        <div
          ref={railRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
            if (i !== slide) setSlide(i);
          }}
          className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto touch-manipulation"
        >
          {images.map((src, i) => (
            <Link
              key={`${src}-${i}`}
              href={productUrl}
              tabIndex={i === 0 ? 0 : -1}
              aria-label={i === 0 ? `Ver ${product.title}` : undefined}
              className="relative block size-full flex-none snap-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${product.title}, foto ${i + 1} de ${images.length}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="size-full object-cover"
              />
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={handleFavorite}
          aria-pressed={isFav}
          aria-label={isFav ? `Remover ${product.title} dos favoritos` : `Favoritar ${product.title}`}
          className={cn(
            "absolute right-3 top-3 grid size-10 cursor-pointer place-items-center rounded-full bg-white shadow-fav transition-transform duration-200 touch-manipulation active:scale-110",
            focusRing
          )}
        >
          <Heart
            className={cn("size-5 transition-colors", isFav ? "fill-offer text-offer" : "text-ink")}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>

        {images.length > 1 && (
          <div
            role="group"
            aria-label="Fotos do produto"
            className="absolute bottom-3 right-3 flex h-7 items-center gap-1.5 rounded-full bg-[rgba(15,23,42,0.45)] px-2.5 backdrop-blur-[10px]"
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Foto ${i + 1}`}
                aria-current={i === slide ? "true" : undefined}
                onClick={() => scrollToSlide(i)}
                className={cn(
                  "relative h-1.5 cursor-pointer rounded-full transition-[width] duration-200 after:absolute after:-inset-2 after:content-['']",
                  i === slide ? "w-4 bg-white" : "w-1.5 bg-white/60"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Informações: apenas nome e valores */}
      <div className="flex flex-col gap-2 px-1 pt-3">
        <h3 className="line-clamp-2 font-display text-[17px] font-semibold leading-[1.3] tracking-[-0.01em] text-ink">
          <Link
            href={productUrl}
            className={cn("rounded hover:underline focus:outline-none", focusRing)}
          >
            {product.title}
          </Link>
        </h3>

        <div className="flex flex-col gap-1 pt-0.5">
          {compareAt != null && discountPct != null ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-[#00a650] px-1.5 py-0.5 font-display text-xs font-bold text-white">
                {discountPct}% OFF
              </span>
              <span className="text-sm text-slate-400 line-through">
                {formatCurrencyBRL(compareAt)}
              </span>
            </div>
          ) : compareAt != null ? (
            <span className="text-sm text-slate-400 line-through">
              {formatCurrencyBRL(compareAt)}
            </span>
          ) : null}

          <span className="whitespace-nowrap font-display text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
            {formatCurrencyBRL(final)}
          </span>

          <div className="flex flex-col gap-0.5 text-[13px] font-medium text-[#00a650]">
            {hasPix && <span>no Pix</span>}
            {installments && (
              <span>{installments.replace(/^ou\s+/, "")} sem juros</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductFeedPostSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-3 rounded-[28px] border border-media bg-white p-3 pb-4">
      <div className="flex items-center gap-2.5">
        <div className="size-11 rounded-full bg-media" />
        <div className="h-4 flex-1 rounded-full bg-media" />
        <div className="h-9 w-21 rounded-full bg-media" />
      </div>
      <div className="aspect-4/5 rounded-[20px] bg-media" />
      <div className="h-5 w-3/4 rounded-full bg-media" />
      <div className="h-4 w-1/3 rounded-full bg-media" />
      <div className="h-7 w-1/2 rounded-full bg-media" />
      <div className="h-3.5 w-1/3 rounded-full bg-media" />
    </div>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
