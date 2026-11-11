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
    "lg:grid lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_170px_100pxauto] lg:gap-3 lg:items-center";

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">
            Lojas de Bom Jesus da Lapa
          </h1>
          <p className="text-sm text-slate-500">
            {stores.length} lojas · {premiumCount} premium · {verifiedCount} verificadas
          </p>
        </div>
        <div className="relative flex items-center lg:w-80">
          <Search className="w-4.25 h-4.25 text-slate-500 absolute left-3.5 pointer-events-none" strokeWidth={1.8} aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar loja ou bairro"
            placeholder="Buscar loja ou bairro"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-[15px] bg-slate-100 pl-10.5 pr-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-[background-color,box-shadow] duration-150"
          />
        </div>
      </div>

      <PillGroup
        ariaLabel="Filtrar por plano"
        tone="brand"
        className="[&>button]:py-2.5"
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
          <div className="rounded-[18px] bg-slate-900 text-white px-4 py-3 text-[13px] font-semibold animate-slide-up">
            {toast}
          </div>
        )}
      </div>

      <div role="table" aria-label="Lojas" className="bg-white rounded-3xl px-4 lg:px-5 py-2 flex flex-col">
        <div role="row" className={cn("hidden py-3 text-xs text-slate-500", rowGrid)}>
          <span role="columnheader">Loja</span>
          <span role="columnheader">Bairro</span>
          <span role="columnheader">Plano</span>
          <span role="columnheader">Verificada</span>
          <span role="columnheader">Vitrine</span>
        </div>

        {filteredStores.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">Nenhuma loja encontrada.</p>
        )}

        {filteredStores.map((store, idx) => {
          const isPremium = store.plan_tier === "premium";
          return (
            <div
              role="row"
              key={store.id}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2.5 py-3 text-sm",
                rowGrid,
                idx > 0 && "border-t border-slate-100"
              )}
            >
              <span role="cell" className="flex items-center gap-3 min-w-0 basis-full lg:basis-auto">
                <span className="flex-none w-10 h-10 rounded-full bg-brand-soft overflow-hidden grid place-items-center font-display text-xs font-extrabold text-slate-900">
                  {store.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    store.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="font-semibold text-slate-900 truncate">{store.name}</span>
                  <span className="text-xs text-slate-500 truncate">
                    lapamarketplace.com.br/{store.slug}
                  </span>
                </span>
              </span>

              <span role="cell" className="text-slate-500 flex flex-col">
                {store.neighborhood_name}
                <span className="text-xs">{formatWhatsAppMask(store.whatsapp)}</span>
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
                  className="inline-grid"
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
                  className="inline-flex px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-display text-xs font-bold text-slate-900 transition-colors duration-150"
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
