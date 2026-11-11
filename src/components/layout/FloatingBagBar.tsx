"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useBagHydrated, useBagStore } from "@/store/useBagStore";
import { formatCurrencyBRL } from "@/lib/utils";

export function FloatingBagBar() {
  const pathname = usePathname();
  const isMounted = useBagHydrated();
  const items = useBagStore((state) => state.items);

  if (!isMounted || items.length === 0) {
    return null;
  }

  // Oculta na própria página da sacola e nos painéis administrativos
  if (
    pathname.startsWith("/sacola") ||
    pathname.startsWith("/painel") ||
    pathname.startsWith("/master") ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const uniqueStoresCount = new Set(items.map((item) => item.store.id)).size;
  const totalAmount = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div
      role="region"
      aria-label="Resumo da sacola de compras"
      className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 pointer-events-none"
    >
      <div className="pointer-events-auto rounded-full bg-slate-900 text-white p-2.5 pl-4 shadow-xl border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center">
              {totalItems}
            </span>
          </div>

          <div className="min-w-0 leading-tight">
            <p className="text-xs font-semibold text-slate-300 truncate">
              {totalItems} {totalItems === 1 ? "item" : "itens"} •{" "}
              {uniqueStoresCount} {uniqueStoresCount === 1 ? "loja" : "lojas"}
            </p>
            <p className="text-sm font-extrabold text-white tracking-tight truncate">
              {formatCurrencyBRL(totalAmount)}
            </p>
          </div>
        </div>

        <Link
          href="/sacola"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-extrabold transition-colors"
        >
          <span>Ver Sacola</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

