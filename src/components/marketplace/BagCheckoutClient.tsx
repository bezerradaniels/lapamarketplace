"use client";

import { bagItemToItem, trackEvent } from "@/lib/analytics";
import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Minus, Plus, Trash2 } from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";
import {
  Button,
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
} from "@/components/ui/Button";
import { LapaSymbol } from "@/components/brand/LapaSymbol";
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
} from "@/lib/utils";
import type { CustomerProfile, NeighborhoodItem } from "@/types/marketplace";

export interface BagCheckoutClientProps {
  buyerProfile: CustomerProfile | null;
  neighborhoods: NeighborhoodItem[];
}

const PAYMENT_LABELS: Record<string, { label: string }> = {
  pix: { label: "Pix" },
  credit_card: { label: "Crédito" },
  debit_card: { label: "Débito" },
  cash: { label: "Dinheiro" },
  crediario: { label: "Crediário" },
  payment_link: { label: "Link de pagamento" },
  boleto: { label: "Boleto" },
};

export function BagCheckoutClient({
  buyerProfile,
  neighborhoods,
}: BagCheckoutClientProps) {
  const isMounted = useBagHydrated();
  const { items, updateQuantity, removeItem, clearStoreItems, clearAll } =
    useBagStore();

  // Analytics: view_cart uma vez por visita, quando a sacola tem itens
  const viewCartTracked = useRef(false);
  useEffect(() => {
    if (!isMounted || viewCartTracked.current || items.length === 0) return;
    viewCartTracked.current = true;
    trackEvent("view_cart", { items: items.map((i) => bagItemToItem(i)) });
  }, [isMounted, items]);

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

    trackEvent("whatsapp_order", {
      lead_source: "bag",
      store_id: store.id,
      store_name: store.name,
      value: subtotal,
      items: storeItems.map((i) => bagItemToItem(i)),
    });

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

  const totalItemsCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const optionPillClasses = (active: boolean) =>
    cn(
      "px-3.5 py-2.25 rounded-full text-[13px] font-semibold leading-tight transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-1",
      active
        ? "bg-brand text-white"
        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
    );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceHeader mobileVariant="hidden" />

      <main className="flex-1 mx-auto w-full max-w-2xl md:px-6 md:py-4 pb-10">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 px-5 md:px-0 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
          <Link
            href="/"
            aria-label="Continuar comprando"
            className="w-10.5 h-10.5 rounded-[14px] bg-white grid place-items-center text-slate-900 shrink-0 transition-transform duration-150 active:scale-95"
          >
            <ChevronLeft className="w-4.5 h-4.5" strokeWidth={2} />
          </Link>
          <div className="flex-1 min-w-0 flex flex-col">
            <h1 className="text-[22px] md:text-[30px] font-extrabold tracking-[-0.02em] md:tracking-[-0.03em] text-slate-900">
              Sua sacola
            </h1>
            {isMounted && items.length > 0 && (
              <span className="text-xs text-slate-500">
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "itens"} de{" "}
                {storeGroups.length}{" "}
                {storeGroups.length === 1 ? "loja" : "lojas"} · um pedido por
                loja
              </span>
            )}
          </div>
          {isMounted && items.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-slate-900 underline cursor-pointer shrink-0"
            >
              Esvaziar
            </button>
          )}
        </div>

        {validationError && (
          <div
            role="alert"
            className="mx-3 md:mx-0 mb-3.5 rounded-[18px] bg-rose-100 px-4 py-3 text-[13px] font-semibold text-rose-700"
          >
            {validationError}
          </div>
        )}

        {/* Prevenção de hydration mismatch */}
        {!isMounted ? (
          <div className="mx-3 md:mx-0 rounded-[28px] bg-white p-10 text-center text-sm text-slate-500">
            Carregando sua sacola…
          </div>
        ) : items.length === 0 ? (
          <div className="mx-3 md:mx-0 rounded-[28px] bg-white p-8 text-center flex flex-col items-center gap-4">
            <span className="w-16 h-16 rounded-[22px] bg-brand-soft grid place-items-center">
              <LapaSymbol size={36} />
            </span>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900">
                Sua sacola está vazia
              </h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-normal">
                Adicione produtos das lojas de Bom Jesus da Lapa para montar
                seu pedido.
              </p>
            </div>
            <Link
              href="/explorar"
              className={cn(
                buttonBaseClasses,
                buttonVariantClasses.primary,
                buttonSizeClasses.lg
              )}
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          <>
            {/* Seus dados (preenchimento único) */}
            <section className="mx-3 md:mx-0 mb-3.5 bg-white rounded-[28px] p-4 md:p-5 flex flex-col gap-2.5">
              <div className="flex justify-between items-baseline gap-3">
                <h2 className="text-[15px] font-bold text-slate-900">
                  Seus dados
                </h2>
                <span className="text-xs text-slate-500">
                  {buyerProfile
                    ? "salvos na sua conta"
                    : "usados em todos os pedidos"}
                </span>
              </div>
              <Input
                inputSize="md"
                aria-label="Seu nome"
                placeholder="Seu nome"
                autoComplete="name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  inputSize="md"
                  aria-label="Seu WhatsApp (opcional)"
                  type="tel"
                  autoComplete="tel"
                  placeholder="WhatsApp (opcional)"
                  value={buyerWhatsapp}
                  onChange={(e) =>
                    setBuyerWhatsapp(formatWhatsAppMask(e.target.value))
                  }
                />
                <Select
                  inputSize="md"
                  aria-label="Bairro em Bom Jesus da Lapa"
                  value={buyerNeighborhoodId}
                  onChange={(e) => setBuyerNeighborhoodId(e.target.value)}
                  options={neighborhoods.map((nb) => ({
                    value: nb.id,
                    label: nb.name,
                  }))}
                />
              </div>
              <Input
                inputSize="md"
                aria-label="Rua, número e ponto de referência"
                autoComplete="street-address"
                placeholder="Rua, número · ponto de referência"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
              />
            </section>

            {/* Um card por loja */}
            {storeGroups.map(({ store, items: storeItems }) => {
              const deliveryMode = getEffectiveDeliveryMode(store);
              const paymentChoice = getEffectivePaymentMethod(store);

              const subtotal = storeItems.reduce(
                (acc, i) => acc + i.price * i.quantity,
                0
              );
              const deliveryFeeAmount =
                deliveryMode === "delivery" && store.deliveryFeeType === "fixed"
                  ? Number(store.fixedDeliveryFee || 0)
                  : 0;
              const storeTotal = subtotal + deliveryFeeAmount;
              const alreadySent = Boolean(sentStoreIds[store.id]);
              const storeQty = storeItems.reduce(
                (acc, i) => acc + i.quantity,
                0
              );

              return (
                <section
                  key={store.id}
                  aria-label={`Pedido de ${store.name}`}
                  className="mx-3 md:mx-0 mb-3.5 bg-white rounded-[28px] p-4 md:p-5 flex flex-col gap-3.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8.5 h-8.5 rounded-full bg-brand-soft grid place-items-center font-display text-xs font-extrabold text-slate-900 shrink-0">
                      {store.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h3 className="text-base font-extrabold text-slate-900 truncate">
                        {store.name}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {storeQty} {storeQty === 1 ? "item" : "itens"}
                      </span>
                    </div>
                    <Link
                      href={`/${store.slug}`}
                      className="text-xs font-semibold text-slate-900 underline shrink-0"
                    >
                      + itens
                    </Link>
                  </div>

                  {storeItems.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="flex gap-3 items-center"
                    >
                      <Link
                        href={`/${store.slug}/${item.slug}`}
                        className="flex-none w-15 h-15 rounded-2xl bg-slate-100 overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <Link
                          href={`/${store.slug}/${item.slug}`}
                          className="font-display text-sm font-semibold text-slate-900 truncate"
                        >
                          {item.name}
                        </Link>
                        {item.selectedSize && (
                          <span className="text-xs text-slate-500">
                            Tam. {item.selectedSize}
                          </span>
                        )}
                        <span className="flex items-baseline gap-1.5">
                          <span className="font-display text-[15px] font-extrabold text-slate-900">
                            {formatCurrencyBRL(item.price * item.quantity)}
                          </span>
                          {item.originalPrice > item.price && (
                            <span className="text-[11px] text-slate-500 line-through">
                              {formatCurrencyBRL(
                                item.originalPrice * item.quantity
                              )}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 p-0.75 rounded-xl bg-slate-100 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            item.quantity <= 1
                              ? removeItem(item.cartItemId)
                              : updateQuantity(
                                  item.cartItemId,
                                  item.quantity - 1
                                )
                          }
                          aria-label={
                            item.quantity <= 1
                              ? `Remover ${item.name} da sacola`
                              : `Diminuir quantidade de ${item.name}`
                          }
                          className="w-7 h-7 rounded-[9px] bg-white grid place-items-center text-slate-900 cursor-pointer active:scale-90 transition-transform duration-150"
                        >
                          {item.quantity <= 1 ? (
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                          ) : (
                            <Minus className="w-3.5 h-3.5" strokeWidth={2.4} />
                          )}
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.cartItemId, item.quantity + 1)
                          }
                          aria-label={`Aumentar quantidade de ${item.name}`}
                          className="w-7 h-7 rounded-[9px] bg-white grid place-items-center text-slate-900 cursor-pointer active:scale-90 transition-transform duration-150"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Entrega
                    </span>
                    <div
                      role="radiogroup"
                      aria-label={`Entrega de ${store.name}`}
                      className="flex flex-wrap gap-2"
                    >
                      {store.deliveryOptions.includes("delivery") && (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={deliveryMode === "delivery"}
                          onClick={() =>
                            setStoreDeliveryMode((prev) => ({
                              ...prev,
                              [store.id]: "delivery",
                            }))
                          }
                          className={optionPillClasses(
                            deliveryMode === "delivery"
                          )}
                        >
                          Entrega
                        </button>
                      )}
                      {store.deliveryOptions.includes("pickup") && (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={deliveryMode === "pickup"}
                          onClick={() =>
                            setStoreDeliveryMode((prev) => ({
                              ...prev,
                              [store.id]: "pickup",
                            }))
                          }
                          className={optionPillClasses(
                            deliveryMode === "pickup"
                          )}
                        >
                          Retirar na loja
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Pagamento
                    </span>
                    <div
                      role="radiogroup"
                      aria-label={`Pagamento em ${store.name}`}
                      className="flex flex-wrap gap-2"
                    >
                      {store.acceptedPayments.map((methodKey) => (
                        <button
                          key={methodKey}
                          type="button"
                          role="radio"
                          aria-checked={paymentChoice === methodKey}
                          onClick={() =>
                            setStorePaymentChoice((prev) => ({
                              ...prev,
                              [store.id]: methodKey,
                            }))
                          }
                          className={optionPillClasses(
                            paymentChoice === methodKey
                          )}
                        >
                          {PAYMENT_LABELS[methodKey]?.label ?? methodKey}
                        </button>
                      ))}
                    </div>
                    {store.installmentInfo && (
                      <span className="text-xs text-slate-500">
                        {store.installmentInfo}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 text-[13px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Produtos</span>
                      <span>{formatCurrencyBRL(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Entrega</span>
                      <span>
                        {deliveryMode === "pickup"
                          ? "Retirada grátis"
                          : store.deliveryFeeType === "free"
                          ? "Grátis"
                          : store.deliveryFeeType === "fixed"
                          ? formatCurrencyBRL(deliveryFeeAmount)
                          : "A combinar"}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-slate-900">
                        Total da loja
                      </span>
                      <span className="font-display text-[19px] font-extrabold text-slate-900">
                        {formatCurrencyBRL(storeTotal)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="whatsapp"
                    fullWidth
                    className="h-13 rounded-[17px]"
                    isLoading={isPending}
                    onClick={() =>
                      handleSendStoreOrderToWhatsApp(store, storeItems)
                    }
                  >
                    Enviar pedido para {store.name}
                  </Button>

                  {/* Pós-envio: limpar os itens desta loja */}
                  {alreadySent && (
                    <div className="rounded-[18px] bg-emerald-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[13px] font-semibold text-emerald-800">
                        Pedido aberto no WhatsApp de {store.name}. Quer tirar
                        estes itens da sacola?
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => clearStoreItems(store.id)}
                      >
                        Remover itens
                      </Button>
                    </div>
                  )}
                </section>
              );
            })}
          </>
        )}
      </main>

      <Footer className="hidden md:block" />
    </div>
  );
}
