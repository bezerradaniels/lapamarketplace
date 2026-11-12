"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Camera,
  Home,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/aura-display";
import { useBagHydrated, useBagStore } from "@/store/useBagStore";
import { useViewer } from "@/lib/use-viewer";

/** Rotas do comprador em que a bottom nav fixa aparece (mobile). */
export function hasBottomNav(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/explorar") ||
    pathname.startsWith("/minha-conta")
  );
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light";

interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: number;
  badgeNoun?: string;
  match: (p: string) => boolean;
}

function lucide(I: LucideIcon) {
  return function renderNavIcon(active: boolean) {
    return (
      <I
        className={cn("size-5.5", active && "fill-[rgba(15,23,42,0.08)]")}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    );
  };
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const label =
    item.label + (item.badge ? `, ${item.badge} ${item.badgeNoun ?? "novidades"}` : "");
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      onClick={(e) => {
        // Tocar na aba em que já está (ex.: Início na Home) volta ao topo
        if (!active) return;
        e.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className={cn("flex flex-col items-center gap-1 rounded-2xl pt-0.5 touch-manipulation", focusRing)}
    >
      <span
        className={cn(
          "relative grid h-8 w-14 place-items-center rounded-full",
          active ? "bg-aura-pill text-ink" : "text-muted"
        )}
      >
        {item.icon(active)}
        {!!item.badge && (
          <span className="absolute -top-0.75 right-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-offer-strong px-1.25 font-display text-[11px] font-bold text-white ring-2 ring-white">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </span>
      <span
        className={cn(
          "whitespace-nowrap text-xs",
          active ? "font-bold text-ink" : "font-semibold text-muted"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

function PublishSheet({
  open,
  onClose,
  isPremium,
}: {
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
}) {
  const firstRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const rows = [
    {
      href: "/painel/produtos/novo",
      title: "Novo produto",
      hint: "Fotografar ou escolher da galeria",
      bg: "bg-brand-soft",
      icon: <Camera className="size-5.5 text-ink" strokeWidth={1.8} aria-hidden="true" />,
    },
    {
      href: "/painel",
      title: "Novo story",
      hint: isPremium ? "Aparece no topo da Home por 24h" : "Disponível no plano Premium",
      bg: "bg-brand-soft",
      premium: true,
      icon: (
        <span className="aura-ring block size-6.5 rounded-full p-0.75">
          <span className="block size-full rounded-full bg-white" />
        </span>
      ),
    },
    {
      href: "/painel/produtos",
      title: "Promoção",
      hint: "Aplicar desconto em produtos da loja",
      bg: "bg-error-soft",
      icon: <Tag className="size-5.5 text-error-ink" strokeWidth={1.8} aria-hidden="true" />,
    },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Fechar menu Publicar"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-[rgba(15,23,42,0.32)]"
      />
      <div
        role="dialog"
        aria-label="Publicar na sua loja"
        className="absolute bottom-[calc(100%+8px)] left-2 right-2 z-50 flex flex-col gap-0.5 rounded-[28px] bg-white px-2 pb-2.5 pt-2 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.3)] animate-slide-up"
      >
        <div className="flex justify-center pb-1.5 pt-1">
          <span className="h-1.25 w-9 rounded-full bg-slate-300" />
        </div>
        <p className="px-3 pb-2 pt-0.5 font-display text-[17px] font-semibold text-ink">
          O que você quer publicar?
        </p>
        {rows.map((r, i) => (
          <Link
            key={r.title}
            ref={i === 0 ? firstRef : undefined}
            href={r.href}
            onClick={onClose}
            className={cn("flex items-center gap-3 rounded-[18px] px-3 py-2.5 hover:bg-slate-50", focusRing)}
          >
            <span className={cn("grid size-11 flex-none place-items-center rounded-[14px]", r.bg)}>
              {r.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-display text-[15px] font-semibold text-ink">{r.title}</span>
              <span className="truncate text-[13px] text-muted">{r.hint}</span>
            </span>
            {r.premium && (
              <span className="inline-flex h-5.5 flex-none items-center rounded-full bg-amber-soft px-2 text-[11px] font-bold text-amber-ink">
                Premium
              </span>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}

/**
 * Barra inferior v2 (tema Aura, mobile).
 * Comprador: Início · Explorar · Sacola · Conta.
 * Lojista (usuário com loja): Início · Explorar · (+) Publicar · Minha loja · Painel.
 */
export function BottomNav() {
  const pathname = usePathname();
  const viewer = useViewer();
  const isMounted = useBagHydrated();
  const items = useBagStore((state) => state.items);
  const [sheet, setSheet] = useState(false);
  const [sheetPath, setSheetPath] = useState(pathname);

  // Fecha o menu Publicar ao trocar de rota
  if (sheetPath !== pathname) {
    setSheetPath(pathname);
    if (sheet) setSheet(false);
  }

  const store = viewer?.store ?? null;
  const onOwnStore = store ? pathname === `/${store.slug}` : false;
  if (!hasBottomNav(pathname) && !onOwnStore) return null;

  const bagCount = isMounted ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;

  const home: NavItem = { key: "home", href: "/", label: "Início", icon: lucide(Home), match: (p: string) => p === "/" };
  const explore: NavItem = {
    key: "explore",
    href: "/explorar",
    label: "Explorar",
    icon: lucide(Search),
    match: (p: string) => p.startsWith("/explorar"),
  };

  let navItems: (NavItem | "fab")[];
  if (!store) {
    navItems = [
      home,
      explore,
      {
        key: "bag",
        href: "/sacola",
        label: "Sacola",
        icon: lucide(ShoppingBag),
        badge: bagCount,
        badgeNoun: "itens",
        match: (p: string) => p.startsWith("/sacola"),
      },
      {
        key: "account",
        href: "/minha-conta",
        label: "Conta",
        icon: lucide(User),
        match: (p: string) => p.startsWith("/minha-conta"),
      },
    ];
  } else {
    navItems = [
      home,
      explore,
      "fab",
      {
        key: "store",
        href: `/${store.slug}`,
        label: "Minha loja",
        match: (p: string) => p === `/${store.slug}`,
        icon: (active: boolean) => (
          <span className={cn("block size-6.5 rounded-full p-0.5", active ? "aura-ring" : "bg-line")}>
            <span className="grid size-full place-items-center overflow-hidden rounded-full bg-brand-soft font-display text-[9px] font-bold text-brand-deep ring-[1.5px] ring-white">
              {store.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initialsOf(store.name)
              )}
            </span>
          </span>
        ),
      },
      {
        key: "panel",
        href: "/painel",
        label: "Painel",
        icon: lucide(BarChart3),
        match: (p: string) => p.startsWith("/painel"),
      },
    ];
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      {store && (
        <PublishSheet open={sheet} onClose={() => setSheet(false)} isPremium={store.isPremium} />
      )}
      <nav
        aria-label="Navegação principal"
        className="relative z-50 grid items-end rounded-t-3xl border-t border-media bg-white px-2 pb-[calc(24px+env(safe-area-inset-bottom))] pt-2 shadow-nav"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((it) =>
          it === "fab" ? (
            <button
              key="fab"
              type="button"
              onClick={() => setSheet((s) => !s)}
              aria-label="Publicar: novo produto, story ou promoção"
              aria-haspopup="dialog"
              aria-expanded={sheet}
              className={cn("flex cursor-pointer flex-col items-center gap-1 rounded-2xl touch-manipulation", focusRing)}
            >
              <span
                className={cn(
                  "-mt-6.5 grid size-14 place-items-center rounded-full bg-ink shadow-[0_0_0_4px_#fff,0_10px_20px_-6px_rgba(244,114,182,0.5)] transition-transform duration-200",
                  sheet && "rotate-45"
                )}
              >
                <Plus className="size-6 text-white" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-xs font-semibold text-ink">Publicar</span>
            </button>
          ) : (
            <NavLink key={it.key} item={it} active={it.match(pathname)} />
          )
        )}
      </nav>
    </div>
  );
}
