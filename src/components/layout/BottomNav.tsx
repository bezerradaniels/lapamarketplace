"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBagHydrated, useBagStore } from "@/store/useBagStore";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/", icon: Home, match: (p) => p === "/" },
  {
    label: "Explorar",
    href: "/explorar",
    icon: Search,
    match: (p) => p.startsWith("/explorar"),
  },
  {
    label: "Sacola",
    href: "/sacola",
    icon: ShoppingBag,
    match: (p) => p.startsWith("/sacola"),
  },
  {
    label: "Conta",
    href: "/minha-conta",
    icon: User,
    match: (p) => p.startsWith("/minha-conta"),
  },
];

/** Rotas do comprador em que a bottom nav fixa aparece (mobile). */
export function hasBottomNav(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/explorar") ||
    pathname.startsWith("/minha-conta")
  );
}

/**
 * Bottom nav fixa do comprador (mobile): Início · Explorar · Sacola · Conta.
 */
export function BottomNav() {
  const pathname = usePathname();
  const isMounted = useBagHydrated();
  const items = useBagStore((state) => state.items);

  if (!hasBottomNav(pathname)) {
    return null;
  }

  const bagCount = isMounted
    ? items.reduce((acc, item) => acc + item.quantity, 0)
    : 0;

  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 bg-white rounded-t-[28px] px-2 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-nav"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.match(pathname);
        const Icon = item.icon;
        const showBadge = item.href === "/sacola" && bagCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            aria-label={
              showBadge ? `${item.label} (${bagCount} itens)` : undefined
            }
            className={cn(
              "relative flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors duration-150 touch-manipulation",
              isActive ? "text-slate-900" : "text-slate-400"
            )}
          >
            <Icon
              className="w-5.5 h-5.5"
              strokeWidth={1.8}
              fill={isActive && item.href === "/" ? "currentColor" : "none"}
              aria-hidden="true"
            />
            <span>{item.label}</span>
            {showBadge && (
              <span className="absolute -top-1 left-1/2 ml-1.25 min-w-4.5 h-4.5 px-1.25 rounded-full bg-brand text-slate-900 text-[10px] font-bold grid place-items-center">
                {bagCount > 99 ? "99+" : bagCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
