"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Clock,
  Eye,
  Flame,
  HelpCircle,
  MessageCircle,
  Package,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MasterDashboardData } from "@/types/marketplace";

export interface MasterDashboardClientProps {
  data: MasterDashboardData;
}

type PeriodFilter = "7d" | "30d" | "90d" | "all";

export function MasterDashboardClient({ data }: MasterDashboardClientProps) {
  const [period, setPeriod] = useState<PeriodFilter>("7d");

  const totalViews = Math.round(
    data.engagement.totalViews *
      (period === "7d" ? 0.3 : period === "30d" ? 1 : 2.5)
  );
  const totalWhatsappClicks = Math.round(
    data.engagement.totalWhatsappClicks *
      (period === "7d" ? 0.3 : period === "30d" ? 1 : 2.5)
  );

  return (
    <div className="flex flex-col gap-5 lg:gap-6 pb-12">
      {/* 1. Header do Dashboard com Seletor de Período */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink font-display text-[11px] font-bold">
              Torre de Controle
            </span>
            <span className="text-xs text-slate-400">Bom Jesus da Lapa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Dashboard Executivo
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Acompanhamento semanal de adesão dos lojistas, funil de ativação de catálogo e métricas de impacto no comércio de Bom Jesus da Lapa.
          </p>
        </div>

        {/* Filtros de Período */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            role="tablist"
            aria-label="Período do relatório"
            className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80"
          >
            {(
              [
                ["7d", "7 dias"],
                ["30d", "30 dias"],
                ["90d", "90 dias"],
                ["all", "Histórico"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                role="tab"
                aria-selected={period === val}
                onClick={() => setPeriod(val)}
                className={cn(
                  "h-7.5 px-3 rounded-lg font-display text-xs font-bold transition duration-150 cursor-pointer select-none",
                  period === val
                    ? "bg-white text-slate-900 border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 h-8.5 px-3 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>06 Nov, 2026 – 12 Nov, 2026</span>
          </div>
        </div>
      </div>

      {/* 2. Hero Card Executivo Estilo RediRedi (Deep Night / Indigo Flat) */}
      <div className="rounded-2xl bg-[#0B1528] text-white p-5 sm:p-6 border border-white/10 relative overflow-hidden">
        {/* Glow sutil */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand/10 blur-2xl pointer-events-none"
        />

        {/* Topo do Card: Título do Ciclo Semanal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10 relative">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                Ritmo da semana contra a meta
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold ring-1 ring-emerald-500/30">
                Semana Ativa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {data.weeklyTarget.periodLabel} · Ciclos calculados de domingo a sábado
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Atualizado agora
          </span>
        </div>

        {/* Linha das Metas da Semana */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-5 pb-6 items-start relative">
          {/* 1. Novas + Reativadas */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Novas + Reativadas
              </span>
              <span className="font-display text-2xl font-extrabold text-white">
                {data.weeklyTarget.newReactivated}
              </span>
            </div>
            {/* Barra de Progresso */}
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (data.weeklyTarget.newReactivated /
                      data.weeklyTarget.newReactivatedGoal) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="text-amber-300 font-semibold">
                Ritmo: {Math.round((data.weeklyTarget.newReactivated / data.weeklyTarget.newReactivatedGoal) * 100)}%
              </span>
              <span>Meta: {data.weeklyTarget.newReactivatedGoal} lojas</span>
            </div>
          </div>

          {/* 2. Lojas Pausadas / Churn */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Lojas Pausadas (Churn)
              </span>
              <span className="font-display text-2xl font-extrabold text-white">
                {data.weeklyTarget.churn}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (data.weeklyTarget.churn / data.weeklyTarget.churnLimit) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="text-emerald-300 font-semibold">
                Sob controle
              </span>
              <span>Limite: {data.weeklyTarget.churnLimit}</span>
            </div>
          </div>

          {/* 3. Crescimento Líquido */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Crescimento Líquido
              </span>
              <span className="font-display text-2xl font-extrabold text-emerald-400">
                +{data.weeklyTarget.netGrowth}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-brand-light transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (data.weeklyTarget.netGrowth /
                      data.weeklyTarget.netGrowthGoal) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="text-brand-light font-semibold">
                +{data.weeklyTarget.netGrowth} líquidas
              </span>
              <span>Meta: +{data.weeklyTarget.netGrowthGoal}</span>
            </div>
          </div>

          {/* 4. Resumo da Semana Anterior */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col justify-between gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Semana Anterior
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Novas + reativadas:</span>
                <span className="font-bold text-white">
                  {data.weeklyTarget.lastWeek.newReactivated}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Lojas pausadas:</span>
                <span className="font-bold text-white">
                  {data.weeklyTarget.lastWeek.churn}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10 text-emerald-400 font-bold">
                <span>Saldo líquido:</span>
                <span>+{data.weeklyTarget.lastWeek.netGrowth}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-white/10 pt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Macro 1: Assinantes Premium */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Assinantes Premium
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-extrabold text-white">
                  {data.macroKpis.payingSubscribers}
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {Math.round(
                    (data.macroKpis.payingSubscribers /
                      data.macroKpis.totalStoresEver) *
                      100
                  )}
                  % da base
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lojas com destaque máximo e selo
              </p>
            </div>

            {/* Macro 2: Lojas em Onboarding */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Em Onboarding / Teste
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-extrabold text-white">
                  {data.macroKpis.onTrialNow}
                </span>
                <span className="text-xs font-bold text-sky-300">
                  Novos nos 30d
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Montando catálogo e vitrine
              </p>
            </div>

            {/* Macro 3: Compradores Ativos */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Visitantes Ativos (15d)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-extrabold text-white">
                  {data.macroKpis.activeVisitors15d.toLocaleString("pt-BR")}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  +18% mês
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Público comprador de Lapa
              </p>
            </div>

            {/* Macro 4: Total de Lojas Criadas */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-light" />
                Lojas Cadastradas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-extrabold text-white">
                  {data.macroKpis.totalStoresEver}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Total da cidade
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Comércios de Bom Jesus da Lapa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Seção Intermediária: Coortes de Ativação (70%) + Oportunidades de Venda (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Tabela de Coortes / Funil Semanal (8 colunas) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Coortes de ativação de lojistas
              </h2>
              <p className="text-xs text-slate-500">
                Lojas agrupadas pela semana de cadastro. Acompanhe a velocidade em colocar produtos e gerar vendas.
              </p>
            </div>
            <span className="text-xs font-bold text-brand bg-brand-soft px-2.5 py-0.5 rounded-full shrink-0">
              Semanal
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-2.5 pr-4">Semana</th>
                  <th className="pb-2.5 px-3 text-center">Cadastros</th>
                  <th className="pb-2.5 px-3">Tem produto (1+)</th>
                  <th className="pb-2.5 px-3">Catálogo (5+)</th>
                  <th className="pb-2.5 px-3">Cliques WhatsApp</th>
                  <th className="pb-2.5 pl-3 text-right">Plano Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data.cohorts.map((cohort) => (
                  <tr key={cohort.weekLabel} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs">
                          {cohort.weekLabel}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {cohort.daysAgoLabel}
                        </span>
                      </div>
                    </td>

                    {/* Cadastros */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-900 font-bold text-xs">
                        {cohort.signups}
                      </span>
                    </td>

                    {/* Tem produto 1+ */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 text-xs">
                          {cohort.hasProductsPercent}%
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {cohort.hasProductsCount} lojas
                        </span>
                      </div>
                    </td>

                    {/* Catálogo 5+ */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={cn(
                            "font-bold text-xs",
                            cohort.catalogReadyPercent >= 50
                              ? "text-emerald-600"
                              : "text-amber-600"
                          )}
                        >
                          {cohort.catalogReadyPercent}%
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {cohort.catalogReadyCount} lojas
                        </span>
                      </div>
                    </td>

                    {/* Recebeu pedidos WhatsApp */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 text-xs">
                          {cohort.hasWhatsappOrdersPercent}%
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {cohort.hasWhatsappOrdersCount} lojas
                        </span>
                      </div>
                    </td>

                    {/* Conversão Premium */}
                    <td className="py-2.5 pl-3 text-right">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full font-bold text-xs",
                          cohort.paidCount > 0
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {cohort.paidPercent}% ({cohort.paidCount})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Oportunidades Comerciais para Plano Premium (4 colunas) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                Oportunidades Premium
              </h2>
              <p className="text-xs text-slate-500">
                Lojas free com alto tráfego e catálogo ativo.
              </p>
            </div>
            <Link
              href="/master/lojas"
              className="text-xs font-bold text-brand hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <div className="space-y-2.5">
            {data.upgradeOpportunities.map((lead) => (
              <div
                key={lead.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-soft overflow-hidden grid place-items-center text-xs font-bold text-slate-900 shrink-0">
                    {lead.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lead.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      lead.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {lead.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {lead.neighborhood} · {lead.productsCount} produtos
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/50">
                  <span className="text-slate-500 text-xs">
                    <strong className="text-slate-900">{lead.whatsappClicks}</strong> cliques
                  </span>
                  <a
                    href={`https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(
                      `Olá ${lead.name}! Parabéns pela vitrine no Lapa Marketplace. Seu catálogo já teve ${lead.viewsCount} visualizações. Quer conhecer os benefícios do Plano Premium para sua loja se destacar no topo?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Oferecer Premium
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Alertas de Suporte & Métricas de Impacto no Comércio Local */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Lojas com Onboarding Travado */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-500" />
                Lojas sem Produtos (Suporte)
              </h2>
              <p className="text-xs text-slate-500">
                Criaram conta mas ainda sem catálogo no ar.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.stalledOnboarding.map((stall) => (
              <div
                key={stall.id}
                className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 truncate">
                    {stall.name}
                  </h3>
                  <span className="text-[11px] text-amber-700 font-semibold">
                    {stall.createdAtDaysAgo} dias atrás
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {stall.neighborhood} · 0 produtos
                </p>
                <a
                  href={`https://wa.me/${stall.whatsapp}?text=${encodeURIComponent(
                    `Olá equipe da ${stall.name}! Vimos que você iniciou o cadastro no Lapa Marketplace. Precisa de alguma ajuda para subir seus produtos no catálogo e colocar a loja no ar?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Ajudar no WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Impacto no Comércio Local & Distribuição por Bairros (8 colunas) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Impacto no comércio de Bom Jesus da Lapa
              </h2>
              <p className="text-xs text-slate-500">
                Engajamento gerado pela plataforma para os negócios locais.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {totalWhatsappClicks.toLocaleString("pt-BR")} conexões geradas
            </span>
          </div>

          {/* Cards de Métricas de Engajamento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-brand" />
                Visualizações
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                {totalViews.toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                Cliques WhatsApp
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                {totalWhatsappClicks.toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-sky-600" />
                Produtos Ativos
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                {data.engagement.totalProducts}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Conversão em Venda
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                {data.engagement.conversionRate}%
              </p>
            </div>
          </div>

          {/* Barras de Distribuição: Bairros & Categorias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* Bairros Líderes */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Distribuição por Bairro da Loja
              </h3>
              <div className="space-y-2">
                {data.neighborhoodsDistribution.map((nb) => (
                  <div key={nb.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{nb.name}</span>
                      <span className="text-slate-500 text-[11px]">{nb.percentage}% ({nb.count})</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${nb.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorias com Maior Catálogo */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Categorias com Maior Catálogo
              </h3>
              <div className="space-y-2">
                {data.categoriesDistribution.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{cat.name}</span>
                      <span className="text-slate-500 text-[11px]">{cat.percentage}% ({cat.count})</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
