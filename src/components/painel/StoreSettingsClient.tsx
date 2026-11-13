"use client";

import { trackEvent } from "@/lib/analytics";
import React, { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, fieldBaseClasses, fieldLabelClasses } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PillGroup, Segmented, Switch } from "@/components/ui/Switch";
import { LapaSymbol } from "@/components/brand/LapaSymbol";
import { getStoreOpenStatus } from "@/lib/store-hours";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateStoreSettingsAction } from "@/app/actions/painel";
import { StoreCategoryField } from "@/components/ui/StoreCategoryField";
import { STORE_CATEGORY_OTHER } from "@/lib/db-columns";
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
  /** Categorias principais do portal (categoria da loja). */
  storeCategories?: Array<{ id: string; name: string }>;
}

type SettingsTab = "general" | "payments" | "hours";

const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string }> = [
  { id: "pix", label: "Pix" },
  { id: "credit_card", label: "Cartão de crédito" },
  { id: "debit_card", label: "Cartão de débito" },
  { id: "cash", label: "Dinheiro" },
  { id: "payment_link", label: "Link de pagamento" },
  { id: "crediario", label: "Crediário da loja" },
];

export function StoreSettingsClient({
  initialStore,
  neighborhoods,
  storeCategories = [],
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
  const [categoryId, setCategoryId] = useState(
    initialStore.global_category_id ||
      (initialStore.category_other ? STORE_CATEGORY_OTHER : "")
  );
  const [categoryOther, setCategoryOther] = useState(
    initialStore.category_other || ""
  );

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

    if (categoryId === STORE_CATEGORY_OTHER && categoryOther.trim().length < 2) {
      setActiveTab("general");
      setFeedback({
        type: "error",
        text: "Escreva qual é a categoria da sua loja.",
      });
      return;
    }

    startTransition(async () => {
      const result = await updateStoreSettingsAction({
        store_id: initialStore.id,
        name,
        category_id: categoryId || null,
        category_other:
          categoryId === STORE_CATEGORY_OTHER ? categoryOther.trim() : null,
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
        trackEvent("store_settings_updated");
        setFeedback({
          type: "success",
          text:
            result.message ||
            "Configurações e horários atualizados com sucesso!",
        });
      }
    });
  };

  const timeInputClasses =
    "h-9 rounded-[10px] bg-white border border-slate-200 px-2 text-[13px] text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand-light/25";
  const cardClasses = "p-5 rounded-3xl bg-white flex flex-col gap-3.5";
  const cardTitle = "text-[17px] font-extrabold text-slate-900";

  const timeRange = (
    label: string,
    start: string,
    end: string,
    setStart: (v: string) => void,
    setEnd: (v: string) => void
  ) => (
    <span className="flex items-center gap-1.5 text-slate-500">
      <input type="time" aria-label={`Abertura ${label}`} value={start} onChange={(e) => setStart(e.target.value)} className={timeInputClasses} />
      –
      <input type="time" aria-label={`Fechamento ${label}`} value={end} onChange={(e) => setEnd(e.target.value)} className={timeInputClasses} />
    </span>
  );

  const dayRow = (
    label: string,
    open: boolean,
    setOpen: (v: boolean) => void,
    range: React.ReactNode,
    extra?: React.ReactNode
  ) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 border-t border-slate-100 first:border-t-0 text-sm">
      <span className="w-27.5 font-semibold text-slate-900">{label}</span>
      <Switch size="sm" checked={open} onCheckedChange={setOpen} aria-label={`${label} aberta`} />
      {open ? (
        range
      ) : (
        <span className="px-2.5 py-1.5 rounded-[10px] bg-slate-100 text-[13px] text-slate-400">Fechado</span>
      )}
      {open && extra}
    </div>
  );

  const mkDay = (
    dayOfWeek: number,
    dayLabel: string,
    open: boolean,
    start: string,
    end: string,
    lunch = false
  ): DaySchedule => ({
    dayOfWeek,
    dayLabel,
    isClosed: !open,
    openTime: start,
    closeTime: end,
    lunchStart: lunch ? weekdaysLunchStart : null,
    lunchEnd: lunch ? weekdaysLunchEnd : null,
  });
  const liveHours: Record<number, DaySchedule> = {
    0: mkDay(0, "Domingo", sundayOpen, sundayStart, sundayEnd),
    6: mkDay(6, "Sábado", saturdayOpen, saturdayStart, saturdayEnd),
  };
  (
    [
      [1, "Segunda-feira"],
      [2, "Terça-feira"],
      [3, "Quarta-feira"],
      [4, "Quinta-feira"],
      [5, "Sexta-feira"],
    ] as const
  ).forEach(([d, label]) => {
    liveHours[d] = mkDay(d, label, weekdaysOpen, weekdaysStart, weekdaysEnd, weekdaysHasLunch);
  });
  const liveStatus = getStoreOpenStatus({
    businessHours: liveHours,
    specialHours,
  });

  return (
    <div className="flex flex-col gap-4.5">
      <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">
        Configurações da loja
      </h1>

      <Segmented
        ariaLabel="Abas de configurações da loja"
        className="self-start max-w-full overflow-x-auto"
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: "general", label: "Dados gerais" },
          { value: "payments", label: "Pagamentos & entrega" },
          { value: "hours", label: "Horários" },
        ]}
      />

      {feedback && <Notice tone={feedback.type}>{feedback.text}</Notice>}

      <form onSubmit={handleSaveAll} className="flex flex-col gap-4">
        {/* ===== DADOS GERAIS ===== */}
        {activeTab === "general" && (
          <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start">
            <section className={cardClasses}>
              <h2 className={cardTitle}>Identidade</h2>
              <div className="flex items-center gap-3.5">
                <span className="w-16 h-16 rounded-full bg-brand-soft overflow-hidden grid place-items-center shrink-0 shadow-[0_0_0_2px_#0F172A]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Logo da loja" className="w-full h-full object-cover" />
                  ) : (
                    <LapaSymbol size={30} />
                  )}
                </span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setAvatarUrl(await uploadAsset(f, "logos"));
                  }}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                  Alterar logo
                </Button>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="w-24 h-16 rounded-[18px] bg-brand-soft overflow-hidden grid place-items-center shrink-0 text-[11px] text-brand-ink">
                  {bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bannerUrl} alt="Banner da loja" className="w-full h-full object-cover" />
                  ) : (
                    "sem banner"
                  )}
                </span>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setBannerUrl(await uploadAsset(f, "banners"));
                  }}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()}>
                  Enviar banner
                </Button>
              </div>
              <Input inputSize="md" label="Nome da loja *" value={name} onChange={(e) => setName(e.target.value)} required />
              <StoreCategoryField
                categories={storeCategories}
                value={categoryId}
                onChange={setCategoryId}
                otherText={categoryOther}
                onOtherTextChange={setCategoryOther}
                surface="soft"
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="store-settings-bio" className={fieldLabelClasses}>Bio da loja</label>
                <div className="relative lapa-aurora-glow rounded-[15px]">
                  <textarea
                    id="store-settings-bio"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(fieldBaseClasses, "rounded-[15px] px-3.5 py-3 text-sm resize-none")}
                  />
                </div>
              </div>
            </section>

            <section className={cardClasses}>
              <h2 className={cardTitle}>Contato e localização</h2>
              <Input
                inputSize="md"
                label="WhatsApp de vendas *"
                value={whatsappMask}
                onChange={(e) => setWhatsappMask(formatWhatsAppMask(e.target.value))}
                placeholder="(77) 99999-9999"
                inputMode="tel"
                required
              />
              <Input inputSize="md" label="Instagram" placeholder="@sualojalapa" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              <Select
                inputSize="md"
                label="Bairro *"
                value={neighborhoodId}
                onChange={(e) => setNeighborhoodId(e.target.value)}
                options={neighborhoods.map((nb) => ({ value: nb.id, label: nb.name }))}
              />
              <Input
                inputSize="md"
                label="Endereço ou ponto de referência *"
                placeholder="Av. Manoel Novais, 120 — ao lado da Caixa"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </section>
          </div>
        )}

        {/* ===== PAGAMENTOS & ENTREGA ===== */}
        {activeTab === "payments" && (
          <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start">
            <section className={cardClasses}>
              <h2 className={cardTitle}>Pagamento</h2>
              <PillGroup
                ariaLabel="Formas de pagamento aceitas"
                tone="brand"
                surface="ring"
                value={acceptedPayments}
                onToggle={(id) => handleTogglePayment(id)}
                options={PAYMENT_OPTIONS.map((opt) => ({ value: opt.id, label: opt.label }))}
              />
              <Input
                inputSize="md"
                label="Parcelamento ou desconto no Pix"
                placeholder="Até 3x sem juros no cartão"
                value={installmentInfo}
                onChange={(e) => setInstallmentInfo(e.target.value)}
              />
            </section>

            <section className={cardClasses}>
              <h2 className={cardTitle}>Entrega</h2>
              <div className="flex flex-col">
                {(
                  [
                    ["Entrega (delivery)", "Motoboy em Bom Jesus da Lapa", hasDelivery, setHasDelivery],
                    ["Retirada na loja", "Cliente retira no balcão", hasPickup, setHasPickup],
                  ] as const
                ).map(([label, sub, on, set], idx) => (
                  <div key={label} className={cn("flex items-center justify-between gap-3 py-3", idx > 0 && "border-t border-slate-100")}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-slate-900">{label}</span>
                      <span className="text-xs text-slate-500">{sub}</span>
                    </div>
                    <Switch checked={on} onCheckedChange={set} aria-label={label} />
                  </div>
                ))}
              </div>
              {hasDelivery && (
                <>
                  <Segmented
                    ariaLabel="Taxa de entrega"
                    value={deliveryFeeType}
                    onChange={setDeliveryFeeType}
                    options={[
                      { value: "free", label: "Frete grátis" },
                      { value: "fixed", label: "Taxa fixa" },
                      { value: "combine", label: "A combinar" },
                    ]}
                  />
                  {deliveryFeeType === "fixed" && (
                    <Input inputSize="md" label="Valor da taxa fixa (R$)" inputMode="decimal" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
                  )}
                </>
              )}
            </section>
          </div>
        )}

        {/* ===== HORÁRIOS ===== */}
        {activeTab === "hours" && (
          <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
            <section className={cardClasses}>
              <h2 className={cardTitle}>Horário de funcionamento</h2>
              {dayRow(
                "Segunda a Sexta",
                weekdaysOpen,
                setWeekdaysOpen,
                timeRange("segunda a sexta", weekdaysStart, weekdaysEnd, setWeekdaysStart, setWeekdaysEnd),
                <span className="basis-full flex flex-wrap items-center gap-2 text-[13px] text-slate-500 pl-0">
                  <Switch size="sm" checked={weekdaysHasLunch} onCheckedChange={setWeekdaysHasLunch} aria-label="Intervalo para almoço" />
                  Almoço
                  {weekdaysHasLunch && (
                    <>
                      <input type="time" aria-label="Início do almoço" value={weekdaysLunchStart} onChange={(e) => setWeekdaysLunchStart(e.target.value)} className={timeInputClasses} />
                      –
                      <input type="time" aria-label="Retorno do almoço" value={weekdaysLunchEnd} onChange={(e) => setWeekdaysLunchEnd(e.target.value)} className={timeInputClasses} />
                    </>
                  )}
                </span>
              )}
              {dayRow("Sábado", saturdayOpen, setSaturdayOpen, timeRange("sábado", saturdayStart, saturdayEnd, setSaturdayStart, setSaturdayEnd))}
              {dayRow("Domingo", sundayOpen, setSundayOpen, timeRange("domingo", sundayStart, sundayEnd, setSundayStart, setSundayEnd))}
            </section>

            <div className="flex flex-col gap-3.5">
              <section className={cardClasses}>
                <h2 className={cardTitle}>Horários especiais</h2>
                <p className="text-[13px] text-slate-500 -mt-2">
                  Romaria, feriados e plantões. A data entra no cartão &ldquo;Como comprar&rdquo; da vitrine.
                </p>

                {specialHours.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum horário especial cadastrado.</p>
                ) : (
                  specialHours.map((sh, idx) => {
                    const [, month, day] = sh.date.split("-");
                    const monthLabel = new Date(2000, Number(month) - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
                    return (
                      <div key={sh.id || sh.date} className={cn("flex items-center gap-3 p-3 rounded-[18px]", idx === 0 ? "bg-brand-soft" : "bg-slate-50")}>
                        <span className="flex-none w-12 flex flex-col items-center py-1.5 rounded-xl bg-white">
                          <span className="font-display text-[17px] font-extrabold leading-none">{day}</span>
                          <span className="text-[10px] uppercase text-slate-500">{monthLabel}</span>
                        </span>
                        <span className="flex-1 min-w-0 flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 truncate">{sh.label}</span>
                          <span className={cn("text-[13px]", idx === 0 ? "text-brand-ink" : "text-slate-500")}>
                            {sh.isClosed ? "Fechado" : `Aberto ${sh.openTime} às ${sh.closeTime}`}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialHour(sh.id || sh.date)}
                          aria-label={`Remover ${sh.label}`}
                          className="w-9 h-9 rounded-xl text-slate-500 hover:text-offer hover:bg-white grid place-items-center cursor-pointer transition-colors duration-150"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                      </div>
                    );
                  })
                )}

                <div className="p-3.5 rounded-[18px] bg-slate-50 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[150px_minmax(0,1fr)] gap-3">
                    <Input inputSize="md" label="Data" type="date" value={newSpecialDate} onChange={(e) => setNewSpecialDate(e.target.value)} />
                    <Input inputSize="md" label="Motivo" placeholder="Romaria do Bom Jesus" value={newSpecialLabel} onChange={(e) => setNewSpecialLabel(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-700">
                    <span className="inline-flex items-center gap-2">
                      <Switch size="sm" checked={newSpecialIsClosed} onCheckedChange={setNewSpecialIsClosed} aria-label="Loja fechada nesta data" />
                      Fechada
                    </span>
                    {!newSpecialIsClosed && (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <input type="time" aria-label="Abertura" value={newSpecialOpen} onChange={(e) => setNewSpecialOpen(e.target.value)} className={timeInputClasses} />
                        –
                        <input type="time" aria-label="Fechamento" value={newSpecialClose} onChange={(e) => setNewSpecialClose(e.target.value)} className={timeInputClasses} />
                      </span>
                    )}
                  </div>
                  <Button type="button" size="sm" onClick={handleAddSpecialHour} className="self-start">
                    + Adicionar data
                  </Button>
                </div>
              </section>

              <section className="p-5 rounded-3xl bg-brand-soft flex flex-col gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">Como o cliente vê agora</span>
                <div className="flex flex-wrap gap-2 text-[13px] font-semibold">
                  <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.75 rounded-full", liveStatus.state === "open" ? "bg-emerald-100 text-emerald-800" : liveStatus.state === "closed" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800")}>
                    <span className={cn("w-1.75 h-1.75 rounded-full", liveStatus.state === "open" ? "bg-whatsapp" : liveStatus.state === "closed" ? "bg-slate-400" : "bg-amber-600")} />
                    {liveStatus.label}
                  </span>
                  <span className="px-3 py-1.75 rounded-full bg-white text-slate-700 font-normal">{liveStatus.detailText}</span>
                </div>
              </section>
            </div>
          </div>
        )}

        <div className="sticky bottom-3 lg:static">
          <Button type="submit" size="lg" isLoading={isPending} className="w-full sm:w-auto sm:min-w-64">
            Salvar configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
