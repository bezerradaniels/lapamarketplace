"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBagHydrated, useBagStore } from "@/store/useBagStore";
import { cn, formatCurrencyBRL } from "@/lib/utils";
import { LapaSymbol } from "@/components/brand/LapaSymbol";
import { hasBottomNav } from "@/components/layout/BottomNav";

const RESERVED_ROOTS = new Set([
  "explorar",
  "sacola",
  "minha-conta",
  "conta",
  "loja",
  "painel",
  "master",
  "login",
  "cadastro",
  "onboarding",
  "recuperar-senha",
  "nova-senha",
  "auth",
]);

/** `/[storeSlug]/[productSlug]` tem barra fixa própria de compra. */
function isProductDetailPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 2 && !RESERVED_ROOTS.has(segments[0]);
}

export function FloatingBagBar() {
  const pathname = usePathname();
  const isMounted = useBagHydrated();
  const items = useBagStore((state) => state.items);

  if (!isMounted || items.length === 0) {
    return null;
  }

  // Oculta na própria sacola, nos painéis, no fluxo de acesso e no detalhe do produto (mobile)
  if (
    pathname.startsWith("/sacola") ||
    pathname.startsWith("/painel") ||
    pathname.startsWith("/master") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/recuperar-senha") ||
    pathname.startsWith("/nova-senha")
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
      className={cn(
        "fixed inset-x-3 z-40 mx-auto max-w-md pointer-events-none",
        hasBottomNav(pathname) ? "bottom-25 md:bottom-5" : "bottom-5",
        isProductDetailPath(pathname) && "hidden md:block"
      )}
    >
      <div className="pointer-events-auto animate-slide-up h-16 rounded-[22px] bg-slate-900 text-white pl-4 pr-2.5 shadow-bag flex items-center gap-3">
        <LapaSymbol size={26} ink="#FFFFFF" />

        <div className="flex-1 min-w-0 flex flex-col gap-px">
          <span className="text-xs text-slate-300 truncate">
            {totalItems} {totalItems === 1 ? "item" : "itens"} ·{" "}
            {uniqueStoresCount} {uniqueStoresCount === 1 ? "loja" : "lojas"}
          </span>
          <span className="font-display text-[17px] font-extrabold leading-tight truncate">
            {formatCurrencyBRL(totalAmount)}
          </span>
        </div>

        <Link
          href="/sacola"
          className="shrink-0 inline-flex items-center rounded-[15px] bg-brand hover:bg-brand-hover text-white px-4 py-3 font-display text-sm font-bold transition duration-150 active:scale-[0.98]"
        >
          Ver sacola
        </Link>
      </div>
    </div>
  );
}
