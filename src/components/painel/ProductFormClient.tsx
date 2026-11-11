"use client";

import React, { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Layers,
  Zap,
  Loader2,
  Check,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { upsertProductAction } from "@/app/actions/painel";
import {
  calculateDiscountPercentage,
  cn,
  formatCurrencyBRL,
} from "@/lib/utils";
import type {
  GlobalCategory,
  MerchantProduct,
  ProductCondition,
  ProductGender,
  ProductVoltage,
} from "@/types/marketplace";

export interface ProductFormClientProps {
  storeId: string;
  categories: GlobalCategory[];
  initialProduct?: MerchantProduct | null;
  showOnboardingSuccess?: boolean;
}

const GENDER_OPTIONS: ProductGender[] = [
  "Feminino",
  "Masculino",
  "Unissex",
  "Infantil",
];

const VOLTAGE_OPTIONS: ProductVoltage[] = ["220V", "110V", "Bivolt"];

export function ProductFormClient({
  storeId,
  categories,
  initialProduct = null,
  showOnboardingSuccess = false,
}: ProductFormClientProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct?.id);

  const mainCategories = React.useMemo(
    () =>
      categories
        .filter((c) => !c.parent_id && c.is_active)
        .sort((a, b) => a.order_index - b.order_index),
    [categories]
  );

  // Estado dos Campos
  const [title, setTitle] = useState(initialProduct?.title || "");
  const [description, setDescription] = useState(
    initialProduct?.description || ""
  );
  const [priceStr, setPriceStr] = useState(
    initialProduct?.price != null ? String(initialProduct.price) : ""
  );
  const [promoPriceStr, setPromoPriceStr] = useState(
    initialProduct?.promotional_price != null
      ? String(initialProduct.promotional_price)
      : ""
  );

  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id || mainCategories[0]?.id || "cat-moda"
  );
  const [subcategoryId, setSubcategoryId] = useState(
    initialProduct?.subcategory_id || ""
  );

  // Filtros Condicionais Dinâmicos (baseados em filter_config da Categoria Principal)
  const [gender, setGender] = useState<ProductGender | null>(
    initialProduct?.gender || "Feminino"
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialProduct?.sizes || []
  );
  const [voltage, setVoltage] = useState<ProductVoltage | null>(
    initialProduct?.voltage || "220V"
  );
  const [condition, setCondition] = useState<ProductCondition>(
    initialProduct?.condition || "new"
  );
  const [isActive, setIsActive] = useState<boolean>(
    initialProduct?.is_active ?? true
  );

  // Fotos: 1 Principal + até 3 Extras (`gallery_urls`)
  const [mainImageUrl, setMainImageUrl] = useState(
    initialProduct?.image_url || ""
  );
  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    (initialProduct?.gallery_urls || []).slice(0, 3)
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Categoria principal selecionada e seu `filter_config`
  const activeMainCategory = React.useMemo(
    () =>
      mainCategories.find((c) => c.id === categoryId) || mainCategories[0],
    [mainCategories, categoryId]
  );

  const subcategoriesForSelected = React.useMemo(
    () =>
      categories
        .filter((c) => c.parent_id === activeMainCategory?.id && c.is_active)
        .sort((a, b) => a.order_index - b.order_index),
    [categories, activeMainCategory]
  );

  const filterConfig = activeMainCategory?.filter_config || {};
  const sizeOptions = filterConfig.size_options || [];

  const handleCategoryChange = (nextCategoryId: string) => {
    setCategoryId(nextCategoryId);
    setSubcategoryId("");
    const nextCat = mainCategories.find((c) => c.id === nextCategoryId);
    // Limpa os tamanhos anteriores para não misturar numeração de calçado com P/M/G
    setSelectedSizes([]);
    if (!nextCat?.filter_config?.has_gender) {
      setGender(null);
    } else if (!gender) {
      setGender("Feminino");
    }
    if (!nextCat?.filter_config?.has_voltage) {
      setVoltage(null);
    } else if (!voltage) {
      setVoltage("220V");
    }
  };

  const toggleSizeOption = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Upload de Imagem para o bucket `lapa-imagens`
  const uploadToLapaBucket = async (file: File): Promise<string> => {
    const localUrl = URL.createObjectURL(file);
    if (!isSupabaseConfigured()) {
      return localUrl;
    }

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `products/${storeId}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.${ext}`;

      const { error } = await supabase.storage
        .from("lapa-imagens")
        .upload(filePath, file, { upsert: true });

      if (error) return localUrl;

      const { data } = supabase.storage
        .from("lapa-imagens")
        .getPublicUrl(filePath);

      return data?.publicUrl || localUrl;
    } catch {
      return localUrl;
    }
  };

  const handleMainImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const uploadedUrl = await uploadToLapaBucket(file);
    setMainImageUrl(uploadedUrl);
    setIsUploadingImage(false);
  };

  const handleGalleryImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 3 - galleryUrls.length);
    const filesToUpload = files.slice(0, remainingSlots);
    if (filesToUpload.length === 0) return;

    setIsUploadingImage(true);
    const uploadedList: string[] = [];
    for (const file of filesToUpload) {
      const url = await uploadToLapaBucket(file);
      uploadedList.push(url);
    }
    setGalleryUrls((prev) => [...prev, ...uploadedList].slice(0, 3));
    setIsUploadingImage(false);
  };

  const removeGalleryImage = (idx: number) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  // Cálculo em tempo real do Preview de Desconto (% OFF)
  const parsedPrice = Number(priceStr.replace(",", ".")) || 0;
  const parsedPromo = promoPriceStr.trim()
    ? Number(promoPriceStr.replace(",", ".")) || null
    : null;
  const discountPercent = calculateDiscountPercentage(parsedPrice, parsedPromo);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await upsertProductAction({
        id: initialProduct?.id,
        store_id: storeId,
        title,
        description,
        price: parsedPrice,
        promotional_price: parsedPromo,
        image_url: mainImageUrl,
        gallery_urls: galleryUrls.slice(0, 3),
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        gender: filterConfig.has_gender ? gender : null,
        sizes: filterConfig.has_size ? selectedSizes : [],
        voltage: filterConfig.has_voltage ? voltage : null,
        condition,
        is_active: isActive,
      });

      if (result.error) {
        setFeedback({ type: "error", text: result.error });
      } else {
        setFeedback({
          type: "success",
          text: result.message || "Produto salvo com sucesso!",
        });
        window.setTimeout(() => {
          router.push("/painel/produtos");
        }, 1100);
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Banner de Boas-vindas Pós-Onboarding */}
      {showOnboardingSuccess && (
        <div
          role="status"
          className="rounded-3xl bg-emerald-600 text-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Sua loja já está no ar!
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold">
              Parabéns! Agora cadastre o seu primeiro produto na vitrine
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50">
              Adicione fotos nítidas, escolha os tamanhos disponíveis e comece a
              receber pedidos no WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/painel/produtos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Voltar para Meus Produtos</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isEditing ? "Editar Produto" : "Novo Produto no Catálogo"}
          </h1>
        </div>
      </div>

      {/* Formulário Inteligente */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6"
      >
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

        {/* 1. Upload de Foto Principal + até 3 Fotos Extras (`gallery_urls`) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              1. Fotos do Produto (1 Principal + até 3 Extras)
            </label>
            {isUploadingImage && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enviando para lapa-imagens...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Foto Principal */}
            <div className="relative aspect-square rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex flex-col items-center justify-center p-2 text-center">
              {mainImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mainImageUrl}
                    alt="Foto principal"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/85 text-white px-2.5 py-0.5 text-[10px] font-bold">
                    Principal
                  </span>
                  <button
                    type="button"
                    onClick={() => setMainImageUrl("")}
                    aria-label="Remover foto principal"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => mainFileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-bold">Foto Principal *</span>
                  <span className="text-[10px] text-slate-400">
                    Toque para enviar
                  </span>
                </button>
              )}
              <input
                ref={mainFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleMainImageSelect}
                className="hidden"
              />
            </div>

            {/* Até 3 Fotos Extras (`gallery_urls`) */}
            {[0, 1, 2].map((slotIdx) => {
              const extraUrl = galleryUrls[slotIdx];
              return (
                <div
                  key={slotIdx}
                  className="relative aspect-square rounded-2xl bg-slate-50 border border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center p-2 text-center"
                >
                  {extraUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={extraUrl}
                        alt={`Foto extra ${slotIdx + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/75 text-white px-2 py-0.5 text-[10px] font-semibold">
                        Extra {slotIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(slotIdx)}
                        aria-label={`Remover foto extra ${slotIdx + 1}`}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => galleryFileInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[11px] font-semibold">
                        Foto Extra {slotIdx + 1}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
            <input
              ref={galleryFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryImageSelect}
              className="hidden"
            />
          </div>

          <Input
            label="Ou informe a URL da Foto Principal"
            placeholder="https://images.unsplash.com/..."
            value={mainImageUrl}
            onChange={(e) => setMainImageUrl(e.target.value)}
          />
        </section>

        {/* 2. Informações Principais */}
        <section className="space-y-4 pt-2 border-t border-slate-100">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
            2. Dados do Produto
          </label>

          <Input
            label="Título do Produto *"
            placeholder="Ex: Conjunto Alfaiataria Linho Off-White"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            leftIcon={<Tag className="w-4 h-4" />}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="product-desc"
              className="text-xs font-semibold text-slate-700 px-1"
            >
              Descrição detalhada (tecido, medidas, garantia, etc.)
            </label>
            <textarea
              id="product-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes da peça para ajudar o cliente a decidir rápido..."
              className="w-full bg-slate-100/80 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 border border-transparent outline-none transition-all focus:border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 resize-none"
            />
          </div>
        </section>

        {/* 3. Categoria Principal, Subcategoria e RENDERIZAÇÃO CONDICIONAL DE FILTROS */}
        <section className="space-y-5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              3. Categoria & Filtros Inteligentes
            </label>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Filtros adaptados automaticamente
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoria Principal *"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              leftIcon={<Layers className="w-4 h-4" />}
              options={mainCategories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />

            <Select
              label="Subcategoria"
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              options={[
                { value: "", label: "Selecione uma subcategoria (opcional)" },
                ...subcategoriesForSelected.map((sub) => ({
                  value: sub.id,
                  label: sub.name,
                })),
              ]}
            />
          </div>

          {/* Box de Filtros Condicionais Lidos de `filter_config` */}
          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 space-y-5">
            {/* CONDICIONAL A: Se `has_gender === true` */}
            {filterConfig.has_gender && (
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-800">
                  Gênero / Público ({activeMainCategory?.name})
                </span>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((gOpt) => {
                    const active = gender === gOpt;
                    return (
                      <button
                        key={gOpt}
                        type="button"
                        onClick={() => setGender(gOpt)}
                        className={cn(
                          "rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                          active
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {gOpt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CONDICIONAL B: Se `has_size === true` */}
            {filterConfig.has_size && sizeOptions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Grade de Tamanhos Disponíveis ({activeMainCategory?.name})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Toque nas pílulas para marcar os tamanhos em estoque
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((sz) => {
                    const isSelected = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSizeOption(sz)}
                        aria-pressed={isSelected}
                        className={cn(
                          "min-w-11 h-10 px-3.5 rounded-full text-xs font-extrabold transition-all cursor-pointer inline-flex items-center justify-center gap-1 border",
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        <span>{sz}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CONDICIONAL C: Se `has_voltage === true` */}
            {filterConfig.has_voltage && (
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Voltagem / Tensão Elétrica ({activeMainCategory?.name})
                </span>
                <div className="flex flex-wrap gap-2">
                  {VOLTAGE_OPTIONS.map((vOpt) => {
                    const active = voltage === vOpt;
                    return (
                      <button
                        key={vOpt}
                        type="button"
                        onClick={() => setVoltage(vOpt)}
                        className={cn(
                          "rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                          active
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {vOpt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Condição do produto */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <span className="block text-xs font-bold text-slate-800">
                Condição do Produto
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "new", label: "Novo" },
                    { id: "used", label: "Seminovo / Usado" },
                    { id: "refurbished", label: "Recondicionado" },
                  ] as const
                ).map((cOpt) => (
                  <button
                    key={cOpt.id}
                    type="button"
                    onClick={() => setCondition(cOpt.id)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                      condition === cOpt.id
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {cOpt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Preço Normal, Preço Promocional & Preview de % OFF */}
        <section className="space-y-4 pt-2 border-t border-slate-100">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
            4. Preço & Oferta
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Preço Normal (R$) *"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ex: 199.90"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              required
            />

            <Input
              label="Preço Promocional (R$) — Opcional"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 159.90"
              value={promoPriceStr}
              onChange={(e) => setPromoPriceStr(e.target.value)}
              helperText="Preencha para ativar o selo vermelho de oferta."
            />
          </div>

          {/* Preview em tempo real do Badge de % OFF */}
          {parsedPrice > 0 && (
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Preview de Preço no Card da Vitrine
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-extrabold text-slate-900">
                    {formatCurrencyBRL(
                      discountPercent != null && parsedPromo != null
                        ? parsedPromo
                        : parsedPrice
                    )}
                  </span>
                  {discountPercent != null && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatCurrencyBRL(parsedPrice)}
                    </span>
                  )}
                </div>
              </div>

              {discountPercent != null ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Badge exibido na foto:
                  </span>
                  <Badge
                    variant="discount"
                    size="md"
                    discountPercent={discountPercent}
                  />
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  Sem desconto ativo (preço cheio)
                </span>
              )}
            </div>
          )}
        </section>

        {/* Status Ativo + Botão Salvar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              Produto ativo e visível imediatamente na vitrine
            </span>
          </label>

          <div className="flex items-center gap-2.5">
            <Link href="/painel/produtos">
              <Button type="button" variant="secondary" size="lg">
                Cancelar
              </Button>
            </Link>

            <Button
              type="submit"
              variant="whatsapp"
              size="lg"
              isLoading={isPending}
            >
              {isEditing ? "Salvar Alterações" : "Publicar Produto"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

