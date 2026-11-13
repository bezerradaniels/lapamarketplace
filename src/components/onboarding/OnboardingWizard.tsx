"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Input,
  fieldBaseClasses,
  fieldLabelClasses,
} from "@/components/ui/Input";
import { PillGroup, Segmented, Switch } from "@/components/ui/Switch";
import { Notice } from "@/components/ui/Notice";
import { LapaSymbol, LapaWordmark } from "@/components/brand/LapaSymbol";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  checkSlugAvailability,
  createStoreAction,
  setAccountRoleAction,
  type SlugCheckResult,
} from "@/app/actions/onboarding";
import {
  cn,
  formatWhatsAppMask,
  normalizeWhatsAppToDb,
  sanitizeStoreSlug,
} from "@/lib/utils";
import type {
  AccountType,
  DaySchedule,
  DeliveryFeeType,
  NeighborhoodItem,
  PaymentMethod,
} from "@/types/marketplace";

export interface OnboardingWizardProps {
  neighborhoods: NeighborhoodItem[];
  initialStoreName?: string;
  initialWhatsapp?: string;
  initialStep?: 0 | 1 | 2 | 3;
  nextPath?: string;
}

const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string }> = [
  { id: "pix", label: "Pix" },
  { id: "credit_card", label: "Cartão de crédito" },
  { id: "debit_card", label: "Cartão de débito" },
  { id: "cash", label: "Dinheiro" },
  { id: "payment_link", label: "Link de pagamento" },
  { id: "crediario", label: "Crediário da loja" },
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

function summarizeDay(sched: DaySchedule): string {
  if (sched.isClosed) return "Fechado";
  if (sched.lunchStart && sched.lunchEnd) {
    return `${sched.openTime}–${sched.lunchStart} · ${sched.lunchEnd}–${sched.closeTime}`;
  }
  return `${sched.openTime}–${sched.closeTime}`;
}


export function OnboardingWizard({
  neighborhoods,
  initialStoreName = "",
  initialWhatsapp = "",
  initialStep = 0,
  nextPath,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(initialStep);
  const [selectedAccountType, setSelectedAccountType] =
    useState<"customer" | "merchant">("customer");
  const [isSavingRole, startSavingRole] = useTransition();
  const [formError, setFormError] = useState<string>("");

  const accountOptions: Array<{
    value: "customer" | "merchant";
    title: string;
    sub: string;
  }> = [
    {
      value: "customer",
      title: "Quero comprar em Lapa",
      sub: "Favoritar, seguir lojas e pedir rápido",
    },
    {
      value: "merchant",
      title: "Sou lojista, quero vender",
      sub: "Catálogo grátis com pedidos no WhatsApp",
    },
  ];

  const handleAccountTypeSubmit = () => {
    setFormError("");
    startSavingRole(async () => {
      const result = await setAccountRoleAction(selectedAccountType, nextPath);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      if (selectedAccountType === "customer") {
        router.push(result.redirect || nextPath || "/minha-conta");
      } else {
        setStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

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
    if (step === 1) setStep(0);
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

  // Bairros: mostra os primeiros em pílulas e o restante sob "+N bairros"
  const [showAllNeighborhoods, setShowAllNeighborhoods] = useState(false);
  const NEIGHBORHOOD_PREVIEW_COUNT = 6;
  const selectedNeighborhoodIndex = neighborhoods.findIndex(
    (nb) => nb.id === neighborhoodId
  );
  const visibleNeighborhoods = neighborhoods.filter(
    (_, idx) =>
      idx < NEIGHBORHOOD_PREVIEW_COUNT || idx === selectedNeighborhoodIndex
  );
  const hiddenNeighborhoodsCount =
    neighborhoods.length - visibleNeighborhoods.length;

  // Resumo do horário: agrupa Seg–Sex quando todos os dias úteis são iguais
  const weekdaySummaries = [1, 2, 3, 4, 5].map((d) =>
    summarizeDay(businessHours[d])
  );
  const weekdaysAreEqual = weekdaySummaries.every(
    (text) => text === weekdaySummaries[0]
  );
  const hoursSummaryRows = [
    ...(weekdaysAreEqual
      ? [
          {
            label: "Seg a Sex",
            hours: weekdaySummaries[0],
            closed: businessHours[1].isClosed,
          },
        ]
      : [1, 2, 3, 4, 5].map((d) => ({
          label: businessHours[d].dayLabel,
          hours: summarizeDay(businessHours[d]),
          closed: businessHours[d].isClosed,
        }))),
    {
      label: "Sábado",
      hours: summarizeDay(businessHours[6]),
      closed: businessHours[6].isClosed,
    },
    {
      label: "Domingo",
      hours: summarizeDay(businessHours[0]),
      closed: businessHours[0].isClosed,
    },
  ];

  const slugIsValid = Boolean(slugStatus?.available) && !isCheckingSlug;
  const slugHasError =
    Boolean(slugStatus) && !slugStatus!.available && !isCheckingSlug;

  const stepTitles: Record<1 | 2 | 3, { title: string; sub?: string }> = {
    1: {
      title: "Identidade da loja",
      sub: "Como seus clientes vão encontrar você.",
    },
    2: {
      title: "Onde fica e como falar com você",
      sub: "Os pedidos chegam direto no seu WhatsApp.",
    },
    3: { title: "Como você vende" },
  };

  const timeInputClasses =
    "h-9 rounded-[10px] bg-slate-100 px-2 text-[13px] text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-light";

  if (step === 0) {
    return (
      <div className="flex-1 md:flex-none md:my-auto flex flex-col gap-5.5">
        <Link
          href="/"
          aria-label="Lapa Marketplace — voltar para o início"
          className="self-center"
        >
          <LapaWordmark
            variant="full"
            symbolVariant="solid"
            symbolSize={34}
            textClassName="text-[22px]"
          />
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05] text-slate-900 text-balance">
            Como você quer usar a Lapa?
          </h1>
          <p className="text-sm text-slate-500">
            Escolha como você quer começar. Você pode mudar isso a qualquer momento.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Tipo de conta"
          className="grid grid-cols-2 gap-2.5"
        >
          {accountOptions.map((opt) => {
            const selected = selectedAccountType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedAccountType(opt.value)}
                className={cn(
                  "p-3.5 rounded-[22px] flex flex-col gap-2.5 text-left cursor-pointer transition-[background-color,box-shadow] duration-150 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 border border-[#f8fafc]",
                  selected
                    ? "bg-white shadow-[0_10px_24px_-12px_rgba(244,114,182,0.6)]"
                    : "bg-white"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-5.5 h-5.5 rounded-full bg-white transition-shadow duration-150",
                    selected
                      ? "shadow-[inset_0_0_0_6px_#0F172A]"
                      : "shadow-[inset_0_0_0_1.5px_#CBD5E1]"
                  )}
                />
                <span className="font-display text-[15px] font-bold leading-[1.2] text-slate-900">
                  {opt.title}
                </span>
                <span className="text-xs text-slate-500 leading-[1.35]">
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>

        {formError && <Notice tone="error">{formError}</Notice>}

        <div className="flex-1 md:hidden" />

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSavingRole}
          onClick={handleAccountTypeSubmit}
        >
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleFinishSubmit}
      className="flex-1 flex flex-col gap-5.5 pb-28 md:pb-0"
    >
      {/* Progresso: 3 segmentos */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold text-slate-900">
            Passo {step} de 3
          </span>
          <button
            type="button"
            onClick={handlePrevStep}
            className="text-slate-500 underline hover:text-slate-900 cursor-pointer"
          >
            Voltar
          </button>
        </div>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step}
          aria-label="Progresso do cadastro da loja"
          className="grid grid-cols-3 gap-1.5"
        >
          {[1, 2, 3].map((segment) => (
            <span
              key={segment}
              className={cn(
                "h-1.5 rounded-full transition-colors duration-200",
                segment <= step ? "bg-brand" : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.05] text-slate-900 text-balance">
          {stepTitles[step].title}
        </h1>
        {stepTitles[step].sub && (
          <p className="text-sm text-slate-500">{stepTitles[step].sub}</p>
        )}
      </div>

      {formError && <Notice tone="error">{formError}</Notice>}

      {/* ============ PASSO 1: IDENTIDADE ============ */}
      {step === 1 && (
        <>
          <div className="flex items-center gap-3.5">
            <span className="relative w-19 h-19 rounded-full bg-slate-100 shadow-[inset_0_0_0_2px_#FFFFFF,0_0_0_2px_#0F172A] overflow-hidden grid place-items-center shrink-0">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Prévia da logo da loja"
                  className="w-full h-full object-cover"
                />
              ) : (
                <LapaSymbol size={32} variant="mono" className="opacity-30" />
              )}
              {isUploadingLogo && (
                <span className="absolute inset-0 bg-slate-900/50 grid place-items-center text-white">
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                </span>
              )}
            </span>
            <div className="flex flex-col gap-1.5 items-start">
              <label className="px-3.5 py-2.25 rounded-xl bg-white ring-line font-display text-[13px] font-bold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors duration-150 focus-within:ring-2 focus-within:ring-slate-900">
                {logoPreview ? "Trocar logo" : "Enviar logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoFileChange}
                  className="sr-only"
                />
              </label>
              <span className="text-xs text-slate-500">
                Opcional · PNG ou JPG
              </span>
              {logoUploadError && (
                <span role="alert" className="text-xs font-medium text-rose-600">
                  {logoUploadError}
                </span>
              )}
            </div>
          </div>

          <Input
            label="Nome da loja"
            placeholder="Você Fashion Lapa"
            value={storeName}
            onChange={handleStoreNameChange}
            autoComplete="organization"
            required
          />

          {/* Slug com prefixo e validação (debounce de 500ms) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="store-slug" className={fieldLabelClasses}>
              Link do seu catálogo
            </label>
            <div
              className={cn(
                "h-13 rounded-full flex items-center px-5.5 text-[15px] lapa-aurora-glow transition-colors duration-150",
                slugIsValid
                  ? "bg-white border border-whatsapp"
                  : slugHasError
                  ? "bg-white border border-offer"
                  : "bg-white border border-[#f8fafc] focus-within:border-[#f8fafc]"
              )}
            >
              <span className="text-slate-500 shrink-0">
                lapamarketplace.com.br/
              </span>
              <input
                id="store-slug"
                value={slug}
                onChange={handleSlugChange}
                placeholder="sualoja"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={slugHasError}
                aria-describedby="store-slug-status"
                className="flex-1 min-w-0 bg-transparent outline-none font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
              />
              {isCheckingSlug && (
                <Loader2
                  className="w-4 h-4 animate-spin text-slate-500 shrink-0"
                  aria-hidden="true"
                />
              )}
            </div>
            <span
              id="store-slug-status"
              aria-live="polite"
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold min-h-4",
                slugIsValid
                  ? "text-whatsapp"
                  : slugHasError
                  ? "text-rose-600"
                  : "text-slate-500 font-normal"
              )}
            >
              {isCheckingSlug ? (
                "Verificando disponibilidade…"
              ) : slugStatus ? (
                <>
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      slugStatus.available ? "bg-whatsapp" : "bg-offer"
                    )}
                  />
                  {slugStatus.available
                    ? "Link disponível!"
                    : slugStatus.reason === "taken"
                    ? "Este endereço já está em uso"
                    : slugStatus.message}
                </>
              ) : (
                "Só letras minúsculas, números e hífen."
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="store-bio" className={fieldLabelClasses}>
              Bio da loja
            </label>
            <div className="relative lapa-aurora-glow rounded-2xl">
              <textarea
                id="store-bio"
                rows={3}
                maxLength={240}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Moda feminina com peças leves para o dia a dia. Entregamos em toda a Lapa."
                className={cn(
                  fieldBaseClasses,
                  "min-h-22 rounded-2xl px-4 py-3.5 text-sm leading-[1.45] resize-none"
                )}
              />
            </div>
          </div>
        </>
      )}

      {/* ============ PASSO 2: LOCALIZAÇÃO E WHATSAPP ============ */}
      {step === 2 && (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="store-whatsapp" className={fieldLabelClasses}>
              WhatsApp de atendimento
            </label>
            <div className="h-13 rounded-full bg-white border border-[#f8fafc] flex items-center gap-2.5 px-5.5 text-[15px] lapa-aurora-glow transition-colors duration-150 focus-within:border-[#f8fafc]">
              <span className="px-2 py-1 rounded-lg bg-white text-[13px] font-semibold text-slate-900 shrink-0">
                +55
              </span>
              <input
                id="store-whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(77) 99999-9999"
                value={whatsappMask}
                onChange={(e) =>
                  setWhatsappMask(formatWhatsAppMask(e.target.value))
                }
                className="flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className={fieldLabelClasses}>Bairro da loja</span>
            <PillGroup
              ariaLabel="Bairro da loja"
              tone="brand"
              value={neighborhoodId || null}
              onToggle={(id) => setNeighborhoodId(id)}
              options={(showAllNeighborhoods
                ? neighborhoods
                : visibleNeighborhoods
              ).map((nb) => ({ value: nb.id, label: nb.name }))}
            />
            {!showAllNeighborhoods && hiddenNeighborhoodsCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllNeighborhoods(true)}
                className="self-start px-3.5 py-2.25 rounded-full ring-line text-[13px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors duration-150"
              >
                +{hiddenNeighborhoodsCount} bairros
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="store-address" className={fieldLabelClasses}>
              Endereço ou ponto de referência
            </label>
            <div className="relative lapa-aurora-glow rounded-2xl">
              <textarea
                id="store-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
                placeholder="Av. Manoel Novais, 120 — ao lado da Caixa"
                className={cn(
                  fieldBaseClasses,
                  "min-h-13 rounded-2xl px-4 py-3.75 text-[15px] leading-[1.4] resize-none"
                )}
              />
            </div>
          </div>
        </>
      )}

      {/* ============ PASSO 3: PAGAMENTO, ENTREGA E HORÁRIO ============ */}
      {step === 3 && (
        <>
          <div className="flex flex-col gap-2.5">
            <span className={fieldLabelClasses}>Formas de pagamento</span>
            <PillGroup
              ariaLabel="Formas de pagamento"
              tone="brand"
              surface="ring"
              value={paymentMethods}
              onToggle={(id) => togglePaymentMethod(id)}
              options={PAYMENT_OPTIONS.map((opt) => ({
                value: opt.id,
                label: opt.label,
              }))}
            />
            <Input
              inputSize="md"
              aria-label="Condição de parcelamento"
              placeholder="Até 3x sem juros no cartão"
              value={installmentInfo}
              onChange={(e) => setInstallmentInfo(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <span className={fieldLabelClasses}>Entrega</span>
            <PillGroup
              ariaLabel="Modalidades de entrega"
              tone="brand"
              surface="ring"
              value={[
                ...(hasDelivery ? ["delivery" as const] : []),
                ...(hasPickup ? ["pickup" as const] : []),
              ]}
              onToggle={(id) =>
                id === "delivery"
                  ? setHasDelivery((v) => !v)
                  : setHasPickup((v) => !v)
              }
              options={[
                { value: "delivery", label: "Entrega (delivery)" },
                { value: "pickup", label: "Retirada na loja" },
              ]}
            />
            {hasDelivery && (
              <>
                <Segmented
                  ariaLabel="Taxa de entrega"
                  value={deliveryFeeType}
                  onChange={setDeliveryFeeType}
                  className="rounded-[15px] [&>button]:h-9.5 [&>button]:rounded-xl [&>button]:text-xs [&>button]:font-sans [&>button]:font-semibold"
                  options={[
                    { value: "free", label: "Frete grátis" },
                    { value: "fixed", label: "Taxa fixa" },
                    { value: "combine", label: "A combinar" },
                  ]}
                />
                {deliveryFeeType === "fixed" && (
                  <Input
                    inputSize="md"
                    label="Valor da taxa fixa (R$)"
                    inputMode="decimal"
                    placeholder="5,00"
                    value={fixedDeliveryFee}
                    onChange={(e) => setFixedDeliveryFee(e.target.value)}
                  />
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-baseline">
              <span className={fieldLabelClasses}>Horário comercial</span>
              <button
                type="button"
                onClick={() => setShowDetailedHours((v) => !v)}
                aria-expanded={showDetailedHours}
                className="text-xs text-slate-500 underline hover:text-slate-900 cursor-pointer"
              >
                {showDetailedHours ? "Ver resumo" : "padrão da Lapa · ajustar"}
              </button>
            </div>

            <div className="bg-white rounded-[20px] flex flex-col">
              {showDetailedHours
                ? ORDERED_DAYS.map((dayIdx, idx) => {
                    const sched = businessHours[dayIdx];
                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "flex flex-wrap justify-between items-center gap-2 px-4 py-2.5 text-sm",
                          idx > 0 && "border-t border-slate-100"
                        )}
                      >
                        <span className="flex items-center gap-2.5 font-semibold text-slate-900">
                          <Switch
                            size="sm"
                            checked={!sched.isClosed}
                            onCheckedChange={(open) =>
                              updateDaySchedule(dayIdx, { isClosed: !open })
                            }
                            aria-label={`${sched.dayLabel} aberta`}
                          />
                          {sched.dayLabel}
                        </span>
                        {sched.isClosed ? (
                          <span className="px-2.5 py-1.5 rounded-[10px] bg-slate-100 text-[13px] text-slate-500">
                            Fechado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <input
                              type="time"
                              aria-label={`Abertura ${sched.dayLabel}`}
                              value={sched.openTime || "08:00"}
                              onChange={(e) =>
                                updateDaySchedule(dayIdx, {
                                  openTime: e.target.value,
                                })
                              }
                              className={timeInputClasses}
                            />
                            –
                            <input
                              type="time"
                              aria-label={`Fechamento ${sched.dayLabel}`}
                              value={sched.closeTime || "18:00"}
                              onChange={(e) =>
                                updateDaySchedule(dayIdx, {
                                  closeTime: e.target.value,
                                })
                              }
                              className={timeInputClasses}
                            />
                          </span>
                        )}
                        {!sched.isClosed && sched.lunchStart && (
                          <span className="basis-full text-xs text-slate-500">
                            Almoço {sched.lunchStart}–{sched.lunchEnd}
                          </span>
                        )}
                      </div>
                    );
                  })
                : hoursSummaryRows.map((row, idx) => (
                    <div
                      key={row.label}
                      className={cn(
                        "flex justify-between items-center gap-3 px-4 py-3.25 text-sm",
                        idx > 0 && "border-t border-slate-100"
                      )}
                    >
                      <span className="font-semibold text-slate-900">
                        {row.label}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-1.5 rounded-[10px] bg-slate-100 text-[13px]",
                          row.closed ? "text-slate-500" : "text-slate-900"
                        )}
                      >
                        {row.hours}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </>
      )}

      {/* CTA fixo */}
      <div className="fixed md:static inset-x-0 bottom-0 z-30 px-6 md:px-0 pt-4 md:pt-2 pb-[max(1.75rem,env(safe-area-inset-bottom))] md:pb-0 bg-linear-to-b from-slate-50/0 to-slate-50 to-30% md:bg-none">
        <div className="mx-auto max-w-93 md:max-w-none">
          {step < 3 ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNextStep}
            >
              Continuar
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              Colocar minha loja no ar
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
