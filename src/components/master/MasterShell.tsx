"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LapaSymbol } from "@/components/brand/LapaSymbol";

const MASTER_NAV: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/master", label: "Dashboard", icon: LayoutDashboard },
  { href: "/master/lojas", label: "Lojas", icon: Store },
  { href: "/master/usuarios", label: "Usuários", icon: Users },
  { href: "/master/categorias", label: "Categorias", icon: Tag },
  { href: "/master/bairros", label: "Bairros", icon: MapPin },
];

export function MasterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const brand = (
    <Link href="/master" className="flex items-center gap-2 px-2">
      <LapaSymbol size={28} />
      <span className="font-display text-[20px] font-semibold tracking-[-0.025em] text-white">
        Lapa
      </span>
      <span className="px-2 py-0.5 rounded-full bg-white/14 ring-1 ring-white/20 text-white text-[11px] font-bold">
        Master
      </span>
    </Link>
  );

  const navLinks = MASTER_NAV.map((item) => {
    const Icon = item.icon;
    const active =
      item.href === "/master"
        ? pathname === "/master"
        : pathname.startsWith(item.href) ||
          (item.href === "/master/categorias" && pathname === "/master/taxonomia");
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300",
          active
            ? "bg-white/12 text-white"
            : "text-slate-300 hover:bg-white/8 hover:text-white"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  });

  const shortcutClasses =
    "h-9 px-3 rounded-xl grid place-items-center font-display text-xs font-semibold whitespace-nowrap transition duration-150 active:scale-[0.98]";

  return (
    <div className="min-h-dvh atmosfera text-ink lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Sidebar master (desktop): deep night */}
      <aside className="hidden lg:flex sticky top-0 h-dvh deep-night px-4 py-6 flex-col gap-5.5">
        {brand}
        <nav aria-label="Navegação master" className="flex flex-col gap-1">
          {navLinks}
        </nav>
        <div className="flex-1" />
        <div className="flex flex-col gap-2">
          <Link
            href="/painel"
            className={cn(shortcutClasses, "bg-white/12 hover:bg-white/20 text-white")}
          >
            Painel do lojista
          </Link>
          <Link
            href="/"
            className={cn(shortcutClasses, "bg-white hover:bg-slate-100 text-ink")}
          >
            Ver o portal
          </Link>
        </div>
      </aside>

      {/* Barra superior (mobile/tablet) */}
      <header className="lg:hidden sticky top-0 z-40 deep-night">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          {brand}
          <Link
            href="/"
            className={cn(shortcutClasses, "bg-white hover:bg-slate-100 text-ink")}
          >
            Ver o portal
          </Link>
        </div>
        <nav
          aria-label="Navegação master"
          className="flex gap-1 px-3 pb-2 overflow-x-auto no-scrollbar"
        >
          {navLinks}
        </nav>
      </header>

      <main className="min-w-0 brisa-ceu px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
