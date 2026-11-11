"use client";

import React, { useState } from "react";
import {
  Search,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  LayoutGrid,
  Smartphone,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { StoreStatusBadge } from "@/components/ui/StoreStatusBadge";
import {
  CategoryPills,
  DEFAULT_MARKETPLACE_CATEGORIES,
} from "@/components/ui/CategoryPills";
import { PromoBanner } from "@/components/ui/PromoBanner";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { ProductCardGrid } from "@/components/marketplace/ProductCardGrid";
import { ProductFeedPost } from "@/components/marketplace/ProductFeedPost";
import { StoriesBar } from "@/components/marketplace/StoriesBar";
import type {
  ProductItem,
  StoreSummary,
  StoreWithStories,
} from "@/types/marketplace";

const MOCK_STORES: StoreSummary[] = [
  {
    id: "store-1",
    name: "Bella Moda Lapa",
    slug: "bella-moda-lapa",
    neighborhood: "Centro",
    whatsapp: "5577999112233",
    is_verified: true,
    plan: "premium",
    avatar_url:
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=250&q=80",
    special_hours: [
      {
        date: "2026-08-06",
        label: "Romaria do Bom Jesus (Horário Estendido)",
        isClosed: false,
        openTime: "07:00",
        closeTime: "21:00",
      },
    ],
  },
  {
    id: "store-2",
    name: "Império dos Calçados",
    slug: "imperio-dos-calcados",
    neighborhood: "São Gotardo",
    whatsapp: "5577999445566",
    is_verified: true,
    plan: "premium",
    avatar_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: "store-3",
    name: "Lapa Tech & Celulares",
    slug: "lapa-tech-celulares",
    neighborhood: "Avenida Duque de Caxias",
    whatsapp: "5577999778899",
    is_verified: true,
    plan: "pro",
    avatar_url:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=250&q=80",
  },
];

const MOCK_STORIES: StoreWithStories[] = [
  {
    store: MOCK_STORES[0],
    hasUnseen: true,
    stories: [
      {
        id: "st-1",
        store_id: "store-1",
        media_url:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        caption: "Coleção nova de verão acabou de chegar na loja do Centro! ✨",
        product_title: "Conjunto Linho Premium Areia",
        product_price: 149.9,
        cta_url: "/produto/conjunto-linho-premium",
        created_at: new Date().toISOString(),
      },
      {
        id: "st-2",
        store_id: "store-1",
        media_url:
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
        caption: "Vestidos leves com 20% OFF hoje no Pix!",
        product_title: "Vestido Midi Floral Sol",
        product_price: 119.9,
        cta_url: "/produto/vestido-midi-floral",
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    store: MOCK_STORES[1],
    hasUnseen: true,
    stories: [
      {
        id: "st-3",
        store_id: "store-2",
        media_url:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        caption: "Reposição de numeração do 34 ao 43! Entrega grátis no Centro.",
        product_title: "Tênis Running Pro Air",
        product_price: 229.9,
        cta_url: "/produto/tenis-running-pro-air",
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    store: MOCK_STORES[2],
    hasUnseen: true,
    stories: [
      {
        id: "st-4",
        store_id: "store-3",
        media_url:
          "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=80",
        caption: "Fones Bluetooth e Smartwatches em oferta relâmpago!",
        product_title: "Smartwatch Ultra Series 9",
        product_price: 199.0,
        cta_url: "/produto/smartwatch-ultra",
        created_at: new Date().toISOString(),
      },
    ],
  },
];

const MOCK_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    title: "Conjunto Alfaiataria Linho Off-White",
    slug: "conjunto-alfaiataria-linho",
    description:
      "Tecido leve e fresco perfeito para o clima de Bom Jesus da Lapa. Disponível para prova na loja ou entrega via motoboy.",
    price: 199.9,
    promotional_price: 159.9,
    image_url:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    ],
    sizes: ["P", "M", "G", "GG"],
    condition: "new",
    category_slug: "moda",
    store: MOCK_STORES[0],
  },
  {
    id: "prod-2",
    title: "Tênis Esportivo Ultra Comfort Vermelho",
    slug: "tenis-esportivo-ultra-comfort",
    description:
      "Solado macio em EVA de alta absorção. Ideal para caminhada na Avenida e academia.",
    price: 289.9,
    promotional_price: 229.9,
    image_url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
    ],
    sizes: ["38", "39", "40", "41", "42"],
    condition: "new",
    category_slug: "calcados",
    store: MOCK_STORES[1],
  },
  {
    id: "prod-3",
    title: "Fone Bluetooth Noise Cancelling Pro",
    slug: "fone-bluetooth-noise-cancelling",
    description:
      "Bateria de até 30 horas, carregamento rápido USB-C e garantia direto na loja física.",
    price: 249.0,
    promotional_price: 189.0,
    image_url:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    sizes: ["Único"],
    condition: "new",
    category_slug: "eletronicos",
    store: MOCK_STORES[2],
  },
  {
    id: "prod-4",
    title: "Bolsa Tiracolo Couro Legítimo Caramelo",
    slug: "bolsa-tiracolo-couro-caramelo",
    description:
      "Acabamento artesanal com alça regulável e metais dourados inoxidáveis.",
    price: 179.9,
    promotional_price: null,
    image_url:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    sizes: ["Único"],
    condition: "new",
    category_slug: "acessorios",
    store: MOCK_STORES[0],
  },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [bagCount, setBagCount] = useState(2);
  const [favCount, setFavCount] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "feed">("grid");

  const filteredProducts =
    activeCategory === "all"
      ? MOCK_PRODUCTS
      : MOCK_PRODUCTS.filter((p) => p.category_slug === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navegação Global Fixa */}
      <MarketplaceHeader
        bagCount={bagCount}
        favoritesCount={favCount}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Barra de Stories 24h das Lojas Premium */}
        <StoriesBar items={MOCK_STORIES} />

        {/* Carrossel de Pílulas de Categorias */}
        <CategoryPills
          categories={DEFAULT_MARKETPLACE_CATEGORIES}
          activeSlug={activeCategory}
          onSelect={(cat) => setActiveCategory(cat.slug)}
        />

        {/* Banner Sazonal da Cidade */}
        <PromoBanner
          tag="Especial Comércio de Lapa"
          discountBadge="ATÉ 30% OFF NO PIX"
          title="Vitrine Digital das Lojas de Bom Jesus da Lapa"
          subtitle="Compre das lojas físicas que você já conhece e confia. Escolha no catálogo, tire dúvidas e receba hoje mesmo em casa."
          ctaLabel="Ver ofertas do dia"
          imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
        />

        {/* Vitrine de Produtos: Alternância Catálogo (Grid) vs Feed Social (Instagram) */}
        <SectionContainer
          title="Achadinhos & Ofertas em Lapa"
          subtitle="Produtos disponíveis para pronta-entrega nas lojas da cidade"
          rightSlot={
            <div className="inline-flex items-center rounded-full bg-white p-1 border border-slate-100 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Catálogo</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("feed")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "feed"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Feed Mobile</span>
              </button>
            </div>
          }
        >
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {filteredProducts.map((product) => (
                <ProductCardGrid
                  key={product.id}
                  product={product}
                  onAddToBag={() => setBagCount((c) => c + 1)}
                  onToggleFavorite={(_, next) =>
                    setFavCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-md space-y-6">
              {filteredProducts.map((product) => (
                <ProductFeedPost
                  key={product.id}
                  product={product}
                  onAddToBag={() => setBagCount((c) => c + 1)}
                  onToggleFavorite={(_, next) =>
                    setFavCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
                  }
                />
              ))}
            </div>
          )}
        </SectionContainer>

        {/* Seção de Demonstração do Design System (Etapa 2) */}
        <SectionContainer
          title="Design System & Primitivos (Etapa 2)"
          subtitle="Componentes reaproveitáveis seguindo a estética Soft Modern App-like"
        >
          <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-xs space-y-6">
            {/* Botões */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Botões (`Button.tsx`)
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Primário (Slate 900)
                </Button>
                <Button variant="secondary" leftIcon={<ShoppingBag className="w-4 h-4" />}>
                  Secundário (Sacola)
                </Button>
                <Button variant="whatsapp" leftIcon={<MessageCircle className="w-4 h-4" />}>
                  Pedir no WhatsApp
                </Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="primary" size="sm" isLoading>
                  Carregando
                </Button>
              </div>
            </div>

            {/* Badges e Status de Loja */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Badges & Status de Funcionamento (`Badge.tsx` & `StoreStatusBadge.tsx`)
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="discount" discountPercent={20} />
                <Badge variant="verified" />
                <Badge variant="condition" condition="new" />
                <Badge variant="condition" condition="used" />
                <Badge variant="payment" paymentMethod="pix" />
                <Badge variant="payment" paymentMethod="credit_card" />
                <Badge variant="payment" paymentMethod="crediario" />
                <StoreStatusBadge
                  storeName="Bella Moda Lapa"
                  specialHours={MOCK_STORES[0].special_hours}
                />
              </div>
            </div>

            {/* Inputs e Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <Input
                label="Busca rápida (Input)"
                placeholder="Ex: Vestido floral..."
                leftIcon={<Search className="w-4 h-4" />}
              />
              <Select
                label="Bairro de Entrega (Select)"
                options={[
                  { value: "centro", label: "Centro - Bom Jesus da Lapa" },
                  { value: "sao-gotardo", label: "São Gotardo" },
                  { value: "beira-rio", label: "Beira Rio" },
                ]}
              />
              <Input
                label="Campo com validação"
                defaultValue="Cupom expirado"
                error="Este cupom não está mais ativo para esta loja."
              />
            </div>
          </div>
        </SectionContainer>
      </main>

      {/* Rodapé Completo */}
      <Footer />
    </div>
  );
}
