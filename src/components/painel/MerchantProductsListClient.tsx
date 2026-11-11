"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Eye,
  MessageCircle,
  Pencil,
  Package,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { toggleProductActiveAction } from "@/app/actions/painel";
import {
  calculateDiscountPercentage,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">(
    "all"
  );
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
      if (res.message) {
        setToastMessage(res.message);
        window.setTimeout(() => setToastMessage(""), 3000);
      }
    });
  };

  const filteredProducts = products.filter((p) => {
    if (statusFilter === "active" && !p.is_active) return false;
    if (statusFilter === "paused" && p.is_active) return false;
    if (
      searchQuery.trim() &&
      !p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Topo: Título + Botão Novo Produto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Meus Produtos ({products.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Pause peças esgotadas com 1 clique sem perder seu link no Google e
            WhatsApp.
          </p>
        </div>

        <Link href="/painel/produtos/novo">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" aria-hidden="true" />}
          >
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* Feedback de Switch Instantâneo */}
      {toastMessage && (
        <div
          role="status"
          className="rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-bold flex items-center justify-between shadow-sm"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles
              className="w-4 h-4 text-emerald-400"
              aria-hidden="true"
            />
            {toastMessage}
          </span>
        </div>
      )}

      {/* Barra de Filtro + Pesquisa */}
      <div className="rounded-3xl bg-white p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "all", label: `Todos (${products.length})` },
              {
                id: "active",
                label: `Ativos (${products.filter((p) => p.is_active).length})`,
              },
              {
                id: "paused",
                label: `Pausados (${
                  products.filter((p) => !p.is_active).length
                })`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-bold transition-all cursor-pointer",
                statusFilter === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Buscar produto pelo nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            pill
            leftIcon={<Search className="w-4 h-4" aria-hidden="true" />}
          />
        </div>
      </div>

      {/* Lista de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-100 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-900">
              Nenhum produto encontrado
            </h2>
            <p className="text-xs text-slate-500">
              Cadastre novas peças para exibir sua vitrine em Bom Jesus da Lapa.
            </p>
          </div>
          <Link href="/painel/produtos/novo" className="inline-block">
            <Button variant="primary" size="md">
              Cadastrar Primeiro Produto
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const discountPercent = calculateDiscountPercentage(
              product.price,
              product.promotional_price
            );
            const hasPromo =
              discountPercent != null &&
              product.promotional_price != null &&
              product.promotional_price < product.price;

            return (
              <article
                key={product.id}
                className={cn(
                  "rounded-3xl bg-white p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs",
                  product.is_active
                    ? "border-slate-100"
                    : "border-slate-200/70 bg-slate-50/70 opacity-80"
                )}
              >
                {/* Miniatura + Dados do Produto */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {discountPercent != null && (
                      <div className="absolute top-1.5 left-1.5">
                        <Badge
                          variant="discount"
                          discountPercent={discountPercent}
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {categoryMap.get(product.category_id) || "Catálogo"}
                      </span>
                      {product.gender && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {product.gender}
                        </span>
                      )}
                      {product.voltage && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {product.voltage}
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                      {product.title}
                    </h2>

                    {/* Preço Normal / Promocional */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                        {formatCurrencyBRL(
                          hasPromo ? product.promotional_price! : product.price
                        )}
                      </span>
                      {hasPromo && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrencyBRL(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Tamanhos se houver */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {product.sizes.map((sz) => (
                          <span
                            key={sz}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700"
                          >
                            {sz}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Direita: Contadores Views/Cliques + Switch Instantâneo (`is_active`) + Botão Editar */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  {/* Métricas individuais */}
                  <div className="flex items-center gap-3.5 text-xs">
                    <div
                      className="inline-flex items-center gap-1 font-semibold text-slate-600"
                      title="Visualizações do produto"
                    >
                      <Eye
                        className="w-4 h-4 text-slate-400"
                        aria-hidden="true"
                      />
                      <span>{product.views_count} views</span>
                    </div>

                    <div
                      className="inline-flex items-center gap-1 font-bold text-emerald-700"
                      title="Cliques no botão de WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>{product.clicks_whatsapp} cliques</span>
                    </div>
                  </div>

                  {/* Switch Instantâneo (`is_active`) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={product.is_active}
                      aria-label={
                        product.is_active
                          ? `Pausar ${product.title}`
                          : `Ativar ${product.title}`
                      }
                      onClick={() => handleToggleActive(product)}
                      className={cn(
                        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        product.is_active ? "bg-emerald-600" : "bg-slate-300"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out",
                          product.is_active ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                    <span
                      className={cn(
                        "text-xs font-bold min-w-14",
                        product.is_active
                          ? "text-emerald-700"
                          : "text-slate-500"
                      )}
                    >
                      {product.is_active ? "Ativo" : "Pausado"}
                    </span>
                  </div>

                  {/* Botão Editar */}
                  <Link href={`/painel/produtos/${product.id}/editar`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      }
                    >
                      Editar
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

