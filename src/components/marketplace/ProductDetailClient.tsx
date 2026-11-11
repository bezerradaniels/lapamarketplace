"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CreditCard,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StoreStatusBadge } from "@/components/ui/StoreStatusBadge";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { ProductCardGrid } from "@/components/marketplace/ProductCardGrid";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { useBagStore } from "@/store/useBagStore";
import {
  incrementProductViewAction,
  incrementProductWhatsappClickAction,
} from "@/app/actions/feed";
import { toggleSaveProduct } from "@/app/actions/social";
import {
  buildWhatsAppUrl,
  calculateDiscountPercentage,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
import type {
  PaymentMethod,
  ProductItem,
  StoreSummary,
} from "@/types/marketplace";

export interface ProductDetailClientProps {
  product: ProductItem;
  store: StoreSummary;
  relatedProducts: ProductItem[];
  initialIsSaved: boolean;
}

export function ProductDetailClient({
  product,
  store,
  relatedProducts,
  initialIsSaved,
}: ProductDetailClientProps) {
  const images = useMemo(() => {
    const list = [product.image_url];
    if (product.gallery_urls && product.gallery_urls.length > 0) {
      for (const u of product.gallery_urls) {
        if (u && !list.includes(u)) list.push(u);
      }
    }
    return list;
  }, [product.image_url, product.gallery_urls]);

  const [activeImage, setActiveImage] = useState(images[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [bagCount, setBagCount] = useState(2);
  const [addedToBagFeedback, setAddedToBagFeedback] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const addProduct = useBagStore((s) => s.addProduct);

  // Incrementa silenciosamente `views_count` ao abrir a página do produto
  useEffect(() => {
    void incrementProductViewAction(product.id);
  }, [product.id]);

  const discountPercent = calculateDiscountPercentage(
    product.price,
    product.promotional_price
  );
  const hasPromo =
    discountPercent != null &&
    product.promotional_price != null &&
    product.promotional_price < product.price;
  const effectivePrice = hasPromo
    ? product.promotional_price!
    : product.price;

  const acceptedPayments: PaymentMethod[] = store.payment_methods?.length
    ? store.payment_methods
    : ["pix", "credit_card", "cash"];

  const handleToggleFavorite = async () => {
    const next = !isSaved;
    setIsSaved(next);
    const res = await toggleSaveProduct(product.id);
    if (res?.requiresAuth) {
      setAuthModalOpen(true);
    }
  };

  const handleAddToBag = () => {
    addProduct(product, selectedSize);
    setBagCount((c) => c + 1);
    setAddedToBagFeedback(true);
    window.setTimeout(() => setAddedToBagFeedback(false), 1800);
  };

  const handleBuyNowWhatsApp = () => {
    void incrementProductWhatsappClickAction(product.id);
    const url = buildWhatsAppUrl({
      phone: store.whatsapp,
      storeName: store.name,
      productTitle: product.title,
      productPrice: effectivePrice,
      selectedSize,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareProduct = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://lapamarketplace.com.br/${store.slug}/${
            product.slug || product.id
          }`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Silencioso
    }
    setCopiedShare(true);
    window.setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-24 md:pb-0">
      <MarketplaceHeader
        bagCount={bagCount}
        favoritesCount={isSaved ? 1 : 0}
      />

      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        reason="favorite"
        itemName={product.title}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Breadcrumb / Voltar para a Loja */}
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
          <Link
            href={`/${store.slug}`}
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para {store.name}</span>
          </Link>

          <button
            type="button"
            onClick={handleShareProduct}
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar peça</span>
              </>
            )}
          </button>
        </div>

        {/* =========================================================
            BLOCO PRINCIPAL: GALERIA DE FOTOS + INFORMAÇÕES DE COMPRA
           ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Esquerda: Galeria de Fotos */}
          <div className="lg:col-span-6 space-y-3">
            <div className="aspect-square rounded-3xl bg-white border border-slate-100 shadow-xs overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />

              {discountPercent != null && (
                <div className="absolute top-4 left-4">
                  <Badge
                    variant="discount"
                    size="md"
                    discountPercent={discountPercent}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label={
                  isSaved ? "Remover dos favoritos" : "Salvar nos favoritos"
                }
                aria-pressed={isSaved}
                className={cn(
                  "absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-all cursor-pointer",
                  isSaved
                    ? "bg-rose-500 text-white"
                    : "bg-white/90 text-slate-700 hover:bg-white hover:text-rose-500"
                )}
              >
                <Heart
                  className={cn("w-5 h-5", isSaved && "fill-current")}
                />
              </button>
            </div>

            {/* Miniaturas da Galeria */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                {images.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={cn(
                      "w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer",
                      activeImage === imgUrl
                        ? "border-slate-900 scale-102 shadow-xs"
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`${product.title} miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coluna Direita: Preço De/Por, Tamanhos, Loja, Pagamentos e Entrega */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
              {/* Badges Superiores: Condição, Gênero, Voltagem */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="condition"
                  condition={product.condition || "new"}
                />
                {product.gender && (
                  <Badge variant="neutral">{product.gender}</Badge>
                )}
                {product.voltage && (
                  <Badge variant="neutral">⚡ {product.voltage}</Badge>
                )}
              </div>

              {/* Título e Preço De/Por */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {product.title}
                </h1>

                <div className="pt-1">
                  {hasPromo && (
                    <span className="block text-sm font-semibold text-slate-400 line-through">
                      De {formatCurrencyBRL(product.price)}
                    </span>
                  )}
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                      {formatCurrencyBRL(effectivePrice)}
                    </span>
                    {discountPercent != null && (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        Economize {discountPercent}%
                      </span>
                    )}
                  </div>
                  {store.installment_info && (
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {store.installment_info}
                    </p>
                  )}
                </div>
              </div>

              {/* Descrição do Produto */}
              {product.description && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Seletor de Tamanho / Numeração (se o produto tiver sizes) */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Selecione o Tamanho / Numeração:
                    </span>
                    {selectedSize && (
                      <span className="text-xs font-bold text-emerald-700">
                        Selecionado: {selectedSize}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const active = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          aria-pressed={active}
                          className={cn(
                            "min-w-12 h-11 px-4 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer",
                            active
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botões Desktop: Adicionar à Sacola + Comprar Agora */}
              <div className="hidden md:grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleAddToBag}
                  leftIcon={
                    addedToBagFeedback ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )
                  }
                >
                  {addedToBagFeedback
                    ? "Adicionado à Sacola!"
                    : "Adicionar à Sacola"}
                </Button>

                <Button
                  type="button"
                  variant="whatsapp"
                  size="lg"
                  onClick={handleBuyNowWhatsApp}
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                >
                  Comprar Agora
                </Button>
              </div>

              {/* Card da Loja Física em Bom Jesus da Lapa */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/${store.slug}`}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-extrabold text-slate-900 truncate">
                          {store.name}
                        </span>
                        {store.is_verified && (
                          <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {store.neighborhood}, Bom Jesus da Lapa
                      </span>
                    </div>
                  </Link>

                  <StoreStatusBadge
                    compact
                    storeName={store.name}
                    businessHours={store.business_hours}
                    specialHours={store.special_hours}
                    isOpenOverride={store.is_open_override}
                  />
                </div>

                {store.address && (
                  <p className="text-xs text-slate-500">📍 {store.address}</p>
                )}
              </div>

              {/* Informações de Entrega & Formas de Pagamento da Loja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                <div className="space-y-1.5">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    Opções de Entrega
                  </span>
                  <p className="text-slate-600">
                    {store.has_delivery !== false
                      ? store.delivery_fee_type === "free"
                        ? "✅ Entrega Grátis em Bom Jesus da Lapa"
                        : store.delivery_fee_type === "fixed" &&
                          store.delivery_fee != null
                        ? `🛵 Motoboy: Taxa fixa ${formatCurrencyBRL(
                            store.delivery_fee
                          )}`
                        : "🛵 Entrega via Motoboy (taxa a combinar)"
                      : "Somente retirada na loja"}
                  </p>
                  {store.has_pickup !== false && (
                    <p className="text-slate-600">
                      🏪 Retirada grátis direto na loja física
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Pagamentos na Loja
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {acceptedPayments.map((pm) => (
                      <Badge key={pm} variant="payment" paymentMethod={pm} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mais Produtos desta Loja */}
        {relatedProducts.length > 0 && (
          <SectionContainer
            title={`Mais produtos de ${store.name}`}
            subtitle={`Aproveite o mesmo frete comprando outras peças de ${store.name}`}
            actionLabel="Ver catálogo completo da loja"
            href={`/${store.slug}`}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <ProductCardGrid
                  key={rel.id}
                  product={rel}
                  onAddToBag={() => setBagCount((c) => c + 1)}
                />
              ))}
            </div>
          </SectionContainer>
        )}
      </main>

      {/* =========================================================
          STICKY BOTTOM BAR MOBILE: "ADICIONAR À SACOLA" E "COMPRAR AGORA"
         ========================================================= */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-lg">
        <div className="mx-auto max-w-lg grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleAddToBag}
            leftIcon={
              addedToBagFeedback ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )
            }
            fullWidth
          >
            {addedToBagFeedback ? "Adicionado!" : "Adicionar à Sacola"}
          </Button>

          <Button
            type="button"
            variant="whatsapp"
            size="md"
            onClick={handleBuyNowWhatsApp}
            leftIcon={<MessageCircle className="w-4 h-4" />}
            fullWidth
          >
            Comprar Agora
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
