import React from "react";
import Link from "next/link";
import { BarChart3, Check, ExternalLink } from "lucide-react";
import { LapaSymbol } from "@/components/brand/LapaSymbol";
import {
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
} from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface OwnStoreSummary {
  name: string;
  slug: string;
  avatarUrl: string | null;
  isPremium: boolean;
}

export interface AccountStoreTabProps {
  ownStore: OwnStoreSummary | null;
}

const BENEFITS = [
  "Catálogo grátis com fotos, preços e tamanhos",
  "Pedidos chegam direto no seu WhatsApp",
  "Stories e promoções para quem segue sua loja",
];

/**
 * Aba "Loja" da Minha conta.
 * - Sem loja: convite para criar (onboarding já no passo de lojista).
 * - Com loja: atalho para o painel e para a vitrine pública.
 */
export function AccountStoreTab({ ownStore }: AccountStoreTabProps) {
  if (ownStore) {
    const initials = ownStore.name.slice(0, 2).toUpperCase();

    return (
      <div className="max-w-2xl rounded-[28px] bg-white p-4 md:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3.5">
          <span
            className={cn(
              "flex-none w-16 h-16 rounded-full p-0.75",
              ownStore.isPremium ? "aura-ring" : "bg-line"
            )}
          >
            <span className="w-full h-full rounded-full bg-sky-soft ring-2 ring-white overflow-hidden grid place-items-center font-display text-base font-extrabold text-sky-ink">
              {ownStore.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ownStore.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </span>
          </span>

          <div className="min-w-0 flex-1 flex flex-col gap-1 items-start">
            <span className="text-xs font-semibold text-slate-500">
              Sua loja
            </span>
            <h2 className="font-display text-[19px] font-extrabold text-slate-900 leading-tight truncate max-w-full">
              {ownStore.name}
            </h2>
            {ownStore.isPremium && (
              <span className="px-2 py-0.5 rounded-full bg-amber-soft text-amber-ink text-[11px] font-bold">
                Premium
              </span>
            )}
          </div>
        </div>

        <p className="text-[13px] text-slate-500 leading-normal">
          Produtos, pedidos e configurações da loja ficam no painel. Aqui em
          Minha conta ficam suas compras e favoritos como cliente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Link
            href="/painel"
            className={cn(
              buttonBaseClasses,
              buttonVariantClasses.primary,
              buttonSizeClasses.lg
            )}
          >
            <BarChart3 className="w-5 h-5" strokeWidth={1.9} aria-hidden="true" />
            Abrir painel
          </Link>
          <Link
            href={`/${ownStore.slug}`}
            className={cn(
              buttonBaseClasses,
              buttonVariantClasses.secondary,
              buttonSizeClasses.lg
            )}
          >
            <ExternalLink
              className="w-4.5 h-4.5"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            Ver minha loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl p-5 md:p-7 rounded-[28px] brisa-ceu border border-slate-100 flex flex-col gap-4">
      <LapaSymbol size={40} variant="solid" />

      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[22px] md:text-2xl font-extrabold tracking-[-0.02em] leading-[1.15] text-slate-900 text-balance">
          Tem uma loja em Lapa? Crie seu catálogo{" "}
          <span className="aura-text">grátis</span>.
        </h2>
        <p className="text-sm text-slate-600 leading-normal">
          Use a mesma conta para vender: seus clientes encontram a loja no
          portal e fecham o pedido com você.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {BENEFITS.map((benefit) => (
          <li
            key={benefit}
            className="flex items-start gap-2.5 text-sm text-slate-800"
          >
            <span
              aria-hidden="true"
              className="flex-none mt-px w-5 h-5 rounded-full bg-sky-soft grid place-items-center text-sky-ink"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
            </span>
            {benefit}
          </li>
        ))}
      </ul>

      <Link
        href="/onboarding?tipo=merchant"
        className={cn(
          buttonBaseClasses,
          buttonVariantClasses.primary,
          buttonSizeClasses.lg,
          "w-full sm:w-auto sm:self-start"
        )}
      >
        Criar minha loja grátis
      </Link>
    </div>
  );
}
