"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Store,
  Layers,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MASTER_NAV = [
  {
    href: "/master/lojas",
    label: "Lojas, Planos & Selo Verificado",
    icon: Store,
  },
  {
    href: "/master/taxonomia",
    label: "Categorias, Filtros & Bairros",
    icon: Layers,
  },
];

export function MasterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header do Super Admin */}
      <header className="sticky top-0 z-40 w-full bg-slate-900 text-white border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight">
                  LapaShop <span className="text-emerald-400">Master</span>
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  role = admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Super Admin do Portal • Bom Jesus da Lapa - BA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/painel"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-3.5 py-2 text-xs font-bold text-white transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Painel do Lojista</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ver Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Navegação Superior em Pílulas + Conteúdo */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <nav
          aria-label="Navegação Super Admin"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar"
        >
          {MASTER_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all",
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-100"
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}

