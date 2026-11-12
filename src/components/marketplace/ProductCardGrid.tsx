"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Plus, Check } from "lucide-react";
import {
  calculateDiscountPercentage,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useBagStore } from "@/store/useBagStore";
import type { ProductItem } from "@/types/marketplace";

export interface ProductCardGridProps {
  product: ProductItem;
  isFavorite?: boolean;
  onToggleFavorite?: (product: ProductItem, nextState: boolean) => void;
  onAddToBag?: (product: ProductItem) => void;
  href?: string;
  /** Proporção da foto: 1:1 (feed/vitrine) ou 4:5 (Explorar). */
  ratio?: "square" | "portrait";
  /** Esconde "loja · bairro" (ex.: dentro da vitrine da própria loja). */
  hideStore?: boolean;
  className?: string;
}

export function ProductCardGrid({
  product,
  isFavorite: controlledFavorite,
  onToggleFavorite,
  onAddToBag,
  href,
  ratio = "square",
  hideStore = false,
  className,
}: ProductCardGridProps) {
  const [internalFav, setInternalFav] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addProduct = useBagStore((s) => s.addProduct);

  const isFav = controlledFavorite ?? internalFav;
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

  const productUrl =
    href ?? `/${product.store.slug}/${product.slug || product.id}`;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFav;
    setInternalFav(next);
    onToggleFavorite?.(product, next);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addProduct(product);
    onAddToBag?.(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-3xl bg-white p-2 pb-3",
        className
      )}
    >
      {/* Foto do produto */}
      <div
        className={cn(
          "relative rounded-[18px] bg-slate-100 overflow-hidden",
          ratio === "portrait" ? "aspect-4/5" : "aspect-square"
        )}
      >
        <Link
          href={productUrl}
          className="block w-full h-full focus-visible:outline-none"
          aria-label={`Ver detalhes de ${product.title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </Link>

        {discountPercent != null && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <Badge variant="discount" discountPercent={discountPercent} />
          </div>
        )}

        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={
            isFav
              ? `Remover ${product.title} dos favoritos`
              : `Adicionar ${product.title} aos favoritos`
          }
          aria-pressed={isFav}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-[11px] bg-white grid place-items-center transition-transform duration-150 active:scale-90 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors duration-150",
              isFav ? "fill-offer text-offer" : "text-slate-900"
            )}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Informações */}
      <div className="flex flex-col flex-1 gap-0.5 px-1 min-w-0">
        {!hideStore && (
          <span className="text-[11px] text-slate-500 truncate">
            {product.store.name}
            {product.store.neighborhood
              ? ` · ${product.store.neighborhood}`
              : ""}
          </span>
        )}

        <Link
          href={productUrl}
          className="font-display text-sm font-semibold leading-tight text-slate-900 truncate"
        >
          {product.title}
        </Link>

        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-display text-base font-extrabold tracking-[-0.02em] text-slate-900 whitespace-nowrap">
              {formatCurrencyBRL(effectivePrice)}
            </span>
            {hasPromo && (
              <span className="text-[11px] text-slate-500 line-through truncate">
                {formatCurrencyBRL(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddClick}
            aria-label={`Adicionar ${product.title} à sacola`}
            className={cn(
              "w-7.5 h-7.5 rounded-[10px] grid place-items-center shrink-0 text-white transition duration-150 cursor-pointer touch-manipulation active:scale-90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2",
              justAdded ? "bg-whatsapp" : "bg-brand hover:bg-brand-hover"
            )}
          >
            {justAdded ? (
              <Check className="w-4 h-4" strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Plus className="w-4 h-4" strokeWidth={2.4} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
