"use client";

import React, { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Package,
  Eye,
  MessageCircle,
  Users,
  Sparkles,
  Camera,
  PlusCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Crown,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createStoreStoryAction } from "@/app/actions/painel";
import { formatCurrencyBRL } from "@/lib/utils";
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

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Dashboard + Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Resumo da Loja
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Acompanhe o desempenho do seu catálogo em Bom Jesus da Lapa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor rápido de demonstração Plano Free vs Premium */}
          <button
            type="button"
            onClick={() =>
              setSimulatedTier((prev) =>
                prev === "premium" ? "free" : "premium"
              )
            }
            className="rounded-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Simular Plano:{" "}
            <span className="text-emerald-700">
              {simulatedTier === "premium" ? "Premium ⭐" : "Gratuito"}
            </span>
          </button>

          <Link href="/painel/produtos/novo">
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" aria-hidden="true" />}
            >
              Cadastrar Produto
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Cards de Métricas */}
      <section
        aria-label="Métricas da Loja"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5"
      >
        <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Produtos Ativos
            </span>
            <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Package className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeProductsCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              de {products.length} cadastrados
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Visualizações
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalViews.toLocaleString("pt-BR")}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Soma de views nas peças
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Cliques no WhatsApp
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {totalWhatsappClicks.toLocaleString("pt-BR")}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Intenções diretas de compra
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Seguidores da Loja
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Users className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalFollowers.toLocaleString("pt-BR")}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Clientes acompanhando em Lapa
            </p>
          </div>
        </div>
      </section>

      {/* Atalho de Stories 24h (Condicional: Plano Premium vs Plano Gratuito) */}
      {simulatedTier === "premium" ? (
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 px-3 py-1 text-[11px] font-extrabold">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Recurso Exclusivo • Plano Premium ⭐
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Poste um Story 24h no topo do Lapa Marketplace
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Publique uma foto vertical com as novidades que acabaram de chegar
              na loja e vincule um produto para o cliente comprar direto pelo
              Story.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              variant="whatsapp"
              size="lg"
              leftIcon={<Camera className="w-4 h-4" aria-hidden="true" />}
              onClick={() => {
                setStoryFeedback(null);
                setIsStoryModalOpen(true);
              }}
            >
              Postar Story 24h Agora
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl bg-white p-6 sm:p-8 border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 px-3 py-1 text-[11px] font-extrabold">
              <Crown className="w-3.5 h-3.5" aria-hidden="true" />
              Destaque sua loja em Bom Jesus da Lapa
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Faça upgrade para o Plano Premium ⭐ e poste Stories no topo da
              Home
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Lojas Premium aparecem na barra de Stories 24h no topo do portal,
              recebem o Selo de Loja Verificada e têm prioridade nas buscas da
              cidade.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2.5">
            <a
              href="https://wa.me/5577999999999?text=Ol%C3%A1!%20Quero%20ativar%20o%20Plano%20Premium%20na%20minha%20loja%20no%20Lapa%20Marketplace."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                type="button"
                variant="primary"
                size="lg"
                rightIcon={
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                }
              >
                Quero ser Loja Premium ⭐
              </Button>
            </a>
          </div>
        </section>
      )}

      {/* Produtos com Mais Acessos e Atalho para Gestão */}
      <section className="rounded-3xl bg-white p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Peças em Destaque no seu Catálogo
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhe visualizações e cliques em tempo real
            </p>
          </div>

          <Link
            href="/painel/produtos"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-900 hover:text-emerald-600 transition-colors"
          >
            <span>Gerenciar todos ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {products.slice(0, 4).map((prod) => (
            <div
              key={prod.id}
              className="py-3.5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prod.image_url}
                  alt={prod.title}
                  className="w-12 h-12 rounded-2xl object-cover bg-slate-100 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {prod.title}
                    </p>
                    {!prod.is_active && (
                      <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-bold">
                        Pausado
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-emerald-700">
                    {formatCurrencyBRL(prod.promotional_price ?? prod.price)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Eye
                    className="w-3.5 h-3.5 text-slate-400"
                    aria-hidden="true"
                  />
                  {prod.views_count}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  {prod.clicks_whatsapp}
                </span>
                <Link
                  href={`/painel/produtos/${prod.id}/editar`}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de Publicação de Story 24h (Plano Premium) */}
      {isStoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setIsStoryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsStoryModalOpen(false)}
              aria-label="Fechar modal de Story"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 px-3 py-1 text-[11px] font-extrabold">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                Story 24h • Plano Premium ⭐
              </span>
              <h2
                id="story-modal-title"
                className="text-xl font-extrabold text-slate-900"
              >
                Publicar novo Story na Home
              </h2>
              <p className="text-xs text-slate-500">
                Sua foto ficará visível por 24 horas no carrossel do topo do
                Lapa Marketplace.
              </p>
            </div>

            {storyFeedback && (
              <div
                role={storyFeedback.type === "error" ? "alert" : "status"}
                className={`flex items-start gap-2 rounded-2xl p-3.5 text-xs font-medium border ${
                  storyFeedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                {storyFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{storyFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handlePublishStory} className="space-y-4">
              {/* Upload ou URL da Foto Vertical */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-16 h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
                  {storyMediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={storyMediaUrl}
                      alt="Preview do Story"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-5 h-5 text-slate-400" />
                  )}
                  {isUploadingStory && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    Foto Vertical do Story (9:16 ou 4:5)
                  </p>
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
                    isLoading={isUploadingStory}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => storyFileRef.current?.click()}
                  >
                    Escolher foto para o Story
                  </Button>
                </div>
              </div>

              <Input
                label="Ou cole a URL da imagem (Opcional)"
                placeholder="https://..."
                value={storyMediaUrl}
                onChange={(e) => setStoryMediaUrl(e.target.value)}
              />

              <Input
                label="Legenda curta do Story"
                placeholder="Ex: Reposição de verão acabou de chegar na loja! ✨"
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value)}
              />

              <Select
                label="Vincular Produto Específico do Catálogo (Opcional)"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                options={[
                  { value: "", label: "Sem produto vinculado (apenas aviso)" },
                  ...products.map((p) => ({
                    value: p.id,
                    label: `${p.title} (${formatCurrencyBRL(
                      p.promotional_price ?? p.price
                    )})`,
                  })),
                ]}
              />

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsStoryModalOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  type="submit"
                  variant="whatsapp"
                  size="md"
                  isLoading={isPostingStory}
                >
                  Publicar Story 24h
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

