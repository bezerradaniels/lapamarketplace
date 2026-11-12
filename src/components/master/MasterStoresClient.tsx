"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PillGroup, Segmented, Switch } from "@/components/ui/Switch";
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

  const premiumCount = stores.filter((s) => s.plan_tier === "premium").length;
  const verifiedCount = stores.filter((s) => s.is_verified).length;
  const rowGrid =
    "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_180px_100px_auto] lg:gap-4 lg:items-center";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink font-display text-[11px] font-bold">
              Base de Lojas
            </span>
            <span className="text-xs text-slate-400">Bom Jesus da Lapa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Lojas de Bom Jesus da Lapa
          </h1>
          <p className="text-xs text-slate-500">
            {stores.length} lojas · {premiumCount} premium · {verifiedCount} verificadas
          </p>
        </div>
        <div className="relative flex items-center lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" strokeWidth={1.8} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar loja ou bairro"
            placeholder="Buscar loja ou bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl bg-white border border-slate-200/80 pl-9 pr-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand transition-all"
          />
        </div>
      </div>

      <PillGroup
        ariaLabel="Filtrar por plano"
        tone="brand"
        className="[&>button]:py-2 [&>button]:text-xs"
        value={planFilter}
        onToggle={(v) => setPlanFilter(v)}
        options={[
          { value: "all", label: `Todas (${stores.length})` },
          { value: "premium", label: `Premium (${premiumCount})` },
          { value: "free", label: `Gratuito (${stores.length - premiumCount})` },
        ]}
      />

      <div aria-live="polite" className="empty:hidden">
        {toast && (
          <div className="rounded-xl bg-slate-900 text-white px-3.5 py-2.5 text-xs font-semibold animate-slide-up">
            {toast}
          </div>
        )}
      </div>

      <div role="table" aria-label="Lojas" className="bg-white rounded-2xl p-3 lg:p-4 flex flex-col border border-slate-200/80">
        <div role="row" className={cn("hidden lg:grid py-2.5 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100", rowGrid)}>
          <span role="columnheader">Loja</span>
          <span role="columnheader">Bairro & Contato</span>
          <span role="columnheader">Plano</span>
          <span role="columnheader">Verificada</span>
          <span role="columnheader" className="text-right">Vitrine</span>
        </div>

        {filteredStores.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-500">Nenhuma loja encontrada.</p>
        )}

        {filteredStores.map((store, idx) => {
          const isPremium = store.plan_tier === "premium";
          return (
            <div
              role="row"
              key={store.id}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 px-3 text-xs hover:bg-slate-50/80 rounded-xl transition-colors",
                rowGrid,
                idx > 0 && "border-t border-slate-100"
              )}
            >
              <span role="cell" className="flex items-center gap-2.5 min-w-0 basis-full lg:basis-auto">
                <span className="flex-none w-8.5 h-8.5 rounded-full bg-brand-soft overflow-hidden grid place-items-center font-display text-[11px] font-extrabold text-slate-900">
                  {store.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    store.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-900 text-xs truncate">{store.name}</span>
                  <span className="text-[11px] text-slate-500 truncate">
                    lapamarketplace.com.br/{store.slug}
                  </span>
                </span>
              </span>

              <span role="cell" className="text-slate-600 flex flex-col text-xs">
                <span>{store.neighborhood_name}</span>
                <span className="text-[11px] text-slate-400">{formatWhatsAppMask(store.whatsapp)}</span>
              </span>

              <span role="cell">
                <Segmented
                  size="sm"
                  tone="brand"
                  ariaLabel={`Plano de ${store.name}`}
                  value={isPremium ? "premium" : "free"}
                  onChange={(next) => {
                    if ((next === "premium") !== isPremium) handleTogglePlan(store);
                  }}
                  options={[
                    { value: "free", label: "Gratuito" },
                    { value: "premium", label: "Premium" },
                  ]}
                  className="inline-grid text-xs"
                />
              </span>

              <span role="cell" className="flex items-center gap-2">
                <Switch
                  size="sm"
                  checked={store.is_verified}
                  onCheckedChange={() => handleToggleVerified(store)}
                  aria-label={`Selo verificado para ${store.name}`}
                />
              </span>

              <span role="cell" className="lg:text-right">
                <Link
                  href={`/${store.slug}`}
                  className="inline-flex px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-display text-xs font-bold text-slate-900 transition-colors duration-150"
                >
                  Ver loja
                </Link>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
