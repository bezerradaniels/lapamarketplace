"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Store,
  Search,
  BadgeCheck,
  Crown,
  MapPin,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { updateStoreAdminStatusAction } from "@/app/actions/master";
import { cn, formatWhatsAppMask } from "@/lib/utils";
import type { MerchantStoreConfig } from "@/types/marketplace";

export interface MasterStoresClientProps {
  initialStores: MerchantStoreConfig[];
}

export function MasterStoresClient({
  initialStores,
}: MasterStoresClientProps) {
  const [stores, setStores] = useState<MerchantStoreConfig[]>(initialStores);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "premium" | "free">(
    "all"
  );
  const [toast, setToast] = useState<string>("");
  const [, startTransition] = useTransition();

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  };

  const handleTogglePlan = (store: MerchantStoreConfig) => {
    const nextPlan: "free" | "premium" =
      store.plan_tier === "premium" ? "free" : "premium";

    setStores((prev) =>
      prev.map((s) =>
        s.id === store.id ? { ...s, plan_tier: nextPlan } : s
      )
    );

    startTransition(async () => {
      await updateStoreAdminStatusAction(store.id, { plan_tier: nextPlan });
      notify(
        `Plano de "${store.name}" alterado para ${
          nextPlan === "premium" ? "Premium ⭐" : "Gratuito"
        }.`
      );
    });
  };

  const handleToggleVerified = (store: MerchantStoreConfig) => {
    const nextVerified = !store.is_verified;

    setStores((prev) =>
      prev.map((s) =>
        s.id === store.id ? { ...s, is_verified: nextVerified } : s
      )
    );

    startTransition(async () => {
      await updateStoreAdminStatusAction(store.id, {
        is_verified: nextVerified,
      });
      notify(
        nextVerified
          ? `Selo Loja Verificada ativado para "${store.name}"!`
          : `Selo Loja Verificada removido de "${store.name}".`
      );
    });
  };

  const filteredStores = stores.filter((s) => {
    if (planFilter !== "all" && s.plan_tier !== planFilter) return false;
    if (
      search.trim() &&
      !s.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      !s.neighborhood_name.toLowerCase().includes(search.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Resumo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestão de Lojas, Planos & Selo Verificado
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ative o Plano Premium ⭐ ou o Selo Verificado em 1 clique para
            qualquer loja de Bom Jesus da Lapa.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3.5 py-2 text-amber-800">
            Premium ⭐: {stores.filter((s) => s.plan_tier === "premium").length}
          </span>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3.5 py-2 text-blue-800">
            Verificadas: {stores.filter((s) => s.is_verified).length}
          </span>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filtros + Busca */}
      <div className="rounded-3xl bg-white p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "all", label: `Todas (${stores.length})` },
              {
                id: "premium",
                label: `Premium ⭐ (${
                  stores.filter((s) => s.plan_tier === "premium").length
                })`,
              },
              {
                id: "free",
                label: `Gratuito (${
                  stores.filter((s) => s.plan_tier === "free").length
                })`,
              },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setPlanFilter(f.id)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-bold transition-all cursor-pointer",
                planFilter === f.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-80">
          <Input
            placeholder="Buscar loja por nome ou bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            pill
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Tabela de Lojas */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Loja & Link</th>
                <th className="py-3.5 px-4">Bairro & WhatsApp</th>
                <th className="py-3.5 px-4">Selo Verificada (`is_verified`)</th>
                <th className="py-3.5 px-4">Plano (`plan_tier`)</th>
                <th className="py-3.5 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStores.map((store) => {
                const isPremium = store.plan_tier === "premium";
                return (
                  <tr
                    key={store.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Coluna 1: Loja */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {store.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={store.avatar_url}
                              alt={store.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">
                              {store.name}
                            </span>
                            {store.is_verified && (
                              <BadgeCheck className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            /{store.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coluna 2: Bairro e WhatsApp */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {store.neighborhood_name}
                        </span>
                        <p className="text-xs text-slate-500">
                          {formatWhatsAppMask(store.whatsapp)}
                        </p>
                      </div>
                    </td>

                    {/* Coluna 3: Switch `is_verified` */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={store.is_verified}
                          aria-label={`Alternar selo verificado para ${store.name}`}
                          onClick={() => handleToggleVerified(store)}
                          className={cn(
                            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                            store.is_verified ? "bg-blue-600" : "bg-slate-200"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition duration-200",
                              store.is_verified
                                ? "translate-x-5"
                                : "translate-x-0"
                            )}
                          />
                        </button>
                        <span
                          className={cn(
                            "text-xs font-bold",
                            store.is_verified
                              ? "text-blue-700"
                              : "text-slate-400"
                          )}
                        >
                          {store.is_verified ? "Verificada" : "Não verificada"}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 4: Switch `plan_tier` (free vs premium) */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isPremium}
                          aria-label={`Alternar plano Premium para ${store.name}`}
                          onClick={() => handleTogglePlan(store)}
                          className={cn(
                            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                            isPremium ? "bg-amber-500" : "bg-slate-200"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition duration-200",
                              isPremium ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                        {isPremium ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
                            <Crown className="w-3 h-3" />
                            Premium ⭐
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                            Gratuito (free)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Coluna 5: Ações */}
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/${store.slug}`}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors"
                      >
                        <span>Ver Vitrine</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

