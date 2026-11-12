"use client";

import React, { useMemo, useState, useTransition } from "react";
import { MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { upsertNeighborhoodAction } from "@/app/actions/master";
import { cn, sanitizeStoreSlug } from "@/lib/utils";
import type { NeighborhoodItem } from "@/types/marketplace";

export interface MasterNeighborhoodsClientProps {
  initialNeighborhoods: NeighborhoodItem[];
}

export function MasterNeighborhoodsClient({
  initialNeighborhoods,
}: MasterNeighborhoodsClientProps) {
  const [neighborhoods, setNeighborhoods] =
    useState<NeighborhoodItem[]>(initialNeighborhoods);
  const [newNbName, setNewNbName] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3000);
  };

  const activeCount = useMemo(
    () => neighborhoods.filter((nb) => nb.is_active !== false).length,
    [neighborhoods]
  );

  const filteredNeighborhoods = useMemo(() => {
    return neighborhoods
      .filter((nb) => {
        if (!search.trim()) return true;
        return nb.name.toLowerCase().includes(search.trim().toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [neighborhoods, search]);

  const handleAddNeighborhood = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNbName.trim();
    if (!trimmed) return;

    const slug = sanitizeStoreSlug(trimmed);
    const existing = neighborhoods.find(
      (n) => n.slug === slug || n.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      notify(`O bairro "${trimmed}" já está cadastrado.`);
      return;
    }

    const newNb: NeighborhoodItem = {
      id: `nb-${Date.now()}`,
      name: trimmed,
      slug,
      is_active: true,
    };

    setNeighborhoods((prev) => [...prev, newNb]);
    setNewNbName("");

    startTransition(async () => {
      const res = await upsertNeighborhoodAction({
        name: trimmed,
        is_active: true,
      });

      if (res.error) {
        notify(res.error);
      } else {
        notify(`Bairro "${trimmed}" cadastrado com sucesso!`);
      }
    });
  };

  const handleToggleNeighborhood = (nb: NeighborhoodItem) => {
    const nextActive = nb.is_active === false ? true : false;

    setNeighborhoods((prev) =>
      prev.map((item) =>
        item.id === nb.id ? { ...item, is_active: nextActive } : item
      )
    );

    startTransition(async () => {
      const res = await upsertNeighborhoodAction({
        id: nb.id,
        name: nb.name,
        is_active: nextActive,
      });

      if (res.error) {
        notify(res.error);
      } else {
        notify(
          nextActive
            ? `Bairro "${nb.name}" ativado!`
            : `Bairro "${nb.name}" pausado do marketplace.`
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 lg:gap-6 pb-12">
      {/* Toast Notification Flat */}
      <div aria-live="polite" className="empty:hidden">
        {toast && (
          <div className="fixed top-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-3.5 py-2.5 text-xs font-semibold border border-slate-800 animate-slide-up flex items-center gap-2">
            <span>{toast}</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink font-display text-[11px] font-bold">
              Território Municipal
            </span>
            <span className="text-xs text-slate-400">Bom Jesus da Lapa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Gestão de Bairros
          </h1>
          <p className="text-xs text-slate-500">
            {neighborhoods.length} bairros mapeados · {activeCount} ativos nos filtros do portal e cadastro de lojistas
          </p>
        </div>

        {/* Busca de Bairro */}
        <div className="relative flex items-center lg:w-80">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Buscar bairro"
            placeholder="Buscar bairro por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl bg-white border border-slate-200/80 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand transition-all"
          />
        </div>
      </div>

      {/* Card de Adição Rápida de Novo Bairro Flat */}
      <div className="rounded-2xl bg-white p-4 border border-slate-200/80">
        <form onSubmit={handleAddNeighborhood} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Input
              label="Cadastrar Novo Bairro em Bom Jesus da Lapa"
              placeholder="Ex: São Miguel, Nova Brasília, Amaralina..."
              value={newNbName}
              onChange={(e) => setNewNbName(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isPending || !newNbName.trim()}
            className="shrink-0 w-full sm:w-auto text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Bairro
          </Button>
        </form>
      </div>

      {/* Lista / Grid de Bairros Organizada Flat */}
      <div className="rounded-2xl bg-white p-4 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          <span>Bairro de Bom Jesus da Lapa</span>
          <span>Status no Portal</span>
        </div>

        {filteredNeighborhoods.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            Nenhum bairro encontrado para a busca.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredNeighborhoods.map((nb) => {
            const isActive = nb.is_active !== false;

            return (
              <div
                key={nb.id}
                className={cn(
                  "p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5",
                  isActive
                    ? "bg-slate-50/70 border-slate-200/80 hover:bg-slate-50"
                    : "bg-slate-100/50 border-slate-200/40 opacity-60"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg grid place-items-center shrink-0",
                      isActive
                        ? "bg-brand-soft text-brand-dark"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-xs font-bold text-slate-900 truncate">
                      {nb.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      slug: {nb.slug || sanitizeStoreSlug(nb.name)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-xs font-semibold hidden sm:inline",
                      isActive ? "text-emerald-700" : "text-slate-400"
                    )}
                  >
                    {isActive ? "Ativo" : "Pausado"}
                  </span>
                  <Switch
                    size="sm"
                    checked={isActive}
                    onCheckedChange={() => handleToggleNeighborhood(nb)}
                    aria-label={`Ativar ou pausar bairro ${nb.name}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
