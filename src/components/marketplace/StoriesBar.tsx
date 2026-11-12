"use client";

import React, { useId, useRef, useState } from "react";
import Link from "next/link";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { VerifiedSeal } from "@/components/brand/LapaSymbol";
import { buildWhatsAppUrl, cn, formatCurrencyBRL } from "@/lib/utils";
import type { StoreWithStories } from "@/types/marketplace";

export interface StoriesBarProps {
  items: StoreWithStories[];
  className?: string;
}

export function StoriesBar({ items, className }: StoriesBarProps) {
  const [activeStoreIdx, setActiveStoreIdx] = useState<number>(0);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number>(0);
  const [seenStores, setSeenStores] = useState<Record<string, boolean>>({});

  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);
  const dialogTitleId = useId();

  // Filtra lojas que possuem stories nas últimas 24h (ou todas passadas na prop)
  const activeItems = items.filter((item) => item.stories.length > 0);

  if (activeItems.length === 0) {
    return null;
  }

  const currentGroup = activeItems[activeStoreIdx] ?? activeItems[0];
  const currentStory =
    currentGroup?.stories[activeStoryIdx] ?? currentGroup?.stories[0];

  const openStoryModal = (storeIndex: number) => {
    setActiveStoreIdx(storeIndex);
    setActiveStoryIdx(0);
    const storeId = activeItems[storeIndex]?.store.id;
    if (storeId) {
      setSeenStores((prev) => ({ ...prev, [storeId]: true }));
    }
    dialogRef.current?.showModal();
  };

  const closeStoryModal = () => {
    dialogRef.current?.close();
  };

  const goPrevStory = () => {
    if (activeStoryIdx > 0) {
      setActiveStoryIdx((prev) => prev - 1);
    } else if (activeStoreIdx > 0) {
      const prevStoreIdx = activeStoreIdx - 1;
      setActiveStoreIdx(prevStoreIdx);
      setActiveStoryIdx(activeItems[prevStoreIdx].stories.length - 1);
    }
  };

  const goNextStory = () => {
    if (!currentGroup) return;
    if (activeStoryIdx < currentGroup.stories.length - 1) {
      setActiveStoryIdx((prev) => prev + 1);
    } else if (activeStoreIdx < activeItems.length - 1) {
      const nextStoreIdx = activeStoreIdx + 1;
      setActiveStoreIdx(nextStoreIdx);
      setActiveStoryIdx(0);
      const nextStoreId = activeItems[nextStoreIdx]?.store.id;
      if (nextStoreId) {
        setSeenStores((prev) => ({ ...prev, [nextStoreId]: true }));
      }
    } else {
      closeStoryModal();
    }
  };

  const isOutsideDialog = (
    e: React.PointerEvent<HTMLDialogElement>,
    dialog: HTMLDialogElement
  ) => {
    const rect = dialog.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  return (
    <>
      <section
        aria-label="Stories das lojas parceiras em Bom Jesus da Lapa"
        className={cn(
          "w-full overflow-x-auto no-scrollbar",
          className
        )}
      >
        <div className="flex items-start gap-3 min-w-max">
          {activeItems.map((item, idx) => {
            const isSeen =
              seenStores[item.store.id] || item.hasUnseen === false;
            const isPremium =
              item.store.plan === "premium" || item.store.plan === "pro";

            return (
              <button
                key={item.store.id}
                type="button"
                onClick={() => openStoryModal(idx)}
                className="group flex flex-col items-center gap-1.5 w-16 shrink-0 cursor-pointer select-none touch-manipulation focus-visible:outline-none"
              >
                {/* Anel colorido gradiente para lojas Premium com stories ativos */}
                <div
                  className={cn(
                    "w-16 h-16 p-[2.5px] rounded-full transition-transform duration-150 group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-brand-light group-focus-visible:ring-offset-2",
                    isSeen
                      ? "bg-slate-200"
                      : isPremium
                      ? "bg-story-premium"
                      : "bg-brand"
                  )}
                >
                  <div className="w-full h-full p-[2.5px] bg-slate-50 rounded-full">
                    <div className="w-full h-full rounded-full bg-brand-soft overflow-hidden relative flex items-center justify-center">
                      {item.store.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.store.avatar_url}
                          alt={item.store.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-display text-base font-extrabold text-slate-900">
                          {item.store.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] text-slate-900 truncate w-full text-center">
                  {item.store.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Modal Fullscreen de Stories */}
      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        closedby="any"
        onPointerDown={(e) => {
          if (dialogRef.current) {
            pressedOutsideRef.current = isOutsideDialog(e, dialogRef.current);
          }
        }}
        onPointerUp={(e) => {
          if (
            dialogRef.current &&
            pressedOutsideRef.current &&
            isOutsideDialog(e, dialogRef.current)
          ) {
            dialogRef.current.close();
          }
          pressedOutsideRef.current = false;
        }}
        className={cn(
          "m-auto w-full h-dvh max-w-md max-h-215 sm:h-[90dvh] sm:rounded-[28px] bg-slate-900 text-white p-0 overflow-hidden shadow-float",
          "backdrop:bg-slate-900/85"
        )}
      >
        {currentGroup && currentStory && (
          <div className="relative w-full h-full flex flex-col justify-between select-none">
            {/* Barras de progresso superiores */}
            <div className="relative z-20 pt-3 px-3 space-y-3 bg-linear-to-b from-black/75 via-black/30 to-transparent pb-6">
              <div className="flex items-center gap-1.5">
                {currentGroup.stories.map((st, sIdx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveStoryIdx(sIdx)}
                    aria-label={`Ver story ${sIdx + 1} de ${currentGroup.stories.length}`}
                    className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden cursor-pointer"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        sIdx <= activeStoryIdx ? "w-full bg-brand" : "w-0"
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Info da Loja + Botão Fechar */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-soft text-slate-900 ring-2 ring-brand overflow-hidden shrink-0 flex items-center justify-center font-display font-extrabold text-xs">
                    {currentGroup.store.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentGroup.store.avatar_url}
                        alt={currentGroup.store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentGroup.store.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h2
                        id={dialogTitleId}
                        className="text-[15px] font-bold text-white truncate"
                      >
                        {currentGroup.store.name}
                      </h2>
                      {currentGroup.store.is_verified && (
                        <VerifiedSeal size={16} />
                      )}
                    </div>
                    <p className="text-[11px] text-white/75 truncate">
                      {currentGroup.store.neighborhood} · Novidade 24h
                    </p>
                  </div>
                </div>

                <form method="dialog">
                  <button
                    type="submit"
                    aria-label="Fechar stories"
                    autoFocus
                    className="w-10.5 h-10.5 rounded-[14px] bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>

            {/* Imagem Principal do Story */}
            <div className="absolute inset-0 z-10 bg-slate-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentStory.media_url}
                alt={
                  currentStory.caption ||
                  `Story de ${currentGroup.store.name}`
                }
                className="w-full h-full object-cover"
              />
            </div>

            {/* Controles laterais Anterior / Próximo */}
            <div className="relative z-20 flex-1 flex items-center justify-between px-2 pointer-events-none">
              <button
                type="button"
                onClick={goPrevStory}
                aria-label="Story anterior"
                className="pointer-events-auto w-10.5 h-10.5 rounded-[14px] bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goNextStory}
                aria-label="Próximo story"
                className="pointer-events-auto w-10.5 h-10.5 rounded-[14px] bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Rodapé do Story com Legenda + Ação Rápida de Produto/WhatsApp */}
            <div className="relative z-20 p-4 space-y-3 bg-linear-to-t from-black/85 via-black/50 to-transparent pt-10">
              {currentStory.caption && (
                <p className="text-sm text-white/95 font-medium leading-snug">
                  {currentStory.caption}
                </p>
              )}

              {currentStory.product_title && (
                <div className="flex items-center justify-between gap-3 rounded-[18px] bg-white/15 backdrop-blur-md p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {currentStory.product_title}
                    </p>
                    {currentStory.product_price != null && (
                      <p className="font-display text-base font-extrabold text-brand">
                        {formatCurrencyBRL(currentStory.product_price)}
                      </p>
                    )}
                  </div>

                  {currentStory.cta_url ? (
                    <Link
                      href={currentStory.cta_url}
                      onClick={closeStoryModal}
                      className="shrink-0 inline-flex items-center rounded-xl bg-white text-slate-900 px-3 py-2.25 font-display text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      Ver produto
                    </Link>
                  ) : null}
                </div>
              )}

              <div className="flex items-center gap-2">
                <a
                  href={buildWhatsAppUrl({
                    phone: currentGroup.store.whatsapp,
                    storeName: currentGroup.store.name,
                    productTitle:
                      currentStory.product_title || currentStory.caption || undefined,
                    productPrice: currentStory.product_price ?? undefined,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-13 rounded-[17px] bg-whatsapp hover:bg-whatsapp-strong text-white font-display text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Responder no WhatsApp</span>
                </a>

                <Link
                  href={`/${currentGroup.store.slug}`}
                  onClick={closeStoryModal}
                  className="h-13 px-4.5 rounded-[17px] bg-white/15 hover:bg-white/25 text-white font-display text-sm font-bold flex items-center justify-center transition-colors"
                >
                  Ver loja
                </Link>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
