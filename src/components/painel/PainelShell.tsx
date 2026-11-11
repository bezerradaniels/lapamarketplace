"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Settings,
  Store,
  Copy,
  Check,
  ExternalLink,
  BadgeCheck,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { MerchantStoreConfig } from "@/types/marketplace";

export interface PainelShellProps {
  store: MerchantStoreConfig;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    href: "/painel",
    label: "Visão Geral",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/painel/produtos",
    label: "Meus Produtos",
    icon: Package,
    exact: false,
  },
  {
    href: "/painel/produtos/novo",
    label: "Novo Produto",
    icon: PlusCircle,
    exact: true,
  },
  {
    href: "/painel/configuracoes",
    label: "Configurações & Horários",
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
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const isPremium = store.plan_tier === "premium";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header Superior Fixo do Painel do Lojista */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Esquerda: Identidade da Loja + Badge de Plano */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/painel"
              className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs"
            >
              {store.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.avatar_url}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-5 h-5" aria-hidden="true" />
              )}
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {store.name}
                </span>
                {store.is_verified && (
                  <BadgeCheck
                    className="w-4 h-4 text-blue-600 shrink-0"
                    aria-label="Loja Verificada"
                  />
                )}
                {isPremium ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 px-2.5 py-0.5 text-[11px] font-extrabold shrink-0">
                    <span>Premium ⭐</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[11px] font-bold shrink-0">
                    Gratuito
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Painel do Lojista • {store.neighborhood_name}, Bom Jesus da Lapa
              </p>
            </div>
          </div>

          {/* Direita: Botão Copiar Link do Catálogo + Botão Ver Minha Loja */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyCatalogLink}
              leftIcon={
                copied ? (
                  <Check
                    className="w-3.5 h-3.5 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )
              }
            >
              <span className="hidden sm:inline">
                {copied ? "Link Copiado!" : "Copiar Link do Catálogo"}
              </span>
              <span className="sm:hidden">
                {copied ? "Copiado!" : "Copiar Link"}
              </span>
            </Button>

            <Link href={`/${store.slug}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                rightIcon={
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                }
              >
                <span className="hidden sm:inline">Ver Minha Loja</span>
                <span className="sm:hidden">Loja</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Corpo com Sidebar Desktop + Navegação Pílulas Mobile */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar Desktop / Barra Mobile */}
        <aside className="w-full lg:w-64 shrink-0 space-y-4">
          <nav
            aria-label="Menu do Painel do Lojista"
            className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar rounded-3xl bg-white p-2.5 sm:p-3 border border-slate-100 shadow-xs"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  (pathname.startsWith(item.href) &&
                    item.href !== "/painel/produtos") ||
                  (item.href === "/painel/produtos" &&
                    pathname === "/painel/produtos");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all",
                    isActive
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Card lateral de link rápido para Vitrine e Super Admin */}
          <div className="hidden lg:flex flex-col gap-2 rounded-3xl bg-white p-4 border border-slate-100 shadow-xs text-xs">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Atalhos do Portal
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-slate-900 py-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ir para a Vitrine (Home)</span>
            </Link>
            <Link
              href="/master/lojas"
              className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-800 py-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Painel Super Admin (/master)</span>
            </Link>
          </div>
        </aside>

        {/* Área Principal */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

