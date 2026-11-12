"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_TONE,
  initialsOf,
  isNewStore,
  storeChips,
  storeStatusLine,
  type StoreChip,
} from "@/lib/aura-display";
import { VerifiedSeal } from "@/components/brand/LapaSymbol";
import type { StoreSummary } from "@/types/marketplace";

/** Vitrine da loja montada no servidor: até 3 fotos recentes + total + categoria principal. */
export interface StoreShowcase {
  thumbs: string[];
  productCount: number;
  category?: string | null;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light";

const CHIP_TONE: Record<StoreChip["tone"], string> = {
  success: "bg-mint-soft text-mint-ink",
  sky: "bg-sky-soft text-sky-ink",
  neutral: "bg-media text-slate-700",
};

export interface StoreCardProps {
  store: StoreSummary;
  showcase?: StoreShowcase;
  hasStory?: boolean;
  following: boolean;
  onToggleFollow: () => void;
  onOpenStory?: () => void;
}

/** Card de loja v2 (tema Aura). */
export function StoreCard({
  store,
  showcase,
  hasStory = false,
  following,
  onToggleFollow,
  onOpenStory,
}: StoreCardProps) {
  const thumbs = [...(showcase?.thumbs ?? []).slice(0, 3)];
  while (thumbs.length < 3) thumbs.push("");
  const count = showcase?.productCount ?? 0;
  const more = Math.max(0, count - 3);
  const status = storeStatusLine(store);
  const tone = STATUS_TONE[status.tone];
  const chips = storeChips(store, status);
  const isNew = isNewStore(store);
  const meta = [showcase?.category, store.neighborhood].filter(Boolean).join(" · ");

  const avatar = (
    <span
      className={cn(
        "block size-14.5 rounded-full shadow-[0_0_0_3px_#fff]",
        hasStory ? "aura-ring p-[2.5px]" : "bg-line p-px"
      )}
    >
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-brand-soft font-display text-[17px] font-bold text-brand-deep shadow-[0_0_0_2px_#fff]">
        {store.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.avatar_url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          initialsOf(store.name)
        )}
      </span>
    </span>
  );

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-3xl border border-media bg-white px-2.5 pb-3.5 pt-2.5 shadow-card transition-shadow duration-300 hover:shadow-card-brand",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand-light"
      )}
    >
      {/* Vitrine */}
      <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
        {thumbs.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-[14px] bg-media">
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                loading="lazy"
                className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
              />
            )}
            {i === 2 && more > 0 && (
              <span className="absolute inset-0 grid place-items-center bg-[rgba(15,23,42,0.55)] font-display text-sm font-bold text-white">
                +{more}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Avatar + selo */}
      <div className="relative z-10 -mt-6.5 ml-1.5 mr-1 flex items-end justify-between gap-2">
        {hasStory && onOpenStory ? (
          <button
            type="button"
            onClick={onOpenStory}
            aria-label={`Ver story de ${store.name}`}
            className={cn("cursor-pointer rounded-full", focusRing)}
          >
            {avatar}
          </button>
        ) : (
          avatar
        )}
        {isNew && (
          <span className="mb-0.5 inline-flex h-6 items-center rounded-full bg-peach-soft px-2.5 font-display text-xs font-bold text-ink">
            Nova na Lapa
          </span>
        )}
      </div>

      {/* Nome e meta */}
      <div className="flex flex-col gap-1 px-1 pt-2.5">
        <h3 className="line-clamp-2 font-display text-[17px] font-semibold leading-[1.25] tracking-[-0.015em] text-ink">
          <Link
            href={`/${store.slug}`}
            aria-label={count > 0 ? `${store.name}, ${count} produtos` : store.name}
            className="after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus:outline-none"
          >
            {store.name}
          </Link>
          {store.is_verified && <VerifiedSeal size={15} className="ml-1.25 align-[-2px]" />}
        </h3>
        {meta && <p className="truncate text-[13px] font-medium text-muted">{meta}</p>}
      </div>

      <p className="mx-1 mt-2.5 line-clamp-2 min-h-10 text-sm leading-[1.45] text-slate-600">
        {store.description}
      </p>

      {/* Status + chips */}
      <div className="mt-auto flex flex-col gap-2 px-1 pt-3">
        <p className={cn("flex min-w-0 items-center gap-1.5 text-[13px] font-semibold", tone.text)}>
          <span className={cn("size-2 flex-none rounded-full", tone.dot)} aria-hidden="true" />
          <span className="truncate">{status.label}</span>
        </p>
        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {chips.map((c) => (
              <li
                key={c.label}
                className={cn(
                  "inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.25 text-xs font-semibold",
                  CHIP_TONE[c.tone]
                )}
              >
                {c.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ações */}
      <div className="relative z-10 flex gap-2 pt-3.5">
        <Link
          href={`/${store.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="flex h-10.5 flex-1 items-center justify-center gap-1.5 rounded-full bg-media font-display text-sm font-semibold text-ink transition-colors hover:bg-line"
        >
          Ver loja <ArrowRight className="size-3.75" strokeWidth={2.2} />
        </Link>
        <button
          type="button"
          onClick={onToggleFollow}
          aria-pressed={following}
          aria-label={following ? `Seguindo ${store.name}. Deixar de seguir` : `Seguir ${store.name}`}
          className={cn(
            "grid size-10.5 flex-none cursor-pointer place-items-center rounded-full transition-colors duration-200",
            focusRing,
            following ? "bg-brand text-white" : "bg-white text-ink ring-ink hover:bg-media"
          )}
        >
          {following ? (
            <Check className="size-4.5" strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Plus className="size-4.5" strokeWidth={2.2} aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
}

export function StoreCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-full animate-pulse flex-col gap-3 rounded-3xl border border-media bg-white p-2.5 pb-3.5">
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-square rounded-[14px] bg-media" />
        ))}
      </div>
      <div className="-mt-8.5 ml-1.5 size-14.5 rounded-full border-[3px] border-white bg-media" />
      <div className="h-4 w-3/4 rounded-full bg-media" />
      <div className="h-3 w-1/2 rounded-full bg-media" />
      <div className="h-3 w-full rounded-full bg-media" />
      <div className="mt-auto flex gap-2">
        <div className="h-10.5 flex-1 rounded-full bg-media" />
        <div className="size-10.5 rounded-full bg-media" />
      </div>
    </div>
  );
}

const TABS = [
  { key: "destaque", label: "Em destaque" },
  { key: "abertas", label: "Abertas agora" },
  { key: "perto", label: "Perto de você" },
  { key: "novas", label: "Novas" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export interface FeaturedStoresSectionProps {
  stores: StoreSummary[];
  showcases?: Record<string, StoreShowcase>;
  storyStoreIds?: Set<string>;
  followingIds: Set<string>;
  onToggleFollow: (store: StoreSummary) => void;
  /** Bairro escolhido no header (aba "Perto de você"). */
  neighborhood?: string | null;
  className?: string;
}

/** Seção "Lojas em destaque" v2: abas, setas e carrossel com scroll-snap. */
export function FeaturedStoresSection({
  stores,
  showcases,
  storyStoreIds,
  followingIds,
  onToggleFollow,
  neighborhood,
  className,
}: FeaturedStoresSectionProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<TabKey>("destaque");
  const [edge, setEdge] = useState({ start: true, end: false });

  const visible = useMemo(() => {
    if (tab === "abertas") {
      return stores.filter((s) => storeStatusLine(s).tone !== "closed");
    }
    if (tab === "novas") return stores.filter((s) => isNewStore(s));
    if (tab === "perto" && neighborhood) {
      const nb = neighborhood.toLowerCase();
      return [...stores].sort(
        (a, b) =>
          Number(b.neighborhood?.toLowerCase() === nb) -
          Number(a.neighborhood?.toLowerCase() === nb)
      );
    }
    return stores;
  }, [stores, tab, neighborhood]);

  const updateEdges = () => {
    const el = railRef.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };

  const page = (dir: 1 | -1) =>
    railRef.current?.scrollBy({ left: dir * railRef.current.clientWidth, behavior: "smooth" });

  const arrow = (dir: 1 | -1, disabled: boolean) => (
    <button
      type="button"
      onClick={() => page(dir)}
      disabled={disabled}
      aria-label={dir === 1 ? "Próximas lojas" : "Lojas anteriores"}
      className={cn(
        "grid size-10 cursor-pointer place-items-center rounded-full bg-white transition-colors disabled:cursor-default",
        focusRing,
        disabled ? "text-slate-400 ring-line" : "text-ink ring-ink hover:bg-media"
      )}
    >
      {dir === 1 ? (
        <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
      ) : (
        <ArrowLeft className="size-4" strokeWidth={2.2} aria-hidden="true" />
      )}
    </button>
  );

  return (
    <section aria-labelledby="lojas-destaque" className={cn("flex flex-col gap-4 md:gap-5", className)}>
      <div className="flex items-end justify-between gap-4 px-4 md:px-0">
        <div className="flex min-w-0 flex-col gap-0.5 md:gap-1">
          <h2
            id="lojas-destaque"
            className="font-display text-[21px] font-semibold tracking-[-0.02em] text-ink md:text-[26px]"
          >
            Lojas em <span className="md:aura-text">destaque</span>
          </h2>
          <p className="text-[13px] text-muted md:text-[15px]">
            <span className="md:hidden">Atendimento direto no WhatsApp</span>
            <span className="hidden md:inline">
              Comércios de Bom Jesus da Lapa com atendimento direto no WhatsApp
            </span>
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <Link
            href="/explorar"
            className="mr-1 whitespace-nowrap font-display text-sm font-semibold text-ink underline decoration-aura-amber decoration-2 underline-offset-[3px]"
          >
            Ver todas
          </Link>
          <div className="hidden gap-2 md:flex">
            {arrow(-1, edge.start)}
            {arrow(1, edge.end)}
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="Filtrar lojas" className="hidden flex-wrap gap-2 md:flex">
        {TABS.map((t) => {
          const sel = t.key === tab;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={sel}
              onClick={() => {
                setTab(t.key);
                railRef.current?.scrollTo({ left: 0 });
                setEdge({ start: true, end: false });
              }}
              className={cn(
                "h-9 cursor-pointer rounded-full px-3.5 font-display text-sm font-semibold transition-colors",
                focusRing,
                sel ? "bg-brand text-white" : "bg-white text-ink shadow-[inset_0_0_0_1px_#E2E8F0] hover:bg-slate-50"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mx-4 rounded-3xl bg-white p-6 text-center text-sm text-muted md:mx-0">
          Nenhuma loja nesta aba agora.
        </p>
      ) : (
        <div
          ref={railRef}
          onScroll={updateEdges}
          className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:scroll-px-0 md:gap-4 md:px-0"
        >
          {visible.map((s) => (
            <div
              key={s.id}
              className="w-62 flex-none snap-start md:w-[calc((100%-16px)/2)] xl:w-[calc((100%-48px)/4)]"
            >
              <StoreCard
                store={s}
                showcase={showcases?.[s.id]}
                hasStory={storyStoreIds?.has(s.id)}
                following={followingIds.has(s.id)}
                onToggleFollow={() => onToggleFollow(s)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
