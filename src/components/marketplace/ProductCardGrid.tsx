"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Heart, Plus, Truck } from "lucide-react";
import { calculateDiscountPercentage, cn, formatCurrencyBRL } from "@/lib/utils";
import {
  STATUS_TONE,
  discountLabel,
  installmentsFor,
  isNewProduct,
  priceOf,
  shippingFor,
  storeStatusLine,
} from "@/lib/aura-display";
import { VerifiedSeal } from "@/components/brand/LapaSymbol";
import { useBagHydrated, useBagStore } from "@/store/useBagStore";
import type { ProductItem } from "@/types/marketplace";

export type ProductCardVariant = "home" | "catalogo";

export interface ProductCardGridProps {
  product: ProductItem;
  isFavorite?: boolean;
  onToggleFavorite?: (product: ProductItem, nextState: boolean) => void;
  onAddToBag?: (product: ProductItem) => void;
  href?: string;
  /**
   * `home` (descoberta visual: sem botões de compra direta no feed/anunciantes) ou
   * `catalogo` (catálogo da loja: com adição direta à sacola).
   */
  variant?: ProductCardVariant;
  /** @deprecated A foto é sempre 4:5 no card v2. Mantido por compatibilidade. */
  ratio?: "square" | "portrait";
  /** Esconde "loja · bairro" e status (ex.: dentro da vitrine da própria loja). */
  hideStore?: boolean;
  /** `false` na prévia do painel: sem botões de favoritar e sacola. */
  interactive?: boolean;
  className?: string;
}

const MAX_SIZES = 4;
const MAX_COLORS = 3;
const HEX = /^#(?:[0-9a-f]{3}){1,2}$/i;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light";

/**
 * Card de produto em grade v2 (tema Aura).
 * Em áreas de múltiplos anunciantes (`variant="home"`), exibe apenas informações
 * visuais (título e valores) e botão de favoritar, sem botões de adicionar à sacola.
 */
export function ProductCardGrid({
  product,
  isFavorite: controlledFavorite,
  onToggleFavorite,
  onAddToBag,
  href,
  variant = "home",
  hideStore = false,
  interactive = true,
  className,
}: ProductCardGridProps) {
  const router = useRouter();
  const [internalFav, setInternalFav] = useState(false);
  const items = useBagStore((s) => s.items);
  const addProduct = useBagStore((s) => s.addProduct);
  const removeItem = useBagStore((s) => s.removeItem);

  const cat = variant === "catalogo";
  const isFav = controlledFavorite ?? internalFav;
  const productUrl = href ?? `/${product.store.slug}/${product.slug || product.id}`;
  const { final, compareAt } = priceOf(product);
  const off = discountLabel(product.price, product.promotional_price);
  const discountPct = calculateDiscountPercentage(product.price, product.promotional_price);
  const isNew = isNewProduct(product);
  const requiresSize = (product.sizes?.length ?? 0) > 0;
  const isHydrated = useBagHydrated();
  const bagItem = items.find((i) => i.productId === product.id);
  const inBag = isHydrated && Boolean(bagItem);

  const status = storeStatusLine(product.store);
  const stock = product.stock;
  const scarcity =
    cat && stock != null && stock >= 1 && stock <= 3
      ? stock === 1
        ? "Última peça"
        : `Últimas ${stock} peças`
      : null;

  const photoBadge = scarcity
    ? { label: scarcity, dot: "bg-premium", text: "text-amber-ink" }
    : null;

  const sizes = cat ? (product.sizes ?? []) : [];
  const shownSizes = sizes.length > MAX_SIZES ? sizes.slice(0, MAX_SIZES - 1) : sizes;
  const extraSizes = sizes.length - shownSizes.length;
  const colors = cat ? (product.colors ?? []).filter((c) => HEX.test(c)) : [];
  const shownColors = colors.slice(0, MAX_COLORS);
  const extraColors = colors.length - shownColors.length;
  const installments = installmentsFor(product.store, final);
  const hasPix = product.store.payment_methods?.includes("pix") ?? false;
  const shipping = cat ? shippingFor(product.store, status) : null;
  const tone = STATUS_TONE[status.tone];

  const handleFavoriteClick = () => {
    const next = !isFav;
    setInternalFav(next);
    onToggleFavorite?.(product, next);
  };

  const handleBagClick = () => {
    if (bagItem) {
      removeItem(bagItem.cartItemId);
      return;
    }
    if (requiresSize) {
      router.push(`${productUrl}?escolher=tamanho`);
      return;
    }
    addProduct(product);
    onAddToBag?.(product);
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-3xl border border-media bg-white p-2 pb-3",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand-light",
        className
      )}
    >
      {/* Foto 4:5 */}
      <div className="relative aspect-4/5 overflow-hidden rounded-[18px] bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt=""
          loading="lazy"
          className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {(off || isNew) && (
          <div className="pointer-events-none absolute left-2 top-2 flex gap-1">
            {off && (
              <span className="inline-flex h-6 items-center rounded-full bg-offer-strong px-2.25 font-display text-xs font-bold text-white">
                {off}
              </span>
            )}
            {isNew && (
              <span className="inline-flex h-6 items-center rounded-full bg-white px-2.25 font-display text-xs font-bold text-ink">
                Novo
              </span>
            )}
          </div>
        )}

        {interactive && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-pressed={isFav}
            aria-label={isFav ? `Remover ${product.title} dos favoritos` : `Favoritar ${product.title}`}
            className={cn(
              "absolute right-2 top-2 z-10 grid size-8.5 cursor-pointer place-items-center rounded-full bg-white shadow-fav transition-transform duration-200 touch-manipulation active:scale-110",
              "after:absolute after:-inset-1.25 after:content-['']",
              focusRing
            )}
          >
            <Heart
              className={cn("size-4.25 transition-colors", isFav ? "fill-offer text-offer" : "text-ink")}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        )}

        {photoBadge && (
          <span
            className={cn(
              "absolute bottom-2 left-2 inline-flex h-6.5 max-w-[calc(100%-16px)] items-center gap-1.5 whitespace-nowrap rounded-full bg-white/88 pl-2 pr-2.5 text-xs font-semibold backdrop-blur-[10px]",
              photoBadge.text
            )}
          >
            <span className={cn("size-1.75 flex-none rounded-full", photoBadge.dot)} aria-hidden="true" />
            <span className="truncate">{photoBadge.label}</span>
          </span>
        )}
      </div>

      {/* Texto */}
      <div className="flex min-w-0 flex-col gap-1.5 px-1">
        {!hideStore && (
          <p className="flex min-w-0 items-center gap-1 text-xs font-medium text-muted">
            <span className="truncate">{product.store.name}</span>
            {product.store.is_verified && <VerifiedSeal size={13} />}
            {product.store.neighborhood && (
              <span className="flex-none">· {product.store.neighborhood}</span>
            )}
          </p>
        )}

        <h3
          className={cn(
            "font-display text-[15px] font-semibold leading-[1.25] tracking-[-0.01em] text-ink",
            cat ? "line-clamp-2 min-h-9.5" : "line-clamp-2 min-h-9.5"
          )}
        >
          <Link
            href={productUrl}
            className="after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus:outline-none"
          >
            {product.title}
          </Link>
        </h3>

        {cat && ((!hideStore && status) || sizes.length > 0 || colors.length > 0) && (
          <div className="flex flex-col gap-2 pt-0.5">
            {!hideStore && (
              <p className={cn("flex min-w-0 items-center gap-1.5 text-xs font-semibold", tone.text)}>
                <span className={cn("size-1.75 flex-none rounded-full", tone.dot)} aria-hidden="true" />
                <span className="truncate">{status.label}</span>
              </p>
            )}
            {(sizes.length > 0 || colors.length > 0) && (
              <div className="flex items-center justify-between gap-1.5">
                {sizes.length > 0 && (
                  <ul className="flex gap-1" aria-label={`Tamanhos: ${sizes.join(", ")}`}>
                    {shownSizes.map((s) => (
                      <li
                        key={s}
                        aria-hidden="true"
                        className="grid h-6 min-w-6.5 place-items-center rounded-full border border-line bg-white px-1.5 font-display text-[11px] font-semibold text-ink"
                      >
                        {s}
                      </li>
                    ))}
                    {extraSizes > 0 && (
                      <li
                        aria-hidden="true"
                        className="grid h-6 min-w-6.5 place-items-center rounded-full border border-line px-1.5 font-display text-[11px] font-semibold text-muted"
                      >
                        +{extraSizes}
                      </li>
                    )}
                  </ul>
                )}
                {colors.length > 0 && (
                  <div className="flex items-center">
                    <span className="sr-only">
                      {colors.length} {colors.length === 1 ? "cor" : "cores"}
                    </span>
                    {shownColors.map((hex) => (
                      <span
                        key={hex}
                        aria-hidden="true"
                        className="-ml-0.75 size-3.5 rounded-full shadow-[0_0_0_2px_#fff,inset_0_0_0_1px_rgba(15,23,42,0.12)] first:ml-0"
                        style={{ background: hex }}
                      />
                    ))}
                    {extraColors > 0 && (
                      <span aria-hidden="true" className="ml-1 text-[11px] font-semibold text-muted">
                        +{extraColors}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preço */}
        <div className="flex flex-col gap-0.5 pt-1">
          {compareAt != null && discountPct != null ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded bg-[#00a650] px-1.25 py-0.5 font-display text-[10px] font-bold text-white">
                {discountPct}% OFF
              </span>
              <span className="text-xs text-slate-400 line-through">
                {formatCurrencyBRL(compareAt)}
              </span>
            </div>
          ) : compareAt != null ? (
            <span className="text-xs text-slate-400 line-through">
              {formatCurrencyBRL(compareAt)}
            </span>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <span className="whitespace-nowrap font-display text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
              {formatCurrencyBRL(final)}
            </span>

            {cat && interactive && (
              <button
                type="button"
                onClick={handleBagClick}
                aria-label={
                  inBag
                    ? `${product.title} na sacola. Remover`
                    : `Adicionar ${product.title} à sacola`
                }
                className={cn(
                  "relative z-10 grid size-9.5 flex-none cursor-pointer place-items-center rounded-full text-white transition-colors duration-200 touch-manipulation active:scale-[0.98]",
                  focusRing,
                  inBag ? "bg-whatsapp hover:bg-[#059669]" : "bg-brand hover:bg-brand-hover"
                )}
              >
                {inBag ? (
                  <Check className="size-4" strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
                )}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-[#00a650]">
            {hasPix && <span>no Pix</span>}
            {hasPix && installments && <span className="text-slate-300">·</span>}
            {installments && <span>{installments.replace(/^ou\s+/, "")} sem juros</span>}
          </div>
        </div>

        {shipping && (
          <p
            className={cn(
              "mt-1 flex min-w-0 items-center gap-1.5 border-t border-media pt-2.25 text-xs font-medium",
              shipping.free ? "text-mint-ink" : "text-slate-600"
            )}
          >
            <Truck className="size-3.75 flex-none" strokeWidth={1.8} aria-hidden="true" />
            <span className="truncate">{shipping.label}</span>
          </p>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ variant = "home" }: { variant?: ProductCardVariant }) {
  const cat = variant === "catalogo";
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-2.5 rounded-3xl border border-media bg-white p-2 pb-3">
      <div className="aspect-4/5 rounded-[18px] bg-media" />
      <div className="flex flex-col gap-2 px-1">
        <div className="h-3 w-3/4 rounded-full bg-media" />
        <div className="h-3.75 w-full rounded-full bg-media" />
        {cat && <div className="h-3.75 w-2/3 rounded-full bg-media" />}
        {cat && <div className="h-6 w-4/5 rounded-full bg-media" />}
        <div className="flex items-end justify-between pt-1">
          <div className="h-4.75 w-20 rounded-full bg-media" />
          {cat && <div className="size-10 rounded-full bg-media" />}
        </div>
      </div>
    </div>
  );
}
