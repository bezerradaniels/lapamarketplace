"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Store,
  Plus,
  Minus,
  Trash2,
  MapPin,
  User,
  Phone,
  Truck,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  Wallet,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { registerWhatsappOrderClick } from "@/app/actions/checkout";
import {
  useBagHydrated,
  useBagStore,
  type BagItem,
} from "@/store/useBagStore";
import {
  cn,
  formatCurrencyBRL,
  formatWhatsAppMask,
  normalizeWhatsAppToDb,
} from "@/lib/utils";
import type { CustomerProfile, NeighborhoodItem } from "@/types/marketplace";

export interface BagCheckoutClientProps {
  buyerProfile: CustomerProfile | null;
  neighborhoods: NeighborhoodItem[];
}

const PAYMENT_LABELS: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  pix: {
    label: "Pix",
    icon: <QrCode className="w-3.5 h-3.5 text-emerald-600" />,
  },
  credit_card: {
    label: "Cartão de Crédito",
    icon: <CreditCard className="w-3.5 h-3.5 text-slate-700" />,
  },
  debit_card: {
    label: "Cartão de Débito",
    icon: <CreditCard className="w-3.5 h-3.5 text-slate-700" />,
  },
  cash: {
    label: "Dinheiro",
    icon: <Banknote className="w-3.5 h-3.5 text-emerald-700" />,
  },
  crediario: {
    label: "Crediário da Loja",
    icon: <Wallet className="w-3.5 h-3.5 text-blue-600" />,
  },
  payment_link: {
    label: "Link de Pagamento",
    icon: <Receipt className="w-3.5 h-3.5 text-slate-700" />,
  },
};

export function BagCheckoutClient({
  buyerProfile,
  neighborhoods,
}: BagCheckoutClientProps) {
  const isMounted = useBagHydrated();
  const { items, updateQuantity, removeItem, clearStoreItems, clearAll } =
    useBagStore();

  // 1. Dados do Comprador (Preenchimento Único no Topo)
  const [buyerName, setBuyerName] = useState(buyerProfile?.full_name || "");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState(
    buyerProfile?.whatsapp ? formatWhatsAppMask(buyerProfile.whatsapp) : ""
  );
  const [buyerNeighborhoodId, setBuyerNeighborhoodId] = useState(
    buyerProfile?.default_neighborhood_id || neighborhoods[0]?.id || "centro"
  );
  const [buyerAddress, setBuyerAddress] = useState(
    buyerProfile?.default_address || ""
  );

  // Seleções por loja: modalidade ('delivery' | 'pickup') e forma de pagamento
  const [storeDeliveryMode, setStoreDeliveryMode] = useState<
    Record<string, "delivery" | "pickup">
  >({});
  const [storePaymentChoice, setStorePaymentChoice] = useState<
    Record<string, string>
  >({});
  const [sentStoreIds, setSentStoreIds] = useState<Record<string, boolean>>({});
  const [validationError, setValidationError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Agrupa os itens da sacola por `store.id`
  const storeGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        store: BagItem["store"];
        items: BagItem[];
      }
    >();

    for (const item of items) {
      const existing = map.get(item.store.id);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.store.id, {
          store: item.store,
          items: [item],
        });
      }
    }

    return Array.from(map.values());
  }, [items]);

  const selectedNeighborhoodName = useMemo(() => {
    const matched = neighborhoods.find((n) => n.id === buyerNeighborhoodId);
    return matched?.name || "Centro";
  }, [neighborhoods, buyerNeighborhoodId]);

  const getEffectiveDeliveryMode = (
    store: BagItem["store"]
  ): "delivery" | "pickup" => {
    const chosen = storeDeliveryMode[store.id];
    if (chosen && store.deliveryOptions.includes(chosen)) {
      return chosen;
    }
    if (store.deliveryOptions.includes("delivery")) return "delivery";
    return "pickup";
  };

  const getEffectivePaymentMethod = (store: BagItem["store"]): string => {
    const chosen = storePaymentChoice[store.id];
    if (chosen && store.acceptedPayments.includes(chosen)) {
      return chosen;
    }
    return store.acceptedPayments[0] || "pix";
  };

  const handleSendStoreOrderToWhatsApp = (
    store: BagItem["store"],
    storeItems: BagItem[]
  ) => {
    setValidationError("");

    const deliveryMode = getEffectiveDeliveryMode(store);
    const paymentMethodKey = getEffectivePaymentMethod(store);
    const paymentLabel =
      PAYMENT_LABELS[paymentMethodKey]?.label || paymentMethodKey;

    if (!buyerName.trim()) {
      setValidationError(
        "Por favor, preencha seu nome no topo da página antes de enviar o pedido."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (deliveryMode === "delivery" && !buyerAddress.trim()) {
      setValidationError(
        `Informe sua Rua / Número / Referência no topo para receber a entrega de ${store.name}.`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const subtotal = storeItems.reduce(
      (acc, i) => acc + i.price * i.quantity,
      0
    );
    const fixedFee =
      deliveryMode === "delivery" && store.deliveryFeeType === "fixed"
        ? Number(store.fixedDeliveryFee || 0)
        : 0;
    const total = subtotal + fixedFee;

    // 1. Monta a mensagem formatada para o WhatsApp da loja
    const lines: string[] = [
      "*Novo Pedido via Lapa Marketplace* 🛍️",
      `Loja: *${store.name}*`,
      "",
      "*Itens do Pedido:*",
    ];

    storeItems.forEach((item, index) => {
      const sizeStr = item.selectedSize ? ` (Tam: ${item.selectedSize})` : "";
      const itemSubtotal = formatCurrencyBRL(item.price * item.quantity);
      lines.push(
        `${index + 1}. ${item.quantity}x *${item.name}*${sizeStr} — ${itemSubtotal}`
      );
    });

    lines.push("");
    lines.push(`*Cliente:* ${buyerName.trim()}`);
    if (buyerWhatsapp.trim()) {
      lines.push(`*WhatsApp:* ${buyerWhatsapp.trim()}`);
    }

    if (deliveryMode === "delivery") {
      lines.push(
        `*Modalidade:* 🛵 Entrega em Bom Jesus da Lapa`,
        `*Bairro:* ${selectedNeighborhoodName}`,
        `*Endereço:* ${buyerAddress.trim()}`
      );
      if (store.deliveryFeeType === "free") {
        lines.push(`*Taxa de Entrega:* Grátis`);
      } else if (store.deliveryFeeType === "fixed") {
        lines.push(`*Taxa de Entrega:* ${formatCurrencyBRL(fixedFee)}`);
      } else {
        lines.push(`*Taxa de Entrega:* A combinar no WhatsApp`);
      }
    } else {
      lines.push(`*Modalidade:* 🏪 Retirada na Loja Física (Grátis)`);
    }

    lines.push(`*Forma de Pagamento:* ${paymentLabel}`);
    lines.push(`*Valor Total:* *${formatCurrencyBRL(total)}*`);
    lines.push("");
    lines.push("Aguardo confirmação! 😊");

    const encodedMessage = encodeURIComponent(lines.join("\n"));

    // Normaliza o telefone do lojista garantindo o DDI 55
    const digitsOnly = (store.whatsappNumber || "").replace(/\D/g, "");
    const cleanPhone = digitsOnly.startsWith("55")
      ? digitsOnly.slice(2)
      : digitsOnly || "77999112233";

    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;

    // Abre o WhatsApp em nova aba
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // Marca que o pedido desta loja foi disparado para oferecer limpeza da sacola
    setSentStoreIds((prev) => ({ ...prev, [store.id]: true }));

    // 2. Dispara a Server Action `registerWhatsappOrderClick` para contabilizar cliques
    const productIds = storeItems.map((i) => i.productId);
    startTransition(async () => {
      await registerWhatsappOrderClick(productIds);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continuar comprando em Lapa</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Minha Sacola Multi-Lojista
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Preencha seus dados uma única vez e envie o pedido pronto para o
              WhatsApp de cada loja.
            </p>
          </div>

          {isMounted && items.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            >
              Esvaziar Sacola
            </Button>
          )}
        </div>

        {validationError && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm font-bold text-rose-700 flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Prevenção de Hydration Mismatch */}
        {!isMounted ? (
          <div className="rounded-3xl bg-white p-12 border border-slate-100 text-center text-sm font-semibold text-slate-400">
            Carregando sua sacola de Bom Jesus da Lapa...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 border border-slate-100 shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900">
                Sua sacola está vazia no momento
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Adicione roupas, calçados ou eletrônicos das lojas físicas de
                Bom Jesus da Lapa para montar seu pedido.
              </p>
            </div>
            <Link href="/explorar">
              <Button variant="primary" size="lg">
                Explorar Produtos em Lapa
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* =========================================================
                1. DADOS DO COMPRADOR (PREENCHIMENTO ÚNICO NO TOPO)
               ========================================================= */}
            <section className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      1. Seus Dados para Entrega / Retirada
                    </h2>
                    <p className="text-xs text-slate-500">
                      {buyerProfile
                        ? "Preenchido automaticamente com seu perfil salvo ✨"
                        : "Preencha uma única vez — usamos em todos os pedidos abaixo"}
                    </p>
                  </div>
                </div>

                {buyerProfile && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700">
                    <Sparkles className="w-3 h-3" />
                    <span>Conta Conectada</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Seu Nome *"
                  placeholder="Ex: Maria Silva"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                  leftIcon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Seu WhatsApp (Opcional)"
                  type="tel"
                  placeholder="(77) 99999-9999"
                  value={buyerWhatsapp}
                  onChange={(e) =>
                    setBuyerWhatsapp(formatWhatsAppMask(e.target.value))
                  }
                  helperText={
                    buyerWhatsapp
                      ? `DDI: ${normalizeWhatsAppToDb(buyerWhatsapp)}`
                      : undefined
                  }
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Bairro em Bom Jesus da Lapa *"
                  value={buyerNeighborhoodId}
                  onChange={(e) => setBuyerNeighborhoodId(e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  options={neighborhoods.map((nb) => ({
                    value: nb.id,
                    label: nb.name,
                  }))}
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Rua, Número e Ponto de Referência *"
                    placeholder="Ex: Rua Santa Luzia, nº 140 (Próximo à Praça)"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                </div>
              </div>
            </section>

            {/* =========================================================
                2. CARDS AGRUPADOS POR LOJA
               ========================================================= */}
            <section className="space-y-6">
              {storeGroups.map(({ store, items: storeItems }) => {
                const deliveryMode = getEffectiveDeliveryMode(store);
                const paymentChoice = getEffectivePaymentMethod(store);

                const subtotal = storeItems.reduce(
                  (acc, i) => acc + i.price * i.quantity,
                  0
                );
                const deliveryFeeAmount =
                  deliveryMode === "delivery" &&
                  store.deliveryFeeType === "fixed"
                    ? Number(store.fixedDeliveryFee || 0)
                    : 0;
                const storeTotal = subtotal + deliveryFeeAmount;
                const alreadySent = Boolean(sentStoreIds[store.id]);

                return (
                  <div
                    key={store.id}
                    className="rounded-3xl bg-white p-5 sm:p-7 border border-slate-100 shadow-sm mb-6 space-y-6"
                  >
                    {/* Cabeçalho da Loja */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                            {store.name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {storeItems.reduce((acc, i) => acc + i.quantity, 0)}{" "}
                            item(ns) nesta loja
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/${store.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar mais itens desta loja</span>
                      </Link>
                    </div>

                    {/* Lista de Produtos daquela Loja */}
                    <div className="divide-y divide-slate-100">
                      {storeItems.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <Link
                              href={`/${store.slug}/${item.slug}`}
                              className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </Link>

                            <div className="min-w-0 space-y-0.5">
                              <Link
                                href={`/${store.slug}/${item.slug}`}
                                className="text-sm font-extrabold text-slate-900 hover:underline line-clamp-1"
                              >
                                {item.name}
                              </Link>

                              {item.selectedSize && (
                                <span className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                                  Tamanho: {item.selectedSize}
                                </span>
                              )}

                              <div className="flex items-baseline gap-2 pt-0.5">
                                <span className="text-sm font-extrabold text-emerald-700">
                                  {formatCurrencyBRL(item.price)}
                                </span>
                                {item.originalPrice > item.price && (
                                  <span className="text-[11px] text-slate-400 line-through">
                                    {formatCurrencyBRL(item.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Seletor `- 1 +` + Subtotal do Item + Remover */}
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="inline-flex items-center rounded-full bg-slate-100 p-1 border border-slate-200/70">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId,
                                    item.quantity - 1
                                  )
                                }
                                aria-label={`Diminuir quantidade de ${item.name}`}
                                className="w-7 h-7 rounded-full bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center shadow-2xs cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-extrabold text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId,
                                    item.quantity + 1
                                  )
                                }
                                aria-label={`Aumentar quantidade de ${item.name}`}
                                className="w-7 h-7 rounded-full bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center shadow-2xs cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-sm font-extrabold text-slate-900 min-w-20 text-right">
                              {formatCurrencyBRL(item.price * item.quantity)}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeItem(item.cartItemId)}
                              aria-label={`Remover ${item.name} da sacola`}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Seletor de Entrega exclusivo da Loja + Seletor de Pagamento exclusivo da Loja */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                      {/* Modalidade de Entrega */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          Como deseja receber de {store.name}?
                        </span>

                        <div className="grid grid-cols-2 gap-2.5">
                          {store.deliveryOptions.includes("delivery") && (
                            <button
                              type="button"
                              onClick={() =>
                                setStoreDeliveryMode((prev) => ({
                                  ...prev,
                                  [store.id]: "delivery",
                                }))
                              }
                              className={cn(
                                "rounded-2xl p-3 border text-left transition-all cursor-pointer",
                                deliveryMode === "delivery"
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              <span className="block text-xs font-extrabold">
                                🛵 Entrega (Delivery)
                              </span>
                              <span
                                className={cn(
                                  "block text-[11px] mt-0.5",
                                  deliveryMode === "delivery"
                                    ? "text-emerald-300 font-semibold"
                                    : "text-slate-500"
                                )}
                              >
                                {store.deliveryFeeType === "free"
                                  ? "Frete Grátis"
                                  : store.deliveryFeeType === "fixed"
                                  ? `Taxa: ${formatCurrencyBRL(
                                      store.fixedDeliveryFee
                                    )}`
                                  : "Taxa a combinar no Zap"}
                              </span>
                            </button>
                          )}

                          {store.deliveryOptions.includes("pickup") && (
                            <button
                              type="button"
                              onClick={() =>
                                setStoreDeliveryMode((prev) => ({
                                  ...prev,
                                  [store.id]: "pickup",
                                }))
                              }
                              className={cn(
                                "rounded-2xl p-3 border text-left transition-all cursor-pointer",
                                deliveryMode === "pickup"
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              <span className="block text-xs font-extrabold">
                                🏪 Retirada na Loja
                              </span>
                              <span
                                className={cn(
                                  "block text-[11px] mt-0.5",
                                  deliveryMode === "pickup"
                                    ? "text-emerald-300 font-semibold"
                                    : "text-slate-500"
                                )}
                              >
                                Grátis no balcão
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Forma de Pagamento exclusiva da Loja */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          Forma de Pagamento ({store.name})
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {store.acceptedPayments.map((methodKey) => {
                            const meta = PAYMENT_LABELS[methodKey] || {
                              label: methodKey,
                              icon: <CreditCard className="w-3.5 h-3.5" />,
                            };
                            const isSelected = paymentChoice === methodKey;
                            return (
                              <button
                                key={methodKey}
                                type="button"
                                onClick={() =>
                                  setStorePaymentChoice((prev) => ({
                                    ...prev,
                                    [store.id]: methodKey,
                                  }))
                                }
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold border transition-all cursor-pointer",
                                  isSelected
                                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                )}
                              >
                                {meta.icon}
                                <span>{meta.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {store.installmentInfo && (
                          <p className="text-[11px] font-semibold text-emerald-700">
                            💳 {store.installmentInfo}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Resumo Financeiro da Loja + Botão Verde de Envio para o WhatsApp */}
                    <div className="rounded-2xl bg-slate-50 p-4 sm:p-5 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex items-center gap-4 text-slate-600">
                          <span>
                            Subtotal: <strong>{formatCurrencyBRL(subtotal)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Frete:{" "}
                            <strong>
                              {deliveryMode === "pickup"
                                ? "Retirada Grátis"
                                : store.deliveryFeeType === "free"
                                ? "Grátis"
                                : store.deliveryFeeType === "fixed"
                                ? formatCurrencyBRL(deliveryFeeAmount)
                                : "A combinar no Zap"}
                            </strong>
                          </span>
                        </div>
                        <p className="text-base sm:text-lg font-extrabold text-slate-900">
                          Total em {store.name}:{" "}
                          <span className="text-emerald-700">
                            {formatCurrencyBRL(storeTotal)}
                          </span>
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="whatsapp"
                        size="lg"
                        isLoading={isPending}
                        onClick={() =>
                          handleSendStoreOrderToWhatsApp(store, storeItems)
                        }
                        leftIcon={<MessageCircle className="w-5 h-5" />}
                      >
                        Enviar Pedido para {store.name} no WhatsApp
                      </Button>
                    </div>

                    {/* Opção pós-disparo para limpar os itens daquela loja da sacola */}
                    {alreadySent && (
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-emerald-900">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>
                            Pedido aberto no WhatsApp de{" "}
                            <strong>{store.name}</strong>! Deseja limpar os
                            itens desta loja da sacola?
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => clearStoreItems(store.id)}
                        >
                          Remover itens enviados
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

