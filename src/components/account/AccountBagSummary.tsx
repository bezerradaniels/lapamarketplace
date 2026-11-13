"use client";

import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useBagHydrated, useBagStore } from "@/store/useBagStore";
import {
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
} from "@/components/ui/Button";
import { cn, formatCurrencyBRL } from "@/lib/utils";

/**
 * Aba "Compras" da Minha conta: resumo da sacola atual (o pedido é fechado
 * no WhatsApp da loja, então não há histórico salvo no portal).
 */
export function AccountBagSummary() {
  const isHydrated = useBagHydrated();
  const items = useBagStore((s) => s.items);

  if (!isHydrated) {
    return (
      <div className="rounded-[28px] bg-white p-8 grid place-items-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[28px] bg-white p-8 text-center flex flex-col items-center gap-3 max-w-lg mx-auto">
        <h2 className="text-[19px] font-extrabold text-slate-900 text-balance">
          Sua sacola está vazia
        </h2>
        <p className="text-sm text-slate-500 leading-normal">
          Adicione produtos das lojas de Lapa e finalize o pedido direto no
          WhatsApp.
        </p>
        <Link
          href="/"
          className={cn(
            buttonBaseClasses,
            buttonVariantClasses.primary,
            buttonSizeClasses.md
          )}
        >
          Explorar produtos
        </Link>
      </div>
    );
  }

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-2xl rounded-[28px] bg-white p-4 md:p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[19px] font-extrabold text-slate-900">
          Minha sacola
        </h2>
        <p className="text-[13px] text-slate-500 leading-normal">
          {totalItems} {totalItems === 1 ? "item" : "itens"} esperando para
          fechar o pedido.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.cartItemId} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover bg-slate-100 shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="font-display text-sm font-bold text-slate-900 truncate">
                {item.name}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {item.store.name}
                {item.selectedSize ? ` · Tam. ${item.selectedSize}` : ""}
              </span>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-display text-sm font-bold text-slate-900">
                {formatCurrencyBRL(item.price * item.quantity)}
              </span>
              <span className="text-xs text-slate-500">
                {item.quantity}×
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
        <span className="text-sm text-slate-500">Total</span>
        <span className="font-display text-lg font-extrabold text-slate-900">
          {formatCurrencyBRL(totalAmount)}
        </span>
      </div>

      <Link
        href="/sacola"
        className={cn(
          buttonBaseClasses,
          buttonVariantClasses.primary,
          buttonSizeClasses.lg,
          "w-full sm:w-auto sm:self-start"
        )}
      >
        Ver sacola e finalizar
      </Link>
    </div>
  );
}
