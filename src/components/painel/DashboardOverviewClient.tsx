"use client";

import { trackEvent } from "@/lib/analytics";
import React, { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Loader2, MessageCircle, Package, Users, X } from "lucide-react";
import {
  Button,
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
} from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { StoreStatusBadge } from "@/components/ui/StoreStatusBadge";
import { LapaSymbol } from "@/components/brand/LapaSymbol";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createStoreStoryAction } from "@/app/actions/painel";
import { cn, formatCurrencyBRL } from "@/lib/utils";
import type {
  MerchantProduct,
  MerchantStoreConfig,
} from "@/types/marketplace";

export interface DashboardOverviewClientProps {
  store: MerchantStoreConfig;
  products: MerchantProduct[];
}

export function DashboardOverviewClient({
  store,
  products,
}: DashboardOverviewClientProps) {
  const [simulatedTier, setSimulatedTier] = useState<"free" | "premium">(
    store.plan_tier
  );
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Estado do formulário de Story 24h
  const [storyMediaUrl, setStoryMediaUrl] = useState("");
  const [storyCaption, setStoryCaption] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [storyFeedback, setStoryFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPostingStory, startStoryTransition] = useTransition();
  const storyFileRef = useRef<HTMLInputElement>(null);

  // Cálculo das 4 Métricas
  const activeProductsCount = products.filter((p) => p.is_active).length;
  const totalViews = products.reduce(
    (acc, item) => acc + (item.views_count || 0),
    0
  );
  const totalWhatsappClicks = products.reduce(
    (acc, item) => acc + (item.clicks_whatsapp || 0),
    0
  );
  const totalFollowers = store.followers_count || 0;

  const handleStoryFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStoryFeedback(null);
    const localPreview = URL.createObjectURL(file);
    setStoryMediaUrl(localPreview);

    if (!isSupabaseConfigured()) {
      return;
    }

    setIsUploadingStory(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `stories/${store.id}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("lapa-imagens")
        .upload(filePath, file, { upsert: true });

      if (!error) {
        const { data } = supabase.storage
          .from("lapa-imagens")
          .getPublicUrl(filePath);
        if (data?.publicUrl) {
          setStoryMediaUrl(data.publicUrl);
        }
      }
    } catch {
      // Mantém preview local
    } finally {
      setIsUploadingStory(false);
    }
  };

  const handlePublishStory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStoryFeedback(null);

    if (!storyMediaUrl) {
      setStoryFeedback({
        type: "error",
        text: "Envie uma foto vertical para publicar seu Story de 24h.",
      });
      return;
    }

    startStoryTransition(async () => {
      const res = await createStoreStoryAction({
        store_id: store.id,
        media_url: storyMediaUrl,
        caption: storyCaption,
        product_id: selectedProductId || null,
      });

      if (res.error) {
        setStoryFeedback({ type: "error", text: res.error });
      } else {
        trackEvent("story_published");
        setStoryFeedback({
          type: "success",
          text:
            res.message ||
            "Story publicado por 24h no topo da Home do Lapa Marketplace!",
        });
        setStoryCaption("");
        setSelectedProductId("");
      }
    });
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const todayLabel = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const topProducts = [...products]
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 5);

  const metrics = [
    {
      label: "Produtos ativos",
      value: activeProductsCount.toLocaleString("pt-BR"),
      tag: `de ${products.length} cadastrados`,
      tone: "sky",
      icon: Package,
    },
    {
      label: "Visualizações",
      value: totalViews.toLocaleString("pt-BR"),
      tag: "soma de todas as peças",
      tone: "pink",
      icon: Eye,
    },
    {
      label: "Cliques no WhatsApp",
      value: totalWhatsappClicks.toLocaleString("pt-BR"),
      tag:
        totalViews > 0
          ? `${((totalWhatsappClicks / totalViews) * 100).toLocaleString(
              "pt-BR",
              { maximumFractionDigits: 1 }
            )}% das visualizações`
          : "intenções de compra",
      tone: "mint",
      icon: MessageCircle,
    },
    {
      label: "Seguidores",
      value: totalFollowers.toLocaleString("pt-BR"),
      tag: "acompanhando a loja",
      tone: "amber",
      icon: Users,
    },
  ] as const;

  const METRIC_TONE = {
    sky: "bg-sky-soft text-sky-ink",
    pink: "bg-pink-soft text-pink-ink",
    mint: "bg-mint-soft text-mint-ink",
    amber: "bg-amber-soft text-amber-ink",
  } as const;

  const primaryLinkClasses = cn(
    buttonBaseClasses,
    buttonVariantClasses.primary,
    "h-10.5 px-4 rounded-full text-sm"
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Saudação + status + novo produto */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span
            className="text-[13px] text-slate-500 first-letter:uppercase"
            suppressHydrationWarning
          >
            {todayLabel}
          </span>
          <h1
            className="font-display text-[26px] sm:text-[30px] font-medium tracking-[-0.025em] text-ink"
            suppressHydrationWarning
          >
            {greeting}, <span className="aura-text">{store.name}</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StoreStatusBadge
            compact
            className="px-3 py-2 text-[13px]"
            storeName={store.name}
            businessHours={store.business_hours}
            specialHours={store.special_hours}
          />
          <Link href="/painel/produtos/novo" className={primaryLinkClasses}>
            + Novo produto
          </Link>
        </div>
      </div>

      {/* 4 métricas */}
      <section
        aria-label="Métricas da loja"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-4.5 rounded-[28px] bg-white border border-media shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col gap-2 min-w-0"
          >
            <span className="flex items-center gap-2 text-[13px] text-slate-500">
              <span className={cn("grid size-7 flex-none place-items-center rounded-[10px]", METRIC_TONE[metric.tone])}>
                <metric.icon className="size-3.75" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="truncate">{metric.label}</span>
            </span>
            <span className="font-display text-[26px] sm:text-[30px] font-bold tracking-[-0.03em] leading-tight text-ink">
              {metric.value}
            </span>
            <span
              className={cn(
                "self-start max-w-full truncate px-2 py-0.75 rounded-full text-xs font-semibold",
                METRIC_TONE[metric.tone]
              )}
            >
              {metric.tag}
            </span>
          </div>
        ))}
      </section>

      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        {/* Mais vistos */}
        <section className="p-5 rounded-[28px] bg-white border border-media shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col gap-3">
          <div className="flex justify-between items-baseline gap-3">
            <h2 className="text-[17px] font-semibold text-ink">
              Mais vistos
            </h2>
            <Link
              href="/painel/produtos"
              className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors"
            >
              Ver todos
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              Cadastre o primeiro produto para acompanhar visualizações e
              cliques por aqui.
            </p>
          ) : (
            <div role="table" aria-label="Produtos mais vistos">
              <div
                role="row"
                className="grid grid-cols-[minmax(0,1fr)_80px_80px] sm:grid-cols-[minmax(0,1fr)_90px_110px] text-xs text-slate-500 px-1 pb-2"
              >
                <span role="columnheader">Produto</span>
                <span role="columnheader" className="text-right">
                  Visualiz.
                </span>
                <span role="columnheader" className="text-right">
                  WhatsApp
                </span>
              </div>
              {topProducts.map((prod) => (
                <Link
                  role="row"
                  key={prod.id}
                  href={`/painel/produtos/${prod.id}/editar`}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_80px_80px] sm:grid-cols-[minmax(0,1fr)_90px_110px] items-center px-1 py-2 border-t border-slate-100 text-sm hover:bg-slate-50 transition-colors duration-150",
                    !prod.is_active && "opacity-55"
                  )}
                >
                  <span role="cell" className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prod.image_url}
                      alt=""
                      className="flex-none w-10 h-10 rounded-xl object-cover bg-slate-100"
                    />
                    <span className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-900 truncate">
                        {prod.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatCurrencyBRL(prod.promotional_price ?? prod.price)}
                        {!prod.is_active && " · pausado"}
                      </span>
                    </span>
                  </span>
                  <span
                    role="cell"
                    className="text-right font-display font-bold text-slate-900"
                  >
                    {prod.views_count.toLocaleString("pt-BR")}
                  </span>
                  <span
                    role="cell"
                    className="text-right font-display font-bold text-whatsapp-strong"
                  >
                    {prod.clicks_whatsapp.toLocaleString("pt-BR")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Story Premium ou convite de upgrade */}
        <section className="p-5 rounded-[28px] deep-night flex gap-4 items-center">
          <span className="flex-none w-16 h-16 rounded-full p-0.75 aura-ring shadow-[0_0_24px_rgba(244,114,182,0.45)]">
            <span className="w-full h-full rounded-full bg-deep-night shadow-[inset_0_0_0_2px_#060B19] grid place-items-center">
              <LapaSymbol size={30} />
            </span>
          </span>
          {simulatedTier === "premium" ? (
            <div className="flex flex-col gap-2 items-start">
              <h2 className="text-base font-semibold leading-[1.2] text-white">
                Poste um story de 24h no topo da Lapa
              </h2>
              <Button
                type="button"
                size="sm"
                className="px-3.5 !bg-white !text-ink hover:!bg-slate-100"
                onClick={() => {
                  setStoryFeedback(null);
                  setIsStoryModalOpen(true);
                }}
              >
                Postar story
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-start">
              <h2 className="text-base font-semibold leading-[1.2] text-white">
                Seja Premium e poste stories no topo da Lapa
              </h2>
              <p className="text-[13px] text-slate-300 leading-[1.4]">
                Stories de 24h na home, selo verificado e prioridade nas
                buscas.
              </p>
              <a
                href="https://wa.me/5577999999999?text=Ol%C3%A1!%20Quero%20ativar%20o%20Plano%20Premium%20na%20minha%20loja%20no%20Lapa%20Marketplace."
                onClick={() =>
                  trackEvent("premium_interest", {
                    plan_tier: store.plan_tier || "free",
                  })
                }
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonBaseClasses,
                  "bg-white text-ink hover:bg-slate-100",
                  buttonSizeClasses.sm,
                  "px-3.5"
                )}
              >
                Quero ser Premium
              </a>
            </div>
          )}
        </section>
      </div>

      {/* Demonstração de plano (apenas visual, não altera a loja) */}
      <button
        type="button"
        onClick={() =>
          setSimulatedTier((prev) => (prev === "premium" ? "free" : "premium"))
        }
        className="self-start text-xs text-slate-500 underline hover:text-slate-900 cursor-pointer"
      >
        Simular plano {simulatedTier === "premium" ? "Gratuito" : "Premium"}
      </button>

      {/* Modal de publicação de story 24h (plano Premium) */}
      {isStoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-3 sm:p-4"
          onClick={() => setIsStoryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-[28px] bg-white p-5 sm:p-7 shadow-float flex flex-col gap-4.5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsStoryModalOpen(false)}
              aria-label="Fechar"
              className="absolute top-4 right-4 w-10.5 h-10.5 rounded-[14px] bg-slate-100 hover:bg-slate-200 text-slate-900 grid place-items-center cursor-pointer transition-colors"
            >
              <X className="w-4.5 h-4.5" strokeWidth={1.8} aria-hidden="true" />
            </button>

            <div className="flex flex-col gap-1 pr-12">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                Story 24h · Premium
              </span>
              <h2
                id="story-modal-title"
                className="text-[22px] font-extrabold tracking-[-0.02em] text-slate-900"
              >
                Publicar novo story
              </h2>
              <p className="text-[13px] text-slate-500">
                A foto fica visível por 24 horas no topo do Lapa Marketplace.
              </p>
            </div>

            {storyFeedback && (
              <Notice tone={storyFeedback.type}>{storyFeedback.text}</Notice>
            )}

            <form onSubmit={handlePublishStory} className="flex flex-col gap-3.5">
              <div className="flex items-center gap-3.5">
                <span className="relative w-16 h-24 rounded-[18px] bg-slate-100 shadow-[inset_0_0_0_2px_#FFFFFF,0_0_0_2px_#0F172A] overflow-hidden grid place-items-center shrink-0 text-slate-400">
                  {storyMediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={storyMediaUrl}
                      alt="Prévia do story"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[22px] leading-none">+</span>
                  )}
                  {isUploadingStory && (
                    <span className="absolute inset-0 bg-slate-900/50 grid place-items-center text-white">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </span>
                  )}
                </span>

                <div className="flex flex-col gap-1.5 items-start">
                  <input
                    ref={storyFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleStoryFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-3.5 rounded-xl"
                    isLoading={isUploadingStory}
                    onClick={() => storyFileRef.current?.click()}
                  >
                    Escolher foto
                  </Button>
                  <span className="text-xs text-slate-500">
                    Vertical · 9:16 ou 4:5
                  </span>
                </div>
              </div>

              <Input
                inputSize="md"
                label="Ou cole o link da imagem"
                placeholder="https://..."
                value={storyMediaUrl}
                onChange={(e) => setStoryMediaUrl(e.target.value)}
              />

              <Input
                inputSize="md"
                label="Legenda"
                placeholder="Reposição de verão acabou de chegar!"
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value)}
              />

              <Select
                inputSize="md"
                label="Produto vinculado · opcional"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                options={[
                  { value: "", label: "Sem produto vinculado" },
                  ...products.map((p) => ({
                    value: p.id,
                    label: `${p.title} (${formatCurrencyBRL(
                      p.promotional_price ?? p.price
                    )})`,
                  })),
                ]}
              />

              <Button
                type="submit"
                className="h-13 rounded-[17px] text-[15px] mt-1"
                fullWidth
                isLoading={isPostingStory}
              >
                Publicar story
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
