"use client";

import React, { useRef, useState, useTransition } from "react";
import {
  Store,
  CreditCard,
  Clock,
  CalendarPlus,
  Trash2,
  Upload,
  Phone,
  MapPin,
  AtSign,
  Truck,
  ShoppingBag,
  Check,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Banknote,
  Receipt,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateStoreSettingsAction } from "@/app/actions/painel";
import { cn, formatWhatsAppMask, normalizeWhatsAppToDb } from "@/lib/utils";
import type {
  DaySchedule,
  DeliveryFeeType,
  MerchantStoreConfig,
  NeighborhoodItem,
  PaymentMethod,
  SpecialHour,
} from "@/types/marketplace";

export interface StoreSettingsClientProps {
  initialStore: MerchantStoreConfig;
  neighborhoods: NeighborhoodItem[];
}

type SettingsTab = "general" | "payments" | "hours";

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "pix", label: "Pix", icon: <QrCode className="w-3.5 h-3.5" /> },
  {
    id: "credit_card",
    label: "Cartão de Crédito",
    icon: <CreditCard className="w-3.5 h-3.5" />,
  },
  {
    id: "debit_card",
    label: "Cartão de Débito",
    icon: <CreditCard className="w-3.5 h-3.5" />,
  },
  { id: "cash", label: "Dinheiro", icon: <Banknote className="w-3.5 h-3.5" /> },
  {
    id: "payment_link",
    label: "Link de Pagamento",
    icon: <Receipt className="w-3.5 h-3.5" />,
  },
  {
    id: "crediario",
    label: "Crediário da Loja",
    icon: <Wallet className="w-3.5 h-3.5" />,
  },
];

function formatDateBR(isoDate: string): string {
  if (!isoDate || !isoDate.includes("-")) return isoDate;
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function StoreSettingsClient({
  initialStore,
  neighborhoods,
}: StoreSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  // Aba 1: Dados Gerais & Endereço
  const [name, setName] = useState(initialStore.name);
  const [avatarUrl, setAvatarUrl] = useState(initialStore.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(initialStore.banner_url || "");
  const [description, setDescription] = useState(
    initialStore.description || ""
  );
  const [whatsappMask, setWhatsappMask] = useState(
    formatWhatsAppMask(initialStore.whatsapp || "")
  );
  const [instagram, setInstagram] = useState(initialStore.instagram || "");
  const [neighborhoodId, setNeighborhoodId] = useState(
    initialStore.neighborhood_id || neighborhoods[0]?.id || "centro"
  );
  const [address, setAddress] = useState(initialStore.address || "");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Aba 2: Pagamentos & Entrega
  const [acceptedPayments, setAcceptedPayments] = useState<PaymentMethod[]>(
    initialStore.accepted_payments || ["pix", "credit_card", "cash"]
  );
  const [installmentInfo, setInstallmentInfo] = useState(
    initialStore.installment_info || ""
  );
  const [hasDelivery, setHasDelivery] = useState(initialStore.has_delivery);
  const [hasPickup, setHasPickup] = useState(initialStore.has_pickup);
  const [deliveryFeeType, setDeliveryFeeType] = useState<DeliveryFeeType>(
    initialStore.delivery_fee_type || "combine"
  );
  const [deliveryFee, setDeliveryFee] = useState(
    initialStore.delivery_fee ? String(initialStore.delivery_fee) : "5.00"
  );

  // Aba 3: Horário de Funcionamento (Seg-Sex, Sáb, Dom) & Horários Especiais
  const segDefault = initialStore.business_hours?.[1] || {
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  };
  const sabDefault = initialStore.business_hours?.[6] || {
    isClosed: false,
    openTime: "08:00",
    closeTime: "13:00",
    lunchStart: null,
    lunchEnd: null,
  };
  const domDefault = initialStore.business_hours?.[0] || {
    isClosed: true,
    openTime: "08:00",
    closeTime: "12:00",
    lunchStart: null,
    lunchEnd: null,
  };

  const [weekdaysOpen, setWeekdaysOpen] = useState(!segDefault.isClosed);
  const [weekdaysStart, setWeekdaysStart] = useState(
    segDefault.openTime || "08:00"
  );
  const [weekdaysEnd, setWeekdaysEnd] = useState(
    segDefault.closeTime || "18:00"
  );
  const [weekdaysHasLunch, setWeekdaysHasLunch] = useState(
    Boolean(segDefault.lunchStart && segDefault.lunchEnd)
  );
  const [weekdaysLunchStart, setWeekdaysLunchStart] = useState(
    segDefault.lunchStart || "12:00"
  );
  const [weekdaysLunchEnd, setWeekdaysLunchEnd] = useState(
    segDefault.lunchEnd || "14:00"
  );

  const [saturdayOpen, setSaturdayOpen] = useState(!sabDefault.isClosed);
  const [saturdayStart, setSaturdayStart] = useState(
    sabDefault.openTime || "08:00"
  );
  const [saturdayEnd, setSaturdayEnd] = useState(
    sabDefault.closeTime || "13:00"
  );

  const [sundayOpen, setSundayOpen] = useState(!domDefault.isClosed);
  const [sundayStart, setSundayStart] = useState(
    domDefault.openTime || "08:00"
  );
  const [sundayEnd, setSundayEnd] = useState(domDefault.closeTime || "12:00");

  // Horários Especiais (Romaria, Feriados, Plantões)
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>(
    initialStore.special_hours || []
  );
  const [newSpecialDate, setNewSpecialDate] = useState("2026-08-06");
  const [newSpecialLabel, setNewSpecialLabel] = useState(
    "Romaria do Bom Jesus"
  );
  const [newSpecialIsClosed, setNewSpecialIsClosed] = useState(false);
  const [newSpecialOpen, setNewSpecialOpen] = useState("07:00");
  const [newSpecialClose, setNewSpecialClose] = useState("21:00");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const uploadAsset = async (
    file: File,
    folder: "logos" | "banners"
  ): Promise<string> => {
    const localPreview = URL.createObjectURL(file);
    if (!isSupabaseConfigured()) return localPreview;

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${folder}/${initialStore.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("lapa-imagens")
        .upload(filePath, file, { upsert: true });

      if (error) return localPreview;
      const { data } = supabase.storage
        .from("lapa-imagens")
        .getPublicUrl(filePath);
      return data?.publicUrl || localPreview;
    } catch {
      return localPreview;
    }
  };

  const handleTogglePayment = (method: PaymentMethod) => {
    setAcceptedPayments((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const handleAddSpecialHour = () => {
    if (!newSpecialDate || !newSpecialLabel.trim()) return;

    const item: SpecialHour = {
      id: `sp-${Date.now()}`,
      date: newSpecialDate,
      label: newSpecialLabel.trim(),
      isClosed: newSpecialIsClosed,
      openTime: newSpecialIsClosed ? undefined : newSpecialOpen,
      closeTime: newSpecialIsClosed ? undefined : newSpecialClose,
    };

    setSpecialHours((prev) => [
      ...prev.filter((sh) => sh.date !== newSpecialDate),
      item,
    ]);
    setNewSpecialLabel("");
  };

  const handleRemoveSpecialHour = (dateOrId: string) => {
    setSpecialHours((prev) =>
      prev.filter((sh) => sh.id !== dateOrId && sh.date !== dateOrId)
    );
  };

  const buildWeeklyBusinessHours = (): Record<number, DaySchedule> => {
    const weekdaySchedule: Omit<DaySchedule, "dayOfWeek" | "dayLabel"> = {
      isClosed: !weekdaysOpen,
      openTime: weekdaysStart,
      closeTime: weekdaysEnd,
      lunchStart: weekdaysHasLunch ? weekdaysLunchStart : null,
      lunchEnd: weekdaysHasLunch ? weekdaysLunchEnd : null,
    };

    return {
      1: { dayOfWeek: 1, dayLabel: "Segunda-feira", ...weekdaySchedule },
      2: { dayOfWeek: 2, dayLabel: "Terça-feira", ...weekdaySchedule },
      3: { dayOfWeek: 3, dayLabel: "Quarta-feira", ...weekdaySchedule },
      4: { dayOfWeek: 4, dayLabel: "Quinta-feira", ...weekdaySchedule },
      5: { dayOfWeek: 5, dayLabel: "Sexta-feira", ...weekdaySchedule },
      6: {
        dayOfWeek: 6,
        dayLabel: "Sábado",
        isClosed: !saturdayOpen,
        openTime: saturdayStart,
        closeTime: saturdayEnd,
        lunchStart: null,
        lunchEnd: null,
      },
      0: {
        dayOfWeek: 0,
        dayLabel: "Domingo",
        isClosed: !sundayOpen,
        openTime: sundayStart,
        closeTime: sundayEnd,
        lunchStart: null,
        lunchEnd: null,
      },
    };
  };

  const handleSaveAll = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await updateStoreSettingsAction({
        store_id: initialStore.id,
        name,
        avatar_url: avatarUrl || null,
        banner_url: bannerUrl || null,
        description: description || null,
        whatsapp: normalizeWhatsAppToDb(whatsappMask),
        instagram: instagram || null,
        neighborhood_id: neighborhoodId,
        address,
        accepted_payments: acceptedPayments,
        installment_info: installmentInfo || null,
        has_delivery: hasDelivery,
        has_pickup: hasPickup,
        delivery_fee_type: deliveryFeeType,
        delivery_fee:
          deliveryFeeType === "fixed"
            ? Number(deliveryFee.replace(",", ".")) || 0
            : 0,
        business_hours: buildWeeklyBusinessHours(),
        special_hours: specialHours,
      });

      if (result.error) {
        setFeedback({ type: "error", text: result.error });
      } else {
        setFeedback({
          type: "success",
          text:
            result.message ||
            "Configurações e horários atualizados com sucesso!",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Configurações da Loja & Horários
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Personalize sua vitrine, métodos de pagamento e horários especiais (ex:
          Romaria).
        </p>
      </div>

      {/* Navegação em Pílulas das 3 Abas */}
      <nav
        aria-label="Abas de configurações da loja"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
      >
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer",
            activeTab === "general"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-100"
          )}
        >
          <Store className="w-4 h-4" />
          <span>1. Dados Gerais & Endereço</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer",
            activeTab === "payments"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-100"
          )}
        >
          <CreditCard className="w-4 h-4" />
          <span>2. Pagamentos & Entrega</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hours")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer",
            activeTab === "hours"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-100"
          )}
        >
          <Clock className="w-4 h-4" />
          <span>3. Horário & Horários Especiais</span>
        </button>
      </nav>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2.5 rounded-2xl p-4 text-xs sm:text-sm font-medium border",
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-700"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <form
        onSubmit={handleSaveAll}
        className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6"
      >
        {/* =====================================================
            ABA 1: DADOS GERAIS & ENDEREÇO
           ===================================================== */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              Identidade Visual, Contato & Localização
            </h2>

            {/* Logo + Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-16 h-16 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Logo da loja"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    Logo Redonda da Loja
                  </p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = await uploadAsset(f, "logos");
                        setAvatarUrl(url);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Alterar Logo
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-24 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bannerUrl}
                      alt="Banner da loja"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      Sem Banner
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    Banner de Capa da Loja
                  </p>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const url = await uploadAsset(f, "banners");
                        setBannerUrl(url);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    Enviar Banner
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome da Loja *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                leftIcon={<Store className="w-4 h-4" />}
              />

              <Input
                label="WhatsApp de Vendas *"
                value={whatsappMask}
                onChange={(e) =>
                  setWhatsappMask(formatWhatsAppMask(e.target.value))
                }
                placeholder="(77) 99999-9999"
                required
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Instagram da Loja"
                placeholder="@sualojalapa"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                leftIcon={<AtSign className="w-4 h-4" />}
              />

              <Select
                label="Bairro em Bom Jesus da Lapa *"
                value={neighborhoodId}
                onChange={(e) => setNeighborhoodId(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
                options={neighborhoods.map((nb) => ({
                  value: nb.id,
                  label: nb.name,
                }))}
              />
            </div>

            <Input
              label="Endereço Completo / Ponto de Referência *"
              placeholder="Ex: Av. Manoel Novaes, 120 - Centro (Ao lado da Caixa)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              leftIcon={<MapPin className="w-4 h-4" />}
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="store-settings-bio"
                className="text-xs font-semibold text-slate-700 px-1"
              >
                Bio / Apresentação da Loja
              </label>
              <textarea
                id="store-settings-bio"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-100/80 rounded-2xl px-4 py-3 text-sm text-slate-900 border border-transparent outline-none focus:border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 resize-none"
              />
            </div>
          </div>
        )}

        {/* =====================================================
            ABA 2: PAGAMENTOS & ENTREGA
           ===================================================== */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              Formas de Pagamento, Parcelamento & Logística
            </h2>

            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 px-1 block">
                Formas de Pagamento Aceitas (`accepted_payments`)
              </label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((opt) => {
                  const selected = acceptedPayments.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleTogglePayment(opt.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border",
                        selected
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-100/80 text-slate-700 border-transparent hover:bg-slate-200/70"
                      )}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                      {selected && (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Informação de Parcelamento / Desconto no Pix"
              placeholder="Ex: Até 3x sem juros no cartão ou 10% OFF no Pix"
              value={installmentInfo}
              onChange={(e) => setInstallmentInfo(e.target.value)}
              leftIcon={<CreditCard className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasDelivery((v) => !v)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer",
                  hasDelivery
                    ? "bg-emerald-50/70 border-emerald-300 text-slate-900"
                    : "bg-slate-100/60 border-transparent text-slate-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="block text-sm font-bold">
                      Entrega (Delivery)
                    </span>
                    <span className="block text-xs text-slate-500">
                      Motoboy em Bom Jesus da Lapa
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold">
                  {hasDelivery ? "Ativo" : "Inativo"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHasPickup((v) => !v)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer",
                  hasPickup
                    ? "bg-emerald-50/70 border-emerald-300 text-slate-900"
                    : "bg-slate-100/60 border-transparent text-slate-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="block text-sm font-bold">
                      Retirada na Loja Física
                    </span>
                    <span className="block text-xs text-slate-500">
                      Cliente retira no balcão
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold">
                  {hasPickup ? "Ativo" : "Inativo"}
                </span>
              </button>
            </div>

            {hasDelivery && (
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
                <span className="block text-xs font-bold text-slate-700">
                  Política de Taxa de Entrega
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: "free", label: "Frete Grátis" },
                      { id: "fixed", label: "Taxa Fixa em R$" },
                      { id: "combine", label: "A combinar no WhatsApp" },
                    ] as const
                  ).map((feeOpt) => (
                    <button
                      key={feeOpt.id}
                      type="button"
                      onClick={() => setDeliveryFeeType(feeOpt.id)}
                      className={cn(
                        "rounded-full py-2.5 px-3 text-xs font-bold transition-all cursor-pointer border",
                        deliveryFeeType === feeOpt.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200"
                      )}
                    >
                      {feeOpt.label}
                    </button>
                  ))}
                </div>

                {deliveryFeeType === "fixed" && (
                  <div className="max-w-xs pt-1">
                    <Input
                      label="Valor da Taxa Fixa (R$)"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            ABA 3: HORÁRIO DE FUNCIONAMENTO & HORÁRIOS ESPECIAIS
           ===================================================== */}
        {activeTab === "hours" && (
          <div className="space-y-6">
            {/* Bloco 1: Editor Simples Seg-Sex, Sáb e Dom */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Horário de Funcionamento da Semana
                </h2>
                <p className="text-xs text-slate-500">
                  O selo &ldquo;Aberta agora / Horário de Almoço / Fechada&rdquo;
                  na vitrine usa esses horários automaticamente.
                </p>
              </div>

              {/* Segunda a Sexta */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={weekdaysOpen}
                      onChange={(e) => setWeekdaysOpen(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span>Segunda a Sexta-feira</span>
                  </label>

                  {weekdaysOpen && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-600">
                        Abre:
                      </span>
                      <input
                        type="time"
                        value={weekdaysStart}
                        onChange={(e) => setWeekdaysStart(e.target.value)}
                        className="rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 font-bold"
                      />
                      <span className="font-semibold text-slate-600">
                        Fecha:
                      </span>
                      <input
                        type="time"
                        value={weekdaysEnd}
                        onChange={(e) => setWeekdaysEnd(e.target.value)}
                        className="rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 font-bold"
                      />
                    </div>
                  )}
                </div>

                {weekdaysOpen && (
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weekdaysHasLunch}
                        onChange={(e) => setWeekdaysHasLunch(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300"
                      />
                      <span>Possui intervalo para almoço</span>
                    </label>

                    {weekdaysHasLunch && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Início almoço:</span>
                        <input
                          type="time"
                          value={weekdaysLunchStart}
                          onChange={(e) =>
                            setWeekdaysLunchStart(e.target.value)
                          }
                          className="rounded-xl bg-white border border-slate-200 px-2.5 py-1 font-bold"
                        />
                        <span className="text-slate-500">Retorno:</span>
                        <input
                          type="time"
                          value={weekdaysLunchEnd}
                          onChange={(e) => setWeekdaysLunchEnd(e.target.value)}
                          className="rounded-xl bg-white border border-slate-200 px-2.5 py-1 font-bold"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sábado */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saturdayOpen}
                    onChange={(e) => setSaturdayOpen(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span>Sábado</span>
                </label>

                {saturdayOpen ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-600">Abre:</span>
                    <input
                      type="time"
                      value={saturdayStart}
                      onChange={(e) => setSaturdayStart(e.target.value)}
                      className="rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 font-bold"
                    />
                    <span className="font-semibold text-slate-600">Fecha:</span>
                    <input
                      type="time"
                      value={saturdayEnd}
                      onChange={(e) => setSaturdayEnd(e.target.value)}
                      className="rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 font-bold"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    Fechado aos sábados
                  </span>
                )}
              </div>

              {/* Domingo */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sundayOpen}
                    onChange={(e) => setSundayOpen(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span>Domingo</span>
                </label>

                {sundayOpen ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-600">Abre:</span>
                    <input
                      type="time"
                      value={sundayStart}
                      onChange={(e) => setSundayStart(e.target.value)}
                      className="rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 font-bold"
                    />
                    <span className="font-semibold text-slate-600">Fecha:</span>
                    <input
                      type="time"
                      value={sundayEnd}
                      onChange={(e) => setSundayEnd(e.target.value)}
                      className="rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 font-bold"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    Fechado aos domingos
                  </span>
                )}
              </div>
            </div>

            {/* Bloco 2: Lista Dinâmica de Horários Especiais por Data */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Horários Especiais por Data (Romaria, Feriados & Plantões)
                </h3>
                <p className="text-xs text-slate-500">
                  Adicione datas com horário estendido (ex: Romaria do Bom
                  Jesus) ou feriados em que a loja estará fechada.
                </p>
              </div>

              {/* Formulário rápido para adicionar Horário Especial */}
              <div className="rounded-2xl bg-emerald-50/50 border border-emerald-200/70 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Data"
                    type="date"
                    value={newSpecialDate}
                    onChange={(e) => setNewSpecialDate(e.target.value)}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Motivo / Evento Local"
                      placeholder="Ex: Romaria do Bom Jesus ou Feriado Municipal"
                      value={newSpecialLabel}
                      onChange={(e) => setNewSpecialLabel(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSpecialIsClosed}
                        onChange={(e) =>
                          setNewSpecialIsClosed(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span>Loja Fechada nesta data</span>
                    </label>

                    {!newSpecialIsClosed && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600 font-semibold">
                          Aberto das
                        </span>
                        <input
                          type="time"
                          value={newSpecialOpen}
                          onChange={(e) => setNewSpecialOpen(e.target.value)}
                          className="rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 font-bold"
                        />
                        <span className="text-slate-600 font-semibold">às</span>
                        <input
                          type="time"
                          value={newSpecialClose}
                          onChange={(e) => setNewSpecialClose(e.target.value)}
                          className="rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 font-bold"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddSpecialHour}
                    leftIcon={<CalendarPlus className="w-3.5 h-3.5" />}
                  >
                    Adicionar Data Especial
                  </Button>
                </div>
              </div>

              {/* Lista de Horários Especiais Configurados */}
              <div className="space-y-2">
                {specialHours.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Nenhum horário especial cadastrado no momento.
                  </p>
                ) : (
                  specialHours.map((sh) => (
                    <div
                      key={sh.id || sh.date}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100"
                    >
                      <div className="text-xs sm:text-sm">
                        <span className="font-extrabold text-slate-900">
                          {formatDateBR(sh.date)} — {sh.label}
                        </span>
                        <span className="mx-2 text-slate-300">•</span>
                        {sh.isClosed ? (
                          <span className="font-bold text-rose-600">
                            Fechado
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700">
                            Aberto das {sh.openTime} às {sh.closeTime}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveSpecialHour(sh.id || sh.date)
                        }
                        aria-label={`Remover ${sh.label}`}
                        className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rodapé de Salvamento */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            type="submit"
            variant="whatsapp"
            size="lg"
            isLoading={isPending}
          >
            Salvar Configurações da Loja
          </Button>
        </div>
      </form>
    </div>
  );
}

