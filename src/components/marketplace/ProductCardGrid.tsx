"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Plus, Check, BadgeCheck } from "lucide-react";
import {
  calculateDiscountPercentage,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { ProductItem } from "@/types/marketplace";

export interface ProductCardGridProps {
  product: ProductItem;
  isFavorite?: boolean;
  onToggleFavorite?: (product: ProductItem, nextState: boolean) => void;
  onAddToBag?: (product: ProductItem) => void;
  href?: string;
  className?: string;
}

export function ProductCardGrid({
  product,
  isFavorite: controlledFavorite,
  onToggleFavorite,
  onAddToBag,
  href,
  className,
}: ProductCardGridProps) {
  const [internalFav, setInternalFav] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

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
    href ?? `/produto/${product.slug || product.id}`;

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
    onAddToBag?.(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-3xl bg-white p-3 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200",
        className
      )}
    >
      {/* Foto do Produto */}
      <div className="aspect-square rounded-2xl bg-slate-100/80 relative overflow-hidden">
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
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Badge de % OFF no canto superior esquerdo */}
        {discountPercent != null && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <Badge variant="discount" discountPercent={discountPercent} />
          </div>
        )}

        {/* Botão de Favoritar no canto superior direito */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={
            isFav
              ? `Remover ${product.title} dos favoritos`
              : `Adicionar ${product.title} aos favoritos`
          }
          aria-pressed={isFav}
          className={cn(
            "absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer touch-manipulation",
            "backdrop-blur-md shadow-xs",
            isFav
              ? "bg-rose-500 text-white"
              : "bg-white/85 text-slate-700 hover:bg-white hover:text-rose-500"
          )}
        >
          <Heart
            className={cn("w-4 h-4", isFav && "fill-current")}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Informações do Produto */}
      <div className="flex flex-col flex-1 justify-between pt-3 px-0.5 gap-2">
        <div className="space-y-1">
          {/* Nome da loja + bairro */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
            <span className="font-medium text-slate-500 truncate">
              {product.store.name}
            </span>
            {product.store.is_verified && (
              <BadgeCheck
                className="w-3 h-3 text-blue-600 shrink-0"
                aria-label="Loja verificada"
              />
            )}
            <span>•</span>
            <span className="truncate">{product.store.neighborhood}</span>
          </div>

          {/* Título do produto */}
          <Link
            href={productUrl}
            className="block text-sm font-semibold text-slate-800 hover:text-slate-950 line-clamp-1 transition-colors"
          >
            {product.title}
          </Link>
        </div>

        {/* Preço De/Por + Botão circular + */}
        <div className="flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            {hasPromo ? (
              <span className="block text-[11px] text-slate-400 line-through leading-none mb-0.5">
                {formatCurrencyBRL(product.price)}
              </span>
            ) : (
              <span className="block text-[11px] text-transparent select-none leading-none mb-0.5">
                &nbsp;
              </span>
            )}
            <span className="block text-base font-extrabold text-slate-900 tracking-tight leading-tight truncate">
              {formatCurrencyBRL(effectivePrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddClick}
            aria-label={`Adicionar ${product.title} à sacola`}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer touch-manipulation",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20",
              justAdded
                ? "bg-emerald-600 text-white scale-105"
                : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
            )}
          >
            {justAdded ? (
              <Check className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Plus className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

