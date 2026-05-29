import { useState, useMemo, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ImageIcon,
  Package01Icon,
  ShoppingCart01Icon,
  MoneyBag02Icon,
  InformationCircleIcon,
  ToggleOnIcon,
  ToggleOffIcon,
  AlertCircleIcon,
  Home01Icon,
  ColorPickerIcon,
  RulerIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons'
import confetti from 'canvas-confetti'
import { ROUTES } from '@/config/routes'
import { productSchema, type ProductInput } from '../schemas'
import { marginPercent } from '../utils/price'
import { MAX_FEATURED_PRODUCTS, featuredSlots } from '../utils/featured'
import { formatMoney } from '@/lib/format'
import { MoneyInput } from '@/components/forms/MoneyInput'
import { ProductImagesUploader } from '@/components/forms/ProductImagesUploader'
import { ProductRichTextEditor } from './ProductRichTextEditor'
import { ProductVariationModal } from './ProductVariationModal'
import type { VariationType } from '@/types/domain'
import { cn } from '@/lib/utils'
import { useCategories, useCreateCategory } from '@/features/categories'
import { usePlanLimits } from '@/features/billing'
import { useProducts } from '../hooks/useProducts'

type Tab = 'info' | 'stock' | 'photos' | 'price'

const TABS: { id: Tab; label: string; shortLabel: string; icon: typeof Package01Icon }[] = [
  { id: 'info', label: 'Informações Gerais', shortLabel: 'Geral', icon: InformationCircleIcon },
  { id: 'stock', label: 'Estoque e variações', shortLabel: 'Estoque', icon: Package01Icon },
  { id: 'photos', label: 'Fotos', shortLabel: 'Fotos', icon: ImageIcon },
  { id: 'price', label: 'Preço', shortLabel: 'Preço', icon: MoneyBag02Icon },
]

const FIELD_TAB_MAP: Partial<Record<string, { label: string; tab: Tab }>> = {
  name: { label: 'Título do produto', tab: 'info' },
  price_in_cents: { label: 'Preço', tab: 'price' },
  promo_price_in_cents: { label: 'Preço promocional', tab: 'price' },
  images: { label: 'Fotos do produto', tab: 'photos' },
  description: { label: 'Descrição', tab: 'info' },
  brand: { label: 'Marca', tab: 'info' },
  barcode: { label: 'Código de barras', tab: 'info' },
  stock: { label: 'Estoque', tab: 'stock' },
}

const BARCODE_TYPES = [
  { value: '', label: 'Não possui código de barras' },
  { value: 'ean13', label: 'EAN-13' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'upc', label: 'UPC-A' },
  { value: 'qrcode', label: 'QR Code' },
  { value: 'other', label: 'Outro' },
]

const UNITS = [
  'Unidade', 'Par', 'Kit', 'Caixa', 'Pacote', 'Saco',
  'Kg', 'g', 'mg', 'L', 'mL', 'Metro', 'cm', 'mm',
]

const RECURRENCES = [
  { value: '', label: 'Nenhuma' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
]

const CONDITIONS = [
  { value: 'new', label: 'Novo' },
  { value: 'used', label: 'Usado' },
  { value: 'refurbished', label: 'Recondicionado' },
]

type Props = {
  storeId: string
  catalogUrl?: string
  initialValues?: Partial<ProductInput>
  isSubmitting?: boolean
  justPublished?: boolean
  onSubmit: (values: ProductInput) => Promise<void> | void
}

export function ProductForm({
  storeId,
  catalogUrl,
  initialValues,
  isSubmitting,
  justPublished,
  onSubmit,
}: Props) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [variationModalOpen, setVariationModalOpen] = useState(false)
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryModalOpen, setNewSubcategoryModalOpen] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [homeModalOpen, setHomeModalOpen] = useState(false)
  const [missingFieldsModalOpen, setMissingFieldsModalOpen] = useState(false)
  const newCategoryInputRef = useRef<HTMLInputElement>(null)
  const newSubcategoryInputRef = useRef<HTMLInputElement>(null)
  const submitModeRef = useRef<'publish' | 'draft'>('publish')

  const categoriesQuery = useCategories(storeId)
  const categories = categoriesQuery.data ?? []
  const topLevelCategories = categories.filter((c) => !c.parent_id)
  const planLimits = usePlanLimits(storeId)
  const allProductsQuery = useProducts(planLimits.canUse('featured') ? storeId : undefined)
  const createCategoryMutation = useCreateCategory()

  const defaults = useMemo(
    () => ({
      name: '',
      description: undefined,
      category: undefined,
      subcategory: undefined,
      brand: undefined,
      unit: 'Unidade',
      barcode: undefined,
      barcode_type: null,
      sku: undefined,
      auto_sku: true,
      condition: 'new' as const,
      purchase_recurrence: null,
      has_no_brand: false,
      cost_in_cents: null,
      price_in_cents: 0,
      promo_price_in_cents: null,
      installment_count: null,
      installment_total_in_cents: null,
      is_active: true,
      is_featured: false,
      stock: null,
      images: [] as string[],
      has_variations: false,
      variation_type: null,
      variation_label: null,
      variation_options: null,
      ...initialValues,
    }),
    [initialValues],
  )

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults as ProductInput,
  })

  const selectedCategory = form.watch('category')
  const selectedSubcategory = form.watch('subcategory')
  const selectedCategoryObj = categories.find((c) => c.name === selectedCategory)
  const availableSubcategories = categories.filter((c) => c.parent_id === selectedCategoryObj?.id)

  const handleCategoryChange = (value: string) => {
    form.setValue('category', value || undefined, { shouldDirty: true })
    form.setValue('subcategory', undefined, { shouldDirty: true })
  }

  const name = form.watch('name') ?? ''
  const images = form.watch('images') ?? []
  const priceCents = form.watch('price_in_cents') ?? 0
  const costCents = form.watch('cost_in_cents') ?? null
  const promoCents = form.watch('promo_price_in_cents') ?? null
  const installmentCount = form.watch('installment_count') ?? null
  const installmentTotal = form.watch('installment_total_in_cents') ?? null
  const hasVariations = form.watch('has_variations')
  const variationType = form.watch('variation_type')
  const variationLabel = form.watch('variation_label')
  const variationOptions = form.watch('variation_options')
  const autoSku = form.watch('auto_sku')
  const hasBarcodeType = !!form.watch('barcode_type')
  const hasNoBrand = form.watch('has_no_brand')
  const isEditing = !!initialValues
  const isDirty = form.formState.isDirty
  const isFeatured = form.watch('is_featured')

  // Featured-slot availability (max-4 limit), excluding this product itself.
  const allProducts = allProductsQuery?.data ?? []
  const {
    canEnable: canEnableFeatured,
    displayedCount: displayedFeaturedCount,
  } = featuredSlots({
    allProducts,
    isFeatured,
    initiallyFeatured: initialValues?.is_featured ?? false,
  })

  const margin = marginPercent(priceCents, costCents)

  const submit = form.handleSubmit(async (values) => {
    const finalValues = isEditing
      ? values
      : { ...values, is_active: submitModeRef.current === 'publish' }
    await onSubmit(finalValues)
    form.reset(finalValues)
  })

  const handlePublish = async () => {
    submitModeRef.current = 'publish'
    const isValid = await form.trigger()
    if (!isValid) {
      setMissingFieldsModalOpen(true)
      return
    }
    submit()
  }

  const handleDraftAndNavigate = async () => {
    submitModeRef.current = 'draft'
    await form.handleSubmit(async (values) => {
      await onSubmit({ ...values, is_active: false })
      navigate(ROUTES.dashboard)
    })()
    setHomeModalOpen(false)
  }

  const coverImage = images[0]
  const remainingChars = 120 - name.length

  useEffect(() => {
    if (justPublished) {
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.65 } })
    }
  }, [justPublished])

  useEffect(() => {
    if (newCategoryModalOpen) {
      setTimeout(() => newCategoryInputRef.current?.focus(), 50)
    }
  }, [newCategoryModalOpen])

  useEffect(() => {
    if (newSubcategoryModalOpen) {
      setTimeout(() => newSubcategoryInputRef.current?.focus(), 50)
    }
  }, [newSubcategoryModalOpen])

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    const cat = await createCategoryMutation.mutateAsync({
      store_id: storeId,
      name: newCategoryName.trim(),
    })
    form.setValue('category', cat.name, { shouldDirty: true })
    form.setValue('subcategory', undefined, { shouldDirty: true })
    setNewCategoryModalOpen(false)
    setNewCategoryName('')
  }

  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategoryObj) return
    const sub = await createCategoryMutation.mutateAsync({
      store_id: storeId,
      name: newSubcategoryName.trim(),
      parent_id: selectedCategoryObj.id,
    })
    form.setValue('subcategory', sub.name, { shouldDirty: true })
    setNewSubcategoryModalOpen(false)
    setNewSubcategoryName('')
  }

  return (
    <form onSubmit={submit} className="flex flex-col pb-20">
      {/* Product header — hidden on xl where the card preview replaces it */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-z-border bg-white p-4 xl:hidden">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-z-border bg-z-bg">
          {coverImage ? (
            <img src={coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-z-text-hint">
              <HugeiconsIcon icon={ImageIcon} size={24} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-z-text">
            {name || 'Novo produto'}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
            {priceCents > 0 && (
              <span className="text-z-text-muted">
                Preço{' '}
                <strong className="text-rose-500">{formatMoney(priceCents)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab + content area */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:gap-4 xl:gap-6">
        {/* Tabs — single row on mobile, vertical sidebar on desktop */}
        <nav className="grid w-full grid-cols-4 gap-1 sticky top-14 z-10 self-start rounded-2xl border border-z-border bg-white/70 p-1.5 shadow-sm backdrop-blur-md lg:static lg:flex lg:w-48 lg:shrink-0 lg:flex-col lg:gap-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition-colors',
                'lg:flex-row lg:w-full lg:gap-2 lg:px-4 lg:py-2.5 lg:text-sm lg:text-left',
                activeTab === tab.id
                  ? 'bg-z-text text-white'
                  : 'text-z-text-muted hover:bg-z-bg2 hover:text-z-text',
              )}
            >
              <HugeiconsIcon icon={tab.icon} size={15} className="shrink-0" />
              <span className="lg:hidden">{tab.shortLabel}</span>
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="min-w-0 flex-1 rounded-2xl border border-z-border bg-white p-4 lg:p-6">
          {/* ─── INFORMAÇÕES GERAIS ─── */}
          {activeTab === 'info' && (
            <div className="flex flex-col gap-8">
              {/* Título e descrição */}
              <section>
                <h3 className="mb-4 font-semibold text-z-text">Título e descrição</h3>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-z-text-hint">
                        Título
                        <HugeiconsIcon
                          icon={InformationCircleIcon}
                          size={12}
                          className="ml-1 inline text-z-text-hint"
                        />
                      </label>
                      <span
                        className={cn(
                          'text-xs',
                          remainingChars < 20 ? 'text-amber-500' : 'text-z-text-hint',
                        )}
                      >
                        {remainingChars} caracteres restantes
                      </span>
                    </div>
                    <input
                      maxLength={120}
                      placeholder="Ex: Camiseta básica algodão"
                      className={cn(
                        'h-11 w-full rounded-lg border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:outline-none focus:ring-2',
                        form.formState.errors.name
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                          : 'border-z-border focus:border-z-green focus:ring-z-green/20',
                      )}
                      {...form.register('name')}
                    />
                    {form.formState.errors.name && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.name.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Descrição
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <Controller
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <ProductRichTextEditor
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder="Conte algo sobre o produto..."
                        />
                      )}
                    />
                    <span className="text-right text-xs text-z-text-hint">
                      {10000 - (form.watch('description')?.length ?? 0)} caracteres restantes
                    </span>
                    {form.formState.errors.description && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.description.message}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Categoria e subcategoria */}
              <section className="border-t border-z-border pt-6">
                <h3 className="mb-4 font-semibold text-z-text">
                  Categoria e subcategoria
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Categoria
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm text-z-text focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      value={selectedCategory ?? ''}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_CATEGORY__') {
                          setNewCategoryModalOpen(true)
                          return
                        }
                        handleCategoryChange(e.target.value)
                      }}
                    >
                      <option value="">Selecione...</option>
                      {selectedCategory &&
                        !topLevelCategories.some(
                          (cat) => cat.name === selectedCategory,
                        ) && (
                          <option value={selectedCategory}>{selectedCategory}</option>
                        )}
                      {topLevelCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="__ADD_CATEGORY__">+ Criar nova categoria</option>
                    </select>
                    {form.formState.errors.category && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.category.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Subcategoria
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm text-z-text focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 disabled:bg-z-bg disabled:text-z-text-hint"
                      value={selectedSubcategory ?? ''}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_SUBCATEGORY__') {
                          setNewSubcategoryModalOpen(true)
                          return
                        }
                        form.setValue('subcategory', e.target.value || undefined, { shouldDirty: true })
                      }}
                      disabled={!selectedCategory}
                    >
                      <option value="">Selecione...</option>
                      {selectedSubcategory &&
                        !availableSubcategories.some(
                          (sub) => sub.name === selectedSubcategory,
                        ) && (
                          <option value={selectedSubcategory}>
                            {selectedSubcategory}
                          </option>
                        )}
                      {availableSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                      {selectedCategory && (
                        <option value="__ADD_SUBCATEGORY__">+ Criar nova subcategoria</option>
                      )}
                    </select>
                    {form.formState.errors.subcategory && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.subcategory.message}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Códigos de identificação */}
              <section className="border-t border-z-border pt-6">
                <h3 className="mb-4 font-semibold text-z-text">
                  Códigos de identificação
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Tipo de código de barras
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm text-z-text focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      {...form.register('barcode_type')}
                    >
                      {BARCODE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Código de barras
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <input
                      placeholder="Código de barras do produto"
                      disabled={!hasBarcodeType}
                      className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 disabled:bg-z-bg disabled:text-z-text-hint"
                      {...form.register('barcode')}
                    />
                    {form.formState.errors.barcode && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.barcode.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Código interno (SKU)
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <input
                      placeholder="Seu código interno (SKU)"
                      disabled={autoSku}
                      value={autoSku ? '(gerado automaticamente)' : undefined}
                      className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 disabled:bg-z-bg disabled:italic disabled:text-z-text-hint"
                      {...(autoSku ? {} : form.register('sku'))}
                    />
                    <Controller
                      control={form.control}
                      name="auto_sku"
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-z-text-muted">
                          <button
                            type="button"
                            onClick={() => field.onChange(!field.value)}
                            className="text-z-green"
                          >
                            <HugeiconsIcon
                              icon={field.value ? ToggleOnIcon : ToggleOffIcon}
                              size={22}
                              className={field.value ? 'text-z-green' : 'text-z-text-hint'}
                            />
                          </button>
                          Gerar automaticamente
                        </label>
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Especificações */}
              <section className="border-t border-z-border pt-6">
                <h3 className="mb-4 font-semibold text-z-text">Especificações</h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Condição do produto
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm text-z-text focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      {...form.register('condition')}
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Unidade
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm text-z-text focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      {...form.register('unit')}
                    >
                      <option value="">Selecione...</option>
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Recorrência de compra
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm text-z-text focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      {...form.register('purchase_recurrence')}
                    >
                      {RECURRENCES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-z-text-hint">
                    Marca
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      size={12}
                      className="ml-1 inline text-z-text-hint"
                    />
                  </label>
                  <input
                    placeholder="Ex: Nike, Apple, Samsung..."
                    disabled={hasNoBrand}
                    className="h-11 max-w-xs rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 disabled:bg-z-bg disabled:text-z-text-hint"
                    {...form.register('brand')}
                  />
                  {form.formState.errors.brand && (
                    <span className="text-xs text-destructive">
                      {form.formState.errors.brand.message}
                    </span>
                  )}
                  <Controller
                    control={form.control}
                    name="has_no_brand"
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-z-text-muted">
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className="text-z-green"
                        >
                          <HugeiconsIcon
                            icon={field.value ? ToggleOnIcon : ToggleOffIcon}
                            size={22}
                            className={field.value ? 'text-z-green' : 'text-z-text-hint'}
                          />
                        </button>
                        Não possui marca ou é um kit
                      </label>
                    )}
                  />
                </div>
              </section>

              {/* Produto ativo */}
              <section className="border-t border-z-border pt-6">
                <Controller
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                      >
                        <HugeiconsIcon
                          icon={field.value ? ToggleOnIcon : ToggleOffIcon}
                          size={28}
                          className={field.value ? 'text-z-green' : 'text-z-text-hint'}
                        />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-z-text">Produto ativo</p>
                        <p className="text-xs text-z-text-muted">Visível no catálogo</p>
                      </div>
                    </label>
                  )}
                />
              </section>

              {/* Produto em destaque — plano Ilimitado */}
              {planLimits.canUse('featured') && (
                <section className="border-t border-z-border pt-6">
                  <Controller
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <div className="flex items-center justify-between gap-3">
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-3',
                            !canEnableFeatured && 'cursor-not-allowed opacity-50',
                          )}
                        >
                          <button
                            type="button"
                            disabled={!canEnableFeatured && !field.value}
                            onClick={() => {
                              if (!canEnableFeatured && !field.value) return
                              field.onChange(!field.value)
                            }}
                          >
                            <HugeiconsIcon
                              icon={field.value ? ToggleOnIcon : ToggleOffIcon}
                              size={28}
                              className={field.value ? 'text-amber-500' : 'text-z-text-hint'}
                            />
                          </button>
                          <div>
                            <p className="text-sm font-medium text-z-text">Produto em destaque</p>
                            <p className="text-xs text-z-text-muted">
                              {!canEnableFeatured && !field.value
                                ? 'Limite de 4 destaques atingido'
                                : 'Aparece na seção de destaques do catálogo'}
                            </p>
                          </div>
                        </label>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                            displayedFeaturedCount >= MAX_FEATURED_PRODUCTS
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-z-bg2 text-z-text-muted',
                          )}
                        >
                          {displayedFeaturedCount}/{MAX_FEATURED_PRODUCTS} destaques
                        </span>
                      </div>
                    )}
                  />
                </section>
              )}
            </div>
          )}

          {/* ─── ESTOQUE E VARIAÇÕES ─── */}
          {activeTab === 'stock' && (
            <div className="flex flex-col gap-6">
              {/* Has variations */}
              <section>
                <p className="mb-3 font-medium text-z-text">
                  Este produto possui variações?
                </p>
                <Controller
                  control={form.control}
                  name="has_variations"
                  render={({ field }) => (
                    <div className="flex gap-4">
                      {[
                        { label: 'Não', value: false },
                        { label: 'Sim', value: true },
                      ].map((opt) => (
                        <label
                          key={String(opt.value)}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
                              field.value === opt.value
                                ? 'border-z-green bg-z-green'
                                : 'border-z-border',
                            )}
                          >
                            {field.value === opt.value && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className="font-medium text-z-text"
                          >
                            {opt.label}
                          </button>
                        </label>
                      ))}
                    </div>
                  )}
                />
              </section>

              {!hasVariations && (
                <section className="border-t border-z-border pt-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Estoque
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Em branco = ilimitado"
                      className="h-11 max-w-xs rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      {...form.register('stock', {
                        setValueAs: (v) =>
                          v === '' || v === null || v === undefined ? null : Number(v),
                      })}
                    />
                    {form.formState.errors.stock && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.stock.message}
                      </span>
                    )}
                    <span className="text-xs text-z-text-hint">
                      Opcional — deixe em branco para ilimitado
                    </span>
                  </div>
                </section>
              )}

              {hasVariations && (
                <section className="border-t border-z-border pt-6">
                  <p className="mb-3 font-medium text-z-text">
                    Qual é o tipo de variação principal deste produto?
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { type: 'color' as VariationType, label: 'Cor', icon: ColorPickerIcon },
                      { type: 'size' as VariationType, label: 'Tamanho', icon: RulerIcon },
                      { type: 'other' as VariationType, label: 'Outro tipo', icon: Settings01Icon },
                    ].map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setVariationModalOpen(true)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                          variationType === opt.type
                            ? 'border-z-green bg-z-green/10 text-z-green'
                            : 'border-z-border text-z-text-muted hover:border-z-text hover:text-z-text',
                        )}
                      >
                        <HugeiconsIcon icon={opt.icon} size={16} />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {variationType && variationOptions && variationOptions.length > 0 && (
                    <div className="mt-4 rounded-xl border border-z-border bg-z-bg p-4">
                      <p className="mb-2 text-xs font-semibold text-z-text-hint">
                        {variationLabel} configurado
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {variationOptions.map((opt) => (
                          <span
                            key={opt.name}
                            className="inline-flex items-center gap-2 rounded-lg border border-z-border bg-white px-2.5 py-1 text-sm text-z-text"
                          >
                            {opt.name}
                            <span className="text-xs text-z-text-hint">
                              · {opt.stock == null ? 'ilimitado' : `${opt.stock} un.`}
                            </span>
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setVariationModalOpen(true)}
                        className="mt-3 text-xs font-medium text-z-green hover:underline"
                      >
                        Editar variação
                      </button>
                    </div>
                  )}

                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <HugeiconsIcon
                      icon={AlertCircleIcon}
                      size={16}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />
                    <p className="text-sm text-amber-800">
                      Atenção: O estoque passará a ser gerenciado por variação do produto
                    </p>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ─── FOTOS ─── */}
          {activeTab === 'photos' && (
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-z-text">Fotos principais do produto</h3>

              <ProductImagesUploader
                storeId={storeId}
                value={images}
                max={10}
                onChange={(urls) =>
                  form.setValue('images', urls, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />

              {form.formState.errors.images && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.images.message as string}
                </span>
              )}

              {hasVariations && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <HugeiconsIcon
                    icon={AlertCircleIcon}
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <p className="text-sm text-amber-800">
                    Essas são as fotos principais do produto. Você também pode definir fotos
                    específicas por variação se necessário.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── PREÇO ─── */}
          {activeTab === 'price' && (
            <div className="flex flex-col gap-6">
              <h3 className="font-semibold text-z-text">Preço do produto</h3>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-z-text-hint">
                    Preço
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      size={12}
                      className="ml-1 inline text-z-text-hint"
                    />
                  </label>
                  <MoneyInput
                    valueInCents={initialValues?.price_in_cents ?? null}
                    placeholder="R$ 0,00"
                    className={cn(
                      'h-12 max-w-sm rounded-lg border bg-white px-3.5 text-base placeholder:text-z-text-hint focus:outline-none focus:ring-2',
                      form.formState.errors.price_in_cents
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                        : 'border-z-border focus:border-z-green focus:ring-z-green/20',
                    )}
                    onChange={(cents) =>
                      form.setValue('price_in_cents', cents ?? 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                  {form.formState.errors.price_in_cents && (
                    <span className="text-xs text-destructive">
                      {form.formState.errors.price_in_cents.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Preço de custo
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <MoneyInput
                      valueInCents={initialValues?.cost_in_cents ?? null}
                      allowEmpty
                      placeholder="R$ 0,00"
                      className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      onChange={(cents) =>
                        form.setValue('cost_in_cents', cents, { shouldDirty: true })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-z-text-hint">
                      Margem de lucro
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={12}
                        className="ml-1 inline text-z-text-hint"
                      />
                    </label>
                    <div className="flex h-11 w-full items-center rounded-lg border border-z-border bg-z-bg px-3.5 text-sm text-z-text-muted">
                      {margin != null ? (
                        <span className={cn(margin < 0 ? 'text-rose-500' : 'text-z-text')}>
                          {margin.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-z-text-hint">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-z-text-hint">
                    Preço promocional
                  </label>
                  <MoneyInput
                    valueInCents={initialValues?.promo_price_in_cents ?? null}
                    allowEmpty
                    placeholder="Em branco = sem promoção"
                    className="h-11 max-w-sm rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                    onChange={(cents) =>
                      form.setValue('promo_price_in_cents', cents, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                  {form.formState.errors.promo_price_in_cents ? (
                    <span className="text-xs text-destructive">
                      {form.formState.errors.promo_price_in_cents.message}
                    </span>
                  ) : promoCents != null && priceCents > 0 ? (
                    <span className="text-xs text-z-text-muted">
                      <strong className="text-z-green">
                        -{Math.round((1 - promoCents / priceCents) * 100)}%
                      </strong>{' '}
                      de desconto · {formatMoney(promoCents)}
                    </span>
                  ) : (
                    <span className="text-xs text-z-text-hint">Opcional</span>
                  )}
                </div>

                {/* Parcelamento */}
                <div className="flex flex-col gap-3 rounded-xl border border-z-border bg-z-bg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-z-text">Parcelamento</p>
                      <p className="text-xs text-z-text-muted">
                        Exibe opção de parcelamento no catálogo
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (installmentCount != null) {
                          form.setValue('installment_count', null, { shouldDirty: true })
                          form.setValue('installment_total_in_cents', null, { shouldDirty: true })
                        } else {
                          form.setValue('installment_count', 2, { shouldDirty: true })
                          form.setValue('installment_total_in_cents', promoCents ?? priceCents ?? null, { shouldDirty: true })
                        }
                      }}
                      className="shrink-0"
                    >
                      <HugeiconsIcon
                        icon={installmentCount != null ? ToggleOnIcon : ToggleOffIcon}
                        size={28}
                        className={installmentCount != null ? 'text-z-green' : 'text-z-text-hint'}
                      />
                    </button>
                  </div>

                  {installmentCount != null && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-z-text-hint">
                            Valor parcelado
                          </label>
                          <MoneyInput
                            valueInCents={installmentTotal}
                            allowEmpty
                            placeholder="R$ 0,00"
                            className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                            onChange={(cents) =>
                              form.setValue('installment_total_in_cents', cents, { shouldDirty: true })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-z-text-hint">
                            Em até
                          </label>
                          <select
                            value={installmentCount ?? 2}
                            onChange={(e) =>
                              form.setValue('installment_count', Number(e.target.value), { shouldDirty: true })
                            }
                            className="h-11 w-full rounded-lg border border-z-border bg-white px-3 text-sm focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                          >
                            {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                              <option key={n} value={n}>{n}x</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Preview */}
                      {priceCents > 0 && installmentCount != null && installmentTotal != null && (
                        <div className="rounded-xl border border-z-border bg-white p-4">
                          <p className="mb-2 text-[10px] font-semibold text-z-text-hint">
                            Preview no catálogo
                          </p>
                          <div className="flex flex-col gap-0.5">
                            {promoCents != null && promoCents < priceCents && (
                              <span className="text-sm text-z-text-hint line-through">
                                {formatMoney(priceCents)}
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-z-ink">
                                {formatMoney(promoCents ?? priceCents)}
                              </span>
                              {promoCents != null && promoCents < priceCents && (
                                <span className="rounded-full bg-[#e6f7ef] px-2 py-0.5 text-[11px] font-bold text-[#02a650]">
                                  {Math.round((1 - promoCents / priceCents) * 100)}% OFF
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-z-text-muted">
                              ou{' '}
                              <strong className="text-z-text">
                                {installmentCount}x de {formatMoney(Math.ceil(installmentTotal / installmentCount))}
                              </strong>
                              {installmentTotal <= (promoCents ?? priceCents) && (
                                <span className="text-[#02a650]"> sem juros</span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card preview — sticky right column, visible on xl+ */}
        <div className="hidden xl:block xl:w-64 xl:shrink-0">
          <div className="sticky top-14 flex flex-col gap-3">
            <p className="text-[11px] font-semibold text-z-text-hint">
              Preview do card
            </p>
            <div className="overflow-hidden rounded-2xl border border-z-border bg-white shadow-sm">
              {/* Product image */}
              <div className="relative aspect-square w-full overflow-hidden bg-z-bg">
                {coverImage ? (
                  <img src={coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-z-text-hint">
                    <HugeiconsIcon icon={ImageIcon} size={32} />
                    <span className="text-xs">Sem foto</span>
                  </div>
                )}
                {promoCents != null && priceCents > 0 && promoCents < priceCents && (
                  <span className="absolute right-2 top-2 rounded-full bg-[#02a650] px-2 py-0.5 text-[11px] font-bold text-white">
                    -{Math.round((1 - promoCents / priceCents) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="line-clamp-2 min-h-[2.5em] text-[15px] font-bold leading-tight tracking-tight text-z-ink">
                  {name || <span className="text-z-text-hint">Nome do produto</span>}
                </p>

                <div className="mt-2 flex flex-col gap-0.5">
                  {promoCents != null && priceCents > 0 && promoCents < priceCents && (
                    <span className="text-[11px] text-z-text-hint line-through">
                      {formatMoney(priceCents)}
                    </span>
                  )}
                  <span className="text-[17px] font-bold text-z-ink">
                    {priceCents > 0
                      ? formatMoney(promoCents ?? priceCents)
                      : <span className="text-z-text-hint text-sm font-normal">Sem preço</span>
                    }
                  </span>
                  {installmentCount != null && installmentTotal != null && installmentTotal > 0 && (
                    <span className="text-[11px] text-z-text-muted">
                      {installmentCount}x de {formatMoney(Math.ceil(installmentTotal / installmentCount))}
                      {installmentTotal <= (promoCents ?? priceCents) && (
                        <span className="text-[#02a650]"> sem juros</span>
                      )}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-z-text text-[12px] font-bold text-white">
                  Adicionar ao pedido
                </div>
              </div>
            </div>

            <p className="text-center text-[10px] text-z-text-hint">
              Aparência aproximada no catálogo
            </p>
          </div>
        </div>
      </div>

      {/* Bottom action bar - fixed */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-z-border bg-white px-4 py-3 shadow-lg md:px-6 lg:left-[240px]">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
          {!isEditing ? (
            <>
              {/* Home button */}
              <button
                type="button"
                onClick={() => setHomeModalOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-z-border text-z-text-muted transition-colors hover:bg-z-bg hover:text-z-text"
                title="Ir para o início"
              >
                <HugeiconsIcon icon={Home01Icon} size={18} />
              </button>

              {/* Draft + Publish */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    submitModeRef.current = 'draft'
                    submit()
                  }}
                  className="rounded-xl border border-z-border px-4 py-2.5 text-sm font-medium text-z-text-muted transition-colors hover:bg-z-bg hover:text-z-text disabled:opacity-60"
                >
                  Salvar rascunho
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePublish}
                  className="flex items-center gap-2 rounded-xl bg-z-green px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-green-600 disabled:opacity-60"
                >
                  {isSubmitting && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {isSubmitting ? 'Salvando...' : 'Publicar'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Ver produto */}
              {catalogUrl && (
                <a
                  href={catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-z-border px-5 py-2.5 text-sm font-medium text-z-text-muted transition-colors hover:bg-z-bg hover:text-z-text"
                >
                  <HugeiconsIcon icon={ShoppingCart01Icon} size={16} />
                  Ver produto
                </a>
              )}
              {/* Salvar alterações */}
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="rounded-xl bg-z-green px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-green-600 disabled:opacity-60"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Home / exit modal */}
      {homeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 font-semibold text-z-text">Sair do cadastro?</h3>
            <p className="mb-5 text-sm text-z-text-muted">
              O produto ainda não foi salvo. Deseja salvar como rascunho antes de sair?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDraftAndNavigate}
                className="rounded-xl bg-z-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar rascunho e sair'}
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.dashboard)}
                className="rounded-xl border border-z-border px-4 py-2.5 text-sm font-medium text-z-text-muted hover:bg-z-bg"
              >
                Sair sem salvar
              </button>
              <button
                type="button"
                onClick={() => setHomeModalOpen(false)}
                className="py-1 text-sm text-z-text-hint hover:text-z-text"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New subcategory modal */}
      {newSubcategoryModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNewSubcategoryModalOpen(false)
              setNewSubcategoryName('')
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 font-semibold text-z-text">Nova subcategoria</h3>
            <p className="mb-4 text-sm text-z-text-muted">
              Será criada dentro de <strong>{selectedCategory}</strong>.
            </p>
            <div className="flex flex-col gap-3">
              <input
                ref={newSubcategoryInputRef}
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Nome da subcategoria"
                maxLength={60}
                className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSubcategory()
                  if (e.key === 'Escape') {
                    setNewSubcategoryModalOpen(false)
                    setNewSubcategoryName('')
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewSubcategoryModalOpen(false)
                    setNewSubcategoryName('')
                  }}
                  className="flex-1 rounded-xl border border-z-border px-4 py-2.5 text-sm font-medium text-z-text-muted hover:bg-z-bg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateSubcategory}
                  disabled={!newSubcategoryName.trim() || createCategoryMutation.isPending}
                  className="flex-1 rounded-xl bg-z-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
                >
                  {createCategoryMutation.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missing fields modal */}
      {missingFieldsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <HugeiconsIcon icon={AlertCircleIcon} size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-z-text">Campos obrigatórios</h3>
                <p className="text-sm text-z-text-muted">Preencha as informações abaixo para publicar</p>
              </div>
            </div>
            <ul className="mb-5 flex flex-col gap-2">
              {Object.entries(form.formState.errors)
                .filter(([key]) => key in (FIELD_TAB_MAP as Record<string, unknown>))
                .map(([key, error]) => {
                  const fieldInfo = FIELD_TAB_MAP[key]
                  if (!fieldInfo) return null
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-z-text">{fieldInfo.label}</p>
                        <p className="truncate text-xs text-red-600">
                          {(error as { message?: string })?.message ?? 'Campo inválido'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(fieldInfo.tab)
                          setMissingFieldsModalOpen(false)
                        }}
                        className="ml-3 shrink-0 text-xs font-semibold text-z-green hover:underline"
                      >
                        Adicionar
                      </button>
                    </li>
                  )
                })}
            </ul>
            <button
              type="button"
              onClick={() => setMissingFieldsModalOpen(false)}
              className="w-full rounded-xl border border-z-border px-4 py-2.5 text-sm font-medium text-z-text-muted hover:bg-z-bg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Variation modal */}
      <ProductVariationModal
        open={variationModalOpen}
        productName={name}
        productStock={form.watch('stock') ?? null}
        initialType={variationType ?? null}
        initialLabel={variationLabel ?? null}
        initialOptions={variationOptions ?? null}
        onSave={(type, label, options) => {
          form.setValue('variation_type', type, { shouldDirty: true })
          form.setValue('variation_label', label, { shouldDirty: true })
          form.setValue('variation_options', options, { shouldDirty: true })
        }}
        onClose={() => setVariationModalOpen(false)}
      />

      {/* New category modal */}
      {newCategoryModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNewCategoryModalOpen(false)
              setNewCategoryName('')
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 font-semibold text-z-text">Nova categoria</h3>
            <p className="mb-4 text-sm text-z-text-muted">
              A categoria ficará disponível em todos os seus produtos.
            </p>
            <div className="flex flex-col gap-3">
              <input
                ref={newCategoryInputRef}
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da categoria"
                maxLength={60}
                className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCategory()
                  if (e.key === 'Escape') {
                    setNewCategoryModalOpen(false)
                    setNewCategoryName('')
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewCategoryModalOpen(false)
                    setNewCategoryName('')
                  }}
                  className="flex-1 rounded-xl border border-z-border px-4 py-2.5 text-sm font-medium text-z-text-muted hover:bg-z-bg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                  className="flex-1 rounded-xl bg-z-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
                >
                  {createCategoryMutation.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
