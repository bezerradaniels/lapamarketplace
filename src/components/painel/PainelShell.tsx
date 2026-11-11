"use client";

import { trackEvent } from "@/lib/analytics";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Package, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LapaSymbol, VerifiedSeal } from "@/components/brand/LapaSymbol";
import type { MerchantStoreConfig } from "@/types/marketplace";

export interface PainelShellProps {
  store: MerchantStoreConfig;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}> = [
  { href: "/painel", label: "Visão geral", icon: LayoutGrid, exact: true },
  { href: "/painel/produtos", label: "Produtos", icon: Package, exact: false },
  {
    href: "/painel/configuracoes",
    label: "Configurações",
    icon: Settings,
    exact: false,
  },
];

export function PainelShell({ store, children }: PainelShellProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const catalogUrl = `https://lapamarketplace.com.br/${store.slug}`;

  const handleCopyCatalogLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogUrl);
    } catch {
      // Fallback silencioso
    }
    trackEvent("share", {
      method: "copy_link",
      content_type: "catalog",
      item_id: store.id,
    });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const isPremium = store.plan_tier === "premium";

  const brand = (
    <Link href="/painel" className="flex items-center gap-2 px-2">
      <LapaSymbol size={28} />
      <span className="font-display text-[19px] font-extrabold tracking-[-0.03em] text-slate-900">
        Lapa
      </span>
      <span className="font-display text-[13px] font-semibold text-slate-500">
        Painel
      </span>
    </Link>
  );

  const navLinks = NAV_ITEMS.map((item) => {
    const Icon = item.icon;
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 h-10.5 px-3 rounded-[14px] text-sm font-semibold whitespace-nowrap transition-colors duration-150",
          isActive
            ? "bg-brand-soft text-slate-900"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  });

  const storeCard = (
    <div className="p-3 rounded-[20px] bg-slate-50 flex items-center gap-2.5">
      <span className="w-10 h-10 rounded-full bg-brand-soft overflow-hidden grid place-items-center font-display text-xs font-extrabold text-slate-900 flex-none">
        {store.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.avatar_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          store.name.slice(0, 2).toUpperCase()
        )}
      </span>
      <div className="flex flex-col gap-0.75 min-w-0">
        <span className="flex items-center gap-1.5 font-display text-sm font-bold text-slate-900">
          <span className="truncate">{store.name}</span>
          {store.is_verified && <VerifiedSeal size={14} />}
        </span>
        <span
          className={cn(
            "self-start px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900",
            isPremium ? "bg-brand" : "bg-slate-200"
          )}
        >
          {isPremium ? "Premium" : "Gratuito"}
        </span>
      </div>
    </div>
  );

  const copyButton = (
    <button
      type="button"
      onClick={handleCopyCatalogLink}
      className="h-10.5 px-3.5 rounded-[14px] bg-slate-100 hover:bg-slate-200 grid place-items-center font-display text-[13px] font-bold text-slate-900 whitespace-nowrap cursor-pointer transition duration-150 active:scale-[0.98]"
    >
      <span aria-live="polite">
        {copied ? "Link copiado!" : "Copiar link do catálogo"}
      </span>
    </button>
  );

  const viewStoreLink = (
    <Link
      href={`/${store.slug}`}
      className="h-10.5 px-3.5 rounded-[14px] bg-slate-900 hover:bg-slate-800 text-white grid place-items-center font-display text-[13px] font-bold whitespace-nowrap transition duration-150 active:scale-[0.98]"
    >
      Ver minha loja
    </Link>
  );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex sticky top-0 h-dvh bg-white px-4 py-6 flex-col gap-5.5">
        {brand}
        {storeCard}
        <nav aria-label="Menu do painel do lojista" className="flex flex-col gap-1">
          {navLinks}
        </nav>
        <div className="flex-1" />
        <div className="flex flex-col gap-2">
          {copyButton}
          {viewStoreLink}
        </div>
      </aside>

      {/* Barra superior (mobile/tablet) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          {brand}
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:block">{copyButton}</span>
            {viewStoreLink}
          </div>
        </div>
        <nav
          aria-label="Menu do painel do lojista"
          className="flex gap-1 px-3 pb-2 overflow-x-auto no-scrollbar"
        >
          {navLinks}
        </nav>
      </header>

      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
