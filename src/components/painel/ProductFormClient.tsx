"use client";

import { trackEvent } from "@/lib/analytics";
import React, { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, fieldBaseClasses, fieldLabelClasses } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { PillGroup, Switch } from "@/components/ui/Switch";
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
  const formRef = useRef<HTMLFormElement>(null);
  const draftRef = useRef(false);

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
        is_active: draftRef.current ? false : isActive,
      });

      if (result.error) {
        setFeedback({ type: "error", text: result.error });
      } else {
        trackEvent(initialProduct?.id ? "product_updated" : "product_created", {
          item_id: result.id || initialProduct?.id,
        });
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

  const previewPrice =
    discountPercent != null && parsedPromo != null ? parsedPromo : parsedPrice;
  const eyebrow =
    "text-xs font-semibold uppercase tracking-[0.1em] text-slate-500";

  const extraSlot = (slotIdx: number) => {
    const extraUrl = galleryUrls[slotIdx];
    return extraUrl ? (
      <div
        key={slotIdx}
        className="relative aspect-square rounded-[18px] bg-slate-100 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={extraUrl} alt={`Foto extra ${slotIdx + 1}`} className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => removeGalleryImage(slotIdx)}
          aria-label={`Remover foto extra ${slotIdx + 1}`}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-[10px] bg-white grid place-items-center text-slate-900 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    ) : (
      <button
        key={slotIdx}
        type="button"
        onClick={() => galleryFileInputRef.current?.click()}
        aria-label={`Adicionar foto extra ${slotIdx + 1}`}
        className="aspect-square rounded-[18px] bg-slate-50 ring-line grid place-items-center text-[22px] text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors duration-150"
      >
        +
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {showOnboardingSuccess && (
        <Notice tone="success" title="Sua loja está no ar!">
          Cadastre o primeiro produto para aparecer no feed da Lapa.
        </Notice>
      )}

      <div className="flex flex-col gap-1">
        <Link
          href="/painel/produtos"
          className="self-start text-[13px] text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← Produtos
        </Link>
        <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">
          {isEditing ? "Editar produto" : "Novo produto"}
        </h1>
      </div>

      {feedback && <Notice tone={feedback.type}>{feedback.text}</Notice>}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start"
      >
        <div className="flex flex-col gap-3.5 min-w-0">
          {/* Fotos */}
          <section className="p-4.5 rounded-3xl bg-white flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <h2 className="text-base font-extrabold text-slate-900">Fotos</h2>
              {isUploadingImage && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando…
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr] gap-2.5">
              <div className="col-span-2 sm:col-span-1 relative aspect-square rounded-[18px] bg-slate-100 shadow-[0_0_0_3px_#fff,0_0_16px_2px_rgba(56,189,248,0.45),0_0_26px_6px_rgba(244,114,182,0.28)] overflow-hidden grid place-items-center">
                {mainImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mainImageUrl} alt="Foto principal" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMainImageUrl("")}
                      aria-label="Remover foto principal"
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-[10px] bg-white grid place-items-center text-slate-900 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => mainFileInputRef.current?.click()}
                    className="w-full h-full grid place-items-center text-[13px] font-semibold text-slate-900 cursor-pointer"
                  >
                    Foto principal *
                  </button>
                )}
              </div>
              {[0, 1, 2].map(extraSlot)}
            </div>
            <input ref={mainFileInputRef} type="file" accept="image/*" onChange={handleMainImageSelect} className="hidden" />
            <input ref={galleryFileInputRef} type="file" accept="image/*" multiple onChange={handleGalleryImageSelect} className="hidden" />
            <Input
              inputSize="md"
              label="Ou cole o link da foto principal"
              placeholder="https://..."
              value={mainImageUrl}
              onChange={(e) => setMainImageUrl(e.target.value)}
            />
          </section>

          {/* Dados */}
          <section className="p-4.5 rounded-3xl bg-white grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                inputSize="md"
                label="Título"
                placeholder="Vestido Midi Floral"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <Select
              inputSize="md"
              label="Categoria"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              options={mainCategories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              inputSize="md"
              label="Subcategoria"
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              options={[
                { value: "", label: "Opcional" },
                ...subcategoriesForSelected.map((sub) => ({ value: sub.id, label: sub.name })),
              ]}
            />

            {/* Filtros condicionais (filter_config) */}
            <div className="sm:col-span-2 p-3.5 rounded-[18px] bg-[linear-gradient(135deg,#FFF7ED,#FDF2F8_50%,#E0F2FE)] shadow-[inset_0_0_0_1px_#F1F5F9] flex flex-col gap-3.5">
              {filterConfig.has_gender && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-brand-ink">Gênero · filtro da categoria</span>
                  <PillGroup
                    ariaLabel="Gênero"
                    surface="ring"
                    value={gender}
                    onToggle={(g) => setGender(g)}
                    options={GENDER_OPTIONS.map((g) => ({ value: g, label: g }))}
                  />
                </div>
              )}
              {filterConfig.has_size && sizeOptions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-brand-ink">Tamanhos disponíveis</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sizeOptions.map((sz) => {
                      const on = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleSizeOption(sz)}
                          className={cn(
                            "min-w-9.5 h-8.5 px-2.5 rounded-[11px] grid place-items-center font-display text-[13px] font-bold cursor-pointer transition-colors duration-150",
                            on ? "bg-brand text-white" : "bg-white text-slate-900 ring-line hover:bg-slate-50"
                          )}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {filterConfig.has_voltage && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-brand-ink">Voltagem</span>
                  <PillGroup
                    ariaLabel="Voltagem"
                    surface="ring"
                    value={voltage}
                    onToggle={(v) => setVoltage(v)}
                    options={VOLTAGE_OPTIONS.map((v) => ({ value: v, label: v }))}
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-brand-ink">Condição</span>
                <PillGroup
                  ariaLabel="Condição do produto"
                  surface="ring"
                  value={condition}
                  onToggle={(c) => setCondition(c)}
                  options={[
                    { value: "new", label: "Novo" },
                    { value: "used", label: "Seminovo" },
                    { value: "refurbished", label: "Recondicionado" },
                  ]}
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="product-desc" className={fieldLabelClasses}>
                Descrição <span className="font-medium text-slate-500">· tecido, medidas, garantia</span>
              </label>
              <div className="relative lapa-aurora-glow rounded-[15px]">
                <textarea
                  id="product-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes da peça para ajudar o cliente a decidir rápido"
                  className={cn(fieldBaseClasses, "rounded-[15px] px-3.5 py-3 text-sm resize-none")}
                />
              </div>
            </div>

            <Input
              inputSize="md"
              label="Preço"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              placeholder="89,90"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <Input
                inputSize="md"
                label="Preço promocional · opcional"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="67,40"
                value={promoPriceStr}
                onChange={(e) => setPromoPriceStr(e.target.value)}
              />
              {discountPercent != null && (
                <Badge variant="discount" size="md" className="self-start">
                  −{discountPercent}% OFF
                </Badge>
              )}
            </div>
          </section>
        </div>

        {/* Coluna direita: prévia + ações */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-7">
          <span className={eyebrow}>Prévia no feed</span>
          <div className="moldura rounded-[32px] p-3">
          <div className="p-2 pb-3.5 rounded-3xl border border-media bg-white shadow-card flex flex-col gap-2.5">
            <div className="relative aspect-4/5 rounded-[18px] bg-media overflow-hidden grid place-items-center text-xs text-slate-500">
              {mainImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainImageUrl} alt="" className="w-full h-full object-cover object-top" />
              ) : (
                "foto principal"
              )}
              {discountPercent != null && (
                <Badge variant="discount" discountPercent={discountPercent} className="absolute top-2 left-2" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 px-1.5">
              <span className="font-display text-[15px] font-semibold leading-[1.25] tracking-[-0.01em] text-ink line-clamp-2 min-h-9.5">
                {title || "Título do produto"}
              </span>
              <span className="flex items-baseline gap-1.5 pt-1">
                <span className="font-display text-[19px] font-extrabold tracking-[-0.02em] text-ink">
                  {formatCurrencyBRL(previewPrice)}
                </span>
                {discountPercent != null && (
                  <span className="text-xs text-slate-500 line-through">{formatCurrencyBRL(parsedPrice)}</span>
                )}
              </span>
            </div>
          </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-3.5 rounded-[18px] bg-white">
            <span className="text-sm font-semibold text-slate-900">Visível na vitrine</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Produto visível na vitrine" />
          </div>

          <div className="aura-glow rounded-full">
            <Button
              type="submit"
              size="lg"
              fullWidth
              className="h-13"
              isLoading={isPending}
              onClick={() => (draftRef.current = false)}
            >
              {isEditing ? "Salvar alterações" : "Publicar produto"}
            </Button>
          </div>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={isPending}
            onClick={() => {
              draftRef.current = true;
              formRef.current?.requestSubmit();
            }}
          >
            Salvar rascunho
          </Button>
        </aside>
      </form>
    </div>
  );
}
