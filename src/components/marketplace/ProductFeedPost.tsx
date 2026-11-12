"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ShoppingBag,
  Store,
  UserMinus,
} from "lucide-react";
import { buildWhatsAppUrl, cn, formatCurrencyBRL } from "@/lib/utils";
import {
  STATUS_TONE,
  discountLabel,
  initialsOf,
  installmentsFor,
  perkFor,
  priceOf,
  storeStatusLine,
} from "@/lib/aura-display";
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
 * nome → preço → descrição → tamanhos em grade → entrega → botões gêmeos.
 */
export function ProductFeedPost({
  product,
  isFavorite: controlledFavorite,
  onToggleFavorite,
  onAddToBag,
  isFollowing = false,
  onToggleFollow,
  hasStory = false,
  onOpenStory,
  className,
}: ProductFeedPostProps) {
  const sizeLabelId = useId();
  const [internalFav, setInternalFav] = useState(false);
  const [slide, setSlide] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const items = useBagStore((s) => s.items);
  const addProduct = useBagStore((s) => s.addProduct);
  const removeItem = useBagStore((s) => s.removeItem);

  const store = product.store;
  const isFav = controlledFavorite ?? internalFav;
  const productUrl = `/${store.slug}/${product.slug || product.id}`;
  const sizes = product.sizes ?? [];
  const needSize = sizes.length > 0 && !size;
  const cartItemId = `${product.id}::${size || "unico"}`;
  const bagItem = items.find((i) => i.cartItemId === cartItemId);

  const images = useMemo(() => {
    const list = [product.image_url];
    for (const url of product.gallery_urls ?? []) {
      if (url && !list.includes(url)) list.push(url);
    }
    return list;
  }, [product.image_url, product.gallery_urls]);

  const { final, compareAt } = priceOf(product);
  const off = discountLabel(product.price, product.promotional_price);
  const status = storeStatusLine(store);
  const tone = STATUS_TONE[status.tone];
  const perk = perkFor(store, status);
  const installments = installmentsFor(store, final);

  const runGuarded = (fn: () => void) => {
    if (needSize) {
      setSizeError(true);
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    fn();
  };

  const handleFavorite = () => {
    const next = !isFav;
    setInternalFav(next);
    onToggleFavorite?.(product, next);
  };

  const handleBag = () => {
    if (bagItem) {
      removeItem(bagItem.cartItemId);
      return;
    }
    addProduct(product, size);
    onAddToBag?.(product, size);
  };

  const handleWhatsAppOrder = () => {
    void incrementProductWhatsappClickAction(product.id);
    trackEvent("whatsapp_order", {
      lead_source: "feed",
      store_id: store.id,
      store_name: store.name,
      items: [productToItem(product, { variant: size })],
    });
    const url = buildWhatsAppUrl({
      phone: store.whatsapp,
      storeName: store.name,
      productTitle: product.title,
      productPrice: final,
      selectedSize: size,
    });
    window.open(url, "_blank", "noopener,noreferrer");
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
        "flex flex-col rounded-[28px] border border-media bg-white px-3 pb-4 pt-3 shadow-card",
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

      {/* Fotos */}
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

        {off && (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex h-7 items-center rounded-full bg-offer-strong px-2.75 font-display text-[13px] font-bold text-white">
            {off}
          </span>
        )}

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

        {perk && (
          <span
            className={cn(
              "pointer-events-none absolute bottom-3 left-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-white/88 pl-2.25 pr-2.75 text-xs font-semibold backdrop-blur-[10px]",
              perk.tone === "success" ? "text-mint-ink" : "text-sky-ink"
            )}
          >
            <span
              className={cn(
                "size-1.75 rounded-full",
                perk.tone === "success" ? "bg-whatsapp" : "bg-aura-sky"
              )}
              aria-hidden="true"
            />
            {perk.label}
          </span>
        )}

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

      {/* Corpo */}
      <div className="flex flex-col gap-3.5 px-1 pt-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-ink">
            <Link href={productUrl} className={cn("rounded", focusRing)}>
              {product.title}
            </Link>
          </h3>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {compareAt != null && (
              <span className="sr-only">de {formatCurrencyBRL(compareAt)} por</span>
            )}
            <span className="whitespace-nowrap font-display text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
              {formatCurrencyBRL(final)}
            </span>
            {compareAt != null && (
              <span aria-hidden="true" className="whitespace-nowrap text-sm text-muted line-through">
                {formatCurrencyBRL(compareAt)}
              </span>
            )}
            {installments && (
              <span className="whitespace-nowrap text-[13px] text-muted">{installments}</span>
            )}
          </p>
          {product.description && (
            <p className="mt-0.5 line-clamp-2 text-sm leading-normal text-slate-600">
              {product.description}
            </p>
          )}
        </div>

        {sizes.length > 0 && (
          <div ref={sizesRef} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <span id={sizeLabelId} className="text-[13px] font-semibold text-slate-700">
                Tamanho
                {size && <span className="font-medium text-muted">: {size}</span>}
              </span>
              <Link
                href={`${productUrl}#medidas`}
                className="whitespace-nowrap text-[13px] font-semibold text-ink underline decoration-aura-amber decoration-2 underline-offset-[3px]"
              >
                Guia de medidas
              </Link>
            </div>
            <div
              role="radiogroup"
              aria-labelledby={sizeLabelId}
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.max(4, sizes.length)}, minmax(0, 1fr))`,
              }}
            >
              {sizes.map((label) => {
                const on = size === label;
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setSize(label);
                      setSizeError(false);
                    }}
                    className={cn(
                      "h-11 min-w-0 cursor-pointer truncate rounded-full px-1 font-display text-[15px] font-semibold transition-colors duration-150",
                      focusRing,
                      on ? "bg-brand text-white" : "bg-white text-ink shadow-[inset_0_0_0_1px_#E2E8F0] hover:bg-slate-50"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {sizeError && needSize && (
              <p role="alert" className="text-[13px] font-semibold text-error-ink">
                Escolha um tamanho para continuar
              </p>
            )}
          </div>
        )}

        {/* Botões gêmeos: sempre 1fr 1fr */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => runGuarded(handleBag)}
            className={cn(
              "flex h-13 min-w-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 font-display text-[15px] font-semibold transition-colors touch-manipulation active:scale-[0.98]",
              focusRing,
              bagItem ? "bg-mint-soft text-mint-ink" : "bg-media text-ink hover:bg-line"
            )}
          >
            <ShoppingBag className="size-4.5 flex-none" strokeWidth={1.8} aria-hidden="true" />
            {bagItem ? "Adicionado" : "Adicionar"}
          </button>
          <button
            type="button"
            onClick={() => runGuarded(handleWhatsAppOrder)}
            className={cn(
              "flex h-13 min-w-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-whatsapp-strong px-3 font-display text-[15px] font-semibold text-white transition-colors hover:bg-whatsapp-hover touch-manipulation active:scale-[0.98]",
              focusRing
            )}
          >
            <MessageCircle className="size-4.5 flex-none" strokeWidth={1.8} aria-hidden="true" />
            WhatsApp
          </button>
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
      <div className="h-7 w-1/2 rounded-full bg-media" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-13 rounded-full bg-media" />
        <div className="h-13 rounded-full bg-media" />
      </div>
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
