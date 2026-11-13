"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialsOf, isNewStore } from "@/lib/aura-display";
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
        "group relative flex h-full flex-col rounded-3xl border border-media bg-white px-2.5 pb-3.5 pt-2.5",
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
          <span className="mb-0.5 inline-flex h-6 items-center rounded-full bg-sky-soft px-2.5 font-display text-xs font-bold text-sky-ink">
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

      {/* Ações */}
      <div className="relative z-10 mt-auto flex gap-2 pt-3.5">
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
            following
              ? "bg-offer/10 text-offer ring-1 ring-offer/30 hover:bg-offer/15"
              : "bg-white text-ink ring-ink hover:bg-media"
          )}
        >
          <Heart
            className={cn("size-5 transition-transform duration-200", following ? "fill-offer text-offer scale-110" : "text-ink")}
            strokeWidth={1.8}
            aria-hidden="true"
          />
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

export interface FeaturedStoresSectionProps {
  stores: StoreSummary[];
  showcases?: Record<string, StoreShowcase>;
  storyStoreIds?: Set<string>;
  followingIds: Set<string>;
  onToggleFollow: (store: StoreSummary) => void;
  /** Bairro escolhido no header. */
  neighborhood?: string | null;
  className?: string;
  idPrefix?: string;
}

/** Seção "Lojas em destaque" v2: carrossel com scroll-snap. */
export function FeaturedStoresSection({
  stores,
  showcases,
  storyStoreIds,
  followingIds,
  onToggleFollow,
  neighborhood,
  className,
  idPrefix,
}: FeaturedStoresSectionProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const headingId = idPrefix ? `${idPrefix}-lojas-destaque` : "lojas-destaque";

  const visible = useMemo(() => {
    if (!neighborhood) return stores;
    const nb = neighborhood.toLowerCase();
    return [...stores].sort(
      (a, b) =>
        Number(b.neighborhood?.toLowerCase() === nb) -
        Number(a.neighborhood?.toLowerCase() === nb)
    );
  }, [stores, neighborhood]);

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
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-4 md:gap-5", className)}>
      <div className="flex items-end justify-between gap-4 px-4 md:px-0">
        <div className="flex min-w-0 flex-col gap-0.5 md:gap-1">
          <h2
            id={headingId}
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

      {visible.length === 0 ? (
        <p className="mx-4 rounded-3xl bg-white p-6 text-center text-sm text-muted md:mx-0">
          Nenhuma loja disponível no momento.
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
              className="w-62 flex-none snap-start md:w-[calc((100%-16px)/2)] lg:w-[calc((100%-32px)/3)] xl:w-[calc((100%-32px)/3)]"
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
