"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  MessageCircle,
  Search,
  Shield,
  ShoppingBag,
  UserCheck,
  Users,
} from "lucide-react";
import { PillGroup } from "@/components/ui/Switch";
import { cn, formatWhatsAppMask } from "@/lib/utils";
import type { MasterUserItem } from "@/types/marketplace";

export interface MasterUsersClientProps {
  initialUsers: MasterUserItem[];
}

export function MasterUsersClient({ initialUsers }: MasterUsersClientProps) {
  const [users] = useState<MasterUserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "merchant" | "customer" | "admin">("all");

  const merchantsCount = useMemo(
    () => users.filter((u) => u.role === "merchant").length,
    [users]
  );
  const customersCount = useMemo(
    () => users.filter((u) => u.role === "customer").length,
    [users]
  );
  const adminsCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = u.full_name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPhone = u.whatsapp?.includes(q) ?? false;
        const matchStore = u.store_name?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchEmail && !matchPhone && !matchStore) return false;
      }
      return true;
    });
  }, [users, roleFilter, search]);

  const rowGrid =
    "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_130px_minmax(0,1.3fr)_110px_110px] lg:gap-4 lg:items-center";

  return (
    <div className="flex flex-col gap-5 lg:gap-6 pb-12">
      {/* 1. Header com Métricas e Busca */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink font-display text-[11px] font-bold">
              Controle de Acessos
            </span>
            <span className="text-xs text-slate-400">Portal Bom Jesus da Lapa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Gestão de Usuários
          </h1>
          <p className="text-xs text-slate-500">
            {users.length} contas cadastradas · {merchantsCount} lojistas · {customersCount} compradores · {adminsCount} admins
          </p>
        </div>

        <div className="relative flex items-center lg:w-80">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Buscar por nome, e-mail, loja ou WhatsApp"
            placeholder="Buscar por nome, e-mail ou loja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl bg-white border border-slate-200/80 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand transition-all"
          />
        </div>
      </div>

      {/* 2. Cards de Resumo Flat */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-0.5">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brand" />
            Total de Usuários
          </span>
          <p className="font-display text-xl font-extrabold text-slate-900">
            {users.length}
          </p>
          <span className="text-[11px] text-slate-400">Contas ativas no portal</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-0.5">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-brand-dark" />
            Lojistas
          </span>
          <p className="font-display text-xl font-extrabold text-brand-dark">
            {merchantsCount}
          </p>
          <span className="text-[11px] text-slate-400">Comércios com catálogo</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-0.5">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            Compradores
          </span>
          <p className="font-display text-xl font-extrabold text-emerald-600">
            {customersCount}
          </p>
          <span className="text-[11px] text-slate-400">Público de Lapa e região</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-0.5">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            Administradores
          </span>
          <p className="font-display text-xl font-extrabold text-purple-600">
            {adminsCount}
          </p>
          <span className="text-[11px] text-slate-400">Acesso Master ao sistema</span>
        </div>
      </div>

      {/* 3. Filtros por Papel / Tipo de Conta */}
      <PillGroup
        ariaLabel="Filtrar por tipo de conta"
        tone="brand"
        className="[&>button]:py-2 [&>button]:text-xs"
        value={roleFilter}
        onToggle={(v) => setRoleFilter(v)}
        options={[
          { value: "all", label: `Todos (${users.length})` },
          { value: "merchant", label: `Lojistas (${merchantsCount})` },
          { value: "customer", label: `Compradores (${customersCount})` },
          { value: "admin", label: `Administradores (${adminsCount})` },
        ]}
      />

      {/* 4. Tabela de Usuários Flat */}
      <div
        role="table"
        aria-label="Lista de usuários cadastrados"
        className="bg-white rounded-2xl p-3 lg:p-4 flex flex-col border border-slate-200/80"
      >
        <div
          role="row"
          className={cn(
            "hidden lg:grid py-2.5 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100",
            rowGrid
          )}
        >
          <span role="columnheader">Usuário</span>
          <span role="columnheader">WhatsApp & Contato</span>
          <span role="columnheader">Tipo de Conta</span>
          <span role="columnheader">Loja Vinculada</span>
          <span role="columnheader">Bairro</span>
          <span role="columnheader" className="text-right">Cadastro</span>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-10 text-center space-y-1.5">
            <p className="font-display font-bold text-slate-900 text-sm">
              Nenhum usuário encontrado
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Verifique os filtros aplicados ou o termo digitado na busca.
            </p>
          </div>
        )}

        {filteredUsers.map((user, idx) => {
          const initials = user.full_name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase();

          const formattedDate = new Date(user.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          });

          return (
            <div
              role="row"
              key={user.id}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 px-3 text-xs hover:bg-slate-50/80 rounded-xl transition-colors",
                rowGrid,
                idx > 0 && "border-t border-slate-100"
              )}
            >
              {/* Usuário (Nome + Email + Avatar) */}
              <span role="cell" className="flex items-center gap-2.5 min-w-0 basis-full lg:basis-auto">
                <span className="flex-none w-8.5 h-8.5 rounded-full bg-slate-100 text-slate-800 font-display text-[11px] font-bold grid place-items-center overflow-hidden border border-slate-200">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials || "U"
                  )}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-900 text-xs truncate">
                    {user.full_name}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate">
                    {user.email}
                  </span>
                </span>
              </span>

              {/* WhatsApp & Contato */}
              <span role="cell" className="flex items-center gap-2 text-slate-600">
                {user.whatsapp ? (
                  <a
                    href={`https://wa.me/${user.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{formatWhatsAppMask(user.whatsapp)}</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">Não informado</span>
                )}
              </span>

              {/* Tipo de Conta */}
              <span role="cell">
                {user.role === "admin" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                ) : user.role === "merchant" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-brand-soft text-brand-ink">
                    <Building2 className="w-3 h-3" />
                    Lojista
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    <UserCheck className="w-3 h-3" />
                    Comprador
                  </span>
                )}
              </span>

              {/* Loja Vinculada */}
              <span role="cell" className="min-w-0">
                {user.store_name ? (
                  <Link
                    href={`/${user.store_slug || user.store_id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline truncate max-w-full"
                  >
                    <span className="truncate">{user.store_name}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </span>

              {/* Bairro */}
              <span role="cell" className="text-xs text-slate-600 truncate">
                {user.neighborhood_name || "Centro"}
              </span>

              {/* Data de Cadastro */}
              <span role="cell" className="text-xs text-slate-500 lg:text-right font-mono">
                {formattedDate}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

