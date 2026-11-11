"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import {
  Store,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  Wallet,
  Truck,
  ShoppingBag,
  Clock,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  checkSlugAvailability,
  createStoreAction,
  type SlugCheckResult,
} from "@/app/actions/onboarding";
import {
  cn,
  formatWhatsAppMask,
  normalizeWhatsAppToDb,
  sanitizeStoreSlug,
} from "@/lib/utils";
import type {
  DaySchedule,
  DeliveryFeeType,
  NeighborhoodItem,
  PaymentMethod,
} from "@/types/marketplace";

export interface OnboardingWizardProps {
  neighborhoods: NeighborhoodItem[];
  initialStoreName?: string;
  initialWhatsapp?: string;
}

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "pix",
    label: "Pix",
    icon: <QrCode className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  {
    id: "credit_card",
    label: "Cartão de Crédito",
    icon: <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  {
    id: "debit_card",
    label: "Cartão de Débito",
    icon: <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  {
    id: "cash",
    label: "Dinheiro",
    icon: <Banknote className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  {
    id: "payment_link",
    label: "Link de Pagamento",
    icon: <Receipt className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  {
    id: "crediario",
    label: "Crediário da Loja",
    icon: <Wallet className="w-3.5 h-3.5" aria-hidden="true" />,
  },
];

const INITIAL_LAPA_HOURS: Record<number, DaySchedule> = {
  1: {
    dayOfWeek: 1,
    dayLabel: "Segunda-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  2: {
    dayOfWeek: 2,
    dayLabel: "Terça-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  3: {
    dayOfWeek: 3,
    dayLabel: "Quarta-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  4: {
    dayOfWeek: 4,
    dayLabel: "Quinta-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  5: {
    dayOfWeek: 5,
    dayLabel: "Sexta-feira",
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  6: {
    dayOfWeek: 6,
    dayLabel: "Sábado",
    isClosed: false,
    openTime: "08:00",
    closeTime: "13:00",
    lunchStart: null,
    lunchEnd: null,
  },
  0: {
    dayOfWeek: 0,
    dayLabel: "Domingo",
    isClosed: true,
    openTime: "08:00",
    closeTime: "12:00",
    lunchStart: null,
    lunchEnd: null,
  },
};

const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0] as const;

export function OnboardingWizard({
  neighborhoods,
  initialStoreName = "",
  initialWhatsapp = "",
}: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formError, setFormError] = useState<string>("");

  // Passo 1: Identidade da Loja
  const [storeName, setStoreName] = useState(initialStoreName);
  const [slug, setSlug] = useState(
    initialStoreName ? sanitizeStoreSlug(initialStoreName) : ""
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugCheckResult | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");

  // Passo 2: Localização em Lapa & WhatsApp de Vendas
  const [whatsappMask, setWhatsappMask] = useState(
    initialWhatsapp ? formatWhatsAppMask(initialWhatsapp) : ""
  );
  const [neighborhoodId, setNeighborhoodId] = useState(
    neighborhoods[0]?.id || "centro"
  );
  const [address, setAddress] = useState("");

  // Passo 3: Pagamentos, Entrega e Horário Padrão
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    "pix",
    "credit_card",
    "debit_card",
    "cash",
  ]);
  const [installmentInfo, setInstallmentInfo] = useState(
    "Até 3x sem juros no cartão"
  );
  const [hasDelivery, setHasDelivery] = useState(true);
  const [hasPickup, setHasPickup] = useState(true);
  const [deliveryFeeType, setDeliveryFeeType] =
    useState<DeliveryFeeType>("combine");
  const [fixedDeliveryFee, setFixedDeliveryFee] = useState("5,00");

  const [businessHours, setBusinessHours] =
    useState<Record<number, DaySchedule>>(INITIAL_LAPA_HOURS);
  const [showDetailedHours, setShowDetailedHours] = useState(false);

  const [isSubmitting, startSubmitTransition] = useTransition();
  const slugTimerRef = useRef<number | null>(null);

  const triggerDebouncedSlugCheck = (rawValue: string) => {
    if (slugTimerRef.current) {
      window.clearTimeout(slugTimerRef.current);
      slugTimerRef.current = null;
    }

    const clean = sanitizeStoreSlug(rawValue);
    if (!clean) {
      setSlugStatus(null);
      setIsCheckingSlug(false);
      return;
    }

    setIsCheckingSlug(true);
    slugTimerRef.current = window.setTimeout(async () => {
      const result = await checkSlugAvailability(clean);
      setSlugStatus(result);
      setIsCheckingSlug(false);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (slugTimerRef.current) {
        window.clearTimeout(slugTimerRef.current);
      }
    };
  }, []);

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStoreName(val);
    if (!slugManuallyEdited) {
      const nextSlug = sanitizeStoreSlug(val);
      setSlug(nextSlug);
      triggerDebouncedSlugCheck(nextSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    const nextSlug = sanitizeStoreSlug(e.target.value);
    setSlug(nextSlug);
    triggerDebouncedSlugCheck(nextSlug);
  };

  // Upload instantâneo de Logo para o bucket `lapa-imagens` com preview redondo
  const handleLogoFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploadError("");

    if (!file.type.startsWith("image/")) {
      setLogoUploadError("Selecione uma imagem válida (JPG, PNG ou WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError("A imagem deve ter no máximo 5MB.");
      return;
    }

    // Preview instantâneo local
    const localPreviewUrl = URL.createObjectURL(file);
    setLogoPreview(localPreviewUrl);

    if (!isSupabaseConfigured()) {
      setLogoUrl(localPreviewUrl);
      return;
    }

    setIsUploadingLogo(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `logos/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("lapa-imagens")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        // Mantém o preview local caso o bucket ainda esteja sendo configurado
        setLogoUrl(localPreviewUrl);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("lapa-imagens")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          setLogoUrl(publicUrlData.publicUrl);
        }
      }
    } catch {
      setLogoUrl(localPreviewUrl);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const updateDaySchedule = (
    dayOfWeek: number,
    patch: Partial<DaySchedule>
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        ...patch,
      },
    }));
  };

  const validateStep1 = (): boolean => {
    setFormError("");
    if (!storeName.trim()) {
      setFormError("Digite o nome da sua loja para continuar.");
      return false;
    }
    const cleanSlug = sanitizeStoreSlug(slug);
    if (!cleanSlug || cleanSlug.length < 3) {
      setFormError("O link do seu catálogo deve ter pelo menos 3 caracteres.");
      return false;
    }
    if (slugStatus && !slugStatus.available) {
      setFormError(slugStatus.message);
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setFormError("");
    const dbPhone = normalizeWhatsAppToDb(whatsappMask);
    if (!dbPhone || dbPhone.length < 12) {
      setFormError(
        "Informe um WhatsApp válido com DDD (ex: (77) 99999-9999)."
      );
      return false;
    }
    if (!neighborhoodId) {
      setFormError("Selecione o bairro da sua loja em Bom Jesus da Lapa.");
      return false;
    }
    if (!address.trim()) {
      setFormError(
        "Informe o endereço ou ponto de referência da loja em Bom Jesus da Lapa."
      );
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setFormError("");
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinishSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (paymentMethods.length === 0) {
      setFormError("Selecione pelo menos uma forma de pagamento aceita.");
      return;
    }

    if (!hasDelivery && !hasPickup) {
      setFormError(
        "Marque pelo menos uma modalidade: Entrega (Delivery) ou Retirada na Loja."
      );
      return;
    }

    const parsedFee = Number(
      fixedDeliveryFee.replace(/\./g, "").replace(",", ".")
    );

    startSubmitTransition(async () => {
      const result = await createStoreAction({
        name: storeName.trim(),
        slug: sanitizeStoreSlug(slug),
        logo_url: logoUrl,
        description: description.trim() || null,
        whatsapp: normalizeWhatsAppToDb(whatsappMask),
        neighborhood_id: neighborhoodId,
        address: address.trim(),
        payment_methods: paymentMethods,
        installment_info: installmentInfo.trim() || null,
        has_delivery: hasDelivery,
        has_pickup: hasPickup,
        delivery_fee_type: deliveryFeeType,
        delivery_fee:
          deliveryFeeType === "fixed" && !Number.isNaN(parsedFee)
            ? parsedFee
            : 0,
        business_hours: businessHours,
      });

      if (result?.error) {
        setFormError(result.error);
      }
    });
  };

  const progressPercentage = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Barra de Progresso no Topo */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-extrabold">
              Passo {step} de 3
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-700">
              {step === 1 && "Identidade da Loja"}
              {step === 2 && "Localização em Lapa & WhatsApp"}
              {step === 3 && "Pagamentos, Entrega e Horário"}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Pronto em 3 min
          </span>
        </div>

        {/* Barra visual */}
        <div
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Passo ${step} de 3`}
          className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Indicadores de etapas */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => step > 1 && setStep(1)}
            disabled={step === 1}
            className={cn(
              "text-left truncate transition-colors",
              step >= 1 ? "text-slate-900 font-bold" : "text-slate-400",
              step > 1 && "cursor-pointer hover:text-emerald-600"
            )}
          >
            1. Identidade & Link
          </button>
          <button
            type="button"
            onClick={() => step > 2 && setStep(2)}
            disabled={step <= 2}
            className={cn(
              "text-center truncate transition-colors",
              step >= 2 ? "text-slate-900 font-bold" : "text-slate-400",
              step > 2 && "cursor-pointer hover:text-emerald-600"
            )}
          >
            2. Bairro & WhatsApp
          </button>
          <span
            className={cn(
              "text-right truncate",
              step === 3 ? "text-slate-900 font-bold" : "text-slate-400"
            )}
          >
            3. Pagamento & Horário
          </span>
        </div>
      </div>

      {/* Card Principal do Wizard */}
      <form
        onSubmit={handleFinishSubmit}
        className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6"
      >
        {/* Alerta de Erro Geral */}
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm font-medium text-rose-700"
          >
            <AlertCircle
              className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{formError}</span>
          </div>
        )}

        {/* =========================================================
            PASSO 1: IDENTIDADE DA LOJA
           ========================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Qual é o nome e o link da sua loja?
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Escolha como seus clientes de Bom Jesus da Lapa encontrarão seu
                catálogo digital.
              </p>
            </div>

            {/* Upload de Logo Opcional com Preview Redondo */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="relative w-20 h-20 rounded-full bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs mx-auto sm:mx-0">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Preview da logo da loja"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store
                    className="w-8 h-8 text-slate-400"
                    aria-hidden="true"
                  />
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white">
                    <Loader2
                      className="w-5 h-5 animate-spin"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Logo da sua loja{" "}
                    <span className="text-slate-400 font-normal">
                      (Opcional)
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Envio instantâneo para o bucket{" "}
                    <code className="text-slate-700 font-semibold">
                      lapa-imagens
                    </code>
                    . Recomendado imagem quadrada.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isUploadingLogo}
                    leftIcon={
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    }
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? "Trocar imagem" : "Enviar logo"}
                  </Button>

                  {logoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      }
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoUrl(null);
                      }}
                    >
                      Remover
                    </Button>
                  )}
                </div>

                {logoUploadError && (
                  <p className="text-xs font-medium text-rose-600">
                    {logoUploadError}
                  </p>
                )}
              </div>
            </div>

            {/* Nome da Loja */}
            <Input
              label="Nome da Loja"
              placeholder="Ex: Você Fashion Lapa"
              value={storeName}
              onChange={handleStoreNameChange}
              required
              leftIcon={<Store className="w-4 h-4" aria-hidden="true" />}
            />

            {/* Link do Catálogo com Prefixo Fixo + Validação em Tempo Real (Debounce 500ms) */}
            <div className="space-y-1.5">
              <label
                htmlFor="store-slug-input"
                className="text-xs font-semibold text-slate-700 tracking-tight px-1 block"
              >
                Link do seu Catálogo
              </label>

              <div
                className={cn(
                  "flex items-center rounded-2xl bg-slate-100/80 border transition-all overflow-hidden",
                  "focus-within:bg-white focus-within:ring-2",
                  slugStatus?.available === true
                    ? "border-emerald-300 focus-within:border-emerald-400 focus-within:ring-emerald-500/15"
                    : slugStatus?.available === false && slug.length > 0
                    ? "border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-500/15"
                    : "border-transparent focus-within:border-slate-200 focus-within:ring-slate-900/10"
                )}
              >
                <span className="pl-4 pr-1.5 py-3 text-xs sm:text-sm font-semibold text-slate-400 select-none whitespace-nowrap">
                  lapamarketplace.com.br/
                </span>
                <input
                  id="store-slug-input"
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="voce-fashion-lapa"
                  required
                  className="w-full bg-transparent pr-3 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
                <div className="pr-3.5 flex items-center shrink-0">
                  {isCheckingSlug ? (
                    <Loader2
                      className="w-4 h-4 text-slate-400 animate-spin"
                      aria-label="Verificando disponibilidade"
                    />
                  ) : slugStatus?.available === true ? (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : slugStatus?.available === false && slug.length > 0 ? (
                    <AlertCircle
                      className="w-4 h-4 text-rose-500"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </div>

              {/* Feedback de disponibilidade em tempo real */}
              <div className="px-1 min-h-4 flex items-center justify-between text-xs">
                {isCheckingSlug ? (
                  <span className="text-slate-400">
                    Verificando disponibilidade do link...
                  </span>
                ) : slugStatus ? (
                  <span
                    className={cn(
                      "font-semibold",
                      slugStatus.available
                        ? "text-emerald-600"
                        : "text-rose-600"
                    )}
                  >
                    {slugStatus.message}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Esse será o endereço exclusivo para colocar na bio do seu
                    Instagram.
                  </span>
                )}
              </div>
            </div>

            {/* Descrição curta / Bio da loja */}
            <div className="flex flex-col gap-1.5 w-full">
              <label
                htmlFor="store-bio"
                className="text-xs font-semibold text-slate-700 tracking-tight px-1"
              >
                Descrição curta / Bio da loja{" "}
                <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <textarea
                id="store-bio"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Moda feminina e masculina no Centro de Bom Jesus da Lapa. Enviamos motoboy para toda a cidade!"
                className="w-full bg-slate-100/80 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 border border-transparent outline-none transition-all focus:border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
              >
                Continuar para Localização
              </Button>
            </div>
          </div>
        )}

        {/* =========================================================
            PASSO 2: LOCALIZAÇÃO EM LAPA & WHATSAPP DE VENDAS
           ========================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Localização em Lapa & WhatsApp de Vendas
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Os pedidos feitos na vitrine e na sacola chegarão prontos nesse
                WhatsApp.
              </p>
            </div>

            {/* WhatsApp com máscara (77) 99999-9999 */}
            <Input
              label="WhatsApp de Atendimento e Vendas"
              type="tel"
              placeholder="(77) 99999-9999"
              value={whatsappMask}
              onChange={(e) =>
                setWhatsappMask(formatWhatsAppMask(e.target.value))
              }
              helperText={`Será salvo no banco com DDI 55: ${
                normalizeWhatsAppToDb(whatsappMask) || "5577999999999"
              }`}
              required
              leftIcon={<Phone className="w-4 h-4" aria-hidden="true" />}
            />

            {/* Bairro da Loja em Lapa */}
            <Select
              label="Bairro da Loja em Bom Jesus da Lapa"
              value={neighborhoodId}
              onChange={(e) => setNeighborhoodId(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4" aria-hidden="true" />}
              options={neighborhoods.map((nb) => ({
                value: nb.id,
                label: nb.name,
              }))}
            />

            {/* Endereço em Texto / Ponto de Referência */}
            <Input
              label="Endereço em Texto / Ponto de Referência"
              placeholder="Ex: Av. Manoel Novaes, 120 - Ao lado da Caixa"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              helperText="Ajuda o cliente de Lapa a localizar sua loja física para retirada ou prova."
              required
              leftIcon={<MapPin className="w-4 h-4" aria-hidden="true" />}
            />

            <div className="pt-2 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handlePrevStep}
                leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
              >
                Voltar
              </Button>

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
              >
                Continuar para Pagamentos
              </Button>
            </div>
          </div>
        )}

        {/* =========================================================
            PASSO 3: PAGAMENTOS, ENTREGA E HORÁRIO PADRÃO
           ========================================================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Pagamentos, Entrega e Horário Padrão
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Tudo já vem pré-configurado para o comércio de Bom Jesus da Lapa
                — ajuste apenas o que preferir.
              </p>
            </div>

            {/* 1. Formas de Pagamento Aceitas (Checkboxes em formato pílula) */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 tracking-tight px-1 block">
                Formas de Pagamento Aceitas
              </label>
              <div
                role="group"
                aria-label="Formas de pagamento aceitas"
                className="flex flex-wrap gap-2"
              >
                {PAYMENT_OPTIONS.map((option) => {
                  const isSelected = paymentMethods.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => togglePaymentMethod(option.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all cursor-pointer touch-manipulation border",
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                          : "bg-slate-100/80 text-slate-700 border-transparent hover:bg-slate-200/70"
                      )}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check
                          className="w-3.5 h-3.5 text-emerald-400"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Informação de Parcelamento (Opcional) */}
            <Input
              label="Informação de Parcelamento (Opcional)"
              placeholder="Ex: Até 3x sem juros no cartão"
              value={installmentInfo}
              onChange={(e) => setInstallmentInfo(e.target.value)}
              leftIcon={<CreditCard className="w-4 h-4" aria-hidden="true" />}
            />

            {/* 3. Modalidades de Entrega + Seletor de Taxa */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 tracking-tight px-1 block">
                Modalidades de Entrega
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={hasDelivery}
                  onClick={() => setHasDelivery((v) => !v)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer",
                    hasDelivery
                      ? "bg-emerald-50/70 border-emerald-300 text-slate-900"
                      : "bg-slate-100/60 border-transparent text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center",
                        hasDelivery
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-500"
                      )}
                    >
                      <Truck className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="block text-xs sm:text-sm font-bold">
                        Entrega (Delivery)
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Motoboy / Entrega em Lapa
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center border",
                      hasDelivery
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {hasDelivery && <Check className="w-3 h-3" />}
                  </div>
                </button>

                <button
                  type="button"
                  role="checkbox"
                  aria-checked={hasPickup}
                  onClick={() => setHasPickup((v) => !v)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer",
                    hasPickup
                      ? "bg-emerald-50/70 border-emerald-300 text-slate-900"
                      : "bg-slate-100/60 border-transparent text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center",
                        hasPickup
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-500"
                      )}
                    >
                      <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="block text-xs sm:text-sm font-bold">
                        Retirada na Loja
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Cliente retira no balcão
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center border",
                      hasPickup
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {hasPickup && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>

              {/* Seletor de Taxa de Entrega */}
              {hasDelivery && (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
                  <span className="block text-xs font-bold text-slate-700">
                    Taxa de Entrega em Bom Jesus da Lapa
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
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {feeOpt.label}
                      </button>
                    ))}
                  </div>

                  {deliveryFeeType === "fixed" && (
                    <div className="pt-1 max-w-xs">
                      <Input
                        label="Valor da Taxa Fixa (R$)"
                        placeholder="Ex: 5,00"
                        value={fixedDeliveryFee}
                        onChange={(e) => setFixedDeliveryFee(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Horário Comercial Padrão de Bom Jesus da Lapa */}
            <div className="rounded-2xl bg-slate-50 p-4 sm:p-5 border border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock
                    className="w-4 h-4 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Horário Comercial Padrão (Lapa)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDetailedHours((v) => !v)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 cursor-pointer"
                >
                  {showDetailedHours
                    ? "Ocultar ajuste detalhado"
                    : "Ajustar horários"}
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Pré-configurado:{" "}
                <strong>Seg a Sex das 08:00 às 18:00</strong> (almoço{" "}
                <strong>12:00 às 14:00</strong>),{" "}
                <strong>Sábado das 08:00 às 13:00</strong> e{" "}
                <strong>Domingo Fechado</strong>.
              </p>

              {showDetailedHours && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/70">
                  {ORDERED_DAYS.map((dayIdx) => {
                    const sched = businessHours[dayIdx];
                    return (
                      <div
                        key={dayIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-white p-3 border border-slate-100"
                      >
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 min-w-32 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!sched.isClosed}
                            onChange={(e) =>
                              updateDaySchedule(dayIdx, {
                                isClosed: !e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                          <span>{sched.dayLabel}</span>
                        </label>

                        {sched.isClosed ? (
                          <span className="text-xs font-semibold text-slate-400">
                            Fechado
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <input
                              type="time"
                              aria-label={`Abertura ${sched.dayLabel}`}
                              value={sched.openTime || "08:00"}
                              onChange={(e) =>
                                updateDaySchedule(dayIdx, {
                                  openTime: e.target.value,
                                })
                              }
                              className="rounded-xl bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-800"
                            />
                            <span className="text-slate-400">às</span>
                            <input
                              type="time"
                              aria-label={`Fechamento ${sched.dayLabel}`}
                              value={sched.closeTime || "18:00"}
                              onChange={(e) =>
                                updateDaySchedule(dayIdx, {
                                  closeTime: e.target.value,
                                })
                              }
                              className="rounded-xl bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-800"
                            />

                            {sched.lunchStart !== null && (
                              <span className="text-[11px] text-slate-500 ml-1">
                                (Almoço {sched.lunchStart}–{sched.lunchEnd})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botões Finais */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handlePrevStep}
                leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
              >
                Voltar
              </Button>

              <Button
                type="submit"
                variant="whatsapp"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                className="w-full sm:w-auto"
              >
                Colocar minha loja no ar agora
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
