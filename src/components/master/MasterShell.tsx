"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Tag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LapaSymbol } from "@/components/brand/LapaSymbol";

const MASTER_NAV: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/master/lojas", label: "Lojas", icon: Store },
  { href: "/master/taxonomia", label: "Taxonomia", icon: Tag },
];

export function MasterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const brand = (
    <Link href="/master/lojas" className="flex items-center gap-2 px-2">
      <LapaSymbol size={28} ink="#FFFFFF" />
      <span className="font-display text-[19px] font-extrabold tracking-[-0.03em] text-white">
        Lapa
      </span>
      <span className="px-2 py-0.5 rounded-full bg-brand text-slate-900 text-[10px] font-bold">
        Master
      </span>
    </Link>
  );

  const navLinks = MASTER_NAV.map((item) => {
    const Icon = item.icon;
    const active = pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 h-10.5 px-3 rounded-[14px] text-sm font-semibold whitespace-nowrap transition-colors duration-150",
          active
            ? "bg-slate-800 text-brand"
            : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
        )}
      >
        <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  });

  const shortcutClasses =
    "h-10.5 px-3.5 rounded-[14px] grid place-items-center font-display text-[13px] font-bold whitespace-nowrap transition duration-150 active:scale-[0.98]";

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Sidebar master (desktop): ink */}
      <aside className="hidden lg:flex sticky top-0 h-dvh bg-slate-900 text-white px-4 py-6 flex-col gap-5.5">
        {brand}
        <nav aria-label="Navegação master" className="flex flex-col gap-1">
          {navLinks}
        </nav>
        <div className="flex-1" />
        <div className="flex flex-col gap-2">
          <Link
            href="/painel"
            className={cn(shortcutClasses, "bg-slate-800 hover:bg-slate-700 text-white")}
          >
            Painel do lojista
          </Link>
          <Link
            href="/"
            className={cn(shortcutClasses, "bg-brand hover:bg-brand-strong text-slate-900")}
          >
            Ver o portal
          </Link>
        </div>
      </aside>

      {/* Barra superior (mobile/tablet) */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900 text-white">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          {brand}
          <Link
            href="/"
            className={cn(shortcutClasses, "bg-brand hover:bg-brand-strong text-slate-900")}
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

      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
