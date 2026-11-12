"use client";

import { trackEvent } from "@/lib/analytics";
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
} from "@/components/ui/Button";
import { PillGroup, Switch } from "@/components/ui/Switch";
import { toggleProductActiveAction } from "@/app/actions/painel";
import { cn, formatCurrencyBRL } from "@/lib/utils";
import type { GlobalCategory, MerchantProduct } from "@/types/marketplace";

export interface MerchantProductsListClientProps {
  initialProducts: MerchantProduct[];
  categories: GlobalCategory[];
}

export function MerchantProductsListClient({
  initialProducts,
  categories,
}: MerchantProductsListClientProps) {
  const [products, setProducts] = useState<MerchantProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "paused" | "promo"
  >("all");
  const [toastMessage, setToastMessage] = useState<string>("");
  const [, startTransition] = useTransition();

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categories]);

  const handleToggleActive = (product: MerchantProduct) => {
    const nextActive = !product.is_active;

    // Atualização otimista instantânea
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_active: nextActive } : p
      )
    );

    startTransition(async () => {
      const res = await toggleProductActiveAction(product.id, nextActive);
      if (!res.error) {
        trackEvent("product_status_changed", {
          item_id: product.id,
          is_active: nextActive,
        });
      }
      if (res.message) {
        setToastMessage(res.message);
        window.setTimeout(() => setToastMessage(""), 3000);
      }
    });
  };

  const isOnPromo = (p: MerchantProduct) =>
    p.promotional_price != null &&
    p.promotional_price > 0 &&
    p.promotional_price < p.price;

  const filteredProducts = products.filter((p) => {
    if (statusFilter === "active" && !p.is_active) return false;
    if (statusFilter === "paused" && p.is_active) return false;
    if (statusFilter === "promo" && !isOnPromo(p)) return false;
    if (
      searchQuery.trim() &&
      !p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const activeCount = products.filter((p) => p.is_active).length;
  const pausedCount = products.length - activeCount;
  const rowGridClasses =
    "md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_150px_80px_80px_70px] md:gap-3 md:items-center";

  return (
    <div className="flex flex-col gap-4.5">
      {/* Título + novo produto */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">
            Produtos
          </h1>
          <p className="text-sm text-slate-500">
            {activeCount} {activeCount === 1 ? "ativo" : "ativos"} ·{" "}
            {pausedCount} {pausedCount === 1 ? "pausado" : "pausados"}
          </p>
        </div>

        <Link
          href="/painel/produtos/novo"
          className={cn(
            buttonBaseClasses,
            buttonVariantClasses.primary,
            "h-10.5 px-4 rounded-[14px] text-sm self-start sm:self-auto"
          )}
        >
          + Novo produto
        </Link>
      </div>

      {/* Busca + filtros */}
      <div className="flex flex-col md:flex-row md:items-center gap-2.5">
        <div className="relative flex items-center md:flex-1 md:max-w-90">
          <Search
            className="w-4.25 h-4.25 text-slate-500 absolute left-3.5 pointer-events-none"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Buscar produto"
            placeholder="Buscar produto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 rounded-[15px] bg-slate-100 pl-10.5 pr-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-brand-light transition-[background-color,box-shadow] duration-150"
          />
        </div>
        <PillGroup
          ariaLabel="Filtrar produtos"
          tone="brand"
          className="[&>button]:py-2.5"
          value={statusFilter}
          onToggle={(value) => setStatusFilter(value)}
          options={[
            { value: "all", label: "Todos" },
            { value: "active", label: "Ativos" },
            { value: "paused", label: "Pausados" },
            { value: "promo", label: "Em promoção" },
          ]}
        />
      </div>

      {/* Retorno do switch */}
      <div aria-live="polite" className="empty:hidden">
        {toastMessage && (
          <div className="rounded-[18px] bg-slate-900 text-white px-4 py-3 text-[13px] font-semibold animate-slide-up">
            {toastMessage}
          </div>
        )}
      </div>

      {/* Tabela */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center flex flex-col items-center gap-3">
          <h2 className="text-[19px] font-extrabold text-slate-900">
            Nenhum produto por aqui
          </h2>
          <p className="text-sm text-slate-500">
            Cadastre peças para montar sua vitrine em Bom Jesus da Lapa.
          </p>
          <Link
            href="/painel/produtos/novo"
            className={cn(
              buttonBaseClasses,
              buttonVariantClasses.primary,
              buttonSizeClasses.md
            )}
          >
            Cadastrar produto
          </Link>
        </div>
      ) : (
        <div
          role="table"
          aria-label="Produtos da loja"
          className="bg-white rounded-3xl px-4 md:px-5 py-2 flex flex-col"
        >
          <div
            role="row"
            className={cn(
              "hidden py-3 text-xs text-slate-500",
              rowGridClasses
            )}
          >
            <span role="columnheader">Produto</span>
            <span role="columnheader">Categoria</span>
            <span role="columnheader">Preço</span>
            <span role="columnheader" className="text-right">
              Visualiz.
            </span>
            <span role="columnheader" className="text-right">
              WhatsApp
            </span>
            <span role="columnheader" className="text-right">
              Ativo
            </span>
          </div>

          {filteredProducts.map((product, idx) => {
            const hasPromo = isOnPromo(product);
            const categoryName =
              categoryMap.get(product.category_id) || "Catálogo";
            const subcategoryName = product.subcategory_id
              ? categoryMap.get(product.subcategory_id)
              : null;

            return (
              <div
                role="row"
                key={product.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 text-sm transition-opacity duration-150",
                  rowGridClasses,
                  "border-t border-slate-100",
                  idx === 0 && "max-md:border-t-0",
                  !product.is_active && "opacity-55"
                )}
              >
                <Link
                  role="cell"
                  href={`/painel/produtos/${product.id}/editar`}
                  className="flex items-center gap-3 min-w-0 basis-full md:basis-auto group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image_url}
                    alt=""
                    className="flex-none w-12 h-12 rounded-[14px] object-cover bg-slate-100"
                  />
                  <span className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-900 truncate group-hover:underline">
                      {product.title}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {product.sizes && product.sizes.length > 0
                        ? product.sizes.join(" · ")
                        : [product.gender, product.voltage]
                            .filter(Boolean)
                            .join(" · ") || "Único"}
                    </span>
                  </span>
                </Link>

                <span role="cell" className="text-slate-500 truncate max-md:hidden">
                  {categoryName}
                  {subcategoryName ? ` › ${subcategoryName}` : ""}
                </span>

                <span role="cell" className="flex items-baseline gap-1.5 max-md:flex-1">
                  <span className="font-display font-extrabold text-slate-900">
                    {formatCurrencyBRL(
                      hasPromo ? product.promotional_price! : product.price
                    )}
                  </span>
                  {hasPromo && (
                    <span className="text-xs text-slate-500 line-through">
                      {formatCurrencyBRL(product.price)}
                    </span>
                  )}
                </span>

                <span
                  role="cell"
                  className="md:text-right font-display font-bold text-slate-900"
                >
                  {product.views_count.toLocaleString("pt-BR")}
                  <span className="md:hidden font-sans font-normal text-xs text-slate-500">
                    {" "}
                    views
                  </span>
                </span>

                <span
                  role="cell"
                  className="md:text-right font-display font-bold text-whatsapp"
                >
                  {product.clicks_whatsapp.toLocaleString("pt-BR")}
                  <span className="md:hidden font-sans font-normal text-xs text-slate-500">
                    {" "}
                    cliques
                  </span>
                </span>

                <span role="cell" className="flex justify-end">
                  <Switch
                    size="sm"
                    checked={product.is_active}
                    onCheckedChange={() => handleToggleActive(product)}
                    aria-label={
                      product.is_active
                        ? `Pausar ${product.title}`
                        : `Ativar ${product.title}`
                    }
                  />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
